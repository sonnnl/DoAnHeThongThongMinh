/**
 * FILE: web/frontend/src/components/Post/PostCard.jsx
 * MỤC ĐÍCH: Post card component (hiển thị trong list)
 */

import { Link } from "react-router-dom";
import {
  FiArrowUp,
  FiArrowDown,
  FiMessageSquare,
  FiBookmark,
} from "react-icons/fi";
import { timeAgo, formatNumber } from "../../utils/helpers";

const PostCard = ({ post }) => {
  const score = (post.stats?.upvotes || 0) - (post.stats?.downvotes || 0);

  return (
    <div className="card bg-base-100 shadow hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-base-300 animate-fade-in">
      <div className="card-body p-4">
        <div className="flex gap-4">
          {/* Vote section */}
          <div className="flex flex-col items-center gap-1 min-w-[40px]">
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
          </div>

          {/* Content section */}
          <div className="flex-1 min-w-0">
            {/* Category tag */}
            {post.category && (
              <Link
                to={`/c/${post.category.slug}`}
                className="badge badge-primary badge-sm mb-2 gap-1"
              >
                📁 {post.category.name}
              </Link>
            )}

            {/* Title */}
            <Link to={`/post/${post.slug}`}>
              <h3 className="card-title text-base md:text-lg hover:text-primary cursor-pointer line-clamp-2 mb-2">
                {post.title}
              </h3>
            </Link>

            {/* Preview content (if exists) */}
            {post.content && (
              <p className="text-sm text-base-content/70 line-clamp-2 mb-2">
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

            {/* Stats */}
            <div className="flex items-center gap-4">
              <Link
                to={`/post/${post.slug}#comments`}
                className="flex items-center gap-1 text-sm hover:text-primary transition-colors"
              >
                <FiMessageSquare />
                <span>{post.stats?.commentsCount || 0} bình luận</span>
              </Link>
              <button className="flex items-center gap-1 text-sm hover:text-primary transition-colors">
                <FiBookmark />
                <span>Lưu</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
