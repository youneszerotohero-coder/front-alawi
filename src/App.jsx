import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { loginSuccess } from "./store/slices/authSlice";
import AppRouter from "./routes/router";
import { Toaster } from "./components/ui/toaster";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Restore auth state from localStorage on app load
    // Token is in httpOnly cookie, we only need to restore user data
    const userStr = localStorage.getItem("user");
    const deviceUuid = localStorage.getItem("device_uuid");

    console.log("🔍 App.jsx - Checking localStorage:", {
      hasUser: !!userStr,
      deviceUuid: deviceUuid,
    });

    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        // Restore Redux state from localStorage (token is in cookie)
        dispatch(loginSuccess({ user }));
        console.log("✅ Auth state restored from localStorage", {
          user,
          deviceUuid,
        });
      } catch (error) {
        console.error("❌ Failed to restore auth state:", error);
        // Clear invalid data
        localStorage.removeItem("user");
      }
    }
  }, [dispatch]);

  return (
    <>
      <AppRouter />
      <Toaster />
    </>
  );
}

export default App;
