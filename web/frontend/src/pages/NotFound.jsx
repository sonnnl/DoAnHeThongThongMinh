/**
 * FILE: web/frontend/src/pages/NotFound.jsx
 * MỤC ĐÍCH: 404 Not Found page
 */

import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-9xl font-bold text-primary">404</h1>
      <h2 className="text-3xl font-bold mt-4">Không tìm thấy trang</h2>
      <p className="text-base-content/60 mt-2 mb-6">
        Trang bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
      </p>
      <Link to="/" className="btn btn-primary">
        Về trang chủ
      </Link>
    </div>
  );
};

export default NotFound;
