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

# Comando para iniciar la app en modo PRUEBAS (Se borra y recrea la DB cada vez)
CMD sh -c "npm run prisma:reset && npm run prisma:seed && npm start"

