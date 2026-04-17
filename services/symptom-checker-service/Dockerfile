FROM node:20-alpine

WORKDIR /app/services/symptom-checker-service

COPY services/symptom-checker-service/package*.json ./

RUN npm install

COPY services/symptom-checker-service/src ./src

EXPOSE 5008

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5008/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["npm", "start"]
