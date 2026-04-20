import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Search, Calendar, Clock, User, ExternalLink } from "lucide-react";

interface BlogTag {
  id: number;
  name: string;
}

interface BlogAuthor {
  id: number;
  name: string;
  email: string;
}

interface Blog {
  id: number;
  title: string;
  excerpt?: string;
  content: string;
  cover_image?: string;
  date: string;
  reading_time?: number;
  featured: boolean;
  author?: BlogAuthor;
  tags?: BlogTag[];
}

type BlogsContentProps = {
  blogSearchQuery: string;
  setBlogSearchQuery: React.Dispatch<React.SetStateAction<string>>;
};

const DynamicBlogsContent = ({ blogSearchQuery, setBlogSearchQuery }: BlogsContentProps) => {
  const [, setLocation] = useLocation();
  const { data: blogs = [], isLoading, error } = useQuery({
    queryKey: ['/api/blogs/'],
    queryFn: async (): Promise<Blog[]> => {
      const response = await fetch('/api/blogs/');
      if (!response.ok) throw new Error('Failed to fetch blogs');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const filteredBlogs = useMemo(() => {
    if (!blogs) return [];
    
    return blogs.filter(
      (blog) =>
        blogSearchQuery === "" ||
        blog.title.toLowerCase().includes(blogSearchQuery.toLowerCase()) ||
        (blog.excerpt && blog.excerpt.toLowerCase().includes(blogSearchQuery.toLowerCase())) ||
        (blog.tags && blog.tags.some((tag) =>
          tag.name.toLowerCase().includes(blogSearchQuery.toLowerCase())
        ))
    );
  }, [blogs, blogSearchQuery]);

  const getGradient = (index: number) => {
    const gradients = [
      "from-blue-500 to-purple-600",
      "from-green-500 to-teal-600", 
      "from-orange-500 to-red-600",
      "from-purple-500 to-pink-600",
      "from-cyan-500 to-blue-600",
      "from-yellow-500 to-orange-600"
    ];
    return gradients[index % gradients.length];
  };

  const getDefaultCoverImage = (title: string, index: number) => {
    const gradients = [
      'from-blue-400 via-purple-500 to-blue-600',
      'from-green-400 via-teal-500 to-cyan-600',
      'from-orange-400 via-pink-500 to-red-600',
      'from-purple-400 via-violet-500 to-purple-600',
      'from-cyan-400 via-blue-500 to-indigo-600',
      'from-yellow-400 via-orange-500 to-red-600',
      'from-pink-400 via-rose-500 to-pink-600',
      'from-indigo-400 via-purple-500 to-pink-600',
      'from-teal-400 via-green-500 to-blue-600',
      'from-rose-400 via-pink-500 to-purple-600'
    ];
    
    // Get initials from title
    const initials = title
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
    
    const gradient = gradients[index % gradients.length];
    
    return (
      <div className={`w-full h-48 bg-gradient-to-br ${gradient} flex items-center justify-center relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-4 w-8 h-8 border border-white/30 rounded-full"></div>
          <div className="absolute top-8 right-8 w-6 h-6 border border-white/20 rounded-full"></div>
          <div className="absolute bottom-6 left-8 w-4 h-4 bg-white/20 rounded-full"></div>
          <div className="absolute bottom-12 right-6 w-12 h-1 bg-white/20 rounded-full"></div>
          <div className="absolute top-16 left-1/2 w-2 h-16 bg-white/10 rounded-full transform -rotate-45"></div>
        </div>
        <div className="text-4xl font-bold text-white z-10">
          {initials}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="hero-squares p-4 sm:p-8 lg:px-16 xl:px-20 vs-scrollbar overflow-auto h-full">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading blog posts...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="hero-squares p-4 sm:p-8 lg:px-16 xl:px-20 vs-scrollbar overflow-auto h-full">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-500 mb-2">Failed to load blog posts</p>
              <p className="text-muted-foreground text-sm">Please check your connection and try again</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (blogs.length === 0) {
    return (
      <div className="hero-squares p-4 sm:p-8 lg:px-16 xl:px-20 vs-scrollbar overflow-auto h-full">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 lg:mb-12 gap-4">
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground flex items-center">
              <BookOpen className="mr-4 text-primary flex-shrink-0" />
              Blog & Articles (0)
            </h1>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No blog posts available yet</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hero-squares p-4 sm:p-8 lg:px-16 xl:px-20 vs-scrollbar overflow-auto h-full">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 lg:mb-12 gap-4">
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground flex items-center">
            <BookOpen className="mr-4 text-primary flex-shrink-0" />
            Blog & Articles ({filteredBlogs.length})
          </h1>
          <div className="w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search articles..."
                value={blogSearchQuery}
                onChange={(e) => setBlogSearchQuery(e.target.value)}
                className="pl-10 w-full sm:w-64 rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {filteredBlogs.map((blog, index) => (
            <Card 
              key={blog.id} 
              className="overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full"
            >
              <div className={`h-2 bg-gradient-to-r ${getGradient(index)}`} />
              
              <div className="h-48 overflow-hidden">
                {blog.cover_image ? (
                  <img 
                    src={blog.cover_image} 
                    alt={blog.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Replace failed image with default placeholder
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const placeholder = getDefaultCoverImage(blog.title, index);
                      target.parentElement!.innerHTML = '';
                      target.parentElement!.appendChild(
                        Object.assign(document.createElement('div'), {
                          innerHTML: placeholder.props.children
                        })
                      );
                    }}
                  />
                ) : (
                  getDefaultCoverImage(blog.title, index)
                )}
              </div>
              
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(blog.date).toLocaleDateString()}
                  </div>
                  {blog.reading_time && (
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {blog.reading_time} min read
                    </div>
                  )}
                </div>
                
                <CardTitle 
                  className="text-lg leading-tight line-clamp-2 hover:text-primary transition-colors cursor-pointer"
                  onClick={() => window.open(`/blog/${blog.id}`, '_blank')}
                >
                  {blog.title}
                </CardTitle>
                
                {blog.featured && (
                  <Badge variant="secondary" className="w-fit">
                    Featured
                  </Badge>
                )}
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col">
                {blog.excerpt && (
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-3">
                    {blog.excerpt}
                  </p>
                )}
                
                <div className="mt-auto">
                  {blog.tags && blog.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {blog.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag.id} variant="outline" className="text-xs">
                          {tag.name}
                        </Badge>
                      ))}
                      {blog.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{blog.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    {blog.author && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <User className="w-4 h-4 mr-1" />
                        {blog.author.name}
                      </div>
                    )}
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open(`/blog/${blog.id}`, '_blank')}
                      className="ml-auto"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Read More
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DynamicBlogsContent;