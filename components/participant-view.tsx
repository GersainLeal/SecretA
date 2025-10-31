"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Gift, Eye, EyeOff } from "lucide-react"
import type { Person, Assignment } from "@/app/page"

type ParticipantViewProps = {
  people: Person[]
  assignments: Assignment[]
  isDrawComplete: boolean
}

export function ParticipantView({ people, assignments, isDrawComplete }: ParticipantViewProps) {
  const [selectedPersonId, setSelectedPersonId] = useState("")
  const [revealed, setRevealed] = useState(false)

  const selectedPerson = people.find((p) => p.id === selectedPersonId)
  const assignment = assignments.find((a) => a.giverId === selectedPersonId)
  const receiver = assignment ? people.find((p) => p.id === assignment.receiverId) : null

  const handleReveal = () => {
    setRevealed(true)
  }

  const handleReset = () => {
    setSelectedPersonId("")
    setRevealed(false)
  }

  if (!isDrawComplete) {
    return (
      <Card className="border-border bg-card p-8 text-center">
        <Gift className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
        <h3 className="mb-2 font-semibold text-foreground text-xl">Sorteo no realizado</h3>
        <p className="text-muted-foreground">El administrador aún no ha realizado el sorteo. Por favor espera.</p>
      </Card>
    )
  }

  if (!selectedPersonId) {
    return (
      <Card className="border-border bg-card p-6">
        <h3 className="mb-4 font-semibold text-foreground text-xl">Selecciona tu nombre</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {people.map((person) => (
            <Button
              key={person.id}
              onClick={() => setSelectedPersonId(person.id)}
              variant="outline"
              className="h-auto justify-start border-border bg-background p-4 text-left hover:border-primary hover:bg-primary/5"
            >
              <div>
                <div className="font-medium text-foreground">{person.name}</div>
                <div className="text-muted-foreground text-sm">
                  {people.find((p) => p.houseId === person.houseId && p.id !== person.id)
                    ? `Casa: ${person.houseId}`
                    : ""}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="border-border bg-card p-6">
        <div className="mb-6 text-center">
          <p className="mb-2 text-muted-foreground">Has seleccionado:</p>
          <h3 className="font-bold text-2xl text-foreground">{selectedPerson?.name}</h3>
        </div>

        {!revealed ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-8 text-center">
              <Gift className="mx-auto mb-4 h-20 w-20 text-accent" />
              <p className="mb-4 text-muted-foreground">Haz clic en el botón para revelar a quién le darás tu regalo</p>
            </div>
            <Button onClick={handleReveal} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              <Eye className="mr-2 h-5 w-5" />
              Revelar mi amigo secreto
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border-2 border-accent bg-accent/10 p-8 text-center">
              <p className="mb-2 text-muted-foreground text-sm">Tu amigo secreto es:</p>
              <h2 className="mb-4 font-bold text-3xl text-accent">{receiver?.name}</h2>
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-accent/20">
                <Gift className="h-12 w-12 text-accent" />
              </div>
            </div>
            <div className="rounded-lg bg-destructive/10 p-4 text-center">
              <p className="font-medium text-destructive text-sm">⚠️ ¡Recuerda mantenerlo en secreto!</p>
            </div>
          </div>
        )}
      </Card>

      <Button onClick={handleReset} variant="outline" className="w-full border-border hover:bg-muted bg-transparent">
        <EyeOff className="mr-2 h-4 w-4" />
        Volver a la selección
      </Button>
    </div>
  )
}
