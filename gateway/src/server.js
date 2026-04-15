const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { createProxyMiddleware } = require("http-proxy-middleware");

dotenv.config();

const app = express();

app.use(cors());

const PORT = process.env.PORT || 5000;

const services = {
  auth: process.env.AUTH_SERVICE_URL || "http://localhost:5001",
  patient: process.env.PATIENT_SERVICE_URL || "http://localhost:5002",
  doctor: process.env.DOCTOR_SERVICE_URL || "http://localhost:5003",
  appointment: process.env.APPOINTMENT_SERVICE_URL || "http://localhost:5004",
  telemedicine: process.env.TELEMEDICINE_SERVICE_URL || "http://localhost:5005",
  payment: process.env.PAYMENT_SERVICE_URL || "http://localhost:5006",
  notification: process.env.NOTIFICATION_SERVICE_URL || "http://localhost:5007",
};

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "gateway",
    port: PORT,
  });
});

// Proxy middleware configuration - preserves Authorization header
const proxyConfig = {
  changeOrigin: true,
  onProxyReq: (proxyReq, req) => {
    // Preserve Authorization header for protected routes
    if (req.headers.authorization) {
      proxyReq.setHeader('Authorization', req.headers.authorization);
    }
  },
};

app.use(
  "/api/auth",
  createProxyMiddleware({
    target: `${services.auth}/auth`,
    changeOrigin: true,
    onProxyReq: proxyConfig.onProxyReq,
  })
);

app.use(
  "/api/patients",
  createProxyMiddleware({
    target: `${services.patient}/api/patients`,
    changeOrigin: true,
    onProxyReq: proxyConfig.onProxyReq,
  })
);

app.use(
  "/api/doctors",
  createProxyMiddleware({
    target: `${services.doctor}/api/doctors`,
    changeOrigin: true,
    onProxyReq: proxyConfig.onProxyReq,
  })
);

app.use(
  "/api/appointments",
  createProxyMiddleware({
    target: `${services.appointment}/api/appointments`,
    changeOrigin: true,
    onProxyReq: proxyConfig.onProxyReq,
  })
);

app.use(
  "/api/telemedicine",
  createProxyMiddleware({
    target: `${services.telemedicine}/api/telemedicine`,
    changeOrigin: true,
    onProxyReq: proxyConfig.onProxyReq,
  })
);

app.use(
  "/api/payments",
  createProxyMiddleware({
    target: `${services.payment}/payments`,
    changeOrigin: true,
    onProxyReq: proxyConfig.onProxyReq,
  })
);

app.use(
  "/api/notifications",
  createProxyMiddleware({
    target: `${services.notification}/notifications`,
    changeOrigin: true,
    onProxyReq: proxyConfig.onProxyReq,
  })
);

app.listen(PORT, () => {
  console.log(`gateway running on port ${PORT}`);
});
