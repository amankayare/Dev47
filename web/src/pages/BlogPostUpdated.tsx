import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import BlogLayout from '@/components/BlogLayout';
import { useBlogContentStyles } from '@/hooks/useBlogStyles';

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
  const styles = useBlogContentStyles();

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
        <div className={styles.prose}>
          <div 
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>
      )}
    </BlogLayout>
  );
}
