FROM node:20-alpine

WORKDIR /app

COPY services/appointment-service/package*.json ./
RUN npm install

COPY services/appointment-service/src ./src
COPY shared /shared

EXPOSE 5004

CMD ["node", "src/server.js"]
