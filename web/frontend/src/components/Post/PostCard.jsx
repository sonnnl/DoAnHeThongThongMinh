/**
 * FILE: web/frontend/src/components/Post/PostCard.jsx
 * MỤC ĐÍCH: Post card component (hiển thị trong list)
 */

import { Link } from "react-router-dom";
import { useState } from "react";
import {
  FiArrowUp,
  FiArrowDown,
  FiMessageSquare,
  FiBookmark,
  FiStar,
  FiTag,
} from "react-icons/fi";
import { timeAgo, formatNumber } from "../../utils/helpers";
import { useMutation, useQueryClient } from "react-query";
import { postsAPI } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import toast from "react-hot-toast";

const PostCard = ({ post, hideVoteButtons = false }) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const rawScore = post?.stats?.upvotes - post?.stats?.downvotes;
  const score = Math.round(rawScore || 0);
  const scoreState = score > 0 ? "pos" : score < 0 ? "neg" : "neu";

  const borderAccent =
    scoreState === "pos"
      ? "border-l-4 border-success/60"
      : scoreState === "neg"
      ? "border-l-4 border-error/60"
      : "border-l-4 border-base-300";

  return (
    <div
      className={`card bg-base-100 shadow-sm hover:shadow-xl hover:-translate-y-[2px] transition-all duration-300 border border-base-300 ${borderAccent} animate-fade-in`}
    >
      <div className="card-body p-4">
        <div className="flex gap-4">
          {/* Vote section */}
          <div className="flex flex-col items-center gap-1 min-w-[64px]">
            {hideVoteButtons ? (
              <div
                className={`px-2.5 py-1.5 rounded-full text-xs font-semibold select-none shadow-sm border flex items-center gap-1.5
                  ${
                    scoreState === "pos"
                      ? "bg-gradient-to-b from-success/10 to-success/5 text-success border-success/20"
                      : scoreState === "neg"
                      ? "bg-gradient-to-b from-error/10 to-error/5 text-error border-error/20"
                      : "bg-base-200 text-base-content/70 border-base-300"
                  }
                `}
                title="Điểm bài viết"
              >
                <FiStar
                  className={`${scoreState === "neu" ? "opacity-70" : ""}`}
                />
                <span>{formatNumber(score)}</span>
              </div>
            ) : (
              <>
                <button className="btn btn-ghost btn-xs btn-circle hover:bg-success/20 hover:text-success">
                  <FiArrowUp className="text-lg" />
                </button>
                <span
                  className={`font-bold text-sm ${
                    score > 0 ? "text-success" : score < 0 ? "text-error" : ""
                  }`}
                >
                  {formatNumber(score)}
                </span>
                <button className="btn btn-ghost btn-xs btn-circle hover:bg-error/20 hover:text-error">
                  <FiArrowDown className="text-lg" />
                </button>
              </>
            )}
          </div>

          {/* Content section */}
          <div className="flex-1 min-w-0">
            {/* Category tag */}
            {post.category && (
              <Link
                to={`/c/${post.category.slug}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mb-2 border shadow-sm transition-colors bg-primary/10 text-primary border-primary/20 hover:bg-primary/15"
                title={`Chuyên mục: ${post.category.name}`}
              >
                <FiTag className="text-[14px]" />
                <span className="truncate max-w-[160px]">
                  {post.category.name}
                </span>
              </Link>
            )}

            {/* Title */}
            <Link to={`/post/${post.slug}`}>
              <h3 className="card-title text-base md:text-lg hover:text-primary cursor-pointer line-clamp-2 mb-2 tracking-tight">
                {post.title}
              </h3>
            </Link>

            {/* Preview content (if exists) */}
            {post.content && (
              <p className="text-sm text-base-content/70 line-clamp-2 mb-2 leading-relaxed">
                {post.content.substring(0, 150)}...
              </p>
            )}

            {/* Meta info */}
            <div className="flex items-center gap-3 text-xs md:text-sm text-base-content/60 mb-2">
              <Link
                to={`/u/${post.author?.username}`}
                className="hover:text-primary font-medium"
              >
                👤 {post.author?.username}
              </Link>
              <span>•</span>
              <span>⏰ {timeAgo(post.createdAt)}</span>
              {post.stats?.views && (
                <>
                  <span>•</span>
                  <span>👁️ {formatNumber(post.stats.views)} views</span>
                </>
              )}
            </div>

            {/* Stats & Actions */}
            <div className="flex items-center justify-between gap-4">
              <Link
                to={`/post/${post.slug}#comments`}
                className="flex items-center gap-1 text-sm hover:text-primary transition-colors"
                title="Xem bình luận"
              >
                <FiMessageSquare />
                <span>{post.stats?.commentsCount || 0} bình luận</span>
              </Link>

              <SaveButton
                post={post}
                currentUser={user}
                queryClient={queryClient}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Nút lưu bài viết: gọi API, toggle màu khi đã lưu, disable nếu là tác giả
const SaveButton = ({ post, currentUser, queryClient }) => {
  const isOwnPost =
    currentUser?._id &&
    post?.author?._id &&
    currentUser._id === post.author._id;

  // Trạng thái cục bộ nếu API list không trả về isSaved
  const initialSaved = Boolean(post?.isSaved);
  const [isSaved, setIsSaved] = useState(initialSaved);

  const saveMutation = useMutation(
    () =>
      isSaved ? postsAPI.unsavePost(post._id) : postsAPI.savePost(post._id),
    {
      onSuccess: () => {
        setIsSaved((prev) => !prev);
        toast.success(isSaved ? "Đã bỏ lưu bài viết" : "Đã lưu bài viết");
        queryClient.invalidateQueries("posts");
        queryClient.invalidateQueries(["post", post.slug]);
        queryClient.invalidateQueries("userPosts");
        queryClient.invalidateQueries("savedPosts");
      },
      onError: (error) => {
        const message =
          error?.response?.data?.message ||
          (isSaved ? "Không thể bỏ lưu bài viết" : "Không thể lưu bài viết");
        toast.error(message);
      },
    }
  );

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className={`btn btn-ghost btn-sm btn-circle tooltip tooltip-left flex items-center justify-center ${
          isOwnPost ? "opacity-40 pointer-events-none" : ""
        } ${isSaved ? "text-primary" : ""}`}
        data-tip={
          isOwnPost
            ? "Bạn là tác giả"
            : isSaved
            ? "Bỏ lưu bài viết"
            : "Lưu bài viết"
        }
        aria-label="Lưu bài viết"
        onClick={() =>
          !isOwnPost && !saveMutation.isLoading && saveMutation.mutate()
        }
        disabled={isOwnPost || saveMutation.isLoading}
        aria-busy={saveMutation.isLoading}
      >
        <FiBookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
      </button>
    </div>
  );
};

export default PostCard;
