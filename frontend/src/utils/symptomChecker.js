const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export const analyzeSymptoms = async (symptoms) => {
  if (!GROQ_API_KEY) {
    throw new Error('Groq API key is not configured. Please add VITE_GROQ_API_KEY to your environment variables.')
  }

  const systemPrompt = `You are an experienced medical assistant helping patients understand their symptoms. 
Your role is to:
1. Acknowledge their symptoms with empathy
2. Provide preliminary health suggestions (NOT medical diagnosis)
3. Recommend relevant doctor specialties
4. Suggest when to seek immediate medical attention
5. Recommend general wellness measures

IMPORTANT: 
- Always remind that this is NOT a medical diagnosis
- Encourage consulting with healthcare professionals
- Be clear about emergency situations (chest pain, difficulty breathing, severe bleeding, etc.)
- Format your response as JSON with these fields: summary, suggestions, specialties, urgency_level, emergency_warning`

  const userMessage = `Patient symptoms: ${symptoms}

Please analyze these symptoms and provide:
1. A brief summary of what the symptoms might indicate
2. General health suggestions and preliminary recommendations
3. List of recommended doctor specialties (format as array)
4. Urgency level: "low" (routine checkup), "moderate" (within days), or "high" (same day)
5. Any emergency warnings if applicable

Respond ONLY as valid JSON with keys: summary, suggestions, specialties (array), urgency_level, emergency_warning`

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error?.message || `Groq API error: ${response.status}`)
    }

    const data = await response.json()

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from Groq API')
    }

    const responseText = data.choices[0].message.content

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Could not parse AI response as JSON')
    }

    const result = JSON.parse(jsonMatch[0])

    return {
      success: true,
      summary: result.summary || '',
      suggestions: Array.isArray(result.suggestions) ? result.suggestions : [],
      specialties: Array.isArray(result.specialties) ? result.specialties : [],
      urgency_level: result.urgency_level || 'moderate',
      emergency_warning: result.emergency_warning || null,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Symptom analysis error:', error)
    throw error
  }
}

export const specialtyDescriptions = {
  'General Practitioner': 'For general health concerns and initial assessment',
  'Cardiologist': 'For heart and cardiovascular issues',
  'Dermatologist': 'For skin conditions and skin health',
  'Gastroenterologist': 'For digestive system issues',
  'Neurologist': 'For nervous system and brain conditions',
  'Pulmonologist': 'For respiratory and lung issues',
  'Orthopedist': 'For bones, joints, and muscular issues',
  'Rheumatologist': 'For arthritis and immune system diseases',
  'Endocrinologist': 'For hormonal and metabolic disorders',
  'Psychiatrist': 'For mental health and behavioral concerns',
  'ENT Specialist': 'For ear, nose, and throat issues',
  'Ophthalmologist': 'For eye and vision issues',
  'Pediatrician': 'For children\'s health',
  'Gynecologist': 'For women\'s reproductive health',
  'Infectious Disease Specialist': 'For infections and communicable diseases',
}
