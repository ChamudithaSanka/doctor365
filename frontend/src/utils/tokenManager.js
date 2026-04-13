// Token Manager - handles authentication and token errors gracefully

export const getToken = () => {
  return localStorage.getItem('doctor365_accessToken')
}

export const setToken = (token) => {
  if (token) {
    localStorage.setItem('doctor365_accessToken', token)
  }
}

export const clearToken = () => {
  localStorage.removeItem('doctor365_accessToken')
  localStorage.removeItem('doctor365_refreshToken')
  localStorage.removeItem('doctor365_user')
}

export const handleTokenError = (error) => {
  // Check if error is a 401 Unauthorized (token issue)
  if (error?.response?.status === 401) {
    clearToken()
    // Redirect to login
    window.location.href = '/login?expired=true'
    return true
  }
  return false
}

export const isTokenExpired = () => {
  const token = getToken()
  if (!token) return true

  try {
    // Decode JWT to check expiration
    const parts = token.split('.')
    if (parts.length !== 3) return true

    const decoded = JSON.parse(atob(parts[1]))
    const expirationTime = decoded.exp * 1000 // Convert to milliseconds
    return Date.now() >= expirationTime
  } catch {
    return true
  }
}
