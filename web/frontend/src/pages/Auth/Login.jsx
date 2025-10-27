/**
 * FILE: web/frontend/src/pages/Auth/Login.jsx
 * MỤC ĐÍCH: Trang đăng nhập (CHỈ GOOGLE OAUTH)
 * LƯU Ý: Chỉ hỗ trợ đăng nhập bằng Google, không có email/password
 */

import GoogleLoginButton from "../../components/Auth/GoogleLoginButton";
import { FiShield, FiZap, FiUsers } from "react-icons/fi";

const Login = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-5xl w-full grid md:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="hidden md:block space-y-6">
          <h1 className="text-6xl font-bold">
            <span className="text-primary">Forum</span>
            <br />
            <span className="text-base-content">Community</span>
          </h1>
          <p className="text-xl text-base-content/70">
            Nơi chia sẻ kiến thức và thảo luận với cộng đồng
          </p>

          <div className="space-y-4 pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <FiShield className="text-2xl text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg">An toàn & Bảo mật</h3>
                <p className="text-base-content/60">
                  Đăng nhập nhanh chóng với tài khoản Google
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <FiZap className="text-2xl text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg">AI-Powered</h3>
                <p className="text-base-content/60">
                  Phát hiện spam, toxic và cảm xúc tự động
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <FiUsers className="text-2xl text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Cộng đồng thân thiện</h3>
                <p className="text-base-content/60">
                  Kết nối với hàng nghìn người dùng
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login */}
        <div className="card w-full bg-base-100 shadow-2xl border border-base-300">
          <div className="card-body items-center text-center p-8 md:p-12">
            {/* Mobile title */}
            <div className="md:hidden mb-6">
              <h1 className="text-4xl font-bold mb-2">
                <span className="text-primary">Forum</span>
              </h1>
              <p className="text-base-content/70">Nơi chia sẻ kiến thức</p>
            </div>

            {/* Icon */}
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mb-6">
              <FiUsers className="text-4xl text-primary-content" />
            </div>

            <h2 className="text-3xl font-bold mb-3">Chào mừng trở lại!</h2>

            <p className="text-base-content/70 mb-8 max-w-sm">
              Đăng nhập bằng tài khoản Google của bạn để bắt đầu tham gia cộng
              đồng
            </p>

            {/* Google Login Button */}
            <div className="w-full max-w-sm">
              <GoogleLoginButton />
            </div>

            {/* Info */}
            <div className="mt-8 p-4 bg-base-200 rounded-lg max-w-sm">
              <p className="text-sm text-base-content/60">
                🔒 Chúng tôi không lưu trữ mật khẩu của bạn. Đăng nhập an toàn
                thông qua Google OAuth 2.0
              </p>
            </div>

            {/* Terms */}
            <p className="text-xs text-base-content/50 mt-6">
              Bằng việc đăng nhập, bạn đồng ý với{" "}
              <a href="#" className="link link-primary">
                Điều khoản dịch vụ
              </a>{" "}
              và{" "}
              <a href="#" className="link link-primary">
                Chính sách bảo mật
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
