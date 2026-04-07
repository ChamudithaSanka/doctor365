const DEFAULT_PATIENT_SERVICE_URL = 'http://localhost:5000';

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);

  if (!response.ok) {
    return null;
  }

  return response.json();
};

const getPatientPhone = async (authorizationHeader) => {
  if (!authorizationHeader) {
    return null;
  }

  const patientServiceUrl = process.env.PATIENT_SERVICE_URL || DEFAULT_PATIENT_SERVICE_URL;
  const result = await fetchJson(`${patientServiceUrl}/api/patients/me`, {
    headers: {
      Authorization: authorizationHeader,
    },
  });

  return result?.data?.phone || null;
};

module.exports = {
  getPatientPhone,
};