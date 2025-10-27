/**
 * FILE: web/frontend/src/components/Auth/GoogleLoginButton.jsx
 * MỤC ĐÍCH: Google OAuth Login Button
 */

import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import toast from "react-hot-toast";
import { jwtDecode } from "jwt-decode";

const GoogleLoginButton = () => {
  const navigate = useNavigate();
  const { googleLogin } = useAuthStore();

  const handleSuccess = async (credentialResponse) => {
    try {
      // Decode JWT token để lấy thông tin user
      const decoded = jwtDecode(credentialResponse.credential);

      console.log("Google user info:", decoded);

      // Gọi backend API để xác thực
      const result = await googleLogin({
        token: credentialResponse.credential,
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
        googleId: decoded.sub,
      });

      if (result.success) {
        toast.success("Đăng nhập Google thành công!");
        navigate("/");
      } else {
        toast.error(result.error || "Đăng nhập thất bại");
      }
    } catch (error) {
      console.error("Google login error:", error);
      toast.error("Đăng nhập Google thất bại");
    }
  };

  const handleError = () => {
    toast.error("Đăng nhập Google thất bại");
  };

  return (
    <div className="w-full">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        useOneTap={false}
        theme="outline"
        size="large"
        text="continue_with"
        shape="rectangular"
        logo_alignment="left"
        width="100%"
      />
    </div>
  );
};

export default GoogleLoginButton;
