import { ThemeToggle } from "./theme-toggle";

export function ThemeToggleShowcase() {
  return (
    <div className="p-6 space-y-6 bg-white dark:bg-gray-900 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">Theme Toggle Variations</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Default */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Default Ghost</h4>
          <ThemeToggle />
        </div>
        
        {/* Outline */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Outline</h4>
          <ThemeToggle variant="outline" />
        </div>
        
        {/* With Label */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">With Label</h4>
          <ThemeToggle variant="outline" showLabel={true} />
        </div>
        
        {/* Large Size */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Large Size</h4>
          <ThemeToggle variant="default" size="lg" />
        </div>
        
        {/* Custom Styling */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Custom Style</h4>
          <ThemeToggle 
            variant="outline"
            className="border-2 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          />
        </div>
        
        {/* No Tooltip */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">No Tooltip</h4>
          <ThemeToggle showTooltip={false} />
        </div>
      </div>
    </div>
  );
}
