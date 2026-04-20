import { useState, useEffect } from 'react';
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
import { Home } from 'lucide-react';

interface LoginData {
  username: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  user: {
    id: number;
    username: string;
    email: string;
    is_admin: boolean;
  };
  message: string;
}

export default function Login() {
  const { theme } = useTheme();
  const [formData, setFormData] = useState<LoginData>({ username: '', password: '' });
  const [error, setError] = useState('');
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Check for auth error message on component mount
  useEffect(() => {
    const authError = localStorage.getItem('authError');
    if (authError) {
      setError(authError);
      localStorage.removeItem('authError'); // Clear the message after displaying
    }
  }, []);

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData): Promise<LoginResponse> => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.removeItem('authError'); // Clear any previous auth errors
      toast({
        title: 'Success',
        description: 'Successfully logged in!',
      });
      
      // Log user info for debugging
      console.log('Login successful. User data:', data.user);
      console.log('Is admin:', data.user.is_admin);
      
      // Check for return URL first
      const returnUrl = localStorage.getItem('returnUrl');
      if (returnUrl) {
        localStorage.removeItem('returnUrl');
        console.log('Redirecting to return URL:', returnUrl);
        setLocation(returnUrl);
        return;
      }
      
      // Default redirect logic based on user role
      if (data.user.is_admin) {
        console.log('Redirecting admin to admin panel');
        setLocation('/admin');
      } else {
        console.log('Redirecting non-admin user to blog home');
        setLocation('/blogs');
      }
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    loginMutation.mutate(formData);
  };

  return (
    <div className="h-screen flex flex-col bg-background text-foreground font-vs relative overflow-hidden">
      {/* Clean Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Subtle Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-slate-950"></div>
        
        {/* Subtle Grid Pattern */}
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
            Hi! Welcome
          </CardTitle>
          <CardDescription className="text-muted-foreground/80">
            Sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="username">Username or Email</Label>
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Enter your username or email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter your password"
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full text-white" 
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/register" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
      </div>
    </div>
  );
}