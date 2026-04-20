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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Enhanced Header Section */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-700 via-slate-800 to-gray-900 dark:from-gray-800 dark:via-gray-900 dark:to-black mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent"></div>
            <div className="relative px-8 py-12">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm border border-white/10">
                    <FolderOpen className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-2">Project Management</h1>
                    <p className="text-gray-300 text-lg">Showcase your portfolio projects and manage your work effectively</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">{projects?.length || 0}</div>
                  <div className="text-gray-300 text-sm">Total Projects</div>
                  <div className="text-gray-400 text-sm mt-1">
                    {projects?.filter(p => p.is_visible).length || 0} visible, {" "}
                    {projects?.filter(p => !p.is_visible).length || 0} hidden
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
                  className="bg-gradient-to-r from-slate-700 to-gray-800 hover:from-slate-800 hover:to-gray-900 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-3 text-lg font-semibold rounded-xl border-0 transform hover:scale-105" 
                  onClick={() => { resetForm(); setEditingProject(null); }}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add New Project
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-0 shadow-2xl">
              <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-gray-800 bg-clip-text text-transparent">
                  {editingProject ? 'Edit Project' : 'Create New Project'}
                </DialogTitle>
                <DialogDescription className="text-gray-600 dark:text-gray-400">
                  Fill out the form below to {editingProject ? 'update' : 'create'} a project.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6 p-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      required
                      className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project_type" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Project Type</Label>
                    <Input
                      id="project_type"
                      value={formData.project_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, project_type: e.target.value }))}
                      className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    required
                    className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 rounded-lg resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="tech" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Technologies (comma-separated)</Label>
                    <Input
                      id="tech"
                      value={formData.tech}
                      onChange={(e) => setFormData(prev => ({ ...prev, tech: e.target.value }))}
                      placeholder="React, TypeScript, Node.js"
                      className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categories" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Categories (comma-separated)</Label>
                    <Input
                      id="categories"
                      value={formData.categories}
                      onChange={(e) => setFormData(prev => ({ ...prev, categories: e.target.value }))}
                      placeholder="Web Development, Full Stack"
                      className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 rounded-lg"
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
                    <Label htmlFor="start_date" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                      className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date" className="text-sm font-semibold text-gray-700 dark:text-gray-300">End Date</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                      className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Role</Label>
                    <Input
                      id="role"
                      value={formData.role}
                      onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                      className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="team_size" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Team Size</Label>
                    <Input
                      id="team_size"
                      type="number"
                      value={formData.team_size}
                      onChange={(e) => setFormData(prev => ({ ...prev, team_size: e.target.value }))}
                      className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="order" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Display Order</Label>
                    <Input
                      id="order"
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData(prev => ({ ...prev, order: e.target.value }))}
                      className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 rounded-lg"
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Switch
                      id="is_visible"
                      checked={formData.is_visible}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_visible: checked }))}
                    />
                    <Label htmlFor="is_visible" className="text-sm font-medium text-gray-700 dark:text-gray-300">Visible on portfolio</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Switch
                      id="is_featured"
                      checked={formData.is_featured}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
                    />
                    <Label htmlFor="is_featured" className="text-sm font-medium text-blue-700 dark:text-blue-300">Featured project</Label>
                  </div>
                </div>

                <DialogFooter className="border-t border-gray-200 dark:border-gray-700 pt-6 gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsCreateOpen(false);
                      setEditingProject(null);
                      resetForm();
                    }}
                    className="px-6 py-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending} 
                    className="px-6 py-2 bg-gradient-to-r from-slate-700 to-gray-800 hover:from-slate-800 hover:to-gray-900 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                  >
                    {editingProject ? 'Update' : 'Create'} Project
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading projects...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {projects?.map((project) => (
              <Card key={project.id} className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 transform hover:-translate-y-1">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {project.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={project.is_visible ? "default" : "secondary"}
                            className={`${
                              project.is_visible 
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" 
                                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                            } font-medium`}
                          >
                            {project.is_visible ? (
                              <>
                                <Eye className="w-3 h-3 mr-1" />
                                Visible
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3 mr-1" />
                                Hidden
                              </>
                            )}
                          </Badge>
                          {project.is_featured && (
                            <Badge 
                              variant="default"
                              className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 font-medium pulse"
                            >
                              <Zap className="w-3 h-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {project.project_type && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 mr-2">
                            {project.project_type}
                          </span>
                        )}
                        <span>Created: {new Date(project.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-4">
                        {project.description}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEdit(project)}
                        className="hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900/50 transition-all duration-200"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => deleteConfirmation.openConfirmDialog(project)}
                        disabled={deleteMutation.isPending}
                        className="hover:bg-red-600 transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  {project.tech && project.tech.length > 0 && (
                    <div>
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Technologies:</span>
                      <div className="flex flex-wrap gap-2">
                        {project.tech.map((tech, index) => (
                          <Badge key={index} variant="outline" className="text-xs bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {project.links && project.links.length > 0 && (
                    <div>
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Links:</span>
                      <div className="flex flex-wrap gap-2">
                        {project.links.map((link, index) => (
                          <a key={index} href={link.url} target="_blank" rel="noopener noreferrer">
                            <Badge variant="outline" className="text-xs cursor-pointer hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900/50 transition-all duration-200">
                              <ExternalLink className="w-3 h-3 mr-1" />
                              {link.name}
                            </Badge>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">Order: {project.order}</span>
                    <div className="flex gap-4">
                      {project.role && <span>Role: {project.role}</span>}
                      {project.team_size && <span>Team: {project.team_size}</span>}
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
        <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
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