import {
  pgTable,
  pgEnum,
  text,
  integer,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";


export const hostStatusEnum = pgEnum("host_status", [
  "provisioning",
  "active",       
  "draining",  
  "offline",   
]);

export const hosts = pgTable("hosts", {
  id: uuid("id").defaultRandom().primaryKey(),

  name: text("name").notNull(), 
  instanceId: text("instance_id").notNull().unique(),
  region: text("region").notNull(),
  publicIp: text("public_ip"),
  privateIp: text("private_ip"),

  status: hostStatusEnum("status").default("provisioning").notNull(),

  maxApps: integer("max_apps").default(50).notNull(),
  portRangeStart: integer("port_range_start").default(10000).notNull(),
  portRangeEnd: integer("port_range_end").default(20000).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
