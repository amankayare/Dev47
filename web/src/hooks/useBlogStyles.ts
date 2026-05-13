import { cn } from '@/lib/utils';

// Blog content styling hook
export const useBlogContentStyles = () => {
  return {
    container: "blog-content min-h-[400px]",
    prose: cn(
      "prose prose-base dark:prose-invert max-w-none w-full",
      // Modern Typography & Headings
      "prose-headings:scroll-m-24 prose-headings:font-bold prose-headings:tracking-tight",
      // H1 - Massive, clear headers
      "prose-h1:text-2xl prose-h1:md:text-3xl prose-h1:text-foreground",
      "prose-h1:border-b border-border/40",
      "prose-h1:pb-3 prose-h1:mb-5 prose-h1:mt-10 first:prose-h1:mt-0",
      // H2 - Section headers with futuristic glow/accent
      "prose-h2:text-xl prose-h2:md:text-2xl prose-h2:text-foreground",
      "prose-h2:border-l-4 prose-h2:border-primary",
      "prose-h2:pl-4 prose-h2:py-1 prose-h2:mb-4 prose-h2:mt-8",
      "prose-h2:bg-gradient-to-r prose-h2:from-primary/10 prose-h2:to-transparent",
      // H3 & H4 - Clean subsections
      "prose-h3:text-lg prose-h3:md:text-xl prose-h3:text-foreground/90",
      "prose-h3:mb-2 prose-h3:mt-6",
      "prose-h4:text-base prose-h4:md:text-lg prose-h4:text-foreground/80 prose-h4:font-bold",
      
      // Paragraphs - Optimized reading experience
      "prose-p:text-muted-foreground prose-p:leading-7 prose-p:text-[15px]",
      "prose-p:mb-5",
      
      // Links - Glowing interaction
      "prose-a:text-primary prose-a:no-underline prose-a:font-semibold",
      "hover:prose-a:text-primary/80 hover:prose-a:underline hover:prose-a:underline-offset-4 prose-a:transition-all",
      
      // Blockquotes - Glassmorphic design
      "prose-blockquote:border-l-4 prose-blockquote:border-primary/50",
      "prose-blockquote:bg-background/40 prose-blockquote:backdrop-blur-md",
      "prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:my-8",
      "prose-blockquote:rounded-r-xl prose-blockquote:shadow-sm",
      "prose-blockquote:text-foreground/80 prose-blockquote:font-medium prose-blockquote:italic",
      
      // Inline code - Sleek pills
      "prose-code:bg-primary/10 prose-code:text-primary dark:prose-code:text-primary-foreground",
      "prose-code:px-2 prose-code:py-0.5 prose-code:rounded-md",
      "prose-code:text-[0.9em] prose-code:font-mono prose-code:font-semibold",
      "prose-code:before:content-none prose-code:after:content-none",
      
      // Pre blocks - Modern IDE styling with border glow
      "prose-pre:bg-slate-950 dark:prose-pre:bg-black/40",
      "prose-pre:border prose-pre:border-white/10",
      "prose-pre:rounded-xl prose-pre:p-5 prose-pre:my-8",
      "prose-pre:shadow-2xl prose-pre:overflow-x-auto prose-pre:text-[0.95em] prose-pre:leading-relaxed",
      
      // Lists - Spaced cleanly
      "prose-ul:my-6 prose-ul:pl-8 prose-ol:my-6 prose-ol:pl-8",
      "prose-li:text-muted-foreground prose-li:mb-2 prose-li:leading-relaxed",
      "prose-li:marker:text-primary/60",
      
      // Emphasis
      "prose-strong:text-foreground prose-strong:font-bold",
      "prose-em:text-foreground/80",
      
      // Images - Flush and beautiful
      "prose-img:rounded-2xl prose-img:shadow-xl",
      "prose-img:border prose-img:border-white/5",
      "prose-img:my-10 prose-img:mx-auto prose-img:w-full",
      
      // HR
      "prose-hr:border-border/40 prose-hr:my-12",
      
      // Tables
      "prose-table:w-full prose-table:my-8 prose-table:border-collapse",
      "prose-table:rounded-xl prose-table:overflow-hidden prose-table:shadow-lg",
      "prose-thead:bg-muted/50",
      "prose-th:px-5 prose-th:py-4 prose-th:text-left prose-th:font-bold prose-th:text-foreground",
      "prose-td:px-5 prose-td:py-4 prose-td:text-muted-foreground prose-td:border-t prose-td:border-border/30"
    )
  };
};

// Blog layout responsive classes
export const blogLayoutClasses = {
  header: "border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 shadow-sm",
  container: "container py-6 max-w-6xl",
  article: "space-y-6",
  hero: "space-y-5",
  title: "text-3xl md:text-4xl font-extrabold tracking-tight leading-tight",
  excerpt: "text-lg text-muted-foreground leading-relaxed",
  meta: "flex flex-wrap items-center gap-4 text-sm text-muted-foreground",
  tags: "flex flex-wrap gap-2",
  coverImage: "relative aspect-video overflow-hidden rounded-xl border border-white/10 shadow-lg",
  footer: "mt-12 pt-6 border-t border-border/40"
};
