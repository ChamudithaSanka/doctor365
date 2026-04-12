FROM node:20-alpine

WORKDIR /app

COPY services/auth-service/package*.json ./
RUN npm install

COPY services/auth-service/src ./src
COPY shared /shared

EXPOSE 5001

CMD ["node", "src/server.js"]
