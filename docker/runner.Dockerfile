FROM node:24-slim AS runner

WORKDIR /app

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY public ./public
COPY .next/standalone ./
COPY .next/static ./.next/static
COPY node_modules/better-sqlite3 ./node_modules/better-sqlite3

RUN mkdir -p /app/data && chown node:node /app/data

USER node

EXPOSE 3000
CMD ["node", "server.js"]