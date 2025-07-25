import "./global.css";

import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import SubAdmins from "./pages/SubAdmins";
import Analytics from "./pages/Analytics";
import Users from "./pages/Users";
import AuditLogs from "./pages/AuditLogs";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="admin-ui-theme">
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="min-h-screen">
              <Routes>
                <Route
                  path="/"
                  element={<Navigate to="/dashboard" replace />}
                />
                <Route path="/login" element={<Login />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/sub-admins"
                  element={
                    <ProtectedRoute requiredPermission="create_sub_admin">
                      <SubAdmins />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/analytics"
                  element={
                    <ProtectedRoute requiredPermission="view_analytics">
                      <Analytics />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/users"
                  element={
                    <ProtectedRoute requiredPermission="view_all_users">
                      <Users />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/audit-logs"
                  element={
                    <ProtectedRoute requiredPermission="view_audit_logs">
                      <AuditLogs />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/settings"
                  element={
                    <ProtectedRoute requiredPermission="edit_profile">
                      <Settings />
                    </ProtectedRoute>
                  }
                />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

// Handle hot module replacement properly to avoid createRoot warning
const container = document.getElementById("root")!;

// Check if we're in development mode and there's already a root
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    // Clean up on hot reload
  });
}

// Create root only if it doesn't exist
if (!container._reactRootContainer) {
  const root = createRoot(container);
  (container as any)._reactRootContainer = root;
  root.render(<App />);
} else {
  // If root exists, just re-render
  (container as any)._reactRootContainer.render(<App />);
}
