$folders = @(
  "services/auth-service",
  "services/patient-service",
  "services/doctor-service",
  "services/appointment-service",
  "services/telemedicine-service",
  "services/payment-service",
  "services/notification-service"
)

foreach ($f in $folders) {
  Push-Location $f
  npm init -y
  npm install express dotenv cors mongoose jsonwebtoken bcrypt
  Pop-Location
}