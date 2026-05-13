import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Save, User as UserIcon, Eye, EyeOff, ExternalLink, Plus, Trash2 } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { apiGet, apiPost, apiPut, apiDelete } from '@/utils/api';
import { ensureHttpsProtocol } from '@/utils/urlUtils';
import { formatTextWithLineBreaks, decodeHtmlEntities } from '@/utils/textUtils';
import ImageInput from '@/components/ui/ImageInput';
import ResumeInput from '@/components/ui/ResumeInput';

interface About {
  id: number;
  name: string;
  headline?: string;
  bio: string;
  photo?: string;
  cover_image?: string;
  location?: string;
  email?: string;
  phone?: string;
  resume_url?: string;
  social_links?: Record<string, string>;
}

interface AboutFormData {
  name: string;
  headline: string;
  bio: string;
  photo: string;
  cover_image: string;
  location: string;
  email: string;
  phone: string;
  resume_url: string;
  social_links: Array<{ platform: string; url: string }>;
}

export default function AboutManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<AboutFormData>({
    name: '',
    headline: '',
    bio: '',
    photo: '',
    cover_image: '',
    location: '',
    email: '',
    phone: '',
    resume_url: '',
    social_links: []
  });

  const { data: about, isLoading } = useQuery({
    queryKey: ['/api/about'],
    queryFn: () => apiGet('/api/about/'),
  });

  useEffect(() => {
    if (about) {
      const socialLinksArray = about.social_links 
        ? Object.entries(about.social_links).map(([platform, url]) => ({ platform, url }))
        : [];
      
      setFormData({
        name: decodeHtmlEntities(about.name || ''),
        headline: decodeHtmlEntities(about.headline || ''),
        bio: decodeHtmlEntities(about.bio || ''),
        photo: about.photo || '',
        cover_image: about.cover_image || '',
        location: decodeHtmlEntities(about.location || ''),
        email: about.email || '',
        phone: about.phone || '',
        resume_url: about.resume_url || '',
        social_links: socialLinksArray
      });
    }
  }, [about]);

  const updateMutation = useMutation({
    mutationFn: async (data: AboutFormData) => {
      // Convert social_links array to object format for backend
      const socialLinksObj = data.social_links.reduce((acc, link) => {
        if (link.platform && link.url) {
          acc[link.platform] = link.url;
        }
        return acc;
      }, {} as Record<string, string>);

      const payload = {
        ...data,
        social_links: socialLinksObj,
      };

      // POST on first create (no existing record), PUT on update
      const hasExistingRecord = about && about.name;
      return hasExistingRecord
        ? apiPut('/api/about/', payload)
        : apiPost('/api/about/', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/about'] });
      toast({ title: 'Success', description: 'About information saved successfully.' });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save about information.',
        variant: 'destructive'
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <AdminLayout title="Manage About Information">
        <div>Loading about information...</div>
      </AdminLayout>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      <AdminLayout title="Manage About Information">
        {/* Professional Header Section - Cyberpunk Indigo */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-indigo-50 via-indigo-50/50 to-white dark:from-indigo-950 dark:via-indigo-900/40 dark:to-black/20 border border-indigo-200/50 dark:border-indigo-500/10 mb-10 shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent"></div>
          <div className="relative px-8 py-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
              <div className="flex items-center space-x-5">
                <div className="p-4 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-2xl backdrop-blur-md border border-indigo-200/50 dark:border-indigo-500/10 shadow-inner">
                  <UserIcon className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-indigo-950 dark:text-indigo-50 mb-1 tracking-tight uppercase">Identity Hub</h1>
                  <p className="text-indigo-700/60 dark:text-indigo-300/60 font-bold text-lg">Managing the digital persona matrix</p>
                </div>
              </div>
            </div>
 
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/40 dark:bg-indigo-500/5 rounded-3xl p-6 backdrop-blur-sm border border-indigo-100/50 dark:border-indigo-500/10">
                <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mb-1">{about?.name ? '1' : '0'}</div>
                <div className="text-indigo-900/40 dark:text-indigo-50/40 text-[10px] font-black uppercase tracking-widest">Active Core</div>
              </div>
              <div className="bg-white/40 dark:bg-indigo-500/5 rounded-3xl p-6 backdrop-blur-sm border border-indigo-100/50 dark:border-indigo-500/10">
                <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mb-1">{about?.photo ? 'YES' : 'NO'}</div>
                <div className="text-indigo-900/40 dark:text-indigo-50/40 text-[10px] font-black uppercase tracking-widest">Visual Hash</div>
              </div>
              <div className="bg-white/40 dark:bg-indigo-500/5 rounded-3xl p-6 backdrop-blur-sm border border-indigo-100/50 dark:border-indigo-500/10">
                <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mb-1">{about?.cover_image ? 'YES' : 'NO'}</div>
                <div className="text-indigo-900/40 dark:text-indigo-50/40 text-[10px] font-black uppercase tracking-widest">Environment Map</div>
              </div>
              <div className="bg-white/40 dark:bg-indigo-500/5 rounded-3xl p-6 backdrop-blur-sm border border-indigo-100/50 dark:border-indigo-500/10">
                <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mb-1">{about?.social_links ? Object.keys(about.social_links).length : 0}</div>
                <div className="text-indigo-900/40 dark:text-indigo-50/40 text-[10px] font-black uppercase tracking-widest">External Links</div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-6 xl:px-8">
          <div className="space-y-4 sm:space-y-6">
            <Card className="shadow-xl border-0 bg-white/70 dark:bg-black/40 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
              <CardHeader className="p-8 border-b border-indigo-100/50 dark:border-indigo-500/10">
                <CardTitle className="flex items-center gap-4 text-indigo-950 dark:text-indigo-50 font-black uppercase tracking-tight">
                  <div className="bg-indigo-500/10 dark:bg-indigo-500/20 p-2.5 rounded-2xl shadow-inner">
                    <UserIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  Profile Configuration
                </CardTitle>
                <CardDescription className="text-indigo-700/60 dark:text-indigo-300/60 font-bold">
                  Update the core identity modules displayed on your portfolio interface.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-slate-700 dark:text-slate-200 font-medium">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="border-slate-300 dark:border-slate-600 focus:border-slate-500 dark:focus:border-slate-400 focus:ring-slate-500 dark:focus:ring-slate-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 w-full min-w-0"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="headline" className="text-slate-700 dark:text-slate-200 font-medium">Professional Headline</Label>
                      <Input
                        id="headline"
                        value={formData.headline}
                        onChange={(e) => setFormData(prev => ({ ...prev, headline: e.target.value }))}
                        className="border-slate-300 dark:border-slate-600 focus:border-slate-500 dark:focus:border-slate-400 focus:ring-slate-500 dark:focus:ring-slate-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 w-full min-w-0"
                        placeholder="e.g., Full Stack Developer & Tech Enthusiast"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-slate-700 dark:text-slate-200 font-medium">Biography *</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                      className="border-slate-300 dark:border-slate-600 focus:border-slate-500 dark:focus:border-slate-400 focus:ring-slate-500 dark:focus:ring-slate-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 min-h-[160px]"
                      rows={6}
                      required
                      placeholder="Write a compelling bio that showcases your background, skills, and interests..."
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                    <div className="space-y-2">
                      <ImageInput
                        label="Profile Photo"
                        currentUrl={formData.photo}
                        onUrlChange={(url) => setFormData(prev => ({ ...prev, photo: url }))}
                        onUploadSuccess={(url) => setFormData(prev => ({ ...prev, photo: url }))}
                        onDelete={() => setFormData(prev => ({ ...prev, photo: '' }))}
                        accept="image/*"
                        maxSize={5}
                        uploadType="profile"
                        placeholder="Enter profile photo URL..."
                      />
                    </div>
                    <div className="space-y-2">
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
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-slate-700 dark:text-slate-200 font-medium">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        className="border-slate-300 dark:border-slate-600 focus:border-slate-500 dark:focus:border-slate-400 focus:ring-slate-500 dark:focus:ring-slate-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder="City, Country"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-slate-700 dark:text-slate-200 font-medium">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="border-slate-300 dark:border-slate-600 focus:border-slate-500 dark:focus:border-slate-400 focus:ring-slate-500 dark:focus:ring-slate-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-slate-700 dark:text-slate-200 font-medium">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="border-slate-300 dark:border-slate-600 focus:border-slate-500 dark:focus:border-slate-400 focus:ring-slate-500 dark:focus:ring-slate-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <ResumeInput
                      label="Resume"
                      currentUrl={formData.resume_url}
                      onUrlChange={(url) => setFormData(prev => ({ ...prev, resume_url: url }))}
                      onUploadSuccess={(url) => setFormData(prev => ({ ...prev, resume_url: url }))}
                      onDelete={() => setFormData(prev => ({ ...prev, resume_url: '' }))}
                      maxSize={10} // 10MB limit for resume endpoint
                      placeholder="Enter resume URL or upload a PDF file..."
                    />
                  </div>

                  <div className="space-y-2">
                    <SocialLinksEditor 
                      socialLinks={formData.social_links}
                      onChange={(socialLinks: Array<{ platform: string; url: string }>) => setFormData(prev => ({ ...prev, social_links: socialLinks }))}
                    />
                  </div>

                  <div className="flex justify-end pt-10 border-t border-indigo-100/30 dark:border-indigo-500/10">
                    <Button
                      type="submit"
                      disabled={updateMutation.isPending}
                      className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 transition-all duration-300 px-10 py-7 text-xs font-black uppercase tracking-[0.2em] rounded-full border-0 transform hover:scale-105" 
                    >
                      <Save className="w-4 h-4 mr-3" />
                      {updateMutation.isPending ? 'UPLOADING...' : 'SAVE_PROFILE'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {about && (
              <Card className="shadow-xl border-0 bg-white/70 dark:bg-black/40 backdrop-blur-md rounded-[2.5rem] overflow-hidden mt-10">
                <CardHeader className="p-8 border-b border-indigo-100/50 dark:border-indigo-500/10">
                  <CardTitle className="text-indigo-950 dark:text-indigo-50 font-black uppercase tracking-tight">Identity Preview</CardTitle>
                  <CardDescription className="text-indigo-700/60 dark:text-indigo-300/60 font-bold">
                    Visual verification of the current profile state.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="space-y-4 sm:space-y-6">
                    <div className="bg-gradient-to-r from-slate-100 to-gray-100 dark:from-slate-700 dark:to-gray-700 p-4 sm:p-6 rounded-lg">
                      <h3 className="font-bold text-xl text-slate-800 dark:text-slate-100">{decodeHtmlEntities(about.name)}</h3>
                      {about.headline && <p className="text-slate-600 dark:text-slate-300 mt-1">{decodeHtmlEntities(about.headline)}</p>}
                    </div>

                    {about.bio && (
                      <div className="bg-white/80 dark:bg-gray-700/60 p-4 sm:p-6 rounded-lg border border-slate-200 dark:border-slate-600">
                        <h4 className="font-semibold mb-3 text-slate-700 dark:text-slate-200">Biography</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">{formatTextWithLineBreaks(decodeHtmlEntities(about.bio))}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-sm">
                      {about.location && (
                        <div className="bg-white/80 dark:bg-gray-700/60 p-4 rounded-lg border border-slate-200 dark:border-slate-600">
                          <span className="font-semibold text-slate-700 dark:text-slate-200">Location:</span>
                          <span className="text-slate-600 dark:text-slate-300 ml-2">{decodeHtmlEntities(about.location)}</span>
                        </div>
                      )}
                      {about.email && (
                        <div className="bg-white/80 dark:bg-gray-700/60 p-4 rounded-lg border border-slate-200 dark:border-slate-600">
                          <span className="font-semibold text-slate-700 dark:text-slate-200">Email:</span>
                          <span className="text-slate-600 dark:text-slate-300 ml-2 break-all">{about.email}</span>
                        </div>
                      )}
                      {about.phone && (
                        <div className="bg-white/80 dark:bg-gray-700/60 p-4 rounded-lg border border-slate-200 dark:border-slate-600">
                          <span className="font-semibold text-slate-700 dark:text-slate-200">Phone:</span>
                          <span className="text-slate-600 dark:text-slate-300 ml-2">{about.phone}</span>
                        </div>
                      )}
                    </div>

                    {about.social_links && Object.keys(about.social_links).length > 0 && (
                      <div className="bg-white/80 dark:bg-gray-700/60 p-4 sm:p-6 rounded-lg border border-slate-200 dark:border-slate-600">
                        <h4 className="font-semibold mb-4 text-slate-700 dark:text-slate-200">Social Links</h4>
                        <div className="flex flex-wrap gap-2 sm:gap-3">
                          {Object.entries(about.social_links).map(([platform, url]) => (
                            <a
                              key={platform}
                              href={ensureHttpsProtocol(url as string)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 px-3 py-2 rounded-lg transition-colors duration-200 capitalize font-medium"
                            >
                              {platform}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </AdminLayout>
    </div>
  );
}

// Social Links Editor Component
interface SocialLink {
  platform: string;
  url: string;
}

interface SocialLinksEditorProps {
  socialLinks: SocialLink[];
  onChange: (socialLinks: SocialLink[]) => void;
}

function SocialLinksEditor({ socialLinks, onChange }: SocialLinksEditorProps) {
  const addSocialLink = () => {
    onChange([...socialLinks, { platform: '', url: '' }]);
  };

  const removeSocialLink = (index: number) => {
    onChange(socialLinks.filter((_, i) => i !== index));
  };

  const updateSocialLink = (index: number, field: keyof SocialLink, value: string) => {
    const updated = socialLinks.map((link, i) => 
      i === index ? { ...link, [field]: value } : link
    );
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-slate-700 dark:text-slate-200 font-medium flex items-center gap-2">
          <ExternalLink className="w-4 h-4 text-slate-500" />
          Social Links
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addSocialLink}
          className="h-8 px-3 text-xs border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Link
        </Button>
      </div>
      
      {socialLinks.length === 0 ? (
        <div className="text-sm text-slate-500 dark:text-slate-400 text-center py-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
          No social links added. Click "Add Link" to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {socialLinks.map((link, index) => (
            <div key={index} className="flex gap-2 items-end">
              <div className="flex-1">
                <Input
                  placeholder="Platform (e.g., github, linkedin, twitter)"
                  value={link.platform}
                  onChange={(e) => updateSocialLink(index, 'platform', e.target.value)}
                  className="h-10 text-sm border-slate-300 dark:border-slate-600 focus:border-slate-500 dark:focus:border-slate-400 bg-white dark:bg-gray-700"
                />
              </div>
              <div className="flex-1">
                <Input
                  placeholder="URL (e.g., https://github.com/username)"
                  value={link.url}
                  onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                  className="h-10 text-sm border-slate-300 dark:border-slate-600 focus:border-slate-500 dark:focus:border-slate-400 bg-white dark:bg-gray-700"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeSocialLink(index)}
                className="h-10 w-10 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Add your social media links. Platform names like "github", "linkedin", "twitter" will be used as identifiers. URLs will automatically include "https://" if missing.
      </p>
    </div>
  );
}