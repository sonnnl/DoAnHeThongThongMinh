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
import { FiTag, FiX } from "react-icons/fi";

const MAX_TAGS = 6;
const MAX_TAG_LENGTH = 30;
const sanitizeTag = (value) =>
  value
    .trim()
    .replace(/^#/, "")
    .replace(/\s+/g, "-")
    .toLowerCase();

const EditPost = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    tags: [],
  });
  const [tagInput, setTagInput] = useState("");

  // Fetch post
  const { data: postData, isLoading } = useQuery(
    ["post", postId],
    () => postsAPI.getPostById(postId),
    {
      onSuccess: (data) => {
        setFormData({
          title: data.data.title,
          content: data.data.content,
          tags:
            data.data.tags
              ?.map((tag) => sanitizeTag(tag))
              .filter((tag) => Boolean(tag)) || [],
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

  const handleAddTag = () => {
    const normalized = sanitizeTag(tagInput);
    if (!normalized) return;
    if (normalized.length > MAX_TAG_LENGTH) {
      toast.error(`Tag tối đa ${MAX_TAG_LENGTH} ký tự`);
      return;
    }
    if (formData.tags.includes(normalized)) {
      setTagInput("");
      return;
    }
    if (formData.tags.length >= MAX_TAGS) {
      toast.error(`Bạn chỉ được thêm tối đa ${MAX_TAGS} tag`);
      return;
    }
    setFormData({ ...formData, tags: [...formData.tags, normalized] });
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tagToRemove),
    });
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

        {/* Tags */}
        <div className="form-control">
          <label className="label">
            <div>
              <span className="label-text font-semibold">Tags</span>
              <span className="label-text-alt text-base-content/60 block">
                Tối đa {MAX_TAGS} tag · auto chữ thường, Enter/dấu phẩy để thêm
              </span>
            </div>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="Nhập tag và nhấn Enter"
              className="input input-bordered flex-1"
              maxLength={MAX_TAG_LENGTH + 5}
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="btn btn-outline"
            >
              Thêm
            </button>
          </div>
          {formData.tags?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <div
                  key={tag}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-base-300 bg-base-200 text-sm shadow-sm"
                >
                  <FiTag className="text-primary" />
                  <span className="font-medium text-base-content">
                    #{tag}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="btn btn-ghost btn-xs btn-circle"
                    aria-label={`Xóa tag ${tag}`}
                  >
                    <FiX />
                  </button>
                </div>
              ))}
            </div>
          )}
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
