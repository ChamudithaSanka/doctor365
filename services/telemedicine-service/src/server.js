const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const connectDB = require("./config/db");

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: process.env.SERVICE_NAME || "telemedicine-service",
  });
});

// Test Token Generation (Development/Testing Only)
// Usage: POST /generate-token with { userId, email, role, name }
app.post("/generate-token", (req, res) => {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Token generation only available in development mode'
        }
      });
    }

    const { userId = "doc-test-123", email = "doctor@test.com", role = "doctor", name = "Test Doctor" } = req.body;

    const token = jwt.sign(
      { userId, email, role, name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      success: true,
      token,
      payload: { userId, email, role, name },
      expiresIn: '24h',
      message: 'Test token generated. Use in Authorization header as: Bearer ' + token
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'TOKEN_GENERATION_ERROR',
        message: error.message
      }
    });
  }
});

const PORT = process.env.PORT || 5005;

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`${process.env.SERVICE_NAME || "telemedicine-service"} running on port ${PORT}`);
      console.log(`🔑 Test token generation: POST /generate-token (development only)\n`);
    });
  } catch (error) {
    console.error("Service startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
