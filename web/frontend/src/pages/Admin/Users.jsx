/**
 * FILE: web/frontend/src/pages/Admin/Users.jsx
 * MỤC ĐÍCH: Trang quản lý người dùng (tối thiểu: tìm kiếm, xem role)
 */

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import {
  FiSearch,
  FiShield,
  FiSlash,
  FiCheck,
  FiMoreHorizontal,
} from "react-icons/fi";
import usersAPI from "../../services/api/users";
import { useAuthStore } from "../../store/authStore";
import toast from "react-hot-toast";

const Users = () => {
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [banned, setBanned] = useState("");
  const { user: currentUser } = useAuthStore();
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    const onWindowClick = () => setOpenMenuId(null);
    window.addEventListener("click", onWindowClick);
    return () => window.removeEventListener("click", onWindowClick);
  }, []);

  const queryClient = useQueryClient();
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["admin", "users", { q, role, banned }],
    queryFn: () => usersAPI.adminList({ q, role, banned, limit: 20 }),
    keepPreviousData: true,
  });

  const users = data?.data?.users || data?.users || [];

  const updateRoleMutation = useMutation(
    ({ userId, newRole }) => usersAPI.adminUpdateRole(userId, newRole),
    {
      onSuccess: () => {
        toast.success("Đã cập nhật quyền");
        queryClient.invalidateQueries(["admin", "users"]);
      },
      onError: (e) =>
        toast.error(e?.response?.data?.message || "Lỗi cập nhật quyền"),
    }
  );
  const banMutation = useMutation(
    ({ userId, days, reason }) => usersAPI.adminBan(userId, days, reason),
    {
      onSuccess: () => {
        toast.success("Đã ban người dùng");
        queryClient.invalidateQueries(["admin", "users"]);
      },
      onError: (e) => toast.error(e?.response?.data?.message || "Ban thất bại"),
    }
  );
  const unbanMutation = useMutation(
    ({ userId }) => usersAPI.adminUnban(userId),
    {
      onSuccess: () => {
        toast.success("Đã gỡ ban");
        queryClient.invalidateQueries(["admin", "users"]);
      },
      onError: (e) =>
        toast.error(e?.response?.data?.message || "Gỡ ban thất bại"),
    }
  );

  const restrictMutation = useMutation(
    ({ userId, payload }) => usersAPI.adminSetRestrictions(userId, payload),
    {
      onSuccess: () => {
        toast.success("Đã cập nhật hạn chế");
        queryClient.invalidateQueries(["admin", "users"]);
      },
      onError: (e) =>
        toast.error(e?.response?.data?.message || "Cập nhật hạn chế thất bại"),
    }
  );

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Quản lý Người dùng</h1>

      <div className="flex flex-wrap gap-2 mb-4">
        <input
          className="input input-bordered w-full max-w-xl"
          placeholder="Tìm theo username/email"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="select select-bordered"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="">Tất cả vai trò</option>
          <option value="user">user</option>
          <option value="moderator">moderator</option>
          <option value="admin">admin</option>
        </select>
        <select
          className="select select-bordered"
          value={banned}
          onChange={(e) => setBanned(e.target.value)}
        >
          <option value="">Tất cả</option>
          <option value="true">Đang bị ban</option>
          <option value="false">Không bị ban</option>
        </select>
        <button
          className="btn btn-primary gap-2"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <FiSearch /> Tìm kiếm
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isFetching && <div className="text-sm opacity-70">Đang tìm...</div>}
        {!isFetching && users.length === 0 && (
          <div className="text-sm opacity-70">Không có kết quả</div>
        )}
        {users.map((u) => {
          const isSelf = currentUser?._id === u._id;
          const isCardDisabled =
            currentUser?.role === "moderator" && u.role === "admin";
          return (
            <div
              key={u._id}
              className={`card bg-base-100 border border-base-300 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-[2px] rounded-xl ${
                isCardDisabled ? "opacity-60" : ""
              }`}
            >
              {/* Accent bar */}
              <div className="h-1 w-full bg-gradient-to-r from-primary/70 via-secondary/60 to-accent/60" />
              <div className="card-body p-5">
                {/* Header: avatar + name + role + actions */}
                <div className="flex flex-wrap items-start justify-between gap-5">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="avatar">
                      <div className="w-14 h-14 rounded-full ring ring-primary/70 ring-offset-base-100 ring-offset-2">
                        <img
                          src={
                            u.avatar ||
                            "https://ui-avatars.com/api/?name=" +
                              (u.username || "user")
                          }
                          alt={u.username}
                        />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold truncate max-w-[200px] text-base-content">
                          {u.username}
                        </h3>
                        <div className="badge badge-primary badge-outline capitalize">
                          {u.role || "user"}
                        </div>
                        {u.restrictions?.bannedUntil &&
                          new Date(u.restrictions.bannedUntil) > new Date() && (
                            <div className="badge badge-error/80 text-error-content">
                              Banned
                            </div>
                          )}
                      </div>
                      <p className="text-xs opacity-70 break-all max-w-[280px]">
                        {u.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:items-center max-w-full">
                    <select
                      className="select select-bordered select-sm min-w-[160px]"
                      defaultValue={u.role}
                      onChange={(e) =>
                        updateRoleMutation.mutate({
                          userId: u._id,
                          newRole: e.target.value,
                        })
                      }
                      disabled={isSelf || isCardDisabled}
                    >
                      <option value="user">user</option>
                      <option value="moderator">moderator</option>
                      <option value="admin">admin</option>
                    </select>
                    <div
                      className={`relative ${
                        isSelf || isCardDisabled
                          ? "pointer-events-none opacity-50"
                          : ""
                      }`}
                    >
                      <button
                        className="btn btn-sm btn-outline gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId((prev) =>
                            prev === u._id ? null : u._id
                          );
                        }}
                      >
                        <FiMoreHorizontal /> Hành động
                      </button>
                      {openMenuId === u._id && (
                        <ul
                          className="absolute right-0 mt-2 p-2 shadow menu bg-base-100 rounded-box w-56 z-50"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <li>
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                banMutation.mutate({
                                  userId: u._id,
                                  days: 1,
                                  reason: "Vi phạm quy định",
                                });
                              }}
                            >
                              Ban 1 ngày
                            </button>
                          </li>
                          <li>
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                banMutation.mutate({
                                  userId: u._id,
                                  days: 7,
                                  reason: "Vi phạm quy định",
                                });
                              }}
                            >
                              Ban 7 ngày
                            </button>
                          </li>
                          <li>
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                banMutation.mutate({
                                  userId: u._id,
                                  days: 30,
                                  reason: "Vi phạm quy định",
                                });
                              }}
                            >
                              Ban 30 ngày
                            </button>
                          </li>
                          <li>
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                banMutation.mutate({
                                  userId: u._id,
                                  days: 36500,
                                  reason: "Ban vĩnh viễn",
                                });
                              }}
                            >
                              Ban vĩnh viễn
                            </button>
                          </li>
                          <li className="border-t my-1"></li>
                          <li>
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                restrictMutation.mutate({
                                  userId: u._id,
                                  payload: { canComment: false },
                                });
                              }}
                            >
                              Cấm bình luận
                            </button>
                          </li>
                          <li>
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                restrictMutation.mutate({
                                  userId: u._id,
                                  payload: { canPost: false },
                                });
                              }}
                            >
                              Cấm đăng bài
                            </button>
                          </li>
                          <li>
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                restrictMutation.mutate({
                                  userId: u._id,
                                  payload: { canComment: true, canPost: true },
                                });
                              }}
                            >
                              Gỡ hạn chế post/comment
                            </button>
                          </li>
                          {u.restrictions?.bannedUntil &&
                            new Date(u.restrictions.bannedUntil) >
                              new Date() && (
                              <li>
                                <button
                                  className="text-error"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    unbanMutation.mutate({ userId: u._id });
                                  }}
                                >
                                  Gỡ ban
                                </button>
                              </li>
                            )}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="mt-3 border-t border-base-300/70" />

                {/* Stats */}
                <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                  <div className="p-3 rounded-lg bg-base-200/60 border border-base-300">
                    <p className="text-xs opacity-70">Posts</p>
                    <p className="font-semibold">{u.stats?.postsCount || 0}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-base-200/60 border border-base-300">
                    <p className="text-xs opacity-70">Comments</p>
                    <p className="font-semibold">
                      {u.stats?.commentsCount || 0}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-base-200/60 border border-base-300">
                    <p className="text-xs opacity-70">Karma</p>
                    <p className="font-semibold">
                      {u.stats?.upvotesReceived || 0}
                    </p>
                  </div>
                </div>
                {u.restrictions?.bannedUntil && (
                  <div className="alert alert-warning mt-3 py-2 px-3 text-xs">
                    <span>
                      Banned đến:{" "}
                      {new Date(u.restrictions.bannedUntil).toLocaleString(
                        "vi-VN"
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Users;
