import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, ExternalLink, Award, Eye, EyeOff } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useDeleteConfirmation } from '@/hooks/useDeleteConfirmation';
import { 
  validateRequiredFields, 
  validateUrl,
  combineValidationResults,
  formatValidationErrors,
  type ValidationResult 
} from '@/utils/formValidation';
import { apiGet, apiPost, apiPut, apiDelete } from '@/utils/api';

interface Certification {
  id: number;
  name: string;
  issuer: string;
  date?: string;
  credential_url?: string;
  description?: string;
  skills?: string[];
  certificate_id?: string;
  expiration_date?: string;
  is_visible: boolean;
}

interface CertificationFormData {
  name: string;
  issuer: string;
  date: string;
  credential_url: string;
  description: string;
  skills: string;
  certificate_id: string;
  expiration_date: string;
  is_visible: boolean;
}

export default function CertificationsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCert, setEditingCert] = useState<Certification | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<CertificationFormData>({
    name: '',
    issuer: '',
    date: '',
    credential_url: '',
    description: '',
    skills: '',
    certificate_id: '',
    expiration_date: '',
    is_visible: true
  });

  // Delete confirmation setup
  const deleteConfirmation = useDeleteConfirmation({
    onDelete: (id: number) => deleteMutation.mutate(id),
    itemName: (cert: Certification) => `${cert.name} by ${cert.issuer}`,
    itemType: 'certification',
  });

  // Comprehensive form validation
  const validateCertificationForm = (data: CertificationFormData): ValidationResult => {
    const requiredValidation = validateRequiredFields(data, ['name', 'issuer']);
    const urlValidation = data.credential_url ? validateUrl(data.credential_url, 'Credential URL') : { isValid: true, errors: {} };
    
    return combineValidationResults(requiredValidation, urlValidation);
  };

  const { data: certifications, isLoading } = useQuery({
    queryKey: ['/api/certifications'],
    queryFn: () => apiGet('/api/certifications/'),
  });

  const createMutation = useMutation({
    mutationFn: async (data: CertificationFormData) => {
      const payload = {
        ...data,
        skills: data.skills.split(',').map(s => s.trim()).filter(Boolean),
      };

      return apiPost('/api/certifications/', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/certifications'] });
      setIsCreateOpen(false);
      resetForm();
      toast({ title: 'Success', description: 'Certification created successfully.' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CertificationFormData }) => {
      const payload = {
        ...data,
        skills: data.skills.split(',').map(s => s.trim()).filter(Boolean),
      };

      return apiPut(`/api/certifications/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/certifications'] });
      setEditingCert(null);
      resetForm();
      toast({ title: 'Success', description: 'Certification updated successfully.' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/certifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/certifications'] });
      toast({ title: 'Success', description: 'Certification deleted successfully.' });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      issuer: '',
      date: '',
      credential_url: '',
      description: '',
      skills: '',
      certificate_id: '',
      expiration_date: '',
      is_visible: true
    });
  };

  const handleEdit = (cert: Certification) => {
    setFormData({
      name: cert.name,
      issuer: cert.issuer,
      date: cert.date || '',
      credential_url: cert.credential_url || '',
      description: cert.description || '',
      skills: cert.skills?.join(', ') || '',
      certificate_id: cert.certificate_id || '',
      expiration_date: cert.expiration_date || '',
      is_visible: cert.is_visible
    });
    setEditingCert(cert);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCert) {
      updateMutation.mutate({ id: editingCert.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <AdminLayout title="Manage Certifications">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Enhanced Header Section */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-700 via-slate-800 to-gray-900 dark:from-gray-800 dark:via-gray-900 dark:to-black mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent"></div>
            <div className="relative px-8 py-12">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm border border-white/10">
                    <Award className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-2">Certifications Management</h1>
                    <p className="text-gray-300 text-lg">Manage your professional certifications and achievements</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">{certifications?.length || 0}</div>
                  <div className="text-gray-300 text-sm">Total Certifications</div>
                  <div className="text-gray-400 text-sm mt-1">
                    {certifications?.filter(c => c.is_visible).length || 0} visible, {" "}
                    {certifications?.filter(c => !c.is_visible).length || 0} hidden
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
                  onClick={() => { resetForm(); setEditingCert(null); }}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add New Certification
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-0 shadow-2xl">
              <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-gray-800 bg-clip-text text-transparent">
                  {editingCert ? 'Edit Certification' : 'Create New Certification'}
                </DialogTitle>
                <DialogDescription className="text-gray-600 dark:text-gray-400">
                  Fill out the form below to {editingCert ? 'update' : 'create'} a certification.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6 p-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Certification Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                      className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="issuer" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Issuer *</Label>
                    <Input
                      id="issuer"
                      value={formData.issuer}
                      onChange={(e) => setFormData(prev => ({ ...prev, issuer: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    placeholder="Brief description of the certification"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Issue Date</Label>
                    <Input
                      id="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      placeholder="e.g., July 2024"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiration_date">Expiration Date</Label>
                    <Input
                      id="expiration_date"
                      type="date"
                      value={formData.expiration_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, expiration_date: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="certificate_id">Certificate ID</Label>
                    <Input
                      id="certificate_id"
                      value={formData.certificate_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, certificate_id: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="credential_url">Credential URL</Label>
                    <Input
                      id="credential_url"
                      value={formData.credential_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, credential_url: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skills">Related Skills (comma-separated)</Label>
                  <Input
                    id="skills"
                    value={formData.skills}
                    onChange={(e) => setFormData(prev => ({ ...prev, skills: e.target.value }))}
                    placeholder="Python, Machine Learning, Data Analysis"
                  />
                </div>

                <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Switch
                    id="is_visible"
                    checked={formData.is_visible}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_visible: checked }))}
                  />
                  <Label htmlFor="is_visible" className="text-sm font-medium text-gray-700 dark:text-gray-300">Visible on portfolio</Label>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => {
                    setIsCreateOpen(false);
                    setEditingCert(null);
                    resetForm();
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="text-white">
                    {editingCert ? 'Update' : 'Create'} Certification
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
              <p className="text-gray-600 dark:text-gray-400">Loading certifications...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {certifications?.map((cert) => (
              <Card key={cert.id} className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 transform hover:-translate-y-1">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                          {cert.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={cert.is_visible ? "default" : "secondary"}
                            className={`${
                              cert.is_visible 
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" 
                                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                            } font-medium`}
                          >
                            {cert.is_visible ? (
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
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 mr-2">
                          {cert.issuer}
                        </span>
                        {cert.date && (
                          <span className="text-gray-500 text-xs">Issued: {cert.date}</span>
                        )}
                        {cert.certificate_id && (
                          <span className="text-gray-500 text-xs ml-2">• ID: {cert.certificate_id}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEdit(cert)}
                        className="hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900/50 transition-all duration-200"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => deleteConfirmation.openConfirmDialog(cert)}
                        disabled={deleteMutation.isPending}
                        className="hover:bg-red-600 transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  {cert.description && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-4">{cert.description}</p>
                  )}
                  
                  {cert.skills && cert.skills.length > 0 && (
                    <div>
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Skills:</span>
                      <div className="flex flex-wrap gap-2">
                        {cert.skills.map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-xs bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex gap-4">
                      {cert.expiration_date && (
                        <span>Expires: {new Date(cert.expiration_date).toLocaleDateString()}</span>
                      )}
                    </div>
                    {cert.credential_url && (
                      <a 
                        href={cert.credential_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View Credential
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        </div>
      </div>

      <Dialog open={!!editingCert} onOpenChange={(open) => {
        if (!open) {
          setEditingCert(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Certification</DialogTitle>
            <DialogDescription>
              Update the certification information below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Certification Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-issuer">Issuer *</Label>
                <Input
                  id="edit-issuer"
                  value={formData.issuer}
                  onChange={(e) => setFormData(prev => ({ ...prev, issuer: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                placeholder="Brief description of the certification"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-date">Issue Date</Label>
                <Input
                  id="edit-date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  placeholder="e.g., July 2024"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-expiration_date">Expiration Date</Label>
                <Input
                  id="edit-expiration_date"
                  type="date"
                  value={formData.expiration_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiration_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-certificate_id">Certificate ID</Label>
                <Input
                  id="edit-certificate_id"
                  value={formData.certificate_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, certificate_id: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-credential_url">Credential URL</Label>
                <Input
                  id="edit-credential_url"
                  value={formData.credential_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, credential_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-skills">Related Skills (comma-separated)</Label>
              <Input
                id="edit-skills"
                value={formData.skills}
                onChange={(e) => setFormData(prev => ({ ...prev, skills: e.target.value }))}
                placeholder="Python, Machine Learning, Data Analysis"
              />
            </div>

            <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Switch
                id="edit-is_visible"
                checked={formData.is_visible}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_visible: checked }))}
              />
              <Label htmlFor="edit-is_visible" className="text-sm font-medium text-gray-700 dark:text-gray-300">Visible on portfolio</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setEditingCert(null);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending} className="text-white">
                Update Certification
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