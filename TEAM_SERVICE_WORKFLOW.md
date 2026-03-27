# Team Service Workflow

This is the step-by-step process for implementing services in Doctor365.

## 1. Pull Latest Code and Create Branch

- Pull latest code from remote.
- Create your feature branch.

Example:
- git pull
- git checkout -b feature/your-service-work

## 2. Create Environment Files and Install Dependencies

Before starting services, each team member must configure runtime variables.

- Create `.env` in:
  - gateway
  - services/auth-service
  - services/patient-service
  - services/doctor-service
  - services/appointment-service
  - services/telemedicine-service
  - services/payment-service
  - services/notification-service
- Use the same `JWT_SECRET` in all services that issue or verify JWTs.
- Set valid `MONGODB_URI` and `PORT` values for each service.
- Install dependencies in each Node project:
  - gateway
  - all services
  - frontend (if UI testing is needed)

Recommended quick check:
- Verify no required env key is missing before running containers or local services.

## 3. Start Base Services Locally

Before implementing any service logic, make sure these are running:
- Auth Service (port 5001)
- Gateway (port 5000)

Quick checks:
- GET http://localhost:5000/health
- GET http://localhost:5000/api/auth/health

## 4. Set Up Service Skeleton

Ensure your service includes:
- src/models
- src/controllers
- src/routes
- src/middleware
- src/config
- src/server.js

Also ensure:
- MongoDB connection is initialized before app.listen
- CORS and JSON middleware are enabled
- GET /health is implemented

## 5. Implement Agreed Endpoints

Implement only the routes defined in the team guide for your service.

Use standard response format:

Success:
{
  "success": true,
  "data": {},
  "message": "Descriptive success message"
}

Error:
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}

## 6. Add Auth Protection to Private Routes

- Use shared auth middleware for protected endpoints.
- Read token payload from req.user.
- JWT payload contract:
  - userId
  - email
  - role

Return consistent auth failures:
- 401 for missing or invalid token
- 403 for role-forbidden access

## 7. Validate on Direct Service Port First

Test your service directly before gateway testing.

Minimum tests:
- Health endpoint
- Create endpoint
- Read endpoint
- Update endpoint
- Unauthorized negative test
- Validation negative test

## 8. Validate Through Gateway

After direct tests pass, test same routes through gateway.

Examples:
- Direct: http://localhost:500X/...
- Gateway: http://localhost:5000/api/service-prefix/...

Behavior and response format should match direct tests.

## 9. Open PR and Integration Sync

- Push your branch.
- Open a pull request.
- Join integration pass with team.
- Fix route contract mismatches early.

## 10. Suggested Delivery Order

1. Patient and Doctor services
2. Appointment service
3. Notification service
4. Payment and Telemedicine services

This order reduces blockers and enables early end-to-end testing.
