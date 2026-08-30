import { sql } from "../lib/db"

async function main() {
  console.log("[v0] Ensuring max_trees_per_season column exists on settings table...")
  await sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS max_trees_per_season INTEGER NOT NULL DEFAULT 500`
  console.log("[v0] Done.")
}

main().catch((error) => {
  console.error("[v0] Migration failed:", error instanceof Error ? error.message : error)
  process.exit(1)
})
