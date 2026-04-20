import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { FolderOpen, ExternalLink, Github, Eye, Zap, Globe, Terminal } from "lucide-react";

interface Project {
  id: number;
  title: string;
  description: string;
  tech: string[];
  links?: Array<{name: string, url: string}>;
  image?: string;
  project_type?: string;
  start_date?: string;
  end_date?: string;
  is_visible: boolean;
  is_featured: boolean;
  order: number;
  created_at?: string;
}

interface DynamicFeaturedProjectsProps {
  onViewAllClick: () => void;
}

const DynamicFeaturedProjects = ({ onViewAllClick }: DynamicFeaturedProjectsProps) => {
  // Fetch featured projects from API
  const { data: featuredProjects = [], isLoading: featuredLoading, error } = useQuery({
    queryKey: ['/api/projects/featured'],
    queryFn: async (): Promise<Project[]> => {
      const response = await fetch('/api/projects/featured');
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to fetch featured projects');
      }
      const data = await response.json();
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  const getGradient = (index: number) => {
    const gradients = [
      "from-blue-500 to-purple-600",
      "from-green-500 to-teal-600", 
      "from-orange-500 to-red-600",
      "from-pink-500 to-rose-600",
      "from-indigo-500 to-blue-600",
      "from-yellow-500 to-orange-600",
    ];
    return gradients[index % gradients.length];
  };

  const getIcon = (index: number) => {
    const icons = [
      <Globe className="w-8 h-8 sm:w-12 sm:h-12 text-white" />,
      <Zap className="w-8 h-8 sm:w-12 sm:h-12 text-white" />,
      <Terminal className="w-8 h-8 sm:w-12 sm:h-12 text-white" />,
      <FolderOpen className="w-8 h-8 sm:w-12 sm:h-12 text-white" />,
    ];
    return icons[index % icons.length];
  };

  if (featuredLoading) {
    return (
      <div className="mb-16 lg:mb-24">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 lg:mb-12 gap-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground flex items-center">
            <Zap className="mr-4 text-primary flex-shrink-0" />
            Featured Projects
          </h2>
          <Button
            variant="outline"
            className="btn-enhanced rounded-lg shadow-md"
            onClick={onViewAllClick}
          >
            View All <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-16 lg:mb-24">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 lg:mb-12 gap-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground flex items-center">
            <Zap className="mr-4 text-primary flex-shrink-0" />
            Featured Projects
          </h2>
          <Button
            variant="outline"
            className="btn-enhanced rounded-lg shadow-md"
            onClick={onViewAllClick}
          >
            View All <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </div>
        <div className="text-center py-8">
          <p className="text-red-500 mb-2">Failed to load featured projects</p>
          <p className="text-muted-foreground text-sm">Please check your connection and try again</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-16 lg:mb-24">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 lg:mb-12 gap-4">
        <h2 className="text-3xl lg:text-4xl font-bold text-foreground flex items-center">
          <Zap className="mr-4 text-primary flex-shrink-0" />
          Featured Projects
        </h2>
        <Button
          variant="outline"
          className="btn-enhanced rounded-lg shadow-md"
          onClick={onViewAllClick}
        >
          View All <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {featuredProjects.length === 0 ? (
        <div className="text-center py-12">
          <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No featured projects</h3>
          <p className="text-muted-foreground">Featured projects will appear here when available</p>
        </div>
      ) : (
        <div className="projects-grid grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-7 lg:gap-8">
          {featuredProjects.map((project, index) => (
            <Card
              key={project.id}
              className="h-auto min-h-[380px] flex flex-col overflow-hidden group rounded-lg hover-lift cursor-pointer transition-all duration-300 shadow-lg"
            >
              <div className={`w-full h-48 bg-gradient-to-br ${getGradient(index)} flex items-center justify-center relative overflow-hidden`}>
                {project.image ? (
                  <img 
                    src={project.image} 
                    alt={project.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getIcon(index)
                )}
                {project.project_type && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-white/20 text-white border-white/30 rounded-lg">
                      {project.project_type}
                    </Badge>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
              </div>
              <CardContent className="p-4 lg:p-6 flex flex-col flex-1 overflow-hidden">
                <h3 className="text-base md:text-lg lg:text-xl font-semibold mb-3 text-foreground group-hover:text-primary transition-colors leading-snug">
                  {project.title}
                </h3>
                <p className="text-muted-foreground text-sm md:text-[0.95rem] leading-snug mb-3 break-words flex-grow">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-x-1 gap-y-0.5 mb-4">
                  {project.tech?.map((tech) => (
                    <Badge
                      key={tech}
                      variant="secondary"
                      className="text-[0.7rem] px-2 py-1 rounded-md m-0.5 hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      {tech}
                    </Badge>
                  ))}
                </div>
                {project.links && project.links.length > 0 && (
                  <div className="flex gap-2 mt-auto">
                    {project.links.map((link, linkIndex) => (
                      <Button
                        key={linkIndex}
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs hover:bg-primary hover:text-primary-foreground border-border text-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(link.url, '_blank');
                        }}
                      >
                        {link.name.toLowerCase().includes('github') ? (
                          <Github className="mr-2 h-3 w-3" />
                        ) : link.name.toLowerCase().includes('demo') || link.name.toLowerCase().includes('live') ? (
                          <ExternalLink className="mr-2 h-3 w-3" />
                        ) : (
                          <Eye className="mr-2 h-3 w-3" />
                        )}
                        {link.name}
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DynamicFeaturedProjects;
