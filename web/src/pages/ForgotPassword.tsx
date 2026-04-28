import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useTheme } from '@/hooks/use-theme';
import { ChevronLeft } from 'lucide-react';

export default function ForgotPassword() {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const forgotPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to request password reset');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setSuccess(true);
      toast({
        title: 'Email Sent',
        description: 'Please check your inbox for reset instructions.',
      });
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    forgotPasswordMutation.mutate(email);
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
              Reset Password
            </CardTitle>
            <CardDescription className="text-muted-foreground/80">
              Enter your email and we'll send you a reset link
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="text-center space-y-4">
                <Alert className="bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400">
                  <AlertDescription>
                    Reset link has been sent to your email address.
                  </AlertDescription>
                </Alert>
                <Button onClick={() => setLocation('/login')} className="w-full">
                  Return to Login
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
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full text-white" 
                  disabled={forgotPasswordMutation.isPending}
                >
                  {forgotPasswordMutation.isPending ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="justify-center border-t border-border/10 mt-4 pt-6">
            <Link href="/login" className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Login
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
