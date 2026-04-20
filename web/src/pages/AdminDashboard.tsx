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
import { LogOut, Users, MessageSquare, FolderOpen, FileText, Award, BarChart3, User, Briefcase, Code, ShieldCheck, Sun, Moon, ArrowLeft, Eye, EyeOff, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useDeleteConfirmation } from '@/hooks/useDeleteConfirmation';
import { apiGet, apiPut, apiDelete } from '@/utils/api';

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
    unseen_count: number;
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/contact/admin/messages'] });
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
    <div className="min-h-screen bg-background overflow-x-hidden">
      <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-gray-950/90 shadow-md border-b border-gray-200 dark:border-gray-800 backdrop-blur">
        <div className="px-4 py-2 sm:p-4 flex h-14 sm:h-16 items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1 mr-4">
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-700 dark:text-indigo-300 flex-shrink-0" />
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
              <h1 className="text-base sm:text-xl font-bold truncate">Admin Dashboard</h1>
              <Badge className="hidden md:inline-flex">Welcome, {currentUser.username}</Badge>
              <Badge className="hidden sm:inline-flex md:hidden text-xs px-2 py-1">Hi, {currentUser.username.slice(0, 10)}</Badge>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            <ThemeToggle 
              variant="outline"
              className="h-8 w-8 sm:h-9 sm:w-9 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
              showTooltip={true}
            />
            <ProfileButton 
              onClick={() => setProfileModalOpen(true)}
            />
            <Button 
              onClick={handleLogout} 
              size="sm"
              className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 px-2 sm:px-4 h-8 sm:h-9 text-xs sm:text-sm"
            >
              <LogOut className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="pt-2 pb-6 w-full px-1 sm:px-6">
        <div className="w-full max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto sm:h-10 p-1 gap-1 sm:gap-0">
              <TabsTrigger value="overview" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-4 py-2 sm:py-0 h-auto sm:h-9 min-h-8">
                <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="hidden xs:inline truncate">Overview</span>
                <span className="xs:hidden">📊</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-4 py-2 sm:py-0 h-auto sm:h-9 min-h-8">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="hidden xs:inline truncate">Users</span>
                <span className="xs:hidden">👥</span>
              </TabsTrigger>
              <TabsTrigger value="messages" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-4 py-2 sm:py-0 h-auto sm:h-9 min-h-8 relative">
                <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="hidden xs:inline truncate">Messages</span>
                <span className="xs:hidden">💬</span>
                {typedMessagesData?.unseen_count > 0 && (
                  <Badge variant="destructive" className="absolute -top-0.5 -right-0.5 sm:relative sm:top-0 sm:right-0 sm:ml-1 px-1 py-0 text-xs h-3.5 min-w-3.5 sm:h-4 sm:min-w-4 flex items-center justify-center">
                    {typedMessagesData.unseen_count}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="content" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-4 py-2 sm:py-0 h-auto sm:h-9 min-h-8">
                <FolderOpen className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="hidden xs:inline truncate">Content</span>
                <span className="xs:hidden">📁</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 sm:space-y-8 px-1 sm:px-0">
              {/* Welcome Section */}
              <div className="text-center space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard Overview</h2>
                <p className="text-sm sm:text-base text-muted-foreground">Monitor your portfolio performance and manage content</p>
              </div>

              {/* Stats Cards */}
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                <Card className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gray-50 dark:bg-gray-900 rounded-t">
                    <CardTitle className="text-sm font-semibold text-gray-900 dark:text-gray-100">Projects</CardTitle>
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full ring-1 ring-gray-200 dark:ring-gray-700">
                      <FolderOpen className="h-4 w-4 text-blue-500 dark:text-blue-300" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {statsLoading ? '...' : stats?.projects_count || 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Active projects</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gray-50 dark:bg-gray-900 rounded-t">
                    <CardTitle className="text-sm font-semibold text-gray-900 dark:text-gray-100">Blog Posts</CardTitle>
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full ring-1 ring-gray-200 dark:ring-gray-700">
                      <FileText className="h-4 w-4 text-green-500 dark:text-green-300" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {statsLoading ? '...' : stats?.blogs_count || 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Published articles</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gray-50 dark:bg-gray-900 rounded-t">
                    <CardTitle className="text-sm font-semibold text-gray-900 dark:text-gray-100">Certifications</CardTitle>
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full ring-1 ring-gray-200 dark:ring-gray-700">
                      <Award className="h-4 w-4 text-purple-500 dark:text-purple-300" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {statsLoading ? '...' : stats?.certifications_count || 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Earned certificates</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gray-50 dark:bg-gray-900 rounded-t">
                    <CardTitle className="text-sm font-semibold text-gray-900 dark:text-gray-100">Messages</CardTitle>
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full ring-1 ring-gray-200 dark:ring-gray-700">
                      <MessageSquare className="h-4 w-4 text-orange-500 dark:text-orange-300" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {statsLoading ? '...' : stats?.contact_messages_count || 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Contact inquiries</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gray-50 dark:bg-gray-900 rounded-t">
                    <CardTitle className="text-sm font-semibold text-gray-900 dark:text-gray-100">Users</CardTitle>
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full ring-1 ring-gray-200 dark:ring-gray-700">
                      <Users className="h-4 w-4 text-indigo-500 dark:text-indigo-300" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-indigo-600">
                      {statsLoading ? '...' : stats?.users_count || 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Registered users</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="users" className="space-y-4 sm:space-y-6 px-1 sm:px-0">
              <Card className="shadow-lg dark:shadow-none">
                <CardHeader className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 rounded-t">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full">
                    <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <Users className="h-5 w-5 text-indigo-500 dark:text-indigo-300" />
                      Registered Users ({usersData?.total || 0})
                    </CardTitle>
                    <div className="mt-2 sm:mt-0 flex justify-end">
                      <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search users..."
                        className="w-full sm:w-64 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                  <CardDescription className="text-muted-foreground dark:text-gray-300">
                    View and manage user roles and permissions
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {usersLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-300"></div>
                      <span className="ml-2 text-muted-foreground dark:text-gray-300">Loading users...</span>
                    </div>
                  ) : (
                    <>
                      {/* All users in a scrollable container */}
                      <div className="space-y-4 overflow-y-auto" style={{ maxHeight: '50vh' }}>
                        {usersData?.users?.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground dark:text-gray-300">No users found.</div>
                        ) : (
                          usersData?.users?.map((user: User) => (
                            <div
                              key={user.id}
                              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 space-y-3 sm:space-y-0"
                            >
                              <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-700 dark:to-purple-800 rounded-full flex items-center justify-center flex-shrink-0">
                                  <User className="h-5 w-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{user.username}</h3>
                                  <p className="text-sm text-muted-foreground dark:text-gray-300 truncate">{user.email}</p>
                                  <p className="text-xs text-muted-foreground dark:text-gray-400">
                                    Joined: {new Date(user.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between sm:justify-end space-x-3">
                                <Badge
                                  className={user.is_admin
                                    ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800"
                                    : "dark:bg-gray-700 dark:text-gray-200"}
                                >
                                  {user.is_admin ? "Admin" : "User"}
                                </Badge>
                                <Button
                                  onClick={() => toggleAdminMutation.mutate(user.id)}
                                  disabled={toggleAdminMutation.isPending}
                                  className={
                                    user.is_admin
                                      ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/50 hover:border-red-300 dark:hover:border-red-700 text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                                      : "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 hover:border-indigo-300 dark:hover:border-indigo-700 text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                                  }
                                >
                                  <span className="hidden sm:inline">{user.is_admin ? "🔒 Remove Admin" : "👑 Make Admin"}</span>
                                  <span className="sm:hidden">{user.is_admin ? "🔒" : "👑"}</span>
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
                                    ? "bg-indigo-600 dark:bg-indigo-700 text-white shadow-lg transform scale-105"
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

            <TabsContent value="messages" className="space-y-4 sm:space-y-6 px-1 sm:px-0">
              <Card className="shadow-lg dark:shadow-none">
                <CardHeader className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 rounded-t">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full">
                    <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <MessageSquare className="h-5 w-5 text-orange-500 dark:text-orange-300" />
                      Messages ({typedMessagesData?.total || 0})
                    </CardTitle>
                    <div className="mt-2 sm:mt-0 flex flex-col sm:flex-row gap-2">
                      {typedMessagesData?.counts?.unread > 0 && (
                        <Button
                          onClick={() => markAllReadMutation.mutate()}
                          disabled={markAllReadMutation.isPending}
                          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 shadow-md hover:shadow-lg font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                          ✓ Mark All Read ({typedMessagesData.counts.unread})
                        </Button>
                      )}
                      <input
                        type="text"
                        value={messagesSearch}
                        onChange={e => setMessagesSearch(e.target.value)}
                        placeholder="Search messages..."
                        className="w-full sm:w-64 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                      />
                      
                      {/* Message Status Filter */}
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setMessagesStatusFilter('all');
                            setMessagesPage(1);
                          }}
                          className={`${
                            messagesStatusFilter === 'all'
                              ? 'bg-slate-700 hover:bg-slate-800 text-white hover:text-white border-slate-700 dark:bg-slate-200 dark:hover:bg-slate-300 dark:text-slate-900 dark:hover:text-slate-900 dark:border-slate-200'
                              : 'bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 border-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 dark:hover:text-gray-200 dark:border-gray-600'
                          } font-medium transition-colors duration-200`}
                        >
                          All
                          {typedMessagesData?.counts?.all && (
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                              messagesStatusFilter === 'all'
                                ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                              {typedMessagesData.counts.all}
                            </span>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setMessagesStatusFilter('unread');
                            setMessagesPage(1);
                          }}
                          className={`${
                            messagesStatusFilter === 'unread'
                              ? 'bg-slate-700 hover:bg-slate-800 text-white hover:text-white border-slate-700 dark:bg-slate-200 dark:hover:bg-slate-300 dark:text-slate-900 dark:hover:text-slate-900 dark:border-slate-200'
                              : 'bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 border-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 dark:hover:text-gray-200 dark:border-gray-600'
                          } font-medium transition-colors duration-200`}
                        >
                          Unread
                          {typedMessagesData?.counts?.unread > 0 && (
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                              messagesStatusFilter === 'unread'
                                ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                                : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
                            }`}>
                              {typedMessagesData.counts.unread}
                            </span>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setMessagesStatusFilter('read');
                            setMessagesPage(1);
                          }}
                          className={`${
                            messagesStatusFilter === 'read'
                              ? 'bg-slate-700 hover:bg-slate-800 text-white hover:text-white border-slate-700 dark:bg-slate-200 dark:hover:bg-slate-300 dark:text-slate-900 dark:hover:text-slate-900 dark:border-slate-200'
                              : 'bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 border-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 dark:hover:text-gray-200 dark:border-gray-600'
                          } font-medium transition-colors duration-200`}
                        >
                          Read
                          {typedMessagesData?.counts?.read > 0 && (
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                              messagesStatusFilter === 'read'
                                ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                              {typedMessagesData.counts.read}
                            </span>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <CardDescription className="text-muted-foreground dark:text-gray-300">
                    Review and respond to contact inquiries
                    {messagesStatusFilter !== 'all' && (
                      <span className="ml-2 text-sm">
                        • Showing {messagesStatusFilter} messages ({typedMessagesData?.total || 0})
                      </span>
                    )}
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
                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4" style={{ minHeight: '60vh' }}>
                        {/* Left panel: Message list - Hidden on mobile when message is selected */}
                        <div className={`lg:col-span-2 flex flex-col lg:border-r border-gray-200 dark:border-gray-700 lg:pr-4 ${
                          selectedMessage ? 'hidden lg:flex' : 'flex'
                        }`}>
                          <div className="flex-1 overflow-y-auto space-y-2" style={{ maxHeight: '60vh' }}>
                            {!typedMessagesData?.messages || typedMessagesData?.messages?.length === 0 ? (
                              <div className="text-center py-8 text-muted-foreground dark:text-gray-300">No messages found.</div>
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
                                  className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                                    selectedMessage?.id === message.id
                                      ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700 shadow-md'
                                      : !message.is_read 
                                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30' 
                                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                                  }`}
                                >
                                  <div className="flex items-start gap-2">
                                    {!message.is_read && (
                                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" title="Unread" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between mb-1">
                                        <h4 className={`text-sm font-semibold truncate ${
                                          !message.is_read 
                                            ? 'text-gray-900 dark:text-gray-100' 
                                            : 'text-gray-700 dark:text-gray-300'
                                        }`}>{message.name}</h4>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                                          {new Date(message.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </span>
                                      </div>
                                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate mb-1">
                                        {message.subject}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-500 line-clamp-2">
                                        {message.message}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                          
                          {/* Pagination at the bottom of the list */}
                          {typedMessagesData?.total_pages > 1 && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                              <nav aria-label="Pagination" className="flex items-center justify-center gap-1">
                                <button
                                  className="px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                  onClick={() => setMessagesPage(typedMessagesData.page - 1)}
                                  disabled={typedMessagesData.page === 1}
                                >
                                  ←
                                </button>
                                <span className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300">
                                  {typedMessagesData.page} / {typedMessagesData.total_pages}
                                </span>
                                <button
                                  className="px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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
                        <div className={`lg:col-span-3 flex flex-col ${
                          selectedMessage ? 'flex' : 'hidden lg:flex'
                        }`}>
                          {selectedMessage ? (
                            <div className="flex-1 overflow-y-auto">
                              <div className="space-y-4">
                                {/* Back button for mobile */}
                                <button
                                  onClick={() => setSelectedMessage(null)}
                                  className="lg:hidden flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition-colors"
                                >
                                  <ArrowLeft className="h-5 w-5" />
                                  <span className="font-medium">Back to messages</span>
                                </button>
                                
                                {/* Message header */}
                                <div className="flex items-start justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
                                  <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 dark:from-orange-700 dark:to-red-800 rounded-full flex items-center justify-center flex-shrink-0">
                                      <MessageSquare className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                        {selectedMessage.subject}
                                      </h3>
                                      <div className="flex items-center gap-2 mt-1">
                                        {!selectedMessage.is_read && (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                            Unread
                                          </span>
                                        )}
                                        {selectedMessage.is_read && (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-xs font-medium rounded-full">
                                            ✓ Read
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <TooltipProvider>
                                    <div className="flex gap-2">
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            onClick={() => {
                                              toggleMessageReadMutation.mutate(selectedMessage.id);
                                              // Optimistically update the local state for immediate UI feedback
                                              setSelectedMessage({
                                                ...selectedMessage,
                                                is_read: !selectedMessage.is_read,
                                                read_at: !selectedMessage.is_read ? new Date().toISOString() : null
                                              });
                                            }}
                                            disabled={toggleMessageReadMutation.isPending}
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                                          >
                                            {selectedMessage.is_read ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>{selectedMessage.is_read ? 'Mark as unread' : 'Mark as read'}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            onClick={() => {
                                              deleteConfirmation.openConfirmDialog(selectedMessage);
                                              setSelectedMessage(null);
                                            }}
                                            disabled={deleteMessageMutation.isPending}
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Delete message</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </div>
                                  </TooltipProvider>
                                </div>

                                {/* Sender information */}
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">From:</span>
                                    <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">{selectedMessage.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email:</span>
                                    <a href={`mailto:${selectedMessage.email}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                                      {selectedMessage.email}
                                    </a>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Received:</span>
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                      {new Date(selectedMessage.created_at).toLocaleDateString()} at {new Date(selectedMessage.created_at).toLocaleTimeString()}
                                    </span>
                                  </div>
                                  {selectedMessage.is_read && selectedMessage.read_at && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Read:</span>
                                      <span className="text-sm text-green-600 dark:text-green-400">
                                        {new Date(selectedMessage.read_at).toLocaleDateString()} at {new Date(selectedMessage.read_at).toLocaleTimeString()}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Message content */}
                                <div className="bg-white dark:bg-gray-800 rounded-lg border-l-4 border-orange-500 p-4">
                                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Message:</h4>
                                  <p className="text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">
                                    {selectedMessage.message}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex-1 flex items-center justify-center">
                              <div className="text-center space-y-3">
                                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
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
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content" className="space-y-4 sm:space-y-6 px-1 sm:px-0">
              <div className="text-center space-y-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Content Management</h2>
                <p className="text-sm sm:text-base text-muted-foreground">Manage all aspects of your portfolio content</p>
              </div>

              <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 px-2 sm:px-0">
                {/* Projects Card */}
                <Card className="hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900">
                  <CardHeader className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 rounded-t p-4 sm:p-6">
                    <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                      <FolderOpen className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 dark:text-blue-300" />
                      Projects
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm text-muted-foreground dark:text-gray-300">Manage your portfolio projects</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <Button
                      className="w-full px-4 sm:px-6 py-3 sm:py-3.5 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 text-white shadow-lg hover:shadow-xl focus-visible:ring-2 focus-visible:ring-blue-400 transition-all duration-300 transform hover:-translate-y-1 font-medium text-sm sm:text-base"
                      onClick={() => setLocation('/admin/projects')}
                    >
                      🚀 Manage Projects
                    </Button>
                  </CardContent>
                </Card>

                {/* Blog Posts Card */}
                <Card className="hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900">
                  <CardHeader className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 rounded-t p-4 sm:p-6">
                    <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 dark:text-green-300" />
                      Blog Posts
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm text-muted-foreground dark:text-gray-300">Create and edit blog articles</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <Button
                      className="w-full px-4 sm:px-6 py-3 sm:py-3.5 rounded-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 dark:from-green-600 dark:to-green-700 dark:hover:from-green-700 dark:hover:to-green-800 text-white shadow-lg hover:shadow-xl focus-visible:ring-2 focus-visible:ring-green-400 transition-all duration-300 transform hover:-translate-y-1 font-medium text-sm sm:text-base"
                      onClick={() => setLocation('/admin/blogs')}
                    >
                      ✍️ Manage Blog Posts
                    </Button>
                  </CardContent>
                </Card>

                {/* Certifications Card */}
                <Card className="hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900 dark:to-violet-900">
                  <CardHeader className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 rounded-t p-4 sm:p-6">
                    <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                      <Award className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 dark:text-purple-300" />
                      Certifications
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm text-muted-foreground dark:text-gray-300">Add and update certifications</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <Button
                      className="w-full px-4 sm:px-6 py-3 sm:py-3.5 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 dark:from-purple-600 dark:to-purple-700 dark:hover:from-purple-700 dark:hover:to-purple-800 text-white shadow-lg hover:shadow-xl focus-visible:ring-2 focus-visible:ring-purple-400 transition-all duration-300 transform hover:-translate-y-1 font-medium text-sm sm:text-base"
                      onClick={() => setLocation('/admin/certifications')}
                    >
                      🏆 Manage Certifications
                    </Button>
                  </CardContent>
                </Card>

                {/* About Section Card */}
                <Card className="hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900 dark:to-red-900">
                  <CardHeader className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 rounded-t p-4 sm:p-6">
                    <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                      <User className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 dark:text-orange-300" />
                      About Section
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm text-muted-foreground dark:text-gray-300">Update your personal information</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <Button
                      className="w-full px-4 sm:px-6 py-3 sm:py-3.5 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 dark:from-orange-600 dark:to-orange-700 dark:hover:from-orange-700 dark:hover:to-orange-800 text-white shadow-lg hover:shadow-xl focus-visible:ring-2 focus-visible:ring-orange-400 transition-all duration-300 transform hover:-translate-y-1 font-medium text-sm sm:text-base"
                      onClick={() => setLocation('/admin/about')}
                    >
                      👤 Manage About
                    </Button>
                  </CardContent>
                </Card>

                {/* Experience Card */}
                <Card className="hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900 dark:to-cyan-900">
                  <CardHeader className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 rounded-t p-4 sm:p-6">
                    <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                      <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-teal-500 dark:text-teal-300" />
                      Experience
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm text-muted-foreground dark:text-gray-300">Manage work experience entries</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <Button
                      className="w-full px-4 sm:px-6 py-3 sm:py-3.5 rounded-lg bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 dark:from-teal-600 dark:to-teal-700 dark:hover:from-teal-700 dark:hover:to-teal-800 text-white shadow-lg hover:shadow-xl focus-visible:ring-2 focus-visible:ring-teal-400 transition-all duration-300 transform hover:-translate-y-1 font-medium text-sm sm:text-base"
                      onClick={() => setLocation('/admin/experience')}
                    >
                      💼 Manage Experience
                    </Button>
                  </CardContent>
                </Card>

                {/* Technical Skills Card */}
                <Card className="hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900 dark:to-rose-900">
                  <CardHeader className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 rounded-t p-4 sm:p-6">
                    <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                      <Code className="h-4 w-4 sm:h-5 sm:w-5 text-pink-500 dark:text-pink-300" />
                      Technical Skills
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm text-muted-foreground dark:text-gray-300">Update your technical skills</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <Button
                      className="w-full px-4 sm:px-6 py-3 sm:py-3.5 rounded-lg bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 dark:from-pink-600 dark:to-pink-700 dark:hover:from-pink-700 dark:hover:to-pink-800 text-white shadow-lg hover:shadow-xl focus-visible:ring-2 focus-visible:ring-pink-400 transition-all duration-300 transform hover:-translate-y-1 font-medium text-sm sm:text-base"
                      onClick={() => setLocation('/admin/technical-skills')}
                    >
                      💻 Manage Skills
                    </Button>
                  </CardContent>
                </Card>
              </div>

            </TabsContent>
          </Tabs>
        </div>

      </main>

      {/* Profile Modal */}
      <ProfileModal 
        isOpen={profileModalOpen} 
        onClose={() => setProfileModalOpen(false)} 
      />

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
    </div>
  );
}