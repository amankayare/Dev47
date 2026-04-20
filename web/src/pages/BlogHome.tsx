import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Search, ExternalLink, Calendar, User, Clock, Eye, BookOpen, X, LogIn, UserPlus, LogOut, Settings, ChevronDown, Menu, Filter, ChevronRight, ChevronLeft, MoreVertical } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/hooks/use-toast';
import { useBlogs } from '@/hooks/useBlogs';

interface Blog {
  id: number;
  title: string;
  excerpt?: string;
  content: string;
  cover_image?: string;
  date: string;
  reading_time?: number;
  featured: boolean;
  author?: { id: number; name: string; email?: string };
  tags?: Array<{ id: number; name: string }>;
  category?: { id: number; name: string };
}

interface Category {
  id: number;
  name: string;
}

export default function BlogHome() {
  const { theme, setTheme } = useTheme();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);

  // Mobile sidebar states
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check authentication status
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      try {
        setCurrentUser(JSON.parse(user));
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Handle URL parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tagParam = urlParams.get('tag');
    if (tagParam) {
      setSelectedTag(tagParam.toLowerCase());
    }
  }, [location]);

  // Mobile detection and responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
      if (window.innerWidth >= 1024) {
        // Close mobile sidebars on desktop
        setLeftSidebarOpen(false);
        setRightSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebars when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile && (leftSidebarOpen || rightSidebarOpen)) {
        const target = event.target as Element;
        if (!target.closest('.mobile-sidebar') && !target.closest('.sidebar-toggle')) {
          setLeftSidebarOpen(false);
          setRightSidebarOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, leftSidebarOpen, rightSidebarOpen]);

  // Use the useBlogs hook for pagination and filtering
  const {
    blogs,
    allBlogs,
    totalBlogs,
    isLoading,
    error,
    hasNextPage,
    hasPrevPage,
    goToPage,
    nextPage,
    prevPage,
    totalPages,
    currentPage,
    resetPagination,
    pageSize
  } = useBlogs({ search, selectedCategory, selectedTag });

  // Reset pagination when filters change
  useEffect(() => {
    resetPagination();
  }, [search, selectedCategory, selectedTag]); // Removed resetPagination from dependencies

  // Enhanced pagination functions with loading states
  const handlePageChange = async (pageChangeFunction: () => void) => {
    setIsPageTransitioning(true);
    pageChangeFunction();
    // Small delay for smooth transition
    setTimeout(() => {
      setIsPageTransitioning(false);
    }, 300);
  };

  const handleGoToPage = (pageNum: number) => {
    handlePageChange(() => goToPage(pageNum));
  };

  const handleNextPage = () => {
    handlePageChange(() => nextPage());
  };

  const handlePrevPage = () => {
    handlePageChange(() => prevPage());
  };

  // Keyboard navigation for pagination  
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only handle if not typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (event.key === 'ArrowLeft' && hasPrevPage) {
        event.preventDefault();
        handlePrevPage();
      } else if (event.key === 'ArrowRight' && hasNextPage) {
        event.preventDefault();
        handleNextPage();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [hasNextPage, hasPrevPage, handleNextPage, handlePrevPage]);
  // Fetch categories dynamically
  const { data: categories = [], isLoading: isCategoriesLoading, error: categoriesError } = useQuery({
    queryKey: ['/api/blog-categories'],
    queryFn: async (): Promise<Category[]> => {
      const response = await fetch('/api/blog-categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    },
    staleTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    const cards = document.querySelectorAll('.blog-card-animate');
    cards.forEach((card, i) => {
      card.classList.add('opacity-0', 'translate-y-8');
      setTimeout(() => {
        card.classList.remove('opacity-0', 'translate-y-8');
        card.classList.add('opacity-100', 'translate-y-0', 'transition-all', 'duration-700');
      }, 100 + i * 120);
    });
  }, [allBlogs]);

  // Helper functions for filter management
  const clearAllFilters = () => {
    setSearch('');
    setSelectedCategory(null);
    setSelectedTag(null);
    // Update URL to remove tag parameter
    const url = new URL(window.location.href);
    url.searchParams.delete('tag');
    window.history.replaceState({}, '', url.toString());
  };

  const clearTagFilter = () => {
    setSelectedTag(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('tag');
    window.history.replaceState({}, '', url.toString());
  };

  const hasActiveFilters = search !== '' || selectedCategory !== null || selectedTag !== null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
  };

  return (
    <div className="hero-squares min-h-screen bg-gradient-to-br from-background/90 via-card/90 to-muted/80">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-2 sm:px-4 flex h-16 sm:h-20 lg:h-24 items-center justify-between gap-2">
          {/* Logo Section */}
          <div className="flex items-center gap-1 sm:gap-3">
            <img 
              src={theme === 'dark' ? '/logo-dark.svg' : '/logo-light.svg'} 
              alt="Blog Logo" 
              className="h-12 sm:h-14 md:h-16 lg:h-18 w-auto transition-opacity duration-300"
            />
          </div>

          <div className="flex items-center gap-1 sm:gap-3 lg:gap-6">
            {/* Desktop Search Bar - Hidden on small mobile */}
            <div className="hidden sm:block relative w-48 md:w-56 lg:w-72">
              <div className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 p-0.5 sm:p-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
                <Search className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 sm:pl-12 pr-2 sm:pr-4 py-2 sm:py-3 text-sm rounded-xl shadow focus:ring-2 focus:ring-primary/40 bg-background border border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Desktop Authentication Buttons - Hidden on mobile */}
            {!isMobile && currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 px-3 py-2 h-auto rounded-lg hover:bg-accent transition-colors border"
                  >
                    <div className="p-1 rounded-full bg-gradient-to-r from-green-500 to-teal-500">
                      <User className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {currentUser.username}
                    </span>
                    <div className="p-1 rounded-full bg-gradient-to-r from-gray-500 to-gray-600 ml-2">
                      <ChevronDown className="w-3 h-3 text-white" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="bottom" className="w-48 min-w-[12rem] bg-popover border shadow-md">
                  <DropdownMenuItem
                    onClick={() => setLocation('/profile')}
                    className="cursor-pointer hover:bg-accent"
                  >
                    <div className="p-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 mr-2">
                      <Settings className="w-3 h-3 text-white" />
                    </div>
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-destructive hover:bg-destructive/10 focus:text-destructive"
                  >
                    <div className="p-1 rounded-full bg-gradient-to-r from-red-500 to-pink-500 mr-2">
                      <LogOut className="w-3 h-3 text-white" />
                    </div>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : !isMobile && (
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation('/login')}
                  className="gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary/30 text-foreground border-border"
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </Button>
                <Button
                  size="sm"
                  onClick={() => setLocation('/register')}
                  className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <UserPlus className="w-4 h-4" />
                  Sign Up
                </Button>
              </div>
            )}

            {/* Theme Toggle Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="h-10 w-10 p-0 rounded-full shadow hover:bg-primary/10"
            >
              {theme === 'dark' ? '🌞' : '🌙'}
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* Mobile Dropdown Menu - Positioned after theme toggle */}
            {isMobile && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 hover:bg-accent rounded-lg lg:hidden"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="bottom" className="w-64 bg-popover border shadow-lg">
                  {/* Mobile Search */}
                  <div className="p-3">
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 p-0.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
                        <Search className="w-3 h-3 text-white" />
                      </div>
                      <Input
                        placeholder="Search articles..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 pr-3 py-2 text-sm rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>
                  <DropdownMenuSeparator />

                  {/* Navigation Items */}
                  <DropdownMenuItem
                    onClick={() => setLeftSidebarOpen(true)}
                    className="cursor-pointer hover:bg-accent"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filters & Categories
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => setRightSidebarOpen(true)}
                    className="cursor-pointer hover:bg-accent"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Recent Posts & Tags
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {/* Authentication Section */}
                  {currentUser ? (
                    <>
                      <div className="px-3 py-2 text-sm text-muted-foreground border-b border-border">
                        Logged in as <span className="font-medium text-foreground">{currentUser.username}</span>
                      </div>
                      <DropdownMenuItem
                        onClick={() => setLocation('/profile')}
                        className="cursor-pointer hover:bg-accent"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Profile Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="cursor-pointer text-destructive hover:bg-destructive/10 focus:text-destructive"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem
                        onClick={() => setLocation('/login')}
                        className="cursor-pointer hover:bg-accent"
                      >
                        <LogIn className="w-4 h-4 mr-2" />
                        Sign In
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setLocation('/register')}
                        className="cursor-pointer hover:bg-accent"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Sign Up
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      {/* Filter Status Display */}
      {hasActiveFilters && (
        <div className="border-b border-border/40 bg-muted/20 backdrop-blur-sm">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">Active filters:</span>

              {search && (
                <Badge variant="outline" className="gap-2">
                  Search: "{search}"
                  <button
                    onClick={() => setSearch('')}
                    className="hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <div className="p-0.5 rounded-full bg-gradient-to-r from-red-500 to-pink-500">
                      <X className="h-2 w-2 text-white" />
                    </div>
                  </button>
                </Badge>
              )}

              {selectedCategory && (
                <Badge variant="outline" className="gap-2">
                  Category: {categories.find(c => c.id === selectedCategory)?.name}
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <div className="p-0.5 rounded-full bg-gradient-to-r from-red-500 to-pink-500">
                      <X className="h-2 w-2 text-white" />
                    </div>
                  </button>
                </Badge>
              )}

              {selectedTag && (
                <Badge variant="outline" className="gap-2">
                  Tag: {selectedTag}
                  <button
                    onClick={clearTagFilter}
                    className="hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <div className="p-0.5 rounded-full bg-gradient-to-r from-red-500 to-pink-500">
                      <X className="h-2 w-2 text-white" />
                    </div>
                  </button>
                </Badge>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs h-8 px-3"
              >
                Clear All
              </Button>

              <span className="text-xs text-muted-foreground ml-auto">
                {allBlogs.length} of {totalBlogs.length} posts
              </span>
            </div>
          </div>
        </div>
      )}
      {/* Main Content */}
      <div className="relative">
        {/* Mobile Sidebar Overlays */}
        {isMobile && (leftSidebarOpen || rightSidebarOpen) && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => {
              setLeftSidebarOpen(false);
              setRightSidebarOpen(false);
            }}
          />
        )}

        {/* Mobile Left Sidebar */}
        {isMobile && (
          <div className={`mobile-sidebar fixed left-0 top-0 h-full w-80 bg-background border-r border-border z-50 transform transition-transform duration-300 lg:hidden ${leftSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold">Filters</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLeftSidebarOpen(false)}
                className="p-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4 space-y-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 80px)' }}>
              {/* Categories Mobile */}
              <Card className="shadow-xl bg-white dark:bg-background border border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-gradient bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={selectedCategory === null ? "default" : "secondary"}
                      className={`rounded-full px-3 py-1 font-semibold cursor-pointer transition-colors duration-200 ${selectedCategory === null
                        ? 'bg-primary text-white'
                        : 'bg-primary/10 text-primary hover:bg-primary/20'
                        }`}
                      onClick={() => setSelectedCategory(null)}
                    >
                      All Categories ({totalBlogs.length})
                    </Badge>

                    {isCategoriesLoading ? (
                      <span className="text-muted-foreground text-sm">Loading...</span>
                    ) : categoriesError ? (
                      <span className="text-red-500 text-sm">Failed to load categories</span>
                    ) : categories.length === 0 ? (
                      <span className="text-muted-foreground text-sm">No categories</span>
                    ) : (
                      categories.map((cat) => {
                        const postsCount = totalBlogs.filter(blog => blog.category?.id === cat.id).length;
                        return (
                          <Badge
                            key={cat.id}
                            variant={selectedCategory === cat.id ? "default" : "secondary"}
                            className={`rounded-full px-3 py-1 font-semibold cursor-pointer transition-colors duration-200 ${selectedCategory === cat.id
                              ? 'bg-primary text-white'
                              : 'bg-primary/10 text-primary hover:bg-primary/20'
                              }`}
                            onClick={() => setSelectedCategory(cat.id)}
                          >
                            {cat.name} ({postsCount})
                          </Badge>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Featured Posts Mobile */}
              <Card className="shadow-xl bg-white dark:bg-background border border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-gradient bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                    Top Featured Posts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="divide-y divide-border">
                    {totalBlogs
                      .filter((post) => post.featured)
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 5)
                      .map((post, idx) => (
                        <li key={post.id} className="py-2 first:pt-0 last:pb-0">
                          <a
                            href={`/blog/${post.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-black dark:text-white font-medium text-sm leading-tight hover:text-primary hover:underline"
                          >
                            {post.title}
                          </a>
                          {post.reading_time && (
                            <span className="block text-xs text-muted-foreground mt-1">
                              {post.reading_time} min read
                            </span>
                          )}
                        </li>
                      ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Mobile Right Sidebar */}
        {isMobile && (
          <div className={`mobile-sidebar fixed right-0 top-0 h-full w-80 bg-background border-l border-border z-50 transform transition-transform duration-300 lg:hidden ${rightSidebarOpen ? 'translate-x-0' : 'translate-x-full'
            }`}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold">Recent & More</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRightSidebarOpen(false)}
                className="p-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4 space-y-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 80px)' }}>
              {/* Recent Posts Mobile */}
              <Card className="shadow-xl bg-white dark:bg-background border border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-gradient bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    Recent Posts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="divide-y divide-border">
                    {blogs
                      .slice()
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 5)
                      .map((post, idx) => (
                        <li key={post.id} className="py-2 first:pt-0 last:pb-0">
                          <a
                            href={`/blog/${post.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-black dark:text-white font-medium text-sm leading-tight hover:text-primary hover:underline"
                          >
                            {post.title}
                          </a>
                          {post.reading_time && (
                            <span className="block text-xs text-muted-foreground mt-1">
                              {post.reading_time} min read
                            </span>
                          )}
                        </li>
                      ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-16">
          {/* Left Sidebar: Categories - Hidden on mobile */}
          <aside className="hidden lg:block lg:col-span-2 space-y-8">
            <div className="sticky top-24 space-y-8">
              <Card className="shadow-xl bg-white dark:bg-background border border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-gradient bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {/* "All Categories" option */}
                    <Badge
                      variant={selectedCategory === null ? "default" : "secondary"}
                      className={`rounded-full px-3 py-1 font-semibold cursor-pointer transition-colors duration-200 ${selectedCategory === null
                        ? 'bg-primary text-white'
                        : 'bg-primary/10 text-primary hover:bg-primary/20'
                        }`}
                      onClick={() => setSelectedCategory(null)}
                    >
                      All Categories ({totalBlogs.length})
                    </Badge>

                    {isCategoriesLoading ? (
                      <span className="text-muted-foreground text-sm">Loading...</span>
                    ) : categoriesError ? (
                      <span className="text-red-500 text-sm">Failed to load categories</span>
                    ) : categories.length === 0 ? (
                      <span className="text-muted-foreground text-sm">No categories</span>
                    ) : (
                      categories.map((cat) => {
                        const postsCount = totalBlogs.filter(blog => blog.category?.id === cat.id).length;
                        return (
                          <Badge
                            key={cat.id}
                            variant={selectedCategory === cat.id ? "default" : "secondary"}
                            className={`rounded-full px-3 py-1 font-semibold cursor-pointer transition-colors duration-200 ${selectedCategory === cat.id
                              ? 'bg-primary text-white'
                              : 'bg-primary/10 text-primary hover:bg-primary/20'
                              }`}
                            onClick={() => setSelectedCategory(cat.id)}
                          >
                            {cat.name} ({postsCount})
                          </Badge>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
              {/* Top Featured Posts Block */}
              <Card className="shadow-xl bg-white dark:bg-background border border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-gradient bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                    Top Featured Posts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="divide-y divide-border">
                    {totalBlogs
                      .filter((post) => post.featured)
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 5)
                      .map((post) => (
                        <li key={post.id} className="py-2 first:pt-0 last:pb-0">
                          <a
                            href={`/blog/${post.id}`}
                            className="block text-black dark:text-white font-semibold text-base leading-tight hover:text-yellow-600 hover:underline"
                          >
                            {post.title}
                          </a>
                          {post.reading_time && (
                            <span className="block text-xs text-muted-foreground mt-1">{post.reading_time} min read</span>
                          )}
                        </li>
                      ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Center: Blog List */}
          <section className="lg:col-span-8 w-full" data-blog-section>
            {isLoading ? (
              <div className="space-y-6 w-full">
                {/* Loading skeleton */}
                {Array.from({ length: pageSize }).map((_, i) => (
                  <Card key={i} className="flex flex-row overflow-hidden shadow-lg bg-white dark:bg-background border border-border animate-pulse">
                    <CardContent className="flex flex-col justify-between p-8 flex-1">
                      <div>
                        <div className="h-8 bg-muted rounded mb-2"></div>
                        <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                        <div className="h-4 bg-muted rounded mb-4"></div>
                        <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                        <div className="flex flex-wrap gap-2 mb-4">
                          <div className="h-6 bg-muted rounded-full w-16"></div>
                          <div className="h-6 bg-muted rounded-full w-20"></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-4 bg-muted rounded w-20"></div>
                          <div className="h-4 bg-muted rounded w-16"></div>
                        </div>
                        <div className="h-8 bg-muted rounded w-20"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-500">Failed to load blogs</div>
            ) : allBlogs.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-lg font-semibold text-muted-foreground mb-2">
                  {selectedCategory !== null || search !== '' || selectedTag !== null
                    ? 'No blogs match your filters'
                    : 'No blogs found'
                  }
                </div>
                {(selectedCategory !== null || search !== '' || selectedTag !== null) && (
                  <div className="text-sm text-muted-foreground mb-4">
                    Try adjusting your search, category, or tag filter
                  </div>
                )}
                {(selectedCategory !== null || search !== '' || selectedTag !== null) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedCategory(null);
                      setSelectedTag(null);
                      setSearch('');
                    }}
                    className="mt-2"
                  >
                    Clear All Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className={`w-full transition-opacity duration-300 ${isPageTransitioning ? 'opacity-90' : 'opacity-100'}`}>
                {/* Professional Pagination Info */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-foreground">
                          Showing <span className="font-bold text-primary">{((currentPage - 1) * pageSize) + 1}</span> to <span className="font-bold text-primary">{Math.min(currentPage * pageSize, allBlogs.length)}</span> of <span className="font-bold text-primary">{allBlogs.length}</span> results
                        </span>
                      </div>
                      {totalPages > 1 && (
                        <div className="hidden sm:flex items-center">
                          <div className="w-1 h-4 bg-border mx-2"></div>
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-muted-foreground">Page</span>
                            <Badge variant="outline" className="px-2 py-1 text-xs font-semibold bg-primary/10 text-primary border-primary/20">
                              {currentPage}
                            </Badge>
                            <span className="text-xs text-muted-foreground">of</span>
                            <Badge variant="outline" className="px-2 py-1 text-xs font-semibold">
                              {totalPages}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0l-4-4m4 4l-4 4" />
                        </svg>
                        <span className="font-medium">{pageSize} posts per page</span>
                      </div>
                      {allBlogs.length > pageSize && (
                        <>
                          <div className="w-1 h-3 bg-border"></div>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Live pagination</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Mobile page info */}
                  {totalPages > 1 && (
                    <div className="sm:hidden mt-3 pt-3 border-t border-border/50">
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-xs text-muted-foreground">Page</span>
                        <Badge variant="outline" className="px-2 py-1 text-xs font-semibold bg-primary/10 text-primary border-primary/20">
                          {currentPage}
                        </Badge>
                        <span className="text-xs text-muted-foreground">of</span>
                        <Badge variant="outline" className="px-2 py-1 text-xs font-semibold">
                          {totalPages}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>

                {/* Blog Cards Container with proper spacing */}
                <div className="mt-6">
                  {blogs.map((blog: any, i: any) => (
                    <Card
                      key={blog.id}
                      className={
                        `blog-card-animate flex flex-col sm:flex-row overflow-hidden shadow-lg bg-white dark:bg-background border border-border transition-all duration-300 rounded-lg hover:shadow-xl`
                      }
                      style={{ transitionDelay: `${i * 80}ms` }}
                    >
                      <CardContent className="flex flex-col justify-between p-4 sm:p-6 lg:p-8 flex-1">
                        <div>
                          <h3
                            className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 text-primary drop-shadow-lg cursor-pointer hover:text-primary/80 transition-colors duration-200"
                            onClick={() => window.open(`${window.location.origin}/blog/${blog.id}`, '_blank')}
                          >
                            {blog.title}
                          </h3>

                          {/* Category Badge */}
                          {blog.category && (
                            <div className="mb-2">
                              <Badge
                                variant="secondary"
                                className="text-xs rounded-full px-3 py-1 bg-purple-100 text-purple-700 border border-purple-200 font-semibold cursor-pointer hover:bg-purple-200"
                                onClick={() => setSelectedCategory(blog.category!.id)}
                              >
                                📂 {blog.category.name}
                              </Badge>
                            </div>
                          )}

                          <p className="text-muted-foreground mb-4 line-clamp-2 text-sm sm:text-base lg:text-lg">{blog.excerpt}</p>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {blog.tags?.map((tag: { id: number; name: string }) => (
                              <Badge
                                key={tag.id}
                                variant="secondary"
                                className="text-xs rounded-full px-3 py-1 bg-primary text-white font-semibold border border-primary cursor-pointer hover:bg-primary/80 transition-colors"
                                onClick={() => setSelectedTag(tag.name.toLowerCase())}
                              >
                                #{tag.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 gap-3 sm:gap-0">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-foreground">
                            <div className="flex items-center gap-1">
                              <div className="p-1 sm:p-1.5 rounded-full bg-muted border border-border">
                                <User className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                              </div>
                              <span className="font-medium">{blog.author?.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="p-1 sm:p-1.5 rounded-full bg-muted border border-border">
                                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                              </div>
                              <span>{new Date(blog.date).toLocaleDateString()}</span>
                            </div>
                            {blog.reading_time && (
                              <div className="flex items-center gap-1">
                                <div className="p-1 sm:p-1.5 rounded-full bg-muted border border-border">
                                  <Clock className="w-3 h-3 text-muted-foreground" />
                                </div>
                                <span>{blog.reading_time} min read</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <div className="p-1 sm:p-1.5 rounded-full bg-muted border border-border">
                                <Eye className="w-3 h-3 text-muted-foreground" />
                              </div>
                              <span>{Math.floor(Math.random() * 900 + 100)} views</span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`${window.location.origin}/blog/${blog.id}`, '_blank')}
                            className={
                              `w-full sm:w-auto sm:ml-auto rounded-full shadow transition-colors duration-200 border-primary text-primary hover:bg-primary/10 ` +
                              `focus:outline-none focus:ring-2 focus:ring-primary/40`
                            }
                          >
                            <div className="p-1 rounded-full bg-muted border border-border mr-1">
                              <ExternalLink className="w-3 h-3 text-muted-foreground" />
                            </div>
                            Read More
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 space-y-4">
                <div className="flex justify-center">
                  <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg border border-gray-200 dark:border-gray-700">
                    {/* Previous Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handlePrevPage}
                      disabled={!hasPrevPage || isPageTransitioning}
                      className={`
                      rounded-full px-3 py-2 transition-all duration-200 
                      ${!hasPrevPage || isPageTransitioning
                          ? "opacity-60 cursor-not-allowed"
                          : "hover:bg-primary/10 hover:text-primary hover:shadow-md active:scale-95"
                        }
                    `}
                    >
                      {isPageTransitioning ? (
                        <div className="w-4 h-4 mr-1 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      )}
                      Previous
                    </Button>

                    {/* Page Numbers */}
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                        // Show first page, last page, current page, and pages around current page
                        if (
                          pageNum === 1 ||
                          pageNum === totalPages ||
                          (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                        ) {
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "ghost"}
                              size="sm"
                              onClick={() => handleGoToPage(pageNum)}
                              disabled={isPageTransitioning}
                              className={`
                              w-10 h-10 rounded-full transition-all duration-200 font-semibold
                              ${currentPage === pageNum
                                  ? "bg-primary text-primary-foreground shadow-lg scale-110 ring-2 ring-primary/20"
                                  : "hover:bg-primary/10 hover:text-primary hover:shadow-md active:scale-95"
                                }
                              ${isPageTransitioning ? "opacity-80" : ""}
                            `}
                            >
                              {pageNum}
                            </Button>
                          );
                        } else if (
                          pageNum === currentPage - 2 ||
                          pageNum === currentPage + 2
                        ) {
                          return (
                            <div key={pageNum} className="flex items-center justify-center w-8 h-8">
                              <div className="flex space-x-1">
                                <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse"></div>
                                <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>

                    {/* Next Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={!hasNextPage || isPageTransitioning}
                      className={`
                      rounded-full px-3 py-2 transition-all duration-200 
                      ${!hasNextPage || isPageTransitioning
                          ? "opacity-60 cursor-not-allowed"
                          : "hover:bg-primary/10 hover:text-primary hover:shadow-md active:scale-95"
                        }
                    `}
                    >
                      Next
                      {isPageTransitioning ? (
                        <div className="w-4 h-4 ml-1 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Keyboard shortcut hint and page info */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span>Use ← → arrow keys to navigate pages</span>
                    {totalPages > 5 && (
                      <div className="hidden sm:flex items-center gap-2">
                        <span>Jump to page:</span>
                        <input
                          type="number"
                          min="1"
                          max={totalPages}
                          value={currentPage}
                          onChange={(e) => {
                            const page = parseInt(e.target.value);
                            if (page >= 1 && page <= totalPages) {
                              handleGoToPage(page);
                            }
                          }}
                          className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-background text-foreground"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Page {currentPage} of {totalPages}</span>
                    <span>•</span>
                    <span>{allBlogs.length} total results</span>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Right Sidebar: Recent Posts - Hidden on mobile */}
          <aside className="hidden lg:block lg:col-span-2 space-y-8">
            <div className="sticky top-24 space-y-8">
              {/* Advertisement Block */}
              <Card className="shadow-lg bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 border border-dashed border-yellow-400 dark:border-yellow-600 animate-pulse">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-yellow-700 dark:text-yellow-300">Advertisement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-4">
                    <span className="text-sm text-yellow-800 dark:text-yellow-200 font-semibold mb-2">Your Ad Here</span>
                    <div className="w-40 h-20 bg-yellow-200 dark:bg-yellow-900 rounded-lg flex items-center justify-center text-yellow-600 dark:text-yellow-300 text-xs font-medium border border-yellow-300 dark:border-yellow-700">
                      300 x 100
                    </div>
                    <span className="mt-2 text-xs text-muted-foreground">Contact us to advertise</span>
                  </div>
                </CardContent>
              </Card>
              {/* Recent Posts Block */}
              <Card className="shadow-xl bg-white dark:bg-background border border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-gradient bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    Recent Posts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="divide-y divide-border">
                    {blogs
                      .slice()
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 5)
                      .map((post) => (
                        <li key={post.id} className="py-2 first:pt-0 last:pb-0">
                          <a
                            href={`/blog/${post.id}`}
                            className="block text-black dark:text-white font-semibold text-base leading-tight hover:text-primary hover:underline"
                          >
                            {post.title}
                          </a>
                          {post.reading_time && (
                            <span className="block text-xs text-muted-foreground mt-1">{post.reading_time} min read</span>
                          )}
                        </li>
                      ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </aside>
        </main>

        {/* Footer - Simple like individual blog pages */}
        <footer className="mt-12 pt-8 border-t border-border/40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6">
              <Button
                onClick={() => setLocation('/')}
                variant="outline"
                className="gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile Aman Kayare
              </Button>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>© {new Date().getFullYear()} Blog Master Insights</span>
                <div className="w-px h-4 bg-border"></div>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="hover:text-foreground transition-colors"
                >
                  Back to top ↑
                </button>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
