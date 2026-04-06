const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const telemedicineRoutes = require("./routes/telemedicineRoutes");
const errorMiddleware = require("./middleware/errorMiddleware");

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

// Routes
app.use("/telemedicine", telemedicineRoutes);

// Error handling middleware (must be last)
app.use(errorMiddleware);

const PORT = process.env.PORT || 5005;

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`${process.env.SERVICE_NAME || "telemedicine-service"} running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Service startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
