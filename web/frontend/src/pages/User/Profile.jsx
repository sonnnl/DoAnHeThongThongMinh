/**
 * FILE: web/frontend/src/pages/User/Profile.jsx
 * MỤC ĐÍCH: Trang profile user
 */

import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "react-query";
import { usersAPI, messagesAPI } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import Loading from "../../components/UI/Loading";
import PostCard from "../../components/Post/PostCard";
import { FiUser, FiCalendar, FiMapPin, FiLink, FiMessageCircle } from "react-icons/fi";
import { formatDate, getBadgeClass } from "../../utils/helpers";
import toast from "react-hot-toast";

const Profile = () => {
  const { username } = useParams();
  const { user: currentUser } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("posts");
  const [isMessaging, setIsMessaging] = useState(false);

  // Fetch user profile
  const { data: profileData, isLoading } = useQuery(
    ["user", username],
    () => usersAPI.getUserProfile(username),
    {
      enabled: !!username,
      staleTime: 60 * 1000, // tránh refetch gấp gây nháy lần đầu
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      keepPreviousData: true,
    }
  );

  // profileData đã là user object trực tiếp (đã unwrap 2 lần)
  const user = profileData;
  const userId = user?._id;

  // Fetch user posts
  const { data: postsData } = useQuery(
    ["userPosts", userId],
    () => usersAPI.getUserPosts(userId, { limit: 20 }),
    {
      enabled: !!userId,
      staleTime: 60 * 1000,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      keepPreviousData: true,
    }
  );

  // Fetch user comments
  const { data: commentsData } = useQuery(
    ["userComments", userId],
    () => usersAPI.getUserComments(userId, { limit: 20 }),
    {
      enabled: !!userId,
      staleTime: 60 * 1000,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      keepPreviousData: true,
    }
  );

  if (isLoading) {
    return (
      <div>
        {/* Profile Header Skeleton */}
        <div className="card bg-base-100 shadow-md mb-6">
          <div className="card-body">
            <div className="flex flex-col md:flex-row gap-6 min-h-[140px] animate-pulse">
              <div className="avatar">
                <div className="w-32 h-32 rounded-full bg-base-200" />
              </div>
              <div className="flex-1">
                <div className="h-6 w-48 bg-base-200 rounded mb-3" />
                <div className="h-4 w-3/4 bg-base-200 rounded mb-3" />
                <div className="h-4 w-1/2 bg-base-200 rounded mb-4" />
                <div className="grid grid-cols-3 gap-3 max-w-md">
                  <div className="h-12 bg-base-200 rounded" />
                  <div className="h-12 bg-base-200 rounded" />
                  <div className="h-12 bg-base-200 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="tabs tabs-boxed mb-6">
          <button className="tab tab-active">Bài viết</button>
          <button className="tab">Bình luận</button>
        </div>

        {/* List Skeleton */}
        <div className="space-y-4 min-h-[300px]">
          <div className="card bg-base-100 shadow-md animate-pulse">
            <div className="card-body">
              <div className="h-5 w-2/3 bg-base-200 rounded mb-2" />
              <div className="h-4 w-full bg-base-200 rounded mb-2" />
              <div className="h-4 w-5/6 bg-base-200 rounded" />
            </div>
          </div>
          <div className="card bg-base-100 shadow-md animate-pulse">
            <div className="card-body">
              <div className="h-5 w-1/2 bg-base-200 rounded mb-2" />
              <div className="h-4 w-5/6 bg-base-200 rounded mb-2" />
              <div className="h-4 w-2/3 bg-base-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="card bg-base-100 shadow-md">
        <div className="card-body text-center py-20">
          <h2 className="text-2xl font-bold mb-2">Không tìm thấy user</h2>
          <p className="text-base-content/60">
            User "@{username}" không tồn tại hoặc đã bị xóa.
          </p>
        </div>
      </div>
    );
  }
  const isOwnProfile = currentUser?.username === username;

  return (
    <div>
      {/* Profile Header */}
      <div className="card bg-base-100 shadow-md mb-6">
        <div className="card-body">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="avatar">
              <div className="w-32 h-32 rounded-full">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.username} />
                ) : (
                  <div className="bg-primary text-primary-content w-full h-full flex items-center justify-center text-4xl">
                    <FiUser />
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{user?.username}</h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-base-200 text-base-content border border-base-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-3.5 h-3.5 text-amber-500"
                  >
                    <path d="M11.48 3.499a.562.562 0 011.04 0l1.462 3.73a.563.563 0 00.475.354l3.993.332c.499.042.701.663.321.988l-3.04 2.62a.563.563 0 00-.182.557l.91 3.867a.562.562 0 01-.84.61l-3.44-1.937a.563.563 0 00-.555 0L8.14 16.557a.562.562 0 01-.84-.61l.91-3.867a.563.563 0 00-.182-.557l-3.04-2.62a.563.563 0 01.321-.988l3.993-.332a.563.563 0 00.475-.354l1.462-3.73z" />
                  </svg>
                  <span>{user?.badge}</span>
                </span>
              </div>

              {user?.bio && (
                <p className="text-base-content/80 mb-4">{user.bio}</p>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-base-content/60 mb-4">
                <div className="flex items-center gap-1">
                  <FiCalendar />
                  Tham gia {formatDate(user?.registeredAt)}
                </div>
                {user?.location && (
                  <div className="flex items-center gap-1">
                    <FiMapPin />
                    {user.location}
                  </div>
                )}
                {user?.website && (
                  <a
                    href={user.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-primary"
                  >
                    <FiLink />
                    {user.website}
                  </a>
                )}
              </div>

              {/* Stats */}
              <div className="stats stats-horizontal shadow">
                <div className="stat">
                  <div className="stat-title">Posts</div>
                  <div className="stat-value text-primary">
                    {user?.stats?.postsCount || 0}
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-title">Comments</div>
                  <div className="stat-value text-secondary">
                    {user?.stats?.commentsCount || 0}
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-title">Karma</div>
                  <div className="stat-value text-accent">
                    {user?.stats?.upvotesReceived || 0}
                  </div>
                </div>
              </div>

              {/* Actions */}
              {isOwnProfile ? (
                <div className="mt-4">
                  <Link to="/settings" className="btn btn-primary">
                    Chỉnh sửa profile
                  </Link>
                </div>
              ) : (
                <div className="mt-4 flex gap-3">
                  <button
                    className="btn btn-primary gap-2"
                    onClick={async () => {
                      if (isMessaging) return;
                      setIsMessaging(true);
                      try {
                        // Tìm hoặc tạo conversation
                        const response = await messagesAPI.getOrCreateConversation(
                          userId
                        );
                        
                        // ✅ FIX: Log để debug
                        console.log("Response từ API:", response);
                        
                        // ✅ FIX: Kiểm tra response structure
                        // Axios interceptor đã unwrap response.data, nên response = { success, data }
                        if (!response) {
                          throw new Error("Response trống");
                        }
                        
                        // Response có thể là { success, data } hoặc trực tiếp là data
                        const conversation = response.data || response;
                        
                        if (!conversation) {
                          throw new Error("Conversation không tồn tại trong response");
                        }
                        
                        // ✅ FIX: Kiểm tra conversation có _id không
                        const conversationId = conversation._id || conversation.id;
                        if (!conversationId) {
                          console.error("Conversation object:", conversation);
                          throw new Error("Conversation không có _id");
                        }
                        
                        // Navigate đến trang messages với conversationId
                        navigate(`/messages?conversation=${conversationId}`);
                      } catch (error) {
                        console.error("Lỗi tạo conversation:", error);
                        console.error("Error details:", {
                          message: error.message,
                          response: error.response,
                          stack: error.stack,
                        });
                        toast.error(
                          error.response?.data?.message ||
                            error.message ||
                            "Không thể bắt đầu cuộc trò chuyện"
                        );
                      } finally {
                        setIsMessaging(false);
                      }
                    }}
                    disabled={isMessaging}
                  >
                    <FiMessageCircle />
                    {isMessaging ? "Đang xử lý..." : "Nhắn tin"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed mb-6">
        <button
          className={`tab ${activeTab === "posts" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("posts")}
        >
          Bài viết ({postsData?.posts?.length || 0})
        </button>
        <button
          className={`tab ${activeTab === "comments" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("comments")}
        >
          Bình luận ({commentsData?.comments?.length || 0})
        </button>
      </div>

      {/* Content */}
      {activeTab === "posts" && (
        <div className="space-y-4">
          {postsData?.posts?.length > 0 ? (
            postsData.posts.map((post) => (
              <PostCard key={post._id} post={post} hideVoteButtons={true} />
            ))
          ) : (
            <div className="text-center py-12 text-base-content/60">
              Chưa có bài viết nào
            </div>
          )}
        </div>
      )}

      {activeTab === "comments" && (
        <div className="space-y-4">
          {commentsData?.comments?.length > 0 ? (
            commentsData.comments.map((comment) => (
              <div key={comment._id} className="card bg-base-100 shadow-md">
                <div className="card-body">
                  <p>{comment.content}</p>
                  <Link
                    to={`/post/${comment.post?.slug}`}
                    className="text-sm text-primary"
                  >
                    trong {comment.post?.title}
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-base-content/60">
              Chưa có bình luận nào
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;
