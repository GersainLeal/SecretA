"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Gift, Users, Link2, CheckCircle2, Clock, AlertTriangle } from "lucide-react"

type Person = { id: string; name: string; houseId: string; claimed: boolean }
type House = { id: string; name: string }
type SessionState = {
  id: string
  houses: House[]
  people: Person[]
  isDrawComplete: boolean
}

export default function SessionPage() {
  const params = useParams<{ id: string }>()
  const sessionId = params.id
  const [state, setState] = useState<SessionState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null)
  const [receiverName, setReceiverName] = useState<string | null>(null)
  const [claiming, setClaiming] = useState(false)
  const [claimError, setClaimError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const claimedCount = useMemo(() => state?.people.filter((p) => p.claimed).length ?? 0, [state])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/sessions/${sessionId}`)
        if (!res.ok) throw new Error("No se encontró la sesión")
        const data = (await res.json()) as SessionState
        if (mounted) setState(data)
      } catch (e: any) {
        if (mounted) setError(e.message || "Error cargando sesión")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [sessionId])

  // After a claim, poll for receiver (assignments are now precomputed)
  useEffect(() => {
    if (!selectedPersonId) return
    const poll = async () => {
      const res = await fetch(`/api/sessions/${sessionId}/receiver?personId=${selectedPersonId}`)
      if (res.status === 200) {
        const data = (await res.json()) as { receiver: { id: string; name: string } }
        setReceiverName(data.receiver.name)
        if (pollRef.current) {
          clearInterval(pollRef.current)
          pollRef.current = null
        }
      } else if (res.status === 202) {
        // pending (rare edge), keep polling
      } else {
        // no assignment yet or error; keep trying briefly
      }
    }
    // Start polling every 2s until found
    pollRef.current = setInterval(poll, 2000)
    // Also run immediately once
    poll()
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [selectedPersonId, sessionId])

  const claim = async (personId: string) => {
    setClaimError(null)
    setClaiming(true)
    try {
      const res = await fetch(`/api/sessions/${sessionId}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId }),
      })
      if (res.status === 409) {
        setClaimError("Ese nombre ya fue elegido por otra persona.")
        // Refresh session to reflect changes
        const s = await fetch(`/api/sessions/${sessionId}`).then((r) => r.json())
        setState(s)
        return
      }
      if (!res.ok) throw new Error("No se pudo seleccionar. Intenta de nuevo.")
      setSelectedPersonId(personId)
      // Refresh state to show claimed
      const s = await fetch(`/api/sessions/${sessionId}`).then((r) => r.json())
      setState(s)
    } catch (e: any) {
      setClaimError(e.message || "Error al seleccionar")
    } finally {
      setClaiming(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <div className="flex items-center justify-center gap-3 text-muted-foreground">
          <Spinner className="h-5 w-5" /> Cargando sesión...
        </div>
      </div>
    )
  }

  if (error || !state) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <Card className="border-border bg-card p-8 text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-destructive" />
          <h2 className="mb-2 font-semibold text-foreground text-xl">Sesión no encontrada</h2>
          <p className="text-muted-foreground">Verifica el enlace o pide uno nuevo al organizador.</p>
        </Card>
      </div>
    )
  }

  const hasChosen = !!selectedPersonId

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-card">
      <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12">
        <div className="mb-8 text-center">
          <div className="mb-3 flex items-center justify-center gap-3">
            <Gift className="h-10 w-10 text-primary" />
            <h1 className="font-bold text-3xl text-foreground md:text-4xl">Amigo Secreto</h1>
            <Link2 className="h-10 w-10 text-secondary" />
          </div>
          <p className="text-muted-foreground">Sesión: {state.id}</p>
        </div>

        {!hasChosen ? (
          <Card className="border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-secondary" />
              <h2 className="font-semibold text-foreground text-xl">Elige tu nombre</h2>
            </div>

            {claimError && (
              <div className="mb-4 rounded-md bg-destructive/10 p-3 text-destructive">{claimError}</div>
            )}

            <div className="mb-4 text-muted-foreground text-sm">
              {claimedCount}/{state.people.length} personas ya eligieron su nombre
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {state.people.map((p) => (
                <Button
                  key={p.id}
                  onClick={() => claim(p.id)}
                  disabled={p.claimed || claiming}
                  variant="outline"
                  className="h-auto justify-between border-border bg-background p-4"
                >
                  <div className="text-left">
                    <div className="font-medium text-foreground">{p.name}</div>
                  </div>
                  {p.claimed ? (
                    <span className="text-muted-foreground text-xs">Tomado</span>
                  ) : (
                    <span className="text-primary text-xs">Disponible</span>
                  )}
                </Button>
              ))}
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card className="border-border bg-card p-6 text-center">
              {!receiverName ? (
                <div className="space-y-4">
                  <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">¡Listo! Has elegido tu nombre. Revelando tu amigo secreto...</p>
                  <div className="mx-auto flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Spinner className="h-4 w-4" />
                    Buscando tu resultado...
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-accent" />
                  <p className="text-muted-foreground">Tu amigo secreto es:</p>
                  <h2 className="font-bold text-3xl text-accent">{receiverName}</h2>
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-accent/20">
                    <Gift className="h-12 w-12 text-accent" />
                  </div>
                  <div className="rounded-md bg-amber-100/20 p-3 text-center text-sm text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                    Recomendación: toma una captura de pantalla ahora para recordar tu amigo secreto.
                    No podrás volver a ver este resultado más tarde.
                  </div>
                </div>
              )}
            </Card>
            <div className="text-center text-xs text-muted-foreground">
              Este enlace es compartido por todos. Cada nombre solo puede eligirse una vez y, una vez abierto, no
              podrás volver a ver tu resultado.
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
