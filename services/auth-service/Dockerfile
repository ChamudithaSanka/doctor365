FROM node:20-alpine

WORKDIR /app/services/auth-service

COPY services/auth-service/package*.json ./
RUN npm install

COPY services/auth-service/src ./src
COPY shared /app/shared

EXPOSE 5001

CMD ["node", "src/server.js"]
