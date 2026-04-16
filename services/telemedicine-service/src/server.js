const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const connectDB = require("./config/db");
const telemedicineRoutes = require("./routes/telemedicineRoutes");
const errorHandler = require("./middleware/errorMiddleware");
const { getAgoraConfig } = require("./utils/agoraUtils");

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint (public)
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: process.env.SERVICE_NAME || "telemedicine-service",
    agoraConfig: getAgoraConfig(),
  });
});

// Test Token Generation (Development/Testing Only)
// Usage: POST /generate-token with { userId, email, role }
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

    const { userId, email, role } = req.body;

    // Validate required fields
    if (!userId || !email || !role) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'userId, email, and role are required'
        }
      });
    }

    const token = jwt.sign(
      { userId, email, role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      success: true,
      token,
      payload: { userId, email, role },
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

// Debug endpoint - Agora configuration status
app.get("/debug/agora-config", (req, res) => {
  const config = getAgoraConfig();
  res.status(200).json({
    success: true,
    agoraConfig: config,
    appIdValue: process.env.AGORA_APP_ID,
    appCertificateValue: process.env.AGORA_APP_CERTIFICATE ? 'Set' : 'Not set',
    message: 'Agora configuration status',
  });
});

// Test endpoint - Generate a sample token (development only)
app.get("/debug/test-token/:channelName", (req, res) => {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({
        success: false,
        error: 'Debug endpoint only available in development mode'
      });
    }
    
    const { channelName } = req.params;
    const { createMeeting } = require('./utils/agoraUtils');
    
    const meetingData = createMeeting(channelName, 1, 2);
    
    res.status(200).json({
      success: true,
      data: meetingData,
      message: 'Test token generated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Telemedicine routes
app.use("/api/telemedicine", telemedicineRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5005;

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`${process.env.SERVICE_NAME || "telemedicine-service"} running on port ${PORT}`);
      const config = getAgoraConfig();
      console.log(`🎥 Agora Integration: ${config.isValid ? '✅ Enabled' : '❌ Disabled'}`);
      console.log(`   App ID: ${config.appId}`);
      console.log(`   App Certificate: ${config.appCertificate}`);
      console.log(`🔑 Test token generation: POST /generate-token (development only)\n`);
    });
  } catch (error) {
    console.error("Service startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
