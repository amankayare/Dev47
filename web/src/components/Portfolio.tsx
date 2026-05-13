import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "@/hooks/use-theme";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import AnimatedGreeting from "./AnimatedGreeting";
import DynamicFeaturedProjects from "./DynamicFeaturedProjects";

import { z } from "zod";

// Use public folder assets
const userImage = "/aman.jpg";
const professionaImage = "/Professional-summary.jpg";
const resumeAman = "/Aman Resume.pdf";
import {
  Home,
  User,
  FolderOpen,
  Briefcase,
  Award,
  BookOpen,
  Mail,
  X,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Github,
  ExternalLink,
  Download,
  Search,
  Phone,
  MapPin,
  Youtube,
  Linkedin,
  Send,
  FileText,
  Code,
  Terminal,
  Zap,
  Eye,
  Star,
  Play,
  Globe,
  Calendar,
  MapPin as Location,
  Mail as Email,
  Menu,
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { normalizeSocialLinks } from "@/utils/urlUtils";
import { formatTextWithLineBreaks, decodeHtmlEntities } from "@/utils/textUtils";
// Contact form schema will be imported from ContactForm component
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ContactForm } from "./ContactFormSimple";
import DynamicProjectsContent from "./DynamicPortfolio";
import DynamicAboutContent from "./DynamicAbout";
import DynamicCertificationsContent from "./DynamicCertifications";
import DynamicBlogsContent from "./DynamicBlogs";
import DynamicExperienceContent from "./DynamicExperience";

type TabType =
  | "home"
  | "about"
  | "projects"
  | "experience"
  | "certifications"
  | "blog"
  | "contact"
  | "resume";

// Defined outside component so it's a stable reference — prevents useEffect from
// re-running on every render and reverting the active tab via handleHashChange.
const tabConfig: Record<TabType, { name: string; icon: React.ElementType }> = {
  home: { name: "Home.jsx", icon: Home },
  about: { name: "About.jsx", icon: User },
  experience: { name: "Experience.jsx", icon: Briefcase },
  projects: { name: "Projects.jsx", icon: FolderOpen },
  certifications: { name: "Certifications.jsx", icon: Award },
  resume: { name: "Resume.pdf", icon: FileText },
  blog: { name: "Blogs.jsx", icon: BookOpen },
  contact: { name: "Contact.jsx", icon: Mail },
};

// About data interface for dynamic content
interface AboutData {
  id: number;
  name: string;
  headline?: string;
  bio: string;
  photo?: string;
  cover_image?: string;
  location?: string;
  email?: string;
  phone?: string;
  birthday?: string;
  resume_url?: string;
  social_links?: Record<string, string>;
}

// ContactFormValues type will be defined in ContactForm component

type ProjectsContentProps = {
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
};

const ProjectsContent = ({
  searchQuery,
  setSearchQuery,
}: ProjectsContentProps) => {
  const projects = [
    // {
    //   title: "ShopFlow - E-Commerce Platform",
    //   description:
    //     "A comprehensive e-commerce solution with user authentication, payment processing, inventory management, and analytics dashboard. Built with modern technologies for scalability and performance.",
    //   tech: ["React", "Node.js", "MongoDB", "Stripe", "Redis", "AWS"],
    //   gradient: "from-blue-500 to-purple-600",
    //   category: "Full Stack",
    // },
    // {
    //   title: "TaskMaster - Project Management",
    //   description:
    //     "A collaborative project management tool with Kanban boards, time tracking, team collaboration features, and real-time updates using WebSocket technology.",
    //   tech: ["React", "Express", "Socket.io", "PostgreSQL", "Docker"],
    //   gradient: "from-green-500 to-teal-600",
    //   category: "SaaS",
    // },
    // {
    //   title: "WeatherVue - Forecast App",
    //   description:
    //     "A responsive weather application with location-based forecasts, weather maps, severe weather alerts, and beautiful data visualizations.",
    //   tech: ["Vue.js", "OpenWeather API", "Chart.js", "PWA", "Tailwind"],
    //   gradient: "from-cyan-500 to-blue-600",
    //   category: "Mobile App",
    // },
    // {
    //   title: "SocialSync - Analytics Dashboard",
    //   description:
    //     "A comprehensive social media analytics platform that aggregates data from multiple platforms and provides insights with interactive charts and automated reporting.",
    //   tech: ["Python", "Django", "D3.js", "Redis", "Celery", "PostgreSQL"],
    //   gradient: "from-orange-500 to-red-600",
    //   category: "Analytics",
    // },
    // {
    //   title: "CodeCollab - Development Platform",
    //   description:
    //     "A real-time collaborative coding platform with integrated chat, video calls, and project management tools for remote development teams.",
    //   tech: ["React", "Node.js", "Socket.io", "Monaco Editor", "WebRTC"],
    //   gradient: "from-purple-500 to-pink-600",
    //   category: "Developer Tools",
    // },
    {
      title: "FinanceTracker - Personal Finance",
      description:
        "A personal finance management application with expense tracking, budget planning, investment portfolio management, and financial goal setting.",
      tech: ["Dot Net", "C#", "Rest API", "HTML", "CSS"],
      gradient: "from-yellow-500 to-orange-600",
      category: "Personal App",
    },
  ];

  const filteredProjects = projects.filter(
    (project) =>
      searchQuery === "" ||
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.tech.some((t) =>
        t.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
  );

  return (
    <div className="hero-squares p-4 sm:p-8 lg:px-16 xl:px-20 vs-scrollbar overflow-auto h-full">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 lg:mb-12 gap-4">
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground flex items-center">
            <FolderOpen className="mr-4 text-primary flex-shrink-0" />
            Projects
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

        <div className="projects-grid grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-7 lg:gap-8">
          {filteredProjects.map((project, index) => (
            <Card
              key={index}
              className="h-auto min-h-[460px] flex flex-col overflow-hidden hover:shadow-2xl hover-lift rounded-lg"
            >
              <div
                className={`w-full h-48 bg-gradient-to-br ${project.gradient} flex items-center justify-center relative overflow-hidden`}
              >
                <FolderOpen className="w-12 h-12 lg:w-16 lg:h-16 text-white" />
                <div className="absolute top-4 right-4">
                  <Badge className="bg-white/20 text-white border-white/30 rounded-lg">
                    {project.category}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4 lg:p-6 flex flex-col flex-1 overflow-hidden">
                <h3 className="text-base md:text-lg lg:text-xl font-semibold mb-3 text-foreground line-clamp-1">
                  {project.title}
                </h3>
                <p className="text-muted-foreground text-sm md:text-[0.95rem] leading-snug break-words flex-shrink-0 line-clamp-3 mb-6">
                  {project.description}
                </p>
                <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5 mb-6">
                  {project.tech.slice(0, 3).map((tech) => (
                    <Badge
                      key={tech}
                      variant="secondary"
                      className="text-[0.7rem] px-2 py-1 rounded-md m-0.5"
                    >
                      {tech}
                    </Badge>
                  ))}
                  {project.tech.length > 3 && (
                    <Badge
                      variant="secondary"
                      className="text-[0.7rem] px-2 py-1 rounded-md m-0.5"
                    >
                      +{project.tech.length - 3}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-3 mt-auto">
                  <Button
                    size="sm"
                    className="bg-primary text-white btn-enhanced rounded-lg flex-1 py-2"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Live Demo
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="btn-enhanced rounded-lg w-10 h-10 justify-center px-0 py-2 flex-shrink-0
             sm:flex-1 sm:px-3 sm:justify-center"
                  >
                    <Github className="h-4 w-4" />
                    <span className="sr-only sm:not-sr-only sm:ml-2">Code</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

type BlogsContentProps = {
  blogSearchQuery: string;
  setBlogSearchQuery: React.Dispatch<React.SetStateAction<string>>;
};
const BlogContent = ({
  blogSearchQuery,
  setBlogSearchQuery,
}: BlogsContentProps) => {
  const blogPosts = [
    // {
    //   title: "Building Scalable Microservices with Node.js",
    //   excerpt:
    //     "Learn how to architect and deploy microservices that can handle millions of requests",
    //   date: "2024-01-15",
    //   readTime: "8 min read",
    //   tags: ["Node.js", "Microservices", "Architecture"],
    //   gradient: "from-blue-500 to-purple-600",
    // },
    // {
    //   title: "React Performance Optimization Techniques",
    //   excerpt:
    //     "Advanced strategies to make your React applications blazingly fast",
    //   date: "2024-01-10",
    //   readTime: "12 min read",
    //   tags: ["React", "Performance", "Optimization"],
    //   gradient: "from-green-500 to-teal-600",
    // },
    // {
    //   title: "AWS Lambda Best Practices for Production",
    //   excerpt: "Essential tips for running serverless functions at scale",
    //   date: "2024-01-05",
    //   readTime: "6 min read",
    //   tags: ["AWS", "Serverless", "Lambda"],
    //   gradient: "from-orange-500 to-red-600",
    // },
    // {
    //   title: "Database Design Patterns for Modern Applications",
    //   excerpt: "Common patterns and anti-patterns in database design",
    //   date: "2023-12-28",
    //   readTime: "10 min read",
    //   tags: ["Database", "Design Patterns", "SQL"],
    //   gradient: "from-purple-500 to-pink-600",
    // },
    // {
    //   title: "GraphQL vs REST: When to Use Which",
    //   excerpt: "A comprehensive comparison of GraphQL and REST APIs",
    //   date: "2023-12-20",
    //   readTime: "15 min read",
    //   tags: ["GraphQL", "REST", "API Design"],
    //   gradient: "from-cyan-500 to-blue-600",
    // },
    // {
    //   title: "CI/CD Pipeline Automation with GitHub Actions",
    //   excerpt: "Step-by-step guide to automating your deployment pipeline",
    //   date: "2023-12-15",
    //   readTime: "7 min read",
    //   tags: ["CI/CD", "GitHub Actions", "DevOps"],
    //   gradient: "from-yellow-500 to-orange-600",
    // },
  ];

  const filteredPosts = blogPosts.filter(
    (post) =>
      blogSearchQuery === "" ||
      post.title.toLowerCase().includes(blogSearchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(blogSearchQuery.toLowerCase()) ||
      post.tags.some((tag) =>
        tag.toLowerCase().includes(blogSearchQuery.toLowerCase()),
      ),
  );

  return (
    <div className="hero-squares p-4 sm:p-8 lg:px-16 xl:px-20 vs-scrollbar overflow-auto h-full">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 lg:mb-12 gap-4">
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground flex items-center">
            <BookOpen className="mr-4 text-primary flex-shrink-0" />
            Blog & Articles
          </h1>
          <div className="w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search articles..."
                value={blogSearchQuery}
                onChange={(e) => setBlogSearchQuery(e.target.value)}
                className="pl-10 w-full sm:w-64 rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {filteredPosts.map((post, index) => (
            <Card
              key={index}
              className="h-[400px] overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover-lift cursor-pointer rounded-lg"
            >
              <div
                className={`h-32 bg-gradient-to-br ${post.gradient} flex items-center justify-center relative`}
              >
                <BookOpen className="w-8 h-8 lg:w-12 lg:h-12 text-white" />
                <div className="absolute top-4 right-4">
                  <Badge className="bg-white/20 text-white border-white/30 text-xs rounded-lg">
                    {post.readTime}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4 lg:p-6 h-[268px] flex flex-col">
                <div className="flex items-center text-xs lg:text-sm text-muted-foreground mb-3">
                  <Calendar className="w-3 h-3 lg:w-4 lg:h-4 mr-2 flex-shrink-0" />
                  {new Date(post.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                <h3 className="text-base lg:text-lg font-semibold mb-2 text-foreground line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-muted-foreground text-sm mb-4 leading-relaxed line-clamp-3 flex-1">
                  {post.excerpt}
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {post.tags.slice(0, 3).map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-xs rounded-lg"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full  self-end btn-enhanced rounded-lg py-3 shadow-md"
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Read Article
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 lg:w-16 lg:h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg lg:text-xl font-semibold text-foreground mb-2">
              No articles found
            </h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const Portfolio = () => {
  const { theme, setTheme } = useTheme();
  const [, setLocation] = useLocation();
  const [openTabs, setOpenTabs] = useState<TabType[]>(["home"]);
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [blogSearchQuery, setBlogSearchQuery] = useState("");
  
  // Ref to track if we're closing the blog tab to prevent automatic reopening
  const isClosingBlogTab = useRef(false);

  // Fetch about data for profile photo and other info
  const { data: aboutData, isLoading: aboutLoading } = useQuery({
    queryKey: ['/api/about/'],
    queryFn: () => apiRequest<AboutData>('GET', '/api/about/'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });


  const openTab = useCallback(
    (tabId: TabType) => {
      if (!openTabs.includes(tabId)) {
        setOpenTabs((prev) => [...prev, tabId]);
      }
      setActiveTab(tabId);
      
      // Auto-close sidebar on mobile after selecting a tab
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
      
      // Update URL hash for all tabs except home
      if (tabId !== 'home') {
        window.history.replaceState(null, '', `#${tabId}`);
      } else {
        // Remove hash for home tab
        window.history.replaceState(null, '', window.location.pathname);
      }
    },
    [openTabs],
  );

  // Handle URL hash navigation for all tabs
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // Remove the '#'
      
      if (hash && Object.keys(tabConfig).includes(hash as TabType)) {
        const tabId = hash as TabType;
        if (!isClosingBlogTab.current) {
          openTab(tabId);
        }
      } else if (!hash) {
        // No hash means home tab
        openTab('home');
      }
      
      // Reset the flag after processing
      if (isClosingBlogTab.current) {
        isClosingBlogTab.current = false;
      }
    };

    // Check initial hash on mount
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [openTab, tabConfig]);

  const closeTab = useCallback(
    (tabId: TabType) => {
      if (openTabs.length === 1) return;

      // Special handling for closing tabs - clear the hash to prevent automatic reopening
      if (window.location.hash === `#${tabId}`) {
        isClosingBlogTab.current = true;
        window.history.replaceState(null, '', window.location.pathname);
      }

      const newOpenTabs = openTabs.filter((id) => id !== tabId);
      setOpenTabs(newOpenTabs);

      if (activeTab === tabId) {
        const newActiveTab = newOpenTabs[newOpenTabs.length - 1];
        setActiveTab(newActiveTab);
        
        // Update hash for the new active tab
        if (newActiveTab !== 'home') {
          window.history.replaceState(null, '', `#${newActiveTab}`);
        } else {
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    },
    [openTabs, activeTab],
  );

  // Handle responsive sidebar collapsing dynamically
  useEffect(() => {
    let prevWidth = window.innerWidth;
    const handleResize = () => {
      const currWidth = window.innerWidth;
      // Crossing from desktop to mobile
      if (prevWidth >= 768 && currWidth < 768) {
        setSidebarCollapsed(true);
      }
      // Crossing from mobile to desktop
      else if (prevWidth < 768 && currWidth >= 768) {
        setSidebarCollapsed(false);
      }
      prevWidth = currWidth;
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Visual Studio Icon SVG
  const VSIcon = () => (
    <svg viewBox="0 0 256 256" className="w-6 h-6">
      <defs>
        <linearGradient id="vsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0065A9" />
          <stop offset="100%" stopColor="#007ACC" />
        </linearGradient>
      </defs>
      <path
        d="M181.534 254.252a15.934 15.934 0 0 0 11.67-.886l46.021-23.85c4.345-2.254 7.775-7.775 7.775-13.42V39.904c0-5.645-3.43-11.166-7.775-13.42L193.204 2.634a15.939 15.939 0 0 0-18.61 2.478L81.844 92.31 31.94 53.088a10.655 10.655 0 0 0-13.01.56L5.716 64.265c-3.805 3.492-3.805 9.448 0 12.94l42.537 39.652L5.716 156.51c-3.805 3.492-3.805 9.448 0 12.94l13.214 10.617a10.655 10.655 0 0 0 13.01.56l49.904-39.222 92.75 87.198a15.939 15.939 0 0 0 6.94 1.649z"
        fill="url(#vsGradient)"
      />
    </svg>
  );

  // Content Components with consistent styling and responsiveness
  const HomeContent = () => (
    <div className="p-4 sm:p-8 lg:px-16 xl:px-20 vs-scrollbar overflow-auto h-full">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className=" hero-grid hero-pattern-wrapper grid lg:grid-cols-2 gap-8 lg:gap-16 items-center mb-16 lg:mb-24">
          <div className="order-2 lg:order-1">
            {/* Namaste Line */}
            <span className="text-xl sm:text-lg md:text-xl lg:text-3xl font-medium text-muted-foreground uppercase tracking-wider mb-2">
              <AnimatedGreeting className="text-primary" />
            </span>
            {/* Title Line */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-5 md:mb-6 text-foreground leading-snug">
              <span className="block mt-4 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Turning coffee into code, and code 
              </span>
              <span className="text-primary">
              into experience. 
              </span>
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-6 md:mb-8 lg:mb-12 leading-relaxed max-w-xl">
              Driven by curiosity, powered by code. I bring ideas to life—efficiently and elegantly.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-col md:flex-col lg:flex-row gap-4">
              <Button
                size="lg"
                className="w-full lg:w-auto bg-primary text-white btn-enhanced rounded-lg px-6 py-3 text-base font-medium shadow-md"
                onClick={() => openTab("projects")}
              >
                <Play className="mr-2 h-5 w-5" />
                Show my work
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="w-full lg:w-auto btn-enhanced rounded-lg px-6 py-3 text-base font-medium shadow-md"
                onClick={() => openTab("resume")}
              >
                <Eye className="mr-2 h-5 w-5" />
                Show Resume
              </Button>
            </div>
          </div>

          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96">
              {/* Circular Frame with Gradient Border */}
              <div className="absolute inset-0 rounded-full border-8 border-primary/20 bg-gradient-to-br from-[#fefefe] via-[#f1f1f1] to-[#fff] dark:from-[#222] dark:via-[#111] dark:to-[#000] flex items-center justify-center">
                {/* Inner circle that holds the image */}
                <div className="w-[90%] h-[90%] rounded-full overflow-hidden shadow-lg relative z-10">
                  <img
                    src={aboutData?.photo || userImage}
                    alt={aboutData?.name || "Aman"}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute top-7 left-0 w-5 h-5 bg-blue-500 rounded-full opacity-70"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-orange-400 rounded-full opacity-70"></div>
              <div className="absolute top-1/2 -right-4 w-4 h-4 bg-purple-400 rounded-full opacity-70"></div>

              {/* Geometric shapes */}
              <div className="absolute -top-2 left-4 w-0 h-0 border-l-[10px] border-r-[10px] border-b-[16px] border-transparent border-b-orange-400 opacity-80"></div>
              <div className="absolute -bottom-6 right-6 w-0 h-0 border-l-[10px] border-r-[10px] border-b-[16px] border-transparent border-b-blue-400 opacity-80"></div>

              {/* Dotted Circle (like in reference) */}
              <div className="absolute inset-0 rounded-full border-2 border-dotted border-primary/40 animate-spin-slow"></div>
            </div>
          </div>
        </div>

        {/* Dynamic Featured Projects */}
        <DynamicFeaturedProjects onViewAllClick={() => openTab("projects")} />

        {/* Skills Section */}
        <div className="text-left">
          <h2 className="text-3xl lg:text-4xl font-bold mb-8 lg:mb-12 text-foreground flex items-center">
            <Code className="mr-4 text-primary flex-shrink-0" />
            Core Technologies
          </h2>
          <div className="flex flex-wrap gap-3 lg:gap-4">
            {[
              { name: "C#", color: "from-yellow-400 to-orange-500" },
              { name: ".Net", color: "from-blue-400 to-blue-600" },
              { name: "Postgress", color: "from-green-400 to-green-600" },
              { name: "Python", color: "from-blue-500 to-yellow-500" },
              { name: "AWS", color: "from-orange-400 to-orange-600" },
              { name: "Docker", color: "from-blue-400 to-cyan-500" },
            ].map((tech) => (
              <Badge
                key={tech.name}
                className={`px-4 lg:px-6 py-2 lg:py-3 text-base lg:text-lg font-medium bg-gradient-to-r ${tech.color} text-white border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer rounded-lg`}
              >
                {tech.name}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const AboutContent = () => (
    <div className="hero-grid hero-squares p-4 sm:p-8 lg:px-16 xl:px-20 vs-scrollbar overflow-auto h-full">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl lg:text-4xl font-bold mb-8 lg:mb-12 text-foreground flex items-center">
          <User className="mr-4 text-primary flex-shrink-0" />
          About Me
        </h1>

        <div className=" hero-grid grid lg:grid-cols-2 gap-8 lg:gap-12 mb-12 lg:mb-16">
          <div>
            <div className="w-full h-[300px] sm:h-[400px] gradient-bg rounded-2xl shadow-2xl relative flex items-center justify-center overflow-hidden">
              {/* Image filling the container */}
              <a href="http://www.freepik.com">
                <img
                  src={professionaImage}
                  alt="Aman"
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
              <p>
                Aman Kayare is a Professional Software Engineer with 5 years of
                experience in designing, developing, and deploying scalable and
                robust applications. Proficient in Agile development practices,
                with a strong focus on delivering high-quality software
                solutions that meet business and user needs.
              </p>
              <p>
                Passionate about sharing knowledge and empowering others through
                technical writing and mentoring. Adept at collaborating with
                cross-functional teams to drive innovation and efficiency.
                Committed to leveraging cutting-edge technologies to solve
                complex problems and optimize performance.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Button
                className="bg-primary text-white btn-enhanced rounded-lg"
                onClick={() => openTab("resume")}
              >
                <Eye className=" mr-2 h-4 w-4" />
                View Resume
              </Button>

              <a
                href="https://github.com/amankayare"
                target="-blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="btn-enhanced rounded-lg">
                  <Github className="mr-2 h-4 w-4" />
                  GitHub Profile
                </Button>
              </a>
            </div>
          </div>
        </div>

        {/* Skills Grid */}
        <div className="mb-12 lg:mb-16">
          <h2 className="text-2xl md:text-[1.75rem] lg:text-3xl font-semibold mb-6 lg:mb-8 text-foreground">
            Technical Expertise
          </h2>
          <div className="skills-grid grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-7 lg:gap-8">
            {[
              // {
              //   title: "Frontend Development",
              //   icon: <Code className="w-8 h-8 text-blue-500" />,
              //   skills: [
              //     "React / Next.js",
              //     "TypeScript / JavaScript",
              //     "Tailwind CSS / Styled Components",
              //     "Redux / Zustand",
              //   ],
              //   color: "from-blue-500 to-cyan-500",
              // },
            ].map((category) => (
              <Card
                key={category.title}
                className="h-auto min-h-[18rem] md:min-h-[20rem] lg:min-h-[22rem] flex flex-col hover-lift rounded-lg shadow-md"
              >
                <CardHeader>
                  <CardTitle className="flex items-center text-foreground text-lg md:text-base lg:text-lg font-semibold">
                    <div
                      className={`p-2 rounded-lg bg-gradient-to-r ${category.color} mr-3`}
                    >
                      {category.icon}
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
            ))}
          </div>
        </div>

        {/* Education */}
        <div>
          <h2 className="text-xl sm:text-2xl md:text-[1.75rem] lg:text-3xl font-semibold mb-5 sm:mb-6 lg:mb-8 text-foreground">
            Education & Achievements
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-7 lg:gap-8">
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
            <Card className="flex flex-col h-full rounded-lg shadow-md hover-lift transition-all duration-300">
              <CardContent className="p-4 md:p-6 flex flex-col flex-1 justify-between">
                <div className="flex items-start">
                  <div className="gradient-bg p-3 rounded-lg mr-4 flex-shrink-0">
                    <Star className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-md md:text-base lg:text-lg text-foreground mb-1 leading-snug break-words">
                      AWS Certified Developer Associate
                    </h3>
                    <p className="text-primary font-medium mb-1 text-sm md:text-base">
                      Amazon Web Services
                    </p>
                    <p className="text-muted-foreground text-xs md:text-sm leading-snug">
                      Issued: 2024 | Valid until: 2027
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );

  const ResumeContent = () => {
    const handleDownloadPDF = () => {
      // Use the resume API endpoint for downloading
      window.open('/api/resume/', '_blank');
    };

    const handleViewOnline = () => {
      // Use the resume API endpoint for viewing
      window.open('/api/resume/view', '_blank');
    };

    return (
      <div className="hero-grid hero-squares p-4 sm:p-8 lg:px-16 xl:px-20 vs-scrollbar overflow-auto h-full">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 lg:mb-12">
            <div className="gradient-bg w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center mb-2 mx-auto">
              <FileText className="w-8 h-8 lg:w-10 lg:h-10 text-primary" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold mb-4 text-foreground">
              Resume
            </h1>
            <p className="text-muted-foreground mb-8">
              Download or view my complete professional resume
            </p>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <Button
                size="lg"
                className="bg-primary text-white btn-enhanced rounded-lg px-6 py-3"
                onClick={handleDownloadPDF}
              >
                <Download className="mr-2 h-5 w-5" />
                Download PDF
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="btn-enhanced rounded-lg px-6 py-3"
                onClick={handleViewOnline}
              >
                <ExternalLink className="mr-2 h-5 w-5" />
                View Online
              </Button>
            </div>

            {/* Resume Preview Info */}
            <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-600">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <FileText className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    Professional Resume
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    PDF Document
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Complete overview of my professional experience, skills, education, and achievements.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ContactContent = () => {
    // Fetch about data for contact information
    const { data: about, isLoading: aboutLoading, error: aboutError } = useQuery({
      queryKey: ['/api/about/'],
      queryFn: () => apiRequest<AboutData>('GET', '/api/about/'),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Show loading state
    if (aboutLoading) {
      return (
        <div className="hero-squares p-4 sm:p-8 lg:px-12 xl:px-20 vs-scrollbar overflow-auto h-full">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl lg:text-4xl font-bold mb-8 lg:mb-12 text-foreground flex items-center">
              <Mail className="mr-4 text-primary flex-shrink-0" />
              Get In Touch
            </h1>
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </div>
        </div>
      );
    }

    // Parse social links from JSON and normalize URLs
    const socialLinks = normalizeSocialLinks(about?.social_links || {});
    const socialPlatforms = [
      {
        icon: <Github className="w-5 h-5" />,
        label: "GitHub",
        color: "from-gray-700 to-gray-900",
        href: socialLinks.github || "#",
      },
      {
        icon: <Linkedin className="w-5 h-5" />,
        label: "LinkedIn", 
        color: "from-blue-600 to-blue-800",
        href: socialLinks.linkedin || "#",
      },
      {
        icon: <Youtube className="w-5 h-5" />,
        label: "Youtube",
        color: "from-red-500 to-red-700",
        href: socialLinks.youtube || "#",
      },
    ].filter(social => social.href !== "#"); // Only show platforms with valid URLs

    return (
    <div className="hero-squares p-4 sm:p-8 lg:px-12 xl:px-20 vs-scrollbar overflow-auto h-full">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl lg:text-4xl font-bold mb-8 lg:mb-12 text-foreground flex items-center">
          <Mail className="mr-4 text-primary flex-shrink-0" />
          Get In Touch
        </h1>

        <div className="contact-grid grid lg:grid-cols-2 gap-8 lg:gap-12">
          <div>
            <h2 className="text-xl lg:text-2xl font-semibold mb-6 text-foreground">
              Let's Connect
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              I'm always interested in discussing new opportunities,
              collaborations, or just having a chat about technology. Feel free
              to reach out through any of the channels below.
            </p>

            <div className="space-y-6">
              {about?.email && (
                <div className="flex items-center p-4 bg-card rounded-lg border hover:shadow-lg transition-all cursor-pointer h-20">
                  <div className="p-3 rounded-lg mr-4 flex-shrink-0">
                    <Email className="w-5 h-5 text-text" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Email</h3>
                    <p className="text-muted-foreground text-sm">
                      {about.email}
                    </p>
                  </div>
                </div>
              )}

              {about?.phone && (
                <div className="flex items-center p-4 bg-card rounded-lg border hover:shadow-lg transition-all cursor-pointer h-20">
                  <div className="p-3 rounded-lg mr-4 flex-shrink-0">
                    <Phone className="w-5 h-5 text-text" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Phone</h3>
                    <p className="text-muted-foreground text-sm">
                      {about.phone}
                    </p>
                  </div>
                </div>
              )}

              {about?.location && (
                <div className="flex items-center p-4 bg-card rounded-lg border hover:shadow-lg transition-all cursor-pointer h-20">
                  <div className="p-3 rounded-lg mr-4 flex-shrink-0">
                    <MapPin className="w-5 h-5 text-text" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Location</h3>
                    <p className="text-muted-foreground text-sm">{about.location}</p>
                  </div>
                </div>
              )}
            </div>

            {socialPlatforms.length > 0 && (
              <div className="flex space-x-4 mt-8">
                {socialPlatforms.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className={`p-3 rounded-lg bg-gradient-to-r ${social.color} text-white shadow-lg hover:shadow-xl transition-shadow btn-enhanced`}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <Card className="shadow-lg rounded-lg">
              <CardContent className="p-6">
                <h2 className="text-xl lg:text-2xl font-semibold mb-6 text-foreground">
                  Send a Message
                </h2>
                <ContactForm />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
  };

  const ExperienceContent = () => <DynamicExperienceContent />;

  const CertificationsContent = () => (
    <div className="hero-squares p-4 sm:p-8 lg:px-16 xl:px-20 vs-scrollbar overflow-auto h-full">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl lg:text-4xl font-bold mb-8 lg:mb-12 text-foreground flex items-center">
          <Award className="mr-4 text-primary flex-shrink-0" />
          Certifications & Achievements
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-7 lg:gap-8">
          {[
            {
              title: "AWS Certified Developer Associate",
              issuer: "Amazon Web Services",
              date: "2024",
              validity: "Valid until 2027",
              description:
                "Professional certification demonstrating expertise in designing distributed systems on AWS",
              skills: [
                "Cloud Architecture",
                "Cloud Development",
                "Deployments",
                "Security",
                "Scalability",
                "Cost Optimization",
              ],
              color: "from-orange-500 to-yellow-500",
              icon: <Globe className="w-8 h-8 text-white" />,
            },
            // {
            //   title: "Google Cloud Professional Developer",
            //   issuer: "Google Cloud",
            //   date: "2023",
            //   validity: "Valid until 2025",
            //   description:
            //     "Demonstrates ability to design, build, and deploy applications on Google Cloud Platform",
            //   skills: [
            //     "GCP Services",
            //     "Kubernetes",
            //     "Cloud Functions",
            //     "DevOps",
            //   ],
            //   color: "from-blue-500 to-green-500",
            //   icon: <Code className="w-8 h-8 text-white" />,
            // },
            // {
            //   title: "Certified Kubernetes Administrator",
            //   issuer: "Cloud Native Computing Foundation",
            //   date: "2022",
            //   validity: "Valid until 2025",
            //   description:
            //     "Validates skills in Kubernetes cluster administration and troubleshooting",
            //   skills: [
            //     "Container Orchestration",
            //     "Cluster Management",
            //     "Networking",
            //     "Security",
            //   ],
            //   color: "from-purple-500 to-blue-600",
            //   icon: <Terminal className="w-8 h-8 text-white" />,
            // },
            // {
            //   title: "MongoDB Certified Developer",
            //   issuer: "MongoDB Inc.",
            //   date: "2022",
            //   validity: "Valid until 2024",
            //   description:
            //     "Certification in MongoDB application development and database design",
            //   skills: [
            //     "NoSQL",
            //     "Database Design",
            //     "Aggregation",
            //     "Performance Tuning",
            //   ],
            //   color: "from-green-600 to-teal-600",
            //   icon: <Star className="w-8 h-8 text-white" />,
            // },
            // {
            //   title: "Meta Frontend Developer",
            //   issuer: "Meta (Facebook)",
            //   date: "2021",
            //   validity: "Completed",
            //   description:
            //     "Professional certificate program covering modern frontend development practices",
            //   skills: ["React", "JavaScript", "HTML/CSS", "Version Control"],
            //   color: "from-blue-600 to-purple-600",
            //   icon: <Code className="w-8 h-8 text-white" />,
            // },
            // {
            //   title: "Agile & Scrum Master",
            //   issuer: "Scrum Alliance",
            //   date: "2021",
            //   validity: "Valid until 2024",
            //   description:
            //     "Certification in Agile methodologies and Scrum framework implementation",
            //   skills: [
            //     "Agile Methodologies",
            //     "Team Leadership",
            //     "Project Management",
            //     "Facilitation",
            //   ],
            //   color: "from-red-500 to-orange-600",
            //   icon: <Briefcase className="w-8 h-8 text-white" />,
            // },
          ].map((cert, index) => (
            <Card
              key={index}
              className="h-auto flex flex-col justify-between overflow-hidden rounded-lg hover:shadow-xl transition-all duration-300"
            >
              <div className={`h-3 bg-gradient-to-r ${cert.color}`} />
              <CardContent className="p-4 lg:p-6 flex flex-col flex-1">
                <div className="flex items-start mb-4">
                  <div
                    className={`p-3 rounded-lg bg-gradient-to-r ${cert.color} mr-4 flex-shrink-0`}
                  >
                    {cert.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base md:text-lg lg:text-xl font-semibold text-foreground mb-2 leading-snug line-clamp-2">
                      {cert.title}
                    </h3>
                    <p className="text-primary font-medium mb-1 text-sm lg:text-base">
                      {cert.issuer}
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center text-xs lg:text-sm text-muted-foreground gap-1">
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {cert.date}
                      </span>
                      <span className="hidden sm:block">•</span>
                      <span className="text-green-600 font-medium">
                        {cert.validity}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-muted-foreground text-sm md:text-[0.95rem] leading-snug mb-4 flex-shrink-0 line-clamp-3 break-words">
                  {cert.description}
                </p>

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

                <Button
                  size="sm"
                  variant="outline"
                  className="btn-enhanced rounded-lg w-full sm:w-auto mt-2"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Verify Certificate
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    if (activeTab === "projects") {
      return (
        <DynamicProjectsContent
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      );
    } else if (activeTab === "home") return <HomeContent />;
    else if (activeTab === "about") return <DynamicAboutContent />;
    else if (activeTab === "experience") return <DynamicExperienceContent />;
    else if (activeTab === "certifications")
      return <DynamicCertificationsContent />;
    else if (activeTab === "blog") {
      return (
        <DynamicBlogsContent
          blogSearchQuery={blogSearchQuery}
          setBlogSearchQuery={setBlogSearchQuery}
        />
      );
    } else if (activeTab === "contact") return <ContactContent />;
    else if (activeTab === "resume") return <ResumeContent />;
    return <HomeContent />;
  };

  return (
    <div className="h-screen  flex flex-col bg-background text-foreground font-vs">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-[var(--vs-header-bg)] border-b border-border z-10 relative">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="md:hidden p-1 h-8 w-8 rounded-lg -ml-2"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <VSIcon />
            <span className="text-2xl font-savate font-bold text-foreground hidden md:block">
              Aman Kayare
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <ThemeToggle 
            variant="ghost"
            className="hover:bg-[var(--vs-sidebar-hover)] rounded-lg transition-all duration-200"
            showTooltip={true}
          />
          <Button
            variant="default"
            size="sm"
            onClick={() => setLocation("/blogs")}
            className="group relative flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white px-5 py-2 h-10 rounded-xl text-sm font-black uppercase tracking-widest transition-all duration-300 shadow-lg shadow-indigo-500/25 overflow-hidden"
          >
            <FileText className="h-4 w-4" />
            <span>Blog</span>
            <Badge className="ml-1 bg-white/20 text-[10px] py-0 px-1.5 border-0 hover:bg-white/30 text-white">
              NEW
            </Badge>
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Overlay */}
        {!sidebarCollapsed && (
          <div 
            className="absolute inset-0 bg-black/50 z-40 md:hidden" 
            onClick={() => setSidebarCollapsed(true)}
          />
        )}
        
        {/* Sidebar */}
        <div
          className={`bg-[var(--vs-sidebar-bg)] border-r border-border transition-all duration-300 flex-shrink-0 z-50 absolute md:relative h-full ${
            sidebarCollapsed 
              ? "-translate-x-full md:translate-x-0 w-64 md:w-12 overflow-hidden" 
              : "translate-x-0 w-64"
          }`}
        >
          <div className="p-3 h-full">
            <div className="flex items-center justify-between mb-6">
              {!sidebarCollapsed && (
                <h2 className="text-sm font-semibold text-[var(--vs-sidebar-text)] uppercase tracking-wider">
                  Explorer
                </h2>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="hover:bg-[hsl(var(--vs-sidebar-hover))] text-[hsl(var(--vs-sidebar-text))] p-1 h-8 w-8 rounded-lg"
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="space-y-1">
              {Object.entries(tabConfig).map(([tabId, config]) => {
                const Icon = config.icon;
                const isActive = activeTab === tabId;

                return (
                  <button
                    key={tabId}
                    onClick={() => openTab(tabId as TabType)}
                    className={`w-full flex items-center p-2 rounded-lg text-left transition-all duration-200 ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-[var(--vs-sidebar-text)] hover:bg-[var(--vs-sidebar-hover)] hover:text-foreground"
                    } ${sidebarCollapsed ? "justify-center" : "justify-start"}`}
                    title={sidebarCollapsed ? config.name : undefined}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <span className="text-sm font-medium truncate ml-3">
                        {config.name}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center bg-[var(--vs-tab-bg)] border-b border-border overflow-x-auto">
            {openTabs.map((tabId) => {
              const config = tabConfig[tabId];
              const Icon = config.icon;
              const isActive = activeTab === tabId;

              return (
                <div
                  key={tabId}
                  className={`flex items-center space-x-2 px-3 lg:px-4 py-3 border-r border-border cursor-pointer group relative min-w-0 flex-shrink-0 ${
                    isActive
                      ? "bg-[var(--vs-tab-active)] text-foreground"
                      : "bg-[var(--vs-tab-bg)] text-muted-foreground hover:bg-[var(--vs-tab-active)] hover:text-foreground"
                  }`}
                  onClick={() => openTab(tabId)}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm font-medium truncate ml-2">
                    {config.name}
                  </span>
                  {openTabs.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTab(tabId);
                      }}
                      className="h-5 w-5 p-0 hover:bg-muted-foreground/20 ml-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">{renderTabContent()}</div>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
