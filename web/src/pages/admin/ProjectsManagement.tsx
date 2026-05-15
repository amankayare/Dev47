import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, ExternalLink, FolderOpen, Eye, EyeOff, Zap } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useDeleteConfirmation } from '@/hooks/useDeleteConfirmation';
import { 
  validateRequiredFields, 
  validateOrderField, 
  validateDateRange,
  validateJson,
  validatePositiveNumber,
  combineValidationResults,
  formatValidationErrors,
  type ValidationResult 
} from '@/utils/formValidation';
import { apiGet, apiPost, apiPut, apiDelete } from '@/utils/api';
import ImageInput from '@/components/ui/ImageInput';

interface Project {
  id: number;
  title: string;
  description: string;
  tech: string[];
  links: Array<{ name: string; url: string }>;
  image?: string;
  gallery?: string[];
  project_type?: string;
  start_date?: string;
  end_date?: string;
  role?: string;
  team_size?: number;
  categories?: string[];
  is_visible: boolean;
  is_featured: boolean;
  order: number;
  created_at?: string;
}

interface ProjectFormData {
  title: string;
  description: string;
  tech: string;
  project_links: Array<{ name: string; url: string }>;
  image: string;
  project_type: string;
  start_date: string;
  end_date: string;
  role: string;
  team_size: string;
  categories: string;
  is_visible: boolean;
  is_featured: boolean;
  order: string;
}

export default function ProjectsManagement() {
  // Modern UI Design Implementation - Updated for consistency with BlogsManagement
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<ProjectFormData>({
    title: '',
    description: '',
    tech: '',
    project_links: [],
    image: '',
    project_type: '',
    start_date: '',
    end_date: '',
    role: '',
    team_size: '',
    categories: '',
    is_visible: true,
    is_featured: false,
    order: '0'
  });

  // Delete confirmation setup
  const deleteConfirmation = useDeleteConfirmation({
    onDelete: (id: number) => deleteMutation.mutate(id),
    itemName: (project: Project) => project.title,
    itemType: 'project',
  });

  // Comprehensive form validation
  const validateProjectForm = (data: ProjectFormData): ValidationResult => {
    const requiredValidation = validateRequiredFields(data, ['title', 'description']);
    const orderValidation = validateOrderField(data.order, {
      currentId: editingProject?.id,
      existingItems: projects || []
    });
    const dateValidation = validateDateRange(data.start_date, data.end_date);
    const teamSizeValidation = data.team_size ? validatePositiveNumber(data.team_size, 'Team Size') : { isValid: true, errors: {} };
    
    return combineValidationResults(
      requiredValidation, 
      orderValidation, 
      dateValidation, 
      teamSizeValidation
    );
  };

  const { data: projects, isLoading } = useQuery({
    queryKey: ['/api/projects/admin'],
    queryFn: () => apiGet('/api/projects/admin'),
  });

  const createMutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      // Validate form before submission
      const validation = validateProjectForm(data);
      if (!validation.isValid) {
        setFormErrors(validation.errors);
        throw new Error(formatValidationErrors(validation.errors));
      }
      
      const payload = {
        ...data,
        tech: data.tech.split(',').map(t => t.trim()).filter(Boolean),
        links: data.project_links,
        team_size: data.team_size ? parseInt(data.team_size) : null,
        categories: data.categories.split(',').map(c => c.trim()).filter(Boolean),
        order: parseInt(data.order),
      };

      return apiPost('/api/projects', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects/admin'] });
      setIsCreateOpen(false);
      resetForm();
      setFormErrors({});
      toast({ title: 'Success', description: 'Project created successfully.' });
    },
    onError: (error) => {
      toast({ 
        title: 'Error', 
        description: error.message,
        variant: 'destructive'
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ProjectFormData }) => {
      const payload = {
        ...data,
        tech: data.tech.split(',').map(t => t.trim()).filter(Boolean),
        links: data.project_links,
        team_size: data.team_size ? parseInt(data.team_size) : null,
        categories: data.categories.split(',').map(c => c.trim()).filter(Boolean),
        order: parseInt(data.order),
      };

      return apiPut(`/api/projects/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects/admin'] });
      setIsCreateOpen(false);
      setEditingProject(null);
      resetForm();
      toast({ title: 'Success', description: 'Project updated successfully.' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects/admin'] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({ title: 'Success', description: 'Project deleted successfully.' });
    },
    onError: (error) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to delete project',
        variant: 'destructive'
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      tech: '',
      project_links: [],
      image: '',
      project_type: '',
      start_date: '',
      end_date: '',
      role: '',
      team_size: '',
      categories: '',
      is_visible: true,
      is_featured: false,
      order: '0'
    });
    setFormErrors({});
  };

  const handleEdit = (project: Project) => {
    setFormData({
      title: project.title,
      description: project.description,
      tech: project.tech?.join(', ') || '',
      project_links: project.links || [],
      image: project.image || '',
      project_type: project.project_type || '',
      start_date: project.start_date || '',
      end_date: project.end_date || '',
      role: project.role || '',
      team_size: project.team_size?.toString() || '',
      categories: project.categories?.join(', ') || '',
      is_visible: project.is_visible,
      is_featured: project.is_featured || false,
      order: project.order.toString()
    });
    setEditingProject(project);
    setIsCreateOpen(true); // Open the same dialog for editing
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProject) {
      updateMutation.mutate({ id: editingProject.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <AdminLayout title="Manage Projects">
      <div className="min-h-screen bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Enhanced Header Section - Cyberpunk cornflower */}
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-cornflower-50 via-cornflower-50/50 to-white dark:from-cornflower-950 dark:via-cornflower-900/40 dark:to-black/20 border border-cornflower-200/50 dark:border-cornflower-500/10 mb-10 shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-cornflower-500/5 to-transparent"></div>
            <div className="relative px-8 py-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center space-x-5">
                  <div className="p-4 bg-cornflower-500/10 dark:bg-cornflower-500/20 rounded-2xl backdrop-blur-md border border-cornflower-200/50 dark:border-cornflower-500/10 shadow-inner">
                    <FolderOpen className="h-10 w-10 text-cornflower-600 dark:text-cornflower-400" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-black text-cornflower-950 dark:text-cornflower-50 mb-1 tracking-tight uppercase">Project Archive</h1>
                    <p className="text-cornflower-700/60 dark:text-cornflower-300/60 font-bold text-lg">Managing digital assets across the nexus</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-5xl font-black text-cornflower-600 dark:text-cornflower-400 drop-shadow-[0_0_15px_rgba(100, 149, 237,0.3)]">{projects?.length || 0}</div>
                  <div className="text-cornflower-900/40 dark:text-cornflower-50/40 text-xs font-black uppercase tracking-widest mt-1">Total Repository Count</div>
                  <div className="flex gap-4 text-xs font-bold mt-2">
                    <span className="text-cornflower-500">{projects?.filter(p => p.is_visible).length || 0} DEPLOYED</span>
                    <span className="text-cornflower-900/30 dark:text-cornflower-50/30">{projects?.filter(p => !p.is_visible).length || 0} ENCRYPTED</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-center mb-8">
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-cornflower-600 hover:bg-cornflower-700 dark:bg-cornflower-500 dark:hover:bg-cornflower-600 text-white shadow-xl shadow-cornflower-500/20 transition-all duration-300 px-10 py-7 text-xs font-black uppercase tracking-[0.2em] rounded-full border-0 transform hover:scale-105" 
                  onClick={() => { resetForm(); setEditingProject(null); }}
                >
                  <Plus className="w-5 h-5 mr-3" />
                  Initialize New Artifact
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto bg-white dark:bg-black/90 backdrop-blur-2xl border border-cornflower-200 dark:border-cornflower-500/10 shadow-2xl rounded-[2.5rem] p-0 admin-theme-scope">
              <DialogHeader className="p-8 sm:p-10 border-b border-cornflower-200 dark:border-cornflower-500/10">
                <DialogTitle className="text-3xl font-black text-cornflower-950 dark:text-cornflower-50 flex items-center gap-4">
                  <div className="w-12 h-12 bg-cornflower-500/10 dark:bg-cornflower-500/20 rounded-2xl flex items-center justify-center shadow-inner">
                    <FolderOpen className="w-6 h-6 text-cornflower-600 dark:text-cornflower-300" />
                  </div>
                  {editingProject ? 'Modify Artifact' : 'Initialize Artifact'}
                </DialogTitle>
                <DialogDescription className="text-cornflower-700/70 dark:text-cornflower-300/70 text-base mt-3 font-medium">
                  Configure the project parameters in the digital registry.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="p-8 sm:p-10 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label htmlFor="title" className="text-xs font-black text-cornflower-500 dark:text-cornflower-400 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-cornflower-500 rounded-full animate-pulse"></span>
                      Artifact Title *
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      required
                      className="h-14 border-2 border-cornflower-200/50 dark:border-cornflower-500/20 rounded-2xl focus:border-cornflower-500 transition-all bg-cornflower-50/30 dark:bg-black/30 backdrop-blur-md text-cornflower-950 dark:text-cornflower-50"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="project_type" className="text-xs font-black text-cornflower-500 dark:text-cornflower-400 uppercase tracking-widest">Project Classification</Label>
                    <Input
                      id="project_type"
                      value={formData.project_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, project_type: e.target.value }))}
                      className="h-14 border-2 border-cornflower-200/50 dark:border-cornflower-500/20 rounded-2xl focus:border-cornflower-500 transition-all bg-cornflower-50/30 dark:bg-black/30 backdrop-blur-md text-cornflower-950 dark:text-cornflower-50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-semibold text-cornflower-900/60 dark:text-cornflower-100/60">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    required
                    className="border-cornflower-200/50 dark:border-cornflower-500/20 focus:border-cornflower-500 dark:focus:border-cornflower-400 rounded-lg resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="tech" className="text-sm font-semibold text-cornflower-900/60 dark:text-cornflower-100/60">Technologies (comma-separated)</Label>
                    <Input
                      id="tech"
                      value={formData.tech}
                      onChange={(e) => setFormData(prev => ({ ...prev, tech: e.target.value }))}
                      placeholder="React, TypeScript, Node.js"
                      className="border-cornflower-200/50 dark:border-cornflower-500/20 focus:border-cornflower-500 dark:focus:border-cornflower-400 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categories" className="text-sm font-semibold text-cornflower-900/60 dark:text-cornflower-100/60">Categories (comma-separated)</Label>
                    <Input
                      id="categories"
                      value={formData.categories}
                      onChange={(e) => setFormData(prev => ({ ...prev, categories: e.target.value }))}
                      placeholder="Web Development, Full Stack"
                      className="border-cornflower-200/50 dark:border-cornflower-500/20 focus:border-cornflower-500 dark:focus:border-cornflower-400 rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <ProjectLinksEditor 
                    projectLinks={formData.project_links}
                    onChange={(projectLinks: Array<{ name: string; url: string }>) => setFormData(prev => ({ ...prev, project_links: projectLinks }))}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="start_date" className="text-sm font-semibold text-cornflower-900/60 dark:text-cornflower-100/60">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                      className="border-cornflower-200/50 dark:border-cornflower-500/20 focus:border-cornflower-500 dark:focus:border-cornflower-400 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date" className="text-sm font-semibold text-cornflower-900/60 dark:text-cornflower-100/60">End Date</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                      className="border-cornflower-200/50 dark:border-cornflower-500/20 focus:border-cornflower-500 dark:focus:border-cornflower-400 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm font-semibold text-cornflower-900/60 dark:text-cornflower-100/60">Role</Label>
                    <Input
                      id="role"
                      value={formData.role}
                      onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                      className="border-cornflower-200/50 dark:border-cornflower-500/20 focus:border-cornflower-500 dark:focus:border-cornflower-400 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="team_size" className="text-sm font-semibold text-cornflower-900/60 dark:text-cornflower-100/60">Team Size</Label>
                    <Input
                      id="team_size"
                      type="number"
                      value={formData.team_size}
                      onChange={(e) => setFormData(prev => ({ ...prev, team_size: e.target.value }))}
                      className="border-cornflower-200/50 dark:border-cornflower-500/20 focus:border-cornflower-500 dark:focus:border-cornflower-400 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="order" className="text-sm font-semibold text-cornflower-900/60 dark:text-cornflower-100/60">Display Order</Label>
                    <Input
                      id="order"
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData(prev => ({ ...prev, order: e.target.value }))}
                      className="border-cornflower-200/50 dark:border-cornflower-500/20 focus:border-cornflower-500 dark:focus:border-cornflower-400 rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <ImageInput
                    label="Project Image"
                    currentUrl={formData.image}
                    onUrlChange={(url) => setFormData(prev => ({ ...prev, image: url }))}
                    onUploadSuccess={(url) => setFormData(prev => ({ ...prev, image: url }))}
                    onDelete={() => setFormData(prev => ({ ...prev, image: '' }))}
                    accept="image/*"
                    maxSize={5}
                    uploadType="project"
                    placeholder="Enter project image URL..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-4 p-6 bg-cornflower-50/50 dark:bg-cornflower-500/5 rounded-[2rem] border border-cornflower-200/50 dark:border-cornflower-500/10 backdrop-blur-sm">
                    <Switch
                      id="is_visible"
                      checked={formData.is_visible}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_visible: checked }))}
                      className="data-[state=checked]:bg-cornflower-500"
                    />
                    <Label htmlFor="is_visible" className="text-sm font-black text-cornflower-900 dark:text-cornflower-50 uppercase tracking-widest">Public Access</Label>
                  </div>
                  <div className="flex items-center space-x-4 p-6 bg-cornflower-900/5 dark:bg-cornflower-500/10 rounded-[2rem] border border-cornflower-200/50 dark:border-cornflower-500/10 backdrop-blur-sm">
                    <Switch
                      id="is_featured"
                      checked={formData.is_featured}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
                      className="data-[state=checked]:bg-cornflower-500"
                    />
                    <Label htmlFor="is_featured" className="text-sm font-black text-cornflower-900 dark:text-cornflower-50 uppercase tracking-widest">Priority Artifact</Label>
                  </div>
                </div>

                <DialogFooter className="pt-10 border-t border-cornflower-200/50 dark:border-cornflower-500/10 gap-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsCreateOpen(false);
                      setEditingProject(null);
                      resetForm();
                    }}
                    className="px-8 py-6 rounded-full border-2 border-cornflower-200 text-cornflower-700 hover:bg-cornflower-50 dark:border-cornflower-500/20 dark:text-cornflower-300 dark:hover:bg-cornflower-500/10 transition-all font-black uppercase tracking-widest text-xs"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending} 
                    className="bg-cornflower-600 hover:bg-cornflower-700 dark:bg-cornflower-500 dark:hover:bg-cornflower-600 text-white px-10 py-6 rounded-full font-black uppercase tracking-widest text-xs shadow-xl shadow-cornflower-500/20 transition-all duration-300 transform hover:scale-105 border-0"
                  >
                    {editingProject ? 'Update Core' : 'Initialize Artifact'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-cornflower-600 dark:border-cornflower-500 border-r-transparent border-b-cornflower-200 dark:border-b-cornflower-900 border-l-transparent mx-auto mb-6"></div>
              <p className="text-cornflower-900/60 dark:text-cornflower-50/60 font-black uppercase tracking-widest text-sm">Synchronizing data streams...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {projects?.map((project) => (
              <Card key={project.id} className="group hover:shadow-2xl transition-all duration-500 border-0 bg-card/70 dark:bg-black/40 backdrop-blur-md rounded-[2.5rem] overflow-hidden shadow-xl transform hover:-translate-y-2">
                <div className="p-5 sm:p-8 border-b border-cornflower-100/50 dark:border-cornflower-500/10">
                  <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-4 mb-3">
                        <h3 className="text-xl sm:text-2xl font-black text-cornflower-950 dark:text-cornflower-50 group-hover:text-cornflower-600 dark:group-hover:text-cornflower-400 transition-colors uppercase tracking-tight break-words">
                           {project.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <Badge 
                            variant={project.is_visible ? "default" : "secondary"}
                            className={`${
                              project.is_visible 
                                ? "bg-cornflower-500/10 text-cornflower-600 dark:bg-cornflower-500/20 dark:text-cornflower-300" 
                                : "bg-cornflower-900 dark:bg-black text-white"
                            } font-black text-[10px] uppercase tracking-widest rounded-full px-3 py-1 border-0`}
                          >
                            {project.is_visible ? (
                              <>
                                <Eye className="w-3 h-3 mr-1.5" />
                                Public
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3 mr-1.5" />
                                Private
                              </>
                            )}
                          </Badge>
                          {project.is_featured && (
                            <Badge 
                              variant="default"
                              className="bg-cornflower-600 text-white font-black text-[10px] uppercase tracking-widest rounded-full px-3 py-1 shadow-lg shadow-cornflower-500/30"
                            >
                              <Zap className="w-3 h-3 mr-1.5 fill-current" />
                              Priority
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-cornflower-500/60 dark:text-cornflower-400/60 mb-4 flex flex-wrap gap-y-2">
                        {project.project_type && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-cornflower-500/10 text-cornflower-600 dark:bg-cornflower-500/20 dark:text-cornflower-300 mr-3">
                            {project.project_type}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5 inline-flex">
                          <div className="w-1 h-1 bg-cornflower-400 rounded-full"></div>
                          SYNCED: {new Date(project.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-cornflower-700/70 dark:text-cornflower-300/70 text-sm font-medium leading-relaxed mb-6 line-clamp-3">
                        {project.description}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2.5">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEdit(project)}
                        className="w-10 h-10 p-0 rounded-full border-2 border-cornflower-200 text-cornflower-600 hover:bg-cornflower-50 dark:border-cornflower-500/20 dark:text-cornflower-400 dark:hover:bg-cornflower-500/10 transition-all duration-300"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => deleteConfirmation.openConfirmDialog(project)}
                        disabled={deleteMutation.isPending}
                        className="w-10 h-10 p-0 rounded-full bg-cornflower-950 text-white hover:bg-black transition-all duration-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  {project.tech && project.tech.length > 0 && (
                    <div>
                      <span className="text-[10px] font-black text-cornflower-950 dark:text-cornflower-50 uppercase tracking-[0.2em] mb-3 block">Digital Stack:</span>
                      <div className="flex flex-wrap gap-2">
                        {project.tech.map((tech, index) => (
                          <Badge key={index} variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-cornflower-500/5 dark:bg-cornflower-500/10 text-cornflower-600 dark:text-cornflower-300 border-cornflower-200/50 dark:border-cornflower-500/20 px-3 py-1 rounded-full">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {project.links && project.links.length > 0 && (
                    <div>
                      <span className="text-[10px] font-black text-cornflower-950 dark:text-cornflower-50 uppercase tracking-[0.2em] mb-3 block">External Nodes:</span>
                      <div className="flex flex-wrap gap-2">
                        {project.links.map((link, index) => (
                          <a key={index} href={link.url} target="_blank" rel="noopener noreferrer">
                            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider cursor-pointer bg-cornflower-600 text-white border-0 shadow-lg shadow-cornflower-500/20 hover:bg-cornflower-700 transition-all duration-300 px-4 py-1.5 rounded-full">
                              <ExternalLink className="w-3.5 h-3.5 mr-2" />
                              {link.name}
                            </Badge>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-cornflower-500/40 pt-6 border-t border-cornflower-100/30 dark:border-cornflower-500/10">
                    <span className="bg-cornflower-500/5 dark:bg-cornflower-500/10 px-3 py-1 rounded-full">ORDER_INDEX: {project.order}</span>
                    <div className="flex gap-6">
                      {project.role && <span className="flex items-center gap-1.5"><div className="w-1 h-1 bg-cornflower-400 rounded-full"></div> ROLE: {project.role}</span>}
                      {project.team_size && <span className="flex items-center gap-1.5"><div className="w-1 h-1 bg-cornflower-400 rounded-full"></div> UNIT: {project.team_size}</span>}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        </div>
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
    </AdminLayout>
  );
}

// Project Links Editor Component
interface ProjectLink {
  name: string;
  url: string;
}

interface ProjectLinksEditorProps {
  projectLinks: ProjectLink[];
  onChange: (projectLinks: ProjectLink[]) => void;
}

function ProjectLinksEditor({ projectLinks, onChange }: ProjectLinksEditorProps) {
  const addProjectLink = () => {
    onChange([...projectLinks, { name: '', url: '' }]);
  };

  const removeProjectLink = (index: number) => {
    onChange(projectLinks.filter((_, i) => i !== index));
  };

  const updateProjectLink = (index: number, field: keyof ProjectLink, value: string) => {
    const updated = projectLinks.map((link, i) => 
      i === index ? { ...link, [field]: value } : link
    );
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold text-cornflower-900/60 dark:text-cornflower-100/60 flex items-center gap-2">
          <ExternalLink className="w-4 h-4 text-blue-500" />
          Project Links
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addProjectLink}
          className="h-8 px-3 text-xs"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Link
        </Button>
      </div>
      
      {projectLinks.length === 0 ? (
        <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
          No project links added. Click "Add Link" to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {projectLinks.map((link, index) => (
            <div key={index} className="flex gap-2 items-end">
              <div className="flex-1">
                <Input
                  placeholder="Link name (e.g., GitHub, Live Demo)"
                  value={link.name}
                  onChange={(e) => updateProjectLink(index, 'name', e.target.value)}
                  className="h-10 text-sm border-gray-200 dark:border-gray-700 rounded-lg focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>
              <div className="flex-1">
                <Input
                  placeholder="URL (e.g., https://github.com/...)"
                  value={link.url}
                  onChange={(e) => updateProjectLink(index, 'url', e.target.value)}
                  className="h-10 text-sm border-gray-200 dark:border-gray-700 rounded-lg focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeProjectLink(index)}
                className="h-10 w-10 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Add links to project resources like GitHub repository, live demo, documentation, etc.
      </p>
    </div>
  );
}
