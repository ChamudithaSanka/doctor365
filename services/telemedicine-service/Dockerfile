FROM node:20-alpine

WORKDIR /app/services/telemedicine-service

COPY services/telemedicine-service/package*.json ./
RUN npm install

COPY services/telemedicine-service/src ./src
COPY shared /app/shared

EXPOSE 5005

CMD ["node", "src/server.js"]
