# Notification API Documentation

## Create Notification Endpoint

### POST `/api/notifications`

Creates a notification that will be sent to all users in the system.

**Authorization:** Bearer token required  
**Role Required:** main-admin only

### Request Body

```json
{
  "title": "string (required)",
  "message": "string (required)",
  "type": "info" | "warning" | "success" | "error" (optional, default: "info"),
  "priority": "low" | "medium" | "high" | "urgent" (optional, default: "medium")
}
```

### Response

**Success (201 Created):**

```json
{
  "message": "Notification sent to all users",
  "notifications": 3,
  "data": [
    {
      "id": "67856...",
      "targetRole": "main-admin",
      "fromUserId": "admin-1",
      "fromUserName": "Main Administrator",
      "fromUserRole": "main-admin",
      "type": "info",
      "title": "System Maintenance",
      "message": "Scheduled maintenance tonight at 2 AM",
      "action": "broadcast_message",
      "priority": "medium",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "read": false
    }
    // ... notifications for other roles
  ]
}
```

**Error Responses:**

- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: User is not main-admin
- `400 Bad Request`: Missing required fields or invalid values

### Example Usage

```javascript
// Create notification
const response = await fetch("/api/notifications", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    title: "System Maintenance",
    message: "Scheduled maintenance tonight at 2 AM",
    type: "warning",
    priority: "high",
  }),
});

const data = await response.json();
console.log(`Notification sent to ${data.notifications} users`);
```

## How It Works

1. Main admin creates notification via API
2. System creates 3 separate notification records (one for each role: main-admin, sub-admin, user)
3. All users of all roles will see the notification in their notification center
4. Notifications are stored in MongoDB and persist across sessions
5. Real-time polling ensures users see notifications immediately

## UI Integration

The notification creation form is available on the Dashboard page for main admins only. It includes:

- Title and message fields
- Type selection (info, warning, success, error)
- Priority selection (low, medium, high, urgent)
- Real-time preview
- Success/error feedback
