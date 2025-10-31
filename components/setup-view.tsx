"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Home, Plus, Trash2, Users, Shuffle, AlertCircle, RefreshCw, Copy, Save, Download } from "lucide-react"
import type { House, Person, Assignment } from "@/app/page"
import { toast } from "@/hooks/use-toast"

type SetupViewProps = {
  houses: House[]
  setHouses: (houses: House[]) => void
  people: Person[]
  setPeople: (people: Person[]) => void
  assignments: Assignment[]
  setAssignments: (assignments: Assignment[]) => void
  isDrawComplete: boolean
  setIsDrawComplete: (complete: boolean) => void
}

export function SetupView({
  houses,
  setHouses,
  people,
  setPeople,
  assignments,
  setAssignments,
  isDrawComplete,
  setIsDrawComplete,
}: SetupViewProps) {
  const [newHouseName, setNewHouseName] = useState("")
  const [newPersonName, setNewPersonName] = useState("")
  const [selectedHouseId, setSelectedHouseId] = useState("")
  const [error, setError] = useState("")
  const [creatingLink, setCreatingLink] = useState(false)
  const [sessionUrl, setSessionUrl] = useState<string | null>(null)
  const [configName, setConfigName] = useState("")
  const [savingConfig, setSavingConfig] = useState(false)
  const [loadConfigId, setLoadConfigId] = useState("")
  const [kvEnabled, setKvEnabled] = useState<boolean | null>(null)
  const [localConfigs, setLocalConfigs] = useState<
    { id: string; name?: string; createdAt: number; houses: House[]; people: Person[] }[]
  >([])

  // Helper to access localStorage list
  const readLocalConfigs = (): typeof localConfigs => {
    try {
      const raw = localStorage.getItem("amigo:configs")
      if (!raw) return []
      const arr = JSON.parse(raw) as typeof localConfigs
      return Array.isArray(arr) ? arr : []
    } catch {
      return []
    }
  }

  const writeLocalConfigs = (arr: typeof localConfigs) => {
    localStorage.setItem("amigo:configs", JSON.stringify(arr))
  }

  useEffect(() => {
    // detect KV once
    ;(async () => {
      try {
        const res = await fetch("/api/kv-status")
        const data = (await res.json()) as { enabled: boolean }
        setKvEnabled(Boolean(data.enabled))
      } catch {
        setKvEnabled(null)
      }
    })()
    // load local config list
    setLocalConfigs(readLocalConfigs())
  }, [])

  const addHouse = () => {
    if (!newHouseName.trim()) return
    const newHouse: House = {
      id: Date.now().toString(),
      name: newHouseName.trim(),
    }
    setHouses([...houses, newHouse])
    setNewHouseName("")
    if (!selectedHouseId) {
      setSelectedHouseId(newHouse.id)
    }
  }

  const removeHouse = (houseId: string) => {
    setHouses(houses.filter((h) => h.id !== houseId))
    setPeople(people.filter((p) => p.houseId !== houseId))
    if (selectedHouseId === houseId) {
      setSelectedHouseId(houses[0]?.id || "")
    }
  }

  const addPerson = () => {
    if (!newPersonName.trim() || !selectedHouseId) return
    const newPerson: Person = {
      id: Date.now().toString(),
      name: newPersonName.trim(),
      houseId: selectedHouseId,
    }
    setPeople([...people, newPerson])
    setNewPersonName("")
  }

  const removePerson = (personId: string) => {
    setPeople(people.filter((p) => p.id !== personId))
  }

  const performDraw = () => {
    setError("")

    if (people.length < 2) {
      setError("Se necesitan al menos 2 personas para hacer el sorteo")
      return
    }

    // Check if draw is possible
    const houseCounts = new Map<string, number>()
    people.forEach((person) => {
      houseCounts.set(person.houseId, (houseCounts.get(person.houseId) || 0) + 1)
    })

    // If there's only one house with all people, draw is impossible
    if (houseCounts.size === 1) {
      setError("No se puede hacer el sorteo: todas las personas viven en la misma casa")
      return
    }

    // Try to create valid assignments using a backtracking algorithm
    const newAssignments = createValidAssignments(people)

    if (newAssignments.length === 0) {
      setError("No se pudo encontrar una combinación válida. Intenta reorganizar las casas.")
      return
    }

    setAssignments(newAssignments)
    setIsDrawComplete(true)
  }

  const resetDraw = () => {
    setAssignments([])
    setIsDrawComplete(false)
    setError("")
  }

  const createShareLink = async () => {
    setError("")
    setSessionUrl(null)
    if (people.length < 2) {
      setError("Agrega al menos 2 participantes para crear el enlace")
      return
    }
    try {
      setCreatingLink(true)
      // Comprobar si KV está configurado (necesario en Vercel)
      try {
        const kv = await fetch("/api/kv-status").then((r) => r.json() as Promise<{ enabled: boolean }>)
        const hostname = typeof window !== "undefined" ? window.location.hostname : ""
        const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1"
        if (!kv.enabled && !isLocalHost) {
          setError(
            "No hay base de datos configurada para la sesión. En Vercel debes configurar Vercel KV (KV_REST_API_URL/KV_REST_API_TOKEN).",
          )
          return
        }
        if (!kv.enabled && isLocalHost) {
          toast({
            title: "Enlace local (sin persistencia)",
            description: "Funciona en tu máquina, pero en Vercel necesitas configurar KV.",
          })
        }
      } catch {
        // si falla el check, continuamos (modo local)
      }
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ houses, people }),
      })
      if (!res.ok) throw new Error("No se pudo crear la sesión")
      const data = (await res.json()) as { id: string }
      const origin = typeof window !== "undefined" ? window.location.origin : ""
      const url = `${origin}/s/${data.id}`
      setSessionUrl(url)
      toast({ title: "Enlace creado", description: "Listo para compartir" })
    } catch (e: any) {
      setError(e.message || "Error creando el enlace")
    } finally {
      setCreatingLink(false)
    }
  }

  const saveConfiguration = async () => {
    setError("")
    if (houses.length === 0 || people.length < 2) {
      setError("Agrega al menos 1 casa y 2 participantes")
      return
    }
    try {
      setSavingConfig(true)
      // If KV is enabled, save server-side to get a shareable id
      if (kvEnabled) {
        const res = await fetch("/api/configs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: configName, houses, people }),
        })
        if (!res.ok) throw new Error("No se pudo guardar la configuración")
        const data = (await res.json()) as { id: string }
        toast({
          title: "Configuración guardada",
          description: `ID: ${data.id}`,
        })
        setLoadConfigId(data.id)
        // Also store a local reference for convenience
        const list = readLocalConfigs()
        list.unshift({ id: data.id, name: configName || undefined, createdAt: Date.now(), houses, people })
        writeLocalConfigs(list.slice(0, 10))
        setLocalConfigs(list.slice(0, 10))
      } else {
        // Local fallback only on this device
        const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
        const entry = { id, name: configName || undefined, createdAt: Date.now(), houses, people }
        const list = readLocalConfigs()
        list.unshift(entry)
        writeLocalConfigs(list.slice(0, 20))
        setLocalConfigs(list.slice(0, 20))
        setLoadConfigId(id)
        toast({ title: "Configuración guardada (local)", description: "Solo disponible en este dispositivo" })
      }
    } catch (e: any) {
      setError(e.message || "Error guardando la configuración")
    } finally {
      setSavingConfig(false)
    }
  }

  const loadConfiguration = async (id: string) => {
    setError("")
    if (!id.trim()) return
    try {
      if (kvEnabled) {
        const res = await fetch(`/api/configs/${encodeURIComponent(id.trim())}`)
        if (!res.ok) throw new Error("No se encontró la configuración")
        const data = (await res.json()) as {
          id: string
          name?: string
          houses: House[]
          people: Person[]
        }
        setHouses(data.houses)
        setPeople(data.people)
        setAssignments([])
        setIsDrawComplete(false)
        toast({ title: "Configuración cargada", description: data.name || id })
      } else {
        const entry = readLocalConfigs().find((c) => c.id === id.trim())
        if (!entry) throw new Error("No se encontró localmente")
        setHouses(entry.houses)
        setPeople(entry.people)
        setAssignments([])
        setIsDrawComplete(false)
        toast({ title: "Configuración cargada", description: entry.name || id })
      }
    } catch (e: any) {
      setError(e.message || "Error cargando la configuración")
    }
  }

  return (
    <div className="space-y-6">
      {/* Config Section */}
      <Card className="border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Save className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-foreground text-xl">Configuración</h2>
          </div>
          <div className="text-xs text-muted-foreground">
            {kvEnabled === null ? "Comprobando almacenamiento..." : kvEnabled ? "Guardado en la nube (KV)" : "Guardado local"}
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-[1fr_auto]">
          <Input
            placeholder="Nombre opcional (ej: Navidad 2025)"
            value={configName}
            onChange={(e) => setConfigName(e.target.value)}
          />
          <Button onClick={saveConfiguration} disabled={savingConfig || people.length < 2} className="bg-primary">
            <Save className="mr-2 h-4 w-4" /> Guardar configuración
          </Button>
        </div>

        <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]"><Input
            placeholder="ID de configuración"
            value={loadConfigId}
            onChange={(e) => setLoadConfigId(e.target.value)}
          />
          <Button
            onClick={() => loadConfiguration(loadConfigId)}
            variant="outline"
            className="border-border"
          >
            <Download className="mr-2 h-4 w-4" /> Cargar configuración
          </Button>
        </div>

        {localConfigs.length > 0 && (
          <div className="mt-3 text-xs text-muted-foreground">
            <div className="mb-1">Guardadas localmente:</div>
            <div className="flex flex-wrap gap-2">
              {localConfigs.slice(0, 6).map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setLoadConfigId(c.id)
                    void loadConfiguration(c.id)
                  }}
                  className="rounded-md border border-border bg-background px-2 py-1 hover:bg-muted"
                  title={c.id}
                >
                  {c.name || new Date(c.createdAt).toLocaleString()}
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Houses Section */}
      <Card className="border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Home className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-foreground text-xl">Casas</h2>
        </div>

        <div className="mb-4 flex gap-2">
          <Input
            placeholder="Nombre de la casa (ej: Casa García)"
            value={newHouseName}
            onChange={(e) => setNewHouseName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addHouse()}
            className="flex-1"
          />
          <Button onClick={addHouse} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          {houses.map((house) => (
            <div
              key={house.id}
              className="flex items-center justify-between rounded-lg border border-border bg-background p-3"
            >
              <span className="font-medium text-foreground">{house.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeHouse(house.id)}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* People Section */}
      <Card className="border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-secondary" />
          <h2 className="font-semibold text-foreground text-xl">Participantes</h2>
        </div>

        <div className="mb-4 flex flex-col gap-2 md:flex-row">
          <Input
            placeholder="Nombre de la persona"
            value={newPersonName}
            onChange={(e) => setNewPersonName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addPerson()}
            className="flex-1"
          />
          <select
            value={selectedHouseId}
            onChange={(e) => setSelectedHouseId(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-foreground"
            disabled={houses.length === 0}
          >
            <option value="">Seleccionar casa</option>
            {houses.map((house) => (
              <option key={house.id} value={house.id}>
                {house.name}
              </option>
            ))}
          </select>
          <Button onClick={addPerson} disabled={!selectedHouseId} className="bg-secondary hover:bg-secondary/90">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          {houses.map((house) => {
            const housePeople = people.filter((p) => p.houseId === house.id)
            if (housePeople.length === 0) return null

            return (
              <div key={house.id} className="rounded-lg border border-border bg-background p-3">
                <div className="mb-2 font-medium text-muted-foreground text-sm">{house.name}</div>
                <div className="grid gap-2 md:grid-cols-2">
                  {housePeople.map((person) => (
                    <div key={person.id} className="flex items-center justify-between rounded-md bg-card px-3 py-2">
                      <span className="text-foreground">{person.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePerson(person.id)}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Draw & Share */}
      <Card className="border-border bg-card p-6">
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {isDrawComplete ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-secondary/10 p-4 text-center">
              <p className="font-semibold text-secondary text-lg">¡Sorteo completado! 🎉</p>
              <p className="text-muted-foreground text-sm">Los participantes ya pueden ver sus resultados</p>
            </div>
            <Button
              onClick={resetDraw}
              variant="outline"
              className="w-full border-border hover:bg-muted bg-transparent"
            >
              Hacer nuevo sorteo
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            <Button
              onClick={performDraw}
              disabled={people.length < 2}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Shuffle className="mr-2 h-5 w-5" />
              Realizar Sorteo (local)
            </Button>
            <Button
              onClick={createShareLink}
              disabled={people.length < 2 || creatingLink}
              variant="outline"
              className="w-full border-border hover:bg-muted bg-transparent"
            >
              Crear enlace para participantes
            </Button>
          </div>
        )}

        {sessionUrl && (
          <div className="mt-4 rounded-lg border border-border bg-background p-4">
            <div className="mb-2 text-sm text-muted-foreground">Comparte este enlace con los participantes:</div>
            <div className="flex items-center gap-2">
              <Input readOnly value={sessionUrl} className="flex-1" />
              <Button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(sessionUrl)
                    toast({ title: "Enlace copiado", description: "Se copió al portapapeles" })
                  } catch {
                    /* ignore */
                  }
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copiar
              </Button>
              <Button
                variant="outline"
                onClick={createShareLink}
                disabled={creatingLink}
                className="border-border"
                title="Generar un nuevo enlace de sesión"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Nuevo enlace
              </Button>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Cada persona elegirá su nombre y verá su amigo secreto de inmediato. Solo se puede ver una vez.
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

// Algorithm to create valid assignments
function createValidAssignments(people: Person[]): Assignment[] {
  const n = people.length
  const assignments: Assignment[] = []
  const used = new Set<string>()

  function isValid(giver: Person, receiver: Person): boolean {
    return giver.id !== receiver.id && giver.houseId !== receiver.houseId && !used.has(receiver.id)
  }

  function backtrack(index: number): boolean {
    if (index === n) {
      return true
    }

    const giver = people[index]
    const shuffledPeople = [...people].sort(() => Math.random() - 0.5)

    for (const receiver of shuffledPeople) {
      if (isValid(giver, receiver)) {
        used.add(receiver.id)
        assignments.push({ giverId: giver.id, receiverId: receiver.id })

        if (backtrack(index + 1)) {
          return true
        }

        used.delete(receiver.id)
        assignments.pop()
      }
    }

    return false
  }

  // Try multiple times with different random orders
  for (let attempt = 0; attempt < 100; attempt++) {
    assignments.length = 0
    used.clear()
    const shuffledStart = [...people].sort(() => Math.random() - 0.5)

    if (backtrackWithOrder(shuffledStart)) {
      return assignments
    }
  }

  return []

  function backtrackWithOrder(orderedPeople: Person[]): boolean {
    if (assignments.length === n) {
      return true
    }

    const giver = orderedPeople[assignments.length]
    const shuffledReceivers = [...people].sort(() => Math.random() - 0.5)

    for (const receiver of shuffledReceivers) {
      if (isValid(giver, receiver)) {
        used.add(receiver.id)
        assignments.push({ giverId: giver.id, receiverId: receiver.id })

        if (backtrackWithOrder(orderedPeople)) {
          return true
        }

        used.delete(receiver.id)
        assignments.pop()
      }
    }

    return false
  }
}
