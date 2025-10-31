import { randomBytes } from "crypto"
// Use Vercel KV (free tier) if environment variables are present. Fallback to in-memory in dev.
let kv: any = null
try {
  // Lazy import so local dev without the package still works until installed
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  kv = require("@vercel/kv").kv
} catch {
  kv = null
}

export type Person = {
  id: string
  name: string
  houseId: string
  claimed: boolean
}

export type House = {
  id: string
  name: string
}

export type Assignment = {
  giverId: string
  receiverId: string
}

export type Session = {
  id: string
  houses: House[]
  people: Person[]
  assignments: Assignment[]
  isDrawComplete: boolean
  createdAt: number
}

// Config saved by the organizer (houses + people) to reuse later
export type Config = {
  id: string
  name?: string
  houses: House[]
  people: Omit<Person, "claimed">[]
  createdAt: number
}

// In-memory store (ephemeral). Used when KV is not configured.
const globalAny = globalThis as unknown as { __amigoSessions?: Map<string, Session> }
const sessions: Map<string, Session> = globalAny.__amigoSessions ?? new Map<string, Session>()
globalAny.__amigoSessions = sessions

export function isKvConfigured(): boolean {
  // Vercel KV uses KV_REST_API_URL/KV_REST_API_TOKEN or KV_URL; Upstash naming also supported
  return Boolean(
    kv && (process.env.KV_REST_API_URL || process.env.KV_URL || process.env.UPSTASH_REDIS_REST_URL),
  )
}

const kvKey = (id: string) => `session:${id}`
const kvConfigKey = (id: string) => `config:${id}`

export function generateSessionId(): string {
  // 12 bytes -> 24 hex chars
  return randomBytes(12).toString("hex")
}

export async function createSession(input: { houses: House[]; people: Omit<Person, "claimed">[] }): Promise<Session> {
  const id = generateSessionId()
  const people: Person[] = input.people.map((p) => ({ ...p, claimed: false }))
  // Precompute assignments so each participante pueda ver su resultado al instante
  const precomputed = createValidAssignments(people)
  const session: Session = {
    id,
    houses: input.houses,
    people,
    assignments: precomputed,
    // isDrawComplete indica que ya existen asignaciones listas para revelar
    isDrawComplete: precomputed.length > 0,
    createdAt: Date.now(),
  }
  if (isKvConfigured()) {
    await kv.set(kvKey(id), session)
  } else {
    sessions.set(id, session)
  }
  return session
}

// --- Config persistence ---
export async function createConfig(input: { name?: string; houses: House[]; people: { id: string; name: string; houseId: string }[] }): Promise<Config> {
  const id = generateSessionId()
  const cfg: Config = {
    id,
    name: input.name?.trim() || undefined,
    houses: input.houses,
    people: input.people,
    createdAt: Date.now(),
  }
  if (isKvConfigured()) {
    await kv.set(kvConfigKey(id), cfg)
  } else {
    // keep a tiny in-memory cache for local dev
    const g = globalThis as unknown as { __amigoConfigs?: Map<string, Config> }
    if (!g.__amigoConfigs) g.__amigoConfigs = new Map()
    g.__amigoConfigs.set(id, cfg)
  }
  return cfg
}

export async function getConfig(id: string): Promise<Config | undefined> {
  if (isKvConfigured()) {
    const c = (await kv.get(kvConfigKey(id))) as Config | null
    return c ?? undefined
  }
  const g = globalThis as unknown as { __amigoConfigs?: Map<string, Config> }
  return g.__amigoConfigs?.get(id)
}

export async function getSession(id: string): Promise<Session | undefined> {
  if (isKvConfigured()) {
    const s = (await kv.get(kvKey(id))) as Session | null
    return s ?? undefined
  }
  return sessions.get(id)
}

export async function setSession(session: Session): Promise<void> {
  if (isKvConfigured()) {
    await kv.set(kvKey(session.id), session)
  } else {
    sessions.set(session.id, session)
  }
}

export async function claimPerson(
  sessionId: string,
  personId: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const session = await getSession(sessionId)
  if (!session) return { ok: false, reason: "NOT_FOUND" }
  const person = session.people.find((p) => p.id === personId)
  if (!person) return { ok: false, reason: "PERSON_NOT_FOUND" }
  if (person.claimed) return { ok: false, reason: "ALREADY_CLAIMED" }
  person.claimed = true

  // If all claimed and draw not yet complete, perform draw automatically
  if (!session.isDrawComplete && session.people.every((p) => p.claimed)) {
    const assignments = createValidAssignments(session.people)
    session.assignments = assignments
    session.isDrawComplete = assignments.length > 0
  }

  await setSession(session)
  return { ok: true }
}

export async function getReceiverFor(sessionId: string, giverId: string): Promise<{ receiverId: string } | null> {
  const session = await getSession(sessionId)
  if (!session || !session.isDrawComplete) return null
  const a = session.assignments.find((x) => x.giverId === giverId)
  return a ? { receiverId: a.receiverId } : null
}

// Assignment algorithm (no same person and no same house, full matching required)
export function createValidAssignments(people: Person[]): Assignment[] {
  const n = people.length
  const assignments: Assignment[] = []
  const used = new Set<string>()

  function isValid(giver: Person, receiver: Person): boolean {
    return giver.id !== receiver.id && giver.houseId !== receiver.houseId && !used.has(receiver.id)
  }

  function backtrack(index: number): boolean {
    if (index === n) return true
    const giver = people[index]
    const shuffledPeople = [...people].sort(() => Math.random() - 0.5)
    for (const receiver of shuffledPeople) {
      if (isValid(giver, receiver)) {
        used.add(receiver.id)
        assignments.push({ giverId: giver.id, receiverId: receiver.id })
        if (backtrack(index + 1)) return true
        used.delete(receiver.id)
        assignments.pop()
      }
    }
    return false
  }

  for (let attempt = 0; attempt < 100; attempt++) {
    assignments.length = 0
    used.clear()
    const shuffled = [...people].sort(() => Math.random() - 0.5)
    if (backtrackWithOrder(shuffled)) return assignments
  }
  return []

  function backtrackWithOrder(order: Person[]): boolean {
    if (assignments.length === n) return true
    const giver = order[assignments.length]
    const shuffledReceivers = [...people].sort(() => Math.random() - 0.5)
    for (const receiver of shuffledReceivers) {
      if (isValid(giver, receiver)) {
        used.add(receiver.id)
        assignments.push({ giverId: giver.id, receiverId: receiver.id })
        if (backtrackWithOrder(order)) return true
        used.delete(receiver.id)
        assignments.pop()
      }
    }
    return false
  }
}
