import api from "./axios.config";

export const paymentService = {
  /**
   * Create a payment for a student and session
   * @param {Object} data - Payment data
   * @param {string} data.sessionId - Session ID
   * @param {string} data.studentId - Student ID
   * @param {number} data.amount - Payment amount
   * @param {number} data.sessionsCount - Number of sessions (1 for single session, 4 for monthly)
   * @param {string} data.paymentMethod - Payment method (optional, defaults to 'cash')
   */
  async createPayment(data) {
    try {
      const response = await api.post("/payments", data);
      return response.data;
    } catch (error) {
      console.error("Error creating payment:", error);
      throw error;
    }
  },

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId) {
    try {
      const response = await api.get(`/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching payment:", error);
      throw error;
    }
  },

  /**
   * Get all payments with filters
   */
  async getPayments(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.page) params.append("page", filters.page);
      if (filters.limit) params.append("limit", filters.limit);
      if (filters.studentId) params.append("studentId", filters.studentId);
      if (filters.sessionId) params.append("sessionId", filters.sessionId);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.paymentMethod) params.append("paymentMethod", filters.paymentMethod);

      const queryString = params.toString() ? `?${params.toString()}` : "";
      const response = await api.get(`/payments${queryString}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching payments:", error);
      throw error;
    }
  },

  /**
   * Get payments by student
   */
  async getPaymentsByStudent(studentId, page = 1, limit = 10) {
    try {
      const response = await api.get(`/payments?studentId=${studentId}&page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching student payments:", error);
      throw error;
    }
  },

  /**
   * Update payment
   */
  async updatePayment(paymentId, data) {
    try {
      const response = await api.put(`/payments/${paymentId}`, data);
      return response.data;
    } catch (error) {
      console.error("Error updating payment:", error);
      throw error;
    }
  },

  /**
   * Delete payment
   */
  async deletePayment(paymentId) {
    try {
      const response = await api.delete(`/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting payment:", error);
      throw error;
    }
  },

  /**
   * Get revenue statistics
   */
  async getRevenue(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.sessionId) params.append("sessionId", filters.sessionId);

      const queryString = params.toString() ? `?${params.toString()}` : "";
      const response = await api.get(`/payments/revenue${queryString}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching revenue:", error);
      throw error;
    }
  },
};
