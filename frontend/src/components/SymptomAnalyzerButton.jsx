import { useState, useEffect } from 'react'

const TypewriterChat = ({ data, speed = 15 }) => {
  const [displayedText, setDisplayedText] = useState('')

  useEffect(() => {
    // Format the complete message
    let fullMessage = ''

    // Emergency warning
    if (data.analysis.emergency_signs) {
      fullMessage += `🚨 EMERGENCY WARNING\n${data.analysis.emergency_signs}\n\n`
    }

    // Urgency level
    const urgencyEmoji = {
      low: '🟢',
      moderate: '🟡',
      high: '🔴',
    }
    fullMessage += `${urgencyEmoji[data.analysis.urgency] || '⚪'} URGENCY LEVEL: ${data.analysis.urgency.toUpperCase()}\n`
    if (data.analysis.urgency === 'low') {
      fullMessage += 'Monitor symptoms. No immediate action required.\n\n'
    } else if (data.analysis.urgency === 'moderate') {
      fullMessage += 'Schedule a doctor appointment within a few days.\n\n'
    } else {
      fullMessage += 'Seek medical attention soon, consider urgent care.\n\n'
    }

    // Clinical Summary
    fullMessage += `📋 CLINICAL SUMMARY\n${data.analysis.summary}\n\n`

    // Recommended Specialties with special marker
    if (data.analysis.specialties && data.analysis.specialties.length > 0) {
      fullMessage += `👨‍⚕️ RECOMMENDED DOCTOR SPECIALTIES\n`
      data.analysis.specialties.forEach((spec) => {
        fullMessage += `[SPECIALTY]• ${spec.name}[/SPECIALTY]: ${spec.reason}\n`
      })
      fullMessage += '\n'
    }

    // Suggestions
    if (data.analysis.suggestions && data.analysis.suggestions.length > 0) {
      fullMessage += `💊 HEALTH RECOMMENDATIONS\n`
      data.analysis.suggestions.forEach((suggestion) => {
        fullMessage += `✓ ${suggestion}\n`
      })
    }

    let index = 0
    const interval = setInterval(() => {
      if (index <= fullMessage.length) {
        setDisplayedText(fullMessage.substring(0, index))
        index++
      } else {
        clearInterval(interval)
      }
    }, speed)

    return () => clearInterval(interval)
  }, [data, speed])

  // Parse and render text with specialty highlighting
  const renderText = (text) => {
    const parts = text.split(/(\[SPECIALTY\].*?\[\/SPECIALTY\])/g)
    
    return parts.map((part, idx) => {
      if (part.startsWith('[SPECIALTY]') && part.endsWith('[/SPECIALTY]')) {
        const specialty = part.replace('[SPECIALTY]', '').replace('[/SPECIALTY]', '')
        return (
          <span key={idx} className="bg-blue-200 text-blue-900 font-bold px-1 rounded">
            {specialty}
          </span>
        )
      }
      return <span key={idx}>{part}</span>
    })
  }

  return <div>{renderText(displayedText)}</div>
}

const SymptomAnalyzerButton = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [symptoms, setSymptoms] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const gatewayBaseUrl = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:5000'

  const handleAnalyze = async (e) => {
    e.preventDefault()
    if (!symptoms.trim()) {
      setError('Please describe your symptoms')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${gatewayBaseUrl}/api/symptoms/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('doctor365_token') || ''}`,
        },
        body: JSON.stringify({
          symptoms,
          userId: JSON.parse(localStorage.getItem('doctor365_user') || '{}').id || 'anonymous',
        }),
      })

      if (!response.ok) throw new Error('Failed to analyze symptoms')
      const data = await response.json()
      setResult(data.data)
      setSymptoms('')
    } catch (err) {
      setError(err.message || 'Failed to analyze symptoms. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 h-16 w-16 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-110 flex items-center justify-center animate-pulse hover:animate-none"
        title="AI Health Assistant"
      >
        <svg
          className="w-8 h-8"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
        </svg>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-6 flex justify-between items-center sticky top-0 shrink-0">
              <div>
                <h2 className="text-2xl font-bold">🤖 AI Health Assistant</h2>
                <p className="text-sm text-blue-100 mt-1">Professional Symptom Analysis</p>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false)
                  setResult(null)
                  setError(null)
                }}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {!result ? (
                <form onSubmit={handleAnalyze} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Describe Your Symptoms
                    </label>
                    <textarea
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      placeholder="e.g., I have a persistent headache, neck stiffness, fever, and fatigue for the past 3 days..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={5}
                      disabled={loading}
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                      ⚠️ {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        Analyzing Symptoms...
                      </>
                    ) : (
                      <>
                        <span>🔍</span>
                        Get AI Analysis
                      </>
                    )}
                  </button>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                    <p className="font-semibold mb-1">💡 Tips for better analysis:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Be specific about symptoms and duration</li>
                      <li>Mention any recent illnesses or medications</li>
                      <li>Describe pain location and intensity</li>
                    </ul>
                  </div>

                  <p className="text-xs text-gray-500 text-center border-t pt-4">
                    ⚠️ <strong>Important:</strong> This is an AI assistant for preliminary guidance only. Always consult a licensed doctor for medical advice.
                  </p>
                </form>
              ) : (
                <div className="space-y-4">
                  {/* ChatGPT Style Response Container */}
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 min-h-[300px]">
                    <div className="text-gray-800 text-sm leading-relaxed font-mono whitespace-pre-wrap break-words">
                      <TypewriterChat data={result} speed={15} />
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                    <p>🏥 <strong>Next Step:</strong> Book an appointment with a recommended specialist for proper diagnosis and treatment</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => {
                        setResult(null)
                        setSymptoms('')
                        setError(null)
                      }}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 rounded-lg transition"
                    >
                      ← New Analysis
                    </button>
                    <button
                      onClick={() => {
                        setIsOpen(false)
                        setResult(null)
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
                    >
                      Close ✕
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default SymptomAnalyzerButton
