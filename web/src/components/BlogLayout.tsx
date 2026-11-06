import { ReactNode, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowLeft, Calendar, Clock, User, Share2, BookOpen, ExternalLink, TrendingUp, Tag, Moon, Sun, LogOut, Settings, ChevronDown, LogIn, UserPlus, MoreVertical, Zap, ArrowRight } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface BlogAuthor {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

interface BlogTag {
  id: number;
  name: string;
}

interface PopularTag {
  id: number;
  name: string;
  count: number;
  percentage?: number;
}

interface PopularTagsResponse {
  popular_tags: PopularTag[];
  total_blogs: number;
}

// Custom hook for fetching popular tags
const usePopularTags = () => {
  return useQuery<PopularTagsResponse>({
    queryKey: ['popular-tags'],
    queryFn: async (): Promise<PopularTagsResponse> => {
      const response = await fetch('/api/blogs/tags/popular');
      if (!response.ok) {
        throw new Error('Failed to fetch popular tags');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: false
  });
};

// Popular Tags Component
const PopularTagsSection = () => {
  const { data: tagsData, isLoading, error } = usePopularTags();
  const [, setLocation] = useLocation();

  const handleTagClick = (tagName: string) => {
    // Navigate to blog home with tag filter
    setLocation(`/blogs?tag=${encodeURIComponent(tagName.toLowerCase())}`);
  };

  if (isLoading) {
    return (
      <Card className="bg-background/60 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground/90">
            <Tag className="w-4 h-4 text-primary" />
            Popular Tags
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {/* Loading skeleton */}
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-6 bg-muted/50 rounded-full animate-pulse"
                style={{ width: `${Math.random() * 40 + 40}px` }}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !tagsData?.popular_tags?.length) {
    return (
      <Card className="bg-background/60 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground/90">
            <Tag className="w-4 h-4 text-primary" />
            Popular Tags
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xs text-muted-foreground">
            {error ? 'Unable to load tags' : 'No tags found'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-md p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
          <Tag className="w-5 h-5" />
        </div>
        <h3 className="font-bold text-lg text-foreground tracking-tight">Popular Tags</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {tagsData.popular_tags.map((tag) => (
          <button
            key={tag.id}
            onClick={() => handleTagClick(tag.name)}
            title={`${tag.count} posts (${tag.percentage}%)`}
            className="px-3 py-1.5 rounded-xl text-[13px] font-medium transition-all duration-300 border bg-background/50 border-border/60 hover:border-cyan-500/30 hover:bg-cyan-500/5 hover:text-cyan-400"
          >
            #{tag.name} <span className="opacity-40 text-[10px] ml-1">({tag.count})</span>
          </button>
        ))}
      </div>
    </div>
  );
};

interface BlogLayoutProps {
  // Blog post metadata
  title: string;
  excerpt?: string;
  coverImage?: string;
  date: string;
  readingTime?: number;
  featured?: boolean;
  author?: BlogAuthor;
  tags?: BlogTag[];
  category?: { id: number; name: string };
  quickLinks?: Array<{ title: string; url: string }>;

  // Content
  children: ReactNode;

  // Navigation
  backTo?: string;
  showShareButton?: boolean;

  // Loading and error states
  isLoading?: boolean;
  error?: string;

  // Sidebar content
  relatedPosts?: Array<{
    id: number;
    title: string;
    readingTime?: number;
  }>;
  tableOfContents?: Array<{
    id: string;
    title: string;
    level: number;
  }>;
  showAds?: boolean;
  loadingRelated?: boolean;
}

export default function BlogLayout({
  title,
  excerpt,
  coverImage,
  date,
  readingTime,
  featured = false,
  author,
  tags = [],
  category,
  quickLinks = [], // Added quick links with default empty array
  children,
  backTo = '/#blog',
  showShareButton = true,
  isLoading = false,
  error,
  relatedPosts = [],
  tableOfContents = [],
  showAds = true,
  loadingRelated = false
}: BlogLayoutProps) {
  // Fetch all blogs and filter for featured, sorted by latest
  const [top10FeaturedBlogs, setTop10FeaturedBlogs] = useState<any[]>([]);
  useEffect(() => {
    async function fetchBlogs() {
      try {
        const response = await fetch('/api/blogs/');
        if (!response.ok) return;
        const blogs = await response.json();
        const featured = blogs
          .filter((b: any) => b.featured)
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 10);
        setTop10FeaturedBlogs(featured);
      } catch (e) {
        setTop10FeaturedBlogs([]);
      }
    }
    fetchBlogs();
  }, []);

  // Authentication state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Reading Progress State
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (windowHeight > 0) {
        setScrollProgress((totalScroll / windowHeight) * 100);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    toast({
      title: "Logged out successfully",
      description: "You have been logged out.",
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <BlogLayoutSkeleton />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <BlogLayoutError error={error} backTo={backTo} />
      </div>
    );
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title,
        text: excerpt,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen hero-squares">
      {/* Reading Progress Bar */}
      <div
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 z-[100] transition-all duration-150 ease-out shadow-[0_0_10px_rgba(168,85,247,0.5)]"
        style={{ width: `${scrollProgress}%` }}
      />
      {/* Fixed Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-2 sm:p-4 flex items-center justify-between gap-2">
          {/* Logo Section */}
          <div className="flex items-center cursor-pointer transition-transform hover:scale-105" onClick={() => setLocation('/blogs')}>
            <img
              src={theme === 'dark' ? '/logo-dark.svg' : '/logo-light.svg'}
              alt="Blog Logo"
              className="h-10 sm:h-12 md:h-14 w-auto transition-opacity duration-300"
            />
          </div>

          {/* Right section */}
          <div className="flex items-center gap-1 sm:gap-3 lg:gap-6">
            {/* Desktop Authentication Section - Hidden on mobile */}
            {!isMobile && (
              <div className="flex items-center gap-3">
                {currentUser ? (
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
                    <DropdownMenuContent align="end" sideOffset={8} className="w-56 bg-background/80 backdrop-blur-xl border border-white/10 shadow-2xl rounded-xl p-2">
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
                        onClick={toggleTheme}
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
                ) : (
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
              </div>
            )}

            {/* Theme Toggle (Standalone if logged out or mobile) */}
            {!(!isMobile && currentUser) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="h-10 w-10 p-0 rounded-full shadow hover:bg-primary/10"
              >
                {theme === 'dark' ? '🌞' : '🌙'}
                <span className="sr-only">Toggle theme</span>
              </Button>
            )}

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
                  {/* Navigation Items */}
                  <DropdownMenuItem
                    onClick={() => setLocation('/blogs')}
                    className="cursor-pointer hover:bg-accent"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    All Blog Posts
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {/* Authentication Section */}
                  {currentUser ? (
                    <>
                      <div className="px-3 py-2 text-sm text-muted-foreground border-b border-border">
                        Logged in as <span className="font-medium text-foreground">{currentUser.username || currentUser.name}</span>
                        {currentUser.is_admin && (
                          <Badge variant="secondary" className="text-xs px-2 py-0.5 ml-2">
                            Admin
                          </Badge>
                        )}
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
        </header>

      {/* Main Content with Sidebars */}
      <main className="container py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Main Blog Content */}
          <motion.article
            className="lg:col-span-9 order-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="space-y-8 bg-background/40 backdrop-blur-xl border border-white/10 rounded-xl p-6 lg:p-10 shadow-2xl">
              {/* Hero Section */}
              <BlogHero
                title={title}
                excerpt={excerpt}
                featured={featured}
                author={author}
                date={date}
                readingTime={readingTime}
                tags={tags}
                category={category}
                onShare={showShareButton ? handleShare : undefined}
              />

              {coverImage && (
                <div className="w-full overflow-hidden rounded-xl shadow-xl border border-white/5">
                  <BlogCoverImage src={coverImage} alt={title} />
                </div>
              )}

              <Separator className="bg-gradient-to-r from-transparent via-border to-transparent my-8" />

              {/* Dynamic Content Area */}
              <div className="blog-content prose prose-lg prose-gray dark:prose-invert max-w-none px-2 leading-relaxed">
                {children}
              </div>
            </div>
          </motion.article>

          {/* Consolidated Right Sidebar */}
          <motion.aside
            className="lg:col-span-3 order-2 relative pr-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          >
            {/* Broad Vertical Boundary Line */}
            <div className="absolute right-0 top-0 bottom-0 w-[4px] bg-gradient-to-b from-indigo-500/0 via-indigo-500/15 to-indigo-500/0 rounded-full hidden lg:block" />

            <div className="sticky top-24 flex flex-col gap-6">
              {/* Quick Links Block */}
              <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-md p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
                    <ExternalLink className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg text-foreground tracking-tight">Quick Links</h3>
                </div>
                <div className="space-y-2">
                  {quickLinks && quickLinks.length > 0 ? (
                    quickLinks.map((link, index) => (
                      <a
                        key={index}
                        href={link.url}
                        onClick={(e) => {
                          e.preventDefault();
                          const urlParts = link.url.split('#');
                          const id = urlParts.length > 1 ? urlParts[1] : urlParts[0];
                          const element = document.getElementById(id);
                          if (element) {
                            const offset = 120;
                            const elementPosition = element.getBoundingClientRect().top;
                            const offsetPosition = elementPosition + window.pageYOffset - offset;
                            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                          }
                        }}
                        className="flex items-center gap-2 text-[13px] text-muted-foreground hover:text-cyan-400 transition-colors py-2 px-3 rounded-xl hover:bg-cyan-500/5 font-medium"
                      >
                        <span className="text-cyan-500/50">▹</span>
                        {link.title}
                      </a>
                    ))
                  ) : (
                    <>
                      <a href="#getting-started-react" className="flex items-center gap-2 text-[13px] text-muted-foreground hover:text-cyan-400 transition-colors py-2 px-3 rounded-xl hover:bg-cyan-500/5 font-medium">
                        <span className="text-cyan-500/50">▹</span>
                        Getting Started with React
                      </a>
                      <a href="#typescript-best-practices" className="flex items-center gap-2 text-[13px] text-muted-foreground hover:text-cyan-400 transition-colors py-2 px-3 rounded-xl hover:bg-cyan-500/5 font-medium">
                        <span className="text-cyan-500/50">▹</span>
                        TypeScript Best Practices
                      </a>
                    </>
                  )}
                </div>
              </div>

              {/* Top Featured Blogs Block */}
              <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-md p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg text-foreground tracking-tight">Top Featured</h3>
                </div>
                <div className="space-y-4">
                  {top10FeaturedBlogs.slice(0, 5).map((post, idx) => (
                    <div key={post.id} className="group relative">
                      <a
                        href={`/blog/${post.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block cursor-pointer p-3 rounded-xl hover:bg-purple-500/5 transition-all duration-300 border border-transparent hover:border-purple-500/20 shadow-sm"
                      >
                        <h4 className="text-[13px] font-semibold text-foreground group-hover:text-purple-400 transition-colors leading-snug line-clamp-2">
                          {post.title}
                        </h4>
                        {post.reading_time && (
                          <span className="text-[11px] text-muted-foreground mt-2 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {post.reading_time} min read
                          </span>
                        )}
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Advertisement Block */}
              {showAds && (
                <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-md p-6 shadow-sm relative overflow-hidden group cursor-pointer transition-all hover:border-cyan-500/30 hover:shadow-lg mt-2">
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
              )}

              {/* Existing Sidebar Components (Related Posts, Tags) */}
              <BlogSidebar
                side="right"
                relatedPosts={relatedPosts}
                showAds={false}
              />
            </div>
          </motion.aside>
        </div>

        {/* Footer Navigation */}
        <div className="mt-12">
          <BlogFooter />
        </div>
      </main>
    </div>
  );
}

// Hero Section Component
interface BlogHeroProps {
  title: string;
  excerpt?: string;
  featured: boolean;
  author?: BlogAuthor;
  date: string;
  readingTime?: number;
  tags: BlogTag[];
  category?: { id: number; name: string };
  onShare?: () => void;
}

function BlogHero({ title, excerpt, featured, author, date, readingTime, tags, category, onShare }: BlogHeroProps) {
  return (
    <header className="space-y-6 pt-2">
      {/* Top Badges */}
      <div className="flex flex-wrap items-center gap-3">
        {category && (
          <Badge className="px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white border-0 shadow-[0_0_15px_rgba(168,85,247,0.4)] font-bold uppercase tracking-widest text-xs">
            {category.name}
          </Badge>
        )}
        {featured && (
          <Badge variant="secondary" className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 font-bold uppercase tracking-widest text-xs shadow-[0_0_15px_rgba(245,158,11,0.4)]">
            ⭐ Featured
          </Badge>
        )}
      </div>

      {/* Title */}
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15] bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
          {title}
        </h1>

        {/* Excerpt */}
        {excerpt && (
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-medium mt-1">
            {excerpt}
          </p>
        )}
      </div>

      {/* Meta Information & Share */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 py-4 border-y border-white/5">
        <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground font-medium">
          {author && (
            <div className="flex items-center gap-2.5 bg-background/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
              {author.avatar ? (
                <img
                  src={author.avatar}
                  alt={author.name}
                  className="w-7 h-7 rounded-full ring-2 ring-primary/20 object-cover"
                />
              ) : (
                <div className="p-1.5 rounded-full bg-primary/10">
                  <User className="w-4 h-4 text-primary" />
                </div>
              )}
              <span className="text-foreground">{author.name}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary/70" />
            <span>{new Date(date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</span>
          </div>

          {readingTime && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary/70" />
              <span>{readingTime} min read</span>
            </div>
          )}
        </div>

        {onShare && (
          <Button
            variant="default"
            size="lg"
            onClick={onShare}
            className="group relative flex items-center gap-3 px-8 py-6 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] hover:bg-[100%_0] text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-500 transform hover:scale-105 border-0 overflow-hidden"
          >
            {/* Animated Glow Effect */}
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />

            <div className="relative flex items-center gap-3">
              <Share2 className="w-4 h-4 text-white animate-pulse" />
              <span>Share Article</span>
            </div>
          </Button>
        )}
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {tags.map((tag) => (
            <Badge key={tag.id} variant="outline" className="px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 hover:bg-primary/20 backdrop-blur-sm text-primary transition-all duration-300 cursor-pointer hover:-translate-y-0.5 shadow-sm hover:shadow-primary/20 font-medium">
              #{tag.name}
            </Badge>
          ))}
        </div>
      )}
    </header>
  );
}

// Cover Image Component
interface BlogCoverImageProps {
  src: string;
  alt: string;
}

function BlogCoverImage({ src, alt }: BlogCoverImageProps) {
  return (
    <div className="relative aspect-video overflow-hidden bg-muted">
      <img
        src={src}
        alt={alt}
        className="object-cover w-full h-full transition-transform duration-700 hover:scale-105"
        loading="lazy"
      />
    </div>
  );
}

// Footer Component
interface BlogFooterProps {
  backTo: string;
}

function BlogFooter() {
  const [, setLocation] = useLocation();
  return (
    <footer className="mt-12 pt-8 border-t border-border/40">
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
          <span>© {new Date().getFullYear()} Dev47 Insights</span>
          <Separator orientation="vertical" className="h-4" />
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="hover:text-foreground transition-colors"
          >
            Back to top ↑
          </button>
        </div>
      </div>
    </footer>
  );
}

// Loading Skeleton
function BlogLayoutSkeleton() {
  return (
    <>
      {/* Header Skeleton */}
      <header className="border-b border-border/40 h-16 bg-background">
        <div className="container flex h-16 items-center">
          <div className="h-8 w-24 bg-muted animate-pulse rounded" />
        </div>
      </header>

      {/* Content Skeleton */}
      <main className="container py-8 max-w-4xl">
        <div className="space-y-8">
          {/* Title skeleton */}
          <div className="space-y-4">
            <div className="h-12 bg-muted animate-pulse rounded w-3/4" />
            <div className="h-6 bg-muted animate-pulse rounded w-full" />
            <div className="h-6 bg-muted animate-pulse rounded w-2/3" />
          </div>

          {/* Meta skeleton */}
          <div className="flex gap-4">
            <div className="h-4 w-20 bg-muted animate-pulse rounded" />
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            <div className="h-4 w-16 bg-muted animate-pulse rounded" />
          </div>

          {/* Image skeleton */}
          <div className="aspect-video bg-muted animate-pulse rounded-lg" />

          {/* Content skeleton */}
          <div className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-4 bg-muted animate-pulse rounded w-full" />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

// Error Component
interface BlogLayoutErrorProps {
  error: string;
  backTo: string;
}

function BlogLayoutError({ error, backTo }: BlogLayoutErrorProps) {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">📝</div>
        <h1 className="text-2xl font-bold mb-4">Blog Post Not Found</h1>
        <p className="text-muted-foreground mb-6">
          {error || "The blog post you're looking for doesn't exist or has been removed."}
        </p>
        <Button onClick={() => setLocation(backTo)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Blog
        </Button>
      </div>
    </div>
  );
}

// Blog Sidebar Component
interface BlogSidebarProps {
  side: 'left' | 'right';
  tableOfContents?: { id: string; title: string; level: number; }[];
  relatedPosts?: { id: number; title: string; readingTime?: number; }[];
  showAds?: boolean;
  loadingRelated?: boolean;
}

function BlogSidebar({
  side,
  tableOfContents = [],
  relatedPosts = [],
  showAds = true,
  loadingRelated = false
}: BlogSidebarProps) {
  const [, setLocation] = useLocation();
  if (side === 'left') {
    return (
      <div className="space-y-3">
        {/* Table of Contents */}
        {tableOfContents && tableOfContents.length > 0 && (
          <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-md p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-foreground tracking-tight">Contents</h3>
            </div>
            <nav className="space-y-2">
              {tableOfContents.map((item) => (
                <a 
                  key={item.id}
                  href={`#${item.id}`}
                  className={`block text-[13px] text-muted-foreground hover:text-cyan-400 transition-colors py-1.5 px-3 rounded-lg hover:bg-cyan-500/5 ${
                    item.level > 1 ? 'ml-4 border-l-2 border-border/50 pl-4' : 'font-medium text-foreground'
                  }`}
                >
                  {item.title}
                </a>
              ))}
            </nav>
          </div>
        )}

        {/* Quick Links */}
        <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-md p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
              <ExternalLink className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-foreground tracking-tight">Quick Links</h3>
          </div>
          <div className="space-y-2">
            <a href="#" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-cyan-400 transition-colors py-2 px-3 rounded-xl hover:bg-cyan-500/5">
              GitHub Repository
            </a>
            <a href="#" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-cyan-400 transition-colors py-2 px-3 rounded-xl hover:bg-cyan-500/5">
              Live Demo
            </a>
            <a href="#" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-cyan-400 transition-colors py-2 px-3 rounded-xl hover:bg-cyan-500/5">
              Documentation
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Right sidebar
  return (
    <div className="space-y-3">
      {/* Related Posts */}
      {loadingRelated ? (
        <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-md p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500 animate-pulse">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-foreground tracking-tight">Related Posts</h3>
          </div>
          <div className="text-muted-foreground text-sm py-4 flex items-center justify-center animate-pulse">
            Loading related posts...
          </div>
        </div>
      ) : relatedPosts && relatedPosts.length > 0 && (
        <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-md p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-foreground tracking-tight">Related Posts</h3>
          </div>
          <div className="space-y-4">
            {relatedPosts.slice(0, 3).map((post, index) => (
              <div key={post.id} className="group relative">
                <div
                  className="cursor-pointer p-3 rounded-xl hover:bg-cyan-500/5 transition-all duration-300 border border-transparent hover:border-cyan-500/20 shadow-sm"
                  onClick={() => setLocation(`/blog/${post.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyPress={e => {
                    if (e.key === 'Enter' || e.key === ' ') setLocation(`/blog/${post.id}`);
                  }}
                >
                  <h4 className="text-sm font-semibold text-foreground group-hover:text-cyan-400 transition-colors line-clamp-2 leading-tight">
                    {post.title}
                  </h4>
                  {post.readingTime && (
                    <p className="text-[11px] text-muted-foreground mt-2 font-medium">{post.readingTime} min read</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Popular Tags - Dynamic */}
      <PopularTagsSection />

      {/* Advertisement Block */}
      {showAds && (
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
      )}
    </div>
  );
}
