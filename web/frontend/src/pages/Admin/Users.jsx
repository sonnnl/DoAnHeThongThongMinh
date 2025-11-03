/**
 * FILE: web/frontend/src/pages/Admin/Users.jsx
 * MỤC ĐÍCH: Trang quản lý người dùng (tối thiểu: tìm kiếm, xem role)
 */

import { useState } from "react";
import { useQuery } from "react-query";
import { FiSearch } from "react-icons/fi";
import usersAPI from "../../services/api/users";

const Users = () => {
  const [q, setQ] = useState("");

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["admin", "users", q],
    queryFn: () => usersAPI.searchUsers(q, { limit: 20 }),
    enabled: false,
  });

  const users = data?.data?.users || [];

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Quản lý Người dùng</h1>

      <div className="flex gap-2 mb-4">
        <input
          className="input input-bordered w-full max-w-xl"
          placeholder="Tìm theo username/email"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn btn-primary gap-2" onClick={() => refetch()} disabled={isFetching}>
          <FiSearch /> Tìm kiếm
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isFetching && <div className="text-sm opacity-70">Đang tìm...</div>}
        {!isFetching && users.length === 0 && <div className="text-sm opacity-70">Không có kết quả</div>}
        {users.map((u) => (
          <div key={u._id} className="card bg-base-100 border border-base-300 shadow">
            <div className="card-body flex flex-row items-center gap-4">
              <div className="avatar">
                <div className="w-14 h-14 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                  <img src={u.avatar || "https://ui-avatars.com/api/?name=" + (u.username || "user")} alt={u.username} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold truncate">{u.username}</h3>
                  <div className="badge badge-outline capitalize">{u.role || "user"}</div>
                </div>
                <p className="text-xs opacity-70 truncate">{u.email}</p>
                <div className="mt-2 flex gap-3 text-xs">
                  <span>Posts: <b>{u.stats?.postsCount || 0}</b></span>
                  <span>Comments: <b>{u.stats?.commentsCount || 0}</b></span>
                  <span>Karma: <b>{u.stats?.upvotesReceived || 0}</b></span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Users;


