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

  // Fetch comments
  const { data, isLoading, error } = useQuery(
    ["comments", postId, sort],
    () => commentsAPI.getCommentsByPost(postId, { sort }),
    {
      enabled: !!postId,
    }
  );

  // Create comment mutation
  const createCommentMutation = useMutation(
    (content) => commentsAPI.createComment({ post: postId, content }),
    {
      onSuccess: () => {
        toast.success("Bình luận thành công!");
        setNewComment("");
        queryClient.invalidateQueries(["comments", postId]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || "Bình luận thất bại");
      },
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();

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
                className="textarea textarea-bordered w-full"
                placeholder="Chia sẻ suy nghĩ của bạn..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={4}
              ></textarea>
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
      ) : error ? (
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
