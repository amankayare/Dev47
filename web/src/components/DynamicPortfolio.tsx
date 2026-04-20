import { useState, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { FolderOpen, Search, ExternalLink, Github, Eye, Calendar } from "lucide-react";

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

interface AboutData {
  name: string;
  headline: string;
  bio: string;
  photo: string;
  location: string;
  email: string;
  phone: string;
  social_links: Record<string, string>;
}

type ProjectsContentProps = {
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
};

const DynamicProjectsContent = ({ searchQuery, setSearchQuery }: ProjectsContentProps) => {
  // Fetch projects from API
  const { data: projects = [], isLoading: projectsLoading, error } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: async (): Promise<Project[]> => {
      const response = await fetch('/api/projects');
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to fetch projects');
      }
      const data = await response.json();
      // Filter out non-visible projects if not in admin view
      return data.filter((project: Project) => project.is_visible);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2, // Retry failed requests twice before showing an error
  });

  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    
    return projects.filter(
      (project) =>
        searchQuery === "" ||
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.tech && project.tech.some((t) =>
          t.toLowerCase().includes(searchQuery.toLowerCase())
        ))
    );
  }, [projects, searchQuery]);

  const getGradient = (index: number) => {
    const gradients = [
      "from-blue-500 to-purple-600",
      "from-green-500 to-teal-600", 
      "from-orange-500 to-red-600",
      "from-purple-500 to-pink-600",
      "from-cyan-500 to-blue-600",
      "from-yellow-500 to-orange-600"
    ];
    return gradients[index % gradients.length];
  };

  if (projectsLoading) {
    return (
      <div className="p-4 sm:p-8 lg:px-16 xl:px-20 vs-scrollbar overflow-auto h-full">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading projects...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-8 lg:px-16 xl:px-20 vs-scrollbar overflow-auto h-full">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-500 mb-2">Failed to load projects</p>
              <p className="text-muted-foreground text-sm">Please check your connection and try again</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hero-squares p-4 sm:p-8 lg:px-16 xl:px-20 vs-scrollbar overflow-auto h-full">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 lg:mb-12 gap-4">
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground flex items-center">
            <FolderOpen className="mr-4 text-primary flex-shrink-0" />
            Projects ({filteredProjects.length})
          </h1>
          <div className="w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full sm:w-64 rounded-lg"
              />
            </div>
          </div>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No projects found</h3>
            <p className="text-muted-foreground">
              {searchQuery ? "Try adjusting your search terms" : "Projects will appear here when available"}
            </p>
          </div>
        ) : (
          <div className="projects-grid grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-7 lg:gap-8">
            {filteredProjects.map((project, index) => (
              <Card
                key={project.id}
                className="h-auto min-h-[460px] flex flex-col overflow-hidden hover:shadow-2xl hover-lift rounded-lg transition-all duration-300"
              >
                <div className={`w-full h-48 bg-gradient-to-br ${getGradient(index)} flex items-center justify-center relative overflow-hidden`}>
                  <FolderOpen className="w-12 h-12 lg:w-16 lg:h-16 text-white" />
                  {project.project_type && (
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-white/20 text-white border-white/30 rounded-lg">
                        {project.project_type}
                      </Badge>
                    </div>
                  )}
                  {project.start_date && (
                    <div className="absolute bottom-4 left-4">
                      <Badge className="bg-black/20 text-white border-white/30 rounded-lg text-xs">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(project.start_date).getFullYear()}
                      </Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-4 lg:p-6 flex flex-col flex-1 overflow-hidden">
                  <h3 className="text-base md:text-lg lg:text-xl font-semibold mb-3 text-foreground line-clamp-1">
                    {project.title}
                  </h3>
                  <p className="text-muted-foreground text-sm md:text-[0.95rem] leading-snug break-words flex-shrink-0 line-clamp-3 mb-6">
                    {project.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5 mb-6">
                    {project.tech && project.tech.slice(0, 4).map((tech) => (
                      <Badge
                        key={tech}
                        variant="secondary"
                        className="text-[0.7rem] px-2 py-1 rounded-md m-0.5"
                      >
                        {tech}
                      </Badge>
                    ))}
                    {project.tech && project.tech.length > 4 && (
                      <Badge
                        variant="secondary"
                        className="text-[0.7rem] px-2 py-1 rounded-md m-0.5"
                      >
                        +{project.tech.length - 4}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-3 mt-auto">
                    {project.links && project.links.map((link, linkIndex) => (
                      <Button
                        key={linkIndex}
                        size="sm"
                        variant={link.name.toLowerCase().includes('github') ? "outline" : "default"}
                        className={`rounded-lg flex-1 py-2 ${
                          link.name.toLowerCase().includes('github') 
                            ? "border-border text-foreground hover:bg-primary hover:text-primary-foreground" 
                            : "bg-primary text-primary-foreground hover:bg-primary/90"
                        }`}
                        onClick={() => window.open(link.url, '_blank')}
                      >
                        {link.name.toLowerCase().includes('github') ? (
                          <Github className="mr-2 h-4 w-4" />
                        ) : link.name.toLowerCase().includes('demo') || link.name.toLowerCase().includes('live') ? (
                          <ExternalLink className="mr-2 h-4 w-4" />
                        ) : (
                          <Eye className="mr-2 h-4 w-4" />
                        )}
                        {link.name}
                      </Button>
                    ))}
                    {(!project.links || project.links.length === 0) && (
                      <Button
                        size="sm"
                        className="bg-muted text-muted-foreground rounded-lg flex-1 py-2 cursor-not-allowed"
                        disabled
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Project
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DynamicProjectsContent;