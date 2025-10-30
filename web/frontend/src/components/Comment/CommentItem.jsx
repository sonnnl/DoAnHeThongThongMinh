/**
 * FILE: web/frontend/src/components/Comment/CommentItem.jsx
 * MỤC ĐÍCH: Comment component với vote, reply, emotion
 */

import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "react-query";
import { commentsAPI, votesAPI } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import toast from "react-hot-toast";
import {
  FiArrowUp,
  FiArrowDown,
  FiMessageSquare,
  FiEdit,
  FiTrash2,
  FiFlag,
} from "react-icons/fi";
import {
  timeAgo,
  formatNumber,
  getEmotionClass,
  getEmotionEmoji,
} from "../../utils/helpers";

const CommentItem = ({ comment, postId, onReply, depth = 0 }) => {
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [voteError, setVoteError] = useState("");
  const [editContent, setEditContent] = useState(comment.content);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [repliesRefreshing, setRepliesRefreshing] = useState(false);
  const textareaRef = useRef(null);

  const isAuthor = user?._id === comment.author._id;
  const canReply = true; // Cho phép reply ở mọi bình luận; backend gom về root để hiển thị 2 cấp
  console.log(comment);
  // Vote mutation
  const voteMutation = useMutation(
    (voteType) => votesAPI.vote("Comment", comment._id, voteType),
    {
      onSuccess: (res, voteType) => {
        setVoteError("");
        // Optimistic local update for immediate feedback
        const prev = comment.userVote;
        if (prev === voteType) {
          comment.userVote = null;
          if (voteType === "upvote")
            comment.stats.upvotes = Math.max(
              0,
              (comment.stats.upvotes || 0) - 1
            );
          else
            comment.stats.downvotes = Math.max(
              0,
              (comment.stats.downvotes || 0) - 1
            );
        } else {
          // revert previous
          if (prev === "upvote")
            comment.stats.upvotes = Math.max(
              0,
              (comment.stats.upvotes || 0) - 1
            );
          if (prev === "downvote")
            comment.stats.downvotes = Math.max(
              0,
              (comment.stats.downvotes || 0) - 1
            );
          // apply new
          comment.userVote = voteType;
          if (voteType === "upvote")
            comment.stats.upvotes = (comment.stats.upvotes || 0) + 1;
          else comment.stats.downvotes = (comment.stats.downvotes || 0) + 1;
        }

        // Ensure data is consistent by refetching
        if (depth === 0 && showReplies) {
          // refresh replies block if open
          (async () => {
            setRepliesLoading(true);
            try {
              const resp = await commentsAPI.getReplies(comment._id, {
                sort: "best",
              });
              setReplies(resp.data?.data?.replies || resp.data?.replies || []);
            } finally {
              setRepliesLoading(false);
            }
          })();
        }
        if (depth > 0 && comment.parentComment) {
          // Ask root comment to refetch its replies to reflect updated vote state
          window.dispatchEvent(
            new CustomEvent("refetch-replies", {
              detail: { rootId: comment.parentComment },
            })
          );
        }
        // Invalidate list queries for counts/sorting
        queryClient.invalidateQueries(["comments", postId]);
      },
      onError: (error) => {
        setVoteError(error.response?.data?.message || "Vote thất bại");
      },
    }
  );

  // Update comment mutation
  const updateMutation = useMutation(
    (content) => commentsAPI.updateComment(comment._id, { content }),
    {
      onSuccess: () => {
        toast.success("Cập nhật thành công!");
        setIsEditing(false);
        queryClient.invalidateQueries(["comments", postId]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || "Cập nhật thất bại");
      },
    }
  );

  // Delete comment mutation
  const deleteMutation = useMutation(
    () => commentsAPI.deleteComment(comment._id),
    {
      onSuccess: () => {
        toast.success("Xóa thành công!");
        queryClient.invalidateQueries(["comments", postId]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || "Xóa thất bại");
      },
    }
  );

  // Reply mutation
  const replyMutation = useMutation(
    (content) =>
      commentsAPI.createComment({
        postId,
        content,
        parentComment: comment._id,
      }),
    {
      onSuccess: () => {
        toast.success("Trả lời thành công!");
        setReplyContent("");
        setShowReplyForm(false);
        const rootId = depth === 0 ? comment._id : comment.parentComment;
        if (depth === 0) {
          comment.repliesCount = (comment.repliesCount || 0) + 1;
          if (showReplies) {
            fetchReplies(rootId);
          }
        } else {
          window.dispatchEvent(
            new CustomEvent("refetch-replies", { detail: { rootId } })
          );
        }
        queryClient.invalidateQueries(["comments", postId]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || "Trả lời thất bại");
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

  const handleUpdate = () => {
    if (!editContent.trim()) {
      toast.error("Nội dung không được để trống");
      return;
    }
    updateMutation.mutate(editContent);
  };

  const handleDelete = () => {
    if (window.confirm("Bạn có chắc muốn xóa comment này?")) {
      deleteMutation.mutate();
    }
  };

  const handleReply = () => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để reply");
      return;
    }
    if (!replyContent.trim()) {
      toast.error("Nội dung không được để trống");
      return;
    }
    replyMutation.mutate(replyContent);
  };

  const openReply = () => {
    setShowReplyForm(true);
  };

  useEffect(() => {
    if (showReplyForm && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [showReplyForm]);

  const fetchReplies = async (rootId) => {
    if (replies.length > 0) setRepliesRefreshing(true);
    else setRepliesLoading(true);
    try {
      const resp = await commentsAPI.getReplies(rootId, { sort: "best" });
      setReplies(resp.data?.data?.replies || resp.data?.replies || []);
    } finally {
      setRepliesLoading(false);
      setRepliesRefreshing(false);
    }
  };

  const handleToggleReplies = async () => {
    if (!showReplies) {
      await fetchReplies(comment._id);
    }
    setShowReplies((prev) => !prev);
  };

  useEffect(() => {
    if (depth !== 0) return;
    const handler = (e) => {
      const rootId = e.detail?.rootId;
      if (rootId === comment._id) {
        setShowReplies(true);
        fetchReplies(rootId);
      }
    };
    window.addEventListener("refetch-replies", handler);
    return () => window.removeEventListener("refetch-replies", handler);
  }, [depth, comment._id]);

  // Render content with @mention link to profile
  const renderContentWithMentions = (text) => {
    if (!text) return null;
    const parts = text.split(/(\@[a-zA-Z0-9_]+)/g);
    return parts.map((part, idx) => {
      if (part.startsWith && part.startsWith("@")) {
        const username = part.substring(1);
        return (
          <Link
            key={idx}
            to={`/u/${username}`}
            className="text-primary hover:underline"
          >
            {part}
          </Link>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  if (comment.isDeleted) {
    return (
      <div
        className="p-4 bg-base-200 rounded-lg text-base-content/60 italic"
        style={{ marginLeft: `${depth * 2}rem` }}
      >
        [Bình luận đã bị xóa]
      </div>
    );
  }

  return (
    <div style={{ marginLeft: `${depth * 2}rem` }}>
      <div
        className={`p-4 rounded-lg ${
          comment.emotion ? getEmotionClass(comment.emotion) : "bg-base-100"
        } mb-4`}
      >
        <div className="flex gap-3">
          {/* Vote buttons */}
          <div className="relative flex flex-col items-center gap-1">
            <button
              className={`btn btn-xs btn-circle ${
                comment.userVote === "upvote" ? "btn-success" : "btn-ghost"
              }`}
              onClick={() => !isAuthor && handleVote("upvote")}
              disabled={isAuthor}
              title={
                isAuthor
                  ? "Bạn không thể vote comment của chính mình"
                  : "Upvote"
              }
            >
              <FiArrowUp />
            </button>
            <span className="text-sm font-bold">
              {formatNumber(
                comment.stats.upvotes - comment.stats.downvotes || 0
              )}
            </span>
            <button
              className={`btn btn-xs btn-circle ${
                comment.userVote === "downvote" ? "btn-error" : "btn-ghost"
              }`}
              onClick={() => !isAuthor && handleVote("downvote")}
              disabled={isAuthor}
              title={
                isAuthor
                  ? "Bạn không thể vote comment của chính mình"
                  : "Downvote"
              }
            >
              <FiArrowDown />
            </button>
            {voteError && !isAuthor && (
              <span className="absolute top-full mt-1 text-[10px] text-error text-center max-w-[140px] px-2 py-1 bg-base-100/90 backdrop-blur rounded shadow pointer-events-none">
                {voteError}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="flex-1">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              {comment.author?.avatar ? (
                <img
                  src={comment.author.avatar}
                  alt={comment.author.username}
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-primary text-primary-content flex items-center justify-center text-[10px]">
                  <span>
                    {comment.author?.username?.[0]?.toUpperCase() || "U"}
                  </span>
                </div>
              )}
              <Link
                to={`/u/${comment.author.username}`}
                className="font-semibold hover:text-primary"
              >
                {comment.author.username}
              </Link>
              <span className="text-xs text-base-content/60">
                {timeAgo(comment.createdAt)}
              </span>
              {comment.isEdited && (
                <span className="text-xs text-base-content/60 italic">
                  (đã sửa)
                </span>
              )}
              {comment.replyTo?.username && (
                <span className="text-xs text-base-content/60">
                  đang trả lời
                  <Link
                    to={`/u/${comment.replyTo.username}`}
                    className="ml-1 text-primary hover:underline"
                  >
                    @{comment.replyTo.username}
                  </Link>
                </span>
              )}
              {comment.emotion && (
                <span className="text-lg" title={comment.emotion}>
                  {getEmotionEmoji(comment.emotion)}
                </span>
              )}
            </div>

            {/* Content/Edit */}
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  className="textarea textarea-bordered w-full"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                ></textarea>
                <div className="flex gap-2">
                  <button
                    className={`btn btn-primary btn-sm ${
                      updateMutation.isLoading ? "loading" : ""
                    }`}
                    onClick={handleUpdate}
                    disabled={updateMutation.isLoading}
                  >
                    Lưu
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(comment.content);
                    }}
                  >
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <p className="whitespace-pre-wrap">
                {renderContentWithMentions(comment.content)}
              </p>
            )}

            {/* Actions */}
            {!isEditing && (
              <div className="flex items-center gap-3 mt-2">
                {canReply && isAuthenticated && (
                  <button
                    className="btn btn-ghost btn-xs gap-1"
                    onClick={() =>
                      showReplyForm ? setShowReplyForm(false) : openReply()
                    }
                  >
                    <FiMessageSquare />
                    Trả lời
                  </button>
                )}
                {isAuthor && (
                  <>
                    <button
                      className="btn btn-ghost btn-xs gap-1"
                      onClick={() => setIsEditing(true)}
                    >
                      <FiEdit />
                      Sửa
                    </button>
                    <button
                      className="btn btn-ghost btn-xs gap-1 text-error"
                      onClick={handleDelete}
                    >
                      <FiTrash2 />
                      Xóa
                    </button>
                  </>
                )}
                {!isAuthor && isAuthenticated && (
                  <button className="btn btn-ghost btn-xs gap-1">
                    <FiFlag />
                    Report
                  </button>
                )}
                {comment.repliesCount > 0 && (
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={handleToggleReplies}
                  >
                    {showReplies ? "Ẩn" : "Xem"} {comment.repliesCount} trả lời
                    {showReplies && repliesRefreshing && (
                      <span className="loading loading-dots loading-xs ml-2" />
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Reply form */}
            {showReplyForm && (
              <div className="mt-3 space-y-2">
                <textarea
                  className="textarea textarea-bordered w-full"
                  placeholder="Viết trả lời..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={3}
                  ref={textareaRef}
                ></textarea>
                <div className="flex gap-2">
                  <button
                    className={`btn btn-primary btn-sm ${
                      replyMutation.isLoading ? "loading" : ""
                    }`}
                    onClick={handleReply}
                    disabled={replyMutation.isLoading}
                  >
                    Gửi
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setShowReplyForm(false);
                      setReplyContent("");
                    }}
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Replies */}
      {showReplies && (
        <div className="space-y-2">
          {replies.length === 0 && repliesLoading ? (
            <div className="text-sm text-base-content/60 pl-12">
              Đang tải trả lời...
            </div>
          ) : replies.length === 0 ? (
            <div className="text-sm text-base-content/60 pl-12">
              Chưa có trả lời
            </div>
          ) : (
            replies.map((reply) => (
              <CommentItem
                key={reply._id}
                comment={reply}
                postId={postId}
                onReply={onReply}
                depth={depth + 1}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
