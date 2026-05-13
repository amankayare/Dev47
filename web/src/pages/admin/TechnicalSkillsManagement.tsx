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
import { Plus, Edit, Trash2, Code2, Eye, EyeOff } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useDeleteConfirmation } from '@/hooks/useDeleteConfirmation';
import { 
  validateRequiredFields, 
  validateOrderField, 
  combineValidationResults,
  formatValidationErrors,
  type ValidationResult 
} from '@/utils/formValidation';
import { apiGet, apiPost, apiPut, apiDelete } from '@/utils/api';

interface TechnicalSkill {
  id: number;
  title: string;
  skills?: string[];
  color?: string;
  icon?: string;
  order: number;
  is_visible: boolean;
  created_at: string;
}

interface TechnicalSkillFormData {
  title: string;
  skills: string;
  color: string;
  icon: string;
  order: string;
  is_visible: boolean;
}

export default function TechnicalSkillsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<TechnicalSkill | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<TechnicalSkillFormData>({
    title: '',
    skills: '',
    color: '',
    icon: '',
    order: '0',
    is_visible: true
  });

  // Delete confirmation setup  
  const deleteConfirmation = useDeleteConfirmation({
    onDelete: (id: number) => deleteMutation.mutate(id),
    itemName: (skill: TechnicalSkill) => skill.title,
    itemType: 'skill category',
  });

  // Comprehensive form validation
  const validateTechnicalSkillForm = (data: TechnicalSkillFormData): ValidationResult => {
    const requiredValidation = validateRequiredFields(data, ['title']);
    const orderValidation = validateOrderField(data.order, {
      currentId: editingSkill?.id,
      existingItems: technicalSkills || []
    });
    
    return combineValidationResults(requiredValidation, orderValidation);
  };

  const { data: technicalSkills, isLoading } = useQuery({
    queryKey: ['/api/technical-skills'],
    queryFn: () => apiGet('/api/technical-skills/?admin=true'),
  });

  const createMutation = useMutation({
    mutationFn: async (data: TechnicalSkillFormData) => {
      // Validate form before submission
      const validation = validateTechnicalSkillForm(data);
      if (!validation.isValid) {
        setFormErrors(validation.errors);
        throw new Error(formatValidationErrors(validation.errors));
      }
      
      const payload = {
        ...data,
        skills: data.skills.split(',').map(s => s.trim()).filter(Boolean),
        order: parseInt(data.order),
      };

      return apiPost('/api/technical-skills/', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/technical-skills'] });
      setIsCreateOpen(false);
      resetForm();
      setFormErrors({});
      toast({ title: 'Success', description: 'Technical skill created successfully.' });
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
    mutationFn: async ({ id, data }: { id: number; data: TechnicalSkillFormData }) => {
      const payload = {
        ...data,
        skills: data.skills.split(',').map(s => s.trim()).filter(Boolean),
        order: parseInt(data.order),
      };

      return apiPut(`/api/technical-skills/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/technical-skills'] });
      setEditingSkill(null);
      resetForm();
      toast({ title: 'Success', description: 'Technical skill updated successfully.' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/technical-skills/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/technical-skills'] });
      toast({ title: 'Success', description: 'Technical skill deleted successfully.' });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      skills: '',
      color: '',
      icon: '',
      order: '0',
      is_visible: true
    });
    setFormErrors({});
  };

  const handleEdit = (skill: TechnicalSkill) => {
    setFormData({
      title: skill.title,
      skills: skill.skills?.join(', ') || '',
      color: skill.color || '',
      icon: skill.icon || '',
      order: skill.order.toString(),
      is_visible: skill.is_visible
    });
    setEditingSkill(skill);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSkill) {
      updateMutation.mutate({ id: editingSkill.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <AdminLayout title="Manage Technical Skills">
      <div className="min-h-screen bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Enhanced Header Section - Cyberpunk Indigo */}
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-indigo-50 via-indigo-50/50 to-white dark:from-indigo-950 dark:via-indigo-900/40 dark:to-black/20 border border-indigo-200/50 dark:border-indigo-500/10 mb-10 shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent"></div>
            <div className="relative px-8 py-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center space-x-5">
                  <div className="p-4 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-2xl backdrop-blur-md border border-indigo-200/50 dark:border-indigo-500/10 shadow-inner">
                    <Code2 className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-black text-indigo-950 dark:text-indigo-50 mb-1 tracking-tight uppercase">Tech Matrix</h1>
                    <p className="text-indigo-700/60 dark:text-indigo-300/60 font-bold text-lg">Optimizing the digital skill hierarchy</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-5xl font-black text-indigo-600 dark:text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.3)]">{technicalSkills?.length || 0}</div>
                  <div className="text-indigo-900/40 dark:text-indigo-50/40 text-xs font-black uppercase tracking-widest mt-1">Core Skill Modules</div>
                  <div className="flex gap-4 text-xs font-bold mt-2">
                    <span className="text-indigo-500">{technicalSkills?.filter(s => s.is_visible).length || 0} ACTIVE</span>
                    <span className="text-indigo-900/30 dark:text-indigo-50/30">{technicalSkills?.filter(s => !s.is_visible).length || 0} DORMANT</span>
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
                  className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 transition-all duration-300 px-10 py-7 text-xs font-black uppercase tracking-[0.2em] rounded-full border-0 transform hover:scale-105" 
                  onClick={() => { resetForm(); setEditingSkill(null); }}
                >
                  <Plus className="w-5 h-5 mr-3" />
                  Initialize Skill Module
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingSkill ? 'Edit Technical Skill' : 'Create New Technical Skill'}</DialogTitle>
                <DialogDescription>
                  Fill out the form below to {editingSkill ? 'update' : 'create'} a technical skill category.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Category Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      required
                      placeholder="e.g., Frontend Development, DevOps"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="icon">Icon Name</Label>
                    <Input
                      id="icon"
                      value={formData.icon}
                      onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                      placeholder="e.g., Code, Database, Cloud"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skills">Skills (comma-separated) *</Label>
                  <Textarea
                    id="skills"
                    value={formData.skills}
                    onChange={(e) => setFormData(prev => ({ ...prev, skills: e.target.value }))}
                    rows={3}
                    required
                    placeholder="React, Vue.js, Angular, TypeScript, JavaScript, HTML5, CSS3"
                  />
                  <p className="text-xs text-muted-foreground">
                    List the specific skills or technologies for this category, separated by commas.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="color">Color/Gradient</Label>
                    <Input
                      id="color"
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      placeholder="e.g., from-blue-500 to-purple-600"
                    />
                    <p className="text-xs text-muted-foreground">
                      Tailwind CSS gradient or color classes for the card styling.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="order">Display Order</Label>
                    <Input
                      id="order"
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData(prev => ({ ...prev, order: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_visible"
                    checked={formData.is_visible}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_visible: checked }))}
                  />
                  <Label htmlFor="is_visible">Visible on portfolio</Label>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => {
                    setIsCreateOpen(false);
                    setEditingSkill(null);
                    resetForm();
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="text-white">
                    {editingSkill ? 'Update' : 'Create'} Skill Category
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600 dark:border-indigo-500 border-r-transparent border-b-indigo-200 dark:border-b-indigo-900 border-l-transparent mx-auto mb-6"></div>
              <p className="text-indigo-900/60 dark:text-indigo-50/60 font-black uppercase tracking-widest text-sm">Syncing matrix...</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
            {technicalSkills?.map((skill) => (
              <Card key={skill.id} className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white/70 dark:bg-black/40 backdrop-blur-md rounded-[2.5rem] overflow-hidden shadow-xl transform hover:-translate-y-2">
                <CardHeader className="p-8 border-b border-indigo-100/50 dark:border-indigo-500/10">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-4 text-indigo-950 dark:text-indigo-50 mb-3 font-black uppercase tracking-tight">
                        <div className="bg-indigo-500/10 dark:bg-indigo-500/20 p-2.5 rounded-2xl shadow-inner">
                          <Code2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        {skill.title}
                      </CardTitle>
                      <div className="flex items-center gap-3 mb-3">
                        <Badge 
                          variant={skill.is_visible ? "default" : "secondary"} 
                          className={`${
                            skill.is_visible 
                              ? "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300" 
                              : "bg-indigo-900 dark:bg-black text-white"
                          } font-black text-[10px] uppercase tracking-widest rounded-full px-3 py-1 border-0`}
                        >
                          {skill.is_visible ? (
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
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500/40">NODE_ORDER: {skill.order}</span>
                      </div>
                    </div>
                    <div className="flex gap-2.5 ml-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEdit(skill)}
                        className="w-10 h-10 p-0 rounded-full border-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-500/20 dark:text-indigo-400 dark:hover:bg-indigo-500/10 transition-all duration-300"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => deleteConfirmation.openConfirmDialog(skill)}
                        disabled={deleteMutation.isPending}
                        className="w-10 h-10 p-0 rounded-full bg-indigo-950 text-white hover:bg-black transition-all duration-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  {skill.skills && skill.skills.length > 0 && (
                    <div className="mb-6">
                      <span className="text-[10px] font-black text-indigo-950 dark:text-indigo-50 uppercase tracking-[0.2em] mb-4 block">Sub-Routine Tags:</span>
                      <div className="flex flex-wrap gap-2">
                        {skill.skills.map((skillName, index) => (
                          <Badge 
                            key={index} 
                            variant="outline" 
                            className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/5 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border-indigo-200/50 dark:border-indigo-500/20 px-3 py-1 rounded-full transition-all duration-300 hover:bg-indigo-500/10"
                          >
                            {skillName}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
 
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-indigo-500/40 pt-6 border-t border-indigo-100/30 dark:border-indigo-500/10">
                    <span className="flex items-center gap-1.5"><div className="w-1 h-1 bg-indigo-400 rounded-full"></div> INITIALIZED: {new Date(skill.created_at).toLocaleDateString()}</span>
                    {skill.updated_at && skill.updated_at !== skill.created_at && (
                      <span className="flex items-center gap-1.5"><div className="w-1 h-1 bg-indigo-400 rounded-full"></div> UPDATED: {new Date(skill.updated_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        </div>
      </div>

      <Dialog open={!!editingSkill} onOpenChange={(open) => {
        if (!open) {
          setEditingSkill(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Technical Skill</DialogTitle>
            <DialogDescription>
              Update the technical skill category information below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Category Title *</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  placeholder="e.g., Frontend Development, DevOps"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-icon">Icon Name</Label>
                <Input
                  id="edit-icon"
                  value={formData.icon}
                  onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                  placeholder="e.g., Code, Database, Cloud"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-skills">Skills (comma-separated) *</Label>
              <Textarea
                id="edit-skills"
                value={formData.skills}
                onChange={(e) => setFormData(prev => ({ ...prev, skills: e.target.value }))}
                rows={3}
                required
                placeholder="React, Vue.js, Angular, TypeScript, JavaScript, HTML5, CSS3"
              />
              <p className="text-xs text-muted-foreground">
                List the specific skills or technologies for this category, separated by commas.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-color">Color/Gradient</Label>
                <Input
                  id="edit-color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  placeholder="e.g., from-blue-500 to-purple-600"
                />
                <p className="text-xs text-muted-foreground">
                  Tailwind CSS gradient or color classes for the card styling.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-order">Display Order</Label>
                <Input
                  id="edit-order"
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData(prev => ({ ...prev, order: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit-is_visible"
                checked={formData.is_visible}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_visible: checked }))}
              />
              <Label htmlFor="edit-is_visible">Visible on portfolio</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setEditingSkill(null);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending} className="text-white">
                Update Skill Category
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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