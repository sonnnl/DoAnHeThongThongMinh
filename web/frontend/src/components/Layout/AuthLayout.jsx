/**
 * FILE: web/frontend/src/components/Layout/AuthLayout.jsx
 * MỤC ĐÍCH: Layout cho authentication pages (Login)
 * LƯU Ý: Chỉ dùng Google OAuth, không có Register form
 */

import { Outlet, Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

const AuthLayout = () => {
  const { isAuthenticated } = useAuthStore();

  // Nếu đã login thì redirect về home
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-base-200">
      <Outlet />
    </div>
  );
};

export default AuthLayout;
