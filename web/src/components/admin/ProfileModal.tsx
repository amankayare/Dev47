import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { User, Lock, Eye, EyeOff, Shield, Calendar, Mail, UserCircle, KeyRound, CheckCircle2 } from "lucide-react";
import { apiGet, apiPost } from '@/utils/api';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface User {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
  created_at: string;
  last_login?: string;
}

interface ChangePasswordData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const queryClient = useQueryClient();
  const [passwordData, setPasswordData] = useState<ChangePasswordData>({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [errors, setErrors] = useState<Partial<ChangePasswordData>>({});

  // Query for user profile data - following AdminDashboard pattern
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: () => apiGet('/api/auth/me'),
    enabled: isOpen,
  });

  // Mutation for password change - following AdminDashboard pattern
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { current_password: string; new_password: string }) => {
      return apiPost('/api/auth/change-password', {
        currentPassword: data.current_password,
        newPassword: data.new_password,
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: data.message || 'Password changed successfully.',
      });
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
      setErrors({});
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to change password.',
        variant: 'destructive',
      });
    },
  });

  const validatePasswordForm = (): boolean => {
    const newErrors: Partial<ChangePasswordData> = {};
    
    if (!passwordData.current_password.trim()) {
      newErrors.current_password = "Current password is required";
    }
    
    if (!passwordData.new_password.trim()) {
      newErrors.new_password = "New password is required";
    } else if (passwordData.new_password.length < 8) {
      newErrors.new_password = "Password must be at least 8 characters";
    }
    
    if (!passwordData.confirm_password.trim()) {
      newErrors.confirm_password = "Please confirm your password";
    } else if (passwordData.new_password !== passwordData.confirm_password) {
      newErrors.confirm_password = "Passwords don't match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validatePasswordForm()) {
      changePasswordMutation.mutate({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
    }
  };

  const handleInputChange = (field: keyof ChangePasswordData, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[640px] p-0 gap-0 max-h-[85vh] flex flex-col">
        {/* Modern Header */}
        <DialogHeader className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-4 sm:p-6 rounded-t-lg flex-shrink-0">
          <div className="absolute inset-0 bg-black/10 rounded-t-lg"></div>
          <div className="relative">
            <DialogTitle className="flex items-center gap-3 text-lg sm:text-xl font-bold mb-1">
              <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                <UserCircle className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              Profile Settings
            </DialogTitle>
            <p className="text-white/90 text-sm">Manage your account information and security</p>
          </div>
        </DialogHeader>

        <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-10 bg-gray-50 dark:bg-gray-800/50 p-1 rounded-xl mb-4">
              <TabsTrigger 
                value="info" 
                className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm rounded-lg transition-all duration-200"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Profile Info</span>
                <span className="sm:hidden">Info</span>
              </TabsTrigger>
              <TabsTrigger 
                value="password" 
                className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm rounded-lg transition-all duration-200"
              >
                <KeyRound className="h-4 w-4" />
                <span className="hidden sm:inline">Security</span>
                <span className="sm:hidden">Password</span>
              </TabsTrigger>
            </TabsList>
            {/* Profile Info Tab */}
            <TabsContent value="info" className="space-y-4">
              {profileLoading ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="flex items-center justify-center py-8">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-200 border-t-indigo-600"></div>
                      <span className="text-sm text-muted-foreground">Loading profile...</span>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* User Avatar & Basic Info */}
                  <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="relative">
                          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-lg">
                            {profileData?.user?.username?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          {profileData?.user?.is_admin && (
                            <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1.5 shadow-sm">
                              <Shield className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="text-center sm:text-left flex-1">
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                            {profileData?.user?.username || ""}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {profileData?.user?.email || ""}
                          </p>
                          <Badge 
                            variant="secondary" 
                            className={profileData?.user?.is_admin 
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                              : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            }
                          >
                            <Shield className="h-3 w-3 mr-1" />
                            {profileData?.user?.is_admin ? "Administrator" : "User"}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Account Details */}
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <User className="h-4 w-4 text-indigo-600" />
                        Account Details
                      </CardTitle>
                      <CardDescription className="text-sm">Your account information and settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                            <UserCircle className="h-4 w-4" />
                            Username
                          </Label>
                          <div className="relative">
                            <Input 
                              value={profileData?.user?.username || ""} 
                              readOnly 
                              className="bg-gray-50/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 pl-4 pr-10 font-medium h-10" 
                            />
                            <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                            <Mail className="h-4 w-4" />
                            Email Address
                          </Label>
                          <div className="relative">
                            <Input 
                              value={profileData?.user?.email || ""} 
                              readOnly 
                              className="bg-gray-50/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 pl-4 pr-10 font-medium h-10" 
                            />
                            <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                            <Shield className="h-4 w-4" />
                            Account Role
                          </Label>
                          <div className="relative">
                            <Input 
                              value={profileData?.user?.is_admin ? "Administrator" : "User"} 
                              readOnly 
                              className="bg-gray-50/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 pl-4 pr-10 font-medium h-10" 
                            />
                            <Shield className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-indigo-500" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                            <Calendar className="h-4 w-4" />
                            Member Since
                          </Label>
                          <div className="relative">
                            <Input 
                              value={profileData?.user?.created_at ? new Date(profileData.user.created_at).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              }) : ""} 
                              readOnly 
                              className="bg-gray-50/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 pl-4 pr-10 font-medium h-10" 
                            />
                            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-500" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* Change Password Tab */}
            <TabsContent value="password" className="space-y-3">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <KeyRound className="h-4 w-4 text-red-600" />
                    Change Password
                  </CardTitle>
                  <CardDescription className="text-sm">Update your account password for better security</CardDescription>
                </CardHeader>
                <CardContent className="pb-4">
                  <form onSubmit={handlePasswordSubmit} className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="current_password" className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        <Lock className="h-4 w-4" />
                        Current Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="current_password"
                          type={showPasswords.current ? "text" : "password"}
                          value={passwordData.current_password}
                          onChange={(e) => handleInputChange("current_password", e.target.value)}
                          className={`pr-12 h-10 border-2 transition-all duration-200 ${
                            errors.current_password 
                              ? 'border-red-300 focus:border-red-500 bg-red-50/50 dark:bg-red-900/10' 
                              : 'border-gray-200 focus:border-indigo-500 bg-white dark:bg-gray-900'
                          }`}
                          placeholder="Enter your current password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                          onClick={() => togglePasswordVisibility('current')}
                        >
                          {showPasswords.current ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                      </div>
                      {errors.current_password && (
                        <p className="text-sm text-red-600 font-medium flex items-center gap-1">
                          <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                          {errors.current_password}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new_password" className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        <KeyRound className="h-4 w-4" />
                        New Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="new_password"
                          type={showPasswords.new ? "text" : "password"}
                          value={passwordData.new_password}
                          onChange={(e) => handleInputChange("new_password", e.target.value)}
                          className={`pr-12 h-10 border-2 transition-all duration-200 ${
                            errors.new_password 
                              ? 'border-red-300 focus:border-red-500 bg-red-50/50 dark:bg-red-900/10' 
                              : 'border-gray-200 focus:border-indigo-500 bg-white dark:bg-gray-900'
                          }`}
                          placeholder="Enter your new password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                          onClick={() => togglePasswordVisibility('new')}
                        >
                          {showPasswords.new ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                      </div>
                      {errors.new_password && (
                        <p className="text-sm text-red-600 font-medium flex items-center gap-1">
                          <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                          {errors.new_password}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm_password" className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        <CheckCircle2 className="h-4 w-4" />
                        Confirm New Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirm_password"
                          type={showPasswords.confirm ? "text" : "password"}
                          value={passwordData.confirm_password}
                          onChange={(e) => handleInputChange("confirm_password", e.target.value)}
                          className={`pr-12 h-10 border-2 transition-all duration-200 ${
                            errors.confirm_password 
                              ? 'border-red-300 focus:border-red-500 bg-red-50/50 dark:bg-red-900/10' 
                              : 'border-gray-200 focus:border-indigo-500 bg-white dark:bg-gray-900'
                          }`}
                          placeholder="Confirm your new password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                          onClick={() => togglePasswordVisibility('confirm')}
                        >
                          {showPasswords.confirm ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                      </div>
                      {errors.confirm_password && (
                        <p className="text-sm text-red-600 font-medium flex items-center gap-1">
                          <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                          {errors.confirm_password}
                        </p>
                      )}
                    </div>

                    {/* Password Requirements */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2.5 border border-blue-200 dark:border-blue-800">
                      <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-0.5 flex items-center gap-2">
                        <Shield className="h-3 w-3" />
                        Password Requirements
                      </h4>
                      <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-0.5">
                        <li className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3 w-3" />
                          At least 8 characters long
                        </li>
                        <li className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3 w-3" />
                          Mix of letters, numbers, and symbols
                        </li>
                      </ul>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={onClose}
                        className="h-10 px-6 border-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={changePasswordMutation.isPending}
                        className="h-10 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {changePasswordMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2"></div>
                            Updating...
                          </>
                        ) : (
                          <>
                            <KeyRound className="h-4 w-4 mr-2" />
                            Update Password
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
