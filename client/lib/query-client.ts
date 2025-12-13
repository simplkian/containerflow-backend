import { QueryClient, QueryFunction } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Auth storage key - must match AuthContext
const AUTH_STORAGE_KEY = "@containerflow_auth_user";

// Enable debug logging in development
const DEBUG_API = __DEV__ || process.env.NODE_ENV === "development";

function logApi(method: string, url: string, status?: number, error?: string) {
  if (DEBUG_API) {
    if (error) {
      console.warn(`[API ERROR] ${method} ${url} - ${error}`);
    } else if (status) {
      console.log(`[API] ${method} ${url} -> ${status}`);
    } else {
      console.log(`[API] ${method} ${url}`);
    }
  }
}

// API URL Configuration
// EXPO_PUBLIC_DOMAIN is set by Replit at startup to "$REPLIT_DEV_DOMAIN:5000"
// This ensures all API requests go to the Express backend on port 5000
// The Expo app NEVER connects directly to Supabase - all DB access goes through the backend
export function getApiUrl(): string {
  const host = process.env.EXPO_PUBLIC_DOMAIN;

  if (!host) {
    console.warn(
      "[API CONFIG] EXPO_PUBLIC_DOMAIN is not set. Network requests will fail. " +
      "Set this environment variable to your API domain (e.g., 'your-domain.replit.dev:5000')"
    );
    return "http://localhost:5000";
  }

  // Determine protocol based on host
  const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1");
  const protocol = isLocalhost ? "http" : "https";
  
  const url = `${protocol}://${host}`;
  
  if (DEBUG_API) {
    console.log(`[API CONFIG] Base URL: ${url}`);
  }
  
  return url;
}

// Get current user ID from AsyncStorage for auth headers
async function getStoredUserId(): Promise<string | null> {
  try {
    const storedUser = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    if (storedUser) {
      const user = JSON.parse(storedUser);
      return user.id || null;
    }
  } catch {
    // Ignore errors - no user stored
  }
  return null;
}

// Custom error class for API errors with detailed info
export class ApiError extends Error {
  status: number;
  statusText: string;
  url: string;
  isHtmlResponse: boolean;
  isNetworkError: boolean;
  
  constructor(options: {
    message: string;
    status?: number;
    statusText?: string;
    url: string;
    isHtmlResponse?: boolean;
    isNetworkError?: boolean;
  }) {
    super(options.message);
    this.name = "ApiError";
    this.status = options.status || 0;
    this.statusText = options.statusText || "";
    this.url = options.url;
    this.isHtmlResponse = options.isHtmlResponse || false;
    this.isNetworkError = options.isNetworkError || false;
  }
  
  toUserMessage(): string {
    if (this.isNetworkError) {
      return `Netzwerkfehler: Server nicht erreichbar. Bitte Internetverbindung prüfen.`;
    }
    if (this.isHtmlResponse) {
      return `API-Konfigurationsfehler: Server antwortet mit HTML statt JSON. Bitte EXPO_PUBLIC_DOMAIN prüfen.`;
    }
    if (this.status === 401) {
      return `Nicht angemeldet. Bitte erneut einloggen.`;
    }
    if (this.status === 403) {
      return `Keine Berechtigung für diese Aktion.`;
    }
    if (this.status === 404) {
      return `Nicht gefunden.`;
    }
    if (this.status >= 500) {
      return `Serverfehler (${this.status}). Bitte später erneut versuchen.`;
    }
    return this.message;
  }
}

// Parse response and throw detailed errors
async function handleResponse(res: Response, url: string, method: string): Promise<void> {
  const contentType = res.headers.get("content-type") || "";
  
  // Detect HTML response (misconfiguration - hitting wrong server)
  if (contentType.includes("text/html")) {
    const snippet = (await res.text()).substring(0, 100);
    logApi(method, url, res.status, `Got HTML instead of JSON: ${snippet}...`);
    throw new ApiError({
      message: `API misconfigured: received HTML instead of JSON. URL: ${url}`,
      status: res.status,
      statusText: res.statusText,
      url,
      isHtmlResponse: true,
    });
  }
  
  if (!res.ok) {
    let errorMessage = res.statusText;
    
    // Try to extract error message from JSON response
    if (contentType.includes("application/json")) {
      try {
        const errorData = await res.json();
        errorMessage = errorData.error || errorData.message || errorData.details || res.statusText;
      } catch {
        // Failed to parse JSON, use status text
      }
    } else {
      // Try to get text content
      try {
        const text = await res.text();
        if (text && text.length < 200) {
          errorMessage = text;
        }
      } catch {
        // Ignore
      }
    }
    
    logApi(method, url, res.status, errorMessage);
    throw new ApiError({
      message: `${res.status}: ${errorMessage}`,
      status: res.status,
      statusText: res.statusText,
      url,
    });
  }
  
  logApi(method, url, res.status);
}

export async function apiRequest(
  method: string,
  route: string,
  data?: unknown | undefined,
): Promise<Response> {
  const baseUrl = getApiUrl();
  const url = new URL(route, baseUrl);
  const urlString = url.toString();

  logApi(method, urlString);

  // Build headers with authentication
  const headers: Record<string, string> = {};
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  // Include user ID for authentication on protected routes
  const userId = await getStoredUserId();
  if (userId) {
    headers["x-user-id"] = userId;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });
  } catch (error) {
    // Network error - fetch itself failed
    const errorMsg = error instanceof Error ? error.message : "Unknown network error";
    logApi(method, urlString, undefined, `Network error: ${errorMsg}`);
    throw new ApiError({
      message: `Network error: ${errorMsg}. URL: ${urlString}`,
      url: urlString,
      isNetworkError: true,
    });
  }

  // Check for errors (HTML response, HTTP errors)
  await handleResponse(res, urlString, method);
  
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const baseUrl = getApiUrl();
    const url = new URL(queryKey[0] as string, baseUrl);

    if (queryKey.length > 1 && queryKey[1]) {
      const params = queryKey[1] as Record<string, string>;
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined) {
          url.searchParams.append(key, params[key]);
        }
      });
    }

    const urlString = url.toString();
    logApi("GET", urlString);

    // Build headers with authentication
    const headers: Record<string, string> = {};
    const userId = await getStoredUserId();
    if (userId) {
      headers["x-user-id"] = userId;
    }

    let res: Response;
    try {
      res = await fetch(url, {
        headers,
        credentials: "include",
      });
    } catch (error) {
      // Network error
      const errorMsg = error instanceof Error ? error.message : "Unknown network error";
      logApi("GET", urlString, undefined, `Network error: ${errorMsg}`);
      throw new ApiError({
        message: `Network error: ${errorMsg}. URL: ${urlString}`,
        url: urlString,
        isNetworkError: true,
      });
    }

    // Handle 401 specially if configured
    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      logApi("GET", urlString, 401, "Unauthorized (returning null)");
      return null;
    }

    // Check content type for HTML (misconfiguration)
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("text/html")) {
      const snippet = (await res.text()).substring(0, 100);
      logApi("GET", urlString, res.status, `Got HTML instead of JSON: ${snippet}...`);
      throw new ApiError({
        message: `API misconfigured: received HTML instead of JSON. URL: ${urlString}`,
        status: res.status,
        statusText: res.statusText,
        url: urlString,
        isHtmlResponse: true,
      });
    }

    if (!res.ok) {
      let errorMessage = res.statusText;
      if (contentType.includes("application/json")) {
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorData.message || res.statusText;
        } catch {
          // Use status text
        }
      }
      logApi("GET", urlString, res.status, errorMessage);
      throw new ApiError({
        message: `${res.status}: ${errorMessage}`,
        status: res.status,
        statusText: res.statusText,
        url: urlString,
      });
    }

    logApi("GET", urlString, res.status);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
    mutations: {
      retry: false,
    },
  },
});
