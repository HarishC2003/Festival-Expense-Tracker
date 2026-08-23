import { supabase } from './supabase';

const originalFetch = window.fetch;

// Intercept fetch calls to inject auth and group headers automatically
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  
  // Only intercept our API requests
  if (url.includes('/api/')) {
    const groupId = localStorage.getItem('activeGroupId');
    const { data: { session } } = await supabase.auth.getSession();
    
    const headers = new Headers(init?.headers || {});
    
    if (session?.access_token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${session.access_token}`);
    }
    
    if (groupId && !headers.has('X-Group-Id')) {
      headers.set('X-Group-Id', groupId);
    }
    
    // Auto set content-type for JSON if not FormData
    if (init?.body && typeof init.body === 'string' && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    try {
      const response = await originalFetch(input, { ...init, headers });
      
      if (response.status === 401) {
        window.dispatchEvent(new CustomEvent('session-expired'));
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  return originalFetch(input, init);
};

export {};
