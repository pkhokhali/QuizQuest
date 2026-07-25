FROM node:22-bookworm-slim

WORKDIR /app

# better-sqlite3 needs a native build toolchain
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

# Seed a fresh question bank into the image (override at runtime with a volume if you want)
RUN npm run seed

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4000
EXPOSE 4000

CMD ["npm", "start"]
