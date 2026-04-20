import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, MapPin, Calendar, Terminal, Award, Star, Zap } from "lucide-react";

interface Experience {
  id: number;
  title: string;
  company: string;
  location: string;
  period: string;
  duration: string;
  responsibilities?: string[] | null; // Made optional with null possibility
  achievements?: string[] | null; // Made optional with null possibility
  technologies?: string[] | null; // Made optional with null possibility
  color: string;
  order: number;
  is_visible: boolean;
}

const DynamicExperienceContent = () => {
  const { data: experiences, isLoading, error } = useQuery({
    queryKey: ['/api/experiences/'],
    queryFn: async (): Promise<Experience[]> => {
      const response = await fetch('/api/experiences/');
      if (!response.ok) throw new Error('Failed to fetch experiences');
      const data = await response.json();
      // Ensure we always return an array
      return Array.isArray(data) ? data : [];
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="hero-squares p-4 sm:p-8 lg:px-16 xl:px-20 vs-scrollbar overflow-auto h-full">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading work experience...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !experiences) {
    return (
      <div className="hero-squares p-4 sm:p-8 lg:px-16 xl:px-20 vs-scrollbar overflow-auto h-full">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-500 mb-2">Failed to load work experience</p>
              <p className="text-muted-foreground text-sm">Please check your connection and try again</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hero-squares p-4 sm:p-8 lg:px-16 xl:px-20 vs-scrollbar overflow-auto h-full">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl lg:text-4xl font-bold mb-8 lg:mb-12 text-foreground flex items-center">
          <Briefcase className="mr-4 text-primary flex-shrink-0" />
          Work Experience
        </h1>

        {(!experiences || experiences.length === 0) ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">No work experience found</p>
              <p className="text-muted-foreground text-sm">Experience data will appear here when available</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8 lg:space-y-12">
            {(experiences || []).map((experience) => (
            <Card
              key={experience.id}
              className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover-lift rounded-lg"
            >
              <div className={`h-2 bg-gradient-to-r ${experience.color}`} />
              <CardContent className="p-6 lg:p-8">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6 gap-4">
                  <div className="flex-1">
                    <div className="flex items-start mb-4">
                      <div
                        className={`p-2 rounded-lg bg-gradient-to-r ${experience.color} mr-3 flex-shrink-0`}
                      >
                        <Briefcase className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl lg:text-2xl font-semibold text-foreground">
                          {experience.title}
                        </h3>
                        <p className="text-primary font-medium text-lg">
                          {experience.company}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center text-muted-foreground mb-4 gap-2">
                      <span className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        {experience.location}
                      </span>
                      <span className="hidden sm:block">•</span>
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {experience.duration}
                      </span>
                    </div>
                  </div>
                  <div className="lg:mt-0">
                    <Badge
                      className={`bg-gradient-to-r ${experience.color} text-white px-4 py-2 rounded-lg`}
                    >
                      {experience.period}
                    </Badge>
                  </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
                  {/* Responsibilities Section - Only show if there are responsibilities */}
                  {(experience.responsibilities && experience.responsibilities.length > 0) && (
                    <div>
                      <h4 className="font-semibold text-foreground mb-4 flex items-center">
                        <Terminal className="w-4 h-4 mr-2 text-primary" />
                        Key Responsibilities
                      </h4>
                      <ul className="space-y-2">
                        {(experience.responsibilities || []).map((responsibility, idx) => (
                          <li
                            key={idx}
                            className="text-muted-foreground text-sm flex items-start"
                          >
                            <Star className="w-3 h-3 text-primary mr-2 mt-1 flex-shrink-0" />
                            {responsibility}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Achievements and Technologies Section */}
                  <div>
                    {/* Achievements - Only show if there are achievements */}
                    {(experience.achievements && experience.achievements.length > 0) && (
                      <>
                        <h4 className="font-semibold text-foreground mb-4 flex items-center">
                          <Award className="w-4 h-4 mr-2 text-primary" />
                          Key Achievements
                        </h4>
                        <ul className="space-y-2 mb-6">
                          {(experience.achievements || []).map((achievement, idx) => (
                            <li
                              key={idx}
                              className="text-muted-foreground text-sm flex items-start"
                            >
                              <Zap className="w-3 h-3 text-primary mr-2 mt-1 flex-shrink-0" />
                              {achievement}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}

                    {/* Technologies - Only show if there are technologies */}
                    {(experience.technologies && experience.technologies.length > 0) && (
                      <div>
                        <h5 className="font-medium text-foreground mb-5">
                          Technologies Used
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {(experience.technologies || []).map((tech) => (
                            <Badge
                              key={tech}
                              variant="secondary"
                              className="text-xs rounded-lg"
                            >
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
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

export default DynamicExperienceContent;