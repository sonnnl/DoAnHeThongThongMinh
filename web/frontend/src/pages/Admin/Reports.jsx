/**
 * FILE: web/frontend/src/pages/Admin/Reports.jsx
 * MỤC ĐÍCH: Quản lý Reports (list, lọc, accept/reject)
 */

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { FiFilter, FiCheck, FiX } from "react-icons/fi";
import { toast } from "react-hot-toast";
import reportsAPI from "../../services/api/reports";

const Reports = () => {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("pending");
  const [contentType, setContentType] = useState("");
  const [reason, setReason] = useState("");

  const params = useMemo(() => {
    const p = { status };
    if (contentType) p.contentType = contentType;
    if (reason) p.reason = reason;
    return p;
  }, [status, contentType, reason]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "reports", params],
    queryFn: () => reportsAPI.getReports(params),
    keepPreviousData: true,
  });

  const reviewMutation = useMutation({
    mutationFn: ({ reportId, action, reviewNote, moderationAction }) =>
      reportsAPI.reviewReport(reportId, action, reviewNote, moderationAction),
    onSuccess: () => {
      toast.success("Đã cập nhật report");
      queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "reportStats"] });
    },
    onError: (err) => toast.error(err?.message || "Lỗi cập nhật"),
  });
  const reports = data?.reports || [];
  const [selectedAction, setSelectedAction] = useState({});
  const moderationOptions = [
    { value: "", label: "— Chọn hành động —" },
    { value: "warning", label: "Cảnh cáo" },
    { value: "content_removed", label: "Gỡ nội dung" },
    { value: "user_banned_1day", label: "Ban 1 ngày" },
    { value: "user_banned_7days", label: "Ban 7 ngày" },
    { value: "user_banned_30days", label: "Ban 30 ngày" },
    { value: "user_banned_permanent", label: "Ban vĩnh viễn" },
  ];
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quản lý Reports</h1>
      </div>

      <div className="card bg-base-100 border border-base-300 shadow mb-4">
        <div className="card-body">
          <div className="flex items-end gap-3">
            <div className="form-control w-full max-w-xs">
              <label className="label">
                <span className="label-text">Trạng thái</span>
              </label>
              <select
                className="select select-bordered"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="pending">pending</option>
                <option value="accepted">accepted</option>
                <option value="rejected">rejected</option>
              </select>
            </div>
            <div className="form-control w-full max-w-xs">
              <label className="label">
                <span className="label-text">Đối tượng</span>
              </label>
              <select
                className="select select-bordered"
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
              >
                <option value="">Tất cả</option>
                <option value="Post">Post</option>
                <option value="Comment">Comment</option>
                <option value="User">User</option>
              </select>
            </div>
            <div className="form-control w-full max-w-xs">
              <label className="label">
                <span className="label-text">Lý do</span>
              </label>
              <input
                className="input input-bordered"
                placeholder="spam, hate_speech..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <button className="btn btn-outline gap-2">
              <FiFilter /> Lọc
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto bg-base-100 border border-base-300 rounded-xl shadow">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Target</th>
              <th>Reason</th>
              <th>Reporter</th>
              <th>Reported User</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="text-center">
                  Đang tải...
                </td>
              </tr>
            )}
            {!isLoading && reports.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center">
                  Không có report
                </td>
              </tr>
            )}
            {!isLoading &&
              reports.map((r) => (
                <tr key={r._id}>
                  <td className="whitespace-nowrap">{r._id.slice(-6)}</td>
                  <td>
                    <div className="badge badge-outline mr-2">
                      {r.targetType}
                    </div>
                    <span className="text-xs text-base-content/60">
                      {r.targetId}
                    </span>
                  </td>
                  <td className="whitespace-nowrap">
                    <div className="badge badge-warning badge-outline mr-2">
                      {r.reason}
                    </div>
                    <div className="text-xs text-base-content/60 max-w-xs truncate">
                      {r.description}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="avatar">
                        <div className="w-8 h-8 rounded-full">
                          <img
                            src={
                              r.reporter?.avatar ||
                              "https://ui-avatars.com/api/?name=" +
                                (r.reporter?.username || "user")
                            }
                          />
                        </div>
                      </div>
                      <span className="font-medium">
                        {r.reporter?.username}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="avatar">
                        <div className="w-8 h-8 rounded-full">
                          <img
                            src={
                              r.reportedUser?.avatar ||
                              "https://ui-avatars.com/api/?name=" +
                                (r.reportedUser?.username || "user")
                            }
                          />
                        </div>
                      </div>
                      <span>{r.reportedUser?.username}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap text-sm">
                    {new Date(r.createdAt).toLocaleString("vi-VN")}
                  </td>
                  <td className="whitespace-nowrap">
                    {r.status === "pending" ? (
                      <div className="flex items-center gap-2">
                        <select
                          className="select select-bordered select-xs"
                          value={selectedAction[r._id] || ""}
                          onChange={(e) =>
                            setSelectedAction((prev) => ({
                              ...prev,
                              [r._id]: e.target.value,
                            }))
                          }
                        >
                          {moderationOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <button
                          className="btn btn-xs btn-success gap-1"
                          onClick={() =>
                            reviewMutation.mutate({
                              reportId: r._id,
                              action: "accept",
                              moderationAction: selectedAction[r._id],
                            })
                          }
                          disabled={reviewMutation.isLoading}
                        >
                          <FiCheck /> Chấp nhận
                        </button>
                        <button
                          className="btn btn-xs btn-error btn-outline gap-1"
                          onClick={() =>
                            reviewMutation.mutate({
                              reportId: r._id,
                              action: "reject",
                            })
                          }
                          disabled={reviewMutation.isLoading}
                        >
                          <FiX /> Từ chối
                        </button>
                      </div>
                    ) : (
                      <div
                        className={`badge ${
                          r.status === "accepted"
                            ? "badge-success"
                            : "badge-outline"
                        }`}
                      >
                        {r.status}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reports;
