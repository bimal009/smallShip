CREATE TYPE "app_status" AS ENUM('creating', 'building', 'running', 'sleeping', 'failed', 'deleted');--> statement-breakpoint
CREATE TYPE "host_status" AS ENUM('provisioning', 'active', 'draining', 'offline');--> statement-breakpoint
CREATE TABLE "apps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"owner_id" text NOT NULL,
	"host_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"github_installation_id" text NOT NULL,
	"github_repo_id" text NOT NULL,
	"github_repo_full_name" text NOT NULL,
	"github_branch" text DEFAULT 'main' NOT NULL,
	"root_dir" text DEFAULT '/' NOT NULL,
	"status" "app_status" DEFAULT 'creating'::"app_status" NOT NULL,
	"container_id" text,
	"port" integer,
	"last_deployed_at" timestamp,
	"last_active_at" timestamp,
	"custom_domain" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hosts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"instance_id" text NOT NULL UNIQUE,
	"region" text NOT NULL,
	"public_ip" text,
	"private_ip" text,
	"status" "host_status" DEFAULT 'provisioning'::"host_status" NOT NULL,
	"max_apps" integer DEFAULT 50 NOT NULL,
	"port_range_start" integer DEFAULT 10000 NOT NULL,
	"port_range_end" integer DEFAULT 20000 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "apps_github_repo_idx" ON "apps" ("github_installation_id","github_repo_id");--> statement-breakpoint
CREATE UNIQUE INDEX "apps_host_port_idx" ON "apps" ("host_id","port");--> statement-breakpoint
ALTER TABLE "apps" ADD CONSTRAINT "apps_owner_id_user_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "apps" ADD CONSTRAINT "apps_host_id_hosts_id_fkey" FOREIGN KEY ("host_id") REFERENCES "hosts"("id") ON DELETE RESTRICT;