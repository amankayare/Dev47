import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Eye,
  BookOpen,
  X,
  LogIn,
  UserPlus,
  LogOut,
  Settings,
  ChevronDown,
  MoreVertical,
  Sun,
  Moon,
  User,
  Bell,
  Sparkles,
  Zap,
  ArrowRight,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

// ─── Gradient palettes for blogs without a cover image ───────────────────────
const CARD_GRADIENTS = [
  'from-blue-600 via-indigo-600 to-purple-700',
  'from-emerald-500 via-teal-600 to-cyan-700',
  'from-orange-500 via-rose-500 to-pink-600',
  'from-violet-600 via-purple-600 to-blue-700',
  'from-amber-500 via-orange-600 to-red-600',
  'from-teal-500 via-cyan-600 to-blue-600',
];

// ─── Blog Card Component ──────────────────────────────────────────────────────
function BlogCard({
  blog,
  index,
  setSelectedCategory,
  setSelectedTag,
}: {
  blog: Blog;
  index: number;
  setSelectedCategory: (id: number | null) => void;
  setSelectedTag: (tag: string | null) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
  // Deterministic view count (avoids random re-renders)
  const viewCount = Math.abs((blog.id * 137 + 423) % 900) + 100;
  const formattedViews =
    viewCount >= 1000 ? `${(viewCount / 1000).toFixed(1)}K` : viewCount.toLocaleString();

  return (
    <article
      className="blog-card-shake group rounded-xl overflow-hidden border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 flex flex-col cursor-pointer"
      onClick={() => window.open(`${window.location.origin}/blog/${blog.id}`, '_blank')}
    >
      {/* Cover Image */}
      <div className="relative aspect-video overflow-hidden bg-muted flex-shrink-0">
        {blog.cover_image && !imgError ? (
          <img
            src={blog.cover_image}
            alt={blog.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center p-6`}
          >
            <div className="text-center">
              <BookOpen className="w-8 h-8 text-white/50 mx-auto mb-3" />
              <p className="text-white/90 text-sm font-bold text-center leading-tight line-clamp-3">
                {blog.title}
              </p>
            </div>
          </div>
        )}
        {blog.featured && (
          <span className="absolute top-3 left-3 bg-yellow-400 text-yellow-950 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md">
            ⭐ Featured
          </span>
        )}
      </div>

      {/* Card Body */}
      <div className="flex flex-col flex-1 p-5">
        {/* Category + Tag Badges */}
        <div
          className="flex flex-wrap gap-1.5 mb-3"
          onClick={(e) => e.stopPropagation()}
        >
          {blog.category && (
            <span
              className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-border bg-background text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors cursor-pointer tracking-wide"
              onClick={() => setSelectedCategory(blog.category!.id)}
            >
              {blog.category.name.toUpperCase()}
            </span>
          )}
          {blog.tags?.slice(0, 2).map((tag) => (
            <span
              key={tag.id}
              className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-border bg-background text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors cursor-pointer tracking-wide"
              onClick={() => setSelectedTag(tag.name.toLowerCase())}
            >
              {tag.name.toUpperCase()}
            </span>
          ))}
        </div>

        {/* Title */}
        <h3 className="font-bold text-base sm:text-[17px] leading-snug mb-2 text-foreground dark:text-white line-clamp-2 group-hover:text-primary transition-colors duration-200">
          {blog.title}
        </h3>

        {/* Excerpt */}
        {blog.excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed flex-1 mb-4">
            {blog.excerpt}
          </p>
        )}

        {/* Card Footer */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/60 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2 flex-wrap">
            <span>
              {new Date(blog.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            {blog.reading_time && (
              <>
                <span className="opacity-40">·</span>
                <span>{blog.reading_time} min read</span>
              </>
            )}
            <span className="opacity-40">·</span>
            <span className="flex items-center gap-0.5">
              <Eye className="w-3 h-3" />
              {formattedViews} views
            </span>
          </div>
          <div className="ml-2 flex-shrink-0 w-7 h-7 rounded-full border border-border flex items-center justify-center group-hover:border-primary group-hover:bg-primary/10 transition-all duration-200">
            <svg
              className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </div>
    </article>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────
export default function BlogHome() {
  const { theme, setTheme } = useTheme();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [searchDraft, setSearchDraft] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      toast({
        title: "Subscribed Successfully!",
        description: "Thank you for subscribing! You will receive our next update.",
      });
      setEmail('');
      localStorage.setItem('dismiss-announcement', 'true');
      setShowBanner(false);
    } catch (err) {
      toast({
        title: "Subscription Failed",
        description: "There was an error subscribing. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);
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

  // Handle URL tag parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tagParam = urlParams.get('tag');
    if (tagParam) {
      setSelectedTag(tagParam.toLowerCase());
    }
  }, [location]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Blogs hook — handles pagination, filtering, and search
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
    pageSize,
  } = useBlogs({ search, selectedCategory, selectedTag });

  // Compute popular tags dynamically from all fetched blogs
  const popularTags = Array.from(
    totalBlogs.reduce((acc: Map<string, number>, blog: any) => {
      if (blog.tags && Array.isArray(blog.tags)) {
        blog.tags.forEach((tag: any) => {
          if (tag.name) acc.set(tag.name, (acc.get(tag.name) || 0) + 1);
        });
      }
      return acc;
    }, new Map<string, number>())
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([name, count]) => ({ name, count: count as number }));

  // Reset pagination when filters change
  useEffect(() => {
    resetPagination();
  }, [search, selectedCategory, selectedTag]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch categories
  const {
    data: categories = [],
    isLoading: isCategoriesLoading,
    error: categoriesError,
  } = useQuery({
    queryKey: ['/api/blog-categories'],
    queryFn: async (): Promise<Category[]> => {
      const response = await fetch('/api/blog-categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    },
    staleTime: 10 * 60 * 1000,
  });

  // Pagination helpers
  const handlePageChange = async (fn: () => void) => {
    setIsPageTransitioning(true);
    fn();
    setTimeout(() => setIsPageTransitioning(false), 300);
  };
  const handleGoToPage = (pageNum: number) => handlePageChange(() => goToPage(pageNum));
  const handleNextPage = () => handlePageChange(() => nextPage());
  const handlePrevPage = () => handlePageChange(() => prevPage());

  // Keyboard arrow-key navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key === 'ArrowLeft' && hasPrevPage) { event.preventDefault(); handlePrevPage(); }
      else if (event.key === 'ArrowRight' && hasNextPage) { event.preventDefault(); handleNextPage(); }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [hasNextPage, hasPrevPage, handleNextPage, handlePrevPage]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter helpers
  const clearAllFilters = () => {
    setSearch('');
    setSelectedCategory(null);
    setSelectedTag(null);
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
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
  };

  // Top featured blogs — always from the full unfiltered list
  const featuredBlogs = totalBlogs
    .filter((b) => b.featured)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const searchResults = searchDraft.trim()
    ? totalBlogs.filter((blog) => {
        const searchTerm = searchDraft.trim().toLowerCase();
        return (
          blog.title.toLowerCase().includes(searchTerm) ||
          blog.excerpt?.toLowerCase().includes(searchTerm) ||
          blog.content?.toLowerCase().includes(searchTerm) ||
          blog.tags?.some((tag) => tag.name.toLowerCase().includes(searchTerm))
        );
      }).slice(0, 8)
    : [];

  const openSearch = () => {
    setSearchDraft(search);
    setIsSearchOpen(true);
  };

  const applySearch = (query: string) => {
    setSearch(query.trim());
    setSelectedCategory(null);
    setSelectedTag(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('tag');
    window.history.replaceState({}, '', url.toString());
    setIsSearchOpen(false);
  };

  const selectSearchResult = (blog: Blog) => {
    setIsSearchOpen(false);
    setLocation(`/blog/${blog.id}`);
  };

  return (
    <div className="hero-squares min-h-screen bg-background">
      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent className="max-w-2xl gap-0 overflow-hidden rounded-2xl border-border bg-popover p-0 text-popover-foreground shadow-2xl shadow-primary/10">
          <DialogHeader className="border-b border-border/60 px-5 pb-4 pt-5 sm:px-6">
            <DialogTitle className="flex items-center gap-2 text-lg text-popover-foreground">
              <Search className="h-5 w-5 text-primary" />
              Search articles
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Search by title, excerpt, content, or tag. Select a result to filter the blog page.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              applySearch(searchDraft);
            }}
            className="border-b border-border/60 p-4 sm:px-6"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
              <Input
                autoFocus
                placeholder="What are you looking for?"
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                className="h-12 rounded-xl border-border bg-background text-foreground placeholder:text-muted-foreground pl-10 pr-20 focus-visible:ring-primary/40"
              />
              <Button
                type="submit"
                size="sm"
                className="absolute right-1.5 top-1/2 h-9 -translate-y-1/2 rounded-lg px-3"
                disabled={!searchDraft.trim()}
              >
                Search
              </Button>
            </div>
          </form>
          <div className="max-h-[55vh] overflow-y-auto p-2 sm:p-3">
            {searchDraft.trim() ? (
              isLoading ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">Loading articles…</p>
              ) : searchResults.length > 0 ? (
                <div className="space-y-1">
                  {searchResults.map((blog) => (
                    <button
                      key={blog.id}
                      type="button"
                      onClick={() => selectSearchResult(blog)}
                      className="group flex w-full items-start gap-3 rounded-xl border border-transparent p-3 text-left transition-colors hover:border-primary/20 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <div className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 font-semibold text-foreground group-hover:text-primary">
                          {blog.title}
                        </p>
                        {blog.excerpt && (
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                            {blog.excerpt}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          {blog.category && <span>{blog.category.name}</span>}
                          {blog.reading_time && <span>{blog.reading_time} min read</span>}
                        </div>
                      </div>
                      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No articles match “{searchDraft.trim()}”.
                </p>
              )
            ) : (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                Start typing to preview matching articles.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-2 sm:p-4 flex items-center justify-between gap-2">

          {/* Logo */}
          <div className="flex items-center gap-1 sm:gap-3 cursor-pointer transition-transform hover:scale-105">
            <img
              src={theme === 'dark' ? '/logo-dark.svg' : '/logo-light.svg'}
              alt="Blog Logo"
              className="h-10 sm:h-12 md:h-14 w-auto transition-opacity duration-300"
            />
          </div>

          <div className="flex items-center gap-1 sm:gap-3 lg:gap-6">

            {/* Desktop Search Bar */}
            <div className="hidden sm:block relative w-48 md:w-56 lg:w-72">
              <div className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 p-0.5 sm:p-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
                <Search className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
              <Input
                placeholder="Search..."
                value={search}
                readOnly
                onClick={openSearch}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openSearch();
                  }
                }}
                aria-label="Open article search"
                className="cursor-pointer pl-8 sm:pl-12 pr-2 sm:pr-4 py-2 sm:py-3 text-sm rounded-xl shadow focus:ring-2 focus:ring-primary/40 bg-background border border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Desktop Auth — logged in */}
            {!isMobile && currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2.5 px-2 py-1.5 h-10 rounded-full border border-white/10 bg-background/50 backdrop-blur-md shadow-sm hover:shadow-md hover:bg-white/5 transition-all duration-300"
                  >
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-inner">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-semibold tracking-wide text-foreground pr-1">
                      {currentUser.username || currentUser.name}
                    </span>
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-white/5 border border-white/10">
                      <ChevronDown className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={8} className="w-56 bg-background/80 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-2">
                  <DropdownMenuItem
                    onClick={() => setLocation('/profile')}
                    className="cursor-pointer rounded-xl hover:bg-white/5 transition-colors p-2 focus:bg-primary/10"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary mr-3 shadow-inner">
                      <Settings className="w-4 h-4" />
                    </div>
                    <span className="font-medium">Profile Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="cursor-pointer rounded-xl hover:bg-white/5 transition-colors p-2 focus:bg-primary/10"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 dark:bg-blue-500/10 dark:text-blue-400 mr-3 shadow-inner">
                      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </div>
                    <span className="font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10 my-2" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer rounded-xl hover:bg-destructive/10 text-destructive focus:text-destructive focus:bg-destructive/10 transition-colors p-2"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-destructive/10 mr-3 shadow-inner">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <span className="font-medium">Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

            ) : !isMobile && (
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation('/login')}
                  className="gap-2 px-4 py-2 h-9 rounded-full border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 font-semibold text-gray-800 dark:text-gray-200"
                >
                  <LogIn className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  Login
                </Button>
                <Button
                  size="sm"
                  onClick={() => setLocation('/register')}
                  className="gap-2 px-5 py-2 h-9 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300 border-0 font-semibold"
                >
                  <UserPlus className="w-4 h-4" />
                  Sign Up
                </Button>
              </div>
            )}

            {/* Theme Toggle (standalone when not desktop-logged-in) */}
            {!(!isMobile && currentUser) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="h-10 w-10 p-0 rounded-full shadow hover:bg-primary/10"
              >
                {theme === 'dark' ? '🌞' : '🌙'}
                <span className="sr-only">Toggle theme</span>
              </Button>
            )}

            {/* Mobile Dropdown Menu */}
            {isMobile && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-2 hover:bg-accent rounded-lg lg:hidden">
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
                        readOnly
                        onClick={openSearch}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            openSearch();
                          }
                        }}
                        aria-label="Open article search"
                        className="cursor-pointer pl-10 pr-3 py-2 text-sm rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  {currentUser ? (
                    <>
                      <div className="px-3 py-2 text-sm text-muted-foreground border-b border-border">
                        Logged in as <span className="font-medium text-foreground">{currentUser.username}</span>
                      </div>
                      <DropdownMenuItem onClick={() => setLocation('/profile')} className="cursor-pointer hover:bg-accent">
                        <Settings className="w-4 h-4 mr-2" />
                        Profile Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive hover:bg-destructive/10 focus:text-destructive">
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <div className="flex flex-col gap-2 p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setLocation('/login')}
                        className="w-full gap-2 px-4 py-2 h-10 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 font-semibold text-gray-800 dark:text-gray-200 justify-start"
                      >
                        <LogIn className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-2" />
                        Sign In
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setLocation('/register')}
                        className="w-full gap-2 px-5 py-2 h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md transition-all duration-300 border-0 font-semibold justify-start"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Sign Up
                      </Button>
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

          </div>
        </div>
      </header>

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      <div className="relative py-10">
        <main className="container mx-auto max-w-7xl bg-background border border-border/40 shadow-2xl rounded-3xl p-6 sm:p-8 lg:p-10 mx-4 sm:mx-6 lg:mx-auto">

          {/* ── Futuristic, Modern & Professional Banner ──────────────── */}
          {showBanner && (
            <div className="relative overflow-hidden rounded-2xl bg-background border border-border/50 shadow-2xl mb-10 p-[1px] group">

              {/* Futuristic Background Gradients & Animated Borders */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 pointer-events-none" />
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />

              <div className="relative bg-card/40 backdrop-blur-xl rounded-xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8 border border-white/5">

                {/* Dismiss Button */}
                <button
                  onClick={() => {
                    localStorage.setItem('dismiss-announcement', 'true');
                    setShowBanner(false);
                  }}
                  className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-all duration-300 p-1.5 rounded-full hover:bg-white/5"
                  aria-label="Dismiss announcement"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Content Section */}
                <div className="flex gap-5 items-start max-w-3xl pr-8">
                  <div className="flex-shrink-0 p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/20 text-cyan-400 mt-1 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-foreground tracking-tight">
                        Dev47 Future Insights
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 text-[9px] font-bold uppercase tracking-widest">
                        Newsletter
                      </span>
                    </div>
                    <p className="text-[15px] text-muted-foreground leading-relaxed">
                      Stay ahead of the curve. Get high-signal, zero-noise articles on modern web architecture, advanced UI/UX, and AI integrations delivered straight to your inbox.
                    </p>
                  </div>
                </div>

                {/* Futuristic Inline Subscription Form */}
                <form
                  onSubmit={handleSubscribe}
                  className="flex-shrink-0 w-full lg:w-auto flex flex-col sm:flex-row items-center gap-3 max-w-md lg:max-w-none relative z-10"
                >
                  <div className="relative w-full lg:w-64">
                    <div className="absolute inset-0 bg-cyan-500/20 rounded-xl blur-md opacity-0 focus-within:opacity-100 transition-opacity duration-500" />
                    <Input
                      type="email"
                      placeholder="name@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="relative bg-background/50 backdrop-blur-sm border-border/80 focus-visible:ring-1 focus-visible:ring-cyan-500 focus-visible:border-cyan-500 rounded-xl h-11 w-full text-[15px] shadow-inner placeholder:text-muted-foreground/50 transition-all duration-300"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto relative group overflow-hidden bg-foreground text-background hover:bg-foreground/90 font-semibold rounded-xl px-6 h-11 shadow-md transition-all duration-300 border border-transparent hover:border-cyan-500/30"
                  >
                    <span className="relative z-10">{isSubmitting ? 'Submitting...' : 'Subscribe'}</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  </Button>
                </form>

              </div>
            </div>
          )}

          {/* ── Main Layout Split ────────────────────────────── */}
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">

            {/* Left Column (Main Content) */}
            <div className="flex-1 min-w-0">

              {/* ── Category + Tag Filter Tabs ────────────────────────────── */}
              <div className="mb-10 space-y-3">
                <div className="flex justify-center">
                  <div className="inline-flex max-w-full items-center gap-1 overflow-x-auto whitespace-nowrap rounded-full border border-primary/30 bg-primary/5 p-1.5 shadow-[0_0_18px_rgba(20,198,218,0.08)] vs-scrollbar">
                    <button
                      className={`rounded-full border px-4 py-2 text-sm transition-all duration-200 ${!hasActiveFilters
                        ? 'border-primary/50 bg-primary/10 text-primary font-semibold shadow-sm shadow-primary/10'
                        : 'border-transparent text-muted-foreground hover:border-primary/25 hover:bg-primary/5 hover:text-foreground font-medium'
                        }`}
                      onClick={clearAllFilters}
                    >
                      All
                    </button>
                    {!isCategoriesLoading &&
                      !categoriesError &&
                      categories.map((cat) => (
                        <button
                          key={cat.id}
                          className={`rounded-full border px-4 py-2 text-sm transition-all duration-200 ${selectedCategory === cat.id
                            ? 'border-primary/50 bg-primary/10 text-primary font-semibold shadow-sm shadow-primary/10'
                            : 'border-transparent text-muted-foreground hover:border-primary/25 hover:bg-primary/5 hover:text-foreground font-medium'
                            }`}
                          onClick={() => setSelectedCategory(cat.id)}
                        >
                          {cat.name}
                        </button>
                      ))}
                  </div>
                </div>

                {(selectedTag || search) && (
                  <div className="flex flex-wrap items-center justify-center gap-3 text-[13px] text-muted-foreground">
                    {selectedTag && (
                      <button
                        className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 font-medium text-primary hover:bg-primary/10 transition-colors"
                        onClick={clearTagFilter}
                      >
                        #{selectedTag}
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    {search && (
                      <div className="flex items-center gap-2">
                        <span>
                          Results for: <span className="font-semibold text-foreground">"{search}"</span>
                        </span>
                        <button onClick={() => setSearch('')} className="hover:text-destructive transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Top Featured Section (hidden when filters are active) ──────── */}
              {!isLoading && featuredBlogs.length > 0 && !hasActiveFilters && (
                <section className="mb-14">
                  <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                    ⭐ Top Featured
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {featuredBlogs.slice(0, 3).map((blog, i) => (
                      <BlogCard
                        key={blog.id}
                        blog={blog}
                        index={i}
                        setSelectedCategory={setSelectedCategory}
                        setSelectedTag={setSelectedTag}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* ── LATEST | FRESH OFF THE DESK Divider ───────────────────────── */}
              <div className="flex items-center gap-4 mb-8">
                <span className="text-primary font-bold text-[11px] tracking-[0.25em] uppercase whitespace-nowrap">
                  Latest
                </span>
                <div className="flex-1 h-px bg-border" />
                <span className="text-muted-foreground text-[11px] tracking-[0.2em] uppercase font-semibold whitespace-nowrap">
                  Fresh off the desk
                </span>
              </div>

              {/* ── Latest / All Blogs Grid ────────────────────────────────────── */}
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: pageSize }).map((_, i) => (
                    <div key={i} className="rounded-xl overflow-hidden border border-border bg-card animate-pulse">
                      <div className="aspect-video bg-muted" />
                      <div className="p-5 space-y-3">
                        <div className="flex gap-2">
                          <div className="h-5 bg-muted rounded-full w-16" />
                          <div className="h-5 bg-muted rounded-full w-20" />
                        </div>
                        <div className="h-5 bg-muted rounded w-full" />
                        <div className="h-5 bg-muted rounded w-4/5" />
                        <div className="h-4 bg-muted rounded w-full" />
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-px bg-border mt-1" />
                        <div className="h-3 bg-muted rounded w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>

              ) : error ? (
                <div className="text-center py-16 text-red-500 font-medium">
                  Failed to load blogs. Please try again.
                </div>

              ) : blogs.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-5xl mb-4">🔍</div>
                  <div className="text-lg font-semibold text-muted-foreground mb-2">
                    {hasActiveFilters ? 'No blogs match your filters' : 'No blogs found'}
                  </div>
                  {hasActiveFilters && (
                    <>
                      <p className="text-sm text-muted-foreground mb-4">
                        Try adjusting your search, category, or tag filter
                      </p>
                      <Button variant="outline" onClick={clearAllFilters} className="mt-2">
                        Clear All Filters
                      </Button>
                    </>
                  )}
                </div>

              ) : (
                <>
                  {/* Pagination info row */}
                  <div className="flex items-center justify-between mb-6 text-sm text-muted-foreground">
                    <span>
                      Showing{' '}
                      <span className="font-semibold text-foreground">
                        {(currentPage - 1) * pageSize + 1}
                      </span>
                      {' '}–{' '}
                      <span className="font-semibold text-foreground">
                        {Math.min(currentPage * pageSize, allBlogs.length)}
                      </span>
                      {' '}of{' '}
                      <span className="font-semibold text-foreground">{allBlogs.length}</span>{' '}
                      results
                    </span>
                    {totalPages > 1 && (
                      <span className="hidden sm:block">
                        Page {currentPage} of {totalPages}
                      </span>
                    )}
                  </div>

                  {/* 3-column card grid */}
                  <div
                    className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-300 ${isPageTransitioning ? 'opacity-50' : 'opacity-100'
                      }`}
                  >
                    {blogs.map((blog: any, i: number) => (
                      <BlogCard
                        key={blog.id}
                        blog={blog}
                        index={i}
                        setSelectedCategory={setSelectedCategory}
                        setSelectedTag={setSelectedTag}
                      />
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-12">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handlePrevPage}
                        disabled={!hasPrevPage || isPageTransitioning}
                        className="rounded-full px-4 gap-1.5 hover:bg-primary/10 hover:text-primary disabled:opacity-40"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Previous
                      </Button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                          if (
                            pageNum === 1 ||
                            pageNum === totalPages ||
                            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                          ) {
                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => handleGoToPage(pageNum)}
                                disabled={isPageTransitioning}
                                className={`w-9 h-9 rounded-full font-semibold transition-all duration-200 ${currentPage === pageNum
                                  ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                                  : 'hover:bg-primary/10 hover:text-primary'
                                  }`}
                              >
                                {pageNum}
                              </Button>
                            );
                          } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                            return (
                              <span
                                key={pageNum}
                                className="w-9 h-9 flex items-center justify-center text-muted-foreground text-sm"
                              >
                                ···
                              </span>
                            );
                          }
                          return null;
                        })}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleNextPage}
                        disabled={!hasNextPage || isPageTransitioning}
                        className="rounded-full px-4 gap-1.5 hover:bg-primary/10 hover:text-primary disabled:opacity-40"
                      >
                        Next
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Button>
                    </div>
                  )}
                </>
              )}

            </div> {/* End Left Column */}

            {/* Right Column (Sidebar) */}
            <aside className="w-full lg:w-[280px] xl:w-[320px] flex-shrink-0">
              <div className="sticky top-24 space-y-8">
                {/* Futuristic Tags Card Filter */}
                <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-md p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-lg text-foreground tracking-tight">Popular Tags</h3>
                  </div>

                  {popularTags.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No tags available yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {popularTags.map(tag => (
                        <button
                          key={tag.name}
                          onClick={() => {
                            setSelectedTag(selectedTag === tag.name ? '' : tag.name);
                            window.scrollTo({ top: 300, behavior: 'smooth' });
                          }}
                          className={`px-3 py-1.5 rounded-xl text-[13px] font-medium transition-all duration-300 border ${selectedTag === tag.name
                            ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                            : 'bg-background/50 border-border/60 hover:border-cyan-500/30 hover:bg-cyan-500/5 hover:text-cyan-400'
                            }`}
                        >
                          #{tag.name} <span className="opacity-40 text-[10px] ml-1">({tag.count})</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Advertisement Card */}
                <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-md p-6 shadow-sm relative overflow-hidden group cursor-pointer transition-all hover:border-cyan-500/30 hover:shadow-lg">
                  {/* Subtle Gradient Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 pointer-events-none group-hover:from-cyan-500/10 transition-colors duration-500" />

                  <div className="absolute top-3 right-3 z-10">
                    <span className="text-[9px] uppercase tracking-widest text-muted-foreground/40 font-bold border border-border/50 px-1.5 py-0.5 rounded backdrop-blur-sm">Ad</span>
                  </div>

                  <div className="relative flex flex-col items-center text-center space-y-4 pt-2">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 text-cyan-500 mb-1 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)] group-hover:scale-110 transition-transform duration-500">
                      <Zap className="w-6 h-6" />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="font-bold text-lg text-foreground tracking-tight">Supercharge Workflow</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed px-2">
                        Get access to premium UI components and architectures for modern development.
                      </p>
                    </div>
                    <div className="w-full pt-4">
                      <Button className="w-full rounded-xl bg-foreground text-background hover:bg-cyan-500 hover:text-white font-bold group-hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all duration-300 gap-2">
                        Explore Premium <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

          </div> {/* End Main Layout Split */}

        </main>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <footer className="mt-12 pt-8 border-t border-border/40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6">
              <Button onClick={() => setLocation('/')} variant="outline" className="gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile Aman Kayare
              </Button>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>© {new Date().getFullYear()} Dev47 Insights</span>
                <div className="w-px h-4 bg-border" />
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
