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

      return apiPut('/api/about/', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/about'] });
      toast({ title: 'Success', description: 'About information updated successfully.' });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update about information.',
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
        {/* Professional Header Section */}
        <div className="bg-gradient-to-r from-slate-700 via-slate-800 to-gray-900 dark:from-slate-800 dark:via-slate-900 dark:to-gray-950 text-white rounded-lg shadow-2xl mb-8 mx-2 sm:mx-0">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-white/10 dark:bg-white/5 p-3 rounded-lg backdrop-blur-sm">
                <UserIcon className="w-8 h-8 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">About Profile Management</h1>
                <p className="text-slate-200 dark:text-slate-100 mt-2 text-sm sm:text-base">Manage your personal information, bio, and profile details</p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              <div className="bg-white/10 dark:bg-white/5 rounded-lg p-3 sm:p-4 backdrop-blur-sm">
                <div className="text-xl sm:text-2xl font-bold mb-1">{about?.name ? '1' : '0'}</div>
                <div className="text-slate-200 dark:text-slate-100 text-xs sm:text-sm">Profile Configured</div>
              </div>
              <div className="bg-white/10 dark:bg-white/5 rounded-lg p-3 sm:p-4 backdrop-blur-sm">
                <div className="text-xl sm:text-2xl font-bold mb-1">{about?.photo ? 'Yes' : 'No'}</div>
                <div className="text-slate-200 dark:text-slate-100 text-xs sm:text-sm">Profile Photo</div>
              </div>
              <div className="bg-white/10 dark:bg-white/5 rounded-lg p-3 sm:p-4 backdrop-blur-sm">
                <div className="text-xl sm:text-2xl font-bold mb-1">{about?.cover_image ? 'Yes' : 'No'}</div>
                <div className="text-slate-200 dark:text-slate-100 text-xs sm:text-sm">Cover Image</div>
              </div>
              <div className="bg-white/10 dark:bg-white/5 rounded-lg p-3 sm:p-4 backdrop-blur-sm">
                <div className="text-xl sm:text-2xl font-bold mb-1">{about?.social_links ? Object.keys(about.social_links).length : 0}</div>
                <div className="text-slate-200 dark:text-slate-100 text-xs sm:text-sm">Social Links</div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-6 xl:px-8">
          <div className="space-y-4 sm:space-y-6">
            <Card className="shadow-lg border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm mx-2 sm:mx-0">
              <CardHeader className="bg-gradient-to-r from-gray-50 via-slate-50 to-gray-100 dark:from-gray-700 dark:via-slate-700 dark:to-gray-600 border-b border-gray-200 dark:border-gray-600 p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100 text-lg sm:text-xl">
                  <UserIcon className="w-5 h-5" />
                  Personal Information
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300 text-sm sm:text-base">
                  Update your personal and professional information displayed on the portfolio.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 lg:p-8 bg-white/80 dark:bg-gray-800/80">
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

                  <div className="flex justify-end pt-6 border-t border-slate-200 dark:border-slate-600">
                    <Button
                      type="submit"
                      disabled={updateMutation.isPending}
                      className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 dark:from-slate-500 dark:to-slate-600 dark:hover:from-slate-600 dark:hover:to-slate-700 text-white font-medium px-8 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {about && (
              <Card className="shadow-lg border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm mx-2 sm:mx-0">
                <CardHeader className="bg-gradient-to-r from-gray-50 via-slate-50 to-gray-100 dark:from-gray-700 dark:via-slate-700 dark:to-gray-600 border-b border-gray-200 dark:border-gray-600 p-4 sm:p-6">
                  <CardTitle className="text-slate-800 dark:text-slate-100 text-lg sm:text-xl">Preview</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-300 text-sm sm:text-base">
                    This is how your information currently appears on the portfolio.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 lg:p-8 bg-white/80 dark:bg-gray-800/80">
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