const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: process.env.SERVICE_NAME || "telemedicine-service",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`${process.env.SERVICE_NAME || "telemedicine-service"} running on port ${PORT}`);
});
