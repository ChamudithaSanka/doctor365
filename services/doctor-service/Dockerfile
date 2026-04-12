FROM node:20-alpine

WORKDIR /app

COPY services/doctor-service/package*.json ./
RUN npm install

COPY services/doctor-service/src ./src
COPY shared /shared

EXPOSE 5003

CMD ["node", "src/server.js"]
