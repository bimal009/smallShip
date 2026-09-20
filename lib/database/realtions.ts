import { defineRelations } from "drizzle-orm/relations";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  user: {
    sessions: r.many.session(),
    accounts: r.many.account(),
    apps: r.many.apps(),
    apiKeys: r.many.apiKeys(),
  },

  session: {
    user: r.one.user({
      from: r.session.userId,
      to: r.user.id,
      optional: false,
    }),
  },

  account: {
    user: r.one.user({
      from: r.account.userId,
      to: r.user.id,
      optional: false,
    }),
  },

  hosts: {
    apps: r.many.apps(),
  },

  apps: {
    owner: r.one.user({
      from: r.apps.ownerId,
      to: r.user.id,
      optional: false,
    }),
    host: r.one.hosts({
      from: r.apps.hostId,
      to: r.hosts.id,
      optional: true,
    }),
    envKeys: r.many.appEnvKeys(),
  },

  appEnvKeys: {
    app: r.one.apps({
      from: r.appEnvKeys.appId,
      to: r.apps.id,
      optional: false,
    }),
  },

  apiKeys: {
    user: r.one.user({
      from: r.apiKeys.userId,
      to: r.user.id,
      optional: false,
    }),
  },
}));