import { NextRequest, NextResponse } from "next/server"
import { getConfig } from "@/lib/store"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const parts = new URL(req.url).pathname.split("/").filter(Boolean)
  const id = parts[parts.length - 1] ?? ""
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const cfg = await getConfig(id)
  if (!cfg) return NextResponse.json({ error: "Not Found" }, { status: 404 })

  return NextResponse.json({ id: cfg.id, name: cfg.name, houses: cfg.houses, people: cfg.people, createdAt: cfg.createdAt })
}
