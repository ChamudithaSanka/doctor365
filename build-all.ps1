docker build -t doctor365/frontend:latest --build-arg VITE_GATEWAY_URL=http://localhost:5000 --build-arg VITE_AUTH_SERVICE_URL=http://localhost:5000/api/auth ./frontend

docker build -t doctor365/auth-service:latest -f services/auth-service/Dockerfile .
docker build -t doctor365/patient-service:latest -f services/patient-service/Dockerfile .
docker build -t doctor365/doctor-service:latest -f services/doctor-service/Dockerfile .
docker build -t doctor365/appointment-service:latest -f services/appointment-service/Dockerfile .
docker build -t doctor365/telemedicine-service:latest -f services/telemedicine-service/Dockerfile .
docker build -t doctor365/payment-service:latest -f services/payment-service/Dockerfile .
docker build -t doctor365/notification-service:latest -f services/notification-service/Dockerfile .
docker build -t doctor365/gateway:latest ./gateway