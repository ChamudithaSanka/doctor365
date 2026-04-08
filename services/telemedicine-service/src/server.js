const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const connectDB = require("./config/db");
const telemedicineRoutes = require("./routes/telemedicineRoutes");
const errorMiddleware = require("./middleware/errorMiddleware");
const { getJitsiConfig } = require("./utils/jitsiUtils");

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

// Telemedicine Routes (all protected)
app.use("/telemedicine", telemedicineRoutes);

// Error handling middleware (must be last)
app.use(errorMiddleware);

const PORT = process.env.PORT || 5005;

async function startServer() {
  try {
    await connectDB();

    // Log Jitsi configuration on startup
    const jitsiConfig = getJitsiConfig();
    console.log(`\n📞 JITSI CONFIGURATION:`);
    console.log(`   Mode: ${jitsiConfig.mode || 'N/A'}`);
    console.log(`   Domain: ${jitsiConfig.domain || 'N/A'}`);
    console.log(`   JWT Enabled: ${jitsiConfig.jwtEnabled || false}`);
    console.log(`   App ID: ${jitsiConfig.appId ? '✓ Configured' : 'Not configured'}`);
    console.log(`   App Secret: ${jitsiConfig.appSecret ? '✓ Configured' : 'Not configured'}\n`);

    app.listen(PORT, () => {
      console.log(`${process.env.SERVICE_NAME || "telemedicine-service"} running on port ${PORT}`);
      console.log(`🎥 Ready to create SECURE Jitsi meetings with JWT authentication ✨`);
      console.log(`🔑 Test token generation: POST /generate-token (development only)\n`);
    });
  } catch (error) {
    console.error("Service startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
