import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ChangePasswordRequest } from '@shared/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Key,
  Calendar,
  Mail,
  Save,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileErrors, setProfileErrors] = useState<string[]>([]);

  // Password form state
  const [passwordForm, setPasswordForm] = useState<ChangePasswordRequest>({
    currentPassword: '',
    newPassword: ''
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  const handleUpdateProfile = async () => {
    if (!validateProfileForm()) return;

    try {
      setProfileLoading(true);
      setProfileErrors([]);

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/profile/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profileForm.name
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (err) {
      setProfileErrors([err instanceof Error ? err.message : 'An error occurred']);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) return;

    try {
      setPasswordLoading(true);
      setPasswordErrors([]);

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/profile/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(passwordForm),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to change password');
      }

      setPasswordDialogOpen(false);
      resetPasswordForm();
      
      toast({
        title: "Success",
        description: "Password changed successfully. Please log in again.",
      });

      // Log out after password change
      setTimeout(() => {
        logout();
      }, 2000);
    } catch (err) {
      setPasswordErrors([err instanceof Error ? err.message : 'An error occurred']);
    } finally {
      setPasswordLoading(false);
    }
  };

  const validateProfileForm = (): boolean => {
    const errors: string[] = [];

    if (!profileForm.name.trim()) {
      errors.push('Name is required');
    }

    setProfileErrors(errors);
    return errors.length === 0;
  };

  const validatePasswordForm = (): boolean => {
    const errors: string[] = [];

    if (!passwordForm.currentPassword) {
      errors.push('Current password is required');
    }

    if (!passwordForm.newPassword) {
      errors.push('New password is required');
    } else if (passwordForm.newPassword.length < 8) {
      errors.push('New password must be at least 8 characters long');
    } else if (!/[A-Z]/.test(passwordForm.newPassword)) {
      errors.push('New password must contain at least one uppercase letter');
    } else if (!/[a-z]/.test(passwordForm.newPassword)) {
      errors.push('New password must contain at least one lowercase letter');
    } else if (!/\d/.test(passwordForm.newPassword)) {
      errors.push('New password must contain at least one number');
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(passwordForm.newPassword)) {
      errors.push('New password must contain at least one special character');
    }

    if (passwordForm.newPassword !== confirmPassword) {
      errors.push('New password and confirmation do not match');
    }

    setPasswordErrors(errors);
    return errors.length === 0;
  };

  const resetPasswordForm = () => {
    setPasswordForm({
      currentPassword: '',
      newPassword: ''
    });
    setConfirmPassword('');
    setPasswordErrors([]);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'main-admin':
        return 'Main Administrator';
      case 'sub-admin':
        return 'Sub Administrator';
      case 'user':
        return 'User';
      default:
        return role;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'main-admin':
        return 'destructive';
      case 'sub-admin':
        return 'default';
      case 'user':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profileErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1">
                      {profileErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                  disabled={profileLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileForm.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email address cannot be changed
                </p>
              </div>

              <Button 
                onClick={handleUpdateProfile} 
                disabled={profileLoading}
                className="w-full"
              >
                {profileLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update Profile
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Account Information
              </CardTitle>
              <CardDescription>
                View your account details and role information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Role</span>
                  <Badge variant={getRoleBadgeVariant(user?.role || '')}>
                    {getRoleDisplayName(user?.role || '')}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <Badge variant={user?.isActive ? "default" : "destructive"}>
                    {user?.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Email</span>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {user?.email}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Account Created</span>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(user?.createdAt)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Last Login</span>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(user?.lastLogin)}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage your password and security preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="text-sm font-medium">Password</h4>
                  <p className="text-sm text-muted-foreground">
                    Change your password to keep your account secure
                  </p>
                </div>
                <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Key className="mr-2 h-4 w-4" />
                      Change Password
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Password</DialogTitle>
                      <DialogDescription>
                        Enter your current password and choose a new one
                      </DialogDescription>
                    </DialogHeader>

                    {passwordErrors.length > 0 && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <ul className="list-disc list-inside space-y-1">
                            {passwordErrors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input
                          id="current-password"
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm(prev => ({ 
                            ...prev, 
                            currentPassword: e.target.value 
                          }))}
                          disabled={passwordLoading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                          id="new-password"
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm(prev => ({ 
                            ...prev, 
                            newPassword: e.target.value 
                          }))}
                          disabled={passwordLoading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          disabled={passwordLoading}
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setPasswordDialogOpen(false);
                          resetPasswordForm();
                        }}
                        disabled={passwordLoading}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleChangePassword} disabled={passwordLoading}>
                        {passwordLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Changing...
                          </>
                        ) : (
                          'Change Password'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Permissions */}
          {user?.permissions && user.permissions.length > 0 && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Your Permissions
                </CardTitle>
                <CardDescription>
                  Permissions granted to your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 md:grid-cols-3">
                  {user.permissions.map((permission) => (
                    <Badge key={permission} variant="outline" className="justify-center py-2">
                      {permission.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
