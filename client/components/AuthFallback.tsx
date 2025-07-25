import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function AuthFallback() {
  const handleReload = () => {
    window.location.reload();
  };

  const handleGoToLogin = () => {
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Authentication Error</AlertTitle>
          <AlertDescription className="mt-2">
            The authentication system failed to load. This may be a temporary issue.
          </AlertDescription>
        </Alert>

        <div className="mt-6 flex flex-col space-y-3">
          <Button onClick={handleReload} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reload Page
          </Button>
          <Button variant="outline" onClick={handleGoToLogin} className="w-full">
            Go to Login
          </Button>
        </div>
      </div>
    </div>
  );
}
