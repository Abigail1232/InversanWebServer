
FROM node:22-alpine

RUN apk add --no-cache openssl

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./

RUN npm ci

COPY . .

# Generar cliente de Prisma
RUN npx prisma generate

EXPOSE 3000

# Aplica migraciones pendientes sin borrar ni recrear la base de datos.
CMD sh -c "npx prisma migrate deploy && npm start"
