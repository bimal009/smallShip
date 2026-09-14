import { randomBytes } from "crypto"

export const slugify = (name: string): string => {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")

  return `${base}-${randomBytes(8).toString("hex")}`
}