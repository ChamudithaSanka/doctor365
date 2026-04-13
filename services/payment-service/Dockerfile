FROM node:20-alpine

WORKDIR /app/services/payment-service

COPY services/payment-service/package*.json ./
RUN npm install

COPY services/payment-service/src ./src
COPY shared /app/shared

EXPOSE 5006

CMD ["node", "src/server.js"]
