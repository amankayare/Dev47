import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Eye, Github, Terminal, Globe, Star, Award, Code, Cloud, Database, Layers, Server, Cpu, Monitor, Smartphone, Palette, Zap, Shield, Settings } from "lucide-react";
import { ensureHttpsProtocol } from "@/utils/urlUtils";
import { formatTextWithLineBreaks, decodeHtmlEntities } from "@/utils/textUtils";

// Use public folder assets
const professionaImage = "/Professional-summary.jpg";
const resumePdf = "/Aman Resume.pdf";

interface AboutData {
  name: string;
  headline: string;
  bio: string;
  photo?: string;
  cover_image?: string;
  location: string;
  email: string;
  phone: string;
  resume_url?: string;
  social_links: Record<string, string>;
}

interface TechnicalSkill {
  id: number;
  title: string;
  skills: string[];
  color: string;
  icon: string;
}

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

const DynamicAboutContent = () => {
  const {
    data: about,
    isLoading: aboutLoading,
    error: aboutError,
  } = useQuery({
    queryKey: ["/api/about/"],
    queryFn: async (): Promise<AboutData> => {
      const response = await fetch("/api/about/");
      if (!response.ok) throw new Error("Failed to fetch about data");
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: certifications, isLoading: certificationsLoading } = useQuery({
    queryKey: ["/api/certifications/"],
    queryFn: async (): Promise<Certification[]> => {
      const response = await fetch("/api/certifications/");
      if (!response.ok) throw new Error("Failed to fetch certifications");
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: technicalExpertise, isLoading: techSkillsLoading } = useQuery({
    queryKey: ["/api/technical-skills/"],
    queryFn: async (): Promise<TechnicalSkill[]> => {
      const response = await fetch("/api/technical-skills/");
      if (!response.ok) throw new Error("Failed to fetch technical skills");
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Enhanced icon mapping for technical skills with vibrant gradient backgrounds
  const getIconAndColor = (iconName: string, title?: string) => {
    // Debug logging (can be removed in production)
    console.log(`Icon mapping for: title="${title}", iconName="${iconName}"`);
    
    // First check if the title provides specific context - this ensures Backend Development gets Server icon
    if (title?.toLowerCase().includes('backend')) {
      console.log('Using Server icon for Backend Development');
      return {
        icon: <Server className="w-8 h-8 text-white" />,
        color: 'from-indigo-500 to-purple-600'
      };
    }
    if (title?.toLowerCase().includes('devops') || title?.toLowerCase().includes('cloud')) {
      console.log('Using Cloud icon for DevOps/Cloud');
      return {
        icon: <Cloud className="w-8 h-8 text-white" />,
        color: 'from-blue-500 to-cyan-500'
      };
    }

    // Then check icon name mappings
    switch (iconName?.toLowerCase()) {
      // Backend & Server Icons
      case 'terminal':
        console.log('Terminal icon mapped to Server');
        return {
          icon: <Server className="w-8 h-8 text-white" />,
          color: 'from-indigo-500 to-purple-600'
        };
      case 'backend':
      case 'backend development':
        return {
          icon: <Server className="w-8 h-8 text-white" />,
          color: 'from-indigo-500 to-purple-600'
        };
      case 'server':
        return {
          icon: <Server className="w-8 h-8 text-white" />,
          color: 'from-indigo-500 to-purple-600'
        };
      case 'database':
        return {
          icon: <Database className="w-8 h-8 text-white" />,
          color: 'from-green-500 to-emerald-600'
        };
      
      // DevOps & Cloud Icons
      case 'globe':
        console.log('Globe icon mapped to Cloud');
        return {
          icon: <Cloud className="w-8 h-8 text-white" />,
          color: 'from-blue-500 to-cyan-500'
        };
      case 'cloud':
      case 'devops':
      case 'devops & cloud':
        return {
          icon: <Cloud className="w-8 h-8 text-white" />,
          color: 'from-blue-500 to-cyan-500'
        };
      case 'settings':
      case 'infrastructure':
        return {
          icon: <Settings className="w-8 h-8 text-white" />,
          color: 'from-gray-500 to-slate-600'
        };
      case 'cpu':
      case 'performance':
        return {
          icon: <Cpu className="w-8 h-8 text-white" />,
          color: 'from-orange-500 to-red-600'
        };
      
      // Frontend & Development Icons
      case 'code':
      case 'frontend':
      case 'development':
        return {
          icon: <Code className="w-8 h-8 text-white" />,
          color: 'from-purple-500 to-pink-600'
        };
      case 'layers':
      case 'fullstack':
        return {
          icon: <Layers className="w-8 h-8 text-white" />,
          color: 'from-teal-500 to-green-600'
        };
      case 'monitor':
      case 'web':
        return {
          icon: <Monitor className="w-8 h-8 text-white" />,
          color: 'from-blue-500 to-indigo-600'
        };
      case 'smartphone':
      case 'mobile':
        return {
          icon: <Smartphone className="w-8 h-8 text-white" />,
          color: 'from-pink-500 to-rose-600'
        };
      case 'palette':
      case 'design':
      case 'ui':
        return {
          icon: <Palette className="w-8 h-8 text-white" />,
          color: 'from-yellow-500 to-orange-600'
        };
      
      // Security & Other Icons
      case 'shield':
      case 'security':
        return {
          icon: <Shield className="w-8 h-8 text-white" />,
          color: 'from-red-500 to-pink-600'
        };
      case 'zap':
      case 'optimization':
        return {
          icon: <Zap className="w-8 h-8 text-white" />,
          color: 'from-yellow-500 to-amber-600'
        };
      
      // Default fallback
      default:
        console.log(`Using default Code icon for: ${iconName}`);
        return {
          icon: <Code className="w-8 h-8 text-white" />,
          color: 'from-purple-500 to-blue-600'
        };
    }
  };

  if (aboutLoading || techSkillsLoading) {
    return (
      <div className="hero-grid hero-squares p-4 sm:p-8 lg:px-16 xl:px-20 vs-scrollbar overflow-auto h-full">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">
                Loading about information...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (aboutError || !about) {
    return (
      <div className="hero-grid hero-squares p-4 sm:p-8 lg:px-16 xl:px-20 vs-scrollbar overflow-auto h-full">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-500 mb-2">
                Failed to load about information
              </p>
              <p className="text-muted-foreground text-sm">
                Please check your connection and try again
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hero-grid hero-squares p-4 sm:p-8 lg:px-16 xl:px-20 vs-scrollbar overflow-auto h-full">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl lg:text-4xl font-bold mb-8 lg:mb-12 text-foreground flex items-center">
          <User className="mr-4 text-primary flex-shrink-0" />
          About Me
        </h1>

        {/* Main About Section with Image and Professional Summary */}
        <div className="hero-grid grid lg:grid-cols-2 gap-8 lg:gap-12 mb-12 lg:mb-16">
          <div>
            <div className="w-full h-[300px] sm:h-[400px] gradient-bg rounded-2xl shadow-2xl relative flex items-center justify-center overflow-hidden">
              <a href="http://www.freepik.com">
                <img
                  src={about.cover_image || professionaImage}
                  alt={about.name}
                  className="w-full h-full object-cover object-top rounded-2xl"
                />
              </a>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <h2 className="text-2xl lg:text-3xl font-semibold mb-6 text-foreground">
              Professional Summary
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p className="whitespace-pre-line">{formatTextWithLineBreaks(decodeHtmlEntities(about.bio))}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              {about.social_links.github && (
                <a
                  href={ensureHttpsProtocol(about.social_links.github)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="btn-enhanced rounded-lg">
                    <Github className="mr-2 h-4 w-4" />
                    GitHub Profile
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Technical Expertise Section */}
        <div className="mb-12 lg:mb-16">
          <h2 className="text-2xl md:text-[1.75rem] lg:text-3xl font-semibold mb-6 lg:mb-8 text-foreground">
            Technical Expertise
          </h2>
          <div className="skills-grid grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-7 lg:gap-8">
            {technicalExpertise && technicalExpertise.map((category) => {
              const { icon, color } = getIconAndColor(category.icon, category.title);
              return (
                <Card
                  key={category.title}
                  className="h-auto min-h-[18rem] md:min-h-[20rem] lg:min-h-[22rem] flex flex-col hover-lift rounded-lg shadow-md"
                >
                  <CardHeader>
                    <CardTitle className="flex items-center text-foreground text-lg md:text-base lg:text-lg font-semibold">
                      <div
                        className={`p-2 rounded-lg bg-gradient-to-r ${color} mr-3 shadow-lg`}
                      >
                        {icon}
                      </div>
                      {category.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-1 p-4 lg:p-6">
                    <ul className="space-y-3 flex-1">
                      {category.skills.map((skill) => (
                        <li
                          key={skill}
                          className="flex items-start text-muted-foreground text-sm md:text-[0.925rem] lg:text-base break-words leading-snug"
                        >
                          <Star className="w-4 h-4 text-primary mr-2 mt-1 flex-shrink-0" />
                          <span>{skill}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Education & Achievements Section */}
        <div>
          <h2 className="text-xl sm:text-2xl md:text-[1.75rem] lg:text-3xl font-semibold mb-5 sm:mb-6 lg:mb-8 text-foreground">
            Education & Achievements
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-7 lg:gap-8">
            {/* Hardcoded Education Card */}
            <Card className="flex flex-col h-full rounded-lg shadow-md hover-lift transition-all duration-300">
              <CardContent className="p-4 md:p-6 flex flex-col flex-1 justify-between">
                <div className="flex items-start">
                  <div className="gradient-bg p-3 rounded-lg mr-4 flex-shrink-0">
                    <Award className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-md md:text-base lg:text-lg text-foreground mb-1 leading-snug break-words">
                      Post Graduate Diploma in Advanced Computing (PG-DAC)
                    </h3>
                    <p className="text-primary font-medium mb-1 text-sm md:text-base">
                      Central Govt.
                    </p>
                    <p className="text-muted-foreground text-xs md:text-sm leading-snug">
                      2020 - 2021 | 77.6 Percentile
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dynamic Certification Cards */}
            {!certificationsLoading &&
              certifications &&
              certifications.filter(cert => cert.is_visible).slice(0, 2).map((cert) => (
                <Card
                  key={cert.id}
                  className="flex flex-col h-full rounded-lg shadow-md hover-lift transition-all duration-300"
                >
                  <CardContent className="p-4 md:p-6 flex flex-col flex-1 justify-between">
                    <div className="flex items-start">
                      <div className="gradient-bg p-3 rounded-lg mr-4 flex-shrink-0">
                        <Star className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-md md:text-base lg:text-lg text-foreground mb-1 leading-snug break-words">
                          {cert.name}
                        </h3>
                        <p className="text-primary font-medium mb-1 text-sm md:text-base">
                          {cert.issuer}
                        </p>
                        <p className="text-muted-foreground text-xs md:text-sm leading-snug">
                          {cert.date}{" "}
                          {cert.expiration_date &&
                            `| Valid until: ${cert.expiration_date}`}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicAboutContent;
