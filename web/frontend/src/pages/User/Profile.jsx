/**
 * FILE: web/frontend/src/pages/User/Profile.jsx
 * MỤC ĐÍCH: Trang profile user
 */

import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "react-query";
import { usersAPI } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import Loading from "../../components/UI/Loading";
import PostCard from "../../components/Post/PostCard";
import { FiUser, FiCalendar, FiMapPin, FiLink } from "react-icons/fi";
import { formatDate, getBadgeClass } from "../../utils/helpers";

const Profile = () => {
  const { username } = useParams();
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState("posts");

  // Fetch user profile
  const { data: profileData, isLoading } = useQuery(
    ["user", username],
    () => usersAPI.getUserProfile(username),
    {
      enabled: !!username,
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
    }
  );

  // Fetch user comments
  const { data: commentsData } = useQuery(
    ["userComments", userId],
    () => usersAPI.getUserComments(userId, { limit: 20 }),
    {
      enabled: !!userId,
    }
  );

  if (isLoading) return <Loading />;
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
                <span className={`badge ${getBadgeClass(user?.badge)}`}>
                  {user?.badge}
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
              {isOwnProfile && (
                <div className="mt-4">
                  <Link to="/settings" className="btn btn-primary">
                    Chỉnh sửa profile
                  </Link>
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
              <PostCard key={post._id} post={post} />
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
