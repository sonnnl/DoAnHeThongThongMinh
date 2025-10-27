/**
 * FILE: web/frontend/src/pages/Post/EditPost.jsx
 * MỤC ĐÍCH: Trang chỉnh sửa bài viết
 */

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation } from "react-query";
import { postsAPI } from "../../services/api";
import toast from "react-hot-toast";
import Loading from "../../components/UI/Loading";

const EditPost = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    tags: [],
  });

  // Fetch post
  const { data: postData, isLoading } = useQuery(
    ["post", postId],
    () => postsAPI.getPost(postId),
    {
      onSuccess: (data) => {
        setFormData({
          title: data.data.title,
          content: data.data.content,
          tags: data.data.tags || [],
        });
      },
    }
  );

  // Update post mutation
  const updatePostMutation = useMutation(
    (data) => postsAPI.updatePost(postId, data),
    {
      onSuccess: (data) => {
        toast.success("Cập nhật bài viết thành công!");
        navigate(`/post/${data.data.slug}`);
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Cập nhật bài viết thất bại"
        );
      },
    }
  );

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    updatePostMutation.mutate(formData);
  };

  if (isLoading) return <Loading />;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Chỉnh sửa bài viết</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">Tiêu đề *</span>
          </label>
          <input
            type="text"
            name="title"
            placeholder="Nhập tiêu đề bài viết..."
            className="input input-bordered w-full"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        {/* Content */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">Nội dung *</span>
          </label>
          <textarea
            name="content"
            placeholder="Nhập nội dung bài viết..."
            className="textarea textarea-bordered h-64"
            value={formData.content}
            onChange={handleChange}
            required
          ></textarea>
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            className={`btn btn-primary flex-1 ${
              updatePostMutation.isLoading ? "loading" : ""
            }`}
            disabled={updatePostMutation.isLoading}
          >
            {updatePostMutation.isLoading ? "Đang cập nhật..." : "Cập nhật"}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-ghost"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditPost;
