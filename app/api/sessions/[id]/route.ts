import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/store"

// Ensure this route is always dynamic (no caching in production)
export const dynamic = "force-dynamic"

// Fetch public session state
export async function GET(req: NextRequest) {
  const parts = new URL(req.url).pathname.split("/").filter(Boolean)
  const id = parts[parts.length - 1] ?? ""
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  const session = await getSession(id)
  if (!session) return NextResponse.json({ error: "Not Found" }, { status: 404 })

  // Public state (don’t expose assignments here)
  return NextResponse.json({
    id: session.id,
    houses: session.houses,
    people: session.people.map((p) => ({ id: p.id, name: p.name, houseId: p.houseId, claimed: p.claimed })),
    isDrawComplete: session.isDrawComplete,
  })
}
