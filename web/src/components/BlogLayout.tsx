import { ReactNode, useEffect, useState } from 'react';
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
import { ArrowLeft, Calendar, Clock, User, Share2, BookOpen, ExternalLink, TrendingUp, Tag, Moon, Sun, LogOut, Settings, ChevronDown, LogIn, UserPlus, MoreVertical } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { decodeHtmlEntities } from '@/utils/textUtils';

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
    <Card className="bg-background/60 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground/90">
          <Tag className="w-4 h-4 text-primary" />
          Popular Tags
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-2">
          {tagsData.popular_tags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="text-xs px-2 py-1 cursor-pointer bg-muted/60 text-foreground border border-border/50 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 hover:scale-105 relative group font-medium"
              onClick={() => handleTagClick(tag.name)}
              title={`${tag.count} posts (${tag.percentage}%)`}
            >
              {tag.name}
              <span className="ml-1 text-xs opacity-70 group-hover:opacity-100 transition-opacity">
                ({tag.count})
              </span>
            </Badge>
          ))}
        </div>
        {tagsData.total_blogs > 0 && (
          <div className="mt-2 text-xs text-muted-foreground">
            Based on {tagsData.total_blogs} blog posts
          </div>
        )}
      </CardContent>
    </Card>
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
      {/* Fixed Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 shadow-lg">
        <div className="container max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 sm:h-20 lg:h-24 items-center justify-between gap-2">
            {/* Logo Section */}
            <div className="flex items-center cursor-pointer" onClick={() => setLocation('/blogs')}>
              <img 
                src={theme === 'dark' ? '/logo-dark.svg' : '/logo-light.svg'} 
                alt="Blog Logo" 
                className="h-12 sm:h-14 md:h-16 lg:h-18 w-auto transition-opacity duration-300"
              />
            </div>
            
            {/* Right section */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Desktop Authentication Section - Hidden on mobile */}
              {!isMobile && (
                <div className="flex items-center gap-3">
                  {currentUser ? (
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
                            {currentUser.username || currentUser.name}
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
                  ) : (
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
                </div>
              )}
              
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
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
        </div>
      </header>

      {/* Main Content with Sidebars */}
      <main className="container py-8 max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-16">
          {/* Left Sidebar (Quick Links + Top 10 Featured Blogs) */}
          <aside className="lg:col-span-2 order-3 lg:order-1">
            <div className="sticky top-24 space-y-6">
              {/* Quick Links Block */}
              <Card className="shadow-xl border border-border">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-muted-foreground px-1 py-0.5">
                    Quick Links
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="divide-y divide-border">
                    {quickLinks && quickLinks.length > 0 ? (
                      quickLinks.map((link, index) => (
                        <li key={index} className="py-2 first:pt-0 last:pb-0">
                          <a
                            href={link.url}
                            className="block text-black dark:text-white font-medium text-sm leading-tight hover:text-blue-700 hover:underline"
                          >
                            {link.title}
                          </a>
                        </li>
                      ))
                    ) : (
                      // Fallback to hardcoded links if no dynamic links available
                      <>
                        <li className="py-2 first:pt-0 last:pb-0">
                          <a
                            href="#getting-started-react"
                            className="block text-black dark:text-white font-medium text-sm leading-tight hover:text-blue-700 hover:underline"
                          >
                            Getting Started with React
                          </a>
                        </li>
                        <li className="py-2 first:pt-0 last:pb-0">
                          <a
                            href="#typescript-best-practices"
                            className="block text-black dark:text-white font-medium text-sm leading-tight hover:text-blue-700 hover:underline"
                          >
                            TypeScript Best Practices
                          </a>
                        </li>
                        <li className="py-2 first:pt-0 last:pb-0">
                          <a
                            href="#building-modern-web-apps"
                            className="block text-black dark:text-white font-medium text-sm leading-tight hover:text-blue-700 hover:underline"
                          >
                            Building Modern Web Apps
                          </a>
                        </li>
                      </>
                    )}
                  </ul>
                </CardContent>
              </Card>
              {/* Top Featured Blogs Block */}
              <Card className="shadow-xl border border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base font-bold text-muted-foreground px-1 py-0.5">
                    <BookOpen className="w-5 h-5 text-primary" />
                    Top Featured Blogs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="divide-y divide-border">
                    {top10FeaturedBlogs.map((post, idx) => (
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
                          <span className="block text-xs text-muted-foreground mt-1">{post.reading_time} min read</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Main Blog Content */}
          <article className="lg:col-span-8 order-1 lg:order-2">
            <div className="space-y-6 bg-background/50 backdrop-blur-sm border border-border/50 rounded-2xl p-5 lg:p-6 shadow-xl max-w-5xl mx-auto">
              {/* Hero Section */}
              <BlogHero
                title={decodeHtmlEntities(title)}
                excerpt={decodeHtmlEntities(excerpt)}
                featured={featured}
                author={author}
                date={date}
                readingTime={readingTime}
                tags={tags}
                category={category}
                onShare={showShareButton ? handleShare : undefined}
              />

              <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />

              {/* Cover Image */}
              {coverImage && (
                <BlogCoverImage src={coverImage} alt={title} />
              )}

              {/* Dynamic Content Area */}
              <div className="blog-content prose prose-base prose-gray dark:prose-invert max-w-none px-2">
                {children}
              </div>
            </div>
          </article>

          {/* Right Sidebar */}
          <aside className="lg:col-span-2 order-2 lg:order-3">
            <div className="sticky top-24 space-y-6">
              {/* Advertisement Block */}
              {showAds && (
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
              )}
              <BlogSidebar 
                side="right" 
                relatedPosts={relatedPosts}
                showAds={false}
              />
            </div>
          </aside>
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
    <header className="space-y-6">
      {/* Featured Badge */}
      {featured && (
        <Badge variant="secondary" className="mb-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-white dark:text-white border-yellow-400 font-semibold shadow-md">
          ⭐ Featured Post
        </Badge>
      )}
      {/* Category Badge */}
      {category && (
        <Badge variant="default" className="mb-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white dark:text-white border-blue-500 font-semibold shadow-md">
          {category.name}
        </Badge>
      )}
      
      {/* Title and Actions */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight flex-1">
            {title}
          </h1>
          
          {onShare && (
            <Button variant="outline" size="sm" onClick={onShare} className="self-start hover:bg-primary hover:text-primary-foreground transition-all duration-200 hover:scale-105">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          )}
        </div>
        
        {/* Excerpt */}
        {excerpt && (
          <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed">
            {excerpt}
          </p>
        )}
      </div>

      {/* Meta Information */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        {author && (
          <div className="flex items-center gap-2">
            {author.avatar ? (
              <img 
                src={author.avatar} 
                alt={author.name}
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <User className="w-4 h-4" />
            )}
            <span className="font-medium">{author.name}</span>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>{new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</span>
        </div>
        
        {readingTime && (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{readingTime} min read</span>
          </div>
        )}
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-3 mt-4">
          {tags.map((tag) => (
            <Badge key={tag.id} variant="outline" className="px-3 py-1 bg-primary/10 text-primary border-primary/30 hover:bg-primary hover:text-primary-foreground transition-all duration-200 cursor-pointer hover:scale-105 font-medium">
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
    <div className="relative aspect-video overflow-hidden rounded-lg border bg-muted">
      <img 
        src={src} 
        alt={alt}
        className="object-cover w-full h-full transition-transform hover:scale-105"
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
          <span>© {new Date().getFullYear()} Blog Master Insights</span>
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
      <div className="space-y-6">
        {/* Table of Contents */}
        {tableOfContents && tableOfContents.length > 0 && (
          <Card className="bg-background/60 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground/90">
                <BookOpen className="w-4 h-4 text-primary" />
                Contents
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <nav className="space-y-2">
                {tableOfContents.map((item) => (
                  <a 
                    key={item.id}
                    href={`#${item.id}`} 
                    className={`block text-sm text-muted-foreground hover:text-primary transition-colors py-2 px-2 rounded-md hover:bg-muted/50 ${
                      item.level > 1 ? 'ml-4 border-l-2 border-muted pl-4' : ''
                    }`}
                  >
                    {item.title}
                  </a>
                ))}
              </nav>
            </CardContent>
          </Card>
        )}

        {/* Quick Links */}
        <Card className="bg-background/60 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground/90">
              <ExternalLink className="w-4 h-4 text-primary" />
              Quick Links
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <a 
                href="#" 
                className="block text-sm text-primary hover:text-primary/80 transition-colors py-2 px-2 rounded-md hover:bg-primary/10"
              >
                GitHub Repository
              </a>
              <a 
                href="#" 
                className="block text-sm text-primary hover:text-primary/80 transition-colors py-2 px-2 rounded-md hover:bg-primary/10"
              >
                Live Demo
              </a>
              <a 
                href="#" 
                className="block text-sm text-primary hover:text-primary/80 transition-colors py-2 px-2 rounded-md hover:bg-primary/10"
              >
                Documentation
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Right sidebar
  return (
    <div className="space-y-6">
      {/* Related Posts */}
      {loadingRelated ? (
        <Card className="bg-background/60 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground/90">
              <TrendingUp className="w-4 h-4 text-primary" />
              Related Posts
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-muted-foreground text-sm py-4 flex items-center justify-center">
              Loading related posts...
            </div>
          </CardContent>
        </Card>
      ) : relatedPosts && relatedPosts.length > 0 && (
        <Card className="bg-background/60 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground/90">
              <TrendingUp className="w-4 h-4 text-primary" />
              Related Posts
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {relatedPosts.slice(0, 3).map((post, index) => (
                <div key={post.id}>
                  <div
                    className="group cursor-pointer p-2 rounded-md hover:bg-muted/50 transition-colors"
                    onClick={() => setLocation(`/blog/${post.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyPress={e => {
                      if (e.key === 'Enter' || e.key === ' ') setLocation(`/blog/${post.id}`);
                    }}
                  >
                    <h4 className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h4>
                    {post.readingTime && (
                      <p className="text-xs text-muted-foreground mt-1">{post.readingTime} min read</p>
                    )}
                  </div>
                  {index < relatedPosts.slice(0, 3).length - 1 && <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Popular Tags - Dynamic */}
      <PopularTagsSection />

      {/* Advertisement Block */}
      {showAds && (
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
      )}
    </div>
  );
}
