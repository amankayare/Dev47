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
          
          {/* Enhanced Header Section */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-700 via-slate-800 to-gray-900 dark:from-slate-800 dark:via-slate-900 dark:to-gray-950 mb-8 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent"></div>
            <div className="relative px-8 py-12">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/10 dark:bg-white/5 rounded-lg backdrop-blur-sm border border-white/10 dark:border-white/5">
                    <Code2 className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-2">Technical Skills Management</h1>
                    <p className="text-gray-300 dark:text-gray-200 text-lg">Manage your technical skills and expertise areas</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">{technicalSkills?.length || 0}</div>
                  <div className="text-gray-300 dark:text-gray-200 text-sm">Total Skill Categories</div>
                  <div className="text-gray-400 dark:text-gray-300 text-sm mt-1">
                    {technicalSkills?.filter(s => s.is_visible).length || 0} visible, {" "}
                    {technicalSkills?.filter(s => !s.is_visible).length || 0} hidden
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
                  className="bg-gradient-to-r from-slate-700 to-gray-800 hover:from-slate-800 hover:to-gray-900 dark:from-slate-600 dark:to-gray-700 dark:hover:from-slate-700 dark:hover:to-gray-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-3 text-lg font-semibold rounded-xl border-0 transform hover:scale-105" 
                  onClick={() => { resetForm(); setEditingSkill(null); }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Skill Category
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
          <div className="flex justify-center items-center py-12">
            <div className="text-slate-600 dark:text-slate-300">Loading technical skills...</div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {technicalSkills?.map((skill) => (
              <Card key={skill.id} className="shadow-lg border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <CardHeader className="bg-gradient-to-r from-gray-50 via-slate-50 to-gray-100 dark:from-gray-700 dark:via-slate-700 dark:to-gray-600 border-b border-gray-200 dark:border-gray-600">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100 mb-2">
                        <div className="bg-slate-200 dark:bg-slate-600 p-1.5 rounded-lg">
                          <Code2 className="w-4 h-4 text-slate-600 dark:text-slate-200" />
                        </div>
                        {skill.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={skill.is_visible ? "default" : "secondary"} className="text-xs">
                          {skill.is_visible ? "Visible" : "Hidden"}
                        </Badge>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Order: {skill.order}</span>
                      </div>
                      <CardDescription className="text-slate-600 dark:text-slate-300 text-sm">
                        {skill.icon && `Icon: ${skill.icon} • `}
                        {skill.skills?.length || 0} skills
                        {skill.color && ` • ${skill.color}`}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEdit(skill)}
                        className="h-8 w-8 p-0 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => deleteConfirmation.openConfirmDialog(skill)}
                        disabled={deleteMutation.isPending}
                        className="h-8 w-8 p-0 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 bg-white/80 dark:bg-gray-800/80">
                  {skill.skills && skill.skills.length > 0 && (
                    <div className="mb-4">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2 block">Skills & Technologies:</span>
                      <div className="flex flex-wrap gap-2">
                        {skill.skills.map((skillName, index) => (
                          <Badge 
                            key={index} 
                            variant="outline" 
                            className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                          >
                            {skillName}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-200 dark:border-slate-600">
                    <span>Created: {new Date(skill.created_at).toLocaleDateString()}</span>
                    {skill.updated_at && skill.updated_at !== skill.created_at && (
                      <span>Updated: {new Date(skill.updated_at).toLocaleDateString()}</span>
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