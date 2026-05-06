const CONFIG = {
  email: "duggineniakhil1@gmail.com",
  name: "duggineni akhil",
  rollNo: "cb.sc.u4cse23413",
  accessCode: "PTBMmQ",
  clientID: "717d88c0-5023-4b60-bd4f-ef5eb5330724",
  clientSecret: "ycyVaqEWRCMsJpDS",
  baseUrl: 'http://20.207.122.201/evaluation-service'
};

let accessToken = null;
let tokenExpiry = null;

async function authenticate() {
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return;
  }
  
  const payload = {
    email: CONFIG.email,
    name: CONFIG.name,
    rollNo: CONFIG.rollNo,
    accessCode: CONFIG.accessCode,
    clientID: CONFIG.clientID,
    clientSecret: CONFIG.clientSecret
  };

  try {
    const response = await fetch(`${CONFIG.baseUrl}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`Auth failed: ${response.status}`);
    }
    
    const data = await response.json();
    accessToken = data.access_token;
    tokenExpiry = data.expires_in * 1000 - 60000;
  } catch (error) {
    console.error("Failed to authenticate with evaluation server:", error.message);
  }
}

async function Log(stack, level, pkg, message) {
  try {
    await authenticate();
    if (!accessToken) {
      throw new Error("No access token available.");
    }

    const payload = {
      stack,
      level,
      package: pkg,
      message: message.length > 48 ? message.substring(0, 45) + '...' : message
    };

    const response = await fetch(`${CONFIG.baseUrl}/logs`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Log failed: ${response.status} - ${errorData}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Logging failed:", error.message);
  }
}

module.exports = { Log };
