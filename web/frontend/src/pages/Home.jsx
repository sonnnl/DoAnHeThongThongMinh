/**
 * FILE: web/frontend/src/pages/Home.jsx
 * MỤC ĐÍCH: Trang chủ - hiển thị danh sách posts
 */

import { useState } from "react";
import { useQuery } from "react-query";
import { postsAPI } from "../services/api";
import PostCard from "../components/Post/PostCard";
import Loading from "../components/UI/Loading";

const Home = () => {
  const [sort, setSort] = useState("hot");
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery(
    ["posts", sort, page],
    () => postsAPI.getPosts({ sort, page, limit: 20 }),
    {
      keepPreviousData: true,
    }
  );

  if (isLoading) return <Loading />;

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="alert alert-error max-w-md mx-auto">
          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current flex-shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="font-bold">Không thể kết nối tới server</h3>
              <div className="text-sm">
                Vui lòng kiểm tra backend đã chạy chưa (port 5000)
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const posts = data?.data?.posts || [];

  return (
    <div>
      {/* Welcome Banner */}
      <div className="card bg-gradient-to-br from-primary via-primary to-secondary shadow-lg border-0 mb-6 overflow-hidden">
        <div className="card-body relative">
          <div className="absolute -right-10 -top-10 text-primary-content/10 text-9xl">
            💬
          </div>
          <h2 className="card-title text-3xl font-bold text-primary-content relative z-10">
            👋 Chào mừng đến với Forum!
          </h2>
          <p className="text-primary-content/90 text-lg relative z-10">
            Nơi chia sẻ kiến thức và thảo luận
          </p>
        </div>
      </div>

      {/* Sort tabs */}
      <div className="bg-base-100 rounded-lg shadow border border-base-300 p-2 mb-6">
        <div className="tabs tabs-boxed bg-transparent">
          <button
            className={`tab gap-2 ${sort === "hot" ? "tab-active" : ""}`}
            onClick={() => {
              setSort("hot");
              setPage(1);
            }}
          >
            🔥 <span className="hidden sm:inline">Hot</span>
          </button>
          <button
            className={`tab gap-2 ${sort === "new" ? "tab-active" : ""}`}
            onClick={() => {
              setSort("new");
              setPage(1);
            }}
          >
            ✨ <span className="hidden sm:inline">Mới nhất</span>
          </button>
          <button
            className={`tab gap-2 ${sort === "top" ? "tab-active" : ""}`}
            onClick={() => {
              setSort("top");
              setPage(1);
            }}
          >
            🏆 <span className="hidden sm:inline">Top</span>
          </button>
        </div>
      </div>

      {/* Posts list */}
      {posts.length === 0 ? (
        <div className="card bg-base-100 shadow-lg border border-base-300">
          <div className="card-body text-center py-20">
            <div className="text-8xl mb-6 animate-bounce">📝</div>
            <h3 className="text-3xl font-bold mb-3">Chưa có bài viết nào</h3>
            <p className="text-base-content/60 text-lg mb-8 max-w-md mx-auto">
              Hãy là người đầu tiên chia sẻ điều gì đó thú vị với cộng đồng!
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <a href="/post/create" className="btn btn-primary btn-lg gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Tạo bài viết đầu tiên
              </a>
              <a href="/categories" className="btn btn-outline btn-lg gap-2">
                📁 Xem danh mục
              </a>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>

          {/* Pagination */}
          {data?.data?.pagination && data.data.pagination.pages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="btn-group">
                <button
                  className="btn"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  «
                </button>
                <button className="btn">Trang {page}</button>
                <button
                  className="btn"
                  disabled={page >= data.data.pagination.pages}
                  onClick={() => setPage(page + 1)}
                >
                  »
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Home;
