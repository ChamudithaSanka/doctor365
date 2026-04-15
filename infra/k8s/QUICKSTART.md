# Doctor365 Kubernetes Quickstart

## 1) Build images
Run from project root:

```powershell
docker build -t doctor365/auth-service:latest -f services/auth-service/Dockerfile .
docker build -t doctor365/patient-service:latest -f services/patient-service/Dockerfile .
docker build -t doctor365/doctor-service:latest -f services/doctor-service/Dockerfile .
docker build -t doctor365/appointment-service:latest -f services/appointment-service/Dockerfile .
docker build -t doctor365/telemedicine-service:latest -f services/telemedicine-service/Dockerfile .
docker build -t doctor365/payment-service:latest -f services/payment-service/Dockerfile .
docker build -t doctor365/notification-service:latest -f services/notification-service/Dockerfile .
docker build -t doctor365/gateway:latest -f gateway/Dockerfile gateway
docker build -t doctor365/frontend:latest -f frontend/Dockerfile frontend
```

## 2) Set secrets
Edit `infra/k8s/02-secrets.yaml` and replace all placeholder values.

## 3) Deploy

```powershell
kubectl apply -k infra/k8s
```

## 4) Check status

```powershell
kubectl get pods -n doctor365
kubectl get svc -n doctor365
kubectl get ingress -n doctor365
```

## 5) Access app
- Add `doctor365.local` to your hosts file (point to your ingress IP).
- Open: `http://doctor365.local`

## Cleanup

```powershell
kubectl delete -k infra/k8s
```
