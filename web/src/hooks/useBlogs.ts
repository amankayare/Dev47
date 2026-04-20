import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

interface Blog {
  id: number;
  title: string;
  excerpt?: string;
  content: string;
  cover_image?: string;
  date: string;
  reading_time?: number;
  featured: boolean;
  author?: { id: number; name: string; email?: string };
  tags?: Array<{ id: number; name: string }>;
  category?: { id: number; name: string };
}

interface UseBlogsProps {
  search?: string;
  selectedCategory?: number | null;
  selectedTag?: string | null;
  pageSize?: number; // Make page size configurable
}

export const useBlogs = ({ search = '', selectedCategory, selectedTag, pageSize = 8 }: UseBlogsProps) => {
  const [allBlogs, setAllBlogs] = useState<Blog[]>([]);
  const [page, setPage] = useState(1);

  // Fetch all blogs first, then handle filtering and pagination on frontend
  const { data: blogsData, isLoading, error, refetch } = useQuery({
    queryKey: ['blogs-all'],
    queryFn: async (): Promise<Blog[]> => {
      // Fetch all blogs at once for frontend pagination
      const response = await fetch(`/api/blogs?page_size=1000`); // Get a very large number to get all blogs
      if (!response.ok) throw new Error('Failed to fetch blogs');
      const data = await response.json();
      return data.blogs || data; // Handle both paginated and non-paginated responses
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const blogs = blogsData || [];

  // Filter blogs on the frontend
  const filteredBlogs = blogs.filter(blog => {
    // Search filter
    if (search) {
      const searchTerm = search.toLowerCase();
      const matchesSearch = 
        blog.title.toLowerCase().includes(searchTerm) ||
        (blog.excerpt && blog.excerpt.toLowerCase().includes(searchTerm)) ||
        (blog.content && blog.content.toLowerCase().includes(searchTerm)) ||
        (blog.tags && blog.tags.some((tag: { id: number; name: string }) => tag.name.toLowerCase().includes(searchTerm)));
      
      if (!matchesSearch) return false;
    }
    
    // Category filter
    if (selectedCategory && blog.category?.id !== selectedCategory) {
      return false;
    }
    
    // Tag filter
    if (selectedTag && !blog.tags?.some((tag: { id: number; name: string }) => tag.name.toLowerCase() === selectedTag.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  // Paginate the filtered results for standard pagination (not cumulative)
  const totalPages = Math.ceil(filteredBlogs.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedBlogs = filteredBlogs.slice(startIndex, endIndex);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  const loadMore = useCallback(() => {
    if (hasNextPage) {
      setPage(prev => prev + 1);
    }
  }, [hasNextPage]);

  const goToPage = useCallback((pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setPage(pageNumber);
      // Smooth scroll to top of blog section
      setTimeout(() => {
        const blogSection = document.querySelector('[data-blog-section]');
        if (blogSection) {
          blogSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setPage(prev => prev + 1);
      // Smooth scroll to top of blog section
      setTimeout(() => {
        const blogSection = document.querySelector('[data-blog-section]');
        if (blogSection) {
          blogSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [hasNextPage]);

  const prevPage = useCallback(() => {
    if (hasPrevPage) {
      setPage(prev => prev - 1);
      // Smooth scroll to top of blog section
      setTimeout(() => {
        const blogSection = document.querySelector('[data-blog-section]');
        if (blogSection) {
          blogSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [hasPrevPage]);

  // Reset pagination when filters change
  const resetPagination = useCallback(() => {
    setPage(1);
  }, []);

  return {
    blogs: paginatedBlogs,
    allBlogs: filteredBlogs, // Filtered blogs for current filters
    totalBlogs: blogs, // All blogs without any filters for category counts
    loadMore,
    hasNextPage,
    hasPrevPage,
    goToPage,
    nextPage,
    prevPage,
    totalPages,
    isFetchingNextPage: false, // Not needed for this approach
    isLoading,
    error,
    refetch,
    resetPagination,
    totalCount: filteredBlogs.length,
    currentPage: page,
    pageSize // Return the page size for display purposes
  };
};
