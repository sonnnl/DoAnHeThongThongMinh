/**
 * FILE: web/frontend/src/pages/Admin/Users.jsx
 * MỤC ĐÍCH: Trang quản lý người dùng (admin/moderator)
 * LIÊN QUAN:
 *  - web/frontend/src/services/api/users.js
 *  - web/backend/controllers/userController.js (adminBanUser/adminUnbanUser/adminSetRestrictions/adminUpdateRole)
 * LƯU Ý:
 *  - Menu "Hành động" dùng z-index + isolate để không bị chìm dưới card khác (do hover transform tạo stacking context)
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { FiMoreHorizontal, FiSearch } from "react-icons/fi";
import usersAPI from "../../services/api/users";
import { useAuthStore } from "../../store/authStore";
import toast from "react-hot-toast";

const MENU_ESTIMATED_HEIGHT = 360;
const MENU_SCREEN_PADDING = 16;

const formatDurationVi = (ms) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) return `${days} ngày ${hours} giờ`;
  if (hours > 0) return `${hours} giờ ${minutes} phút`;
  return `${minutes} phút`;
};

const Users = () => {
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [banned, setBanned] = useState("");
  const { user: currentUser } = useAuthStore();
  const [openMenuId, setOpenMenuId] = useState(null);
  const [openMenuPlacement, setOpenMenuPlacement] = useState("bottom"); // bottom | top
  const actionButtonRefs = useRef({});
  const [banModal, setBanModal] = useState({
    open: false,
    userId: null,
    username: "",
    days: 1,
    reason: "Vi phạm quy định",
  });

  useEffect(() => {
    const onWindowClick = () => setOpenMenuId(null);
    window.addEventListener("click", onWindowClick);
    return () => window.removeEventListener("click", onWindowClick);
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpenMenuId(null);
        setBanModal((prev) => ({ ...prev, open: false }));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!openMenuId) return;
    const el = actionButtonRefs.current?.[openMenuId];
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const wouldOverflowBottom =
      rect.bottom + MENU_ESTIMATED_HEIGHT + MENU_SCREEN_PADDING >
      window.innerHeight;
    setOpenMenuPlacement(wouldOverflowBottom ? "top" : "bottom");
  }, [openMenuId]);

  const now = useMemo(() => Date.now(), [openMenuId, q, role, banned]);

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

  const openBanModal = (u, daysPreset) => {
    setOpenMenuId(null);
    setBanModal({
      open: true,
      userId: u._id,
      username: u.username || "",
      days: daysPreset ?? 1,
      reason: daysPreset === 36500 ? "Ban vĩnh viễn" : "Vi phạm quy định",
    });
  };

  const closeBanModal = () => setBanModal((prev) => ({ ...prev, open: false }));

  const submitBanModal = () => {
    if (!banModal.userId) return;
    const daysNum = Number(banModal.days);
    if (!Number.isFinite(daysNum) || daysNum <= 0) {
      toast.error("Số ngày ban không hợp lệ");
      return;
    }
    banMutation.mutate({
      userId: banModal.userId,
      days: daysNum,
      reason: banModal.reason || "Vi phạm quy định",
    });
    closeBanModal();
  };

  const isBusy =
    updateRoleMutation.isLoading ||
    banMutation.isLoading ||
    unbanMutation.isLoading ||
    restrictMutation.isLoading;

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
          const bannedUntilMs = u.restrictions?.bannedUntil
            ? new Date(u.restrictions.bannedUntil).getTime()
            : 0;
          const isBanned = bannedUntilMs > now;
          const canComment = u.restrictions?.canComment !== false;
          const canPost = u.restrictions?.canPost === true;
          const isMenuOpen = openMenuId === u._id;
          const banReason = u.restrictions?.banReason || "";
          const banRemainingMs = isBanned ? bannedUntilMs - now : 0;
          return (
            <div
              key={u._id}
              className={`card relative overflow-visible isolate bg-base-100 border border-base-300 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-[2px] rounded-xl ${
                isCardDisabled ? "opacity-60" : ""
              } ${isMenuOpen ? "z-50" : "z-0"}`}
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
                        {isBanned && (
                          <div className="badge badge-error/80 text-error-content">
                            Banned
                          </div>
                        )}
                        {!canComment && (
                          <div className="badge badge-warning badge-outline">
                            Cấm bình luận
                          </div>
                        )}
                        {!canPost && (
                          <div className="badge badge-warning badge-outline">
                            Cấm đăng bài
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
                      className={`relative ${isMenuOpen ? "z-50" : "z-0"} ${
                        isSelf || isCardDisabled
                          ? "pointer-events-none opacity-50"
                          : ""
                      }`}
                    >
                      <button
                        className="btn btn-sm btn-outline gap-2"
                        ref={(el) => {
                          actionButtonRefs.current[u._id] = el;
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId((prev) =>
                            prev === u._id ? null : u._id
                          );
                        }}
                        disabled={isBusy}
                      >
                        <FiMoreHorizontal /> Hành động
                      </button>
                      {isMenuOpen && (
                        <ul
                          className={`absolute right-0 ${
                            openMenuPlacement === "top"
                              ? "bottom-full mb-2"
                              : "top-full mt-2"
                          } p-2 shadow menu bg-base-100 rounded-box w-60 z-[9999] border border-base-300`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {!isBanned ? (
                            <>
                              <li>
                                <button
                                  onClick={() => openBanModal(u, 1)}
                                  disabled={isBusy}
                                >
                                  Ban 1 ngày
                                </button>
                              </li>
                              <li>
                                <button
                                  onClick={() => openBanModal(u, 7)}
                                  disabled={isBusy}
                                >
                                  Ban 7 ngày
                                </button>
                              </li>
                              <li>
                                <button
                                  onClick={() => openBanModal(u, 30)}
                                  disabled={isBusy}
                                >
                                  Ban 30 ngày
                                </button>
                              </li>
                              <li>
                                <button
                                  onClick={() => openBanModal(u, 36500)}
                                  disabled={isBusy}
                                >
                                  Ban vĩnh viễn
                                </button>
                              </li>
                              <li className="border-t my-1"></li>
                            </>
                          ) : (
                            <>
                              <li>
                                <button
                                  className="text-error"
                                  onClick={() => {
                                    if (
                                      !window.confirm(
                                        `Gỡ ban user ${u.username || ""}?`
                                      )
                                    ) {
                                      return;
                                    }
                                    setOpenMenuId(null);
                                    unbanMutation.mutate({ userId: u._id });
                                  }}
                                  disabled={isBusy}
                                >
                                  Gỡ ban
                                </button>
                              </li>
                              <li className="border-t my-1"></li>
                            </>
                          )}
                          <li className="border-t my-1"></li>
                          <li>
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                restrictMutation.mutate({
                                  userId: u._id,
                                  payload: { canComment: !canComment },
                                });
                              }}
                              disabled={isBusy}
                            >
                              {canComment
                                ? "Cấm bình luận"
                                : "Cho phép bình luận"}
                            </button>
                          </li>
                          <li>
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                restrictMutation.mutate({
                                  userId: u._id,
                                  payload: { canPost: !canPost },
                                });
                              }}
                              disabled={isBusy}
                            >
                              {canPost ? "Cấm đăng bài" : "Cho phép đăng bài"}
                            </button>
                          </li>
                          {(!canComment || !canPost) && (
                            <li>
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  restrictMutation.mutate({
                                    userId: u._id,
                                    payload: {
                                      canComment: true,
                                      canPost: true,
                                    },
                                  });
                                }}
                                disabled={isBusy}
                              >
                                Gỡ hạn chế post/comment
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
                {isBanned && (
                  <div className="alert alert-warning mt-3 py-2 px-3 text-xs">
                    <div className="flex flex-col gap-1">
                      <span>
                        Banned đến:{" "}
                        {new Date(u.restrictions.bannedUntil).toLocaleString(
                          "vi-VN"
                        )}{" "}
                        (còn {formatDurationVi(banRemainingMs)})
                      </span>
                      {banReason && (
                        <span className="opacity-80">Lý do: {banReason}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Ban tuỳ chỉnh (days/reason) */}
      {banModal.open && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-base-100 border border-base-300 shadow-xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold">Ban người dùng</h3>
                <p className="text-xs opacity-70 break-all">
                  {banModal.username
                    ? `@${banModal.username}`
                    : banModal.userId}
                </p>
              </div>
              <button className="btn btn-sm btn-ghost" onClick={closeBanModal}>
                Đóng
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <label className="form-control">
                <span className="label-text text-sm">Số ngày</span>
                <input
                  className="input input-bordered w-full"
                  type="number"
                  min={1}
                  value={banModal.days}
                  onChange={(e) =>
                    setBanModal((prev) => ({
                      ...prev,
                      days: e.target.value,
                    }))
                  }
                />
              </label>
              <label className="form-control">
                <span className="label-text text-sm">Lý do</span>
                <input
                  className="input input-bordered w-full"
                  value={banModal.reason}
                  onChange={(e) =>
                    setBanModal((prev) => ({
                      ...prev,
                      reason: e.target.value,
                    }))
                  }
                />
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button className="btn btn-ghost" onClick={closeBanModal}>
                  Huỷ
                </button>
                <button
                  className="btn btn-error"
                  onClick={submitBanModal}
                  disabled={banMutation.isLoading}
                >
                  Xác nhận ban
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
