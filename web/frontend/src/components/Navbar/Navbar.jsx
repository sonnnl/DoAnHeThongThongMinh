/**
 * FILE: web/frontend/src/components/Navbar/Navbar.jsx
 * MỤC ĐÍCH: Navigation bar component
 */

import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "react-query";
import {
  FiSearch,
  FiBell,
  FiMessageSquare,
  FiUser,
  FiSettings,
  FiLogOut,
  FiSun,
  FiMoon,
  FiMenu,
  FiPlus,
} from "react-icons/fi";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/themeStore";
import { notificationsAPI } from "../../services/api";

const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Unread notifications count for bell badge
  const { data: unreadData } = useQuery(
    ["notifications", "unreadCount"],
    () => notificationsAPI.getUnreadCount(),
    {
      enabled: isAuthenticated,
      refetchInterval: 30000,
      refetchOnWindowFocus: true,
    }
  );
  const unreadCount = unreadData?.data?.count ?? unreadData?.count ?? 0;

  return (
    <div className="bg-base-100 border-b border-base-300 sticky top-0 z-50">
      <nav className="navbar container mx-auto px-4">
        {/* Logo */}
        <div className="flex-1">
          <Link to="/" className="btn btn-ghost normal-case text-xl font-bold">
            <span className="text-primary">Forum</span>
          </Link>
        </div>

        {/* Search */}
        <div className="flex-none hidden md:flex mx-4 w-full max-w-sm">
          <form onSubmit={handleSearch} className="w-full">
            <div className="join w-full">
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="input input-bordered join-item w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="btn btn-primary join-item">
                <FiSearch className="text-lg" />
              </button>
            </div>
          </form>
        </div>

        {/* Actions */}
        <div className="flex-none">
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              className="btn btn-ghost btn-circle"
              onClick={toggleTheme}
              title={theme === "light" ? "Dark mode" : "Light mode"}
            >
              {theme === "light" ? (
                <FiMoon className="text-lg" />
              ) : (
                <FiSun className="text-lg" />
              )}
            </button>

            {isAuthenticated ? (
              <>
                {/* Create Post */}
                <Link
                  to="/post/create"
                  className="btn btn-primary btn-sm gap-2 hidden md:flex"
                >
                  <FiPlus /> Tạo bài viết
                </Link>

                {/* Notifications: simple and clean */}
                <Link
                  to="/notifications"
                  className="btn btn-ghost btn-circle"
                  title="Thông báo"
                >
                  <div className="indicator">
                    <FiBell className="text-lg" />
                    {unreadCount > 0 && (
                      <span className="badge badge-primary badge-xs indicator-item">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </div>
                </Link>

                {/* Messages */}
                <Link
                  to="/messages"
                  className="btn btn-ghost btn-circle"
                  title="Tin nhắn"
                >
                  <FiMessageSquare className="text-lg" />
                </Link>

                {/* User menu */}
                <div className="dropdown dropdown-end">
                  <label
                    tabIndex={0}
                    className="btn btn-ghost btn-circle avatar"
                  >
                    <div className="w-10 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.username} />
                      ) : (
                        <div className="bg-primary text-primary-content w-full h-full flex items-center justify-center">
                          <FiUser />
                        </div>
                      )}
                    </div>
                  </label>
                  <ul
                    tabIndex={0}
                    className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow-xl bg-base-100 rounded-box w-52 border border-base-300"
                  >
                    <li className="menu-title">
                      <span>{user?.username || "User"}</span>
                    </li>
                    {user?.username && (
                      <li>
                        <Link to={`/u/${user.username}`} className="gap-2">
                          <FiUser /> Profile
                        </Link>
                      </li>
                    )}
                    <li>
                      <Link to="/settings" className="gap-2">
                        <FiSettings /> Cài đặt
                      </Link>
                    </li>
                    <li>
                      <button
                        onClick={handleLogout}
                        className="gap-2 text-error"
                      >
                        <FiLogOut /> Đăng xuất
                      </button>
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <Link to="/login" className="btn btn-primary btn-sm gap-2">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile search */}
      <div className="md:hidden px-4 pb-3">
        <form onSubmit={handleSearch}>
          <div className="join w-full">
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="input input-bordered join-item w-full input-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="btn btn-primary join-item btn-sm">
              <FiSearch />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Navbar;
