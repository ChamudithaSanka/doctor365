FROM node:20-alpine

WORKDIR /app/services/notification-service

COPY services/notification-service/package*.json ./
RUN npm install

COPY services/notification-service/src ./src
COPY shared /app/shared

EXPOSE 5007

CMD ["node", "src/server.js"]
