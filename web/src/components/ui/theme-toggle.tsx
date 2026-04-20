import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

interface ThemeToggleProps {
  variant?: "default" | "ghost" | "outline";
  size?: "sm" | "default" | "lg";
  className?: string;
  showLabel?: boolean;
  showTooltip?: boolean;
}

export function ThemeToggle({ 
  variant = "ghost", 
  size = "sm", 
  className = "",
  showLabel = false,
  showTooltip = true
}: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const isDark = theme === "dark";
  const tooltipText = `Switch to ${isDark ? "light" : "dark"} mode`;

  return (
    <div className="relative group">
      <Button
        variant={variant}
        size={size}
        onClick={toggleTheme}
        className={`relative overflow-hidden transition-all duration-300 hover:scale-105 group ${className}`}
        aria-label={tooltipText}
      >
        {/* Background Animation */}
        <div className={`absolute inset-0 bg-gradient-to-r transition-all duration-500 ${
          isDark 
            ? "from-slate-800 to-slate-700 opacity-0 group-hover:opacity-20" 
            : "from-yellow-200 to-orange-200 opacity-0 group-hover:opacity-20"
        }`} />
        
        <div className="relative flex items-center justify-center">
          {/* Sun Icon */}
          <Sun 
            className={`h-4 w-4 absolute transition-all duration-500 transform ${
              !isDark 
                ? "opacity-100 rotate-0 scale-100 text-yellow-500" 
                : "opacity-0 rotate-180 scale-75 text-yellow-400"
            }`} 
          />
          
          {/* Moon Icon */}
          <Moon 
            className={`h-4 w-4 absolute transition-all duration-500 transform ${
              isDark 
                ? "opacity-100 rotate-0 scale-100 text-slate-300" 
                : "opacity-0 -rotate-180 scale-75 text-slate-400"
            }`} 
          />
        </div>
        
        {showLabel && (
          <span className="ml-2 text-sm font-medium transition-colors duration-300">
            {isDark ? "Light Mode" : "Dark Mode"}
          </span>
        )}
      </Button>
      
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
          {tooltipText}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-b-2 border-transparent border-b-gray-900 dark:border-b-gray-700"></div>
        </div>
      )}
    </div>
  );
}
