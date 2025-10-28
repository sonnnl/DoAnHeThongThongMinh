/**
 * FILE: web/frontend/src/components/Comment/CommentList.jsx
 * MỤC ĐÍCH: List comments với form tạo comment mới
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { commentsAPI } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import toast from "react-hot-toast";
import CommentItem from "./CommentItem";
import Loading from "../UI/Loading";

const CommentList = ({ postId }) => {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [sort, setSort] = useState("best");
  const [error, setError] = useState("");

  // Fetch comments
  const {
    data,
    isLoading,
    error: queryError,
  } = useQuery(
    ["comments", postId, sort],
    () => commentsAPI.getCommentsByPost(postId, { sort }),
    {
      enabled: !!postId,
    }
  );

  // Create comment mutation
  const createCommentMutation = useMutation(
    (content) => commentsAPI.createComment({ postId, content }),
    {
      onSuccess: () => {
        toast.success("Bình luận thành công!");
        setNewComment("");
        setError("");
        queryClient.invalidateQueries(["comments", postId]);
      },
      onError: (error) => {
        const errorMessage =
          error.response?.data?.message || "Bình luận thất bại";
        setError(errorMessage);
      },
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để bình luận");
      return;
    }

    if (!newComment.trim()) {
      toast.error("Nội dung không được để trống");
      return;
    }

    createCommentMutation.mutate(newComment);
  };

  const comments = data?.data?.comments || [];

  return (
    <div className="space-y-6">
      {/* Comment form */}
      {isAuthenticated && (
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h3 className="font-semibold mb-2">Viết bình luận</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea
                className={`textarea textarea-bordered w-full ${
                  error ? "textarea-error" : ""
                }`}
                placeholder="Chia sẻ suy nghĩ của bạn..."
                value={newComment}
                onChange={(e) => {
                  setNewComment(e.target.value);
                  if (error) setError(""); // Clear error when typing
                }}
                rows={4}
              ></textarea>
              {error && (
                <div className="alert alert-error py-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="stroke-current shrink-0 h-6 w-6"
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
                  <span>{error}</span>
                </div>
              )}
              <button
                type="submit"
                className={`btn btn-primary ${
                  createCommentMutation.isLoading ? "loading" : ""
                }`}
                disabled={createCommentMutation.isLoading}
              >
                Gửi bình luận
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Sort options */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{comments.length} bình luận</h3>
        <div className="tabs tabs-boxed">
          <button
            className={`tab ${sort === "best" ? "tab-active" : ""}`}
            onClick={() => setSort("best")}
          >
            Best
          </button>
          <button
            className={`tab ${sort === "new" ? "tab-active" : ""}`}
            onClick={() => setSort("new")}
          >
            Mới nhất
          </button>
          <button
            className={`tab ${sort === "old" ? "tab-active" : ""}`}
            onClick={() => setSort("old")}
          >
            Cũ nhất
          </button>
        </div>
      </div>

      {/* Comments list */}
      {isLoading ? (
        <Loading />
      ) : queryError ? (
        <div className="alert alert-error">Lỗi khi tải bình luận</div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12 text-base-content/60">
          Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem key={comment._id} comment={comment} postId={postId} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentList;
