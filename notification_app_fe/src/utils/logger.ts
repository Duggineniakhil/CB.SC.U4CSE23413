const CONFIG = {
  email: "duggineniakhil1@gmail.com",
  name: "duggineni akhil",
  rollNo: "cb.sc.u4cse23413",
  accessCode: "PTBMmQ",
  clientID: "717d88c0-5023-4b60-bd4f-ef5eb5330724",
  clientSecret: "ycyVaqEWRCMsJpDS",
  baseUrl: 'http://20.207.122.201/evaluation-service'
};

let accessToken: string | null = null;
let tokenExpiry: number | null = null;

async function authenticate() {
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) return;
  
  try {
    const response = await fetch(`${CONFIG.baseUrl}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(CONFIG)
    });
    const data = await response.json();
    accessToken = data.access_token;
    tokenExpiry = data.expires_in * 1000 - 60000;
  } catch (error) {
    console.error("Auth failed:", error);
  }
}

export async function Log(stack: "frontend" | "backend", level: string, pkg: string, message: string) {
  try {
    await authenticate();
    if (!accessToken) return;

    await fetch(`${CONFIG.baseUrl}/logs`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ stack, level, package: pkg, message: message.length > 48 ? message.substring(0, 45) + '...' : message })
    });
  } catch (error) {
    console.error("Logging failed:", error);
  }
}
