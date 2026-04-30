# Doctor365

## Overview

Doctor365 is a healthcare platform built as a microservice-based system. It combines a React frontend, an API gateway, and multiple backend services for authentication, patient management, doctor management, appointments, telemedicine, payments, notifications, and symptom analysis.

The system is designed to run locally with Docker Compose or in Kubernetes using the manifests under `infra/k8s`. The frontend talks to the gateway, and the gateway routes requests to the appropriate backend service.

## Features

- Patient, doctor, and admin user flows
- JWT-based authentication and role-based access control
- Appointment booking and management
- Telemedicine consultations with Agora RTC integration
- Payment handling and payment callbacks
- Notification delivery through email/SMS integrations
- AI-powered symptom checking
- Docker-based local development and Kubernetes deployment support

## Technology Stack

- Frontend: React, Vite, React Router, Axios, Tailwind CSS
- Gateway: Node.js, Express, http-proxy-middleware, CORS
- Backend services: Node.js, Express, MongoDB, JWT, Mongoose
- Telemedicine: Agora RTC, agora-rtc-sdk-ng, Agora token utilities
- Payments: PayHere integration and callback handling
- Notifications: Twilio and Nodemailer
- Deployment: Docker, Docker Compose, Kubernetes, Kustomize, Nginx Ingress

## Setup Instructions

### 1. Install service dependencies

Run the provided bootstrap script from the repository root to install dependencies for the backend services:

```powershell
.\init-services.ps1
```

If you need to install dependencies manually, run `npm install` inside each service folder, the gateway, and the frontend.

### 2. Run locally with Docker Compose

Use Docker Compose to start the platform with locally built service images:

```powershell
docker compose up --build
```

### 3. Build Docker images for Kubernetes or local testing

Use the image build helper to build all service images:

```powershell
./build-all.ps1
```

You can also build images directly when needed:

```powershell
docker build -t doctor365/frontend:latest --build-arg VITE_GATEWAY_URL=http://localhost:5000 --build-arg VITE_AUTH_SERVICE_URL=http://localhost:5000/api/auth ./frontend
docker build -t doctor365/gateway:latest ./gateway
docker build -t doctor365/auth-service:latest -f services/auth-service/Dockerfile .
```

### 4. Prepare images for kind

If you are using kind, load the locally built images into the cluster after building them:

```powershell
kind load docker-image doctor365/frontend:latest
kind load docker-image doctor365/gateway:latest
kind load docker-image doctor365/auth-service:latest
```

Repeat for the remaining service images as needed.

### 5. Deploy to Kubernetes

Apply the Kubernetes manifests from the repository root:

```powershell
kubectl apply -k infra/k8s
```

To verify the deployment:

```powershell
kubectl get pods -n doctor365
kubectl get svc -n doctor365
kubectl get ingress -n doctor365
```

## Project Structure

```text
doctor365/
|-- frontend/                  React + Vite single-page app
|   |-- src/
|   |-- Dockerfile
|   `-- nginx.conf
|-- gateway/                   API gateway and reverse proxy
|   `-- src/server.js
|-- services/
|   |-- auth-service/
|   |-- patient-service/
|   |-- doctor-service/
|   |-- appointment-service/
|   |-- telemedicine-service/
|   |-- payment-service/
|   |-- notification-service/
|   `-- symptom-checker-service/
|-- shared/                    Shared JWT utilities
|-- infra/k8s/                 Kubernetes manifests and Kustomize overlay
|-- docker-compose.yml         Local container orchestration
|-- build-all.ps1              Docker image build helper
`-- init-services.ps1          Dependency installation helper
```

## API Documentation

The frontend communicates with the backend through the gateway at port `5000`.

- `GET /health` - Gateway health check
- `POST /api/auth/register` - Create a user account
- `POST /api/auth/login` - Sign in and receive access and refresh tokens
- `GET /api/patients/me` - Fetch the current patient profile
- `GET /api/doctors` - List doctors
- `POST /api/appointments` - Create an appointment
- `GET /api/appointments/me` - List the authenticated user's appointments
- `POST /api/telemedicine/sessions` - Create a telemedicine session
- `POST /api/payments/checkout/payhere` - Start payment checkout
- `GET /api/notifications/me` - Get current user notifications
- `POST /api/symptoms/analyze` - Analyze symptoms with the symptom checker service

All protected routes require a Bearer token in the `Authorization` header.

## Authentication

Doctor365 uses JWT-based authentication across the platform.

- Users register and log in through the auth service
- Access tokens and refresh tokens are returned on successful authentication
- The frontend stores auth state in local storage
- Gateway requests forward the `Authorization` header to downstream services
- Service-level middleware validates tokens locally with the shared JWT secret
- Role-based access controls are enforced for patient, doctor, and admin flows

## Environment Variables

The following variables are commonly used across the repo:

- `PORT` - Service listening port
- `NODE_ENV` - Runtime environment
- `JWT_SECRET` - Shared signing secret for JWT tokens
- `INTERNAL_SERVICE_TOKEN` - Token used for service-to-service protected calls
- `MONGODB_URI` - MongoDB connection string for each service
- `AUTH_SERVICE_URL` - Auth service base URL
- `PATIENT_SERVICE_URL` - Patient service base URL
- `DOCTOR_SERVICE_URL` - Doctor service base URL
- `APPOINTMENT_SERVICE_URL` - Appointment service base URL
- `TELEMEDICINE_SERVICE_URL` - Telemedicine service base URL
- `PAYMENT_SERVICE_URL` - Payment service base URL
- `NOTIFICATION_SERVICE_URL` - Notification service base URL
- `SYMPTOM_CHECKER_SERVICE_URL` - Symptom checker service base URL
- `VITE_GATEWAY_URL` - Frontend gateway URL
- `VITE_AUTH_SERVICE_URL` - Frontend auth service URL

Additional service-specific values are required for production deployments, including Agora, PayHere, Twilio, Gmail, and Groq credentials.

## Deployment

### Docker Compose

Start the full stack locally with:

```powershell
docker compose up --build
```

### Docker Image Build

Build individual images using the provided helper or direct Docker commands:

```powershell
./build-all.ps1
```

### kind

After building images locally, load them into kind before applying Kubernetes manifests:

```powershell
kind load docker-image doctor365/frontend:latest
kind load docker-image doctor365/gateway:latest
kind load docker-image doctor365/auth-service:latest
```

### Kubernetes

Deploy to the `doctor365` namespace with Kustomize:

```powershell
kubectl apply -k infra/k8s
```

Verify the rollout with:

```powershell
kubectl get pods -n doctor365
kubectl get svc -n doctor365
kubectl get ingress -n doctor365
```

## Testing Instruction Report

### Health checks

- `GET /health` on the gateway should return a healthy status
- Each service should expose a health endpoint on its own port

### Authentication flow

- Register a patient or doctor account
- Log in and confirm tokens are saved in the browser
- Open a protected route and verify the request succeeds with the token attached

### Core workflow checks

- List doctors from the patient view
- Book an appointment as a patient
- Confirm or update the appointment as a doctor or admin
- Open a telemedicine session from a confirmed appointment
- Submit a payment flow through the gateway
- Send and read notifications
- Run symptom analysis from the frontend widget