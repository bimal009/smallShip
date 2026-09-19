import { App } from "@octokit/app";
import fs from "fs";
import path from "path";

const privateKey = fs.readFileSync(
  path.join(process.cwd(), "secret", "shipsmall.2026-09-14.private-key.pem"),
  "utf8"
);

export const github = new App({
  appId: process.env.GITHUB_APP_ID!,
  privateKey,
});