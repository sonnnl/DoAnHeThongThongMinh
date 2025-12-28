/**
 * FILE: web/frontend/src/pages/Post/CreatePost.jsx
 * MỤC ĐÍCH: Trang tạo bài viết mới
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "react-query";
import { postsAPI, categoriesAPI, uploadAPI } from "../../services/api";
import toast from "react-hot-toast";
import { FiImage, FiVideo, FiX, FiTag } from "react-icons/fi";

const MAX_TAGS = 6;
const MAX_TAG_LENGTH = 30;
const sanitizeTag = (value) =>
  value.trim().replace(/^#/, "").replace(/\s+/g, "-").toLowerCase();

const CreatePost = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
    tags: [],
    mediaFiles: [],
  });
  const [tagInput, setTagInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState({});

  // Fetch categories
  const { data: categoriesData } = useQuery("categories", () =>
    categoriesAPI.getCategories()
  );

  // Create post mutation
  const createPostMutation = useMutation(postsAPI.createPost, {
    onSuccess: (data) => {
      console.log("✅ Post created:", data);
      console.log("📝 Slug:", data?.data?.slug);
      toast.success("Tạo bài viết thành công!");
      navigate(`/post/${data?.data?.slug}`);
    },
    onError: (error) => {
      console.error("❌ Create post error:", error);
      const errorMessage =
        error.response?.data?.message || "Tạo bài viết thất bại";

      // Check if it's a toxic content error
      if (
        errorMessage.includes("toxic") ||
        errorMessage.includes("ngôn từ không phù hợp")
      ) {
        const newErrors = { general: errorMessage };
        setErrors(newErrors);
      } else {
        // Lỗi khác (server, network, etc.)
        toast.error(errorMessage);
      }
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear error khi user bắt đầu nhập
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null,
      });
    }
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

    setFormData({
      ...formData,
      tags: [...formData.tags, normalized],
    });
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = files.map((file) =>
        uploadAPI.uploadFile(file, "posts")
      );
      const results = await Promise.all(uploadPromises);

      const newMediaFiles = results.map((result) => ({
        url: result.url,
        publicId: result.publicId,
        type: result.resourceType,
      }));

      setFormData({
        ...formData,
        mediaFiles: [...formData.mediaFiles, ...newMediaFiles],
      });
      toast.success("Upload thành công!");
    } catch (error) {
      toast.error("Upload thất bại");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveMedia = (indexToRemove) => {
    setFormData({
      ...formData,
      mediaFiles: formData.mediaFiles.filter(
        (_, index) => index !== indexToRemove
      ),
    });
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate category
    if (!formData.category) {
      newErrors.category = "Vui lòng chọn danh mục";
    }

    // Validate title
    if (!formData.title.trim()) {
      newErrors.title = "Vui lòng nhập tiêu đề";
    } else if (formData.title.trim().length < 10) {
      newErrors.title = "Tiêu đề phải có ít nhất 10 ký tự";
    } else if (formData.title.trim().length > 300) {
      newErrors.title = "Tiêu đề không được vượt quá 300 ký tự";
    }

    // Validate content
    if (!formData.content.trim()) {
      newErrors.content = "Vui lòng nhập nội dung";
    } else if (formData.content.trim().length < 20) {
      newErrors.content = "Nội dung phải có ít nhất 20 ký tự";
    } else if (formData.content.trim().length > 50000) {
      newErrors.content = "Nội dung không được vượt quá 50,000 ký tự";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous errors
    setErrors({});

    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    createPostMutation.mutate(formData);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Tạo bài viết mới</h1>

      {errors.general && (
        <div className="alert alert-error mb-4">
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
          <span>{errors.general}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">Chọn danh mục *</span>
          </label>
          <select
            name="category"
            className={`select select-bordered w-full ${
              errors.category ? "select-error" : ""
            }`}
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="">-- Chọn danh mục --</option>
            {(Array.isArray(categoriesData)
              ? categoriesData
              : categoriesData?.data || []
            ).map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.category && (
            <label className="label">
              <span className="label-text-alt text-error flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {errors.category}
              </span>
            </label>
          )}
        </div>

        {/* Title */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">Tiêu đề *</span>
            <span className="label-text-alt text-base-content/50">
              {formData.title.length}/300
            </span>
          </label>
          <input
            type="text"
            name="title"
            placeholder="Nhập tiêu đề bài viết..."
            className={`input input-bordered w-full ${
              errors.title ? "input-error" : ""
            }`}
            value={formData.title}
            onChange={handleChange}
            required
          />
          {errors.title && (
            <label className="label">
              <span className="label-text-alt text-error flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {errors.title}
              </span>
            </label>
          )}
        </div>

        {/* Content */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">Nội dung *</span>
            <span className="label-text-alt text-base-content/50">
              {formData.content.length}/50,000
            </span>
          </label>
          <textarea
            name="content"
            placeholder="Nhập nội dung bài viết..."
            className={`textarea textarea-bordered h-64 ${
              errors.content ? "textarea-error" : ""
            }`}
            value={formData.content}
            onChange={handleChange}
            required
          ></textarea>
          <label className="label">
            <span className="label-text-alt">
              {errors.content ? (
                <span className="text-error flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {errors.content}
                </span>
              ) : (
                "Hỗ trợ Markdown"
              )}
            </span>
          </label>
        </div>

        {/* Media Upload */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">Ảnh/Video</span>
          </label>
          <div className="flex gap-2">
            <label
              className={`btn btn-outline gap-2 ${
                isUploading ? "loading" : ""
              }`}
            >
              <FiImage />
              Upload
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isUploading}
              />
            </label>
            <span className="text-sm text-base-content/60 self-center">
              Max 25MB mỗi file
            </span>
          </div>

          {/* Media preview */}
          {formData.mediaFiles.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mt-4">
              {formData.mediaFiles.map((media, index) => (
                <div key={index} className="relative">
                  {media.type === "image" ? (
                    <img
                      src={media.url}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ) : (
                    <video
                      src={media.url}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveMedia(index)}
                    className="btn btn-circle btn-sm btn-error absolute top-2 right-2"
                  >
                    <FiX />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="form-control">
          <label className="label">
            <div>
              <span className="label-text font-semibold">Tags</span>
              <span className="label-text-alt text-base-content/60 block">
                Tối đa {MAX_TAGS} tag, gõ Enter hoặc dấu phẩy để thêm
              </span>
            </div>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nhập tag (Enter hoặc dấu phẩy để thêm)"
              className="input input-bordered flex-1"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              maxLength={MAX_TAG_LENGTH + 5}
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="btn btn-primary"
            >
              Thêm
            </button>
          </div>

          {/* Tags display */}
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {formData.tags.map((tag, index) => (
                <div
                  key={index}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-base-300 bg-base-200 text-sm shadow-sm"
                >
                  <FiTag className="text-primary" />
                  <span className="font-medium text-base-content">#{tag}</span>
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

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            className={`btn btn-primary flex-1 ${
              createPostMutation.isLoading ? "loading" : ""
            }`}
            disabled={createPostMutation.isLoading || isUploading}
          >
            {createPostMutation.isLoading ? "Đang đăng..." : "Đăng bài"}
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

export default CreatePost;
