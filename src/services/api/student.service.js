import api from "./axios.config";

export const studentService = {
  /**
   * Get student information by ID
   */
  async getStudentById(studentId) {
    try {
      const response = await api.get(`/students/${studentId}`);
      // Express backend returns { success: true, data: {...} }
      return response.data;
    } catch (error) {
      console.error("Error fetching student by ID:", error);
      throw error;
    }
  },

  /**
   * Get student with sessions (for check-in purposes)
   */
  async getStudentWithSessions(studentId) {
    try {
      const response = await api.get(`/students/${studentId}`);
      // Express backend returns { success: true, data: {...} }
      // The backend includes attendances and payments in the student data
      return response.data;
    } catch (error) {
      console.error("Error fetching student with sessions:", error);
      throw error;
    }
  },
};
