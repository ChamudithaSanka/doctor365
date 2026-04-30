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
.\build-all.ps1
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