const express = require('express');
const cors = require('cors');
const { Log } = require('../logging_middleware');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Auth Details for the Test Server
const CONFIG = {
  email: "duggineniakhil1@gmail.com",
  name: "Duggineni Akhil",
  rollNo: "CB.SC.U4CSE23413",
  accessCode: "PTBMmQ",
  clientID: "717d88c0-5023-4b60-bd4f-ef5eb5330724",
  clientSecret: "ycyVaqEWRCMsJpDS",
  baseUrl: "http://20.207.122.201/evaluation-service"
};

let accessToken = null;
let tokenExpiry = null;

async function getAuthToken() {
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) return accessToken;
  
  try {
    const response = await fetch(`${CONFIG.baseUrl}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(CONFIG)
    });
    if (!response.ok) throw new Error("Failed to authenticate");
    const data = await response.json();
    accessToken = data.access_token;
    tokenExpiry = data.expires_in * 1000 - 60000;
    return accessToken;
  } catch (error) {
    await Log("backend", "error", "auth", `Auth to test server failed: ${error.message}`);
    throw error;
  }
}

// Global middleware for logging every request
app.use(async (req, res, next) => {
  await Log("backend", "info", "middleware", `Incoming ${req.method} request to ${req.url}`);
  next();
});

// Priority weight mapping
const PRIORITY_WEIGHTS = {
  "Placement": 3,
  "Result": 2,
  "Event": 1
};

const VALID_TYPES = ["Placement", "Result", "Event"];

app.get('/api/v1/notifications/priority', async (req, res) => {
  try {
    await Log("backend", "info", "controller", "Fetching priority inbox notifications");
    
    const token = await getAuthToken();
    const response = await fetch(`${CONFIG.baseUrl}/notifications`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error("Failed to fetch notifications from evaluation service");
    }

    const data = await response.json();
    let notifications = data.notifications || [];

    // Sort by priority (descending) then by timestamp (descending)
    notifications.sort((a, b) => {
      const weightA = PRIORITY_WEIGHTS[a.Type] || 0;
      const weightB = PRIORITY_WEIGHTS[b.Type] || 0;

      if (weightA !== weightB) {
        return weightB - weightA;
      }
      
      const timeA = new Date(a.Timestamp).getTime();
      const timeB = new Date(b.Timestamp).getTime();
      return timeB - timeA;
    });

    // Top 10 notifications
    const top10 = notifications.slice(0, 10);
    
    await Log("backend", "info", "service", `Successfully processed priority inbox. Returned ${top10.length} items.`);
    res.json({ success: true, data: top10 });

  } catch (error) {
    await Log("backend", "error", "handler", `Priority Inbox Error: ${error.message}`);
    res.status(500).json({ success: false, error: "Failed to process priority inbox" });
  }
});

// Original Notification API updated with query params, validation, and pagination
app.get('/api/v1/notifications', async (req, res) => {
  try {
    const { notification_type, page = 1, limit = 50 } = req.query;

    if (notification_type && !VALID_TYPES.includes(notification_type)) {
      await Log("backend", "warn", "controller", `Invalid notification type requested: ${notification_type}`);
      return res.status(400).json({
        success: false,
        message: "Invalid notification type"
      });
    }

    await Log("backend", "info", "controller", `Fetching all notifications (page: ${page}, limit: ${limit})`);
    
    const token = await getAuthToken();
    const queryParams = new URLSearchParams(req.query).toString();
    const url = queryParams 
      ? `${CONFIG.baseUrl}/notifications?${queryParams}` 
      : `${CONFIG.baseUrl}/notifications`;

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.status === 401) {
      await Log("backend", "error", "auth", "Unauthorized access to notifications");
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!response.ok) {
      throw new Error("Failed to fetch from test server");
    }

    const data = await response.json();
    let notifications = data.notifications || [];

    // Optional: local pagination if the evaluation server doesn't apply it
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (!isNaN(pageNum) && !isNaN(limitNum)) {
       const startIndex = (pageNum - 1) * limitNum;
       notifications = notifications.slice(startIndex, startIndex + limitNum);
    }

    res.json({ success: true, page: pageNum, limit: limitNum, data: notifications });
  } catch (error) {
    await Log("backend", "error", "handler", `Error fetching notifications: ${error.message}`);
    res.status(500).json({ success: false, error: "Failed to fetch notifications" });
  }
});

app.listen(PORT, async () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  await Log("backend", "info", "config", `Server started on port ${PORT}`);
});
