/**
 * FILE: web/frontend/src/components/Layout/MainLayout.jsx
 * MỤC ĐÍCH: Main layout với Navbar, Sidebar cho các pages chính
 */

import { Outlet } from "react-router-dom";
import Navbar from "../Navbar/Navbar";
import Sidebar from "../Sidebar/Sidebar";

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-base-100 flex flex-col">
      <Navbar />

      <div className="flex-1 bg-base-200/50">
        <div className="container mx-auto max-w-7xl px-4 py-6 h-full">
          <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Sidebar */}
            <aside className="hidden lg:block lg:col-span-3">
              <div className="sticky top-24 space-y-6">
                <Sidebar />
              </div>
            </aside>

            {/* Main Content */}
            <main className="lg:col-span-9 min-h-[70vh] space-y-6">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
