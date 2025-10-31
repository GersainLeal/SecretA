import { NextResponse } from "next/server"
import { isKvConfigured } from "@/lib/store"

export const dynamic = "force-dynamic"

export async function GET() {
  const enabled = isKvConfigured()
  // Return hints (booleans only, no secret values)
  return NextResponse.json({
    enabled,
    vars: {
      KV_REST_API_URL: Boolean(process.env.KV_REST_API_URL),
      KV_REST_API_TOKEN: Boolean(process.env.KV_REST_API_TOKEN),
      UPSTASH_REDIS_REST_URL: Boolean(process.env.UPSTASH_REDIS_REST_URL),
      UPSTASH_REDIS_REST_TOKEN: Boolean(process.env.UPSTASH_REDIS_REST_TOKEN),
      KV_URL: Boolean(process.env.KV_URL),
      REDIS_URL: Boolean(process.env.REDIS_URL),
    },
  })
}
