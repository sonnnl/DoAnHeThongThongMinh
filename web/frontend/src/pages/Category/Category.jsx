/**
 * FILE: web/frontend/src/pages/Category/Category.jsx
 * MỤC ĐÍCH: Trang chi tiết category với posts
 */

import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { categoriesAPI, postsAPI } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import toast from "react-hot-toast";
import PostCard from "../../components/Post/PostCard";
import Loading from "../../components/UI/Loading";
import { FiFolder, FiFileText, FiUsers, FiCheck } from "react-icons/fi";
import { formatNumber } from "../../utils/helpers";

const Category = () => {
  const { slug } = useParams();
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [sort, setSort] = useState("hot");
  const [page, setPage] = useState(1);

  // Fetch category
  const { data: categoryData, isLoading: categoryLoading } = useQuery(
    ["category", slug],
    () => categoriesAPI.getCategory(slug)
  );

  // Fetch posts in category
  const { data: postsData, isLoading: postsLoading } = useQuery(
    ["categoryPosts", slug, sort, page],
    () => postsAPI.getPosts({ category: categoryData?._id, sort, page }),
    {
      enabled: !!categoryData?._id,
    }
  );

  // Follow category mutation
  const followMutation = useMutation(
    () => categoriesAPI.followCategory(categoryData?._id),
    {
      onSuccess: () => {
        toast.success("Đã follow danh mục!");
        queryClient.invalidateQueries(["category", slug]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || "Follow thất bại");
      },
    }
  );

  // Unfollow category mutation
  const unfollowMutation = useMutation(
    () => categoriesAPI.unfollowCategory(categoryData?._id),
    {
      onSuccess: () => {
        toast.success("Đã unfollow danh mục!");
        queryClient.invalidateQueries(["category", slug]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || "Unfollow thất bại");
      },
    }
  );

  const handleFollow = () => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập");
      return;
    }
    if (category.isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  if (categoryLoading) return <Loading />;

  const category = categoryData;
  const posts = postsData?.data?.posts || [];

  return (
    <div>
      {/* Category Header */}
      <div className="card bg-base-100 shadow-md mb-6">
        <div className="card-body">
          <div className="flex items-start gap-4">
            <div className="avatar placeholder">
              <div className="bg-primary text-primary-content rounded-lg w-16">
                <FiFolder className="text-3xl" />
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{category?.name}</h1>
              {category?.description && (
                <p className="text-base-content/60 mb-4">
                  {category.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center gap-1">
                  <FiFileText />
                  <span>
                    {formatNumber(category?.stats?.postsCount || 0)} bài viết
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <FiUsers />
                  <span>
                    {formatNumber(category?.stats?.followersCount || 0)}{" "}
                    followers
                  </span>
                </div>
              </div>
            </div>
            {isAuthenticated && (
              <button
                className={`btn ${
                  category?.isFollowing ? "btn-outline" : "btn-primary"
                } gap-2`}
                onClick={handleFollow}
              >
                {category?.isFollowing ? (
                  <>
                    <FiCheck /> Following
                  </>
                ) : (
                  "Follow"
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sort tabs */}
      <div className="tabs tabs-boxed mb-6">
        <button
          className={`tab ${sort === "hot" ? "tab-active" : ""}`}
          onClick={() => {
            setSort("hot");
            setPage(1);
          }}
        >
          Hot
        </button>
        <button
          className={`tab ${sort === "new" ? "tab-active" : ""}`}
          onClick={() => {
            setSort("new");
            setPage(1);
          }}
        >
          Mới nhất
        </button>
        <button
          className={`tab ${sort === "top" ? "tab-active" : ""}`}
          onClick={() => {
            setSort("top");
            setPage(1);
          }}
        >
          Top
        </button>
      </div>

      {/* Posts list */}
      {postsLoading ? (
        <Loading />
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-base-content/60">
          Chưa có bài viết nào trong danh mục này
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {postsData?.data?.pagination && (
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
              disabled={page >= postsData.data.pagination.pages}
              onClick={() => setPage(page + 1)}
            >
              »
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Category;
