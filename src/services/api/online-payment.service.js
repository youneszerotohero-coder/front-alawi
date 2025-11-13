import api from "./axios.config";

const ONLINE_PAYMENT_ENDPOINTS = {
  CHECK_ACTIVE: "/online-payments/check-active",
  ACTIVE: "/online-payments/active",
  ENABLE_MONTHLY: "/online-payments/enable-monthly",
};

export const onlinePaymentService = {
  /**
   * Check if the current student has an active online payment
   * @returns {Promise<boolean>}
   */
  async checkActivePayment() {
    try {
      const response = await api.get(ONLINE_PAYMENT_ENDPOINTS.CHECK_ACTIVE);
      return response.data?.success && response.data?.hasActivePayment === true;
    } catch (error) {
      console.error("Error checking active online payment:", error);
      return false;
    }
  },

  /**
   * Get active online payments for the current student
   * @returns {Promise<Object>}
   */
  async getActivePayments() {
    try {
      const response = await api.get(ONLINE_PAYMENT_ENDPOINTS.ACTIVE);
      return response.data;
    } catch (error) {
      console.error("Error fetching active online payments:", error);
      throw error;
    }
  },

  /**
   * Admin: Enable monthly online payment for a student
   * @param {string} studentId - The ID of the student
   * @returns {Promise<Object>}
   */
  async enableMonthlyPayment(studentId) {
    try {
      const response = await api.post(ONLINE_PAYMENT_ENDPOINTS.ENABLE_MONTHLY, {
        studentId,
      });
      return response.data;
    } catch (error) {
      console.error("Error enabling monthly online payment:", error);
      throw error;
    }
  },
};

