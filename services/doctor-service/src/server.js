const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const doctorRoutes = require("./routes/doctorRoutes");
const errorHandler = require("./middleware/errorMiddleware");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: process.env.SERVICE_NAME || "doctor-service",
  });
});

// Routes
app.use("/api/doctors", doctorRoutes);

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5003;

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`${process.env.SERVICE_NAME || "doctor-service"} running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Service startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
