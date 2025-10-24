import axios from "axios";

// Créer une instance axios avec la configuration de base
// Use relative URL in development to leverage Vite proxy
// Use VITE_API_URL in production or when explicitly set
const baseURL = import.meta.env.VITE_API_URL || 
                (import.meta.env.DEV ? "/api/v1" : "http://localhost:3000/api/v1");

const axiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true, // Enable cookies for authentication
});

// Intercepteur pour ajouter le token d'authentification aux requêtes
// Note: Token is now stored in httpOnly cookie, so no need to manually add it
axiosInstance.interceptors.request.use(
  (config) => {
    // Cookies are automatically sent with credentials: true
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Intercepteur pour gérer les erreurs de réponse
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const status = error.response?.status;
    
    if (status === 401) {
      // Token invalid or expired - clear auth and redirect to login
      localStorage.removeItem("user");
      
      // Only redirect if not already on login/register page
      const currentPath = window.location.pathname;
      if (!currentPath.includes("/login") && !currentPath.includes("/register")) {
        window.location.href = "/login";
      }
    }
    
    return Promise.reject(error);
  },
);

export default axiosInstance;
