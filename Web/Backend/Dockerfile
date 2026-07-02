FROM node:22-alpine

RUN apk add --no-cache openssl

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./

RUN npm install

COPY . .

# Generar cliente de Prisma
RUN npx prisma generate

EXPOSE 3000

# Comando de producción: aplica migraciones pendientes y levanta la app
CMD sh -c "npx prisma migrate deploy && npm start"

