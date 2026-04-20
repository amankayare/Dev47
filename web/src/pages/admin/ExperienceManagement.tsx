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
          className="w-full h-10 border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-500 rounded-xl transition-colors"
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
          className="w-full h-10 border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-500 rounded-xl transition-colors"
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
          
          {/* Enhanced Header Section */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-700 via-slate-800 to-gray-900 dark:from-slate-800 dark:via-slate-900 dark:to-gray-950 mb-8 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent"></div>
            <div className="relative px-8 py-12">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/10 dark:bg-white/5 rounded-lg backdrop-blur-sm border border-white/10 dark:border-white/5">
                    <Briefcase className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-2">Experience Management</h1>
                    <p className="text-gray-300 dark:text-gray-200 text-lg">Manage your professional work experience and career journey</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">{experiences?.length || 0}</div>
                  <div className="text-gray-300 dark:text-gray-200 text-sm">Total Experiences</div>
                  <div className="text-gray-400 dark:text-gray-300 text-sm mt-1">
                    {experiences?.filter(e => e.is_visible).length || 0} visible, {" "}
                    {experiences?.filter(e => !e.is_visible).length || 0} hidden
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
                  onClick={() => { resetForm(); setEditingExperience(null); }}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add New Experience
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
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading experiences...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {experiences?.map((experience) => (
              <Card key={experience.id} className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 transform hover:-translate-y-1">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                          {experience.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={experience.is_visible ? "default" : "secondary"}
                            className={`${
                              experience.is_visible 
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" 
                                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                            } font-medium`}
                          >
                            {experience.is_visible ? (
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
                          {experience.is_current && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-700 text-xs">
                              Current
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 mr-2">
                          {experience.company}
                        </span>
                        {experience.location && (
                          <span className="text-gray-500 text-xs">{experience.location}</span>
                        )}
                        {experience.duration && (
                          <span className="text-gray-500 text-xs ml-2">• {experience.duration}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEdit(experience)}
                        className="hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900/50 transition-all duration-200"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => deleteConfirmation.openConfirmDialog(experience)}
                        disabled={deleteMutation.isPending}
                        className="hover:bg-red-600 transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  {experience.responsibilities && experience.responsibilities.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Responsibilities:</h4>
                      <ul className="space-y-1.5 ml-4">
                        {experience.responsibilities.map((resp, index) => (
                          <li key={index} className="text-sm text-muted-foreground relative before:content-['•'] before:absolute before:-left-4 before:text-blue-600 before:font-bold">
                            {resp}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {experience.achievements && experience.achievements.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Key Achievements:</h4>
                      <ul className="space-y-1.5 ml-4">
                        {experience.achievements.map((achievement, index) => (
                          <li key={index} className="text-sm text-muted-foreground relative before:content-['•'] before:absolute before:-left-4 before:text-green-600 before:font-bold">
                            {achievement}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {experience.technologies && experience.technologies.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Technologies:</h4>
                      <div className="flex flex-wrap gap-2">
                        {experience.technologies.map((tech, index) => (
                          <Badge key={index} variant="outline" className="text-xs px-2 py-1 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">Order: {experience.order}</span>
                    <span className="text-right">
                      Added: {new Date(experience.created_at).toLocaleDateString()}
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