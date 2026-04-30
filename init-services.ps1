$folders = @(
  "services/auth-service",
  "services/patient-service",
  "services/doctor-service",
  "services/appointment-service",
  "services/telemedicine-service",
  "services/payment-service",
  "services/notification-service"
  "services/symptom-checker-service"
)

foreach ($f in $folders) {
  Push-Location $f
  npm i
  Pop-Location
}