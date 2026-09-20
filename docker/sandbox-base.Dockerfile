FROM node:24-slim
RUN corepack enable && corepack prepare pnpm@11.23.0 --activate