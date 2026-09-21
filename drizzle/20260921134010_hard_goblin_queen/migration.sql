CREATE TABLE "app_env_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"app_id" uuid NOT NULL,
	"key" text NOT NULL,
	"description" text,
	"has_value" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "apps" ADD COLUMN "build_container_id" text;--> statement-breakpoint
ALTER TABLE "apps" ADD COLUMN "sandbox_container_id" text;--> statement-breakpoint
CREATE UNIQUE INDEX "app_env_keys_app_key_idx" ON "app_env_keys" ("app_id","key");--> statement-breakpoint
ALTER TABLE "app_env_keys" ADD CONSTRAINT "app_env_keys_app_id_apps_id_fkey" FOREIGN KEY ("app_id") REFERENCES "apps"("id") ON DELETE CASCADE;