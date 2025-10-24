import api from "./axios.config";
import cacheService from "../cache.service";

const SESSION_ENDPOINTS = {
  SESSIONS: "/sessions",
  TODAY: "/sessions/today",
  STATS: "/sessions/stats",
};

export const sessionService = {
  /**
   * Get all sessions with optional filters
   */
  async getSessions(filters = {}) {
    try {
      const params = {};

      if (filters.teacherId) params.teacherId = filters.teacherId;
      if (filters.middleSchoolGrade) params.middleSchoolGrade = filters.middleSchoolGrade;
      if (filters.highSchoolGrade) params.highSchoolGrade = filters.highSchoolGrade;
      if (filters.branch) params.branch = filters.branch;
      if (filters.status && filters.status !== "null") params.status = filters.status;
      if (filters.sessionType) params.sessionType = filters.sessionType;
      if (filters.page) params.page = filters.page;
      if (filters.limit) params.limit = filters.limit;

      // Note: This endpoint needs to be added to the backend
      const response = await api.get(SESSION_ENDPOINTS.SESSIONS, { params });
      
      // Express backend returns { success: true, data: [...], pagination: {...} }
      return {
        data: response.data.data || [],
        pagination: response.data.pagination || { page: 1, limit: 10, total: 0 },
      };
    } catch (error) {
      console.error("Error fetching sessions:", error);
      // Return empty data if endpoint doesn't exist yet
      return { data: [], pagination: { page: 1, limit: 10, total: 0 } };
    }
  },

  /**
   * Get today's sessions
   */
  async getTodaysSessions() {
    try {
      const response = await api.get(SESSION_ENDPOINTS.TODAY);
      return response.data;
    } catch (error) {
      console.error("Error fetching today's sessions:", error);
      // Return empty data if endpoint doesn't exist yet
      return { data: [] };
    }
  },

  /**
   * Get session statistics
   */
  async getSessionStats() {
    try {
      const response = await api.get(SESSION_ENDPOINTS.STATS);
      return response.data;
    } catch (error) {
      console.error("Error fetching session stats:", error);
      // Return empty data if endpoint doesn't exist yet
      return { data: { total: 0, scheduled: 0, completed: 0 } };
    }
  },

  /**
   * Get a single session by ID
   */
  async getSession(sessionId, params = {}) {
    try {
      const response = await api.get(
        `${SESSION_ENDPOINTS.SESSIONS}/${sessionId}`,
        { params }
      );
      // Express backend returns { success: true, data: {...}, attendancesPagination: {...}, instancesPagination: {...} }
      return response.data;
    } catch (error) {
      console.error("Error fetching session:", error);
      throw error;
    }
  },

  /**
   * Create a new session
   */
  async createSession(sessionData) {
    try {
      const response = await api.post(SESSION_ENDPOINTS.SESSIONS, sessionData);
      // Express backend returns { success: true, data: {...} }
      return response.data;
    } catch (error) {
      console.error("Error creating session:", error);
      throw error;
    }
  },

  /**
   * Update a session
   */
  async updateSession(sessionId, sessionData) {
    try {
      const response = await api.patch(
        `${SESSION_ENDPOINTS.SESSIONS}/${sessionId}`,
        sessionData,
      );
      // Express backend returns { success: true, data: {...} }
      return response.data;
    } catch (error) {
      console.error("Error updating session:", error);
      throw error;
    }
  },

  /**
   * Delete a session
   */
  async deleteSession(sessionId) {
    try {
      const response = await api.delete(
        `${SESSION_ENDPOINTS.SESSIONS}/${sessionId}`,
      );
      // Express backend returns { success: true, message: "..." }
      return response.data;
    } catch (error) {
      console.error("Error deleting session:", error);
      throw error;
    }
  },

  /**
   * Transform session data for form submission to Express backend
   */
  transformSessionForSubmission(formData) {
    // Convert duration from string format to minutes
    const durationMap = {
      '1h': 60,
      '1.5h': 90,
      '2h': 120,
      '2.5h': 150,
      '3h': 180,
    };

    const data = {
      title: formData.title || `Session ${formData.year_target}`,
      teacherId: formData.teacherId || formData.teacher,
      sessionType: formData.sessionType || 'ONE_TIME',
      duration: durationMap[formData.duration] || parseInt(formData.duration, 10) || 60,
      pricePerSession: parseFloat(formData.pricePerSession || 0),
      group: parseInt(formData.group || 1, 10),
    };

    // Handle ONE_TIME vs REPETITIVE sessions
    if (data.sessionType === 'ONE_TIME') {
      data.dateTime = formData.dateTime || new Date(formData.date + 'T' + formData.time).toISOString();
    } else if (data.sessionType === 'REPETITIVE') {
      data.repeatDays = formData.repeatDays || [];
      data.startTime = formData.startTime;
    }

    // Handle grade levels from year_target (old format)
    if (formData.year_target) {
      const yearMap = {
        '1AM': 'GRADE_1',
        '2AM': 'GRADE_2',
        '3AM': 'GRADE_3',
        '4AM': 'GRADE_4',
        '1AS': 'GRADE_1',
        '2AS': 'GRADE_2',
        '3AS': 'GRADE_3',
      };
      
      const grade = yearMap[formData.year_target];
      if (formData.year_target.endsWith('AM')) {
        data.middleSchoolGrade = grade;
      } else if (formData.year_target.endsWith('AS')) {
        data.highSchoolGrade = grade;
      }
    }

    // Handle grade levels (new format)
    if (formData.middleSchoolGrade) {
      data.middleSchoolGrade = formData.middleSchoolGrade;
    }
    if (formData.highSchoolGrade) {
      data.highSchoolGrade = formData.highSchoolGrade;
    }
    
    // Handle branch from branch_ids array - take first one
    if (formData.branch_ids && formData.branch_ids.length > 0) {
      // branch_ids now contains the enum values directly
      data.branch = formData.branch_ids[0];
    }
    
    // Handle branch (new format)
    if (formData.branch) {
      data.branch = formData.branch;
    }

    // Handle status
    if (formData.status) {
      data.status = formData.status;
    }

    return data;
  },

  /**
   * Update session status helper
   */
  async updateSessionStatus(sessionId, status) {
    return this.updateSession(sessionId, { status });
  },
};

export default sessionService;
