import { useState, useEffect } from 'react'
import { analyzeSymptoms, specialtyDescriptions } from '../../utils/symptomChecker'

const urgencyColors = {
  low: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', label: 'Low - Routine checkup' },
  moderate: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', label: 'Moderate - Within days' },
  high: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', label: 'High - Same day consultation' },
}

export default function SymptomChecker() {
  const [symptoms, setSymptoms] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [typingIndex, setTypingIndex] = useState(0)
  const [fullText, setFullText] = useState('')

  // Typing effect
  useEffect(() => {
    if (!result) {
      setTypingIndex(0)
      setFullText('')
      return
    }

    // Combine all text sections
    let combined = ''
    combined += `📋 ANALYSIS SUMMARY\n${result.summary || ''}\n\n`
    
    if (result.suggestions && result.suggestions.length > 0) {
      combined += `💊 HEALTH SUGGESTIONS\n`
      result.suggestions.forEach((suggestion, idx) => {
        combined += `${idx + 1}. ${suggestion}\n`
      })
      combined += '\n'
    }

    if (result.specialties && result.specialties.length > 0) {
      combined += `🏥 RECOMMENDED DOCTOR SPECIALTIES\n`
      result.specialties.forEach((specialty) => {
        combined += `• ${specialty}\n`
      })
      combined += '\n'
    }

    if (result.emergency_warning) {
      combined += `⚠️ EMERGENCY WARNING\n${result.emergency_warning}\n\n`
    }

    combined += `🚀 URGENCY LEVEL: ${(result.urgency_level || 'moderate').toUpperCase()}\n${urgencyColors[result.urgency_level]?.label || ''}`

    setFullText(combined)

    if (typingIndex < combined.length) {
      const timer = setTimeout(() => {
        setTypingIndex(typingIndex + 1)
      }, 20)
      return () => clearTimeout(timer)
    }
  }, [result, typingIndex])

  const handleAnalyze = async () => {
    setError('')
    setResult(null)
    setTypingIndex(0)

    if (!symptoms.trim()) {
      setError('Please describe your symptoms to continue.')
      return
    }

    if (symptoms.length < 10) {
      setError('Please provide more detail about your symptoms.')
      return
    }

    setLoading(true)

    try {
      const analysisResult = await analyzeSymptoms(symptoms)
      setResult(analysisResult)
      setSymptoms('')
    } catch (err) {
      setError(err.message || 'Failed to analyze symptoms. Please try again.')
      console.error('Analysis error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setSymptoms('')
    setError('')
    setResult(null)
  }

  return (
    <div className="space-y-6">
      {/* Disclaimer */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex gap-4">
          <div className="shrink-0">
            <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 text-sm">Important Medical Disclaimer</h3>
            <p className="mt-1 text-xs text-blue-800">
              This AI analysis is for educational purposes only and is <strong>NOT a medical diagnosis</strong>. 
              Always consult with a qualified healthcare provider. In emergencies, call 911.
            </p>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <label className="block text-sm font-semibold text-slate-900 mb-2">
            Describe Your Symptoms
          </label>
          <textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="Describe your symptoms: e.g., 'persistent headache for 2 days with mild fever'"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            rows={4}
            disabled={loading}
          />

          {error && (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {error}
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <button
              onClick={handleAnalyze}
              disabled={loading || !symptoms.trim()}
              className="flex-1 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Analyzing...
                </span>
              ) : (
                '🔍 Analyze'
              )}
            </button>
            <button
              onClick={handleReset}
              disabled={loading}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Emergency Warning */}
          {result.emergency_warning && (
            <div className="rounded-2xl border border-red-300 bg-red-50 p-4">
              <div className="flex gap-3">
                <svg className="h-5 w-5 shrink-0 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="font-semibold text-red-900 text-sm">⚠️ Emergency Warning</h3>
                  <p className="mt-1 text-xs text-red-800">{result.emergency_warning}</p>
                </div>
              </div>
            </div>
          )}

          {/* AI Response */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <textarea
              readOnly
              value={fullText.substring(0, typingIndex)}
              className="w-full h-64 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 font-mono resize-none focus:outline-none"
            />
            {typingIndex < fullText.length && (
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Generating response...</span>
              </div>
            )}
          </div>

          {/* Find Doctors */}
          {result.specialties && result.specialties.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Find Specialists</h3>
              <div className="grid gap-2">
                {result.specialties.map((specialty) => (
                  <a
                    key={specialty}
                    href="/doctors"
                    className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-center font-semibold text-blue-700 hover:bg-blue-100 transition"
                  >
                    Find {specialty}s →
                  </a>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleReset}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            Try Another Symptom
          </button>
        </div>
      )}
    </div>
  )
}
