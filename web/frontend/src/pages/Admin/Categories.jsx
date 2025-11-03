/**
 * FILE: web/frontend/src/pages/Admin/Categories.jsx
 * MỤC ĐÍCH: Trang quản lý Categories (list, tạo, sửa, xóa)
 */

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import categoriesAPI from "../../services/api/categories";
import { FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import toast from "react-hot-toast";

const AdminCategories = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", color: "#2563eb", icon: "" });

  const [statusFilter, setStatusFilter] = useState("all");
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "categories", { statusFilter }],
    queryFn: () => categoriesAPI.adminGetCategories({ sort: "popular", status: statusFilter }),
  });

  const categories = data?.data || data || [];

  const createMutation = useMutation((payload) => categoriesAPI.createCategory(payload), {
    onSuccess: () => {
      toast.success("Tạo category thành công");
      setShowModal(false);
      setForm({ name: "", description: "", color: "#2563eb", icon: "" });
      queryClient.invalidateQueries(["admin", "categories"]);
    },
    onError: (e) => toast.error(e?.response?.data?.message || "Lỗi tạo category"),
  });

  const updateMutation = useMutation(({ id, payload }) => categoriesAPI.updateCategory(id, payload), {
    onSuccess: () => {
      toast.success("Cập nhật category thành công");
      setShowModal(false);
      setEditing(null);
      queryClient.invalidateQueries(["admin", "categories"]);
    },
    onError: (e) => toast.error(e?.response?.data?.message || "Lỗi cập nhật"),
  });

  const deleteMutation = useMutation((id) => categoriesAPI.deleteCategory(id), {
    onSuccess: () => {
      toast.success("Xóa category thành công");
      queryClient.invalidateQueries(["admin", "categories"]);
    },
    onError: (e) => toast.error(e?.response?.data?.message || "Không thể xóa"),
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "", color: "#2563eb", icon: "" });
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({ name: c.name || "", description: c.description || "", color: c.color || "#2563eb", icon: c.icon || "" });
    setShowModal(true);
  };

  const submit = () => {
    if (!form.name.trim()) return toast.error("Tên không được để trống");
    if (editing) updateMutation.mutate({ id: editing._id, payload: form });
    else createMutation.mutate(form);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quản lý Categories</h1>
        <div className="flex gap-2">
          <select className="select select-bordered select-sm" value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)}>
            <option value="all">Tất cả</option>
            <option value="active">Đang active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button className="btn btn-primary btn-sm gap-2" onClick={openCreate}>
          <FiPlus /> Tạo category
          </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-base-100 border border-base-300 rounded-xl">
        <table className="table table-fixed">
          <thead>
            <tr>
              <th className="w-1/4">Tên</th>
              <th className="w-2/5">Mô tả</th>
              <th className="w-20 text-center">Bài viết</th>
              <th className="w-24 text-center">Followers</th>
              <th className="w-16 text-center">TT</th>
              <th className="w-64 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center">Đang tải...</td></tr>
            ) : (categories || []).map((c) => (
              <tr key={c._id}>
                <td className="font-semibold">
                  <span className="inline-flex items-center gap-2 truncate"><span className="w-3 h-3 rounded" style={{ backgroundColor: c.color || "#ccc" }}></span><span className="truncate">{c.name}</span></span>
                </td>
                <td className="truncate">{c.description || ""}</td>
                <td className="text-center">{c.stats?.postsCount || 0}</td>
                <td className="text-center">{c.stats?.followersCount || 0}</td>
                <td className="text-center">
                  <span className={`inline-block w-2.5 h-2.5 rounded-full ${c.settings?.isActive ? "bg-green-500" : "bg-base-300"}`}></span>
                </td>
                <td className="text-right">
                  <div className="inline-flex gap-2">
                    <button className={`btn btn-xs ${c.settings?.isActive ? "btn-outline" : "btn-success"}`} onClick={()=> updateMutation.mutate({ id: c._id, payload: { isActive: !c.settings?.isActive } })}>
                      {c.settings?.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button className="btn btn-xs gap-1" onClick={()=>openEdit(c)}><FiEdit2 /> Sửa</button>
                    <button className="btn btn-xs btn-error btn-outline gap-1" onClick={()=>deleteMutation.mutate(c._id)} disabled={(c.stats?.postsCount||0)>0} title={(c.stats?.postsCount||0)>0?"Không thể xóa category có bài viết":""}>
                      <FiTrash2 /> Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <dialog className={`modal ${showModal ? "modal-open" : ""}`} onClick={(e)=>{ if(e.target===e.currentTarget) setShowModal(false); }}>
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">{editing ? "Sửa category" : "Tạo category"}</h3>
          <div className="form-control gap-3">
            <input className="input input-bordered" placeholder="Tên" value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} />
            <textarea className="textarea textarea-bordered" placeholder="Mô tả" rows={3} value={form.description} onChange={(e)=>setForm({...form, description: e.target.value})} />
            <div className="flex gap-3 items-center">
              <label className="label">Màu:</label>
              <input type="color" className="input input-bordered w-16 h-10 p-0" value={form.color} onChange={(e)=>setForm({...form, color: e.target.value})} />
              <input className="input input-bordered flex-1" placeholder="Icon (tùy chọn)" value={form.icon} onChange={(e)=>setForm({...form, icon: e.target.value})} />
            </div>
          </div>
          <div className="modal-action">
            <button className="btn btn-ghost" onClick={()=>setShowModal(false)}>Hủy</button>
            <button className={`btn btn-primary ${createMutation.isLoading||updateMutation.isLoading?"loading":""}`} onClick={submit} disabled={createMutation.isLoading||updateMutation.isLoading}>
              Lưu
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop"><button onClick={()=>setShowModal(false)}>close</button></form>
      </dialog>
    </div>
  );
};

export default AdminCategories;


