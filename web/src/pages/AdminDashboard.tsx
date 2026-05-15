import { useState, useEffect } from 'react';
import { Pagination } from '@/components/ui/pagination';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/components/ui/theme-provider';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ProfileButton } from '@/components/admin/ProfileButton';
import { ProfileModal } from '@/components/admin/ProfileModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Users, MessageSquare, FolderOpen, FileText, Award, BarChart3, User, Briefcase, Code, ShieldCheck, Sun, Moon, ArrowLeft, Eye, EyeOff, Trash2, Settings, ChevronDown, Mail, Clock } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useDeleteConfirmation } from '@/hooks/useDeleteConfirmation';
import { apiGet, apiPut, apiDelete } from '@/utils/api';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DashboardStats {
  projects_count: number;
  blogs_count: number;
  certifications_count: number;
  contact_messages_count: number;
  unseen_messages_count: number;
  users_count: number;
}

interface User {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
  created_at: string;
}

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  phone?: string;
  preferred_contact_method?: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10); // You can make this adjustable if desired
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Delete confirmation setup for messages
  const deleteConfirmation = useDeleteConfirmation({
    onDelete: (id: number) => deleteMessageMutation.mutate(id),
    itemName: (message: ContactMessage) => message.subject || `message from ${message.email}`,
    itemType: 'contact message',
  });

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page on new search
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Handle URL hash navigation for admin tabs
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // Remove the '#'
      if (hash && ['overview', 'users', 'messages', 'content'].includes(hash)) {
        setActiveTab(hash);
      }
    };

    // Check initial hash on mount
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Update URL hash when tab changes
  useEffect(() => {
    if (activeTab !== 'overview') {
      if (window.location.hash !== `#${activeTab}`) {
        window.history.replaceState(null, '', `#${activeTab}`);
      }
    } else if (window.location.hash) {
      // Remove hash if on overview tab
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [activeTab]);

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

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/dashboard'],
    queryFn: () => apiGet('/api/admin/dashboard'),
    enabled: !!currentUser,
  });

  const {
    data: usersData,
    isLoading: usersLoading,
  } = useQuery({
    queryKey: ['/api/admin/users', page, pageSize, debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      });
      if (debouncedSearch) params.append('search', debouncedSearch);
      return apiGet(`/api/admin/users?${params.toString()}`);
    },
    enabled: !!currentUser,
  });

  const typedUsersData = usersData as {
    users: User[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };

  // Messages tab state
  const [messagesPage, setMessagesPage] = useState(1);
  const [messagesPageSize] = useState(10);
  const [messagesSearch, setMessagesSearch] = useState('');
  const [debouncedMessagesSearch, setDebouncedMessagesSearch] = useState('');
  const [messagesStatusFilter, setMessagesStatusFilter] = useState('all');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedMessagesSearch(messagesSearch);
      setMessagesPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [messagesSearch]);

  const {
    data: messagesData,
    isLoading: messagesLoading,
  } = useQuery({
    queryKey: ['/api/contact/admin/messages', messagesPage, messagesPageSize, debouncedMessagesSearch, messagesStatusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: messagesPage.toString(),
        page_size: messagesPageSize.toString(),
        status: messagesStatusFilter,
      });
      if (debouncedMessagesSearch) params.append('search', debouncedMessagesSearch);
      return apiGet(`/api/contact/admin/messages?${params.toString()}`);
    },
    enabled: !!currentUser,
  });

  const typedMessagesData = messagesData as {
    messages: ContactMessage[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
    counts: {
      all: number;
      read: number;
      unread: number;
    };
  };

  const toggleAdminMutation = useMutation({
    mutationFn: (userId: number) => apiPut(`/api/admin/users/${userId}/toggle-admin`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: 'Success',
        description: 'User admin status updated successfully.',
      });
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: (messageId: number) => apiDelete(`/api/contact/admin/messages/${messageId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contact/admin/messages'] });
      toast({
        title: 'Success',
        description: 'Message deleted successfully.',
      });
    },
  });

  const toggleMessageReadMutation = useMutation({
    mutationFn: (messageId: number) => apiPut(`/api/contact/admin/messages/${messageId}/toggle-read`, {}),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/contact/admin/messages'] });
      // Update selected message state locally if it's the one being toggled
      if (selectedMessage && selectedMessage.id === variables) {
        setSelectedMessage(prev => prev ? { ...prev, is_read: !prev.is_read } : null);
      }
      toast({
        title: 'Success',
        description: data.message,
      });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => apiPut('/api/contact/admin/messages/mark-all-read', {}),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/contact/admin/messages'] });
      toast({
        title: 'Success',
        description: data.message,
      });
    },
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setLocation('/');
  };

  if (!currentUser) return null;

  return (
    <AdminLayout title="Admin Dashboard" backTo="/">
      <div className="w-full max-w-7xl mx-auto space-y-6 sm:space-y-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 sm:space-y-10">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto p-1.5 gap-2 bg-cornflower-500/10 dark:bg-cornflower-500/10 rounded-[2rem] border border-cornflower-500/20 dark:border-cornflower-500/20 backdrop-blur-md">
              <TabsTrigger value="overview" className="flex items-center justify-center gap-2 text-xs sm:text-sm px-4 py-2 sm:py-2.5 rounded-full data-[state=active]:bg-cornflower-500 data-[state=active]:text-white shadow-sm transition-all duration-300">
                <BarChart3 className="w-4 h-4 flex-shrink-0" />
                <span className="hidden xs:inline truncate font-bold">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center justify-center gap-2 text-xs sm:text-sm px-4 py-2 sm:py-2.5 rounded-full data-[state=active]:bg-cornflower-500 data-[state=active]:text-white shadow-sm transition-all duration-300">
                <Users className="w-4 h-4 flex-shrink-0" />
                <span className="hidden xs:inline truncate font-bold">Users</span>
              </TabsTrigger>
              <TabsTrigger value="messages" className="flex items-center justify-center gap-2 text-xs sm:text-sm px-4 py-2 sm:py-2.5 rounded-full data-[state=active]:bg-cornflower-500 data-[state=active]:text-white shadow-sm transition-all duration-300 relative">
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <span className="hidden xs:inline truncate font-bold">Messages</span>
                {typedMessagesData?.counts?.unread > 0 && (
                  <Badge variant="destructive" className="absolute -top-0.5 -right-0.5 sm:relative sm:top-0 sm:right-0 sm:ml-1 px-1.5 py-0.5 text-xs h-4 min-w-4 rounded-full border-2 border-white dark:border-cornflower-950">
                    {typedMessagesData.counts.unread}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="content" className="flex items-center justify-center gap-2 text-xs sm:text-sm px-4 py-2 sm:py-2.5 rounded-full data-[state=active]:bg-cornflower-500 data-[state=active]:text-white shadow-sm transition-all duration-300">
                <FolderOpen className="w-4 h-4 flex-shrink-0" />
                <span className="hidden xs:inline truncate font-bold">Content</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 sm:space-y-8 px-1 sm:px-0">
              {/* Ghibli-style Welcome Header - Cyberpunk cornflower */}
              <div className="relative overflow-hidden text-center space-y-3 p-8 sm:p-12 rounded-[2rem] bg-gradient-to-b from-cornflower-100 via-cornflower-50 to-white dark:from-cornflower-950 dark:via-cornflower-900/50 dark:to-black/40 shadow-sm border border-cornflower-200/50 dark:border-cornflower-500/10">
                {/* Decorative Neon Pulse */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-cornflower-400/30 dark:bg-cornflower-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-10 -left-10 w-56 h-56 bg-cornflower-300/20 dark:bg-cornflower-600/10 rounded-full blur-3xl"></div>
                
                <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-cornflower-900 dark:text-cornflower-50 z-10 relative drop-shadow-[0_0_15px_rgba(100, 149, 237,0.3)]">
                  Dashboard Overview
                </h2>
                <p className="text-base sm:text-lg font-medium text-cornflower-700/80 dark:text-cornflower-300/80 z-10 relative max-w-2xl mx-auto">
                  Monitor your digital journey and manage your realm's futuristic content.
                </p>
              </div>

              {/* Ghibli-style Stats Cards */}
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
                {/* Card 1: Projects */}
                <Card className="relative overflow-hidden group hover:-translate-y-2 hover:shadow-2xl hover:shadow-cornflower-500/30 transition-all duration-500 rounded-3xl border-0 bg-gradient-to-br from-card to-card/95 dark:from-cornflower-950/80 dark:to-cornflower-900/60">
                  <div className="absolute -right-6 -top-6 w-32 h-32 bg-cornflower-300/20 dark:bg-cornflower-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-transparent z-10 relative">
                    <CardTitle className="text-sm font-bold text-cornflower-900 dark:text-cornflower-100 uppercase tracking-wider">Projects</CardTitle>
                    <div className="p-3 bg-cornflower-100 dark:bg-cornflower-500/30 backdrop-blur-md rounded-2xl shadow-sm group-hover:rotate-12 transition-transform duration-300">
                      <FolderOpen className="h-5 w-5 text-cornflower-600 dark:text-cornflower-400" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-4xl font-black text-cornflower-950 dark:text-cornflower-50 tracking-tighter drop-shadow-sm">
                      {statsLoading ? '...' : stats?.projects_count || 0}
                    </div>
                    <p className="text-xs font-bold text-cornflower-700/80 dark:text-cornflower-200/80 mt-2 flex items-center gap-1.5 uppercase tracking-wide">
                      <span className="w-2 h-2 rounded-full bg-cornflower-500 animate-pulse"></span> Active
                    </p>
                  </CardContent>
                </Card>

                {/* Card 2: Blog Posts */}
                <Card className="relative overflow-hidden group hover:-translate-y-2 hover:shadow-2xl hover:shadow-cornflower-500/30 transition-all duration-500 rounded-3xl border-0 bg-gradient-to-br from-card to-card/95 dark:from-cornflower-950/80 dark:to-cornflower-900/60">
                  <div className="absolute -right-6 -top-6 w-32 h-32 bg-cornflower-300/20 dark:bg-cornflower-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-transparent z-10 relative">
                    <CardTitle className="text-sm font-bold text-cornflower-900 dark:text-cornflower-100 uppercase tracking-wider">Blog Posts</CardTitle>
                    <div className="p-3 bg-cornflower-100 dark:bg-cornflower-500/30 backdrop-blur-md rounded-2xl shadow-sm group-hover:-rotate-12 transition-transform duration-300">
                      <FileText className="h-5 w-5 text-cornflower-600 dark:text-cornflower-400" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-4xl font-black text-cornflower-950 dark:text-cornflower-50 tracking-tighter drop-shadow-sm">
                      {statsLoading ? '...' : stats?.blogs_count || 0}
                    </div>
                    <p className="text-xs font-bold text-cornflower-700/80 dark:text-cornflower-200/80 mt-2 flex items-center gap-1.5 uppercase tracking-wide">
                      <span className="w-2 h-2 rounded-full bg-cornflower-400 animate-pulse"></span> Published
                    </p>
                  </CardContent>
                </Card>

                {/* Card 3: Certifications */}
                <Card className="relative overflow-hidden group hover:-translate-y-2 hover:shadow-2xl hover:shadow-cornflower-500/30 transition-all duration-500 rounded-3xl border-0 bg-gradient-to-br from-card to-card/95 dark:from-cornflower-950/80 dark:to-cornflower-900/60">
                  <div className="absolute -right-6 -top-6 w-32 h-32 bg-cornflower-300/20 dark:bg-cornflower-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-transparent z-10 relative">
                    <CardTitle className="text-sm font-bold text-cornflower-900 dark:text-cornflower-100 uppercase tracking-wider">Certs</CardTitle>
                    <div className="p-3 bg-cornflower-100 dark:bg-cornflower-500/30 backdrop-blur-md rounded-2xl shadow-sm group-hover:rotate-12 transition-transform duration-300">
                      <Award className="h-5 w-5 text-cornflower-600 dark:text-cornflower-400" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-4xl font-black text-cornflower-950 dark:text-cornflower-50 tracking-tighter drop-shadow-sm">
                      {statsLoading ? '...' : stats?.certifications_count || 0}
                    </div>
                    <p className="text-xs font-bold text-cornflower-700/80 dark:text-cornflower-200/80 mt-2 flex items-center gap-1.5 uppercase tracking-wide">
                      <span className="w-2 h-2 rounded-full bg-cornflower-300 animate-pulse"></span> Earned
                    </p>
                  </CardContent>
                </Card>

                {/* Card 4: Messages */}
                <Card className="relative overflow-hidden group hover:-translate-y-2 hover:shadow-2xl hover:shadow-cornflower-500/30 transition-all duration-500 rounded-3xl border-0 bg-gradient-to-br from-card to-card/95 dark:from-cornflower-950/80 dark:to-cornflower-900/60">
                  <div className="absolute -right-6 -top-6 w-32 h-32 bg-cornflower-300/20 dark:bg-cornflower-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-transparent z-10 relative">
                    <CardTitle className="text-sm font-bold text-cornflower-900 dark:text-cornflower-100 uppercase tracking-wider">Messages</CardTitle>
                    <div className="p-3 bg-cornflower-100 dark:bg-cornflower-500/30 backdrop-blur-md rounded-2xl shadow-sm group-hover:-rotate-12 transition-transform duration-300">
                      <MessageSquare className="h-5 w-5 text-cornflower-600 dark:text-cornflower-400" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-4xl font-black text-cornflower-950 dark:text-cornflower-50 tracking-tighter drop-shadow-sm">
                      {statsLoading ? '...' : stats?.contact_messages_count || 0}
                    </div>
                    <p className="text-xs font-bold text-cornflower-700/80 dark:text-cornflower-200/80 mt-2 flex items-center gap-1.5 uppercase tracking-wide">
                      <span className="w-2 h-2 rounded-full bg-cornflower-400 animate-pulse"></span> Inquiries
                    </p>
                  </CardContent>
                </Card>

                {/* Card 5: Users */}
                <Card className="relative overflow-hidden group hover:-translate-y-2 hover:shadow-2xl hover:shadow-cornflower-500/30 transition-all duration-500 rounded-3xl border-0 bg-gradient-to-br from-card to-card/95 dark:from-cornflower-950/80 dark:to-cornflower-900/60">
                  <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/30 dark:bg-cornflower-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-transparent z-10 relative">
                    <CardTitle className="text-sm font-bold text-cornflower-900 dark:text-cornflower-100 uppercase tracking-wider">Users</CardTitle>
                    <div className="p-3 bg-cornflower-100 dark:bg-cornflower-500/30 backdrop-blur-md rounded-2xl shadow-sm group-hover:rotate-12 transition-transform duration-300">
                      <Users className="h-5 w-5 text-cornflower-600 dark:text-cornflower-400" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-4xl font-black text-cornflower-950 dark:text-cornflower-50 tracking-tighter drop-shadow-sm">
                      {statsLoading ? '...' : stats?.users_count || 0}
                    </div>
                    <p className="text-xs font-bold text-cornflower-800/80 dark:text-cornflower-200/80 mt-2 flex items-center gap-1.5 uppercase tracking-wide">
                      <span className="w-2 h-2 rounded-full bg-cornflower-500 animate-pulse"></span> Registered
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="users" className="space-y-6 sm:space-y-8 px-1 sm:px-0">
              <Card className="relative overflow-hidden rounded-[2.5rem] border-0 bg-cornflower-50/40 dark:bg-black/40 backdrop-blur-2xl shadow-lg border border-cornflower-200/30 dark:border-cornflower-500/10">
                <CardHeader className="bg-transparent border-b border-cornflower-200/50 dark:border-cornflower-500/10 p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-4">
                    <CardTitle className="flex items-center gap-3 text-2xl font-black text-cornflower-900 dark:text-cornflower-50">
                      <div className="p-3 bg-cornflower-500/10 dark:bg-cornflower-500/20 rounded-2xl shadow-inner">
                        <Users className="h-6 w-6 text-cornflower-600 dark:text-cornflower-300" />
                      </div>
                      Registered Users ({usersData?.total || 0})
                    </CardTitle>
                    <div className="flex justify-end">
                      <div className="relative w-full sm:w-72 group">
                        <input
                          type="text"
                          value={search}
                          onChange={e => setSearch(e.target.value)}
                          placeholder="Search users..."
                          className="w-full pl-10 pr-4 py-3 rounded-2xl border border-cornflower-200/50 dark:border-cornflower-500/20 bg-white/50 dark:bg-black/30 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-cornflower-500 transition-all text-cornflower-900 dark:text-cornflower-100 placeholder:text-cornflower-400/50"
                        />
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cornflower-500/50">
                          <Users className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <CardDescription className="text-cornflower-700/70 dark:text-cornflower-300/70 font-medium mt-1">
                    Manage the residents of your futuristic digital realm
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {usersLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cornflower-600 dark:border-cornflower-300"></div>
                      <span className="ml-2 text-muted-foreground dark:text-gray-300">Loading users...</span>
                    </div>
                  ) : (
                    <>
                      {/* All users in a scrollable container */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {usersData?.users?.length === 0 ? (
                          <div className="col-span-full text-center py-12 text-cornflower-700/50 dark:text-cornflower-300/50 font-bold">No digital beings found.</div>
                        ) : (
                          usersData?.users?.map((user: User) => (
                            <div
                              key={user.id}
                              className="group relative overflow-hidden flex flex-col p-5 rounded-[2rem] border border-cornflower-200/40 dark:border-cornflower-500/10 bg-gradient-to-br from-white/60 to-white/30 dark:from-white/10 dark:to-transparent backdrop-blur-md hover:shadow-xl hover:shadow-cornflower-500/10 transition-all duration-500"
                            >
                              <div className="flex items-center space-x-4 mb-4">
                                <div className="w-14 h-14 bg-gradient-to-tr from-cornflower-400 to-cornflower-600 dark:from-cornflower-600 dark:to-cornflower-400 rounded-[1.25rem] flex items-center justify-center flex-shrink-0 shadow-lg transform group-hover:rotate-6 transition-transform">
                                  <User className="h-7 w-7 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-lg font-black text-cornflower-900 dark:text-cornflower-50 truncate">{user.username}</h3>
                                  <p className="text-sm font-bold text-cornflower-700/60 dark:text-cornflower-300/60 truncate">{user.email}</p>
                                  <div className="mt-1 flex items-center gap-2">
                                    <Badge className={user.is_admin 
                                      ? "bg-cornflower-500 text-white border-0 rounded-full text-[10px] font-black uppercase tracking-wider shadow-[0_0_10px_rgba(100, 149, 237,0.5)]" 
                                      : "bg-cornflower-100 dark:bg-cornflower-500/10 text-cornflower-700 dark:text-cornflower-300 border-0 rounded-full text-[10px] font-black uppercase tracking-wider"}>
                                      {user.is_admin ? "Grand Master" : "Apprentice"}
                                    </Badge>
                                    <span className="text-[10px] font-bold text-cornflower-500/40 dark:text-cornflower-400/40 uppercase tracking-widest">
                                      Since {new Date(user.created_at).getFullYear()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="mt-auto pt-4 border-t border-cornflower-200/30 dark:border-cornflower-500/10 flex items-center justify-end">
                                <Button
                                  onClick={() => toggleAdminMutation.mutate(user.id)}
                                  disabled={toggleAdminMutation.isPending}
                                  className={
                                    user.is_admin
                                      ? "bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white rounded-full font-black text-xs px-6 transition-all duration-300"
                                      : "bg-cornflower-500 text-white hover:bg-cornflower-600 rounded-full font-black text-xs px-6 transition-all duration-300 shadow-md hover:shadow-lg shadow-cornflower-500/20"
                                  }
                                >
                                  {user.is_admin ? "🔒 Remove Master" : "👑 Grant Mastery"}
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="mt-6 flex justify-center">
                        {typedUsersData?.total_pages > 1 && (
                          <nav aria-label="Pagination" className="flex items-center gap-2">
                            <button
                              className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                              onClick={() => setPage(typedUsersData.page - 1)}
                              disabled={typedUsersData.page === 1}
                            >
                              ← Prev
                            </button>
                            {Array.from({ length: typedUsersData.total_pages }, (_, i) => i + 1).map((p) => (
                              <button
                                key={p}
                                className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
                                  p === typedUsersData.page
                                    ? "bg-cornflower-600 dark:bg-cornflower-700 text-white shadow-lg transform scale-105"
                                    : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                }`}
                                onClick={() => setPage(p)}
                                aria-current={p === typedUsersData.page ? "page" : undefined}
                              >
                                {p}
                              </button>
                            ))}
                            <button
                              className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                              onClick={() => setPage(typedUsersData.page + 1)}
                              disabled={typedUsersData.page === typedUsersData.total_pages}
                            >
                              Next →
                            </button>
                          </nav>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

            </TabsContent>

            <TabsContent value="messages" className="space-y-6 sm:space-y-8 px-1 sm:px-0">
              <Card className="relative overflow-hidden rounded-[2.5rem] border-0 bg-cornflower-50/40 dark:bg-black/40 backdrop-blur-2xl shadow-lg border border-cornflower-200/30 dark:border-cornflower-500/10">
                <CardHeader className="bg-transparent border-b border-cornflower-200/50 dark:border-cornflower-500/10 p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-4">
                    <CardTitle className="flex items-center gap-3 text-2xl font-black text-cornflower-900 dark:text-cornflower-50">
                      <div className="p-3 bg-cornflower-500/10 dark:bg-cornflower-500/20 rounded-2xl shadow-inner">
                        <MessageSquare className="h-6 w-6 text-cornflower-600 dark:text-cornflower-300" />
                      </div>
                      Messages ({typedMessagesData?.total || 0})
                    </CardTitle>
                    <div className="mt-2 sm:mt-0 flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2 bg-cornflower-500/5 dark:bg-cornflower-500/10 p-1 rounded-2xl border border-cornflower-500/10 dark:border-cornflower-500/20">
                        {['all', 'unread', 'read'].map((filter) => (
                          <button
                            key={filter}
                            onClick={() => {
                              setMessagesStatusFilter(filter);
                              setMessagesPage(1);
                            }}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                              messagesStatusFilter === filter
                                ? 'bg-cornflower-500 text-white shadow-lg shadow-cornflower-500/30'
                                : 'text-cornflower-900/40 dark:text-cornflower-50/40 hover:text-cornflower-600 dark:hover:text-cornflower-300'
                            }`}
                          >
                            {filter}
                            {filter !== 'all' && typedMessagesData?.counts && (
                              <span className="ml-1.5 opacity-50">
                                ({typedMessagesData.counts[filter as keyof typeof typedMessagesData.counts]})
                              </span>
                            )}
                          </button>
                        ))}
                      </div>

                      {typedMessagesData?.counts?.unread > 0 && (
                        <Button
                          onClick={() => markAllReadMutation.mutate()}
                          disabled={markAllReadMutation.isPending}
                          className="bg-cornflower-500 text-white hover:bg-cornflower-600 rounded-full font-black text-xs px-6 h-10 shadow-md shadow-cornflower-500/20 transition-all duration-300"
                        >
                          ✓ Mark All Read
                        </Button>
                      )}
                      <div className="relative group">
                        <input
                          type="text"
                          value={messagesSearch}
                          onChange={e => setMessagesSearch(e.target.value)}
                          placeholder="Search scrolls..."
                          className="w-full sm:w-64 pl-10 pr-4 py-3 h-10 rounded-2xl border border-cornflower-200/50 dark:border-cornflower-500/20 bg-white/50 dark:bg-black/30 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-cornflower-500 transition-all text-cornflower-900 dark:text-cornflower-100 placeholder:text-cornflower-400/50 text-xs font-bold"
                        />
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cornflower-500/50">
                          <MessageSquare className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <CardDescription className="text-cornflower-700/70 dark:text-cornflower-300/70 font-medium mt-1">
                    Whispers and messages from far across the digital neon winds
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 dark:border-orange-300"></div>
                      <span className="ml-2 text-muted-foreground dark:text-gray-300">Loading messages...</span>
                    </div>
                  ) : (
                    <>
                      {/* Two-column layout */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" style={{ minHeight: '60vh' }}>
                        {/* Left panel: Message list - Hidden on mobile when message is selected */}
                        <div className={`lg:col-span-4 flex flex-col lg:border-r border-cornflower-100/50 dark:border-cornflower-500/10 lg:pr-8 ${
                          selectedMessage ? 'hidden lg:flex' : 'flex'
                        }`}>
                          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar" style={{ maxHeight: '65vh' }}>
                            {!typedMessagesData?.messages || typedMessagesData?.messages?.length === 0 ? (
                              <div className="text-center py-12">
                                <div className="text-cornflower-300 dark:text-cornflower-700 mb-2 font-black text-xl">EMPTY_VOID</div>
                                <p className="text-xs text-cornflower-900/40 dark:text-cornflower-50/40 uppercase font-bold tracking-widest">No signals detected in this frequency</p>
                              </div>
                            ) : (
                              typedMessagesData.messages.map((message: ContactMessage) => (
                                <div
                                  key={message.id}
                                  onClick={() => {
                                    setSelectedMessage(message);
                                    if (!message.is_read) {
                                      toggleMessageReadMutation.mutate(message.id);
                                    }
                                  }}
                                  className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 border-2 ${
                                    selectedMessage?.id === message.id
                                      ? 'bg-cornflower-500/10 border-cornflower-500 dark:bg-cornflower-500/20 shadow-[0_0_15px_rgba(100, 149, 237,0.2)] scale-[1.02]'
                                      : 'bg-white/30 dark:bg-black/20 border-transparent hover:border-cornflower-200 dark:hover:border-cornflower-500/30'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-black text-cornflower-500 uppercase tracking-widest">
                                      {new Date(message.created_at).toLocaleDateString()}
                                    </span>
                                    {!message.is_read && (
                                      <Badge className="bg-cornflower-500 text-white border-0 text-[8px] px-1.5 h-3.5 animate-pulse shadow-[0_0_8px_rgba(100, 149, 237,0.6)]">NEW</Badge>
                                    )}
                                  </div>
                                  <h4 className={`text-sm font-black truncate ${message.is_read ? 'text-cornflower-900/60 dark:text-cornflower-100/60' : 'text-cornflower-900 dark:text-cornflower-50'}`}>
                                    {message.name}
                                  </h4>
                                  <p className={`text-xs font-bold truncate mt-1 ${message.is_read ? 'text-cornflower-700/40 dark:text-cornflower-300/40' : 'text-cornflower-700/70 dark:text-cornflower-300/70'}`}>
                                    {message.subject}
                                  </p>
                                </div>
                              ))
                            )}
                          </div>
                          
                          {/* Pagination at the bottom of the list */}
                          {typedMessagesData?.total_pages > 1 && (
                            <div className="mt-4 pt-4 border-t border-cornflower-200 dark:border-cornflower-700">
                              <nav aria-label="Pagination" className="flex items-center justify-center gap-1">
                                <button
                                  className="px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-cornflower-200 dark:border-cornflower-700 text-cornflower-700 dark:text-cornflower-300 hover:bg-cornflower-50 dark:hover:bg-cornflower-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                  onClick={() => setMessagesPage(typedMessagesData.page - 1)}
                                  disabled={typedMessagesData.page === 1}
                                >
                                  ←
                                </button>
                                <span className="px-3 py-1.5 text-sm text-cornflower-700 dark:text-cornflower-300">
                                  {typedMessagesData.page} / {typedMessagesData.total_pages}
                                </span>
                                <button
                                  className="px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-cornflower-200 dark:border-cornflower-700 text-cornflower-700 dark:text-cornflower-300 hover:bg-cornflower-50 dark:hover:bg-cornflower-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                  onClick={() => setMessagesPage(typedMessagesData.page + 1)}
                                  disabled={typedMessagesData.page === typedMessagesData.total_pages}
                                >
                                  →
                                </button>
                              </nav>
                            </div>
                          )}
                        </div>

                        {/* Right panel: Message details - Shows on mobile only when message selected */}
                        <div className={`lg:col-span-8 flex flex-col ${
                          selectedMessage ? 'flex' : 'hidden lg:flex'
                        }`}>
                          {selectedMessage ? (
                            <div className="flex-1 overflow-y-auto">
                              <div className="space-y-4">
                                {/* Back button for mobile */}
                                <button
                                  onClick={() => setSelectedMessage(null)}
                                  className="lg:hidden flex items-center gap-2 text-cornflower-700 dark:text-cornflower-300 hover:text-cornflower-900 dark:hover:text-cornflower-100 mb-4 transition-colors"
                                >
                                  <ArrowLeft className="h-5 w-5" />
                                  <span className="font-medium">Back to messages</span>
                                </button>
                                
                                {/* Message header */}
                                <div className="flex items-start justify-between border-b border-cornflower-200/20 dark:border-cornflower-500/5 pb-6">
                                    <div className="flex-1 min-w-0">
                                      <h2 className="text-xl font-black text-cornflower-900 dark:text-cornflower-50 truncate">{selectedMessage.name}</h2>
                                      <div className="flex flex-wrap items-center gap-3 mt-1.5">
                                        <div className="flex items-center text-xs font-bold text-cornflower-600/70 dark:text-cornflower-300/60">
                                          <Mail className="h-3 w-3 mr-1.5" />
                                          {selectedMessage.email}
                                        </div>
                                        <div className="flex items-center text-xs font-bold text-cornflower-600/70 dark:text-cornflower-300/60">
                                          <Clock className="h-3 w-3 mr-1.5" />
                                          {new Date(selectedMessage.created_at).toLocaleString()}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <Button
                                        onClick={() => toggleMessageReadMutation.mutate(selectedMessage.id)}
                                        disabled={toggleMessageReadMutation.isPending}
                                        className={`px-6 py-1.5 h-auto rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 border-0 ${
                                          selectedMessage.is_read 
                                            ? 'bg-cornflower-500/10 text-cornflower-400 hover:bg-cornflower-500/20' 
                                            : 'bg-cornflower-500 text-white shadow-lg shadow-cornflower-500/30 hover:bg-cornflower-600'
                                        }`}
                                      >
                                        {selectedMessage.is_read ? (
                                          <span className="flex items-center gap-2">
                                            <EyeOff className="h-3 w-3" /> Mark as Unread
                                          </span>
                                        ) : (
                                          <span className="flex items-center gap-2">
                                            <Eye className="h-3 w-3" /> Mark as Read
                                          </span>
                                        )}
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                          deleteConfirmation.openConfirmDialog(selectedMessage);
                                          setSelectedMessage(null);
                                        }}
                                        className="h-9 w-9 rounded-full text-red-500 hover:bg-red-500/10 transition-colors"
                                      >
                                        <Trash2 className="h-4.5 w-4.5" />
                                      </Button>
                                    </div>
                                </div>
                                <div className="p-6 sm:p-8 space-y-6">
                                  <div className="space-y-2">
                                    <span className="text-[10px] font-black text-cornflower-400 uppercase tracking-[0.2em]">Subject of Inquiry</span>
                                    <h3 className="text-lg font-black text-cornflower-900 dark:text-cornflower-50 leading-tight">
                                      {selectedMessage.subject}
                                    </h3>
                                  </div>
                                  <div className="relative group">
                                    <div className="absolute -left-4 top-0 bottom-0 w-1 bg-cornflower-500/30 rounded-full group-hover:bg-cornflower-500 transition-colors duration-500"></div>
                                    <div className="text-sm sm:text-base leading-relaxed text-cornflower-800/80 dark:text-cornflower-100/80 font-medium whitespace-pre-wrap pl-4">
                                      {selectedMessage.message}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex-1 flex items-center justify-center">
                              <div className="text-center space-y-3">
                                  <MessageSquare className="h-8 w-8 text-gray-400 dark:text-gray-600" />
                                </div>
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    No message selected
                                  </h3>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Select a message from the list to view its details
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                    </>
                  )}
                </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="content" className="space-y-8 sm:space-y-12 px-1 sm:px-0 pt-4">
                <div className="grid gap-6 sm:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {/* Projects Card */}
                <Card className="relative overflow-hidden group hover:-translate-y-2 hover:shadow-2xl hover:shadow-cornflower-500/30 transition-all duration-500 rounded-[2.5rem] border-0 bg-gradient-to-br from-card to-card/90 dark:from-cornflower-950/80 dark:to-cornflower-900/60">
                  <CardHeader className="bg-transparent border-b border-cornflower-200/50 dark:border-cornflower-500/15 p-8">
                    <CardTitle className="flex items-center gap-3 text-xl font-black text-cornflower-950 dark:text-cornflower-50">
                      <div className="p-3 bg-cornflower-100 dark:bg-cornflower-500/30 rounded-2xl shadow-sm">
                        <FolderOpen className="h-6 w-6 text-cornflower-600 dark:text-cornflower-400" />
                      </div>
                      Projects
                    </CardTitle>
                    <CardDescription className="text-cornflower-800/60 dark:text-cornflower-200/70 font-bold mt-2">Manage your creative endeavors</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8">
                    <Button
                      className="w-full py-6 rounded-full bg-cornflower-600 hover:bg-cornflower-700 dark:bg-cornflower-500 dark:hover:bg-cornflower-600 text-white font-black text-sm uppercase tracking-widest shadow-lg hover:shadow-xl shadow-cornflower-500/20 transition-all duration-300"
                      onClick={() => setLocation('/admin/projects')}
                    >
                      🚀 Open Atelier
                    </Button>
                  </CardContent>
                </Card>

                {/* Blog Posts Card */}
                <Card className="relative overflow-hidden group hover:-translate-y-2 hover:shadow-2xl hover:shadow-cornflower-500/30 transition-all duration-500 rounded-[2.5rem] border-0 bg-gradient-to-br from-card to-card/95 dark:from-cornflower-950/80 dark:to-cornflower-900/60">
                  <CardHeader className="bg-transparent border-b border-cornflower-200/50 dark:border-cornflower-500/15 p-8">
                    <CardTitle className="flex items-center gap-3 text-xl font-black text-cornflower-950 dark:text-cornflower-50">
                      <div className="p-3 bg-cornflower-100 dark:bg-cornflower-500/30 rounded-2xl shadow-sm">
                        <FileText className="h-6 w-6 text-cornflower-600 dark:text-cornflower-400" />
                      </div>
                      Blog Posts
                    </CardTitle>
                    <CardDescription className="text-cornflower-800/60 dark:text-cornflower-200/70 font-bold mt-2">Share your thoughts with the realm</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8">
                    <Button
                      className="w-full py-6 rounded-full bg-cornflower-600 hover:bg-cornflower-700 dark:bg-cornflower-500 dark:hover:bg-cornflower-600 text-white font-black text-sm uppercase tracking-widest shadow-lg hover:shadow-xl shadow-cornflower-500/20 transition-all duration-300"
                      onClick={() => setLocation('/admin/blogs')}
                    >
                      ✍️ Start Writing
                    </Button>
                  </CardContent>
                </Card>

                {/* About Management Card */}
                <Card className="relative overflow-hidden group hover:-translate-y-2 hover:shadow-2xl hover:shadow-cornflower-500/30 transition-all duration-500 rounded-[2.5rem] border-0 bg-gradient-to-br from-card to-card/95 dark:from-cornflower-950/80 dark:to-cornflower-900/60">
                  <CardHeader className="bg-transparent border-b border-cornflower-200/50 dark:border-cornflower-500/15 p-8">
                    <CardTitle className="flex items-center gap-3 text-xl font-black text-cornflower-950 dark:text-cornflower-50">
                      <div className="p-3 bg-cornflower-100 dark:bg-cornflower-500/30 rounded-2xl shadow-sm">
                        <User className="h-6 w-6 text-cornflower-600 dark:text-cornflower-400" />
                      </div>
                      About Me
                    </CardTitle>
                    <CardDescription className="text-cornflower-800/60 dark:text-cornflower-200/70 font-bold mt-2">Personalize your digital identity</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8">
                    <Button
                      className="w-full py-6 rounded-full bg-cornflower-600 hover:bg-cornflower-700 dark:bg-cornflower-500 dark:hover:bg-cornflower-600 text-white font-black text-sm uppercase tracking-widest shadow-lg hover:shadow-xl shadow-cornflower-500/20 transition-all duration-300"
                      onClick={() => setLocation('/admin/about')}
                    >
                      👤 Update Persona
                    </Button>
                  </CardContent>
                </Card>

                {/* Certifications Card */}
                <Card className="relative overflow-hidden group hover:-translate-y-2 hover:shadow-2xl hover:shadow-cornflower-500/20 transition-all duration-500 rounded-[2.5rem] border-0 bg-gradient-to-br from-card to-card/90 dark:from-cornflower-950/80 dark:to-cornflower-900/60">
                  <CardHeader className="bg-transparent border-b border-cornflower-200/30 dark:border-cornflower-500/15 p-8">
                    <CardTitle className="flex items-center gap-3 text-xl font-black text-cornflower-950 dark:text-cornflower-50">
                      <div className="p-3 bg-cornflower-100 dark:bg-cornflower-500/30 rounded-2xl shadow-sm">
                        <Award className="h-6 w-6 text-cornflower-600 dark:text-cornflower-400" />
                      </div>
                      Certifications
                    </CardTitle>
                    <CardDescription className="text-cornflower-800/60 dark:text-cornflower-200/70 font-bold mt-2">Display your magical scrolls</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8">
                    <Button
                      className="w-full py-6 rounded-full bg-cornflower-600 hover:bg-cornflower-700 dark:bg-cornflower-500 dark:hover:bg-cornflower-600 text-white font-black text-sm uppercase tracking-widest shadow-lg hover:shadow-xl transition-all duration-300"
                      onClick={() => setLocation('/admin/certifications')}
                    >
                      📜 Showcase Awards
                    </Button>
                  </CardContent>
                </Card>

                {/* Experience Card */}
                <Card className="relative overflow-hidden group hover:-translate-y-2 hover:shadow-2xl hover:shadow-cornflower-500/20 transition-all duration-500 rounded-[2.5rem] border-0 bg-gradient-to-br from-card to-card/95 dark:from-cornflower-950/80 dark:to-cornflower-900/60">
                  <CardHeader className="bg-transparent border-b border-cornflower-200/30 dark:border-cornflower-500/15 p-8">
                    <CardTitle className="flex items-center gap-3 text-xl font-black text-cornflower-950 dark:text-cornflower-50">
                      <div className="p-3 bg-cornflower-100 dark:bg-cornflower-500/30 rounded-2xl shadow-sm">
                        <Briefcase className="h-6 w-6 text-cornflower-600 dark:text-cornflower-400" />
                      </div>
                      Experience
                    </CardTitle>
                    <CardDescription className="text-cornflower-800/60 dark:text-cornflower-200/70 font-bold mt-2">Nurture your career history</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8">
                    <Button
                      className="w-full py-6 rounded-full bg-cornflower-600 hover:bg-cornflower-700 dark:bg-cornflower-500 dark:hover:bg-cornflower-600 text-white font-black text-sm uppercase tracking-widest shadow-lg hover:shadow-xl transition-all duration-300"
                      onClick={() => setLocation('/admin/experience')}
                    >
                      💼 Update Timeline
                    </Button>
                  </CardContent>
                </Card>

                {/* Technical Skills Card */}
                <Card className="relative overflow-hidden group hover:-translate-y-2 hover:shadow-2xl hover:shadow-cornflower-500/20 transition-all duration-500 rounded-[2.5rem] border-0 bg-gradient-to-br from-card to-card/95 dark:from-cornflower-950/80 dark:to-cornflower-900/60">
                  <CardHeader className="bg-transparent border-b border-cornflower-200/30 dark:border-cornflower-500/15 p-8">
                    <CardTitle className="flex items-center gap-3 text-xl font-black text-cornflower-950 dark:text-cornflower-50">
                      <div className="p-3 bg-cornflower-100 dark:bg-cornflower-500/30 rounded-2xl shadow-sm">
                        <Code className="h-6 w-6 text-cornflower-600 dark:text-cornflower-400" />
                      </div>
                      Technical Skills
                    </CardTitle>
                    <CardDescription className="text-cornflower-800/60 dark:text-cornflower-200/70 font-bold mt-2">Refine your technical mastery</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8">
                    <Button
                      className="w-full py-6 rounded-full bg-cornflower-600 hover:bg-cornflower-700 dark:bg-cornflower-500 dark:hover:bg-cornflower-600 text-white font-black text-sm uppercase tracking-widest shadow-lg hover:shadow-xl transition-all duration-300"
                      onClick={() => setLocation('/admin/technical-skills')}
                    >
                      💻 Polish Skills
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmation.confirmState.isOpen}
        onOpenChange={deleteConfirmation.closeConfirmDialog}
        title={deleteConfirmation.getTitle()}
        description={deleteConfirmation.getConfirmationText()}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={deleteConfirmation.confirmDelete}
        isLoading={deleteMessageMutation.isPending}
      />
    </AdminLayout>
  );
}
