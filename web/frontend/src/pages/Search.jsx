/**
 * FILE: web/frontend/src/pages/Search.jsx
 * MỤC ĐÍCH: Trang tìm kiếm posts và users
 */

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "react-query";
import { postsAPI, usersAPI } from "../services/api";
import { useDebounce } from "../hooks/useDebounce";
import PostCard from "../components/Post/PostCard";
import Loading from "../components/UI/Loading";
import { FiSearch, FiUser } from "react-icons/fi";
import { Link } from "react-router-dom";

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState("posts");
  const debouncedQuery = useDebounce(query, 500);

  // Search posts
  const {
    data: postsData,
    isLoading: postsLoading,
    error: postsError,
  } = useQuery(
    ["searchPosts", debouncedQuery],
    () => postsAPI.searchPosts(debouncedQuery),
    {
      enabled: !!debouncedQuery && activeTab === "posts",
    }
  );

  // Search users
  const {
    data: usersData,
    isLoading: usersLoading,
    error: usersError,
  } = useQuery(
    ["searchUsers", debouncedQuery],
    () => usersAPI.searchUsers(debouncedQuery),
    {
      enabled: !!debouncedQuery && activeTab === "users",
    }
  );

  useEffect(() => {
    if (debouncedQuery) {
      setSearchParams({ q: debouncedQuery });
    } else {
      setSearchParams({});
    }
  }, [debouncedQuery, setSearchParams]);

  const posts = postsData?.data?.posts || [];
  const users = usersData?.data?.users || [];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Tìm kiếm</h1>

      {/* Search bar */}
      <div className="card bg-base-100 shadow-md mb-6">
        <div className="card-body">
          <div className="form-control">
            <div className="input-group">
              <span className="bg-base-200">
                <FiSearch className="text-xl" />
              </span>
              <input
                type="text"
                placeholder="Tìm kiếm bài viết, người dùng..."
                className="input input-bordered w-full"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed mb-6">
        <button
          className={`tab ${activeTab === "posts" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("posts")}
        >
          Bài viết
        </button>
        <button
          className={`tab ${activeTab === "users" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          Người dùng
        </button>
      </div>

      {/* Results */}
      {!debouncedQuery ? (
        <div className="text-center py-12 text-base-content/60">
          Nhập từ khóa để tìm kiếm
        </div>
      ) : (
        <>
          {/* Posts tab */}
          {activeTab === "posts" && (
            <div>
              {postsLoading ? (
                <Loading />
              ) : postsError ? (
                <div className="alert alert-error">Lỗi khi tìm kiếm</div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12 text-base-content/60">
                  Không tìm thấy bài viết nào cho "{debouncedQuery}"
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-base-content/60 mb-4">
                    Tìm thấy {posts.length} bài viết
                  </p>
                  {posts.map((post) => (
                    <PostCard key={post._id} post={post} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Users tab */}
          {activeTab === "users" && (
            <div>
              {usersLoading ? (
                <Loading />
              ) : usersError ? (
                <div className="alert alert-error">Lỗi khi tìm kiếm</div>
              ) : users.length === 0 ? (
                <div className="text-center py-12 text-base-content/60">
                  Không tìm thấy người dùng nào cho "{debouncedQuery}"
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-base-content/60 mb-4">
                    Tìm thấy {users.length} người dùng
                  </p>
                  {users.map((user) => (
                    <Link
                      key={user._id}
                      to={`/u/${user.username}`}
                      className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow"
                    >
                      <div className="card-body p-4">
                        <div className="flex items-center gap-4">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.username}
                              className="w-16 h-16 rounded-full"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-primary text-primary-content flex items-center justify-center text-2xl">
                              <FiUser />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-lg">
                                {user.username}
                              </h3>
                              <span className="badge badge-sm">
                                {user.badge}
                              </span>
                            </div>
                            {user.bio && (
                              <p className="text-sm text-base-content/60 line-clamp-2">
                                {user.bio}
                              </p>
                            )}
                            <div className="flex gap-4 mt-2 text-sm">
                              <span>
                                {user.stats?.postsCount || 0} bài viết
                              </span>
                              <span>
                                {user.stats?.upvotesReceived || 0} karma
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Search;
