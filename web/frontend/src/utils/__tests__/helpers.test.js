/**
 * FILE: web/frontend/src/utils/__tests__/helpers.test.js
 * MỤC ĐÍCH: Unit tests cho các helper functions
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  formatDate,
  timeAgo,
  formatNumber,
  truncateText,
  getBadgeClass,
  getEmotionClass,
  getEmotionEmoji,
  getEmotionMessage,
  isValidEmail,
  isValidURL,
  copyToClipboard,
  getInitials,
  calculateReadingTime,
  generateRandomColor,
  parseErrorMessage,
  isImageFile,
  isVideoFile,
  formatFileSize,
} from "../helpers";

describe("Helpers Utility Functions", () => {
  // 1. formatDate
  describe("formatDate", () => {
    it("should format date correctly to DD/MM/YYYY HH:mm", () => {
      const date = "2026-06-05T15:30:00.000Z";
      // We expect formatting based on the UTC/Local, but let's test if it contains parts or conforms to format
      const formatted = formatDate(date);
      expect(formatted).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
    });
  });

  // 2. timeAgo
  describe("timeAgo", () => {
    it("should return relative time string in Vietnamese", () => {
      const now = new Date();
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
      const relative = timeAgo(tenMinutesAgo);
      expect(relative).toContain("trước"); // e.g., "10 phút trước"
    });
  });

  // 3. formatNumber
  describe("formatNumber", () => {
    it("should format numbers under 1000 without suffix", () => {
      expect(formatNumber(500)).toBe("500");
      expect(formatNumber(0)).toBe("0");
    });

    it("should format numbers between 1000 and 999999 with K suffix", () => {
      expect(formatNumber(1500)).toBe("1.5K");
      expect(formatNumber(10000)).toBe("10.0K");
      expect(formatNumber(999900)).toBe("999.9K");
    });

    it("should format numbers greater than or equal to 1000000 with M suffix", () => {
      expect(formatNumber(1500000)).toBe("1.5M");
      expect(formatNumber(20000000)).toBe("20.0M");
    });
  });

  // 4. truncateText
  describe("truncateText", () => {
    it("should return same text if text length is less than or equal to max length", () => {
      expect(truncateText("hello", 10)).toBe("hello");
      expect(truncateText("hello", 5)).toBe("hello");
    });

    it("should truncate and add ellipsis if text length is greater than max length", () => {
      expect(truncateText("hello world", 5)).toBe("hello...");
    });
  });

  // 5. getBadgeClass
  describe("getBadgeClass", () => {
    it("should return correct class names for predefined badges", () => {
      expect(getBadgeClass("Newbie")).toBe("badge-newbie");
      expect(getBadgeClass("Người từng trải")).toBe("badge-experienced");
      expect(getBadgeClass("Chuyên gia")).toBe("badge-expert");
      expect(getBadgeClass("Xem chùa")).toBe("badge-lurker");
      expect(getBadgeClass("Người dùng bị hạn chế")).toBe("badge-restricted");
    });

    it("should return badge-neutral for unknown badges", () => {
      expect(getBadgeClass("Random Badge")).toBe("badge-neutral");
      expect(getBadgeClass(null)).toBe("badge-neutral");
    });
  });

  // 6. getEmotionClass
  describe("getEmotionClass", () => {
    it("should return correct class names for emotions", () => {
      expect(getEmotionClass("joy")).toBe("emotion-joy");
      expect(getEmotionClass("sadness")).toBe("emotion-sadness");
      expect(getEmotionClass("anger")).toBe("emotion-anger");
      expect(getEmotionClass("fear")).toBe("emotion-fear");
      expect(getEmotionClass("surprise")).toBe("emotion-surprise");
      expect(getEmotionClass("enjoyment")).toBe("emotion-enjoyment");
      expect(getEmotionClass("disgust")).toBe("emotion-disgust");
      expect(getEmotionClass("neutral")).toBe("emotion-neutral");
      expect(getEmotionClass("other")).toBe("emotion-neutral");
    });

    it("should return default emotion-neutral for unknown emotion", () => {
      expect(getEmotionClass("unknown")).toBe("emotion-neutral");
    });
  });

  // 7. getEmotionEmoji
  describe("getEmotionEmoji", () => {
    it("should return correct emoji for emotions", () => {
      expect(getEmotionEmoji("joy")).toBe("😊");
      expect(getEmotionEmoji("sadness")).toBe("😢");
      expect(getEmotionEmoji("anger")).toBe("😠");
      expect(getEmotionEmoji("enjoyment")).toBe("😄");
      expect(getEmotionEmoji("disgust")).toBe("🤢");
      expect(getEmotionEmoji("neutral")).toBe("😐");
    });

    it("should return default emoji 😐 for unknown emotion", () => {
      expect(getEmotionEmoji("unknown")).toBe("😐");
    });
  });

  // 8. getEmotionMessage
  describe("getEmotionMessage", () => {
    it("should return warning message for negative or positive emotions", () => {
      expect(getEmotionMessage("joy")).toContain("vui vẻ");
      expect(getEmotionMessage("sadness")).toContain("buồn");
      expect(getEmotionMessage("anger")).toContain("giận dữ");
      expect(getEmotionMessage("enjoyment")).toContain("vui vẻ");
      expect(getEmotionMessage("disgust")).toContain("khó chịu");
    });

    it("should return null for neutral, other, or unknown emotions", () => {
      expect(getEmotionMessage("neutral")).toBeNull();
      expect(getEmotionMessage("other")).toBeNull();
      expect(getEmotionMessage("unknown")).toBeNull();
    });
  });

  // 9. isValidEmail
  describe("isValidEmail", () => {
    it("should return true for valid emails", () => {
      expect(isValidEmail("test@example.com")).toBe(true);
      expect(isValidEmail("user.name+tag@sub.domain.co")).toBe(true);
    });

    it("should return false for invalid emails", () => {
      expect(isValidEmail("invalid-email")).toBe(false);
      expect(isValidEmail("test@")).toBe(false);
      expect(isValidEmail("@example.com")).toBe(false);
      expect(isValidEmail("test@example.")).toBe(false);
    });
  });

  // 10. isValidURL
  describe("isValidURL", () => {
    it("should return true for valid URLs", () => {
      expect(isValidURL("http://google.com")).toBe(true);
      expect(isValidURL("https://localhost:3000/path")).toBe(true);
    });

    it("should return false for invalid URLs", () => {
      expect(isValidURL("google.com")).toBe(false); // standard new URL() fails without protocol
      expect(isValidURL("not a url")).toBe(false);
    });
  });

  // 11. copyToClipboard
  describe("copyToClipboard", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should return true and call writeText if navigator.clipboard is available", async () => {
      const mockWriteText = vi.fn().mockResolvedValue(true);
      vi.stubGlobal("navigator", {
        clipboard: {
          writeText: mockWriteText,
        },
      });

      const result = await copyToClipboard("hello");
      expect(result).toBe(true);
      expect(mockWriteText).toHaveBeenCalledWith("hello");

      vi.unstubAllGlobals();
    });

    it("should return false if copy fails or clipboard is not supported", async () => {
      vi.stubGlobal("navigator", {}); // No clipboard support

      const result = await copyToClipboard("hello");
      expect(result).toBe(false);

      vi.unstubAllGlobals();
    });
  });

  // 12. getInitials
  describe("getInitials", () => {
    it("should return initials for multi-word names", () => {
      expect(getInitials("Nguyễn Văn A")).toBe("NA"); // "Nguyễn" and "A" -> N and A
      expect(getInitials("Trần B")).toBe("TB");
    });

    it("should return first two letters for single-word names", () => {
      expect(getInitials("John")).toBe("JO");
      expect(getInitials("A")).toBe("A");
    });
  });

  // 13. calculateReadingTime
  describe("calculateReadingTime", () => {
    it("should calculate reading time based on 200 words per minute", () => {
      const text = "word ".repeat(300); // 300 words
      expect(calculateReadingTime(text)).toBe("2 phút đọc");
    });

    it("should round up reading time to at least 1 minute", () => {
      expect(calculateReadingTime("hello world")).toBe("1 phút đọc");
    });
  });

  // 14. generateRandomColor
  describe("generateRandomColor", () => {
    it("should return a color from the predefined list", () => {
      const color = generateRandomColor();
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });

  // 15. parseErrorMessage
  describe("parseErrorMessage", () => {
    it("should extract message from response data if exists", () => {
      const error = {
        response: {
          data: {
            message: "Database connection failed",
          },
        },
      };
      expect(parseErrorMessage(error)).toBe("Database connection failed");
    });

    it("should fallback to error.message if no response data message", () => {
      const error = new Error("Network Error");
      expect(parseErrorMessage(error)).toBe("Network Error");
    });

    it("should return default message if no error information", () => {
      expect(parseErrorMessage({})).toBe("Đã có lỗi xảy ra");
    });
  });

  // 16. isImageFile
  describe("isImageFile", () => {
    it("should return true for image files", () => {
      expect(isImageFile({ type: "image/png" })).toBe(true);
      expect(isImageFile({ type: "image/jpeg" })).toBe(true);
    });

    it("should return false for non-image files", () => {
      expect(isImageFile({ type: "video/mp4" })).toBe(false);
      expect(isImageFile({ type: "text/plain" })).toBe(false);
    });
  });

  // 17. isVideoFile
  describe("isVideoFile", () => {
    it("should return true for video files", () => {
      expect(isVideoFile({ type: "video/mp4" })).toBe(true);
      expect(isVideoFile({ type: "video/webm" })).toBe(true);
    });

    it("should return false for non-video files", () => {
      expect(isVideoFile({ type: "image/png" })).toBe(false);
      expect(isVideoFile({ type: "text/plain" })).toBe(false);
    });
  });

  // 18. formatFileSize
  describe("formatFileSize", () => {
    it("should return 0 Bytes for zero size", () => {
      expect(formatFileSize(0)).toBe("0 Bytes");
    });

    it("should format bytes correctly", () => {
      expect(formatFileSize(500)).toBe("500 Bytes");
    });

    it("should format KB correctly", () => {
      expect(formatFileSize(1024)).toBe("1 KB");
      expect(formatFileSize(2048)).toBe("2 KB");
      expect(formatFileSize(1500)).toBe("1.46 KB");
    });

    it("should format MB correctly", () => {
      expect(formatFileSize(1024 * 1024)).toBe("1 MB");
      expect(formatFileSize(1.5 * 1024 * 1024)).toBe("1.5 MB");
    });

    it("should format GB correctly", () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe("1 GB");
    });
  });
});
