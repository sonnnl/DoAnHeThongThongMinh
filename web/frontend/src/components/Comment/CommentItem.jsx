/**
 * FILE: web/frontend/src/components/Comment/CommentItem.jsx
 * MỤC ĐÍCH: Comment component với vote, reply, emotion
 */

import { useState } from "react";
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
  const [editContent, setEditContent] = useState(comment.content);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");

  const isAuthor = user?._id === comment.author._id;
  const canReply = depth < 5; // Max 5 levels deep

  // Vote mutation
  const voteMutation = useMutation(
    (voteType) => votesAPI.vote("comment", comment._id, voteType),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["comments", postId]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || "Vote thất bại");
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
        post: postId,
        content,
        parentComment: comment._id,
      }),
    {
      onSuccess: () => {
        toast.success("Trả lời thành công!");
        setReplyContent("");
        setShowReplyForm(false);
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
          <div className="flex flex-col items-center gap-1">
            <button
              className={`btn btn-ghost btn-xs btn-circle ${
                comment.userVote === "upvote" ? "text-success" : ""
              }`}
              onClick={() => handleVote("upvote")}
            >
              <FiArrowUp />
            </button>
            <span className="text-sm font-bold">
              {formatNumber(comment.stats?.score || 0)}
            </span>
            <button
              className={`btn btn-ghost btn-xs btn-circle ${
                comment.userVote === "downvote" ? "text-error" : ""
              }`}
              onClick={() => handleVote("downvote")}
            >
              <FiArrowDown />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
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
              <p className="whitespace-pre-wrap">{comment.content}</p>
            )}

            {/* Actions */}
            {!isEditing && (
              <div className="flex items-center gap-3 mt-2">
                {canReply && isAuthenticated && (
                  <button
                    className="btn btn-ghost btn-xs gap-1"
                    onClick={() => setShowReplyForm(!showReplyForm)}
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
                  <span className="text-xs text-base-content/60">
                    {comment.repliesCount} trả lời
                  </span>
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
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply._id}
              comment={reply}
              postId={postId}
              onReply={onReply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
