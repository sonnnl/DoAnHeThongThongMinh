/**
 * FILE: web/frontend/src/components/Layout/MainLayout.jsx
 * MỤC ĐÍCH: Main layout với Navbar, Sidebar cho các pages chính
 */

import { Outlet } from "react-router-dom";
import Navbar from "../Navbar/Navbar";
import Sidebar from "../Sidebar/Sidebar";

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-base-100">
      <Navbar />

      <div className="bg-base-200/50">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sidebar */}
            <aside className="hidden lg:block lg:col-span-3">
              <div className="sticky top-24">
                <Sidebar />
              </div>
            </aside>

            {/* Main Content */}
            <main className="lg:col-span-9 min-h-[70vh]">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
