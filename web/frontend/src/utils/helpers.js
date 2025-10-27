/**
 * FILE: web/frontend/src/utils/helpers.js
 * MỤC ĐÍCH: Helper functions và utilities
 */

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";

dayjs.extend(relativeTime);
dayjs.locale("vi");

// Format date
export const formatDate = (date) => {
  return dayjs(date).format("DD/MM/YYYY HH:mm");
};

// Relative time (e.g., "2 giờ trước")
export const timeAgo = (date) => {
  return dayjs(date).fromNow();
};

// Format number with K, M
export const formatNumber = (num) => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

// Truncate text
export const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

// Get badge class
export const getBadgeClass = (badge) => {
  const badgeMap = {
    Newbie: "badge-newbie",
    "Người từng trải": "badge-experienced",
    "Chuyên gia": "badge-expert",
    "Xem chùa": "badge-lurker",
    "Người dùng bị hạn chế": "badge-restricted",
  };
  return badgeMap[badge] || "badge-neutral";
};

// Get emotion class
export const getEmotionClass = (emotion) => {
  const emotionMap = {
    joy: "emotion-joy",
    sadness: "emotion-sadness",
    anger: "emotion-anger",
    fear: "emotion-fear",
    surprise: "emotion-surprise",
    neutral: "emotion-neutral",
  };
  return emotionMap[emotion] || "emotion-neutral";
};

// Get emotion emoji
export const getEmotionEmoji = (emotion) => {
  const emojiMap = {
    joy: "😊",
    sadness: "😢",
    anger: "😠",
    fear: "😨",
    surprise: "😲",
    neutral: "😐",
  };
  return emojiMap[emotion] || "😐";
};

// Validate email
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Validate URL
export const isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Copy to clipboard
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

// Get initials from name
export const getInitials = (name) => {
  const names = name.split(" ");
  if (names.length >= 2) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Calculate reading time
export const calculateReadingTime = (text) => {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} phút đọc`;
};

// Debounce function
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Generate random color
export const generateRandomColor = () => {
  const colors = [
    "#3b82f6",
    "#8b5cf6",
    "#f59e0b",
    "#ef4444",
    "#10b981",
    "#06b6d4",
    "#ec4899",
    "#f97316",
    "#84cc16",
    "#6366f1",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Parse error message
export const parseErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return "Đã có lỗi xảy ra";
};

// Check if file is image
export const isImageFile = (file) => {
  return file.type.startsWith("image/");
};

// Check if file is video
export const isVideoFile = (file) => {
  return file.type.startsWith("video/");
};

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
};
