import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import * as schema from "./lib/database/schema/index"
import "dotenv/config"
import { db } from "./lib/database";
const isDev = process.env.NODE_ENV === "development";

export const auth = betterAuth({
    secret: process.env.BETTER_AUTH_SECRET!,
    baseURL: process.env.BETTER_AUTH_URL!,
    trustedOrigins: process.env.CORS_ORIGIN?.split(",") ?? [],
    database: drizzleAdapter(db, {
        provider: "pg",
        schema,
    }),
    emailAndPassword: {
        enabled: true,
    },
  
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
    },
    advanced: {
        defaultCookieAttributes: isDev
            ? undefined
            : {
                  sameSite: "none",
                  secure: true,
              },
    },
});