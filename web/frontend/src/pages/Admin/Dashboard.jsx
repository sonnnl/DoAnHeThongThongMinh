/**
 * FILE: web/frontend/src/pages/Admin/Dashboard.jsx
 * MỤC ĐÍCH: Trang tổng quan Admin/Moderator (thống kê reports)
 * QUAN TRỌNG: Chỉ truy cập bởi user role admin/moderator (đã bảo vệ bằng AdminRoute trong App.jsx)
 */

import { useQuery } from "react-query";
import { Link } from "react-router-dom";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiUsers,
  FiChevronRight,
  FiFolder,
} from "react-icons/fi";
import reportsAPI from "../../services/api/reports";

const Dashboard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "reportStats", { days: 30 }],
    queryFn: () => reportsAPI.getReportStats({ days: 30 }),
  });
  const stats = data;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="breadcrumbs text-sm">
          <ul>
            <li>
              <Link to="/">Trang chủ</Link>
            </li>
            <li>Admin</li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="stat bg-base-100 shadow border border-base-300 rounded-xl">
          <div className="stat-figure text-warning">
            <FiAlertTriangle className="text-2xl" />
          </div>
          <div className="stat-title">Reports Pending</div>
          <div className="stat-value text-warning">
            {isLoading ? "..." : stats.pending || 0}
          </div>
        </div>

        <div className="stat bg-base-100 shadow border border-base-300 rounded-xl">
          <div className="stat-figure text-success">
            <FiCheckCircle className="text-2xl" />
          </div>
          <div className="stat-title">Reports Accepted</div>
          <div className="stat-value text-success">
            {isLoading ? "..." : stats.accepted || 0}
          </div>
        </div>

        <div className="stat bg-base-100 shadow border border-base-300 rounded-xl">
          <div className="stat-figure text-error">
            <FiXCircle className="text-2xl" />
          </div>
          <div className="stat-title">Reports Rejected</div>
          <div className="stat-value text-error">
            {isLoading ? "..." : stats.rejected || 0}
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow border border-base-300">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h2 className="card-title">Top người dùng bị report (đã accept)</h2>
            <Link
              to="/admin/reports"
              className="btn btn-sm btn-primary btn-outline"
            >
              Quản lý Reports <FiChevronRight />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Badge</th>
                  <th>Reports accepted (30 ngày)</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={3} className="text-center">
                      Đang tải...
                    </td>
                  </tr>
                )}
                {!isLoading &&
                  (stats.topReportedUsers?.length ? (
                    stats.topReportedUsers.map((item) => (
                      <tr key={item.user?._id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="avatar">
                              <div className="w-10 h-10 rounded-full">
                                <img
                                  src={
                                    item.user?.avatar ||
                                    "https://ui-avatars.com/api/?name=" +
                                      (item.user?.username || "user")
                                  }
                                  alt={item.user?.username}
                                />
                              </div>
                            </div>
                            <div>
                              <div className="font-bold">
                                {item.user?.username}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>{item.user?.badge}</td>
                        <td className="font-semibold">{item.reportsCount}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="text-center">
                        Không có dữ liệu
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick admin navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <Link
          to="/admin/users"
          className="card bg-base-100 border border-base-300 shadow hover:shadow-lg transition"
        >
          <div className="card-body flex-row items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10 text-primary">
              <FiUsers className="text-2xl" />
            </div>
            <div className="flex-1">
              <h3 className="card-title">Quản lý người dùng</h3>
              <p className="text-sm text-base-content/60">
                Tìm kiếm, đổi role, ban/gỡ ban
              </p>
            </div>
            <FiChevronRight />
          </div>
        </Link>
        <Link
          to="/admin/categories"
          className="card bg-base-100 border border-base-300 shadow hover:shadow-lg transition"
        >
          <div className="card-body flex-row items-center gap-4">
            <div className="p-3 rounded-lg bg-secondary/10 text-secondary">
              <FiFolder className="text-2xl" />
            </div>
            <div className="flex-1">
              <h3 className="card-title">Quản lý danh mục</h3>
              <p className="text-sm text-base-content/60">
                Tạo, sửa, xóa categories
              </p>
            </div>
            <FiChevronRight />
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
