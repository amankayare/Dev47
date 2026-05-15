import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Star, Search, X, Eye } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useDeleteConfirmation } from '@/hooks/useDeleteConfirmation';
import { apiGet, apiDelete } from '@/utils/api';
import { CategoryDropdown } from '@/components/ui/CategoryDropdown';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface Blog {
  id: number;
  title: string;
  excerpt?: string;
  content: string;
  cover_image?: string;
  date: string;
  reading_time?: number;
  featured: boolean;
  is_visible: boolean;
  author_id?: number;
  author?: { id: number; name: string; email?: string };
  tags: Array<{ id: number; name: string }>;
  category?: { id: number; name: string };
  quick_links?: Array<{ title: string; url: string }>;
}

export default function BlogsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  // Pagination and search state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(6);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Category filter state
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortByCategory, setSortByCategory] = useState(false);
  const [categories, setCategories] = useState<Array<{id: number; name: string}>>([]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/blog-categories');
        const data = await res.json();
        setCategories(data);
      } catch (err) {
        setCategories([]);
      }
    }
    fetchCategories();
  }, []);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page on new search
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Delete confirmation setup
  const deleteConfirmation = useDeleteConfirmation({
    onDelete: (id: number) => deleteMutation.mutate(id),
    itemName: (blog: Blog) => blog.title,
    itemType: 'blog post',
  });

  const { data: blogsData, isLoading, error } = useQuery({
    queryKey: ['/api/blogs/admin', page, pageSize, debouncedSearch, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
        status: statusFilter,
      });
      if (debouncedSearch) params.append('search', debouncedSearch);
      return apiGet(`/api/blogs/admin?${params.toString()}`);
    },
  });

  // Handle both new paginated format and old array format for backward compatibility
  const typedBlogsData = blogsData && typeof blogsData === 'object' && 'blogs' in blogsData ? blogsData as {
    blogs: Blog[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
    current_filter: string;
    counts: {
      all: number;
      visible: number;
      hidden: number;
    };
  } : null;

  const legacyBlogs = blogsData && Array.isArray(blogsData) ? blogsData as Blog[] : null;

  const clearSearch = () => setSearch('');

  const getDefaultCoverImage = (title: string, index: number) => {
    const gradients = [
      "from-cornflower-400 to-cornflower-600",
      "from-cornflower-500 to-cornflower-700", 
      "from-cornflower-600 to-cornflower-800",
      "from-cornflower-300 to-cornflower-500",
      "from-cornflower-700 to-cornflower-900",
      "from-cornflower-400 to-cornflower-500",
      "from-cornflower-500 to-cornflower-600",
      "from-cornflower-600 to-cornflower-700",
      "from-cornflower-300 to-cornflower-400",
      "from-cornflower-700 to-cornflower-800"
    ];
    
    const gradient = gradients[index % gradients.length];
    const initials = title
      .split(' ')
      .slice(0, 2)
      .map(word => word.charAt(0).toUpperCase())
      .join('');
    
    return { gradient, initials };
  };

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/blogs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blogs/admin'] });
      toast({ title: 'Success', description: 'Blog deleted successfully.' });
    },
  });

  const handleEdit = (blog: Blog) => {
    setLocation(`/admin/blogs/edit/${blog.id}`);
  };

  const handleViewBlog = (blog: Blog) => {
    window.open(`/blog/${blog.id}`, '_blank');
  };

  const filteredBlogs = (typedBlogsData?.blogs || [])
    .filter(blog => !categoryFilter || blog.category?.id === Number(categoryFilter))
    .sort((a, b) => {
      if (!sortByCategory) return 0;
      if (!a.category || !b.category) return 0;
      return a.category.name.localeCompare(b.category.name);
    });

  return (
    <AdminLayout title="Manage Blog Posts">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-10">
          {/* Enhanced Header Section - Cyberpunk cornflower */}
          <div className="bg-gradient-to-r from-cornflower-50 via-cornflower-50/50 to-white dark:from-cornflower-950 dark:via-cornflower-900/40 dark:to-black/20 rounded-3xl p-8 border border-cornflower-200/50 dark:border-cornflower-500/10 shadow-sm relative overflow-hidden">
            {/* Background Decorative Element */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-cornflower-500/5 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-cornflower-500 to-cornflower-700 rounded-xl flex items-center justify-center shadow-lg shadow-cornflower-500/20">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-cornflower-900 dark:text-cornflower-50 drop-shadow-[0_0_10px_rgba(100, 149, 237,0.3)]">
                      Blog Management
                    </h1>
                  </div>
                  <p className="text-cornflower-700/70 dark:text-cornflower-300/70 text-sm max-w-2xl leading-relaxed font-medium">
                    Manage your transmissions to the digital frontier.
                  </p>
                </div>
                
                <Button 
                  className="bg-cornflower-600 hover:bg-cornflower-700 dark:bg-cornflower-500 dark:hover:bg-cornflower-600 text-white shadow-xl shadow-cornflower-500/20 transition-all duration-300 px-8 py-6 font-black uppercase tracking-widest rounded-full border-0 transform hover:scale-105 active:scale-95" 
                  onClick={() => setLocation('/admin/blogs/new')}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create New Post
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end border-t border-cornflower-100 dark:border-cornflower-500/10 pt-8">
                {/* Search and Category */}
                <div className="lg:col-span-8 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cornflower-400 dark:text-cornflower-500 w-4 h-4" />
                      <Input
                        type="text"
                        placeholder="Search archives..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 pr-10 h-12 bg-card/50 dark:bg-black/30 backdrop-blur-md border-cornflower-200/50 dark:border-cornflower-500/20 rounded-xl focus:ring-2 focus:ring-cornflower-500 transition-all text-cornflower-900 dark:text-cornflower-100"
                      />
                      {search && (
                        <button onClick={clearSearch} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-cornflower-400 hover:text-cornflower-600">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="w-full sm:w-64">
                      <CategoryDropdown
                        categories={categories}
                        selectedId={categoryFilter}
                        onSelect={(id) => { setCategoryFilter(id.toString()); setPage(1); }}
                        placeholder="All Categories"
                      />
                    </div>
                  </div>
                  
                  {/* Status Badges */}
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'all', label: 'All', count: typedBlogsData?.counts?.all },
                      { id: 'visible', label: 'Live', count: typedBlogsData?.counts?.visible },
                      { id: 'hidden', label: 'Draft', count: typedBlogsData?.counts?.hidden }
                    ].map((status) => (
                      <Badge
                        key={status.id}
                        variant={statusFilter === status.id ? 'default' : 'secondary'}
                        className={`cursor-pointer transition-all duration-300 rounded-full font-black text-[9px] uppercase tracking-[0.15em] px-4 py-1.5 border-0 ${
                          statusFilter === status.id 
                            ? 'bg-cornflower-600 text-white shadow-lg shadow-cornflower-500/30 scale-105' 
                            : 'bg-cornflower-100 dark:bg-cornflower-900/30 text-cornflower-700 dark:text-cornflower-400 hover:bg-cornflower-200 dark:hover:bg-cornflower-900/50'
                        }`}
                        onClick={() => { setStatusFilter(status.id); setPage(1); }}
                      >
                        {status.label} ({status.count || (isLoading ? '...' : '0')})
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Stats and Info */}
                <div className="lg:col-span-4 flex flex-col items-end gap-3">
                  <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-cornflower-500/60 dark:text-cornflower-400/60">
                    <span className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-cornflower-500 rounded-full animate-pulse"></div>
                      {typedBlogsData?.total || '0'} Total
                    </span>
                    <span className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-cornflower-400 rounded-full"></div>
                      Page {typedBlogsData?.page || '1'}/{typedBlogsData?.total_pages || '1'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        {/* Enhanced Loading State */}
        {isLoading ? (
          <div className="space-y-6">
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-cornflower-500/10 dark:bg-cornflower-500/20 rounded-[2rem] mx-auto mb-6 flex items-center justify-center animate-pulse shadow-inner">
                <svg className="w-8 h-8 text-cornflower-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-cornflower-950 dark:text-cornflower-50 mb-2 uppercase tracking-widest">Accessing digital logs...</h3>
              <p className="text-cornflower-700/60 dark:text-cornflower-300/60 font-bold text-sm">Please wait while we sync with the mainframe</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-800 dark:to-red-700 rounded-2xl mx-auto mb-6 flex items-center justify-center">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Error Loading Blogs</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
              There was an issue loading your blog posts. Please check your connection and try again.
            </p>
            <pre className="text-xs text-red-600 dark:text-red-400 mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg max-w-md mx-auto overflow-auto">
              {error?.message || 'Unknown error'}
            </pre>
          </div>
        ) : legacyBlogs ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-800 dark:to-yellow-700 rounded-2xl mx-auto mb-6 flex items-center justify-center">
              <svg className="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Backend Update Required</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
              The backend is returning the old format. Found {legacyBlogs.length} blog posts but search and pagination features are not available until the backend is updated.
            </p>
          </div>
        ) : typedBlogsData && typedBlogsData.blogs && typedBlogsData.blogs.length === 0 && !search ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-cornflower-500/10 dark:bg-cornflower-500/20 rounded-[2.5rem] mx-auto mb-8 flex items-center justify-center shadow-inner">
              <svg className="w-12 h-12 text-cornflower-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-cornflower-950 dark:text-cornflower-50 mb-4 uppercase tracking-[0.2em]">Zero Data Streams</h3>
            <p className="text-cornflower-700/60 dark:text-cornflower-300/60 mb-8 max-w-md mx-auto font-bold">
              Your digital logbook is empty. Initialize your first transmission to the network.
            </p>
            <Button 
              onClick={() => setLocation('/admin/blogs/new')}
              className="bg-cornflower-600 hover:bg-cornflower-700 dark:bg-cornflower-500 dark:hover:bg-cornflower-600 text-white px-10 py-6 rounded-full font-black uppercase tracking-widest text-xs shadow-xl shadow-cornflower-500/30 transition-all duration-300 transform hover:scale-105 border-0"
            >
              <Plus className="w-5 h-5 mr-2" />
              Initiate Transmission
            </Button>
          </div>
        ) : typedBlogsData && typedBlogsData.total === 0 && search ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl mx-auto mb-6 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">No posts found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
              No blog posts match your search for "{search}". Try a different search term or filter.
            </p>
            <Button 
              onClick={clearSearch}
              variant="outline"
              className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <X className="w-4 h-4 mr-2" />
              Clear Search
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-8 max-w-7xl mx-auto">
              {filteredBlogs.map((blog, index) => (
              <Card 
                key={blog.id} 
                className={`group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-0 bg-card/70 dark:bg-black/40 backdrop-blur-md rounded-[2rem] overflow-hidden shadow-lg w-full ${
                  blog.featured ? 'ring-2 ring-cornflower-500 shadow-[0_0_20px_rgba(100, 149, 237,0.2)]' : ''
                }`}
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: 'fadeInUp 0.6s ease-out forwards'
                }}
              >
                <div className="relative">
                  {/* Cover Image */}
                  <div className="h-48 overflow-hidden relative">
                    {blog.cover_image ? (
                      <>
                        <img 
                          src={blog.cover_image} 
                          alt={blog.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const placeholder = target.nextElementSibling as HTMLElement;
                            if (placeholder) placeholder.style.display = 'flex';
                          }}
                        />
                        <div 
                          className={`absolute inset-0 bg-gradient-to-br ${getDefaultCoverImage(blog.title, index).gradient} hidden items-center justify-center`}
                          style={{ display: 'none' }}
                        >
                          <div className="text-center text-white">
                            <div className="text-3xl font-bold mb-2">
                              {getDefaultCoverImage(blog.title, index).initials}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${getDefaultCoverImage(blog.title, index).gradient} flex items-center justify-center relative overflow-hidden`}>
                        <div className="text-center text-white relative z-10">
                          <div className="text-4xl font-bold mb-3 drop-shadow-lg">
                            {getDefaultCoverImage(blog.title, index).initials}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Category Badge */}
                  {blog.category && (
                    <div className="absolute bottom-4 right-4 z-20">
                      <div className="bg-cornflower-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg shadow-cornflower-500/20">
                        {blog.category.name}
                      </div>
                    </div>
                  )}
                  {blog.featured && (
                    <div className="absolute top-4 left-4 z-20">
                      <div className="bg-cornflower-900 dark:bg-cornflower-950 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg">
                        <Star className="w-3 h-3 fill-current text-cornflower-400" />
                        Featured
                      </div>
                    </div>
                  )}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleViewBlog(blog)}
                        title="View Blog Post"
                        className="bg-cornflower-500/90 hover:bg-cornflower-600 text-white backdrop-blur-sm border-0 shadow-lg rounded-full w-9 h-9 p-0 flex items-center justify-center"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => handleEdit(blog)}
                        className="bg-card/90 dark:bg-cornflower-900/90 hover:bg-card dark:hover:bg-cornflower-800 text-cornflower-950 dark:text-cornflower-50 backdrop-blur-sm border-0 shadow-lg rounded-full w-9 h-9 p-0 flex items-center justify-center"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => deleteConfirmation.openConfirmDialog(blog)}
                        disabled={deleteMutation.isPending}
                        className="bg-cornflower-950/90 hover:bg-black text-white backdrop-blur-sm border-0 shadow-lg rounded-full w-9 h-9 p-0 flex items-center justify-center"
                      >
                        {deleteMutation.isPending ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
                
                <CardHeader className="p-6 pb-4">
                  <div className="space-y-4">
                    <CardTitle className="text-xl font-black text-cornflower-950 dark:text-cornflower-50 line-clamp-2 group-hover:text-cornflower-600 dark:group-hover:text-cornflower-400 transition-colors leading-tight tracking-tight uppercase">
                      {blog.title}
                    </CardTitle>
                    <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(blog.date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                      {blog.reading_time && (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {blog.reading_time} min read
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="px-6 pb-6 space-y-5">
                  {blog.excerpt && (
                    <p className="text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed text-base">
                      {blog.excerpt}
                    </p>
                  )}
                  
                  {blog.tags && blog.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {blog.tags.slice(0, 4).map((tag) => (
                        <Badge 
                          key={tag.id} 
                          variant="secondary" 
                          className="bg-cornflower-500/5 dark:bg-cornflower-500/10 text-cornflower-700 dark:text-cornflower-300 border-cornflower-200/50 dark:border-cornflower-500/20 hover:bg-cornflower-500/10 transition-all rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest"
                        >
                          #{tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 mt-2 border-t border-cornflower-200/30 dark:border-cornflower-500/10">
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${blog.featured ? 'bg-cornflower-500 animate-pulse' : 'bg-cornflower-200 dark:bg-cornflower-900/50'}`}></div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-cornflower-700/60 dark:text-cornflower-400/60">
                        {blog.featured ? 'Priority Post' : 'Standard Log'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${blog.is_visible ? 'bg-cornflower-400 shadow-[0_0_8px_rgba(129,140,248,0.6)]' : 'bg-cornflower-950'}`}></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-cornflower-700/60 dark:text-cornflower-400/60">
                          {blog.is_visible ? 'Live' : 'Encrypted'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            </div>
            
            {/* Pagination */}
            {typedBlogsData && typedBlogsData.total > 0 && (
              <div className="flex flex-col items-center mt-8 space-y-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {((typedBlogsData.page - 1) * typedBlogsData.page_size) + 1} to{' '}
                  {Math.min(typedBlogsData.page * typedBlogsData.page_size, typedBlogsData.total)} of{' '}
                  {typedBlogsData.total} results
                </div>
                
                {typedBlogsData.total_pages > 1 && (
                  <nav className="flex items-center gap-2">
                    <button
                      className="px-4 py-2 rounded-lg bg-card dark:bg-gray-800 border border-gray-200 dark:border-gray-700 disabled:opacity-50"
                      onClick={() => setPage(typedBlogsData.page - 1)}
                      disabled={typedBlogsData.page === 1}
                    >
                      ← Prev
                    </button>
                    {Array.from({ length: typedBlogsData.total_pages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        className={`px-4 py-2 rounded-full font-black text-xs ${
                          p === typedBlogsData.page
                            ? "bg-cornflower-600 text-white"
                            : "bg-cornflower-500/10 dark:bg-cornflower-500/10 text-cornflower-700 dark:text-cornflower-300"
                        }`}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      className="px-4 py-2 rounded-lg bg-card dark:bg-gray-800 border border-gray-200 dark:border-gray-700 disabled:opacity-50"
                      onClick={() => setPage(typedBlogsData.page + 1)}
                      disabled={typedBlogsData.page === typedBlogsData.total_pages}
                    >
                      Next →
                    </button>
                  </nav>
                )}
              </div>
            )}
          </div>
        )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteConfirmation.confirmState.isOpen}
        onOpenChange={(open) => !open && deleteConfirmation.closeConfirmDialog()}
        title={deleteConfirmation.getTitle()}
        description={deleteConfirmation.getConfirmationText()}
        onConfirm={deleteConfirmation.confirmDelete}
        isLoading={deleteMutation.isPending}
      />

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </AdminLayout>
  );
}
