const mongoose = require("mongoose");

const symptomAnalysisSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  symptoms: { type: String, required: true },
  analysis: {
    summary: String,
    suggestions: [String],
    specialties: [
      {
        name: String,
        reason: String
      }
    ],
    urgency: { type: String, enum: ["low", "moderate", "high"], default: "moderate" },
    emergency_signs: String
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("SymptomAnalysis", symptomAnalysisSchema);
