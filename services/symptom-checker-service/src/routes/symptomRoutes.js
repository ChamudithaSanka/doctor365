const express = require("express");
const { analyzeSymptoms, getHistory } = require("../controllers/symptomController");

const router = express.Router();

// Analyze symptoms with AI
router.post("/analyze", analyzeSymptoms);

// Get analysis history
router.get("/history", getHistory);

module.exports = router;
