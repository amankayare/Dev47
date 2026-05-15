import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HtmlCodeEditor } from '@/components/ui/html-code-editor';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Sparkles, Code2, Star, Eye, Plus, X, ExternalLink } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAIConvert } from '@/hooks/useAIConvert';
import { AIContentDraft } from '@/components/ui/AIContentDraft';
import { apiGet, apiPost, apiPut, apiDelete } from '@/utils/api';
import { CategoryDropdown } from '@/components/ui/CategoryDropdown';
import ImageInput from '@/components/ui/ImageInput';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useDeleteConfirmation } from '@/hooks/useDeleteConfirmation';

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
  category_id?: number;
  quick_links: Array<{ title: string; url: string }>;
}

export default function BlogEditor() {
  const { id } = useParams<{ id?: string }>();
  const isEditing = !!id;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
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

  const [activeTab, setActiveTab] = useState('draft');
  const [aiDraft, setAiDraft] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiPromptLoaded, setAiPromptLoaded] = useState(false);
  const { isConverting, error: aiError, convert, reset: resetAI } = useAIConvert();

  const [stagingId, setStagingId] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState('github');
  const [showPromoteConfirm, setShowPromoteConfirm] = useState(false);

  const [newCategory, setNewCategory] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [categories, setCategories] = useState<Array<{id: number; name: string}>>([]);

  // Fetch categories
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

  // Fetch blog data if editing
  const { data: blog, isLoading: isLoadingBlog } = useQuery({
    queryKey: ['/api/blogs', id],
    queryFn: () => apiGet(`/api/blogs/${id}`),
    enabled: isEditing,
  });

  useEffect(() => {
    if (blog && isEditing) {
      setFormData({
        title: blog.title,
        excerpt: blog.excerpt || '',
        content: blog.content,
        cover_image: blog.cover_image || '',
        reading_time: blog.reading_time?.toString() || '',
        featured: blog.featured,
        is_visible: blog.is_visible,
        tag_names: blog.tags?.map((tag: any) => tag.name).join(', ') || '',
        author_name: blog.author?.name || '',
        category_id: blog.category?.id,
        quick_links: blog.quick_links || []
      });
      setActiveTab('html');
    }
  }, [blog, isEditing]);

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
      toast({ title: 'Success', description: 'Blog created successfully.' });
      setLocation('/admin/blogs');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: BlogFormData }) => {
      const payload = {
        ...data,
        is_visible: typeof data.is_visible === 'boolean' ? data.is_visible : Boolean(data.is_visible),
        reading_time: data.reading_time ? parseInt(data.reading_time) : null,
        tags: data.tag_names.split(',').map(t => t.trim()).filter(Boolean),
        author: { name: data.author_name },
        quick_links: data.quick_links || []
      };
      return apiPut(`/api/blogs/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blogs/admin'] });
      toast({ title: 'Success', description: 'Blog updated successfully.' });
      setLocation('/admin/blogs');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stagingId) {
      setShowPromoteConfirm(true);
      return;
    }
    processSubmit(formData.cover_image);
  };

  const handleConfirmPromotion = async () => {
    setShowPromoteConfirm(false);
    if (!stagingId) return;

    try {
      toast({ title: 'Promoting...', description: `Uploading image to ${selectedProvider === 'github' ? 'GitHub' : 'Google Drive'}...` });
      const res = await apiPost(`/api/polyglot/confirm/${stagingId}`, { provider: selectedProvider });
      if (res.success && res.data) {
        setStagingId(null);
        processSubmit(res.data.publicUrl);
      }
    } catch (err: any) {
      toast({ title: 'Upload Failed', description: err.message, variant: 'destructive' });
    }
  };

  const processSubmit = (finalCoverImage: string) => {
    const payload = { ...formData, cover_image: finalCoverImage };
    if (isEditing && id) {
      updateMutation.mutate({ id: parseInt(id), data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleAIConvert = async (rawText: string, customPrompt?: string) => {
    const result = await convert(rawText, customPrompt);
    if (!result) return;

    setFormData(prev => ({
      ...prev,
      content: result.html_content,
      title: prev.title || result.suggested_title,
      excerpt: prev.excerpt || result.suggested_excerpt,
      reading_time: prev.reading_time || (
        result.reading_time_minutes > 0
          ? String(result.reading_time_minutes)
          : prev.reading_time
      ),
      quick_links: (prev.quick_links && prev.quick_links.length > 0) 
        ? prev.quick_links 
        : (result.suggested_quick_links || []),
      tag_names: (prev.tag_names && prev.tag_names.trim())
        ? prev.tag_names
        : (result.suggested_tags && result.suggested_tags.length > 0)
          ? result.suggested_tags.join(', ')
          : prev.tag_names
    }));
    setActiveTab('html');
    toast({
      title: '✨ AI Conversion Complete',
      description: 'HTML content has been generated. Review and edit before saving.',
    });
  };

  async function handleAddCategory() {
    if (!newCategory.trim()) return;
    setAddingCategory(true);
    try {
      const added = await apiPost('/api/blog-categories', { name: newCategory.trim() });
      setCategories(prev => [...prev, added]);
      setNewCategory('');
      setFormData(prev => ({ ...prev, category_id: added.id }));
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to add category.', variant: 'destructive' });
    } finally {
      setAddingCategory(false);
    }
  }

  const categoryDeleteMutation = useMutation({
    mutationFn: (catId: number) => apiDelete(`/api/blog-categories/${catId}`),
    onSuccess: (_, catId) => {
      setCategories(prev => prev.filter(cat => cat.id !== catId));
      if (formData.category_id === catId) {
        setFormData(prev => ({ ...prev, category_id: undefined }));
      }
      toast({ title: 'Success', description: 'Category deleted successfully.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete category.', variant: 'destructive' });
    },
  });

  const categoryDeleteConfirmation = useDeleteConfirmation({
    onDelete: (catId: number) => categoryDeleteMutation.mutate(catId),
    itemName: (cat: any) => cat.name,
    itemType: 'category',
  });

  if (isEditing && isLoadingBlog) {
    return (
      <AdminLayout title="Edit Blog Post">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-4 border-cornflower-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title={isEditing ? "Edit Blog Post" : "Create New Blog Post"} 
      backTo="/admin/blogs"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-black text-cornflower-950 dark:text-cornflower-50 uppercase tracking-tight">
              {isEditing ? 'Edit Transmission' : 'New Transmission'}
            </h1>
          </div>
        </div>

        <Card className="shadow-2xl border-0 bg-card/70 dark:bg-black/40 backdrop-blur-md rounded-3xl overflow-hidden">
          <CardHeader className="p-8 sm:p-10 border-b border-cornflower-200/50 dark:border-cornflower-500/10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-cornflower-500/10 dark:bg-cornflower-500/20 rounded-xl flex items-center justify-center shadow-inner">
                {isEditing ? <Save className="w-6 h-6 text-cornflower-600 dark:text-cornflower-300" /> : <Plus className="w-6 h-6 text-cornflower-600 dark:text-cornflower-300" />}
              </div>
              <div>
                <CardTitle className="text-3xl font-black text-cornflower-950 dark:text-cornflower-50">
                  {isEditing ? 'Sync Data' : 'Initialize Entry'}
                </CardTitle>
                <CardDescription className="text-cornflower-700/70 dark:text-cornflower-300/70 text-base font-medium mt-1">
                  {isEditing ? 'Update your digital log entry' : 'Create a new entry in the mainframe'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <form onSubmit={handleSubmit} className="p-8 sm:p-10 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Title */}
              <div className="space-y-3 lg:col-span-2">
                <Label htmlFor="title" className="text-xs font-black text-cornflower-500 dark:text-cornflower-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-cornflower-500 rounded-full animate-pulse"></span>
                  Title *
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  className="h-14 text-base border-2 border-cornflower-200/50 dark:border-cornflower-500/20 rounded-2xl focus:border-cornflower-500 focus:ring-0 transition-all bg-cornflower-50/30 dark:bg-black/30 backdrop-blur-md text-cornflower-950 dark:text-cornflower-50 placeholder:text-cornflower-300/50"
                  placeholder="Enter an engaging title..."
                />
              </div>
              
              {/* Reading Time */}
              <div className="space-y-3">
                <Label htmlFor="reading_time" className="text-xs font-black text-cornflower-500 dark:text-cornflower-400 uppercase tracking-[0.2em]">
                  Est. Minutes
                </Label>
                <Input
                  id="reading_time"
                  type="number"
                  value={formData.reading_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, reading_time: e.target.value }))}
                  className="h-14 text-base border-2 border-cornflower-200/50 dark:border-cornflower-500/20 rounded-2xl focus:border-cornflower-500 transition-all bg-cornflower-50/30 dark:bg-black/30 text-cornflower-950 dark:text-cornflower-50"
                  placeholder="Minutes"
                />
              </div>

              {/* Author */}
              <div className="space-y-3">
                <Label htmlFor="author_name" className="text-xs font-black text-cornflower-500 dark:text-cornflower-400 uppercase tracking-[0.2em]">
                  Author *
                </Label>
                <Input
                  id="author_name"
                  value={formData.author_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, author_name: e.target.value }))}
                  required
                  className="h-14 text-base border-2 border-cornflower-200/50 dark:border-cornflower-500/20 rounded-2xl focus:border-cornflower-500 transition-all bg-cornflower-50/30 dark:bg-black/30 text-cornflower-950 dark:text-cornflower-50"
                  placeholder="Author name"
                />
              </div>

              {/* Category */}
              <div className="space-y-3 lg:col-span-2">
                <Label htmlFor="category" className="text-xs font-black text-cornflower-500 dark:text-cornflower-400 uppercase tracking-[0.2em]">
                  Category *
                </Label>
                <div className="flex flex-row gap-3 items-start w-full">
                  <div className="flex-1">
                    <CategoryDropdown
                      categories={categories}
                      selectedId={formData.category_id || ''}
                      onSelect={catId => setFormData(f => ({ ...f, category_id: catId }))}
                      onDelete={catId => categoryDeleteConfirmation.openConfirmDialog(categories.find(cat => cat.id === catId))}
                      disabled={addingCategory}
                    />
                  </div>
                  <Input
                    type="text"
                    placeholder="New..."
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="h-14 text-base border-2 border-cornflower-200/50 dark:border-cornflower-500/20 rounded-2xl focus:border-cornflower-500 bg-cornflower-50/30 dark:bg-black/30 text-cornflower-950 dark:text-cornflower-50 w-32"
                  />
                  <Button
                    type="button"
                    onClick={handleAddCategory}
                    disabled={addingCategory || !newCategory.trim()}
                    className="h-14 px-6 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-cornflower-500 hover:bg-cornflower-600 text-white shadow-lg shadow-cornflower-500/20 transition-all"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>

            {/* Excerpt */}
            <div className="space-y-3">
              <Label htmlFor="excerpt" className="text-xs font-black text-cornflower-500 dark:text-cornflower-400 uppercase tracking-[0.2em]">
                Transmission Summary (Excerpt)
              </Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                rows={3}
                placeholder="Brief description of the blog post..."
                className="text-base border-2 border-cornflower-200/50 dark:border-cornflower-500/20 rounded-2xl focus:border-cornflower-500 transition-all bg-cornflower-50/30 dark:bg-black/30 text-cornflower-950 dark:text-cornflower-50 resize-none"
              />
            </div>

            {/* Content Section */}
            <div className="space-y-3">
              <Label className="text-xs font-black text-cornflower-500 dark:text-cornflower-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-cornflower-500 rounded-full"></span>
                Data Payload (Content) *
              </Label>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 rounded-2xl mb-4 bg-cornflower-50/50 dark:bg-black/30 p-1.5 h-auto">
                  <TabsTrigger
                    value="draft"
                    className="flex items-center gap-2 py-3 rounded-xl data-[state=active]:bg-background dark:data-[state=active]:bg-cornflower-500/20 data-[state=active]:shadow-md transition-all font-bold text-xs uppercase tracking-widest"
                  >
                    <Sparkles className="w-4 h-4 text-cornflower-500" />
                    AI Synthetic Draft
                  </TabsTrigger>
                  <TabsTrigger
                    value="html"
                    className="flex items-center gap-2 py-3 rounded-xl data-[state=active]:bg-background dark:data-[state=active]:bg-cornflower-500/20 data-[state=active]:shadow-md transition-all font-bold text-xs uppercase tracking-widest"
                  >
                    <Code2 className="w-4 h-4 text-cornflower-500" />
                    Direct HTML Link
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="draft" className="mt-0 focus-visible:outline-none">
                  <AIContentDraft
                    isConverting={isConverting}
                    onConvert={handleAIConvert}
                    draft={aiDraft}
                    onDraftChange={setAiDraft}
                    customPrompt={aiPrompt}
                    onCustomPromptChange={setAiPrompt}
                    promptLoaded={aiPromptLoaded}
                    onPromptLoaded={() => setAiPromptLoaded(true)}
                  />
                  {aiError && (
                    <p className="mt-3 text-[10px] text-red-500 font-black uppercase tracking-widest flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> {aiError}
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="html" className="mt-0 focus-visible:outline-none">
                  <div className="border-2 border-cornflower-200/50 dark:border-cornflower-500/10 rounded-2xl overflow-hidden bg-cornflower-50/30 dark:bg-black/30 backdrop-blur-md">
                    <HtmlCodeEditor
                      value={formData.content}
                      onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                      placeholder="Enter HTML payload here..."
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-3">
                <ImageInput
                  label="Visual Identification (Cover Image)"
                  currentUrl={formData.cover_image}
                  onUrlChange={(url) => setFormData(prev => ({ ...prev, cover_image: url }))}
                  onUploadSuccess={(url) => setFormData(prev => ({ ...prev, cover_image: url }))}
                  onStaged={(stgId, preview) => {
                    setStagingId(stgId);
                    setFormData(prev => ({ ...prev, cover_image: preview }));
                  }}
                  onDelete={() => {
                    setFormData(prev => ({ ...prev, cover_image: '' }));
                    setStagingId(null);
                  }}
                  onProviderChange={setSelectedProvider}
                  selectedProvider={selectedProvider}
                  accept="image/*"
                  maxSize={5}
                  uploadType="cover"
                  placeholder="Enter image URL..."
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="tag_names" className="text-xs font-black text-cornflower-500 dark:text-cornflower-400 uppercase tracking-[0.2em]">
                  Data Tags (comma-separated)
                </Label>
                <Input
                  id="tag_names"
                  value={formData.tag_names}
                  onChange={(e) => setFormData(prev => ({ ...prev, tag_names: e.target.value }))}
                  placeholder="e.g., tech, future, web3"
                  className="h-14 text-base border-2 border-cornflower-200/50 dark:border-cornflower-500/20 rounded-2xl focus:border-cornflower-500 transition-all bg-cornflower-50/30 dark:bg-black/30 text-cornflower-950 dark:text-cornflower-50"
                />
              </div>

              {/* Quick Links */}
              <QuickLinksEditor 
                quickLinks={formData.quick_links}
                onChange={(qLinks) => setFormData(prev => ({ ...prev, quick_links: qLinks }))}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-cornflower-50/50 dark:bg-cornflower-500/5 rounded-[2rem] p-6 border border-cornflower-200/50 dark:border-cornflower-500/10 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="featured" className="text-sm font-black text-cornflower-950 dark:text-cornflower-50 flex items-center gap-2 uppercase tracking-wider">
                      <Star className="w-4 h-4 text-cornflower-500" />
                      Priority Post
                    </Label>
                    <p className="text-xs text-cornflower-700/60 dark:text-cornflower-300/60 mt-1 font-bold">Featured posts appear at the top</p>
                  </div>
                  <Switch
                    id="featured"
                    checked={formData.featured}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: checked }))}
                    className="data-[state=checked]:bg-cornflower-500"
                  />
                </div>
              </div>

              <div className="bg-cornflower-50/50 dark:bg-cornflower-500/5 rounded-[2rem] p-6 border border-cornflower-200/50 dark:border-cornflower-500/10 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="is_visible" className="text-sm font-black text-cornflower-950 dark:text-cornflower-50 flex items-center gap-2 uppercase tracking-wider">
                      <Eye className="w-4 h-4 text-cornflower-400" />
                      Broadcast Status
                    </Label>
                    <p className="text-xs text-cornflower-700/60 dark:text-cornflower-300/60 mt-1 font-bold">Controls public visibility</p>
                  </div>
                  <Switch
                    id="is_visible"
                    checked={formData.is_visible}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_visible: checked }))}
                    className="data-[state=checked]:bg-cornflower-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-10 border-t border-cornflower-200/50 dark:border-cornflower-500/10 flex justify-end gap-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setLocation('/admin/blogs')}
                className="px-10 py-7 rounded-full border-2 border-cornflower-200 text-cornflower-700 hover:bg-cornflower-50 dark:border-cornflower-500/20 dark:text-cornflower-300 dark:hover:bg-cornflower-500/10 transition-all font-black uppercase tracking-widest text-[10px]"
              >
                Abort
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending} 
                className="bg-cornflower-600 hover:bg-cornflower-700 dark:bg-cornflower-500 dark:hover:bg-cornflower-600 text-white px-12 py-7 rounded-full font-black uppercase tracking-widest text-[10px] shadow-xl shadow-cornflower-500/20 transition-all duration-300 transform hover:scale-105 border-0"
              >
                {(createMutation.isPending || updateMutation.isPending) ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Executing...
                  </div>
                ) : (
                  <>{isEditing ? 'Sync Entry' : 'Broadcast Entry'}</>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      <ConfirmDialog
        open={showPromoteConfirm}
        onOpenChange={setShowPromoteConfirm}
        title="Confirm Final Image Storage"
        description={`Your cover image is currently staged in memory. Click "Confirm" to permanently save it to ${selectedProvider === 'github' ? 'GitHub' : 'Google Drive'}.`}
        confirmText="Confirm & Save"
        cancelText="Cancel"
        onConfirm={handleConfirmPromotion}
        isLoading={false}
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

function QuickLinksEditor({ quickLinks, onChange }: { quickLinks: Array<{ title: string; url: string }>, onChange: (links: Array<{ title: string; url: string }>) => void }) {
  const addQuickLink = () => {
    onChange([...quickLinks, { title: '', url: '' }]);
  };

  const removeQuickLink = (index: number) => {
    onChange(quickLinks.filter((_, i) => i !== index));
  };

  const updateQuickLink = (index: number, field: 'title' | 'url', value: string) => {
    const updated = quickLinks.map((link, i) => 
      i === index ? { ...link, [field]: value } : link
    );
    onChange(updated);
  };

  return (
    <div className="space-y-4 lg:col-span-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-black text-cornflower-900 dark:text-cornflower-50 flex items-center gap-2 uppercase tracking-widest">
          <ExternalLink className="w-4 h-4 text-cornflower-500" />
          Neural Shortcuts (Quick Links)
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addQuickLink}
          className="h-8 px-4 text-[10px] font-black uppercase tracking-widest rounded-full"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Node
        </Button>
      </div>
      
      {quickLinks.length === 0 ? (
        <div className="text-[10px] font-bold text-cornflower-700/40 dark:text-cornflower-300/40 text-center py-6 border-2 border-dashed border-cornflower-200/50 dark:border-cornflower-500/10 rounded-2xl uppercase tracking-widest">
          No shortcuts established in this node.
        </div>
      ) : (
        <div className="space-y-3">
          {quickLinks.map((link, index) => (
            <div key={index} className="flex gap-3 items-center">
              <div className="flex-1">
                <Input
                  placeholder="Node Title"
                  value={link.title}
                  onChange={(e) => updateQuickLink(index, 'title', e.target.value)}
                  className="h-12 text-sm border-2 border-cornflower-100/50 dark:border-cornflower-500/10 rounded-xl focus:border-cornflower-500 bg-card/50 dark:bg-black/20"
                />
              </div>
              <div className="flex-[2]">
                <Input
                  placeholder="Neural Address (URL)"
                  value={link.url}
                  onChange={(e) => updateQuickLink(index, 'url', e.target.value)}
                  className="h-12 text-sm border-2 border-cornflower-100/50 dark:border-cornflower-500/10 rounded-xl focus:border-cornflower-500 bg-card/50 dark:bg-black/20"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeQuickLink(index)}
                className="h-10 w-10 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 rounded-full"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
