import { NextRequest, NextResponse } from "next/server"
import { getReceiverFor, getSession } from "@/lib/store"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const personId = searchParams.get("personId")
  if (!personId) return NextResponse.json({ error: "personId required" }, { status: 400 })
  const parts = new URL(req.url).pathname.split("/").filter(Boolean)
  const id = parts[parts.length - 2] ?? ""
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  const session = await getSession(id)
  if (!session) return NextResponse.json({ error: "Not Found" }, { status: 404 })

  // Enforce that the participant must have claimed their spot before revealing
  const person = session.people.find((p) => p.id === personId)
  if (!person) return NextResponse.json({ error: "Person Not Found" }, { status: 404 })
  if (!person.claimed) return NextResponse.json({ error: "NOT_CLAIMED" }, { status: 409 })

  // If assignments are not yet ready (edge case), indicate pending
  if (!session.isDrawComplete) return NextResponse.json({ status: "pending" }, { status: 202 })

  const r = await getReceiverFor(id, personId)
  if (!r) return NextResponse.json({ error: "No assignment" }, { status: 404 })

  const receiver = session.people.find((p) => p.id === r.receiverId)
  if (!receiver) return NextResponse.json({ error: "Not Found" }, { status: 404 })
  return NextResponse.json({ receiver: { id: receiver.id, name: receiver.name, houseId: receiver.houseId } })
}
