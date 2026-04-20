import { Route, Switch } from "wouter";
import NotFound from "@/pages/not-found.tsx";
import { lazy } from "react";
import Portfolio from "@/components/Portfolio";
import Login from "@/pages/Login";
import Register from "@/pages/Register"; 
import AdminDashboard from "@/pages/AdminDashboard";
import BlogPost from "@/pages/BlogPost";
import BlogHome from "@/pages/BlogHome";
import UserProfile from "@/pages/UserProfile";

// Lazy load admin pages
const ProjectsManagement = lazy(() => import("./pages/admin/ProjectsManagement"));
const BlogsManagement = lazy(() => import("./pages/admin/BlogsManagement"));
const CertificationsManagement = lazy(() => import("./pages/admin/CertificationsManagement"));
const AboutManagement = lazy(() => import("./pages/admin/AboutManagement"));
const ExperienceManagement = lazy(() => import("./pages/admin/ExperienceManagement"));
const TechnicalSkillsManagement = lazy(() => import("./pages/admin/TechnicalSkillsManagement"));
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { DelayedContent } from "@/components/ui/DelayedContent";

// Lazy load admin components with Suspense
export const withSuspense = (Component: React.ComponentType) => {
  return (
    <DelayedContent fullScreen>
      <Component />
    </DelayedContent>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vs-portfolio-theme">
        <TooltipProvider>
          <Toaster />
          <Switch>
            <Route path="/login" component={Login} />
            <Route path="/register" component={Register} />
            <Route path="/profile" component={UserProfile} />
            <Route path="/admin" component={AdminDashboard} />
            <Route path="/admin/projects">{() => <DelayedContent><ProjectsManagement /></DelayedContent>}</Route>
            <Route path="/admin/blogs">{() => <DelayedContent><BlogsManagement /></DelayedContent>}</Route>
            <Route path="/admin/certifications">{() => <DelayedContent><CertificationsManagement /></DelayedContent>}</Route>
            <Route path="/admin/about">{() => <DelayedContent><AboutManagement /></DelayedContent>}</Route>
            <Route path="/admin/experience">{() => <DelayedContent><ExperienceManagement /></DelayedContent>}</Route>
            <Route path="/admin/technical-skills">{() => <DelayedContent><TechnicalSkillsManagement /></DelayedContent>}</Route>
            <Route path="/blog/:id" component={BlogPost} />
            <Route path="/blogs" component={BlogHome} />
            <Route path="/" component={Portfolio} />
            <Route component={NotFound} />
          </Switch>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;