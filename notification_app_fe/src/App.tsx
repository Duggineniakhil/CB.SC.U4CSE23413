import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Paper, List, ListItem, 
  Divider, Alert, CircularProgress, AppBar, Toolbar,
  Tabs, Tab, Select, MenuItem, InputLabel, FormControl,
  Chip, Grid, Button, IconButton, useMediaQuery, useTheme, Card, CardContent
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CircleIcon from '@mui/icons-material/Circle';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { Log } from './utils/logger';

interface Notification {
  ID: string;
  Message: string;
  Type: string;
  Timestamp: string;
}

function App() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [tab, setTab] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [priorityNotifications, setPriorityNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('All');
  const [viewedIds, setViewedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('viewed_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  const fetchAllNotifications = async () => {
    try {
      await Log("frontend", "info", "api", "Fetching all notifications");
      const url = filterType !== 'All' 
        ? `http://localhost:5000/api/notifications?notification_type=${filterType}`
        : `http://localhost:5000/api/notifications`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch all");
      const data = await res.json();
      setNotifications(data);
    } catch (err: any) {
      setError(err.message);
      await Log("frontend", "error", "api", `Fetch all failed: ${err.message}`);
    }
  };

  const fetchPriorityNotifications = async () => {
    try {
      await Log("frontend", "info", "api", "Fetching priority notifications");
      const res = await fetch('http://localhost:5000/api/priority-inbox');
      if (!res.ok) throw new Error("Failed to fetch priority");
      const data = await res.json();
      setPriorityNotifications(data.notifications || []);
    } catch (err: any) {
      setError(err.message);
      await Log("frontend", "error", "api", `Fetch priority failed: ${err.message}`);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchAllNotifications(), fetchPriorityNotifications()]).finally(() => {
      setLoading(false);
      Log("frontend", "info", "component", "Data load complete");
    });
  }, [filterType]);

  const markAsViewed = async (id: string) => {
    if (!viewedIds.includes(id)) {
      const updated = [...viewedIds, id];
      setViewedIds(updated);
      localStorage.setItem('viewed_notifications', JSON.stringify(updated));
      await Log("frontend", "info", "state", `Marked notification ${id} as viewed`);
    }
  };

  const markAllAsViewed = async () => {
    const allIds = (tab === 0 ? priorityNotifications : notifications).map(n => n.ID);
    const newIds = Array.from(new Set([...viewedIds, ...allIds]));
    setViewedIds(newIds);
    localStorage.setItem('viewed_notifications', JSON.stringify(newIds));
    await Log("frontend", "info", "state", "Marked all as viewed");
  };

  const getChipColor = (type: string) => {
    switch (type) {
      case 'Placement': return 'success';
      case 'Result': return 'primary';
      case 'Event': return 'secondary';
      default: return 'default';
    }
  };

  const renderNotificationList = (list: Notification[]) => {
    if (list.length === 0) return <Typography sx={{p:3}} color="textSecondary">No notifications found.</Typography>;
    
    return (
      <Grid container spacing={2} sx={{ p: 2 }}>
        {list.map((n) => {
          const isViewed = viewedIds.includes(n.ID);
          return (
            <Grid item xs={12} key={n.ID}>
              <Card 
                variant="outlined" 
                sx={{ 
                  bgcolor: isViewed ? 'background.paper' : '#e3f2fd',
                  transition: '0.3s',
                  '&:hover': { boxShadow: 3 }
                }}
              >
                <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: "16px !important" }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flex: 1 }}>
                    <Box sx={{ mt: 0.5 }}>
                      {isViewed ? <CheckCircleIcon color="disabled" /> : <CircleIcon color="primary" fontSize="small" />}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1, flexWrap: 'wrap' }}>
                        <Chip label={n.Type} size="small" color={getChipColor(n.Type) as any} />
                        <Typography variant="caption" color="textSecondary">
                          {new Date(n.Timestamp).toLocaleString()}
                        </Typography>
                      </Box>
                      <Typography variant="body1" sx={{ fontWeight: isViewed ? 'normal' : 'bold' }}>
                        {n.Message}
                      </Typography>
                    </Box>
                  </Box>
                  {!isViewed && (
                    <Button size="small" onClick={() => markAsViewed(n.ID)}>
                      Mark Read
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    );
  };

  return (
    <Box sx={{ flexGrow: 1, bgcolor: '#f5f5f5', minHeight: '100vh', pb: 4 }}>
      <AppBar position="sticky" sx={{ bgcolor: '#1a237e' }}>
        <Toolbar>
          <NotificationsActiveIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Campus Hub
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="md" sx={{ mt: 4 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'white' }}>
            <Tabs 
              value={tab} 
              onChange={(e, v) => setTab(v)} 
              variant={isMobile ? "fullWidth" : "standard"}
              centered={!isMobile}
            >
              <Tab label="Priority Inbox" />
              <Tab label="All Notifications" />
            </Tabs>
          </Box>

          <Box sx={{ p: 2, bgcolor: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            {tab === 1 && (
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Filter</InputLabel>
                <Select
                  value={filterType}
                  label="Filter"
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <MenuItem value="All">All Types</MenuItem>
                  <MenuItem value="Placement">Placements</MenuItem>
                  <MenuItem value="Result">Results</MenuItem>
                  <MenuItem value="Event">Events</MenuItem>
                </Select>
              </FormControl>
            )}
            <Box sx={{ flexGrow: 1 }} />
            <Button variant="outlined" size="small" onClick={markAllAsViewed}>
              Mark all as read
            </Button>
          </Box>
          <Divider />

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ bgcolor: '#f8f9fa', minHeight: 400 }}>
              {tab === 0 ? renderNotificationList(priorityNotifications) : renderNotificationList(notifications)}
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
}

export default App;
