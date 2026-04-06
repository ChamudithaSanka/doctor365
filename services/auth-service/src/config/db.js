const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 5000,
  });
  console.log(`${process.env.SERVICE_NAME || "service"} connected to MongoDB`);
}

module.exports = connectDB;
