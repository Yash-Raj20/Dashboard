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
import UsersProblem from "./pages/AllProblems";
import Users from "./pages/Users";
import AuditLogs from "./pages/AuditLogs";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="admin-ui-theme">
        <TooltipProvider>
          <AuthProvider>
            <BrowserRouter>
              <div className="min-h-screen">
                <Toaster />
                <Sonner />
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
                    path="/dashboard/users-problems"
                    element={
                      <ProtectedRoute requiredPermission="view_users_problems">
                        <UsersProblem />
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
  </ErrorBoundary>
);

// Handle root mounting properly
const container = document.getElementById("root")!;

// Prevent multiple createRoot calls
if (!(container as any)._reactRoot) {
  const root = createRoot(container);
  (container as any)._reactRoot = root;
  root.render(<App />);
} else {
  // Re-render on existing root
  (container as any)._reactRoot.render(<App />);
}

// Handle hot module replacement
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    // Clean up on hot reload if needed
  });
}
