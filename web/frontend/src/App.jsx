/**
 * FILE: web/frontend/src/App.jsx
 * MỤC ĐÍCH: Main App component với routing
 * LIÊN QUAN:
 *   - web/frontend/src/pages/*.jsx
 *   - web/frontend/src/components/Layout/*.jsx
 */

import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "./store/authStore";

// Layouts
import MainLayout from "./components/Layout/MainLayout";
import AuthLayout from "./components/Layout/AuthLayout";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import PostDetail from "./pages/Post/PostDetail";
import CreatePost from "./pages/Post/CreatePost";
import EditPost from "./pages/Post/EditPost";
import Profile from "./pages/User/Profile";
import Settings from "./pages/User/Settings";
import Category from "./pages/Category/Category";
import Categories from "./pages/Category/Categories";
import Messages from "./pages/Messages/Messages";
import Notifications from "./pages/Notifications";
import Search from "./pages/Search";
import NotFound from "./pages/NotFound";

// Protected Route Component
const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  const { initializeAuth, isAuthenticated, fetchCurrentUser } = useAuthStore();

  useEffect(() => {
    // Initialize auth từ localStorage khi app mount
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    // Sau khi đã có trạng thái đăng nhập, refetch user để đồng bộ stats real-time
    if (isAuthenticated) {
      fetchCurrentUser();

      const onFocus = () => fetchCurrentUser();
      window.addEventListener("focus", onFocus);
      return () => window.removeEventListener("focus", onFocus);
    }
  }, [isAuthenticated, fetchCurrentUser]);

  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Main Routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />

        {/* Categories */}
        <Route path="/categories" element={<Categories />} />
        <Route path="/c/:slug" element={<Category />} />

        {/* Posts */}
        <Route path="/post/:slug" element={<PostDetail />} />
        <Route
          path="/post/create"
          element={
            <PrivateRoute>
              <CreatePost />
            </PrivateRoute>
          }
        />
        <Route
          path="/post/:postId/edit"
          element={
            <PrivateRoute>
              <EditPost />
            </PrivateRoute>
          }
        />

        {/* User */}
        <Route path="/u/:username" element={<Profile />} />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          }
        />

        {/* Messages */}
        <Route
          path="/messages"
          element={
            <PrivateRoute>
              <Messages />
            </PrivateRoute>
          }
        />
        <Route
          path="/messages/:userId"
          element={
            <PrivateRoute>
              <Messages />
            </PrivateRoute>
          }
        />

        {/* Notifications */}
        <Route
          path="/notifications"
          element={
            <PrivateRoute>
              <Notifications />
            </PrivateRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
