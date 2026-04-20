import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import BlogLayout from '@/components/BlogLayout';

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  cover_image?: string;
  date: string;
  reading_time?: number;
  featured: boolean;
  author?: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
  tags?: Array<{
    id: number;
    name: string;
  }>;
}

export default function BlogPost() {
  const { id } = useParams();

  const { data: post, isLoading, error } = useQuery({
    queryKey: [`/api/blogs/${id}`],
    queryFn: async (): Promise<BlogPost> => {
      console.log('🔍 Fetching blog post:', `/api/blogs/${id}`);
      const response = await fetch(`/api/blogs/${id}`);
      if (!response.ok) {
        console.error('❌ Failed to fetch blog post:', response.status, response.statusText);
        throw new Error(`Failed to fetch blog post: ${response.status}`);
      }
      const data = await response.json();
      console.log('✅ Blog post loaded:', data);
      return data;
    },
    enabled: !!id,
    retry: 1,
  });

  return (
    <BlogLayout
      title={post?.title || ''}
      excerpt={post?.excerpt}
      coverImage={post?.cover_image}
      date={post?.date || ''}
      readingTime={post?.reading_time}
      featured={post?.featured}
      author={post?.author}
      tags={post?.tags || []}
      isLoading={isLoading}
      error={error ? 'Blog post not found or failed to load.' : undefined}
      showShareButton={true}
      backTo="/#blog"
    >
      {/* Blog Content */}
      {post?.content && (
        <div 
          className="prose prose-lg dark:prose-invert max-w-none
                     prose-headings:scroll-m-20 prose-headings:font-semibold
                     prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl prose-h4:text-xl
                     prose-p:leading-7 prose-p:mb-4
                     prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:font-medium
                     prose-blockquote:border-l-primary prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:bg-muted/30 prose-blockquote:py-2 prose-blockquote:rounded-r
                     prose-code:bg-muted prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:font-mono
                     prose-pre:bg-muted prose-pre:border prose-pre:rounded-lg prose-pre:p-4 prose-pre:overflow-x-auto
                     prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6
                     prose-li:marker:text-muted-foreground prose-li:mb-2
                     prose-strong:text-foreground prose-strong:font-semibold
                     prose-em:text-muted-foreground prose-em:italic
                     prose-img:rounded-lg prose-img:border prose-img:shadow-sm
                     prose-hr:border-border prose-hr:my-8
                     prose-table:border-collapse prose-table:border prose-table:border-border
                     prose-th:border prose-th:border-border prose-th:bg-muted prose-th:p-2 prose-th:font-semibold
                     prose-td:border prose-td:border-border prose-td:p-2"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      )}
    </BlogLayout>
  );
}
