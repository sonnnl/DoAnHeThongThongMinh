/**
 * FILE: web/frontend/src/pages/Post/CreatePost.jsx
 * MỤC ĐÍCH: Trang tạo bài viết mới
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "react-query";
import { postsAPI, categoriesAPI, uploadAPI } from "../../services/api";
import toast from "react-hot-toast";
import { FiImage, FiVideo, FiX } from "react-icons/fi";

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

  // Fetch categories
  const { data: categoriesData } = useQuery("categories", () =>
    categoriesAPI.getCategories()
  );

  // Create post mutation
  const createPostMutation = useMutation(postsAPI.createPost, {
    onSuccess: (data) => {
      console.log("✅ Post created:", data);
      console.log("📝 Slug:", data.slug);
      toast.success("Tạo bài viết thành công!");
      // data đã được unwrap 2 lần
      navigate(`/post/${data.slug}`);
    },
    onError: (error) => {
      console.error("❌ Create post error:", error);
      toast.error(error.response?.data?.message || "Tạo bài viết thất bại");
    },
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput("");
    }
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
        url: result.data.url,
        publicId: result.data.publicId,
        type: result.data.resourceType,
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.title.trim() ||
      !formData.content.trim() ||
      !formData.category
    ) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    createPostMutation.mutate(formData);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Tạo bài viết mới</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">Chọn danh mục *</span>
          </label>
          <select
            name="category"
            className="select select-bordered w-full"
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="">-- Chọn danh mục --</option>
            {categoriesData?.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

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
          <label className="label">
            <span className="label-text-alt">Hỗ trợ Markdown</span>
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
            <span className="label-text font-semibold">Tags</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nhập tag..."
              className="input input-bordered flex-1"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
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
                <div key={index} className="badge badge-primary gap-2">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-xl"
                  >
                    ×
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
