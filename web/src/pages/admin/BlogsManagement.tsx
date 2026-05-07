import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { HtmlCodeEditor } from '@/components/ui/html-code-editor';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Star, Search, X, Eye, ExternalLink, Sparkles, Code2 } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useAIConvert } from '@/hooks/useAIConvert';
import { AIContentDraft } from '@/components/ui/AIContentDraft';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDeleteConfirmation } from '@/hooks/useDeleteConfirmation';
import { apiGet, apiPost, apiPut, apiDelete } from '@/utils/api';
import { CategoryDropdown } from '@/components/ui/CategoryDropdown';
import ImageInput from '@/components/ui/ImageInput';

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
  category?: { id: number; name: string }; // Added category field
  quick_links?: Array<{ title: string; url: string }>; // Added quick links field
}

interface BlogFormData {
  title: string;
  excerpt: string;
  content: string;
  cover_image: string;
  reading_time: string;
  featured: boolean;
  is_visible: boolean;
  tag_names: string;
  author_name: string;
  category_id?: number; // Added category ID field
  quick_links: Array<{ title: string; url: string }>; // Added quick links field
}

export default function BlogsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  
  // Pagination and search state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(6); // Increased from 5 to 6 for better content display
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Category filter state
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortByCategory, setSortByCategory] = useState(false);

  const [formData, setFormData] = useState<BlogFormData>({
    title: '',
    excerpt: '',
    content: '',
    cover_image: '',
    reading_time: '',
    featured: false,
    is_visible: true,
    tag_names: '',
    author_name: '',
    quick_links: []
  });

  // State for adding a new category inline
  const [newCategory, setNewCategory] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);

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

  // Category delete confirmation
  const categoryDeleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/blog-categories/${id}`),
    onSuccess: (_, id) => {
      setCategories(prev => prev.filter(cat => cat.id !== id));
      // If the deleted category was selected, clear it from form and filter
      setFormData(f => f.category_id === id ? { ...f, category_id: undefined } : f);
      if (categoryFilter === id.toString()) {
        setCategoryFilter('');
      }
      toast({ title: 'Success', description: 'Category deleted successfully.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete category.' });
    },
  });
  const categoryDeleteConfirmation = useDeleteConfirmation({
    onDelete: (id: number) => categoryDeleteMutation.mutate(id),
    itemName: (cat: any) => cat.name,
    itemType: 'category',
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

  // Fallback for old array format
  const legacyBlogs = blogsData && Array.isArray(blogsData) ? blogsData as Blog[] : null;

  // Clear search function
  const clearSearch = () => setSearch('');

  // Generate default cover image placeholder
  const getDefaultCoverImage = (title: string, index: number) => {
    const gradients = [
      "from-blue-500 to-purple-600",
      "from-green-500 to-teal-600", 
      "from-orange-500 to-red-600",
      "from-purple-500 to-pink-600",
      "from-cyan-500 to-blue-600",
      "from-yellow-500 to-orange-600",
      "from-indigo-500 to-purple-600",
      "from-pink-500 to-rose-600",
      "from-emerald-500 to-cyan-600",
      "from-violet-500 to-purple-600"
    ];
    
    const gradient = gradients[index % gradients.length];
    const initials = title
      .split(' ')
      .slice(0, 2)
      .map(word => word.charAt(0).toUpperCase())
      .join('');
    
    return { gradient, initials };
  };

  const createMutation = useMutation({
    mutationFn: async (data: BlogFormData) => {
      const payload = {
        ...data,
        reading_time: data.reading_time ? parseInt(data.reading_time) : null,
        tags: data.tag_names.split(',').map(t => t.trim()).filter(Boolean),
        author: { name: data.author_name },
        quick_links: data.quick_links || []
      };
      return apiPost('/api/blogs/', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blogs/admin'] });
      setIsCreateOpen(false);
      resetForm();
      toast({ title: 'Success', description: 'Blog created successfully.' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: BlogFormData }) => {
      // Ensure is_visible is always present and log payload
      const payload = {
        ...data,
        is_visible: typeof data.is_visible === 'boolean' ? data.is_visible : Boolean(data.is_visible),
        reading_time: data.reading_time ? parseInt(data.reading_time) : null,
        tags: data.tag_names.split(',').map(t => t.trim()).filter(Boolean),
        author: { name: data.author_name },
        quick_links: data.quick_links || []
      };
      console.log('[DEBUG] Update Blog Payload:', payload);
      return apiPut(`/api/blogs/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blogs/admin'] });
      setEditingBlog(null);
      resetForm();
      toast({ title: 'Success', description: 'Blog updated successfully.' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/blogs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blogs/admin'] });
      toast({ title: 'Success', description: 'Blog deleted successfully.' });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      excerpt: '',
      content: '',
      cover_image: '',
      reading_time: '',
      featured: false,
      is_visible: true,
      tag_names: '',
      author_name: '',
      quick_links: []
    });
    setActiveTab('draft');
    resetAI();
  };

  const handleEdit = (blog: Blog) => {
    setFormData({
      title: blog.title,
      excerpt: blog.excerpt || '',
      content: blog.content,
      cover_image: blog.cover_image || '',
      reading_time: blog.reading_time?.toString() || '',
      featured: blog.featured,
      is_visible: blog.is_visible,
      tag_names: blog.tags?.map(tag => tag.name).join(', ') || '',
      author_name: blog.author?.name || '',
      quick_links: blog.quick_links || []
    });
    setEditingBlog(blog);
    setActiveTab('html');
    resetAI();
  };

  const handleViewBlog = (blog: Blog) => {
    // Open the blog post page in a new browser tab
    window.open(`/blog/${blog.id}`, '_blank');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBlog) {
      updateMutation.mutate({ id: editingBlog.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // --- AI Conversion ---
  const [activeTab, setActiveTab] = useState('draft');
  const { isConverting, error: aiError, convert, reset: resetAI } = useAIConvert();

  const handleAIConvert = async (rawText: string) => {
    const result = await convert(rawText);
    if (!result) return; // error is already set inside the hook

    setFormData(prev => ({
      ...prev,
      content: result.html_content,
      // Only overwrite title/excerpt when they are currently empty
      title:   prev.title   || result.suggested_title,
      excerpt: prev.excerpt || result.suggested_excerpt,
    }));

    // Switch to HTML editor tab automatically
    setActiveTab('html');

    toast({
      title: '✨ AI Conversion Complete',
      description: 'HTML content has been generated. Review and edit before saving.',
    });
  };

  // Filter and sort blogs by category
  const filteredBlogs = (typedBlogsData?.blogs || [])
    .filter(blog => !categoryFilter || blog.category?.id === Number(categoryFilter))
    .sort((a, b) => {
      if (!sortByCategory) return 0;
      if (!a.category || !b.category) return 0;
      return a.category.name.localeCompare(b.category.name);
    });

  // Fetch categories for filter and dropdown
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

  // Handler for adding a new category
  async function handleAddCategory() {
    if (!newCategory.trim()) return;
    setAddingCategory(true);
    try {
      const added = await apiPost('/api/blog-categories', { name: newCategory.trim() });
      setCategories(prev => [...prev, added]);
      setNewCategory('');
    } catch (err) {
      // Optionally handle error, e.g. show toast
    } finally {
      setAddingCategory(false);
    }
  }

  return (
    <AdminLayout title="Manage Blog Posts">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-10">
          {/* Enhanced Header Section */}
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h1 className="text-3xl p-2 font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    Blog Management
                  </h1>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-base max-w-2xl leading-relaxed">
                  Create, edit, and manage your blog articles. Share your thoughts, tutorials, and insights with your audience.
                </p>
                
                {/* Search Bar and Filters */}
                <div className="space-y-4 mt-4">
                  <div className="relative max-w-md">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                      <Input
                        type="text"
                        placeholder="Search blog posts..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 pr-10 h-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                      />
                      {search && (
                        <button
                          type="button"
                          onClick={clearSearch}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {search && (
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        {typedBlogsData ? `Found ${typedBlogsData.total} results` : 'Searching...'}
                      </div>
                    )}
                  </div>
                  
                  {/* Status Filter Badges */}
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={statusFilter === 'all' ? 'default' : 'secondary'}
                      className={`cursor-pointer transition-colors ${
                        statusFilter === 'all' 
                          ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                          : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => {
                        setStatusFilter('all');
                        setPage(1);
                      }}
                    >
                      All ({typedBlogsData?.counts?.all || (isLoading ? '...' : '0')})
                    </Badge>
                    <Badge
                      variant={statusFilter === 'visible' ? 'default' : 'secondary'}
                      className={`cursor-pointer transition-colors ${
                        statusFilter === 'visible' 
                          ? 'bg-green-500 hover:bg-green-600 text-white' 
                          : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => {
                        setStatusFilter('visible');
                        setPage(1);
                      }}
                    >
                      Visible ({typedBlogsData?.counts?.visible || (isLoading ? '...' : '0')})
                    </Badge>
                    <Badge
                      variant={statusFilter === 'hidden' ? 'default' : 'secondary'}
                      className={`cursor-pointer transition-colors ${
                        statusFilter === 'hidden' 
                          ? 'bg-red-500 hover:bg-red-600 text-white' 
                          : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => {
                        setStatusFilter('hidden');
                        setPage(1);
                      }}
                    >
                      Hidden ({typedBlogsData?.counts?.hidden || (isLoading ? '...' : '0')})
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-3">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    {typedBlogsData?.total || (isLoading ? '...' : '0')} Total Posts
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    {typedBlogsData?.blogs?.filter(blog => blog.featured).length || (isLoading ? '...' : '0')} Featured
                  </span>
                  {typedBlogsData && (
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Page {typedBlogsData.page} of {typedBlogsData.total_pages} (Size: {typedBlogsData.page_size})
                    </span>
                  )}
                </div>
              </div>
              
              
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-3 font-semibold rounded-xl border-0 w-full lg:w-auto transform hover:scale-105" 
                    onClick={() => { resetForm(); setEditingBlog(null); }}
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create New Post
                  </Button>
                </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto bg-white dark:bg-gray-900 border-0 shadow-2xl rounded-2xl">
              <DialogHeader className="pb-6 border-b border-gray-200 dark:border-gray-700">
                <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Plus className="w-4 h-4 text-white" />
                  </div>
                  {editingBlog ? 'Edit Blog Post' : 'Create New Blog Post'}
                </DialogTitle>
                <DialogDescription className="text-gray-600 dark:text-gray-300 text-base mt-2">
                  Fill out the form below to {editingBlog ? 'update' : 'create'} a blog post. All fields marked with * are required.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6 pt-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Title */}
                  <div className="space-y-3">
                    <Label htmlFor="title" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      Title
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      required
                      className="h-12 text-base border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-blue-500 dark:focus:border-blue-400 transition-colors bg-gray-50 dark:bg-gray-800"
                      placeholder="Enter an engaging title for your blog post"
                    />
                  </div>
                  {/* Reading Time */}
                  <div className="space-y-3">
                    <Label htmlFor="reading_time" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Reading Time (minutes)
                    </Label>
                    <Input
                      id="reading_time"
                      type="number"
                      value={formData.reading_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, reading_time: e.target.value }))}
                      className="h-12 text-base border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-blue-500 dark:focus:border-blue-400 transition-colors bg-gray-50 dark:bg-gray-800"
                      placeholder="Estimated reading time"
                    />
                  </div>
                  {/* Author */}
                  <div className="space-y-3">
                    <Label htmlFor="author_name" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      Author
                    </Label>
                    <Input
                      id="author_name"
                      value={formData.author_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, author_name: e.target.value }))}
                      required
                      className="h-12 text-base border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-blue-500 dark:focus:border-blue-400 transition-colors bg-gray-50 dark:bg-gray-800"
                      placeholder="Enter author name"
                    />
                  </div>
                </div>
                {/* Category controls: full width below the first row for create form only */}
                {!editingBlog && (
                  <div className="space-y-3">
                    <Label htmlFor="category" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      Category <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex flex-row gap-2 items-start w-full">
                      <CategoryDropdown
                        categories={categories}
                        selectedId={formData.category_id || ''}
                        onSelect={id => setFormData(f => ({ ...f, category_id: id }))}
                        onDelete={id => categoryDeleteConfirmation.openConfirmDialog(categories.find(cat => cat.id === id))}
                        disabled={addingCategory}
                      />
                      <Input
                        type="text"
                        placeholder="Add new category"
                        value={newCategory}
                        onChange={e => setNewCategory(e.target.value)}
                        className="h-12 text-base border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-blue-500 dark:focus:border-blue-400 transition-colors bg-gray-50 dark:bg-gray-800 w-32"
                      />
                      <Button
                        type="button"
                        onClick={handleAddCategory}
                        disabled={addingCategory || !newCategory.trim()}
                        className="h-12 px-4 rounded-xl font-semibold shadow-sm transition-colors bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary/70 border border-transparent"
                        style={{ minWidth: 60 }}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                )}
                {/* End of form fields */}

                <div className="space-y-3">
                  <Label htmlFor="excerpt" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Excerpt
                  </Label>
                  <Textarea
                    id="excerpt"
                    value={formData.excerpt}
                    onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                    rows={3}
                    placeholder="Brief description of the blog post that will appear in previews"
                    className="text-base border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-blue-500 dark:focus:border-blue-400 transition-colors bg-gray-50 dark:bg-gray-800 resize-none"
                  />
                </div>

                {/* Content Section — tabbed: AI Draft or direct HTML editor */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full" />
                    Content *
                  </Label>

                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 rounded-xl mb-3 bg-gray-100 dark:bg-gray-800">
                      <TabsTrigger
                        value="draft"
                        className="flex items-center gap-1.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
                      >
                        <Sparkles className="w-3 h-3 text-purple-500" />
                        AI Draft
                      </TabsTrigger>
                      <TabsTrigger
                        value="html"
                        className="flex items-center gap-1.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
                      >
                        <Code2 className="w-3 h-3 text-blue-500" />
                        HTML Editor
                      </TabsTrigger>
                    </TabsList>

                    {/* AI Draft tab */}
                    <TabsContent value="draft" className="mt-0">
                      <AIContentDraft
                        isConverting={isConverting}
                        onConvert={handleAIConvert}
                      />
                      {aiError && (
                        <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                          <span>⚠️</span> {aiError}
                        </p>
                      )}
                    </TabsContent>

                    {/* Direct HTML editor tab */}
                    <TabsContent value="html" className="mt-0">
                      <div className="border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800">
                        <HtmlCodeEditor
                          value={formData.content}
                          onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                          placeholder="Enter HTML here, or use the AI Draft tab to auto-generate it."
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <ImageInput
                      label="Cover Image"
                      currentUrl={formData.cover_image}
                      onUrlChange={(url) => setFormData(prev => ({ ...prev, cover_image: url }))}
                      onUploadSuccess={(url) => setFormData(prev => ({ ...prev, cover_image: url }))}
                      onDelete={() => setFormData(prev => ({ ...prev, cover_image: '' }))}
                      accept="image/*"
                      maxSize={5}
                      uploadType="cover"
                      placeholder="Enter cover image URL..."
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="tag_names" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Tags (comma-separated)
                    </Label>
                    <Input
                      id="tag_names"
                      value={formData.tag_names}
                      onChange={(e) => setFormData(prev => ({ ...prev, tag_names: e.target.value }))}
                      placeholder="react, javascript, tutorial, web development"
                      className="h-12 text-base border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-blue-500 dark:focus:border-blue-400 transition-colors bg-gray-50 dark:bg-gray-800"
                    />
                  </div>

                  {/* Quick Links Section */}
                  <QuickLinksEditor 
                    quickLinks={formData.quick_links}
                    onChange={(quickLinks: Array<{ title: string; url: string }>) => setFormData(prev => ({ ...prev, quick_links: quickLinks }))}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="featured" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-500" />
                          Featured Post
                        </Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Featured posts appear prominently on your blog</p>
                      </div>
                      <Switch
                        id="featured"
                        checked={formData.featured}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: checked }))}
                        className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-purple-600"
                      />
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="is_visible" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <Eye className="w-4 h-4 text-green-500" />
                          Visible to Public
                        </Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Controls whether visitors can see this post</p>
                      </div>
                      <Switch
                        id="is_visible"
                        checked={formData.is_visible}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_visible: checked }))}
                        className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-green-500 data-[state=checked]:to-emerald-600"
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter className="pt-6 border-t border-gray-200 dark:border-gray-700 gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsCreateOpen(false);
                      setEditingBlog(null);
                      resetForm();
                    }}
                    className="px-6 py-3 rounded-xl border-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending} 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-0"
                  >
                    {(createMutation.isPending || updateMutation.isPending) ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {editingBlog ? 'Updating...' : 'Creating...'}
                      </div>
                    ) : (
                      <>{editingBlog ? 'Update' : 'Create'} Blog Post</>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Enhanced Loading State */}
        {isLoading ? (
          <div className="space-y-6">
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl mx-auto mb-4 flex items-center justify-center animate-pulse">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Loading your blog posts...</h3>
              <p className="text-gray-500 dark:text-gray-400">Please wait while we fetch your content</p>
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
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl mx-auto mb-6 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">No blog posts yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Start creating engaging content for your audience. Your first blog post is just a click away!
            </p>
            <Button 
              onClick={() => setIsCreateOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-0"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Post
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
                className={`group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-md w-full ${
                  blog.featured ? 'ring-2 ring-yellow-400 dark:ring-yellow-500' : ''
                }`}
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: 'fadeInUp 0.6s ease-out forwards'
                }}
              >
                <div className="relative">
                  {/* Cover Image - Always show container with image or placeholder */}
                  <div className="h-48 overflow-hidden relative">
                    {blog.cover_image ? (
                      <>
                        {/* Actual cover image */}
                        <img 
                          src={blog.cover_image} 
                          alt={blog.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            // If image fails to load, hide it and show placeholder
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const placeholder = target.nextElementSibling as HTMLElement;
                            if (placeholder) placeholder.style.display = 'flex';
                          }}
                        />
                        {/* Fallback placeholder (hidden by default) */}
                        <div 
                          className={`absolute inset-0 bg-gradient-to-br ${getDefaultCoverImage(blog.title, index).gradient} hidden items-center justify-center`}
                          style={{ display: 'none' }}
                        >
                          <div className="text-center text-white">
                            <div className="text-3xl font-bold mb-2">
                              {getDefaultCoverImage(blog.title, index).initials}
                            </div>
                            <div className="text-sm opacity-80">
                              {blog.title.length > 20 ? blog.title.substring(0, 20) + '...' : blog.title}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      /* Default placeholder when no image provided */
                      <div className={`w-full h-full bg-gradient-to-br ${getDefaultCoverImage(blog.title, index).gradient} flex items-center justify-center relative overflow-hidden`}>
                        {/* Subtle pattern overlay */}
                        <div className="absolute inset-0 opacity-10">
                          <svg className="w-full h-full" viewBox="0 0 100 100">
                            <defs>
                              <pattern id={`pattern-${blog.id}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                                <circle cx="10" cy="10" r="1" fill="white" opacity="0.3"/>
                              </pattern>
                            </defs>
                            <rect width="100" height="100" fill={`url(#pattern-${blog.id})`}/>
                          </svg>
                        </div>
                        
                        {/* Content */}
                        <div className="text-center text-white relative z-10">
                          <div className="text-4xl font-bold mb-3 drop-shadow-lg">
                            {getDefaultCoverImage(blog.title, index).initials}
                          </div>
                          <div className="text-sm opacity-90 font-medium px-4 leading-tight">
                            {blog.title.length > 25 ? blog.title.substring(0, 25) + '...' : blog.title}
                          </div>
                        </div>
                        
                        {/* Decorative elements */}
                        <div className="absolute top-4 right-4 w-8 h-8 border-2 border-white opacity-20 rounded-full"></div>
                        <div className="absolute bottom-4 left-4 w-6 h-6 border-2 border-white opacity-15 rounded-full"></div>
                      </div>
                    )}
                  </div>
                  
                  {/* Category Badge at bottom right of image */}
                  {blog.category && (
                    <div className="absolute bottom-4 right-4 z-20">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg border border-blue-400/40"
                        style={{
                          letterSpacing: '0.01em',
                          boxShadow: '0 2px 8px 0 rgba(59,130,246,0.10)',
                        }}
                      >
                        <svg className="w-3 h-3 mr-1 opacity-80" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        {blog.category.name}
                      </div>
                    </div>
                  )}
                  {blog.featured && (
                    <div className="absolute top-4 left-4 z-20">
                      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
                        <Star className="w-3 h-3 fill-current" />
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
                        className="bg-blue-500/90 hover:bg-blue-600 text-white backdrop-blur-sm border-0 shadow-lg rounded-xl"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => handleEdit(blog)}
                        className="bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 backdrop-blur-sm border-0 shadow-lg rounded-xl"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => deleteConfirmation.openConfirmDialog(blog)}
                        disabled={deleteMutation.isPending}
                        className="bg-red-500/90 hover:bg-red-600 backdrop-blur-sm border-0 shadow-lg rounded-xl"
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
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
                      {blog.title}
                    </CardTitle>
                    {/* Category Badge moved to image area */}
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
                        {blog.author?.name && (
                          <span className="ml-2 flex items-center gap-1 text-xs text-primary font-semibold">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            {blog.author.name}
                          </span>
                        )}
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
                    <div className="mb-1">
                      <p className="text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed text-base">
                        {blog.excerpt}
                      </p>
                    </div>
                  )}
                  
                  {blog.tags && blog.tags.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {blog.tags.slice(0, 4).map((tag) => (
                          <Badge 
                            key={tag.id} 
                            variant="secondary" 
                            className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300 border-blue-400/30 hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/50 dark:hover:to-purple-900/50 transition-colors rounded-full px-3 py-1.5 text-xs font-medium"
                          >
                            #{tag.name}
                          </Badge>
                        ))}
                        {blog.tags.length > 4 && (
                          <Badge variant="outline" className="rounded-full px-3 py-1.5 text-xs">
                            +{blog.tags.length - 4} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 mt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${blog.featured ? 'bg-yellow-400' : 'bg-gray-400'}`}></div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {blog.featured ? 'Featured Post' : 'Regular Post'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${blog.is_visible ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {blog.is_visible ? 'Visible' : 'Hidden'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">ID: {blog.id}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            </div>
            
            {/* Pagination - Show pagination info even with single page */}
            {typedBlogsData && typedBlogsData.total > 0 && (
              <div className="flex flex-col items-center mt-8 space-y-4">
                {/* Pagination Info */}
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {((typedBlogsData.page - 1) * typedBlogsData.page_size) + 1} to{' '}
                  {Math.min(typedBlogsData.page * typedBlogsData.page_size, typedBlogsData.total)} of{' '}
                  {typedBlogsData.total} results
                  {typedBlogsData.total_pages > 1 && (
                    <span> • Page {typedBlogsData.page} of {typedBlogsData.total_pages}</span>
                  )}
                </div>
                
                {/* Pagination Controls - Only show if more than one page */}
                {typedBlogsData.total_pages > 1 && (
                  <nav aria-label="Pagination" className="flex items-center gap-2">
                    <button
                      className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                      onClick={() => setPage(typedBlogsData.page - 1)}
                      disabled={typedBlogsData.page === 1}
                    >
                      ← Prev
                    </button>
                    {Array.from({ length: typedBlogsData.total_pages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
                          p === typedBlogsData.page
                            ? "bg-blue-600 dark:bg-blue-700 text-white shadow-lg transform scale-105"
                            : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                        onClick={() => setPage(p)}
                        aria-current={p === typedBlogsData.page ? "page" : undefined}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
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

      {/* Enhanced Edit Dialog */}
      <Dialog open={!!editingBlog} onOpenChange={(open) => {
        if (!open) {
          setEditingBlog(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto bg-white dark:bg-gray-900 border-0 shadow-2xl rounded-2xl">
          <DialogHeader className="pb-6 border-b border-gray-200 dark:border-gray-700">
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                <Edit className="w-4 h-4 text-white" />
              </div>
              Edit Blog Post
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-300 text-base mt-2">
              Update the blog post information below. All fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="edit-title" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Title
                </Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  className="h-12 text-base border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-orange-500 dark:focus:border-orange-400 transition-colors bg-gray-50 dark:bg-gray-800"
                  placeholder="Enter an engaging title for your blog post"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="edit-author_name" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Author
                </Label>
                <Input
                  id="edit-author_name"
                  value={formData.author_name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, author_name: e.target.value }))}
                  required
                  className="h-12 text-base border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-orange-500 dark:focus:border-orange-400 transition-colors bg-gray-50 dark:bg-gray-800"
                  placeholder="Enter the author's name"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="edit-reading_time" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Reading Time (minutes)
                </Label>
                <Input
                  id="edit-reading_time"
                  type="number"
                  value={formData.reading_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, reading_time: e.target.value }))}
                  className="h-12 text-base border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-orange-500 dark:focus:border-orange-400 transition-colors bg-gray-50 dark:bg-gray-800"
                  placeholder="Estimated reading time"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="edit-category" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Category <span className="text-red-500">*</span>
                </Label>
                <div className="flex flex-row gap-2 items-start w-full">
                  <CategoryDropdown
                    categories={categories}
                    selectedId={formData.category_id || ''}
                    onSelect={id => setFormData(f => ({ ...f, category_id: id }))}
                    onDelete={id => categoryDeleteConfirmation.openConfirmDialog(categories.find(cat => cat.id === id))}
                    disabled={addingCategory}
                  />
                  <Input
                    type="text"
                    placeholder="Add new category"
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="h-12 text-base border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-orange-500 dark:focus:border-orange-400 transition-colors bg-gray-50 dark:bg-gray-800 w-32"
                  />
                  <Button
                    type="button"
                    onClick={handleAddCategory}
                    disabled={addingCategory || !newCategory.trim()}
                    className="h-12 px-4 rounded-xl font-semibold shadow-sm transition-colors bg-orange-600 text-white hover:bg-orange-700 focus:ring-2 focus:ring-orange-400 border border-transparent"
                    style={{ minWidth: 60 }}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="edit-excerpt" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Excerpt
              </Label>
              <Textarea
                id="edit-excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                rows={3}
                placeholder="Brief description of the blog post that will appear in previews"
                className="text-base border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-orange-500 dark:focus:border-orange-400 transition-colors bg-gray-50 dark:bg-gray-800 resize-none"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="edit-content" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                Content
              </Label>
              <div className="border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800">
                <HtmlCodeEditor
                  value={formData.content}
                  onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                  placeholder="Enter your HTML content here... Use any HTML tags and styling."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <ImageInput
                  label="Cover Image"
                  currentUrl={formData.cover_image}
                  onUrlChange={(url) => setFormData(prev => ({ ...prev, cover_image: url }))}
                  onUploadSuccess={(url) => setFormData(prev => ({ ...prev, cover_image: url }))}
                  onDelete={() => setFormData(prev => ({ ...prev, cover_image: '' }))}
                  accept="image/*"
                  maxSize={5}
                  uploadType="cover"
                  placeholder="Enter cover image URL..."
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="edit-tag_names" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Tags (comma-separated)
                </Label>
                <Input
                  id="edit-tag_names"
                  value={formData.tag_names}
                  onChange={(e) => setFormData(prev => ({ ...prev, tag_names: e.target.value }))}
                  placeholder="react, javascript, tutorial, web development"
                  className="h-12 text-base border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-orange-500 dark:focus:border-orange-400 transition-colors bg-gray-50 dark:bg-gray-800"
                />
              </div>

              {/* Quick Links Section - Edit Dialog */}
              <QuickLinksEditor 
                quickLinks={formData.quick_links}
                onChange={(quickLinks: Array<{ title: string; url: string }>) => setFormData(prev => ({ ...prev, quick_links: quickLinks }))}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="edit-featured" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      Featured Post
                    </Label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Featured posts appear prominently on your blog</p>
                  </div>
                  <Switch
                    id="edit-featured"
                    checked={formData.featured}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: checked }))}
                    className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-orange-500 data-[state=checked]:to-red-600"
                  />
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="edit-is_visible" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Eye className="w-4 h-4 text-green-500" />
                      Visible to Public
                    </Label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Controls whether visitors can see this post</p>
                  </div>
                  <Switch
                    id="edit-is_visible"
                    checked={formData.is_visible}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_visible: checked }))}
                    className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-green-500 data-[state=checked]:to-emerald-600"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="pt-6 border-t border-gray-200 dark:border-gray-700 gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setEditingBlog(null);
                  resetForm();
                }}
                className="px-6 py-3 rounded-xl border-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateMutation.isPending} 
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-0"
              >
                {updateMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Updating...
                  </div>
                ) : (
                  <>Update Blog Post</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
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
        isLoading={deleteMutation.isPending}
      />
      <ConfirmDialog
        open={categoryDeleteConfirmation.confirmState.isOpen}
        onOpenChange={categoryDeleteConfirmation.closeConfirmDialog}
        title={categoryDeleteConfirmation.getTitle()}
        description={categoryDeleteConfirmation.getConfirmationText()}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={categoryDeleteConfirmation.confirmDelete}
        isLoading={categoryDeleteMutation.isPending}
      />
    </AdminLayout>
  );
}

// Quick Links Editor Component
interface QuickLink {
  title: string;
  url: string;
}

interface QuickLinksEditorProps {
  quickLinks: QuickLink[];
  onChange: (quickLinks: QuickLink[]) => void;
}

function QuickLinksEditor({ quickLinks, onChange }: QuickLinksEditorProps) {
  const addQuickLink = () => {
    onChange([...quickLinks, { title: '', url: '' }]);
  };

  const removeQuickLink = (index: number) => {
    onChange(quickLinks.filter((_, i) => i !== index));
  };

  const updateQuickLink = (index: number, field: keyof QuickLink, value: string) => {
    const updated = quickLinks.map((link, i) => 
      i === index ? { ...link, [field]: value } : link
    );
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <ExternalLink className="w-4 h-4 text-blue-500" />
          Quick Links
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addQuickLink}
          className="h-8 px-3 text-xs"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Link
        </Button>
      </div>
      
      {quickLinks.length === 0 ? (
        <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
          No quick links added. Click "Add Link" to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {quickLinks.map((link, index) => (
            <div key={index} className="flex gap-2 items-end">
              <div className="flex-1">
                <Input
                  placeholder="Link title"
                  value={link.title}
                  onChange={(e) => updateQuickLink(index, 'title', e.target.value)}
                  className="h-10 text-sm border-gray-200 dark:border-gray-700 rounded-lg focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>
              <div className="flex-1">
                <Input
                  placeholder="URL (e.g., #section-id or https://example.com)"
                  value={link.url}
                  onChange={(e) => updateQuickLink(index, 'url', e.target.value)}
                  className="h-10 text-sm border-gray-200 dark:border-gray-700 rounded-lg focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeQuickLink(index)}
                className="h-10 w-10 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Quick links will appear in the blog post sidebar for easy navigation. Use # for anchor links or full URLs for external links.
      </p>
    </div>
  );
}