# AI Symptom Checker Service Setup Guide

## Overview
The AI Symptom Checker is an optional enhancement that allows patients to input their symptoms and receive preliminary health suggestions with recommended doctor specialties using Google Gemini API.

## Setup Instructions

### 1. Get Google Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Click "Create API Key in new project" or use an existing project
3. Copy your API key

### 2. Configure Environment Variable

Add the API key to your frontend `.env` file:

```bash
# .env or .env.local
VITE_GOOGLE_GEMINI_API_KEY=your_api_key_here
```

**Important:** 
- Never commit API keys to version control
- For production, use environment variables from your deployment platform
- Keep the free tier rate limits in mind (60 requests/minute)

### 3. Features

The Symptom Checker provides:

✅ **Symptom Analysis**
- Patients describe their symptoms in detail
- AI analyzes and provides a summary

✅ **Preliminary Suggestions**
- General health recommendations
- Wellness measures
- When to seek care

✅ **Specialty Recommendations**
- Suggests relevant doctor specialties
- Direct links to find matching doctors
- Specialty descriptions included

✅ **Urgency Assessment**
- Low: Routine checkup
- Moderate: Seek care within days
- High: Same-day consultation needed

✅ **Emergency Warnings**
- Flags serious/emergency symptoms
- Advises immediate medical attention

## Files Created

### Frontend Components
- `frontend/src/pages/patient/SymptomChecker.jsx` - Main UI component
- `frontend/src/utils/symptomChecker.js` - AI integration utility

### Integration Points
- **App.jsx** - Added route `/patient/symptom-checker`
- **AppShell.jsx** - Added navigation link in patient menu

## User Flow

1. Patient accesses "Symptom Checker" from dashboard
2. Reads medical disclaimer
3. Describes symptoms in detail
4. Clicks "Analyze Symptoms"
5. Receives:
   - AI-powered analysis summary
   - Health suggestions (numbered list)
   - Recommended doctor specialties
   - Urgency level assessment
   - Emergency warnings (if applicable)
6. Can click "Find Specialists" to book appointments
7. Can analyze another symptom set

## Important Disclaimers

⚠️ **Always remind users:**
- This is NOT a medical diagnosis
- For educational purposes only
- Should not replace professional medical advice
- Consult with healthcare providers for accurate diagnosis
- In emergencies, seek immediate medical attention

## API Rate Limits

**Google Gemini API (Free Tier):**
- 60 requests per minute
- 1500 requests per day
- Suitable for development and pilot usage

For production scale, consider:
- Paid API tier
- Caching results for common symptoms
- Rate limiting on frontend

## Testing

To test the symptom checker:

1. Ensure API key is configured
2. Navigate to `/patient/symptom-checker` (when logged in as patient)
3. Try various symptom descriptions:
   - Short tests: "headache"
   - Detailed tests: "I have persistent severe headache for 3 days with fever and fatigue"
   - Emergency tests: "chest pain and difficulty breathing"

## Troubleshooting

### "API key is not configured" Error
- Check `.env` file has `VITE_GOOGLE_GEMINI_API_KEY`
- Restart dev server after adding `.env` variables
- Ensure key is valid (test in AI Studio)

### "Rate limit exceeded" Error
- Too many requests in short time
- Implement frontend rate limiting
- Consider upgrade to paid API tier

### "Invalid JSON response" Error
- Gemini API returned non-JSON response
- Check API status/availability
- Try again with more detailed symptoms

## Future Enhancements

Potential improvements:
- Cache common symptom analyses
- Add symptom severity scale (1-10)
- Integration with medical databases
- Multilingual support
- Symptom history tracking
- Doctor specialty ratings
- PDF report generation
- Integration with patient medical history

## Cost Estimation

- Free tier: Up to 1500 requests/day (sufficient for MVP)
- Paid tier: ~$0.0025 per request
- Estimated monthly cost at 1000 req/day: ~$75

## Alternative AI Services

If you want to switch providers:

**OpenAI GPT-4:**
- More capable, higher cost
- File: `frontend/src/utils/symptomChecker.js`
- Update API endpoint and key format

**Hugging Face:**
- Open-source models
- Lower cost, less controlled
- Different API structure

**Azure Cognitive Services:**
- Enterprise option
- Healthcare-specific models
- Higher cost, better support
