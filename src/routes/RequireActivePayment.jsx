import { Navigate } from "react-router-dom";
import { useActiveOnlinePayment } from "../hooks/useActiveOnlinePayment";

/**
 * Route guard that requires active online payment
 * Redirects to unauthorized page if student doesn't have active payment
 */
const RequireActivePayment = ({ children }) => {
  const { hasActivePayment, loading } = useActiveOnlinePayment();

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <img src="/loading.gif" alt="loading" className="mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">جارٍ التحقق من الصلاحية...</p>
        </div>
      </div>
    );
  }

  if (!hasActivePayment) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default RequireActivePayment;

