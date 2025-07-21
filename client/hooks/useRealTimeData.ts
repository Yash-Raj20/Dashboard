import { useState, useEffect, useRef } from "react";

interface UseRealTimeDataOptions {
  endpoint: string;
  interval?: number; // milliseconds
  enabled?: boolean;
}

interface RealTimeStats {
  activeUsers: number;
  onlineAdmins: number;
  recentLogins: number;
  systemLoad: number;
  lastUpdated: string;
}

export function useRealTimeData({
  endpoint,
  interval = 30000,
  enabled = true,
}: UseRealTimeDataOptions) {
  const [data, setData] = useState<RealTimeStats | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate mock real-time data
  const generateMockData = (): RealTimeStats => {
    const baseActiveUsers = 45;
    const variance = Math.floor(Math.random() * 10) - 5; // -5 to +5 variance

    return {
      activeUsers: Math.max(0, baseActiveUsers + variance),
      onlineAdmins: Math.floor(Math.random() * 8) + 1, // 1-8 online admins
      recentLogins: Math.floor(Math.random() * 15) + 5, // 5-20 recent logins
      systemLoad: Math.floor(Math.random() * 30) + 20, // 20-50% system load
      lastUpdated: new Date().toISOString(),
    };
  };

  const fetchRealTimeData = async () => {
    try {
      setError(null);

      // For demo purposes, we'll use mock data
      // In production, this would be a real API call
      const mockData = generateMockData();
      setData(mockData);
      setIsConnected(true);

      // Uncomment this for real API integration:
      /*
      const token = localStorage.getItem('auth_token');
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch real-time data');
      }
      
      const realTimeData = await response.json();
      setData(realTimeData);
      setIsConnected(true);
      */
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsConnected(false);
    }
  };

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    // Initial fetch
    fetchRealTimeData();

    // Set up polling interval
    intervalRef.current = setInterval(fetchRealTimeData, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [endpoint, interval, enabled]);

  return {
    data,
    isConnected,
    error,
    refetch: fetchRealTimeData,
  };
}

// Hook for real-time notifications
export function useRealTimeNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Simulate real-time notifications
    const interval = setInterval(() => {
      const notificationTypes = [
        {
          type: "info",
          title: "New User Registration",
          message: "A new user has registered",
        },
        {
          type: "warning",
          title: "High CPU Usage",
          message: "System CPU usage is above 80%",
        },
        {
          type: "success",
          title: "Backup Completed",
          message: "Daily backup completed successfully",
        },
        {
          type: "error",
          title: "Login Failed",
          message: "Multiple failed login attempts detected",
        },
      ];

      // 20% chance of new notification every 30 seconds
      if (Math.random() < 0.2) {
        const randomNotification =
          notificationTypes[
            Math.floor(Math.random() * notificationTypes.length)
          ];
        const newNotification = {
          id: `notif-${Date.now()}`,
          ...randomNotification,
          timestamp: new Date(),
          read: false,
        };

        setNotifications((prev) => [newNotification, ...prev.slice(0, 9)]); // Keep only 10 notifications
        setIsConnected(true);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)),
    );
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  return {
    notifications,
    isConnected,
    markAsRead,
    removeNotification,
  };
}
