/**
 * FILE: web/frontend/src/pages/Auth/Register.jsx
 * MỤC ĐÍCH: Redirect to Login (vì chỉ dùng Google OAuth)
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect về login vì không có register form
    navigate("/login", { replace: true });
  }, [navigate]);

  return null;
};

export default Register;
