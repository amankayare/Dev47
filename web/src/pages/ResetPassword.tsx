import { useState } from 'react';
import { useLocation, useParams, Link } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useTheme } from '@/hooks/use-theme';

export default function ResetPassword() {
  const { theme } = useTheme();
  const { token } = useParams();
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const resetPasswordMutation = useMutation({
    mutationFn: async (password: string) => {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset password');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setSuccess(true);
      toast({
        title: 'Success',
        description: 'Password has been reset successfully!',
      });
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    resetPasswordMutation.mutate(formData.password);
  };

  return (
    <div className="h-screen flex flex-col bg-background text-foreground font-vs relative overflow-hidden">
      {/* Clean Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-slate-950"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>
      
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-4 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3 cursor-pointer transition-transform hover:scale-105" onClick={() => setLocation("/blogs")}>
            <img 
              src={theme === 'dark' ? '/logo-dark.svg' : '/logo-light.svg'} 
              alt="DEV47 Logo" 
              className="h-10 sm:h-12 md:h-14 w-auto"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <ThemeToggle 
            variant="ghost"
            className="hover:bg-accent/50 rounded-lg transition-all duration-200 backdrop-blur-sm"
            showTooltip={true}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card/90 backdrop-blur-xl border-border/40 shadow-2xl shadow-black/5 dark:shadow-black/20">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent">
              New Password
            </CardTitle>
            <CardDescription className="text-muted-foreground/80">
              Please enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="text-center space-y-4">
                <Alert className="bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400">
                  <AlertDescription>
                    Your password has been updated successfully.
                  </AlertDescription>
                </Alert>
                <Button onClick={() => setLocation('/login')} className="w-full">
                  Go to Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter new password"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm your password"
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full text-white" 
                  disabled={resetPasswordMutation.isPending}
                >
                  {resetPasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="justify-center">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Back to Login
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
