import { useState, useEffect } from "react";
import { onlinePaymentService } from "../services/api/online-payment.service";

/**
 * Hook to check if the current student has an active online payment
 * @returns {Object} { hasActivePayment, loading, error }
 */
export const useActiveOnlinePayment = () => {
  const [hasActivePayment, setHasActivePayment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkActivePayment = async () => {
      try {
        setLoading(true);
        setError(null);
        const isActive = await onlinePaymentService.checkActivePayment();
        setHasActivePayment(isActive);
      } catch (err) {
        console.error("Error checking active payment:", err);
        setError(err);
        setHasActivePayment(false);
      } finally {
        setLoading(false);
      }
    };

    checkActivePayment();
  }, []);

  return { hasActivePayment, loading, error };
};

