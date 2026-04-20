import { Route, Switch } from "wouter";
import Portfolio from "@/components/Portfolio";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";

function SimpleApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vs-portfolio-theme">
        <TooltipProvider>
          <Toaster />
          <Switch>
            <Route path="/" component={Portfolio} />
            <Route path="/portfolio" component={Portfolio} />
            <Route>
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <h1>Page Not Found</h1>
                <p>The requested page could not be found.</p>
              </div>
            </Route>
          </Switch>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default SimpleApp;
