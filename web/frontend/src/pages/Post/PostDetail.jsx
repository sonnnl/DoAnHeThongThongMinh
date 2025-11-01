/**
 * FILE: web/frontend/src/pages/Post/PostDetail.jsx
 * MỤC ĐÍCH: Trang chi tiết bài viết với comments
 */

import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { postsAPI, votesAPI } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import toast from "react-hot-toast";
import Loading from "../../components/UI/Loading";
import CommentList from "../../components/Comment/CommentList";
import {
  FiArrowUp,
  FiArrowDown,
  FiMessageSquare,
  FiBookmark,
  FiShare2,
  FiEdit,
  FiTrash2,
  FiUser,
  FiCalendar,
  FiEye,
  FiTag,
  FiRefreshCw,
} from "react-icons/fi";
import {
  timeAgo,
  formatNumber,
  getBadgeClass,
  calculateReadingTime,
} from "../../utils/helpers";

const PostDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [voteError, setVoteError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch post
  const {
    data,
    isLoading,
    error,
    refetch: refetchPost,
  } = useQuery(["post", slug], () => postsAPI.getPost(slug));

  // Vote mutation
  const voteMutation = useMutation(
    (voteType) => votesAPI.vote("Post", data?.data._id, voteType),
    {
      onSuccess: () => {
        setVoteError("");
        queryClient.invalidateQueries(["post", slug]);
      },
      onError: (error) => {
        setVoteError(error.response?.data?.message || "Vote thất bại");
      },
    }
  );

  // Save post mutation
  const saveMutation = useMutation(() => postsAPI.savePost(data?.data._id), {
    onSuccess: () => {
      toast.success("Đã lưu bài viết!");
      // Update isSaved optimistically
      queryClient.setQueryData(["post", slug], (old) => {
        if (old?.data) {
          return {
            ...old,
            data: {
              ...old.data,
              isSaved: true,
            },
          };
        }
        return old;
      });
      queryClient.invalidateQueries(["post", slug]);
    },
    onError: (error) => {
      // Nếu lỗi là "Bài viết đã được lưu", tự động gọi unsave
      if (error.response?.data?.message?.includes("đã được lưu")) {
        unsaveMutation.mutate();
      } else {
        toast.error(error.response?.data?.message || "Lưu thất bại");
      }
    },
  });

  // Unsave post mutation
  const unsaveMutation = useMutation(
    () => postsAPI.unsavePost(data?.data._id),
    {
      onSuccess: () => {
        toast.success("Đã bỏ lưu bài viết!");
        // Update isSaved optimistically
        queryClient.setQueryData(["post", slug], (old) => {
          if (old?.data) {
            return {
              ...old,
              data: {
                ...old.data,
                isSaved: false,
              },
            };
          }
          return old;
        });
        queryClient.invalidateQueries(["post", slug]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || "Bỏ lưu thất bại");
      },
    }
  );

  // Delete post mutation
  const deleteMutation = useMutation(
    () => postsAPI.deletePost(data?.data._id),
    {
      onSuccess: () => {
        toast.success("Xóa bài viết thành công!");
        navigate("/");
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || "Xóa thất bại");
      },
    }
  );

  const handleVote = (voteType) => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để vote");
      return;
    }
    voteMutation.mutate(voteType);
  };

  const handleSave = () => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để lưu bài viết");
      return;
    }
    if (isAuthor) {
      toast.error("Bạn không thể lưu bài viết của chính mình");
      return;
    }
    if (post?.isSaved) {
      unsaveMutation.mutate();
    } else {
      saveMutation.mutate();
    }
  };

  const handleDelete = () => {
    if (window.confirm("Bạn có chắc muốn xóa bài viết này?")) {
      deleteMutation.mutate();
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success("Đã copy link!");
    }
  };

  // Handle refresh - reload post and all comments (including replies)
  const handleRefresh = async () => {
    if (!post?._id) return;

    setIsRefreshing(true);
    try {
      // Refetch post data
      await refetchPost();

      // Invalidate và refetch all comments queries cho post này
      // Query key pattern: ["comments", postId, sort]
      await queryClient.invalidateQueries({
        queryKey: ["comments", post._id],
        exact: false,
        refetchActive: true,
      });

      // Đợi comments được refetch xong
      await queryClient.refetchQueries({
        queryKey: ["comments", post._id],
        exact: false,
      });

      // Dispatch event để TẤT CẢ CommentItem tự refetch replies (kể cả chưa mở)
      // Điều này đảm bảo mọi comment (bao gồm replies) đều được cập nhật
      window.dispatchEvent(
        new CustomEvent("refresh-all-comments", {
          detail: { postId: post._id },
        })
      );

      toast.success("Đã làm mới!");
    } catch (error) {
      toast.error("Làm mới thất bại, thử lại sau");
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) return <Loading />;
  if (error)
    return (
      <div className="alert alert-error">
        Không tìm thấy bài viết hoặc đã bị xóa
      </div>
    );

  const post = data?.data;

  // Additional check for post data
  if (!post) {
    return <div className="alert alert-error">Không tìm thấy bài viết</div>;
  }

  const isAuthor = user?._id === post?.author?._id;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Post Card */}
      <div className="card bg-base-100 shadow-md mb-6">
        <div className="card-body">
          <div className="flex gap-4">
            {/* Vote section */}
            <div className="relative flex flex-col items-center gap-2">
              <button
                className={`btn btn-circle ${
                  post?.userVote === "upvote" ? "btn-success" : "btn-ghost"
                }`}
                onClick={() => !isAuthor && handleVote("upvote")}
                disabled={isAuthor}
                title={
                  isAuthor
                    ? "Bạn không thể vote bài viết của chính mình"
                    : "Upvote"
                }
              >
                <FiArrowUp className="text-xl" />
              </button>
              <span className="text-2xl font-bold">
                {formatNumber(
                  (post.stats?.upvotes || 0) - (post.stats?.downvotes || 0)
                )}
              </span>
              <button
                className={`btn btn-circle ${
                  post?.userVote === "downvote" ? "btn-error" : "btn-ghost"
                }`}
                onClick={() => !isAuthor && handleVote("downvote")}
                disabled={isAuthor}
                title={
                  isAuthor
                    ? "Bạn không thể vote bài viết của chính mình"
                    : "Downvote"
                }
              >
                <FiArrowDown className="text-xl" />
              </button>
              {voteError && !isAuthor && (
                <span className="absolute top-full mt-1 text-xs text-error text-center max-w-[160px] px-2 py-1 bg-base-100/90 backdrop-blur rounded shadow pointer-events-none">
                  {voteError}
                </span>
              )}
            </div>

            {/* Content */}
            <div className="flex-1">
              {/* Category */}
              {post.category && (
                <Link
                  to={`/c/${post.category.slug}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium mb-3 border shadow-sm bg-primary/10 text-primary border-primary/20 hover:bg-primary/15"
                  title={`Chuyên mục: ${post.category.name}`}
                >
                  <FiTag className="text-[14px]" />
                  <span className="truncate max-w-[200px]">
                    {post.category.name}
                  </span>
                </Link>
              )}

              {/* Title */}
              <h1 className="text-3xl font-bold mb-4">{post.title}</h1>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-base-content/60 mb-6">
                <Link
                  to={`/u/${post.author.username}`}
                  className="flex items-center gap-2 hover:text-primary"
                >
                  {post.author.avatar ? (
                    <img
                      src={post.author.avatar}
                      alt={post.author.username}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center">
                      <FiUser />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-base-content">
                      {post.author.username}
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-base-200 text-base-content border border-base-300">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-3 h-3 text-amber-500"
                      >
                        <path d="M11.48 3.499a.562.562 0 011.04 0l1.462 3.73a.563.563 0 00.475.354l3.993.332c.499.042.701.663.321.988l-3.04 2.62a.563.563 0 00-.182.557l.91 3.867a.562.562 0 01-.84.61l-3.44-1.937a.563.563 0 00-.555 0L8.14 16.557a.562.562 0 01-.84-.61l.91-3.867a.563.563 0 00-.182-.557l-3.04-2.62a.563.563 0 01.321-.988l3.993-.332a.563.563 0 00.475-.354l1.462-3.73z" />
                      </svg>
                      <span>{post.author.badge}</span>
                    </span>
                  </div>
                </Link>
                <span className="flex items-center gap-1">
                  <FiCalendar />
                  {timeAgo(post.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  <FiEye />
                  {formatNumber(post.stats?.viewsCount || 0)} lượt xem
                </span>
                <span>{calculateReadingTime(post.content)}</span>
              </div>

              {/* Content */}
              <div className="prose prose-sm md:prose-base lg:prose-lg max-w-none mb-6">
                <div className="whitespace-pre-wrap">{post.content}</div>
              </div>

              {/* Media */}
              {(post.media?.images?.length > 0 ||
                post.media?.videos?.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {post.media?.images?.map((img, index) => (
                    <div
                      key={`img-${index}`}
                      className="rounded-lg overflow-hidden"
                    >
                      <img
                        src={img.url}
                        alt={`Image ${index + 1}`}
                        className="w-full h-auto"
                      />
                    </div>
                  ))}
                  {post.media?.videos?.map((vid, index) => (
                    <div
                      key={`vid-${index}`}
                      className="rounded-lg overflow-hidden"
                    >
                      <video src={vid.url} controls className="w-full" />
                    </div>
                  ))}
                </div>
              )}

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {post.tags.map((tag, index) => (
                    <span key={index} className="badge badge-outline">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1 text-base-content/60">
                  <FiMessageSquare />
                  <span>{post.stats?.commentsCount || 0} bình luận</span>
                </div>
                <button
                  className="btn btn-ghost btn-sm gap-2"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  title="Làm mới bài viết và bình luận"
                >
                  <FiRefreshCw
                    className={`text-base ${
                      isRefreshing ? "animate-spin" : ""
                    }`}
                  />
                  Làm mới
                </button>
                <button
                  className={`btn btn-ghost btn-sm gap-2 ${
                    post?.isSaved ? "text-primary" : ""
                  } ${isAuthor ? "opacity-40 cursor-not-allowed" : ""}`}
                  onClick={handleSave}
                  disabled={isAuthor}
                  title={
                    isAuthor
                      ? "Bạn không thể lưu bài viết của chính mình"
                      : post?.isSaved
                      ? "Bỏ lưu bài viết"
                      : "Lưu bài viết"
                  }
                >
                  <FiBookmark />
                  {post?.isSaved ? "Đã lưu" : "Lưu"}
                </button>
                <button
                  className="btn btn-ghost btn-sm gap-2"
                  onClick={handleShare}
                >
                  <FiShare2 />
                  Chia sẻ
                </button>
                {isAuthor && (
                  <>
                    <Link
                      to={`/post/${post._id}/edit`}
                      className="btn btn-ghost btn-sm gap-2"
                    >
                      <FiEdit />
                      Sửa
                    </Link>
                    <button
                      className="btn btn-ghost btn-sm gap-2 text-error"
                      onClick={handleDelete}
                    >
                      <FiTrash2 />
                      Xóa
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div id="comments">
        <CommentList postId={post._id} />
      </div>

      {/* Fixed Refresh Button - Giữa bên phải màn hình */}
      <button
        className="fixed right-8 top-1/2 -translate-y-1/2 z-40 btn btn-circle btn-primary shadow-lg hover:shadow-xl transition-all duration-300"
        onClick={handleRefresh}
        disabled={isRefreshing}
        title="Làm mới bài viết và bình luận"
      >
        <FiRefreshCw
          className={`text-xl ${isRefreshing ? "animate-spin" : ""}`}
        />
      </button>
    </div>
  );
};

export default PostDetail;
