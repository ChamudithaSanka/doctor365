FROM node:20-alpine

WORKDIR /app

COPY services/patient-service/package*.json ./
RUN npm install

COPY services/patient-service/src ./src
COPY shared /app/shared

EXPOSE 5002

CMD ["node", "src/server.js"]
