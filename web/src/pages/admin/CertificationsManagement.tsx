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
      <div className="min-h-screen bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Enhanced Header Section - Cyberpunk cornflower */}
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-cornflower-50 via-cornflower-50/50 to-white dark:from-cornflower-950 dark:via-cornflower-900/40 dark:to-black/20 border border-cornflower-200/50 dark:border-cornflower-500/10 mb-10 shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-cornflower-500/5 to-transparent"></div>
            <div className="relative px-8 py-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center space-x-5">
                  <div className="p-4 bg-cornflower-500/10 dark:bg-cornflower-500/20 rounded-2xl backdrop-blur-md border border-cornflower-200/50 dark:border-cornflower-500/10 shadow-inner">
                    <Award className="h-10 w-10 text-cornflower-600 dark:text-cornflower-400" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-black text-cornflower-950 dark:text-cornflower-50 mb-1 tracking-tight uppercase">Credential Matrix</h1>
                    <p className="text-cornflower-700/60 dark:text-cornflower-300/60 font-bold text-lg">Validating professional expertise modules</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-5xl font-black text-cornflower-600 dark:text-cornflower-400 drop-shadow-[0_0_15px_rgba(100, 149, 237,0.3)]">{certifications?.length || 0}</div>
                  <div className="text-cornflower-900/40 dark:text-cornflower-50/40 text-xs font-black uppercase tracking-widest mt-1">Verified Credentials</div>
                  <div className="flex gap-4 text-xs font-bold mt-2">
                    <span className="text-cornflower-500">{certifications?.filter(c => c.is_visible).length || 0} ACTIVE</span>
                    <span className="text-cornflower-900/30 dark:text-cornflower-50/30">{certifications?.filter(c => !c.is_visible).length || 0} DORMANT</span>
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
                  onClick={() => { resetForm(); setEditingCert(null); }}
                >
                  <Plus className="w-5 h-5 mr-3" />
                  Initialize Credential
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
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-cornflower-600 dark:border-cornflower-500 border-r-transparent border-b-cornflower-200 dark:border-b-cornflower-900 border-l-transparent mx-auto mb-6"></div>
              <p className="text-cornflower-900/60 dark:text-cornflower-50/60 font-black uppercase tracking-widest text-sm">Syncing matrix...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-7xl mx-auto">
            {certifications?.map((cert) => (
              <Card key={cert.id} className="group hover:shadow-2xl transition-all duration-500 border-0 bg-card/70 dark:bg-black/40 backdrop-blur-md rounded-[2.5rem] overflow-hidden shadow-xl transform hover:-translate-y-2">
                <div className="p-5 sm:p-8 border-b border-cornflower-100/50 dark:border-cornflower-500/10">
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-4 mb-3">
                        <h3 className="text-xl sm:text-2xl font-black text-cornflower-950 dark:text-cornflower-50 uppercase tracking-tight break-words">
                          {cert.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                          <Badge 
                            variant={cert.is_visible ? "default" : "secondary"}
                            className={`${
                              cert.is_visible 
                                ? "bg-cornflower-500/10 text-cornflower-600 dark:bg-cornflower-500/20 dark:text-cornflower-300" 
                                : "bg-cornflower-900 dark:bg-black text-white"
                            } font-black text-[10px] uppercase tracking-widest rounded-full px-3 py-1 border-0`}
                          >
                            {cert.is_visible ? (
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
                        </div>
                      </div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-cornflower-500/60 dark:text-cornflower-400/60 mb-1 flex flex-wrap gap-y-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-cornflower-500/10 text-cornflower-600 dark:bg-cornflower-500/20 dark:text-cornflower-300 mr-3">
                          {cert.issuer}
                        </span>
                        <div className="flex items-center gap-3">
                          {cert.date && (
                            <span className="flex items-center gap-1.5 inline-flex">
                              <div className="w-1 h-1 bg-cornflower-400 rounded-full"></div>
                              ISSUED: {cert.date}
                            </span>
                          )}
                          {cert.certificate_id && (
                            <span className="flex items-center gap-1.5 inline-flex">
                              <div className="w-1 h-1 bg-cornflower-400 rounded-full"></div>
                              MODULE_ID: {cert.certificate_id}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2.5">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEdit(cert)}
                        className="w-10 h-10 p-0 rounded-full border-2 border-cornflower-200 text-cornflower-600 hover:bg-cornflower-50 dark:border-cornflower-500/20 dark:text-cornflower-400 dark:hover:bg-cornflower-500/10 transition-all duration-300"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => deleteConfirmation.openConfirmDialog(cert)}
                        disabled={deleteMutation.isPending}
                        className="w-10 h-10 p-0 rounded-full bg-cornflower-950 text-white hover:bg-black transition-all duration-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                               <div className="p-8 space-y-8">
                  {cert.description && (
                    <p className="text-cornflower-700/70 dark:text-cornflower-300/70 text-sm font-medium leading-relaxed">{cert.description}</p>
                  )}
                  
                  {cert.skills && cert.skills.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-black text-cornflower-950 dark:text-cornflower-50 uppercase tracking-[0.2em] mb-4">Skill Matrix Tags:</h4>
                      <div className="flex flex-wrap gap-2">
                        {cert.skills.map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-cornflower-500/5 dark:bg-cornflower-500/10 text-cornflower-600 dark:text-cornflower-300 border-cornflower-200/50 dark:border-cornflower-500/20 px-3 py-1 rounded-full transition-all duration-300 hover:bg-cornflower-500/10">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
 
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-cornflower-500/40 pt-6 border-t border-cornflower-100/30 dark:border-cornflower-500/10">
                    <div className="flex gap-6">
                      {cert.expiration_date && (
                        <span className="flex items-center gap-1.5"><div className="w-1 h-1 bg-cornflower-400 rounded-full"></div> EXPIRES: {new Date(cert.expiration_date).toLocaleDateString()}</span>
                      )}
                    </div>
                    {cert.credential_url && (
                      <a 
                        href={cert.credential_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-cornflower-600 dark:text-cornflower-400 hover:text-cornflower-800 dark:hover:text-cornflower-200 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        VERIFY_NODE
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
