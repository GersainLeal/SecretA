import { NextRequest, NextResponse } from "next/server"
import { createSession, type House, type Person } from "@/lib/store"

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      houses: House[]
      people: { id: string; name: string; houseId: string }[]
    }

    if (!Array.isArray(body.houses) || !Array.isArray(body.people)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const session = await createSession({
      houses: body.houses,
      people: body.people as Person[],
    })

    if (!session.isDrawComplete) {
      return NextResponse.json(
        { error: "No se pudo generar un sorteo válido con los datos proporcionados" },
        { status: 400 },
      )
    }

    return NextResponse.json({ id: session.id }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: "Bad Request" }, { status: 400 })
  }
}
