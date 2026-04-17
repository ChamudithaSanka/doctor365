const SymptomAnalysis = require("../models/SymptomAnalysis");
const { analyzeWithGroq } = require("../config/groqClient");

const analyzeSymptoms = async (req, res) => {
  try {
    const { symptoms, userId } = req.body;

    if (!symptoms || symptoms.length < 5) {
      return res.status(400).json({ error: "Symptoms required (at least 5 characters)" });
    }

    // Save initial record
    const analysis = new SymptomAnalysis({
      userId: userId || "anonymous",
      symptoms,
      analysis: {}
    });

    // Get AI analysis
    const aiAnalysis = await analyzeWithGroq(symptoms);
    analysis.analysis = aiAnalysis;
    
    await analysis.save();

    res.status(201).json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error("Error analyzing symptoms:", error.message);
    res.status(500).json({ error: error.message });
  }
};

const getHistory = async (req, res) => {
  try {
    const { userId } = req.query;
    const filter = userId ? { userId } : {};
    
    const analyses = await SymptomAnalysis.find(filter)
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: analyses
    });
  } catch (error) {
    console.error("Error fetching history:", error.message);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { analyzeSymptoms, getHistory };
