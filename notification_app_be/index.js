const express = require('express');
const cors = require('cors');
const { Log } = require('logging_middleware');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Global middleware for logging every request
app.use(async (req, res, next) => {
  await Log("backend", "info", "middleware", `Incoming ${req.method} request to ${req.url}`);
  next();
});

app.get('/api/notifications', async (req, res) => {
  try {
    await Log("backend", "info", "controller", "Fetching all notifications");
    res.json([
      { id: 1, message: "Welcome to the Notification App!", type: "info" },
      { id: 2, message: "Your profile has been updated.", type: "success" }
    ]);
  } catch (error) {
    await Log("backend", "error", "handler", `Error fetching notifications: ${error.message}`);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

app.post('/api/notifications', async (req, res) => {
  const { message, type } = req.body;
  if (!message) {
    await Log("backend", "warn", "controller", "Attempted to create notification with empty message");
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    // Business logic...
    await Log("backend", "info", "service", `Notification created: ${message}`);
    res.status(201).json({ id: Date.now(), message, type });
  } catch (error) {
    await Log("backend", "fatal", "db", `Database failure: ${error.message}`);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, async () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  await Log("backend", "info", "config", `Server started on port ${PORT}`);
});
