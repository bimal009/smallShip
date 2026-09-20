import { z } from "zod"

const appIdSchema = z.string().min(1)
const pathSchema = z.string().min(1).refine((p) => !p.includes(".."), {
  message: "path traversal not allowed",
})

export const writeFileSchema = z.object({
  appId: appIdSchema,
  path: pathSchema,
  content: z.string(),
})

export const readFileSchema = z.object({
  appId: appIdSchema,
  path: pathSchema,
})

export const deleteFileSchema = z.object({
  appId: appIdSchema,
  path: pathSchema,
})

export const listFilesSchema = z.object({
  appId: appIdSchema,
  path: pathSchema.default("."),
})

export const editFileSchema = z.object({
  appId: appIdSchema,
  path: pathSchema,
  oldStr: z.string().min(1),
  newStr: z.string(),
})

