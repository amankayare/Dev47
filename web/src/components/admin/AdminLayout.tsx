import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { LogOut, ArrowLeft, Sun, Moon, User, ChevronDown, Settings } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { ProfileModal } from './ProfileModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
    <div className="min-h-screen bg-gradient-to-br from-[#f5f3ff] via-[#f8fafc] to-[#e0e7ff] dark:from-[#1e1b4b] dark:via-[#0f172a] dark:to-[#020617] transition-colors duration-700">
      <header className="sticky top-0 z-40 w-full bg-white/40 dark:bg-black/20 backdrop-blur-2xl border-b border-white/30 dark:border-white/5">
        <div className="p-3 sm:p-4 max-w-7xl mx-auto w-full">
          {/* Mobile Header - Stack vertically */}
          <div className="flex flex-col space-y-3 sm:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Link href={backTo}>
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-indigo-800 dark:text-indigo-200 hover:bg-white/40 dark:hover:bg-white/5 rounded-full">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                </Link>
                <h1 className="text-lg font-bold truncate text-indigo-900 dark:text-indigo-50">{title}</h1>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs bg-indigo-500/10 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200/50 dark:border-indigo-400/20 rounded-full">
                Welcome, {currentUser.username}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center gap-2.5 px-2 py-1.5 h-10 rounded-full border border-white/50 dark:border-white/10 bg-white/40 dark:bg-black/20 backdrop-blur-md shadow-sm hover:shadow-md transition-all duration-500"
                  >
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-500 shadow-inner">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-bold tracking-wide text-indigo-900 dark:text-indigo-100 pr-1 hidden sm:inline">
                      {currentUser.username}
                    </span>
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-white/40 dark:bg-white/5 border border-white/50 dark:border-white/10">
                      <ChevronDown className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={8} className="w-64 bg-white/60 dark:bg-black/40 backdrop-blur-3xl border border-white/50 dark:border-white/10 shadow-2xl rounded-[2rem] p-3">
                  <DropdownMenuItem 
                    onClick={() => setProfileModalOpen(true)} 
                    className="cursor-pointer rounded-2xl hover:bg-indigo-500/10 dark:hover:bg-indigo-500/10 transition-colors p-3 mb-1"
                  >
                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 mr-3 shadow-inner">
                      <Settings className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-indigo-900 dark:text-indigo-100">Admin Settings</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
                    className="cursor-pointer rounded-2xl hover:bg-indigo-500/10 dark:hover:bg-indigo-500/10 transition-colors p-3 mb-1"
                  >
                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 mr-3 shadow-inner">
                      {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </div>
                    <span className="font-bold text-indigo-900 dark:text-indigo-100">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-indigo-500/20 my-2" />
                  
                  <DropdownMenuItem 
                    onClick={handleLogout} 
                    className="cursor-pointer rounded-2xl hover:bg-indigo-950/10 text-indigo-950 dark:text-indigo-200 transition-colors p-3"
                  >
                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-indigo-950/10 mr-3 shadow-inner">
                      <LogOut className="w-5 h-5" />
                    </div>
                    <span className="font-bold">Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Desktop Header - Single row */}
          <div className="hidden sm:flex h-12 items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href={backTo}>
                <Button variant="ghost" size="sm" className="text-indigo-800 dark:text-indigo-200 hover:bg-white/40 dark:hover:bg-white/5 rounded-full px-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <h1 className="text-2xl font-black text-indigo-900 dark:text-indigo-50 tracking-tight">{title}</h1>
              <Badge variant="secondary" className="bg-indigo-500/10 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200/50 dark:border-indigo-400/20 rounded-full px-4 py-1">Welcome, {currentUser.username}</Badge>
            </div>
            <div className="flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center gap-2.5 px-2 py-1.5 h-11 rounded-full border border-white/50 dark:border-white/10 bg-white/40 dark:bg-black/20 backdrop-blur-md shadow-sm hover:shadow-md transition-all duration-500"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500 shadow-inner">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm font-black tracking-wide text-indigo-900 dark:text-indigo-100 pr-1 hidden sm:inline">
                      {currentUser.username}
                    </span>
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white/40 dark:bg-white/5 border border-indigo-200/50 dark:border-indigo-500/10">
                      <ChevronDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={8} className="w-64 bg-white/70 dark:bg-black/40 backdrop-blur-3xl border border-white/50 dark:border-white/10 shadow-2xl rounded-[2.5rem] p-4">
                  <DropdownMenuItem 
                    onClick={() => setProfileModalOpen(true)} 
                    className="cursor-pointer rounded-[1.5rem] hover:bg-indigo-500/10 dark:hover:bg-indigo-500/10 transition-colors p-3 mb-2"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 mr-3 shadow-inner">
                      <Settings className="w-5 h-5" />
                    </div>
                    <span className="font-black text-indigo-900 dark:text-indigo-100">Admin Settings</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
                    className="cursor-pointer rounded-[1.5rem] hover:bg-indigo-500/10 dark:hover:bg-indigo-500/10 transition-colors p-3 mb-2"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 mr-3 shadow-inner">
                      {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </div>
                    <span className="font-black text-indigo-900 dark:text-indigo-100">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-indigo-500/20 my-3" />
                  
                  <DropdownMenuItem 
                    onClick={handleLogout} 
                    className="cursor-pointer rounded-[1.5rem] hover:bg-indigo-950/10 text-indigo-950 dark:text-indigo-200 transition-colors p-3"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-950/10 mr-3 shadow-inner">
                      <LogOut className="w-5 h-5" />
                    </div>
                    <span className="font-black">Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="flex flex-col items-center min-h-[80vh] py-4 sm:py-8 px-2 sm:px-4">
        <div className="w-full max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Profile Modal */}
      <ProfileModal 
        isOpen={profileModalOpen} 
        onClose={() => setProfileModalOpen(false)} 
      />
    </div>
  );
}