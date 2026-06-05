/**
 * FILE: web/backend/config/swagger.js
 * MỤC ĐÍCH: Cấu hình OpenAPI/Swagger Spec cho hệ thống
 * LIÊN QUAN:
 *   - web/backend/server.js
 *   - API_DOCUMENTATION.md
 */

const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Smart Discussion Forum API",
    version: "1.0.0",
    description: "Tài liệu API cho Diễn đàn Thảo luận Thông minh (VOZ / Reddit Clone) tích hợp các chức năng AI (Toxic Detection, Emotion Analysis) và Real-time Chat/Notification.",
    contact: {
      name: "Đội ngũ phát triển Diễn đàn",
      email: "support@forum.com"
    }
  },
  servers: [
    {
      url: "http://localhost:5000/api",
      description: "Development Server"
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Nhập JWT Access Token của bạn dưới dạng: Bearer <token>"
      }
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          _id: { type: "string", example: "60d0fe4f5311236168a109ca" },
          username: { type: "string", example: "john_doe" },
          email: { type: "string", example: "john@example.com" },
          avatar: { type: "string", nullable: true, example: "https://cloudinary.com/avatar.png" },
          badge: { type: "string", example: "Newbie" },
          role: { type: "string", example: "user" },
          stats: {
            type: "object",
            properties: {
              postsCount: { type: "integer", example: 5 },
              commentsCount: { type: "integer", example: 10 }
            }
          },
          registeredAt: { type: "string", format: "date-time", example: "2026-01-01T00:00:00.000Z" }
        }
      },
      Post: {
        type: "object",
        properties: {
          _id: { type: "string", example: "60d0fe4f5311236168a109cb" },
          title: { type: "string", example: "Hướng dẫn lập trình ReactJS" },
          slug: { type: "string", example: "huong-dan-lap-trinh-reactjs-abc123" },
          content: { type: "string", example: "Bài viết này hướng dẫn ReactJS từ cơ bản..." },
          author: {
            type: "object",
            properties: {
              _id: { type: "string", example: "60d0fe4f5311236168a109ca" },
              username: { type: "string", example: "john_doe" },
              avatar: { type: "string", example: "..." }
            }
          },
          category: {
            type: "object",
            properties: {
              _id: { type: "string", example: "60d0fe4f5311236168a109cc" },
              name: { type: "string", example: "Technology" }
            }
          },
          media: {
            type: "object",
            properties: {
              images: { type: "array", items: { type: "object" } },
              videos: { type: "array", items: { type: "object" } }
            }
          },
          tags: { type: "array", items: { type: "string" }, example: ["react", "frontend"] },
          stats: {
            type: "object",
            properties: {
              upvotes: { type: "integer", example: 12 },
              downvotes: { type: "integer", example: 1 },
              commentsCount: { type: "integer", example: 4 },
              viewsCount: { type: "integer", example: 152 }
            }
          },
          score: { type: "number", example: 4.5 },
          status: { type: "string", example: "published" },
          isPinned: { type: "boolean", example: false },
          createdAt: { type: "string", format: "date-time", example: "2026-06-01T10:00:00.000Z" }
        }
      },
      Comment: {
        type: "object",
        properties: {
          _id: { type: "string", example: "60d0fe4f5311236168a109cd" },
          content: { type: "string", example: "Bài viết rất hay và bổ ích!" },
          author: { $ref: "#/components/schemas/User" },
          post: { type: "string", example: "60d0fe4f5311236168a109cb" },
          parentComment: { type: "string", nullable: true, example: null },
          depth: { type: "integer", example: 0 },
          stats: {
            type: "object",
            properties: {
              upvotes: { type: "integer", example: 5 },
              downvotes: { type: "integer", example: 0 }
            }
          },
          emotion: {
            type: "object",
            properties: {
              label: { type: "string", example: "joy" },
              confidence: { type: "number", example: 0.95 }
            }
          },
          isDeleted: { type: "boolean", example: false },
          createdAt: { type: "string", format: "date-time", example: "2026-06-01T10:05:00.000Z" }
        }
      }
    }
  },
  security: [
    {
      BearerAuth: []
    }
  ],
  paths: {
    "/auth/register": {
      post: {
        tags: ["🔑 Authentication"],
        summary: "Đăng ký tài khoản người dùng mới",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "email", "password"],
                properties: {
                  username: { type: "string", example: "john_doe" },
                  email: { type: "string", example: "john@example.com" },
                  password: { type: "string", example: "Password123!" }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: "Đăng ký thành công",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        user: { $ref: "#/components/schemas/User" },
                        token: { type: "string", example: "eyJhbGciOiJIUzI1NiIs..." }
                      }
                    },
                    message: { type: "string", example: "User registered successfully" }
                  }
                }
              }
            }
          },
          400: { description: "Lỗi dữ liệu đầu vào không hợp lệ" },
          409: { description: "Email hoặc username đã tồn tại" }
        }
      }
    },
    "/auth/login": {
      post: {
        tags: ["🔑 Authentication"],
        summary: "Đăng nhập hệ thống",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", example: "john@example.com" },
                  password: { type: "string", example: "Password123!" }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Đăng nhập thành công",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        user: { $ref: "#/components/schemas/User" },
                        token: { type: "string", example: "eyJhbGciOiJIUzI1NiIs..." }
                      }
                    }
                  }
                }
              }
            }
          },
          401: { description: "Thông tin đăng nhập sai" },
          403: { description: "Tài khoản đang bị khóa (Banned)" }
        }
      }
    },
    "/auth/google": {
      post: {
        tags: ["🔑 Authentication"],
        summary: "Đăng nhập bằng Google OAuth 2.0",
        description: "Frontend gửi ID Token nhận từ Google OAuth SDK lên Backend để xác thực và tạo phiên đăng nhập.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["token"],
                properties: {
                  token: { type: "string", description: "Google ID Token/Credential nhận được từ phía Client", example: "eyJhbGciOiJSUzI1NiIsImtpZCI6..." }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Đăng nhập bằng Google thành công",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        user: { $ref: "#/components/schemas/User" },
                        token: { type: "string", example: "eyJhbGciOiJIUzI1NiIs..." }
                      }
                    }
                  }
                }
              }
            }
          },
          400: { description: "Thiếu token hoặc token không hợp lệ" },
          401: { description: "Xác thực với Google thất bại" }
        }
      }
    },
    "/auth/me": {
      get: {
        tags: ["🔑 Authentication"],
        summary: "Lấy thông tin tài khoản hiện tại",
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "Thành công",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        user: { $ref: "#/components/schemas/User" }
                      }
                    }
                  }
                }
              }
            }
          },
          401: { description: "Chưa xác thực" }
        }
      }
    },
    "/auth/refresh": {
      post: {
        tags: ["🔑 Authentication"],
        summary: "Tự động gia hạn Access Token mới bằng Refresh Token",
        responses: {
          200: {
            description: "Lấy token mới thành công"
          }
        }
      }
    },
    "/auth/logout": {
      post: {
        tags: ["🔑 Authentication"],
        summary: "Đăng xuất khỏi hệ thống",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Đăng xuất thành công" }
        }
      }
    },
    "/users/{id}": {
      get: {
        tags: ["👤 Users"],
        summary: "Lấy thông tin trang cá nhân của User",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          200: {
            description: "Thành công",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        user: { $ref: "#/components/schemas/User" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      put: {
        tags: ["👤 Users"],
        summary: "Cập nhật thông tin trang cá nhân",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  bio: { type: "string", example: "Hello, I am a developer." },
                  location: { type: "string", example: "Vietnam" },
                  website: { type: "string", example: "https://myblog.com" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Cập nhật thành công" }
        }
      }
    },
    "/users/{id}/avatar": {
      post: {
        tags: ["👤 Users"],
        summary: "Tải lên ảnh đại diện (avatar)",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  avatar: { type: "string", format: "binary" }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Upload thành công",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        avatar: { type: "string", example: "https://cloudinary.com/avatar.jpg" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/categories": {
      get: {
        tags: ["📁 Categories"],
        summary: "Lấy danh sách chuyên mục thảo luận",
        parameters: [
          { name: "includeSubcategories", in: "query", schema: { type: "boolean" }, description: "Bao gồm các chuyên mục con" }
        ],
        responses: {
          200: { description: "Thành công" }
        }
      },
      post: {
        tags: ["📁 Categories"],
        summary: "Tạo chuyên mục thảo luận mới (Admin only)",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string", example: "Công nghệ" },
                  description: { type: "string", example: "Nơi thảo luận công nghệ" },
                  icon: { type: "string", example: "laptop" },
                  color: { type: "string", example: "#3B82F6" },
                  parentCategory: { type: "string", nullable: true, example: null }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Tạo thành công" }
        }
      }
    },
    "/posts": {
      get: {
        tags: ["📝 Posts"],
        summary: "Lấy danh sách bài viết (có bộ lọc và sắp xếp)",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
          { name: "sort", in: "query", schema: { type: "string", enum: ["hot", "new", "top", "controversial"], default: "hot" } },
          { name: "category", in: "query", schema: { type: "string" }, description: "Lọc theo Category ID" },
          { name: "author", in: "query", schema: { type: "string" }, description: "Lọc theo Author ID" },
          { name: "search", in: "query", schema: { type: "string" }, description: "Từ khóa tìm kiếm" }
        ],
        responses: {
          200: {
            description: "Thành công",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        posts: { type: "array", items: { $ref: "#/components/schemas/Post" } },
                        pagination: { type: "object" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ["📝 Posts"],
        summary: "Đăng bài viết mới",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "content", "category"],
                properties: {
                  title: { type: "string", example: "Bài viết mẫu" },
                  content: { type: "string", example: "Nội dung bài viết dùng markdown..." },
                  category: { type: "string", example: "60d0fe4f5311236168a109cc" },
                  tags: { type: "array", items: { type: "string" }, example: ["react"] },
                  media: { type: "object" }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Tạo bài viết thành công" },
          403: { description: "Tài khoản bị hạn chế viết bài (phải tạo tài khoản > 1 giờ và có > 3 bình luận)" }
        }
      }
    },
    "/posts/{slug}": {
      get: {
        tags: ["📝 Posts"],
        summary: "Lấy chi tiết một bài viết theo đường dẫn Slug",
        parameters: [
          { name: "slug", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          200: { description: "Thành công" }
        }
      }
    },
    "/posts/{id}": {
      put: {
        tags: ["📝 Posts"],
        summary: "Cập nhật bài viết",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  content: { type: "string" },
                  tags: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Cập nhật thành công" }
        }
      },
      delete: {
        tags: ["📝 Posts"],
        summary: "Xóa bài viết",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          200: { description: "Xóa bài viết thành công" }
        }
      }
    },
    "/comments": {
      get: {
        tags: ["💬 Comments"],
        summary: "Lấy danh sách bình luận của một bài viết",
        parameters: [
          { name: "postId", in: "query", required: true, schema: { type: "string" } },
          { name: "sort", in: "query", schema: { type: "string", enum: ["best", "new", "top"], default: "best" } }
        ],
        responses: {
          200: {
            description: "Thành công",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        comments: { type: "array", items: { $ref: "#/components/schemas/Comment" } }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ["💬 Comments"],
        summary: "Đăng bình luận mới (Có tích hợp chấm điểm cảm xúc AI tự động)",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["content", "postId"],
                properties: {
                  content: { type: "string", example: "Bình luận ví dụ!" },
                  postId: { type: "string", example: "60d0fe4f5311236168a109cb" },
                  parentCommentId: { type: "string", nullable: true, example: null }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Bình luận thành công" }
        }
      }
    },
    "/comments/{id}": {
      put: {
        tags: ["💬 Comments"],
        summary: "Sửa bình luận",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["content"],
                properties: {
                  content: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Cập nhật thành công" }
        }
      },
      delete: {
        tags: ["💬 Comments"],
        summary: "Xóa bình luận (Soft-delete nếu có reply con)",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          200: { description: "Xóa thành công" }
        }
      }
    },
    "/votes/upvote": {
      post: {
        tags: ["👍 Votes"],
        summary: "Upvote bài viết hoặc bình luận",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["targetType", "targetId"],
                properties: {
                  targetType: { type: "string", enum: ["Post", "Comment"] },
                  targetId: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Bình chọn thành công" }
        }
      }
    },
    "/votes/downvote": {
      post: {
        tags: ["👍 Votes"],
        summary: "Downvote bài viết hoặc bình luận",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["targetType", "targetId"],
                properties: {
                  targetType: { type: "string", enum: ["Post", "Comment"] },
                  targetId: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Bình chọn thành công" }
        }
      }
    },
    "/reports": {
      post: {
        tags: ["🚨 Reports & Moderation"],
        summary: "Gửi báo cáo vi phạm (report)",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["targetType", "targetId", "reason"],
                properties: {
                  targetType: { type: "string", enum: ["Post", "Comment", "User"] },
                  targetId: { type: "string" },
                  reason: { type: "string", example: "spam" },
                  description: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Gửi báo cáo thành công" }
        }
      },
      get: {
        tags: ["🚨 Reports & Moderation"],
        summary: "Lấy danh sách các báo cáo (Moderator/Admin only)",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "status", in: "query", schema: { type: "string", enum: ["pending", "reviewing", "accepted", "rejected"] } }
        ],
        responses: {
          200: { description: "Thành công" }
        }
      }
    },
    "/reports/{id}/accept": {
      put: {
        tags: ["🚨 Reports & Moderation"],
        summary: "Chấp nhận báo cáo vi phạm và thực hiện xử lý (Moderator/Admin only)",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["action"],
                properties: {
                  action: { type: "string", enum: ["content_removed", "warning", "user_banned_1d", "user_banned_permanent"] },
                  notes: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Xử lý thành công" }
        }
      }
    },
    "/upload/image": {
      post: {
        tags: ["📤 Upload Media"],
        summary: "Tải lên hình ảnh lên CDN Cloudinary",
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  image: { type: "string", format: "binary" },
                  folder: { type: "string", default: "posts" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Upload thành công" }
        }
      }
    },
    "/notifications": {
      get: {
        tags: ["🔔 Notifications"],
        summary: "Lấy danh sách thông báo của người dùng",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Thành công" }
        }
      }
    },
    "/messages": {
      get: {
        tags: ["💬 Real-time Messages"],
        summary: "Lấy danh sách các cuộc hội thoại chat",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Thành công" }
        }
      }
    }
  }
};

module.exports = swaggerSpec;
