import api from "./axios.config";

export const attendanceService = {
  /**
   * Mark attendance for a student in a session
   * @param {string} sessionId - Session ID
   * @param {string} studentId - Student ID
   */
  async markAttendance(sessionId, studentId) {
    try {
      const response = await api.post(`/session-instances/session/${sessionId}/check-in`, {
        studentId,
      });
      return response.data;
    } catch (error) {
      console.error("Error marking attendance:", error);
      throw error;
    }
  },

  /**
   * Get attendances for a session instance
   */
  async getAttendances(sessionInstanceId) {
    try {
      const response = await api.get(`/session-instances/${sessionInstanceId}/attendances`);
      return response.data;
    } catch (error) {
      console.error("Error fetching attendances:", error);
      throw error;
    }
  },
};
