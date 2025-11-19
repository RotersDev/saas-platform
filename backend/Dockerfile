FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# Instalar dependências incluindo devDependencies (para tsc)
RUN npm install

COPY . .

# Compilar TypeScript
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/server.js"]
