import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Calendar, ExternalLink, Globe, Code, Terminal, Star, Briefcase } from "lucide-react";

interface Certification {
  id: number;
  name: string;
  issuer: string;
  date: string;
  credential_url?: string;
  image?: string;
  description?: string;
  skills?: string[];
  certificate_id?: string;
  expiration_date?: string;
  is_visible: boolean;
}

const DynamicCertificationsContent = () => {
  const { data: certifications = [], isLoading, error } = useQuery({
    queryKey: ['/api/certifications/'],
    queryFn: async (): Promise<Certification[]> => {
      const response = await fetch('/api/certifications/');
      if (!response.ok) throw new Error('Failed to fetch certifications');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const getGradient = (index: number) => {
    const gradients = [
      "from-orange-500 to-yellow-500",
      "from-blue-500 to-green-500", 
      "from-purple-500 to-blue-600",
      "from-green-600 to-teal-600",
      "from-blue-600 to-purple-600",
      "from-red-500 to-orange-600"
    ];
    return gradients[index % gradients.length];
  };

  const getIcon = (index: number) => {
    const icons = [
      <Globe className="w-8 h-8 text-white" />,
      <Code className="w-8 h-8 text-white" />,
      <Terminal className="w-8 h-8 text-white" />,
      <Star className="w-8 h-8 text-white" />,
      <Code className="w-8 h-8 text-white" />,
      <Briefcase className="w-8 h-8 text-white" />
    ];
    return icons[index % icons.length];
  };

  if (isLoading) {
    return (
      <div className="hero-squares p-4 sm:p-8 lg:px-16 xl:px-20 vs-scrollbar overflow-auto h-full">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading certifications...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="hero-squares p-4 sm:p-8 lg:px-16 xl:px-20 vs-scrollbar overflow-auto h-full">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-500 mb-2">Failed to load certifications</p>
              <p className="text-muted-foreground text-sm">Please check your connection and try again</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (certifications.length === 0) {
    return (
      <div className="hero-squares p-4 sm:p-8 lg:px-16 xl:px-20 vs-scrollbar overflow-auto h-full">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl lg:text-4xl font-bold mb-8 lg:mb-12 text-foreground flex items-center">
            <Award className="mr-4 text-primary flex-shrink-0" />
            Certifications & Achievements
          </h1>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Award className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No certifications available yet</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hero-squares p-4 sm:p-8 lg:px-16 xl:px-20 vs-scrollbar overflow-auto h-full">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl lg:text-4xl font-bold mb-8 lg:mb-12 text-foreground flex items-center">
          <Award className="mr-4 text-primary flex-shrink-0" />
          Certifications & Achievements ({certifications.length})
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-7 lg:gap-8">
          {certifications.filter(cert => cert.is_visible).map((cert, index) => (
            <Card
              key={cert.id}
              className="h-auto flex flex-col justify-between overflow-hidden rounded-lg hover:shadow-xl transition-all duration-300"
            >
              <div className={`h-3 bg-gradient-to-r ${getGradient(index)}`} />
              <CardContent className="p-4 lg:p-6 flex flex-col flex-1">
                <div className="flex items-start mb-4">
                  <div
                    className={`p-3 rounded-lg bg-gradient-to-r ${getGradient(index)} mr-4 flex-shrink-0`}
                  >
                    {getIcon(index)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base md:text-lg lg:text-xl font-semibold text-foreground mb-2 leading-snug line-clamp-2">
                      {cert.name}
                    </h3>
                    <p className="text-primary font-medium mb-1 text-sm lg:text-base">
                      {cert.issuer}
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center text-xs lg:text-sm text-muted-foreground gap-1">
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {cert.date}
                      </span>
                      {cert.expiration_date && (
                        <>
                          <span className="hidden sm:block">•</span>
                          <span className="text-green-600 font-medium">
                            Valid until {new Date(cert.expiration_date).getFullYear()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {cert.description && (
                  <p className="text-muted-foreground text-sm md:text-[0.95rem] leading-snug mb-4 flex-shrink-0 line-clamp-3 break-words">
                    {cert.description}
                  </p>
                )}

                {cert.skills && cert.skills.length > 0 && (
                  <div className="mb-2 sm:mb-3">
                    <h4 className="font-medium text-foreground mb-2 text-sm">
                      Key Skills
                    </h4>
                    <div className="flex flex-wrap gap-x-1 gap-y-0.5">
                      {cert.skills.map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="text-[0.7rem] px-2 py-1 rounded-md m-0.5"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {cert.credential_url && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="btn-enhanced rounded-lg w-full sm:w-auto mt-2"
                    onClick={() => window.open(cert.credential_url, '_blank')}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Verify Certificate
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DynamicCertificationsContent;