import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { LogOut, ArrowLeft, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ProfileButton } from './ProfileButton';
import { ProfileModal } from './ProfileModal';

interface User {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
  created_at: string;
}

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  backTo?: string;
}

export default function AdminLayout({ children, title, backTo = '/admin#content' }: AdminLayoutProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  useEffect(() => {
    // Check if user is logged in and is admin
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      setLocation('/login');
      return;
    }

    const userData = JSON.parse(user);
    if (!userData.is_admin) {
      toast({
        title: 'Access Denied',
        description: 'You need admin access to view this page.',
        variant: 'destructive',
      });
      setLocation('/');
      return;
    }

    setCurrentUser(userData);
  }, [setLocation, toast]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setLocation('/');
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800">
      <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-gray-900/95 shadow-lg border-b border-gray-200/80 dark:border-gray-700/80 backdrop-blur-md">
        <div className="p-3 sm:p-4">
          {/* Mobile Header - Stack vertically */}
          <div className="flex flex-col space-y-3 sm:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Link href={backTo}>
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                </Link>
                <h1 className="text-lg font-bold truncate text-gray-800 dark:text-gray-100">{title}</h1>
              </div>
              <div className="flex items-center space-x-1">
                <ThemeToggle 
                  variant="ghost"
                  className="h-8 w-8"
                  showTooltip={false}
                />
                <ProfileButton 
                  onClick={() => setProfileModalOpen(true)}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700">
                Welcome, {currentUser.username}
              </Badge>
              <Button variant="outline" size="sm" onClick={handleLogout} className="h-8 px-2 text-xs border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">
                <LogOut className="w-3 h-3 mr-1" />
                Logout
              </Button>
            </div>
          </div>

          {/* Desktop Header - Single row */}
          <div className="hidden sm:flex h-12 items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href={backTo}>
                <Button variant="ghost" size="sm" className="text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">{title}</h1>
              <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700">Welcome, {currentUser.username}</Badge>
            </div>
            <div className="flex items-center space-x-2">
              <ThemeToggle 
                variant="ghost"
                className="h-9 w-9"
                showTooltip={true}
              />
              <ProfileButton 
                onClick={() => setProfileModalOpen(true)}
              />
              <Button variant="outline" size="sm" onClick={handleLogout} className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex flex-col items-center justify-center min-h-[80vh] py-4 sm:py-8 px-2 sm:px-4">
        {children}
      </main>

      {/* Profile Modal */}
      <ProfileModal 
        isOpen={profileModalOpen} 
        onClose={() => setProfileModalOpen(false)} 
      />
    </div>
  );
}