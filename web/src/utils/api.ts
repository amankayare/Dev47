// API utilities with automatic token expiration handling

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export const handleTokenExpiration = (errorMessage?: string) => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Store the error message for the login page to display
  if (errorMessage) {
    localStorage.setItem('authError', errorMessage);
  } else {
    localStorage.setItem('authError', 'Your session has expired. Please login again.');
  }
  
  // Redirect to login page
  window.location.href = '/login';
};

export const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    handleTokenExpiration();
    throw new AuthError('No authentication token found');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle token expiration
  if (response.status === 401) {
    const errorData = await response.json().catch(() => ({}));
    
    // Determine the appropriate error message based on server response
    let errorMessage = 'Your session has expired. Please login again.';
    if (errorData.error === 'token_expired') {
      errorMessage = 'Your session has expired. Please login again.';
    } else if (errorData.error === 'invalid_token') {
      errorMessage = 'Invalid session detected. Please login again.';
    } else if (errorData.error === 'no_token') {
      errorMessage = 'Authentication required. Please login to continue.';
    }
    
    // Redirect to login with appropriate message
    handleTokenExpiration(errorMessage);
    throw new AuthError('Authentication token has expired or is invalid');
  }

  return response;
};

export const apiGet = async (url: string): Promise<any> => {
  const response = await authenticatedFetch(url);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Failed to fetch from ${url}`);
  }
  
  return response.json();
};

export const apiPost = async (url: string, data: any): Promise<any> => {
  const response = await authenticatedFetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Failed to post to ${url}`);
  }
  
  return response.json();
};

export const apiPut = async (url: string, data: any): Promise<any> => {
  const response = await authenticatedFetch(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Failed to update ${url}`);
  }
  
  return response.json();
};

export const apiDelete = async (url: string): Promise<any> => {
  const response = await authenticatedFetch(url, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Failed to delete from ${url}`);
  }
  
  // Handle 204 No Content response (successful delete with no body)
  if (response.status === 204) {
    return null;
  }
  
  // Only try to parse JSON if there's content
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  
  return null;
};
