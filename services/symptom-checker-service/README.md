# Symptom Checker Service

Simple AI-powered symptom checker microservice using Groq API.

## Setup

```bash
npm install
cp .env.example .env
# Add your GROQ_API_KEY to .env
npm run dev
```

## API Endpoints

### Analyze Symptoms
```
POST /symptoms/analyze
Content-Type: application/json

{
  "symptoms": "headache and fever"
}

Response:
{
  "_id": "...",
  "userId": "user123",
  "symptoms": "headache and fever",
  "analysis": {
    "summary": "...",
    "suggestions": ["..."],
    "urgency": "moderate"
  },
  "createdAt": "2024-01-01T..."
}
```

### Get Analysis History
```
GET /symptoms/history
```

## Environment Variables

- `SERVICE_NAME`: Service name
- `PORT`: Service port (default: 5006)
- `MONGODB_URI`: MongoDB connection string
- `GROQ_API_KEY`: Groq API key
- `NODE_ENV`: Environment (development/production)
