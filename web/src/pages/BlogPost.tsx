import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import BlogLayout from '../components/BlogLayout';
import Comments from '../components/Comments';
import { useBlogContentStyles } from '@/hooks/useBlogStyles';

export interface BlogPost {
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
  category?: {
    id: number;
    name: string;
  };
  quick_links?: Array<{
    title: string;
    url: string;
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

  // Fetch related posts dynamically
  const { data: relatedPosts = [], isLoading: loadingRelated } = useQuery({
    queryKey: ["relatedPosts", id],
    queryFn: async () => {
      if (!id) return [];
      const response = await fetch(`/api/blogs/${id}/related`);
      if (!response.ok) return [];
      const data = await response.json();
      // Map to expected shape for BlogLayout
      return data.map((post: any) => ({
        id: post.id,
        title: post.title,
        readingTime: post.reading_time,
      }));
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
      category={post?.category}
      quickLinks={post?.quick_links || []}
      isLoading={isLoading}
      error={error ? 'Blog post not found or failed to load.' : undefined}
      showShareButton={true}
      backTo="/#blog"
      tableOfContents={[
        { id: 'introduction', title: 'Introduction', level: 1 },
        { id: 'getting-started', title: 'Getting Started', level: 1 },
        { id: 'installation', title: 'Installation', level: 2 },
        { id: 'configuration', title: 'Configuration', level: 2 },
        { id: 'advanced-features', title: 'Advanced Features', level: 1 },
        { id: 'conclusion', title: 'Conclusion', level: 1 },
      ]}
      relatedPosts={relatedPosts}
      loadingRelated={loadingRelated}
    >
      {/* Blog Content */}
      {post?.content && (
        <div className={styles.prose}>
          <div 
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>
      )}
      
      {/* Comments Section */}
      {post?.id && <Comments blogId={post.id} />}
    </BlogLayout>
  );
}