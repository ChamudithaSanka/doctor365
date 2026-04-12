FROM node:20-alpine

WORKDIR /app

COPY services/notification-service/package*.json ./
RUN npm install

COPY services/notification-service/src ./src
COPY shared /shared

EXPOSE 5007

CMD ["node", "src/server.js"]
