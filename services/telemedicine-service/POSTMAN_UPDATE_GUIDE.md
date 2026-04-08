# 🔄 Postman Collection - Update Guide

**Version**: 1.1 (Updated April 8, 2026)  
**Status**: ⚠️ Collection needs updates

---

## 📋 What Changed in the Telemedicine Service

Your changes to the service introduced **new error codes**, **enhanced validation**, and **improved response structures**. The Postman collection tests need updates to match.

---

## ✅ Full Update Checklist

### 1. **New Error Codes to Test** ❌→✅

Add test cases for these new error codes:

| Error Code | HTTP Status | When It Occurs | Test Name |
|---|---|---|---|
| `INVALID_APPOINTMENT_ID` | 400 | Bad appointment ID format (not MongoDB ObjectId) | Create Session - Invalid Format |
| `INVALID_SESSION_ID` | 400 | Bad session ID format | Get/Start/End Session - Invalid Format |
| `INVALID_AUTH_FORMAT` | 401 | Missing "Bearer " prefix in Authorization | Invalid Auth Format |
| `NO_AUTH_HEADER` | 401 | Missing Authorization header entirely | Missing Auth Header |
| `TOKEN_EXPIRED` | 401 | JWT token has expired | Token Expired |
| `INVALID_TOKEN` | 401 | JWT token is malformed/invalid | Invalid Token |
| `INVALID_PAYLOAD` | 401 | Token missing userId, email, role | Invalid Token Payload |
| `CONFLICT` | 409 | Duplicate session already exists | Create - Duplicate Session |
| `NOT_FOUND` | 404 | Resource doesn't exist | Get Non-existent Session |
| `FORBIDDEN` | 403 | User lacks permission (now includes role info) | Patient tries doctor operation |
| `INVALID_STATE` | 400 | Cannot transition state (e.g., start already-active) | Start Active Session |

---

### 2. **Updated Response Structures**

#### **endSession Response (CHANGED)**

**OLD Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "...",
    "status": "ended",
    "startedAt": "...",
    "endedAt": "...",
    "duration": 25
  },
  "message": "Session ended successfully"
}
```

**NEW Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "...",
    "appointmentId": "...",
    "status": "ended",
    "consultationSummary": {
      "startedAt": "...",
      "endedAt": "...",
      "durationMinutes": 25
    },
    "clinicalNotes": "Patient notes here...",
    "createdAt": "...",
    "updatedAt": "..."
  },
  "message": "Session ended successfully. Consultation completed."
}
```

**Action**: Update Postman test script for endSession folder:
```javascript
pm.test('Response has consultationSummary', function() {
  let response = pm.response.json();
  pm.expect(response.data.consultationSummary).to.have.all.keys(
    'startedAt', 'endedAt', 'durationMinutes'
  );
});
```

---

#### **getSessionById Response (ENHANCED)**

Now includes more fields. Update test for complete structure:
```javascript
pm.test('Session has all required fields', function() {
  let response = pm.response.json();
  pm.expect(response.data).to.have.all.keys(
    'sessionId', 'appointmentId', 'doctorId', 'patientId',
    'meetingProvider', 'meetingRoomId', 'meetingLink', 'status',
    'startedAt', 'endedAt', 'duration', 'notes',
    'createdAt', 'updatedAt'
  );
});
```

---

#### **Error Response Format (IMPROVED)**

Error messages now include more context. Examples:
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "This operation requires one of these roles: doctor. Your role: patient"
  }
}
```

```json
{
  "success": false,
  "error": {
    "code": "INVALID_STATE",
    "message": "Cannot start session. Current status: active. Must be scheduled."
  }
}
```

---

### 3. **New Tests to Add**

#### **Add: ObjectId Format Validation Tests**

Create Session folder → Add new test "Invalid Appointment ID Format":
```
POST {{service_url}}/api/telemedicine/sessions
Authorization: Bearer {{doctor_token}}
Body: { "appointmentId": "invalid-id", "patientId": "pat-001" }
Expected: 400 INVALID_APPOINTMENT_ID
```

GetSessionById folder → Add new test "Invalid Session ID Format":
```
GET {{service_url}}/api/telemedicine/sessions/not-a-valid-id
Authorization: Bearer {{doctor_token}}
Expected: 400 INVALID_SESSION_ID
```

StartSession folder → Add new test "Invalid Session ID Format":
```
PATCH {{service_url}}/api/telemedicine/sessions/not-a-valid-id/start
Authorization: Bearer {{doctor_token}}
Expected: 400 INVALID_SESSION_ID
```

EndSession folder → Add new test "Invalid Session ID Format":
```
PATCH {{service_url}}/api/telemedicine/sessions/not-a-valid-id/end
Authorization: Bearer {{doctor_token}}
Body: { "notes": "test" }
Expected: 400 INVALID_SESSION_ID
```

---

#### **Add: Auth Header Format Tests**

Error Scenarios folder → Add new test "Invalid Auth Format (missing Bearer)":
```
GET {{service_url}}/api/telemedicine/sessions
Authorization: abc123xyz (no "Bearer " prefix)
Expected: 401 INVALID_AUTH_FORMAT
Message: "Authorization header must be in format: Bearer <token>"
```

---

#### **Add: State Transition Error Tests**

StartSession folder → Add "Start Already-Active Session (400)":
```
1. Create session (status: scheduled)
2. PATCH /start (status: active)
3. PATCH /start again (SHOULD FAIL)
Expected: 400 INVALID_STATE
Message: "Cannot start session. Current status: active. Must be scheduled."
```

EndSession folder → Add "End Scheduled Session (400)":
```
1. Create session (status: scheduled)
2. PATCH /end (SHOULD FAIL - not active yet)
Expected: 400 INVALID_STATE
Message: "Cannot end session. Current status: scheduled. Must be active."
```

---

#### **Add: Field Validation Tests**

EndSession folder → Add "Notes Too Long (400)":
```
PATCH {{service_url}}/api/telemedicine/sessions/{{session_id}}/end
Authorization: Bearer {{doctor_token}}
Body: { "notes": "<1001 character string>" }
Expected: 400 VALIDATION_ERROR
Message: "Notes cannot exceed 1000 characters"
```

---

### 4. **Update Error Response Assertions**

Find every test that checks error codes and update:

**OLD:**
```javascript
pm.test('Returns unauthorized error', function() {
  pm.expect(pm.response.json().error.code).to.equal('UNAUTHORIZED');
});
```

**NEW:**
```javascript
pm.test('Returns forbidden error', function() {
  pm.expect(pm.response.json().error.code).to.equal('FORBIDDEN');
});
```

---

### 5. **Enhanced Message Assertions**

Update error message checks to be less strict:

**OLD:**
```javascript
pm.test('Error message specific', function() {
  let msg = pm.response.json().error.message;
  pm.expect(msg).to.equal('You do not have permission to perform this action');
});
```

**NEW:**
```javascript
pm.test('Error message includes role info', function() {
  let msg = pm.response.json().error.message;
  pm.expect(msg).to.include('does not have permission');
  pm.expect(msg).to.include('Your role:');
});
```

---

## 🔍 Side-by-Side: Folder Updates Needed

| Folder | Changes | Action |
|---|---|---|
| **02. Create Session** | Add "Invalid Appointment ID Format (400)" | ✅ Add new test |
| **03. Get Sessions** | Add "Invalid Session/Appointment ID (400)" | ✅ Add new tests |
| **04. Start Session** | Add "Invalid Session ID (400)", Update state error | ✅ Add & update tests |
| **05. End Session** | Update response structure, add validation tests | ✅ Update tests |
| **06. Error Scenarios** | Add "Invalid Auth Format", "Auth Header Missing" | ✅ Add new tests |

---

## 📝 Implementation Strategy

### Option 1: Quick Manual Updates (5 min)
1. Open Postman collection in editor
2. Search for old error codes and replace
3. Update endSession response structure checks
4. Add new "Invalid Format" test requests

### Option 2: Replace Entire Collection (Recommended)
- Delete current `Doctor365_Telemedicine_Complete.postman_collection.json`
- Import the updated collection (v1.1) provided in this guide

---

## ✅ Validation Checklist

After updating, verify these scenarios work:

- [ ] Create session with invalid appointment ID → 400 INVALID_APPOINTMENT_ID
- [ ] Get session with invalid session ID → 400 INVALID_SESSION_ID
- [ ] Start session with invalid session ID → 400 INVALID_SESSION_ID
- [ ] End session with invalid session ID → 400 INVALID_SESSION_ID
- [ ] Missing Authorization header → 401 NO_AUTH_HEADER
- [ ] Wrong Authorization format (no Bearer) → 401 INVALID_AUTH_FORMAT
- [ ] Start already-active session → 400 INVALID_STATE
- [ ] End scheduled session (not active) → 400 INVALID_STATE
- [ ] End session with >1000 char notes → 400 VALIDATION_ERROR
- [ ] Create duplicate session → 409 CONFLICT
- [ ] Patient tries to create session → 403 FORBIDDEN (includes role)
- [ ] Patient tries to start session → 403 FORBIDDEN (includes role)
- [ ] Patient tries to end session → 403 FORBIDDEN (includes role)
- [ ] End session returns consultationSummary with durationMinutes → 200 OK
- [ ] Response includes clinicalNotes field → 200 OK

---

## 🔗 Key Reference Files

- **Updated Controller**: [telemedicineController.js](./src/controllers/telemedicineController.js)
- **Updated Middleware**: [authMiddleware.js](./src/middleware/authMiddleware.js)
- **Full Error Codes**: See line comments in each endpoint
- **Response Examples**: See ARCHITECTURE_REFERENCE.md

---

## 💡 Pro Tips

1. **Use Postman Variables**: Keep environment variables consistent
2. **Run Collections**: Execute full workflow to catch cascading errors
3. **Check Console**: Look at test script console output for details
4. **Compare Responses**: Use Postman's response preview to verify structure

---

## 🚀 Next Steps

1. ✅ Review the changes above
2. ✅ Manually update error code tests
3. ✅ Add new format validation tests
4. ✅ Update endSession response checks
5. ✅ Run full collection workflow
6. ✅ Verify all tests pass

---

## 📞 Quick Reference: New Error Codes

```
✅ Test these new codes:
- INVALID_APPOINTMENT_ID (400)
- INVALID_SESSION_ID (400)
- INVALID_AUTH_FORMAT (401)
- NO_AUTH_HEADER (401)
- TOKEN_EXPIRED (401)
- INVALID_PAYLOAD (401)
- CONFLICT (409)
- NOT_FOUND (404)
- FORBIDDEN (403) - Now with role info
- INVALID_STATE (400) - With current status info
```

---

**Status**: ⚠️ Collection needs manual updates  
**Effort**: ~15 minutes  
**Complexity**: Low (mostly adding new test cases)  

See [VERIFICATION_REPORT.md](./VERIFICATION_REPORT.md) for detailed pattern references.
