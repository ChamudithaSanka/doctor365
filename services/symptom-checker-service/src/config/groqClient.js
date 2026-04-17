const axios = require("axios");

const analyzeWithGroq = async (symptoms) => {
  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are a professional medical assistant. Analyze symptoms and provide detailed response in JSON format:
{
  "summary": "Brief professional medical summary (2-3 sentences)",
  "urgency": "low|moderate|high",
  "specialties": [
    {
      "name": "Specialty Name",
      "reason": "Why this specialist is recommended"
    }
  ],
  "suggestions": [
    "Professional health recommendation"
  ],
  "emergency_signs": "List any warning signs that need immediate attention or null"
}`
          },
          {
            role: "user",
            content: `Please analyze these symptoms and recommend doctor specialties: ${symptoms}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`
        },
        timeout: 30000
      }
    );

    const content = response.data.choices[0].message.content;
    const parsed = JSON.parse(content);
    
    return {
      summary: parsed.summary,
      suggestions: parsed.suggestions || [],
      specialties: parsed.specialties || [],
      urgency: parsed.urgency || "moderate",
      emergency_signs: parsed.emergency_signs
    };
  } catch (error) {
    console.error("Groq API Error:", error.message);
    throw new Error("Failed to analyze symptoms");
  }
};

module.exports = { analyzeWithGroq };
