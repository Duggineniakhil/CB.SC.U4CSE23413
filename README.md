# Notification System

This repository contains the Full Stack track assignment implementation for the Notification System.

## Project Structure

The project is divided into the following key components:

- `logging_middleware`: A reusable Node.js package that logs application events securely.
- `notification_app_be`: An Express.js backend application serving REST APIs.
- `notification_app_fe`: A React (Vite) frontend application implementing the UI with Material UI.
- `notification_system_design.md`: The system architecture and design documentation.

## Running the Application

### 1. Backend

Navigate to the `notification_app_be` directory:

```bash
cd notification_app_be
npm install
node index.js
```

The backend server will run on `http://localhost:5000`.

### 2. Frontend

Navigate to the `notification_app_fe` directory:

```bash
cd notification_app_fe
npm install
npm run dev
```

The frontend development server will typically start on `http://localhost:5173`.

### 3. Usage

- Open the frontend URL in your browser.
- You can view the list of fetched notifications.
- Use the input field to create a new notification, which will trigger the API.
- The `logging_middleware` will automatically authenticate and log events (success, error, etc.) to the central logging server during API calls.
