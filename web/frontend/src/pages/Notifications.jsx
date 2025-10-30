/**
 * FILE: web/frontend/src/pages/Notifications.jsx
 * MỤC ĐÍCH: Trang thông báo
 */

import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { notificationsAPI } from "../services/api";
import toast from "react-hot-toast";
import Loading from "../components/UI/Loading";
import {
  FiMessageSquare,
  FiHeart,
  FiUser,
  FiFileText,
  FiCheck,
  FiTrash2,
} from "react-icons/fi";
import { timeAgo } from "../utils/helpers";

const Notifications = () => {
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data, isLoading, error } = useQuery("notifications", () =>
    notificationsAPI.getNotifications()
  );
  // Mark as read mutation
  const markAsReadMutation = useMutation(
    (notificationId) => notificationsAPI.markAsRead(notificationId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("notifications");
      },
    }
  );

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation(
    () => notificationsAPI.markAllAsRead(),
    {
      onSuccess: () => {
        toast.success("Đã đánh dấu tất cả là đã đọc!");
        queryClient.invalidateQueries("notifications");
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || "Thất bại");
      },
    }
  );

  // Delete notification mutation
  const deleteMutation = useMutation(
    (notificationId) => notificationsAPI.deleteNotification(notificationId),
    {
      onSuccess: () => {
        toast.success("Đã xóa thông báo!");
        queryClient.invalidateQueries("notifications");
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || "Xóa thất bại");
      },
    }
  );

  const getNotificationIcon = (type) => {
    switch (type) {
      case "comment":
        return <FiMessageSquare className="text-info" />;
      case "upvote":
      case "downvote":
        return <FiHeart className="text-error" />;
      case "follow":
        return <FiUser className="text-primary" />;
      case "post":
        return <FiFileText className="text-success" />;
      default:
        return <FiMessageSquare />;
    }
  };

  if (isLoading) return <Loading />;
  if (error)
    return <div className="alert alert-error">Lỗi khi tải thông báo</div>;

  const notifications = data?.notifications || [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">
          Thông báo
          {unreadCount > 0 && (
            <span className="badge badge-primary ml-2">{unreadCount}</span>
          )}
        </h1>
        {notifications.length > 0 && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => markAllAsReadMutation.mutate()}
          >
            <FiCheck />
            Đánh dấu tất cả là đã đọc
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12 text-base-content/60">
          Bạn chưa có thông báo nào
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`card shadow-md hover:shadow-lg transition-shadow ${
                notification.isRead ? "bg-base-100" : "bg-primary/5"
              }`}
            >
              <div className="card-body p-4">
                <div className="flex gap-4">
                  {/* Icon */}
                  <div className="text-2xl">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* User avatar & name */}
                    <div className="flex items-center gap-2 mb-2">
                      {notification.sender?.avatar ? (
                        <img
                          src={notification.sender.avatar}
                          alt={notification.sender.username}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center">
                          <FiUser />
                        </div>
                      )}
                      <Link
                        to={
                          notification.sender?.username
                            ? `/u/${notification.sender.username}`
                            : "#"
                        }
                        className="font-semibold hover:text-primary"
                      >
                        {notification.sender?.username || "Hệ thống"}
                      </Link>
                      <span className="text-sm text-base-content/60">
                        {timeAgo(notification.createdAt)}
                      </span>
                    </div>

                    {/* Message */}
                    <p className="mb-2">{notification.message}</p>

                    {/* Link */}
                    {notification.link && (
                      <Link
                        to={notification.link}
                        className="text-sm text-primary hover:underline"
                        onClick={() =>
                          markAsReadMutation.mutate(notification._id)
                        }
                      >
                        Xem chi tiết →
                      </Link>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    {!notification.isRead && (
                      <button
                        className="btn btn-ghost btn-xs btn-circle"
                        onClick={() =>
                          markAsReadMutation.mutate(notification._id)
                        }
                        title="Đánh dấu đã đọc"
                      >
                        <FiCheck />
                      </button>
                    )}
                    <button
                      className="btn btn-ghost btn-xs btn-circle text-error"
                      onClick={() => deleteMutation.mutate(notification._id)}
                      title="Xóa"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
