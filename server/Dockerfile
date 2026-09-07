FROM docker.m.daocloud.io/library/node:20-alpine AS builder

ARG CACHEBUST=20260907123000

WORKDIR /app

COPY package*.json ./
RUN npm install --registry=https://registry.npmmirror.com

COPY . .
RUN npx prisma generate
RUN npm run build

FROM docker.m.daocloud.io/library/node:20-alpine

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npx prisma db seed && node dist/src/index.js"]