import "dotenv/config"
import { drizzle } from "drizzle-orm/neon-serverless"
import ws from "ws"
import { relations } from "./realtions"

export const db = drizzle({
  connection: process.env.DATABASE_URL!,
  ws,
  relations,
})