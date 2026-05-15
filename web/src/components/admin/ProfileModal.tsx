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
import { apiGet, apiPut } from '@/utils/api';

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
      return apiPut('/api/auth/change-password', {
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
      <DialogContent className="sm:max-w-[640px] p-0 gap-0 max-h-[85vh] flex flex-col rounded-[2.5rem] border-cornflower-500/20 bg-white/95 dark:bg-black/90 backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Modern Header - Cyberpunk cornflower */}
        <DialogHeader className="relative bg-gradient-to-r from-cornflower-50 via-cornflower-50/50 to-white dark:from-cornflower-950 dark:via-cornflower-900/40 dark:to-black/20 border-b border-cornflower-200/50 dark:border-cornflower-500/10 p-8 flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-cornflower-500/5 to-transparent"></div>
          <div className="relative">
            <DialogTitle className="flex items-center gap-4 text-2xl font-black text-cornflower-950 dark:text-cornflower-50 uppercase tracking-tight">
              <div className="p-3 bg-cornflower-500/10 dark:bg-cornflower-500/20 rounded-2xl shadow-inner">
                <UserCircle className="h-6 w-6 text-cornflower-600 dark:text-cornflower-400" />
              </div>
              Identity Matrix
            </DialogTitle>
            <p className="text-cornflower-700/60 dark:text-cornflower-300/60 font-bold text-sm mt-1">Managing account kernels and security protocols</p>
          </div>
        </DialogHeader>
 
        <div className="p-8 flex-1 overflow-y-auto">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-12 bg-cornflower-500/5 dark:bg-cornflower-500/10 p-1.5 rounded-2xl mb-8">
              <TabsTrigger 
                value="info" 
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-cornflower-500 data-[state=active]:text-cornflower-600 dark:data-[state=active]:text-white rounded-xl transition-all duration-300"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Profile_Kernel</span>
                <span className="sm:hidden">Kernel</span>
              </TabsTrigger>
              <TabsTrigger 
                value="password" 
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-cornflower-500 data-[state=active]:text-cornflower-600 dark:data-[state=active]:text-white rounded-xl transition-all duration-300"
              >
                <KeyRound className="h-4 w-4" />
                <span className="hidden sm:inline">Security_Protocol</span>
                <span className="sm:hidden">Security</span>
              </TabsTrigger>
            </TabsList>
            {/* Profile Info Tab */}
            <TabsContent value="info" className="space-y-6">
              {profileLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-cornflower-600 dark:border-cornflower-400 border-r-transparent"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-cornflower-500/60">Syncing identity...</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* User Avatar & Basic Info */}
                  <div className="p-8 rounded-[2rem] bg-cornflower-500/5 dark:bg-cornflower-500/10 border border-cornflower-100/50 dark:border-cornflower-500/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Shield className="w-24 h-24 text-cornflower-600" />
                    </div>
                    <div className="relative flex flex-col sm:flex-row items-center gap-6">
                      <div className="relative">
                        <div className="w-20 h-20 bg-cornflower-600 dark:bg-cornflower-500 rounded-[1.5rem] flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-cornflower-500/20">
                          {profileData?.user?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        {profileData?.user?.is_admin && (
                          <div className="absolute -top-2 -right-2 bg-cornflower-950 dark:bg-black rounded-full p-2 border-4 border-white dark:border-cornflower-900 shadow-lg">
                            <Shield className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="text-center sm:text-left flex-1">
                        <h3 className="text-2xl font-black text-cornflower-950 dark:text-cornflower-50 uppercase tracking-tight">
                          {profileData?.user?.username || ""}
                        </h3>
                        <p className="text-cornflower-700/60 dark:text-cornflower-300/60 font-bold mb-4">
                          {profileData?.user?.email || ""}
                        </p>
                        <Badge className="bg-cornflower-600 text-white font-black text-[10px] uppercase tracking-widest rounded-full px-4 py-1.5 border-0">
                          <Shield className="h-3 w-3 mr-2" />
                          {profileData?.user?.is_admin ? "ADMIN_PRIVILEGES" : "STANDARD_ACCESS"}
                        </Badge>
                      </div>
                    </div>
                  </div>
 
                  {/* Account Details */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-cornflower-950 dark:text-cornflower-50 uppercase tracking-[0.2em] px-2">Account Metadata:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { label: 'USERNAME', value: profileData?.user?.username, icon: UserCircle },
                        { label: 'CORE_EMAIL', value: profileData?.user?.email, icon: Mail },
                        { label: 'ACCESS_LEVEL', value: profileData?.user?.is_admin ? "ADMINISTRATOR" : "USER", icon: Shield },
                        { label: 'NODE_CREATED', value: profileData?.user?.created_at ? new Date(profileData.user.created_at).toLocaleDateString() : "", icon: Calendar },
                      ].map((item, idx) => (
                        <div key={idx} className="space-y-2">
                          <Label className="flex items-center gap-2 text-[10px] font-black text-cornflower-500/60 uppercase tracking-widest">
                            <item.icon className="h-3 w-3" />
                            {item.label}
                          </Label>
                          <div className="relative">
                            <Input 
                              value={item.value || ""} 
                              readOnly 
                              className="bg-white/50 dark:bg-black/20 border-cornflower-100 dark:border-cornflower-500/10 rounded-xl font-bold text-cornflower-900 dark:text-cornflower-100 h-11" 
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-1.5 h-1.5 bg-cornflower-500 rounded-full"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
 
            {/* Change Password Tab */}
            <TabsContent value="password" className="space-y-6">
              <div className="p-8 rounded-[2rem] border-2 border-dashed border-cornflower-100 dark:border-cornflower-500/20 bg-cornflower-500/5">
                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  {[
                    { id: 'current_password', label: 'CURRENT_KEY', show: showPasswords.current, toggle: 'current' },
                    { id: 'new_password', label: 'NEW_KEY', show: showPasswords.new, toggle: 'new' },
                    { id: 'confirm_password', label: 'VERIFY_KEY', show: showPasswords.confirm, toggle: 'confirm' },
                  ].map((field) => (
                    <div key={field.id} className="space-y-2">
                      <Label htmlFor={field.id} className="flex items-center gap-2 text-[10px] font-black text-cornflower-950 dark:text-cornflower-50 uppercase tracking-widest">
                        <Lock className="h-3 w-3" />
                        {field.label}
                      </Label>
                      <div className="relative">
                        <Input
                          id={field.id}
                          type={field.show ? "text" : "password"}
                          value={passwordData[field.id as keyof ChangePasswordData]}
                          onChange={(e) => handleInputChange(field.id as keyof ChangePasswordData, e.target.value)}
                          className={`pr-12 h-12 border-2 transition-all duration-300 rounded-xl font-bold bg-white dark:bg-black/20 ${
                            errors[field.id as keyof ChangePasswordData] 
                              ? 'border-cornflower-950 dark:border-white shadow-inner' 
                              : 'border-cornflower-100 dark:border-cornflower-500/10 focus:border-cornflower-600 dark:focus:border-cornflower-400'
                          }`}
                          placeholder={`Enter ${field.label.toLowerCase()}...`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 hover:bg-cornflower-500/10 rounded-lg"
                          onClick={() => togglePasswordVisibility(field.toggle as 'current' | 'new' | 'confirm')}
                        >
                          {field.show ? (
                            <EyeOff className="h-4 w-4 text-cornflower-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-cornflower-500" />
                          )}
                        </Button>
                      </div>
                      {errors[field.id as keyof ChangePasswordData] && (
                        <p className="text-[10px] font-black text-cornflower-950 dark:text-white uppercase tracking-widest flex items-center gap-2 mt-1">
                          <div className="w-1 h-1 bg-cornflower-600 rounded-full"></div>
                          {errors[field.id as keyof ChangePasswordData]}
                        </p>
                      )}
                    </div>
                  ))}
 
                  {/* Password Requirements */}
                  <div className="bg-cornflower-600 text-white rounded-2xl p-6 shadow-xl shadow-cornflower-600/20">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                      <Shield className="h-3 w-3" />
                      Protocol Requirements
                    </h4>
                    <ul className="text-xs font-bold space-y-2 opacity-90">
                      <li className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                        Entropy Level: At least 8 units
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                        Complexity: Alphanumeric + Symbols
                      </li>
                    </ul>
                  </div>
 
                  <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-cornflower-100/30 dark:border-cornflower-500/10">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={onClose}
                      className="rounded-full border-2 border-cornflower-100 dark:border-cornflower-500/20 text-cornflower-600 dark:text-cornflower-400 font-black uppercase tracking-widest text-[10px] h-12 px-8"
                    >
                      ABORT
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={changePasswordMutation.isPending}
                      className="bg-cornflower-600 hover:bg-cornflower-700 text-white shadow-xl shadow-cornflower-600/20 rounded-full font-black uppercase tracking-widest text-[10px] h-12 px-8 transition-all duration-300 transform hover:scale-105"
                    >
                      {changePasswordMutation.isPending ? 'RECODING...' : 'UPDATE_KERNEL'}
                    </Button>
                  </div>
                </form>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
