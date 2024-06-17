FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build 

FROM node:18-alpine as production

ENV node_env=prod

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY --from=builder /app/dist ./

COPY --from=builder /app/certs ./

COPY --from=builder /app/public ./

COPY --from=builder /app/.env.prod ./

EXPOSE 8000

CMD ["node", "src/server.js"]

