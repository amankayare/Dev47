// Example usage of BlogLayout for different blog post types

import BlogLayout from '@/components/BlogLayout';
import { useBlogContentStyles } from '@/hooks/useBlogStyles';

// Example 1: Technical Tutorial Blog Post
export function TechnicalBlogPost({ post, isLoading, error }) {
  const styles = useBlogContentStyles();
  
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
      error={error}
      showShareButton={true}
      backTo="/#blog"
    >
      {/* Technical content with code blocks */}
      <div className={styles.prose}>
        <div dangerouslySetInnerHTML={{ __html: post?.content || '' }} />
      </div>
      
      {/* Additional tech-specific elements */}
      {post?.github_link && (
        <div className="mt-8 p-6 bg-muted rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Source Code</h3>
          <a 
            href={post.github_link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            View on GitHub →
          </a>
        </div>
      )}
    </BlogLayout>
  );
}

// Example 2: Personal Story Blog Post
export function PersonalBlogPost({ post, isLoading, error }) {
  const styles = useBlogContentStyles();
  
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
      error={error}
      showShareButton={true}
      backTo="/#blog"
    >
      {/* Personal story content */}
      <div className={styles.prose}>
        <div dangerouslySetInnerHTML={{ __html: post?.content || '' }} />
      </div>
      
      {/* Personal touch - author note */}
      <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {post?.author?.avatar ? (
              <img 
                src={post.author.avatar} 
                alt={post.author.name}
                className="w-12 h-12 rounded-full"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-semibold">
                  {post?.author?.name?.charAt(0) || 'A'}
                </span>
              </div>
            )}
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">Author's Note</h4>
            <p className="text-sm text-muted-foreground">
              Thanks for reading! If you enjoyed this post, feel free to share it with others or reach out to me with your thoughts.
            </p>
          </div>
        </div>
      </div>
    </BlogLayout>
  );
}

// Example 3: News/Update Blog Post
export function NewsBlogPost({ post, isLoading, error }) {
  const styles = useBlogContentStyles();
  
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
      error={error}
      showShareButton={true}
      backTo="/#blog"
    >
      {/* News content with timeline */}
      <div className={styles.prose}>
        <div dangerouslySetInnerHTML={{ __html: post?.content || '' }} />
      </div>
      
      {/* Related updates timeline */}
      {post?.related_updates && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Related Updates</h3>
          <div className="space-y-4">
            {post.related_updates.map((update, index) => (
              <div key={index} className="flex gap-4 p-4 bg-muted rounded-lg">
                <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{update.date}</p>
                  <p className="text-foreground">{update.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </BlogLayout>
  );
}

// Example 4: Tutorial with Steps
export function TutorialBlogPost({ post, isLoading, error }) {
  const styles = useBlogContentStyles();
  
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
      error={error}
      showShareButton={true}
      backTo="/#blog"
    >
      {/* Tutorial prerequisites */}
      {post?.prerequisites && (
        <div className="mb-8 p-6 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <h3 className="text-lg font-semibold mb-4 text-yellow-800 dark:text-yellow-200">
            Prerequisites
          </h3>
          <ul className="space-y-2 text-sm">
            {post.prerequisites.map((prereq, index) => (
              <li key={index} className="flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                {prereq}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Main tutorial content */}
      <div className={styles.prose}>
        <div dangerouslySetInnerHTML={{ __html: post?.content || '' }} />
      </div>
      
      {/* Tutorial completion checklist */}
      {post?.checklist && (
        <div className="mt-8 p-6 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
          <h3 className="text-lg font-semibold mb-4 text-green-800 dark:text-green-200">
            Completion Checklist
          </h3>
          <div className="space-y-2">
            {post.checklist.map((item, index) => (
              <label key={index} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">{item}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </BlogLayout>
  );
}
