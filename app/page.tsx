"use client"

import { useState } from "react"
import { SetupView } from "@/components/setup-view"
import { ParticipantView } from "@/components/participant-view"
import { Gift } from "lucide-react"

export type Person = {
  id: string
  name: string
  houseId: string
}

export type House = {
  id: string
  name: string
}

export type Assignment = {
  giverId: string
  receiverId: string
}

export default function Home() {
  const [view, setView] = useState<"setup" | "participant">("setup")
  const [houses, setHouses] = useState<House[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [isDrawComplete, setIsDrawComplete] = useState(false)

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-card">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <Gift className="h-10 w-10 text-primary md:h-12 md:w-12" />
            <h1 className="text-balance font-bold text-4xl text-foreground md:text-5xl lg:text-6xl">Amigo Secreto</h1>
            <Gift className="h-10 w-10 text-secondary md:h-12 md:w-12" />
          </div>
          <p className="text-pretty text-muted-foreground text-lg md:text-xl">
            Organiza tu intercambio de regalos de forma mágica
          </p>
        </div>

        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex gap-2 rounded-xl border border-border bg-card p-1">
            <button
              onClick={() => setView("setup")}
              className={`flex-1 rounded-lg px-4 py-3 font-medium text-sm transition-all ${
                view === "setup"
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Configurar Sorteo
            </button>
            <button
              onClick={() => setView("participant")}
              className={`flex-1 rounded-lg px-4 py-3 font-medium text-sm transition-all ${
                view === "participant"
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Ver Mi Resultado
            </button>
          </div>

          {view === "setup" ? (
            <SetupView
              houses={houses}
              setHouses={setHouses}
              people={people}
              setPeople={setPeople}
              assignments={assignments}
              setAssignments={setAssignments}
              isDrawComplete={isDrawComplete}
              setIsDrawComplete={setIsDrawComplete}
            />
          ) : (
            <ParticipantView people={people} assignments={assignments} isDrawComplete={isDrawComplete} />
          )}
        </div>
      </div>
    </main>
  )
}
