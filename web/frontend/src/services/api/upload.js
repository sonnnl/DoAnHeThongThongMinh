/**
 * FILE: web/frontend/src/services/api/upload.js
 * MỤC ĐÍCH: API calls cho file upload
 */

import axios from "../axios";

const uploadAPI = {
  // Upload single file
  uploadFile: async (file, folder = "general") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const response = await axios.post("/upload/single", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Upload multiple files
  uploadFiles: async (files, folder = "general") => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });
    formData.append("folder", folder);

    const response = await axios.post("/upload/multiple", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Upload avatar
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post("/upload/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Delete file
  deleteFile: async (publicId, resourceType = "image") => {
    const response = await axios.delete("/upload", {
      data: { publicId, resourceType },
    });
    return response.data;
  },
};

export default uploadAPI;
