/**
 * FILE: web/frontend/src/pages/User/Settings.jsx
 * MỤC ĐÍCH: Trang cài đặt user
 */

import { useState } from "react";
import { useMutation } from "react-query";
import { usersAPI, uploadAPI } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import toast from "react-hot-toast";
import { FiUser, FiLock, FiSettings as FiSettingsIcon } from "react-icons/fi";

const Settings = () => {
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState("profile");

  // Profile form
  const [profileData, setProfileData] = useState({
    bio: user?.bio || "",
    location: user?.location || "",
    website: user?.website || "",
  });

  // Password form
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Preferences form
  const [preferencesData, setPreferencesData] = useState({
    emailNotifications: user?.preferences?.emailNotifications ?? true,
    pushNotifications: user?.preferences?.pushNotifications ?? true,
    notifyOnComment: user?.preferences?.notifyOnComment ?? true,
    notifyOnUpvote: user?.preferences?.notifyOnUpvote ?? true,
    showEmail: user?.preferences?.showEmail ?? false,
    showOnlineStatus: user?.preferences?.showOnlineStatus ?? true,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation(usersAPI.updateProfile, {
    onSuccess: (data) => {
      // data đã được unwrap 2 lần
      setUser(data);
      toast.success("Cập nhật profile thành công!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Cập nhật thất bại");
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation(usersAPI.changePassword, {
    onSuccess: () => {
      toast.success("Đổi mật khẩu thành công!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Đổi mật khẩu thất bại");
    },
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation(usersAPI.updatePreferences, {
    onSuccess: (data) => {
      // data đã được unwrap 2 lần
      setUser({ ...user, preferences: data });
      toast.success("Cập nhật cài đặt thành công!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Cập nhật thất bại");
    },
  });

  // Upload avatar mutation
  const uploadAvatarMutation = useMutation(uploadAPI.uploadAvatar, {
    onSuccess: (data) => {
      // data đã được unwrap 2 lần, trực tiếp là { url, publicId }
      setUser({ ...user, avatar: data.url });
      toast.success("Cập nhật avatar thành công!");
    },
    onError: (error) => {
      toast.error("Upload avatar thất bại");
    },
  });

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      uploadAvatarMutation.mutate(file);
    }
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileData);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

  const handlePreferencesSubmit = (e) => {
    e.preventDefault();
    updatePreferencesMutation.mutate(preferencesData);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Cài đặt</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tabs Sidebar */}
        <div className="lg:col-span-1">
          <ul className="menu bg-base-100 rounded-lg shadow-md">
            <li>
              <button
                className={`gap-3 ${activeTab === "profile" ? "active" : ""}`}
                onClick={() => setActiveTab("profile")}
              >
                <FiUser /> Profile
              </button>
            </li>
            <li>
              <button
                className={`gap-3 ${activeTab === "password" ? "active" : ""}`}
                onClick={() => setActiveTab("password")}
              >
                <FiLock /> Mật khẩu
              </button>
            </li>
            <li>
              <button
                className={`gap-3 ${
                  activeTab === "preferences" ? "active" : ""
                }`}
                onClick={() => setActiveTab("preferences")}
              >
                <FiSettingsIcon /> Tùy chọn
              </button>
            </li>
          </ul>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              {/* Profile Tab */}
              {activeTab === "profile" && (
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <h2 className="text-2xl font-bold">Thông tin cá nhân</h2>

                  {/* Avatar */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Avatar</span>
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="avatar">
                        <div className="w-24 h-24 rounded-full">
                          {user?.avatar ? (
                            <img src={user.avatar} alt={user.username} />
                          ) : (
                            <div className="bg-primary text-primary-content w-full h-full flex items-center justify-center text-3xl">
                              <FiUser />
                            </div>
                          )}
                        </div>
                      </div>
                      <label
                        className={`btn btn-primary ${
                          uploadAvatarMutation.isLoading ? "loading" : ""
                        }`}
                      >
                        Đổi avatar
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                          disabled={uploadAvatarMutation.isLoading}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Bio</span>
                    </label>
                    <textarea
                      className="textarea textarea-bordered"
                      placeholder="Giới thiệu về bạn..."
                      value={profileData.bio}
                      onChange={(e) =>
                        setProfileData({ ...profileData, bio: e.target.value })
                      }
                      maxLength={500}
                    ></textarea>
                  </div>

                  {/* Location */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Vị trí</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered"
                      placeholder="Thành phố, Quốc gia"
                      value={profileData.location}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          location: e.target.value,
                        })
                      }
                    />
                  </div>

                  {/* Website */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Website</span>
                    </label>
                    <input
                      type="url"
                      className="input input-bordered"
                      placeholder="https://example.com"
                      value={profileData.website}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          website: e.target.value,
                        })
                      }
                    />
                  </div>

                  <button
                    type="submit"
                    className={`btn btn-primary ${
                      updateProfileMutation.isLoading ? "loading" : ""
                    }`}
                    disabled={updateProfileMutation.isLoading}
                  >
                    Lưu thay đổi
                  </button>
                </form>
              )}

              {/* Password Tab */}
              {activeTab === "password" && (
                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  <h2 className="text-2xl font-bold">Đổi mật khẩu</h2>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">
                        Mật khẩu hiện tại
                      </span>
                    </label>
                    <input
                      type="password"
                      className="input input-bordered"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          currentPassword: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">
                        Mật khẩu mới
                      </span>
                    </label>
                    <input
                      type="password"
                      className="input input-bordered"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          newPassword: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">
                        Xác nhận mật khẩu mới
                      </span>
                    </label>
                    <input
                      type="password"
                      className="input input-bordered"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          confirmPassword: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className={`btn btn-primary ${
                      changePasswordMutation.isLoading ? "loading" : ""
                    }`}
                    disabled={changePasswordMutation.isLoading}
                  >
                    Đổi mật khẩu
                  </button>
                </form>
              )}

              {/* Preferences Tab */}
              {activeTab === "preferences" && (
                <form onSubmit={handlePreferencesSubmit} className="space-y-6">
                  <h2 className="text-2xl font-bold">Tùy chọn</h2>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Thông báo</h3>

                    <div className="form-control">
                      <label className="label cursor-pointer justify-start gap-4">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-primary"
                          checked={preferencesData.emailNotifications}
                          onChange={(e) =>
                            setPreferencesData({
                              ...preferencesData,
                              emailNotifications: e.target.checked,
                            })
                          }
                        />
                        <span className="label-text">Email notifications</span>
                      </label>
                    </div>

                    <div className="form-control">
                      <label className="label cursor-pointer justify-start gap-4">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-primary"
                          checked={preferencesData.notifyOnComment}
                          onChange={(e) =>
                            setPreferencesData({
                              ...preferencesData,
                              notifyOnComment: e.target.checked,
                            })
                          }
                        />
                        <span className="label-text">
                          Thông báo khi có comment
                        </span>
                      </label>
                    </div>

                    <div className="form-control">
                      <label className="label cursor-pointer justify-start gap-4">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-primary"
                          checked={preferencesData.notifyOnUpvote}
                          onChange={(e) =>
                            setPreferencesData({
                              ...preferencesData,
                              notifyOnUpvote: e.target.checked,
                            })
                          }
                        />
                        <span className="label-text">
                          Thông báo khi có upvote
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="divider"></div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Quyền riêng tư</h3>

                    <div className="form-control">
                      <label className="label cursor-pointer justify-start gap-4">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-primary"
                          checked={preferencesData.showEmail}
                          onChange={(e) =>
                            setPreferencesData({
                              ...preferencesData,
                              showEmail: e.target.checked,
                            })
                          }
                        />
                        <span className="label-text">Hiển thị email</span>
                      </label>
                    </div>

                    <div className="form-control">
                      <label className="label cursor-pointer justify-start gap-4">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-primary"
                          checked={preferencesData.showOnlineStatus}
                          onChange={(e) =>
                            setPreferencesData({
                              ...preferencesData,
                              showOnlineStatus: e.target.checked,
                            })
                          }
                        />
                        <span className="label-text">
                          Hiển thị trạng thái online
                        </span>
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className={`btn btn-primary ${
                      updatePreferencesMutation.isLoading ? "loading" : ""
                    }`}
                    disabled={updatePreferencesMutation.isLoading}
                  >
                    Lưu thay đổi
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
