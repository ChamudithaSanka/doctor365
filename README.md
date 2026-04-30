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

