import api from "./axios.config";

const ONLINE_PAYMENT_ENDPOINTS = {
  CHECK_ACTIVE: "/online-payments/check-active",
  ACTIVE: "/online-payments/active",
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
};

