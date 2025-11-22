# Build
FROM node:20-alpine AS builder
WORKDIR /app
ENV NODE_ENV=production

# Corepack + pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Instala deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copia o restante e builda
COPY . .
RUN pnpm build

# Run
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

# pnpm no runtime (se precisar rodar scripts)
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copia o standalone
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/package.json ./package.json

EXPOSE 3001

CMD ["node", "server.js"]
