import api from "./axios.config";

const studentsService = {
  // Get all students with filters and pagination
  async getStudents(params = {}) {
    try {
      const response = await api.get("/students", { params });
      // Express backend returns { success: true, data: [...], pagination: {...} }
      return {
        data: response.data.data,
        pagination: response.data.pagination,
      };
    } catch (error) {
      console.error("Error fetching students:", error);
      throw error;
    }
  },

  // Get student statistics for dashboard
  async getStudentStats() {
    try {
      const response = await api.get("/students/stats");
      return response.data;
    } catch (error) {
      console.error("Error fetching student stats:", error);
      // Return mock data if endpoint doesn't exist yet
      return { data: { total: 0, active: 0 } };
    }
  },

  // Get specific student details
  async getStudent(id) {
    try {
      const response = await api.get(`/students/${id}`);
      // Express backend returns { success: true, data: {...} }
      return response.data;
    } catch (error) {
      console.error("Error fetching student:", error);
      throw error;
    }
  },

  // Create new student
  async createStudent(studentData) {
    try {
      const response = await api.post("/students", studentData);
      // Express backend returns { success: true, data: {...} }
      return response.data;
    } catch (error) {
      console.error("Error creating student:", error);
      throw error;
    }
  },

  // Update student
  async updateStudent(id, studentData) {
    try {
      const response = await api.patch(`/students/${id}`, studentData);
      // Express backend returns { success: true, data: {...} }
      return response.data;
    } catch (error) {
      console.error("Error updating student:", error);
      throw error;
    }
  },

  // Delete student
  async deleteStudent(id) {
    try {
      const response = await api.delete(`/students/${id}`);
      // Express backend returns { success: true, message: "..." }
      return response.data;
    } catch (error) {
      console.error("Error deleting student:", error);
      throw error;
    }
  },

  // Update student
  async updateStudent(id, studentData) {
    try {
      const response = await api.patch(`/students/${id}`, studentData);
      return response.data;
    } catch (error) {
      console.error("Error updating student:", error);
      throw error;
    }
  },

  // Toggle free subscriber status
  async toggleFreeSubscriber(id, hasFreeSubscription) {
    try {
      const response = await api.patch(`/students/${id}`, {
        hasFreeSubscription,
      });
      return response.data;
    } catch (error) {
      console.error("Error toggling free subscriber:", error);
      throw error;
    }
  },
};

export default studentsService;
