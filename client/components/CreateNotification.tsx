import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, MessageSquare, Send } from "lucide-react";

interface CreateNotificationData {
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  priority: "low" | "medium" | "high" | "urgent";
}

export function CreateNotification() {
  const { user } = useAuth();
  const [formData, setFormData] = useState<CreateNotificationData>({
    title: "",
    message: "",
    type: "info",
    priority: "medium",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Only show this component for main admin
  if (user?.role !== "main-admin") {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create notification");
      }

      const data = await response.json();
      setSuccess(`Notification sent to ${data.notifications} users successfully!`);
      
      // Reset form
      setFormData({
        title: "",
        message: "",
        type: "info",
        priority: "medium",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof CreateNotificationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "info": return "🔵";
      case "warning": return "🟡";
      case "success": return "🟢";
      case "error": return "🔴";
      default: return "🔵";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "text-red-600";
      case "high": return "text-orange-600";
      case "medium": return "text-yellow-600";
      case "low": return "text-blue-600";
      default: return "text-gray-600";
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Create Notification
        </CardTitle>
        <CardDescription>
          Send a notification to all users in the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter notification title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              required
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Enter notification message"
              value={formData.message}
              onChange={(e) => handleInputChange("message", e.target.value)}
              rows={4}
              required
            />
          </div>

          {/* Type and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">
                    <span className="flex items-center gap-2">
                      🔵 Info
                    </span>
                  </SelectItem>
                  <SelectItem value="success">
                    <span className="flex items-center gap-2">
                      🟢 Success
                    </span>
                  </SelectItem>
                  <SelectItem value="warning">
                    <span className="flex items-center gap-2">
                      🟡 Warning
                    </span>
                  </SelectItem>
                  <SelectItem value="error">
                    <span className="flex items-center gap-2">
                      🔴 Error
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <span className="text-blue-600">Low Priority</span>
                  </SelectItem>
                  <SelectItem value="medium">
                    <span className="text-yellow-600">Medium Priority</span>
                  </SelectItem>
                  <SelectItem value="high">
                    <span className="text-orange-600">High Priority</span>
                  </SelectItem>
                  <SelectItem value="urgent">
                    <span className="text-red-600">Urgent</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preview */}
          {formData.title && formData.message && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="border rounded-lg p-3 bg-muted/50">
                <div className="flex items-start gap-2">
                  <span className="text-lg">{getTypeIcon(formData.type)}</span>
                  <div className="flex-1">
                    <h4 className="font-medium">{formData.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{formData.message}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs font-medium ${getPriorityColor(formData.priority)}`}>
                        {formData.priority.toUpperCase()} PRIORITY
                      </span>
                      <span className="text-xs text-muted-foreground">
                        From: {user?.name}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Success/Error Messages */}
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={isSubmitting || !formData.title || !formData.message}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Notification to All Users
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
