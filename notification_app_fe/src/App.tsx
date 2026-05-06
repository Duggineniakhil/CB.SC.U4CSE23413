import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Button, TextField, 
  Paper, List, ListItem, ListItemText, Divider, 
  Alert, CircularProgress, AppBar, Toolbar 
} from '@mui/material';
import { Log } from './utils/logger';

interface Notification {
  id: number;
  message: string;
  type: string;
}

function App() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      await Log("frontend", "info", "api", "Fetching notifications from backend");
      const res = await fetch('http://localhost:5000/api/notifications');
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setNotifications(data);
      await Log("frontend", "info", "state", "Notifications loaded successfully");
    } catch (err: any) {
      setError(err.message);
      await Log("frontend", "error", "api", `Fetch failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addNotification = async () => {
    if (!newMessage) {
      await Log("frontend", "warn", "component", "User tried to send empty message");
      return;
    }
    try {
      await Log("frontend", "info", "api", "Sending new notification to backend");
      const res = await fetch('http://localhost:5000/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage, type: 'info' })
      });
      if (!res.ok) throw new Error("Post failed");
      setNewMessage("");
      fetchNotifications();
      await Log("frontend", "info", "component", "Notification sent successfully");
    } catch (err: any) {
      setError(err.message);
      await Log("frontend", "error", "api", `Post failed: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <Box sx={{ flexGrow: 1, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <AppBar position="static" sx={{ bgcolor: '#1a237e' }}>
        <Toolbar>
          <Typography variant="h6" component="div">
            Notification System
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h4" gutterBottom color="primary">
            Send Notification
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
            <TextField 
              fullWidth 
              label="Enter notification message" 
              variant="outlined"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <Button 
              variant="contained" 
              onClick={addNotification}
              sx={{ px: 4 }}
            >
              Send
            </Button>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Typography variant="h5" gutterBottom>
            Recent Notifications
          </Typography>
          {loading ? (
            <CircularProgress />
          ) : (
            <List>
              {notifications.map((n) => (
                <React.Fragment key={n.id}>
                  <ListItem>
                    <ListItemText primary={n.message} secondary={n.type} />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
              {notifications.length === 0 && <Typography color="textSecondary">No notifications found.</Typography>}
            </List>
          )}
        </Paper>
      </Container>
    </Box>
  );
}

export default App;
