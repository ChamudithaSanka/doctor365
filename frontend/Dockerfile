FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ARG VITE_GATEWAY_URL=http://doctor365.local/api
ARG VITE_AUTH_SERVICE_URL=http://doctor365.local/api/auth
ENV VITE_GATEWAY_URL=$VITE_GATEWAY_URL
ENV VITE_AUTH_SERVICE_URL=$VITE_AUTH_SERVICE_URL

RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
