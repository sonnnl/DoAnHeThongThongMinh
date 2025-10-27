/**
 * FILE: web/frontend/src/components/Sidebar/Sidebar.jsx
 * MỤC ĐÍCH: Sidebar component với navigation links
 */

import { Link, useLocation } from "react-router-dom";
import {
  FiHome,
  FiTrendingUp,
  FiFolder,
  FiBookmark,
  FiUsers,
  FiSettings,
} from "react-icons/fi";
import { useAuthStore } from "../../store/authStore";

const Sidebar = () => {
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();

  const menuItems = [
    { path: "/", label: "Trang chủ", icon: FiHome, public: true },
    {
      path: "/posts?sort=trending",
      label: "Thịnh hành",
      icon: FiTrendingUp,
      public: true,
    },
    { path: "/categories", label: "Danh mục", icon: FiFolder, public: true },
    { path: "/posts/saved", label: "Đã lưu", icon: FiBookmark, public: false },
    // Only add profile link if user has username
    ...(user?.username ? [{
      path: `/u/${user.username}`,
      label: "Profile",
      icon: FiUsers,
      public: false,
    }] : []),
    { path: "/settings", label: "Cài đặt", icon: FiSettings, public: false },
  ];

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="bg-base-100 rounded-lg shadow-lg border border-base-300">
      <div className="p-4">
        <h3 className="font-bold text-sm text-base-content/60 mb-3">MENU</h3>
        <ul className="menu menu-compact gap-1">
          {menuItems.map((item) => {
            // Nếu item không public và user chưa login thì skip
            if (!item.public && !isAuthenticated) return null;

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`gap-3 rounded-lg ${
                    isActive(item.path)
                      ? "bg-primary text-primary-content font-semibold"
                      : "hover:bg-base-200"
                  }`}
                >
                  <item.icon className="text-lg" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* User card */}
      {isAuthenticated && user && (
        <div className="border-t border-base-300 p-4">
          <div className="flex items-center gap-3 mb-4">
            {user.avatar ? (
              <div className="avatar">
                <div className="w-12 h-12 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                  <img src={user.avatar} alt={user.username} />
                </div>
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary text-primary-content flex items-center justify-center">
                <FiUsers className="text-xl" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate">{user.username}</p>
              <p className="text-xs text-base-content/60">{user.badge}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-base-200 rounded-lg p-2">
              <p className="text-xs text-base-content/60">Posts</p>
              <p className="font-bold text-lg">{user.stats?.postsCount || 0}</p>
            </div>
            <div className="bg-base-200 rounded-lg p-2">
              <p className="text-xs text-base-content/60">Karma</p>
              <p className="font-bold text-lg text-primary">
                {user.stats?.upvotesReceived || 0}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
