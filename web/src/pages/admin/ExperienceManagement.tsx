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
import { Plus, Edit, Trash2, Briefcase, Eye, EyeOff } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useDeleteConfirmation } from '@/hooks/useDeleteConfirmation';
import { 
  validateRequiredFields, 
  validateOrderField, 
  validateDateRange,
  combineValidationResults,
  formatValidationErrors,
  type ValidationResult 
} from '@/utils/formValidation';
import { apiGet, apiPost, apiPut, apiDelete } from '@/utils/api';

// Responsibilities Editor Component
interface ResponsibilitiesEditorProps {
  responsibilities: string[];
  onChange: (responsibilities: string[]) => void;
}

function ResponsibilitiesEditor({ responsibilities, onChange }: ResponsibilitiesEditorProps) {
  // Ensure there's always at least one empty field
  const displayedResponsibilities = responsibilities.length === 0 ? [''] : responsibilities;

  const addResponsibility = () => {
    onChange([...displayedResponsibilities, '']);
  };

  const removeResponsibility = (index: number) => {
    const filtered = displayedResponsibilities.filter((_, i) => i !== index);
    // Ensure there's always at least one field, even if empty
    onChange(filtered.length === 0 ? [''] : filtered);
  };

  const updateResponsibility = (index: number, value: string) => {
    const updated = [...displayedResponsibilities];
    updated[index] = value;
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
        Responsibilities
      </Label>
      
      <div className="space-y-3">
        {displayedResponsibilities.map((responsibility, index) => (
          <div key={index} className="flex gap-2 items-start">
            <Input
              value={responsibility}
              onChange={(e) => updateResponsibility(index, e.target.value)}
              placeholder="e.g., Led development team of 5 engineers"
              className="flex-1 h-10 text-base border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-slate-500 dark:focus:border-slate-400 transition-colors bg-slate-50 dark:bg-slate-800"
            />
            {displayedResponsibilities.length > 1 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeResponsibility(index)}
                className="h-10 px-3 border-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 hover:border-red-300 dark:hover:border-red-700 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
        
        <Button
          type="button"
          variant="outline"
          onClick={addResponsibility}
          className="w-full h-10 border-2 border-dashed border-cornflower-200/50 dark:border-cornflower-500/20 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-500 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Responsibility
        </Button>
      </div>
    </div>
  );
}

// Key Achievements Editor Component
interface AchievementsEditorProps {
  achievements: string[];
  onChange: (achievements: string[]) => void;
}

function AchievementsEditor({ achievements, onChange }: AchievementsEditorProps) {
  // Ensure there's always at least one empty field
  const displayedAchievements = achievements.length === 0 ? [''] : achievements;

  const addAchievement = () => {
    onChange([...displayedAchievements, '']);
  };

  const removeAchievement = (index: number) => {
    const filtered = displayedAchievements.filter((_, i) => i !== index);
    // Ensure there's always at least one field, even if empty
    onChange(filtered.length === 0 ? [''] : filtered);
  };

  const updateAchievement = (index: number, value: string) => {
    const updated = [...displayedAchievements];
    updated[index] = value;
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
        Key Achievements
      </Label>
      
      <div className="space-y-3">
        {displayedAchievements.map((achievement, index) => (
          <div key={index} className="flex gap-2 items-start">
            <Input
              value={achievement}
              onChange={(e) => updateAchievement(index, e.target.value)}
              placeholder="e.g., Delivered 15+ projects on time and under budget"
              className="flex-1 h-10 text-base border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-slate-500 dark:focus:border-slate-400 transition-colors bg-slate-50 dark:bg-slate-800"
            />
            {displayedAchievements.length > 1 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeAchievement(index)}
                className="h-10 px-3 border-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 hover:border-red-300 dark:hover:border-red-700 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
        
        <Button
          type="button"
          variant="outline"
          onClick={addAchievement}
          className="w-full h-10 border-2 border-dashed border-cornflower-200/50 dark:border-cornflower-500/20 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-500 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Achievement
        </Button>
      </div>
    </div>
  );
}

interface Experience {
  id: number;
  title: string;
  company: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  is_current: boolean;
  duration?: string;
  responsibilities?: string[];
  achievements?: string[];
  technologies?: string[];
  color?: string;
  order: number;
  is_visible: boolean;
  created_at: string;
}

interface ExperienceFormData {
  title: string;
  company: string;
  location: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  duration: string;
  responsibilities: string[];
  achievements: string[];
  technologies: string;
  color: string;
  order: string;
  is_visible: boolean;
}

export default function ExperienceManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<ExperienceFormData>({
    title: '',
    company: '',
    location: '',
    start_date: '',
    end_date: '',
    is_current: false,
    duration: '',
    responsibilities: [],
    achievements: [],
    technologies: '',
    color: '',
    order: '0',
    is_visible: true
  });

  // Delete confirmation setup
  const deleteConfirmation = useDeleteConfirmation({
    onDelete: (id: number) => deleteMutation.mutate(id),
    itemName: (experience: Experience) => `${experience.title} at ${experience.company}`,
    itemType: 'experience',
  });

  const { data: experiences, isLoading } = useQuery<Experience[]>({
    queryKey: ['/api/experiences'],
    queryFn: () => apiGet('/api/experiences/?admin=true'),
  });

  // Comprehensive form validation
  const validateExperienceForm = (data: ExperienceFormData): ValidationResult => {
    const requiredValidation = validateRequiredFields(data, ['title', 'company']);
    const orderValidation = validateOrderField(data.order, {
      currentId: editingExperience?.id,
      existingItems: experiences || []
    });
    
    // Custom validation for end_date based on is_current status
    let dateValidation: ValidationResult;
    if (!data.is_current && !data.end_date) {
      dateValidation = {
        isValid: false,
        errors: { end_date: 'End date is required when position is not current' }
      };
    } else {
      dateValidation = validateDateRange(data.start_date, data.end_date || '');
    }
    
    return combineValidationResults(requiredValidation, orderValidation, dateValidation);
  };

  const createMutation = useMutation({
    mutationFn: async (data: ExperienceFormData) => {
      // Validate form before submission
      const validation = validateExperienceForm(data);
      if (!validation.isValid) {
        setFormErrors(validation.errors);
        throw new Error(formatValidationErrors(validation.errors));
      }
      
      const payload = {
        ...data,
        responsibilities: data.responsibilities.filter(r => r.trim() !== ''),
        achievements: data.achievements.filter(a => a.trim() !== ''),
        technologies: data.technologies.split(',').map(t => t.trim()).filter(Boolean),
        order: parseInt(data.order),
        // Ensure empty dates are sent as null instead of empty strings
        start_date: data.start_date || null,
        end_date: data.end_date || null,
      };

      return apiPost('/api/experiences/', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/experiences'] });
      setIsCreateOpen(false);
      resetForm();
      setFormErrors({});
      toast({ 
        title: 'Success', 
        description: 'Experience created successfully. Current position updated if applicable.' 
      });
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
    mutationFn: async ({ id, data }: { id: number; data: ExperienceFormData }) => {
      // Validate form before submission
      const validation = validateExperienceForm(data);
      if (!validation.isValid) {
        setFormErrors(validation.errors);
        throw new Error(formatValidationErrors(validation.errors));
      }
      
      const payload = {
        ...data,
        responsibilities: data.responsibilities.filter(r => r.trim() !== ''),
        achievements: data.achievements.filter(a => a.trim() !== ''),
        technologies: data.technologies.split(',').map(t => t.trim()).filter(Boolean),
        order: parseInt(data.order),
        // Ensure empty dates are sent as null instead of empty strings
        start_date: data.start_date || null,
        end_date: data.end_date || null,
      };

      return apiPut(`/api/experiences/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/experiences'] });
      setEditingExperience(null);
      resetForm();
      setFormErrors({});
      toast({ 
        title: 'Success', 
        description: 'Experience updated successfully. Current position updated if applicable.' 
      });
    },
    onError: (error) => {
      toast({ 
        title: 'Error', 
        description: error.message,
        variant: 'destructive'
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/experiences/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/experiences'] });
      toast({ title: 'Success', description: 'Experience deleted successfully.' });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      company: '',
      location: '',
      start_date: '',
      end_date: '',
      is_current: false,
      duration: '',
      responsibilities: [''],
      achievements: [''],
      technologies: '',
      color: '',
      order: '0',
      is_visible: true
    });
    setFormErrors({});
  };

  const handleEdit = (experience: Experience) => {
    setFormData({
      title: experience.title,
      company: experience.company,
      location: experience.location || '',
      start_date: experience.start_date || '',
      end_date: experience.end_date || '',
      is_current: experience.is_current,
      duration: experience.duration || '',
      responsibilities: experience.responsibilities || [],
      achievements: experience.achievements || [],
      technologies: experience.technologies?.join(', ') || '',
      color: experience.color || '',
      order: experience.order.toString(),
      is_visible: experience.is_visible
    });
    setEditingExperience(experience);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingExperience) {
      updateMutation.mutate({ id: editingExperience.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <AdminLayout title="Manage Experience">
      <div className="min-h-screen bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Enhanced Header Section - Cyberpunk cornflower */}
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-cornflower-50 via-cornflower-50/50 to-white dark:from-cornflower-950 dark:via-cornflower-900/40 dark:to-black/20 border border-cornflower-200/50 dark:border-cornflower-500/10 mb-10 shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-cornflower-500/5 to-transparent"></div>
            <div className="relative px-8 py-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center space-x-5">
                  <div className="p-4 bg-cornflower-500/10 dark:bg-cornflower-500/20 rounded-2xl backdrop-blur-md border border-cornflower-200/50 dark:border-cornflower-500/10 shadow-inner">
                    <Briefcase className="h-10 w-10 text-cornflower-600 dark:text-cornflower-400" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-black text-cornflower-950 dark:text-cornflower-50 mb-1 tracking-tight uppercase">Career Logs</h1>
                    <p className="text-cornflower-700/60 dark:text-cornflower-300/60 font-bold text-lg">Managing the professional trajectory matrix</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-5xl font-black text-cornflower-600 dark:text-cornflower-400 drop-shadow-[0_0_15px_rgba(100, 149, 237,0.3)]">{experiences?.length || 0}</div>
                  <div className="text-cornflower-900/40 dark:text-cornflower-50/40 text-xs font-black uppercase tracking-widest mt-1">Total Career Nodes</div>
                  <div className="flex gap-4 text-xs font-bold mt-2">
                    <span className="text-cornflower-500">{experiences?.filter(e => e.is_visible).length || 0} ACTIVE</span>
                    <span className="text-cornflower-900/30 dark:text-cornflower-50/30">{experiences?.filter(e => !e.is_visible).length || 0} DORMANT</span>
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
                  onClick={() => { resetForm(); setEditingExperience(null); }}
                >
                  <Plus className="w-5 h-5 mr-3" />
                  Initialize Career Node
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-0 shadow-2xl">
              <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-gray-800 bg-clip-text text-transparent">
                  {editingExperience ? 'Edit Experience' : 'Create New Experience'}
                </DialogTitle>
                <DialogDescription className="text-gray-600 dark:text-gray-400">
                  Fill out the form below to {editingExperience ? 'update' : 'create'} a work experience entry.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6 p-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Job Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className={`border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 rounded-lg ${formErrors.title ? 'border-red-500' : ''}`}
                      required
                    />
                    {formErrors.title && <p className="text-sm text-red-500">{formErrors.title}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company *</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                      className={formErrors.company ? 'border-red-500' : ''}
                      required
                    />
                    {formErrors.company && <p className="text-sm text-red-500">{formErrors.company}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="City, Country"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                      className={formErrors.start_date ? 'border-red-500' : ''}
                    />
                    {formErrors.start_date && <p className="text-sm text-red-500">{formErrors.start_date}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date" className={!formData.is_current ? 'text-red-600 font-medium' : ''}>
                      End Date {!formData.is_current && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                      disabled={formData.is_current}
                      className={`${formErrors.end_date ? 'border-red-500' : ''} ${!formData.is_current && !formData.end_date ? 'border-yellow-400 bg-yellow-50' : ''}`}
                    />
                    {formErrors.end_date && <p className="text-sm text-red-500">{formErrors.end_date}</p>}
                    {!formData.is_current && !formData.end_date && (
                      <p className="text-sm text-yellow-600">End date is required for non-current positions</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration</Label>
                    <Input
                      id="duration"
                      value={formData.duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                      placeholder="e.g., 2 years 3 months"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color">Color Theme</Label>
                    <Input
                      id="color"
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      placeholder="e.g., from-blue-500 to-purple-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="order">Display Order</Label>
                    <Input
                      id="order"
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData(prev => ({ ...prev, order: e.target.value }))}
                      className={formErrors.order ? 'border-red-500' : ''}
                    />
                    {formErrors.order && <p className="text-sm text-red-500">{formErrors.order}</p>}
                  </div>
                </div>

                <ResponsibilitiesEditor 
                  responsibilities={formData.responsibilities}
                  onChange={(responsibilities: string[]) => setFormData(prev => ({ ...prev, responsibilities }))}
                />

                <AchievementsEditor 
                  achievements={formData.achievements}
                  onChange={(achievements: string[]) => setFormData(prev => ({ ...prev, achievements }))}
                />

                <div className="space-y-2">
                  <Label htmlFor="technologies">Technologies Used (comma-separated)</Label>
                  <Input
                    id="technologies"
                    value={formData.technologies}
                    onChange={(e) => setFormData(prev => ({ ...prev, technologies: e.target.value }))}
                    placeholder="React, Node.js, PostgreSQL, AWS"
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_current"
                      checked={formData.is_current}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          // Show a toast notification about the behavior
                          toast({
                            title: "Current Position Set",
                            description: "This will automatically unmark any other current positions.",
                          });
                        } else {
                          // Show a toast notification about end date requirement
                          toast({
                            title: "End Date Required",
                            description: "Please provide an end date since this is no longer a current position.",
                            variant: "default",
                          });
                        }
                        setFormData(prev => ({ 
                          ...prev, 
                          is_current: checked,
                          end_date: checked ? null : prev.end_date
                        }));
                      }}
                    />
                    <Label htmlFor="is_current" className="text-sm font-medium">
                      Current position
                      <span className="text-xs text-gray-500 block">
                        (Only one experience can be current at a time)
                      </span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_visible"
                      checked={formData.is_visible}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_visible: checked }))}
                    />
                    <Label htmlFor="is_visible">Visible on portfolio</Label>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => {
                    setIsCreateOpen(false);
                    setEditingExperience(null);
                    resetForm();
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="text-white">
                    {editingExperience ? 'Update' : 'Create'} Experience
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
              <p className="text-cornflower-900/60 dark:text-cornflower-50/60 font-black uppercase tracking-widest text-sm">Syncing timeline...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-7xl mx-auto">
            {experiences?.map((experience) => (
              <Card key={experience.id} className="group hover:shadow-2xl transition-all duration-500 border-0 bg-card/70 dark:bg-black/40 backdrop-blur-md rounded-[2.5rem] overflow-hidden shadow-xl transform hover:-translate-y-2">
                <div className="p-5 sm:p-8 border-b border-cornflower-100/50 dark:border-cornflower-500/10">
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-4 mb-3">
                        <h3 className="text-xl sm:text-2xl font-black text-cornflower-950 dark:text-cornflower-50 uppercase tracking-tight break-words">
                          {experience.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                          <Badge 
                            variant={experience.is_visible ? "default" : "secondary"}
                            className={`${
                              experience.is_visible 
                                ? "bg-cornflower-500/10 text-cornflower-600 dark:bg-cornflower-500/20 dark:text-cornflower-300" 
                                : "bg-cornflower-900 dark:bg-black text-white"
                            } font-black text-[10px] uppercase tracking-widest rounded-full px-3 py-1 border-0`}
                          >
                            {experience.is_visible ? (
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
                          {experience.is_current && (
                            <Badge className="bg-cornflower-600 text-white font-black text-[10px] uppercase tracking-widest rounded-full px-3 py-1 border-0 animate-pulse">
                              Active Node
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-cornflower-500/60 dark:text-cornflower-400/60 mb-1 flex flex-wrap gap-y-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-cornflower-500/10 text-cornflower-600 dark:bg-cornflower-500/20 dark:text-cornflower-300 mr-3">
                          {experience.company}
                        </span>
                        <div className="flex items-center gap-3">
                          {experience.location && (
                            <span className="flex items-center gap-1.5 inline-flex">
                              <div className="w-1 h-1 bg-cornflower-400 rounded-full"></div>
                              {experience.location}
                            </span>
                          )}
                          {experience.duration && (
                            <span className="flex items-center gap-1.5 inline-flex">
                              <div className="w-1 h-1 bg-cornflower-400 rounded-full"></div>
                              {experience.duration}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2.5">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEdit(experience)}
                        className="w-10 h-10 p-0 rounded-full border-2 border-cornflower-200 text-cornflower-600 hover:bg-cornflower-50 dark:border-cornflower-500/20 dark:text-cornflower-400 dark:hover:bg-cornflower-500/10 transition-all duration-300"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => deleteConfirmation.openConfirmDialog(experience)}
                        disabled={deleteMutation.isPending}
                        className="w-10 h-10 p-0 rounded-full bg-cornflower-950 text-white hover:bg-black transition-all duration-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                               <div className="p-8 space-y-8">
                  {experience.responsibilities && experience.responsibilities.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-black text-cornflower-950 dark:text-cornflower-50 uppercase tracking-[0.2em] mb-4">Core Responsibilities:</h4>
                      <ul className="space-y-3">
                        {experience.responsibilities.map((resp, index) => (
                          <li key={index} className="text-sm text-cornflower-700/70 dark:text-cornflower-300/70 font-medium relative pl-6 before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:bg-cornflower-400 before:rounded-full">
                            {resp}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {experience.achievements && experience.achievements.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-black text-cornflower-950 dark:text-cornflower-50 uppercase tracking-[0.2em] mb-4">Tactical Achievements:</h4>
                      <ul className="space-y-3">
                        {experience.achievements.map((achievement, index) => (
                          <li key={index} className="text-sm text-cornflower-700/70 dark:text-cornflower-300/70 font-medium relative pl-6 before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:bg-cornflower-600 before:rounded-full">
                            {achievement}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
 
                  {experience.technologies && experience.technologies.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-black text-cornflower-950 dark:text-cornflower-50 uppercase tracking-[0.2em] mb-4">Technology Stack:</h4>
                      <div className="flex flex-wrap gap-2">
                        {experience.technologies.map((tech, index) => (
                          <Badge key={index} variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-cornflower-500/5 dark:bg-cornflower-500/10 text-cornflower-600 dark:text-cornflower-300 border-cornflower-200/50 dark:border-cornflower-500/20 px-3 py-1 rounded-full">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
 
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-cornflower-500/40 pt-6 border-t border-cornflower-100/30 dark:border-cornflower-500/10">
                    <span className="bg-cornflower-500/5 dark:bg-cornflower-500/10 px-3 py-1 rounded-full">ORDER_INDEX: {experience.order}</span>
                    <span className="text-right flex items-center gap-1.5">
                      <div className="w-1 h-1 bg-cornflower-400 rounded-full"></div>
                      SYNCED: {new Date(experience.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        </div>
      </div>

      <Dialog open={!!editingExperience} onOpenChange={(open) => {
        if (!open) {
          setEditingExperience(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Experience</DialogTitle>
            <DialogDescription>
              Update the experience information below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Job Title *</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-company">Company *</Label>
                <Input
                  id="edit-company"
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="City, Country"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-start_date">Start Date</Label>
                <Input
                  id="edit-start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-end_date" className={!formData.is_current ? 'text-red-600 font-medium' : ''}>
                  End Date {!formData.is_current && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="edit-end_date"
                  type="date"
                  value={formData.end_date || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  disabled={formData.is_current}
                  className={`${formErrors.end_date ? 'border-red-500' : ''} ${!formData.is_current && !formData.end_date ? 'border-yellow-400 bg-yellow-50' : ''}`}
                />
                {formErrors.end_date && <p className="text-sm text-red-500">{formErrors.end_date}</p>}
                {!formData.is_current && !formData.end_date && (
                  <p className="text-sm text-yellow-600">End date is required for non-current positions</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-duration">Duration</Label>
                <Input
                  id="edit-duration"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  placeholder="e.g., 2 years 3 months"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-color">Color Theme</Label>
                <Input
                  id="edit-color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  placeholder="e.g., from-blue-500 to-purple-600"
                />
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

            <ResponsibilitiesEditor 
              responsibilities={formData.responsibilities}
              onChange={(responsibilities: string[]) => setFormData(prev => ({ ...prev, responsibilities }))}
            />

            <AchievementsEditor 
              achievements={formData.achievements}
              onChange={(achievements: string[]) => setFormData(prev => ({ ...prev, achievements }))}
            />

            <div className="space-y-2">
              <Label htmlFor="edit-technologies">Technologies Used (comma-separated)</Label>
              <Input
                id="edit-technologies"
                value={formData.technologies}
                onChange={(e) => setFormData(prev => ({ ...prev, technologies: e.target.value }))}
                placeholder="React, Node.js, PostgreSQL, AWS"
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-is_current"
                  checked={formData.is_current}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      // Show a toast notification about the behavior
                      toast({
                        title: "Current Position Set",
                        description: "This will automatically unmark any other current positions.",
                      });
                    } else {
                      // Show a toast notification about end date requirement
                      toast({
                        title: "End Date Required",
                        description: "Please provide an end date since this is no longer a current position.",
                        variant: "default",
                      });
                    }
                    setFormData(prev => ({ 
                      ...prev, 
                      is_current: checked,
                      end_date: checked ? null : prev.end_date
                    }));
                  }}
                />
                <Label htmlFor="edit-is_current" className="text-sm font-medium">
                  Current position
                  <span className="text-xs text-gray-500 block">
                    (Only one experience can be current at a time)
                  </span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-is_visible"
                  checked={formData.is_visible}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_visible: checked }))}
                />
                <Label htmlFor="edit-is_visible">Visible on portfolio</Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setEditingExperience(null);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending} className="text-white">
                Update Experience
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
