# Notification System Design

## Architecture Overview
The architecture of the system follows a classic Client-Server approach where there are two layers - the frontend made up of React applications and the backend comprising of Node.js and Express services. Additionally, there is logging middleware built as part of the project that can be deployed alongside frontend and backend.

### Components
1. **Frontend (`notification_app_fe`)**:
   - Framework - React.js and Next.js
Manages and sends requests for notification logic
Uses logging middleware to report errors and events.

2. **Backend (`notification_app_be`)**:
   - Framework - Node.js and Express.js, Material ui
Offers REST APIs for handling notifications.
Performs authentication, validations and manages processing of notifications.
Uses logging middleware to record logs, track requests and errors.

3. **Logging Middleware (`logging_middleware`)**:
   - Custom built and deployed Node module used by either backend and/or frontend (or backend alone with API endpoint exposed).
Handles transmission of logs from application to central Test Server using Log(stack, level, package, message) method.

## Detailed Design
### Logging Flowx
- Any relevant success, error, debug or warning messages trigger the Log method.
Middleware obtains Authorization Token from the Configuration Client ID and Client Secret values.
Sends an HTTP POST request to http://20.207.122.201/evaluation-service/logs

### Security and Authentication
- JWT Bearer token is fetched dynamically using the Evaluation Service's /auth API

## Tech Stack
- Frontend - React and Next.js
Backend - Node.js, Express.js
Internal requests to logging service - Fetch API
