# Doctor365 Kubernetes Deployment

This folder contains a full Kubernetes setup for all Doctor365 services:

- frontend
- gateway
- auth-service
- patient-service
- doctor-service
- appointment-service
- telemedicine-service
- payment-service
- notification-service

## 1) Build and tag images

From project root, build images (example tags):

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

If your cluster is remote, push to your registry and update image names in manifest files.

## 2) Configure secrets

Edit [02-secrets.yaml](02-secrets.yaml) and replace placeholder values before deploying.

## 3) Deploy all resources

```powershell
kubectl apply -k infra/k8s
```

## 4) Verify rollout

```powershell
kubectl get pods -n doctor365
kubectl get svc -n doctor365
kubectl get ingress -n doctor365
```

## 5) Access app

If using ingress-nginx, map host locally:

- add `doctor365.local` to your hosts file pointing to your ingress IP

Then open:

- `http://doctor365.local` for frontend
- `http://doctor365.local/health` for gateway health

## Notes

- This setup includes an in-cluster MongoDB service named `mongo`.
- The MongoDB deployment currently uses `emptyDir` storage (ephemeral). Replace it with a `PersistentVolumeClaim` for production.

## Useful commands

```powershell
kubectl describe pod <pod-name> -n doctor365
kubectl logs deployment/gateway -n doctor365
kubectl rollout restart deployment/gateway -n doctor365
kubectl delete -k infra/k8s
```
