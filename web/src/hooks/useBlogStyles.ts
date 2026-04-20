import { cn } from '@/lib/utils';

// Blog content styling hook
export const useBlogContentStyles = () => {
  return {
    container: "blog-content min-h-[400px]",
    prose: cn(
      "prose prose-base dark:prose-invert max-w-none",
      // Professional typography
      "prose-headings:scroll-m-16 prose-headings:font-bold prose-headings:tracking-tight",
      // H1 - Large section headers with subtle bottom border
      "prose-h1:text-2xl prose-h1:md:text-3xl prose-h1:text-gray-900 dark:prose-h1:text-gray-100",
      "prose-h1:border-b prose-h1:border-gray-200 dark:prose-h1:border-gray-800",
      "prose-h1:pb-2 prose-h1:mb-4 prose-h1:mt-8 first:prose-h1:mt-0",
      // H2 - Section headers with green accent
      "prose-h2:text-xl prose-h2:md:text-2xl prose-h2:text-gray-800 dark:prose-h2:text-gray-200",
      "prose-h2:border-l-4 prose-h2:border-green-600 dark:prose-h2:border-green-500",
      "prose-h2:pl-4 prose-h2:py-1 prose-h2:mb-3 prose-h2:mt-6",
      "prose-h2:bg-green-50/50 dark:prose-h2:bg-green-950/20",
      // H3 - Subsection headers
      "prose-h3:text-lg prose-h3:md:text-xl prose-h3:text-gray-700 dark:prose-h3:text-gray-300",
      "prose-h3:mb-2.5 prose-h3:mt-5",
      // H4 - Minor headers
      "prose-h4:text-base prose-h4:md:text-lg prose-h4:text-gray-700 dark:prose-h4:text-gray-300",
      "prose-h4:font-semibold prose-h4:mb-2 prose-h4:mt-4",
      // Paragraphs - Clean, readable text
      "prose-p:text-gray-700 dark:prose-p:text-gray-300",
      "prose-p:leading-7 prose-p:mb-4 prose-p:text-[15px]",
      // Links - Professional green accent
      "prose-a:text-green-600 dark:prose-a:text-green-500",
      "prose-a:no-underline prose-a:font-medium",
      "hover:prose-a:text-green-700 dark:hover:prose-a:text-green-400",
      "hover:prose-a:underline prose-a:underline-offset-2 prose-a:transition-colors",
      // Blockquotes - Subtle left border with light background
      "prose-blockquote:border-l-4 prose-blockquote:border-blue-500",
      "prose-blockquote:bg-blue-50/50 dark:prose-blockquote:bg-blue-950/20",
      "prose-blockquote:py-3 prose-blockquote:px-4 prose-blockquote:my-4",
      "prose-blockquote:text-gray-700 dark:prose-blockquote:text-gray-300",
      "prose-blockquote:not-italic",
      // Inline code - Subtle background with border
      "prose-code:bg-gray-100 dark:prose-code:bg-gray-800",
      "prose-code:text-red-600 dark:prose-code:text-red-400",
      "prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded",
      "prose-code:text-[14px] prose-code:font-mono prose-code:font-normal",
      "prose-code:border prose-code:border-gray-200 dark:prose-code:border-gray-700",
      "prose-code:before:content-none prose-code:after:content-none",
      // Pre blocks - Professional code styling
      "prose-pre:bg-gray-50 dark:prose-pre:bg-gray-900",
      "prose-pre:border prose-pre:border-gray-200 dark:prose-pre:border-gray-800",
      "prose-pre:rounded-lg prose-pre:p-4 prose-pre:my-4",
      "prose-pre:overflow-x-auto prose-pre:text-[14px] prose-pre:leading-6",
      "prose-pre:shadow-sm",
      // Lists - Clean spacing
      "prose-ul:my-4 prose-ul:pl-6 prose-ol:my-4 prose-ol:pl-6",
      "prose-li:text-gray-700 dark:prose-li:text-gray-300",
      "prose-li:mb-2 prose-li:leading-7 prose-li:text-[15px]",
      "prose-li:marker:text-gray-500",
      // Strong - Professional emphasis
      "prose-strong:text-gray-900 dark:prose-strong:text-gray-100",
      "prose-strong:font-semibold",
      // Em - Subtle emphasis
      "prose-em:text-gray-600 dark:prose-em:text-gray-400 prose-em:italic",
      // Images - Clean presentation
      "prose-img:rounded-lg prose-img:shadow-md",
      "prose-img:border prose-img:border-gray-200 dark:prose-img:border-gray-800",
      "prose-img:my-6 prose-img:mx-auto",
      // HR - Subtle divider
      "prose-hr:border-gray-200 dark:prose-hr:border-gray-800 prose-hr:my-8",
      // Tables - Professional styling
      "prose-table:w-full prose-table:my-6 prose-table:border-collapse",
      "prose-table:shadow-sm prose-table:rounded-lg prose-table:overflow-hidden",
      "prose-thead:bg-gray-50 dark:prose-thead:bg-gray-800",
      "prose-th:px-4 prose-th:py-3 prose-th:text-left",
      "prose-th:font-semibold prose-th:text-gray-900 dark:prose-th:text-gray-100",
      "prose-th:border-b-2 prose-th:border-gray-200 dark:prose-th:border-gray-700",
      "prose-td:px-4 prose-td:py-3 prose-td:text-gray-700 dark:prose-td:text-gray-300",
      "prose-td:border-b prose-td:border-gray-200 dark:prose-td:border-gray-800"
    )
  };
};

// Blog layout responsive classes
export const blogLayoutClasses = {
  header: "border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50",
  container: "container py-8 max-w-4xl",
  article: "space-y-8",
  hero: "space-y-6",
  title: "text-4xl md:text-5xl font-bold leading-tight",
  excerpt: "text-xl text-muted-foreground leading-relaxed",
  meta: "flex flex-wrap items-center gap-4 text-sm text-muted-foreground",
  tags: "flex flex-wrap gap-2",
  coverImage: "relative aspect-video overflow-hidden rounded-lg border bg-muted",
  footer: "mt-12 pt-8 border-t border-border/40",
  footerContent: "flex flex-col sm:flex-row items-center justify-between gap-4"
};
