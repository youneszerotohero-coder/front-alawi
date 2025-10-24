import api from "./axios.config";

class AuthService {
  constructor() {
    this.isLoggingIn = false;
  }

  async login(phone, password) {
    try {
      // Prevent multiple simultaneous login attempts
      if (this.isLoggingIn) {
        throw new Error("Une connexion est déjà en cours...");
      }
      this.isLoggingIn = true;

      const payload = { phone, password };

      const response = await api.post("/auth/login", payload);
      const userData = response.data.data;
      
      console.log("Login response:", userData);

      // Express backend returns user data directly
      // Token is stored in httpOnly cookie automatically
      const user = {
        id: userData.id,
        phone: userData.phone,
        role: userData.role?.toLowerCase() || "student",
        createdAt: userData.createdAt,
      };

      // Store user in localStorage for quick access
      localStorage.setItem("user", JSON.stringify(user));

      return { user };
    } catch (error) {
      console.error("Login error:", error);
      throw this.handleError(error);
    } finally {
      this.isLoggingIn = false;
    }
  }

  async register(userData) {
    try {
      // Required fields: phone and password
      if (!userData.phone || !userData.password) {
        throw new Error("رقم الهاتف وكلمة المرور مطلوبان");
      }

      // Backend expects: phone, password, and optional student fields
      const payload = {
        phone: userData.phone,
        password: userData.password,
        // Optional student fields
        firstName: userData.firstName || userData.firstname || "",
        lastName: userData.lastName || userData.lastname || "",
        middleSchoolGrade: userData.middleSchoolGrade || null,
        highSchoolGrade: userData.highSchoolGrade || null,
        branch: userData.branch || null,
      };

      const response = await api.post("/auth/register", payload);
      const serverData = response.data.data;

      console.log("Register response:", serverData);

      // Backend returns the created student if student info was provided
      const user = serverData.user || {
        phone: userData.phone,
        role: "student",
      };

      const formattedUser = {
        id: user.userId || user.id,
        phone: userData.phone,
        role: "student",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
      };

      localStorage.setItem("user", JSON.stringify(formattedUser));

      return { user: formattedUser };
    } catch (error) {
      console.error("Register error:", error);
      throw this.handleError(error);
    }
  }

  async logout() {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      // If logout fails, still proceed with local cleanup
      console.warn("Logout API call failed:", error.message);
    } finally {
      // Always clean up local storage
      localStorage.removeItem("user");
      
      // Clear all cache data to avoid showing stale data after re-login
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("cache_")) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
      
      console.log("✅ Logout complete - localStorage cleaned");
    }
  }

  async getProfile() {
    try {
      const response = await api.get("/auth/me");
      const userData = response.data.data;
      
      if (userData) {
        const user = {
          id: userData.id,
          phone: userData.phone,
          role: userData.role?.toLowerCase() || "student",
          createdAt: userData.createdAt,
        };
        
        localStorage.setItem("user", JSON.stringify(user));
        return user;
      }
      return null;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getUserByPhone(phone) {
    try {
      const response = await api.get(`/auth/user-by-phone/${phone}`);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  isLoggedIn() {
    // Check if user exists in localStorage
    const user = this.getCurrentUser();
    return user !== null;
  }

  getCurrentUser() {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error("Error parsing user data:", error);
      return null;
    }
  }

  handleError(error) {
    if (error.response) {
      let message = error.response.data.message || error.response.data.error || "حدث خطأ";

      // Translate common error messages
      message = this.translateErrorMessage(message);

      // Handle express-validator errors
      if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
        const validationErrors = {};
        error.response.data.errors.forEach((err) => {
          const field = err.param || err.path || 'general';
          if (!validationErrors[field]) {
            validationErrors[field] = [];
          }
          validationErrors[field].push(this.translateErrorMessage(err.msg));
        });

        const err = new Error(message);
        err.response = {
          ...error.response,
          data: {
            ...error.response.data,
            errors: validationErrors,
          },
        };
        return err;
      }

      const err = new Error(message);
      err.response = error.response;
      return err;
    }
    return error;
  }

  translateErrorMessage(message) {
    const translations = {
      // Authentication messages
      "Invalid credentials": "بيانات الدخول غير صحيحة",
      "Not authenticated": "غير مسجل الدخول",
      "Invalid or expired token": "الجلسة منتهية الصلاحية",
      
      // Validation messages
      "phone is required": "رقم الهاتف مطلوب",
      "password is required": "كلمة المرور مطلوبة",
      "phone seems too short": "رقم الهاتف قصير جداً",
      "password must be at least 6 characters": "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
      
      // User messages
      "User with this phone already exists": "رقم الهاتف مستخدم من قبل",
      "User registered successfully": "تم التسجيل بنجاح",
      
      // General messages
      "Unauthorized": "غير مخول",
      "Forbidden": "ممنوع الوصول",
      "Not Found": "غير موجود",
      "Access denied": "تم رفض الوصول",
    };

    return translations[message] || message;
  }
}

export default new AuthService();
