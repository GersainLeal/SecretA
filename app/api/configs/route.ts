import { NextRequest, NextResponse } from "next/server"
import { createConfig, type House } from "@/lib/store"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      name?: string
      houses?: House[]
      people?: { id: string; name: string; houseId: string }[]
    }
    if (!Array.isArray(body.houses) || !Array.isArray(body.people)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }
    if (body.people.length < 2) {
      return NextResponse.json({ error: "Se requieren al menos 2 participantes" }, { status: 400 })
    }

    const cfg = await createConfig({ name: body.name, houses: body.houses, people: body.people })
    return NextResponse.json({ id: cfg.id }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: "Bad Request" }, { status: 400 })
  }
}
