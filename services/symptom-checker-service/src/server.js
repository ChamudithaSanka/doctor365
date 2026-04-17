const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const symptomRoutes = require("./routes/symptomRoutes");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: process.env.SERVICE_NAME || "symptom-checker-service"
  });
});

app.use("/symptoms", symptomRoutes);

const PORT = process.env.PORT || 5008;

async function startServer() {
  try {
    await connectDB();

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`${process.env.SERVICE_NAME || "symptom-checker-service"} running on port ${PORT}`);
    });

    server.on('error', (error) => {
      console.error("Server error:", error.message);
      process.exit(1);
    });
  } catch (error) {
    console.error("Service startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
