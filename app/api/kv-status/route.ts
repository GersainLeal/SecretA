import { NextResponse } from "next/server"
import { isKvConfigured } from "@/lib/store"

export const dynamic = "force-dynamic"

export async function GET() {
  const enabled = isKvConfigured()
  return NextResponse.json({ enabled })
}
