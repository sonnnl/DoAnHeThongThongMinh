/**
 * FILE: web/frontend/src/pages/Messages/Messages.jsx
 * MỤC ĐÍCH: Trang tin nhắn
 */

import { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
import {
  useParams,
  Link,
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { messagesAPI, uploadAPI } from "../../services/api";
import socket, { connectSocket } from "../../socket";
import { useAuthStore } from "../../store/authStore";
import toast from "react-hot-toast";
import Loading from "../../components/UI/Loading";
import {
  FiSend,
  FiUser,
  FiPaperclip,
  FiX,
  FiMessageCircle,
} from "react-icons/fi";
import { timeAgo } from "../../utils/helpers";

const Messages = () => {
  const [searchParams] = useSearchParams();
  const conversationIdFromQuery = searchParams.get("conversation");
  const { userId } = useParams(); // Deprecated: giữ lại để backward compatibility
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  const [selectedConversationId, setSelectedConversationId] = useState(
    conversationIdFromQuery || null
  );
  const [mediaUrl, setMediaUrl] = useState(null);
  const [mediaType, setMediaType] = useState(null); // 'image' hoặc 'video'
  const [mediaData, setMediaData] = useState(null); // ✅ Metadata đầy đủ từ upload API
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null); // ✅ Ref cho messages container để scroll

  // Fetch conversations
  const { data: conversationsData, isLoading: conversationsLoading } = useQuery(
    "conversations",
    () => messagesAPI.getConversations()
  );

  // Set selected conversation from query param
  useEffect(() => {
    if (conversationIdFromQuery) {
      setSelectedConversationId(conversationIdFromQuery);
    } else if (userId) {
      // Backward compatibility: nếu có userId thì tìm conversation
      messagesAPI
        .getOrCreateConversation(userId)
        .then((conv) => {
          setSelectedConversationId(conv.data._id);
          navigate(`/messages?conversation=${conv.data._id}`, {
            replace: true,
          });
        })
        .catch((err) => {
          toast.error(err.response?.data?.message || "Lỗi tải conversation");
        });
    }
  }, [conversationIdFromQuery, userId, navigate]);

  // ✅ Socket.IO - Realtime
  useEffect(() => {
    const s = connectSocket();
    if (selectedConversationId) {
      // Join room for this conversation
      s.emit("conversation:join", selectedConversationId);

      // Listen new messages
      const onNewMessage = (payload) => {
        if (payload?.conversationId === selectedConversationId) {
          // cập nhật cache messages
          queryClient.setQueryData(
            ["messages", selectedConversationId],
            (old) => {
              if (!old) return old;
              const prev = old.messages || old.data?.messages || [];
              return {
                ...(old.data ? old.data : old),
                messages: [...prev, payload.message],
              };
            }
          );

          // Scroll xuống cuối
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 50);
        } else {
          // Invalidate conversations để cập nhật lastMessage/unread ở sidebar
          queryClient.invalidateQueries("conversations");
        }
      };
      s.on("message:new", onNewMessage);

      return () => {
        s.off("message:new", onNewMessage);
        s.emit("conversation:leave", selectedConversationId);
      };
    }
  }, [selectedConversationId, queryClient]);

  // ✅ OPTIMIZED: Fetch messages - không cần polling vì đã có WebSocket
  const { data: messagesData, isLoading: messagesLoading } = useQuery(
    ["messages", selectedConversationId],
    () => {
      if (!selectedConversationId) return null;
      return messagesAPI.getMessages(selectedConversationId);
    },
    {
      enabled: !!selectedConversationId,
      // ✅ Không cần polling vì đã có WebSocket real-time
      refetchOnWindowFocus: true, // Chỉ refetch khi focus lại tab
    }
  );

  // Send message mutation
  const sendMessageMutation = useMutation(
    (messageData) => messagesAPI.sendMessage(messageData),
    {
      onSuccess: () => {
        setNewMessage("");
        setMediaUrl(null); // ✅ FIX: Reset media sau khi gửi thành công
        setMediaType(null);
        setMediaData(null);
        queryClient.invalidateQueries(["messages", selectedConversationId]);
        queryClient.invalidateQueries("conversations");

        // ✅ FIX: Scroll to bottom ngay sau khi gửi thành công
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({
              behavior: "smooth",
              block: "end",
            });
          }
        }, 200);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || "Gửi tin nhắn thất bại");
      },
    }
  );

  // ✅ OPTIMIZED: useCallback để tránh re-render không cần thiết
  const handleSendMessage = useCallback(
    (e) => {
      e.preventDefault();
      // ✅ YÊU CẦU: Luôn cần content không rỗng, dù có đính kèm file
      if (!newMessage.trim() || !selectedConversationId) {
        return;
      }

      sendMessageMutation.mutate({
        conversationId: selectedConversationId,
        content: newMessage.trim(),
        mediaUrl: mediaUrl || null,
        mediaData: mediaData || null, // ✅ Gửi metadata đầy đủ lên backend
      });
    },
    [
      newMessage,
      selectedConversationId,
      mediaUrl,
      mediaData,
      sendMessageMutation,
    ]
  );

  // ✅ OPTIMIZED: useCallback để tránh re-render
  const handleFileUpload = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // ✅ Validate file size (25MB)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (file.size > maxSize) {
      toast.error("File không được vượt quá 25MB");
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadAPI.uploadFile(file, "messages");

      // ✅ FIX: API trả về { success, message, data: { url, ... } }
      // Axios interceptor đã unwrap response.data một lần
      // Vậy result = { success, message, data: { url, ... } }
      // Cần lấy result.data.url
      const uploadedUrl = result?.data?.url || result?.url;

      if (!uploadedUrl) {
        console.error("Upload result structure:", result);
        throw new Error("URL không hợp lệ từ server");
      }

      // ✅ FIX: Lưu cả URL, type và metadata đầy đủ
      setMediaUrl(uploadedUrl);
      setMediaType(file.type.startsWith("image/") ? "image" : "video");

      // ✅ Lưu metadata đầy đủ từ upload API (để gửi lên backend)
      setMediaData({
        url: uploadedUrl,
        publicId: result?.data?.publicId || result?.publicId,
        format: result?.data?.format || result?.format,
        resourceType:
          result?.data?.resourceType ||
          result?.resourceType ||
          (file.type.startsWith("image/") ? "image" : "video"),
        size:
          result?.data?.size ||
          result?.data?.bytes ||
          result?.size ||
          file.size,
        filename: file.name,
        mimeType: file.type,
      });

      toast.success("Upload file thành công!");
    } catch (error) {
      toast.error("Upload file thất bại");
      console.error("Upload error:", error);
      console.error("Upload result:", error.response?.data);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, []);

  // ✅ OPTIMIZED: useCallback
  const handleRemoveMedia = useCallback(() => {
    setMediaUrl(null);
    setMediaType(null);
    setMediaData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  // ✅ FIX: Axios interceptor đã unwrap response.data một lần
  // Backend trả về: { success, data: { conversations: [...] } }
  // Axios interceptor trả về: { success, data: { conversations: [...] } }
  // messagesAPI.getConversations() unwrap thêm: return response.data → { conversations: [...] }
  // Vậy conversationsData = { conversations: [...] }
  const conversations =
    conversationsData?.conversations ||
    conversationsData?.data?.conversations ||
    [];

  // Tương tự cho messages
  // Backend trả về: { success, data: { messages: [...], pagination: {...} } }
  // Axios interceptor trả về: { success, data: { messages: [...], pagination: {...} } }
  // messagesAPI.getMessages() unwrap thêm: return response.data → { messages: [...], pagination: {...} }
  // Vậy messagesData = { messages: [...], pagination: {...} }
  const messages = messagesData?.messages || messagesData?.data?.messages || [];

  // ✅ FIX: Scroll xuống bottom khi mở conversation mới hoặc load messages lần đầu
  useEffect(() => {
    if (
      selectedConversationId &&
      !messagesLoading &&
      messagesContainerRef.current &&
      messagesEndRef.current &&
      messages &&
      messages.length > 0
    ) {
      // Scroll xuống bottom ngay khi load xong messages
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({
            behavior: "auto", // Dùng "auto" để scroll nhanh khi mới mở
            block: "end",
          });
        }
      }, 100);
    }
  }, [selectedConversationId, messagesLoading]); // Chỉ chạy khi conversation thay đổi hoặc loading xong

  // ✅ FIX: Auto scroll to bottom khi có messages mới (chỉ khi user đang ở gần bottom)
  useEffect(() => {
    if (
      messagesContainerRef.current &&
      messagesEndRef.current &&
      messages &&
      messages.length > 0
    ) {
      const container = messagesContainerRef.current;
      // Kiểm tra xem user có đang ở gần bottom không (trong 150px)
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        150;

      // Chỉ auto scroll nếu user đang ở gần bottom (để không làm phiền nếu đang xem tin nhắn cũ)
      // Nhưng skip lần đầu (đã có useEffect trên xử lý)
      if (isNearBottom && container.scrollTop > 0) {
        // Thời gian chờ để DOM render xong
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({
              behavior: "smooth",
              block: "end",
            });
          }
        }, 100);
      }
    }
  }, [messages, selectedConversationId]); // Thêm selectedConversationId để reset khi đổi conversation

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-shrink-0 px-4 pt-4 pb-2">
        <h1 className="text-3xl font-bold">Tin nhắn</h1>
      </div>

      {/* ✅ FIX: Grid với height cố định - mỗi phần scroll riêng */}
      <div
        className="grid grid-cols-12 gap-6 flex-1 min-h-0 px-4 pb-4"
        style={{
          height: "calc(100vh - 120px)",
          maxHeight: "calc(100vh - 120px)",
          overflow: "hidden",
        }}
      >
        {/* Conversations list - ✅ FIX: Scroll riêng, không scroll cùng page */}
        <div
          className="col-span-12 md:col-span-4 card bg-base-100 shadow-md overflow-hidden flex flex-col"
          style={{ height: "100%", maxHeight: "100%", overflow: "hidden" }}
        >
          <div
            className="card-body p-0 flex flex-col flex-1 min-h-0"
            style={{ overflow: "hidden" }}
          >
            <h2 className="text-xl font-bold p-4 border-b border-base-300 flex-shrink-0 bg-base-200/50">
              Cuộc trò chuyện
            </h2>
            {/* ✅ FIX: Scroll chỉ trong conversations list - tách riêng */}
            <div
              className="overflow-y-auto flex-1 min-h-0"
              style={{ overflowY: "auto", overscrollBehavior: "contain" }}
            >
              {conversationsLoading ? (
                <Loading />
              ) : conversations.length === 0 ? (
                <div className="text-center py-8 text-base-content/60 text-sm">
                  Chưa có cuộc trò chuyện nào
                </div>
              ) : (
                <ul className="menu p-2">
                  {conversations.map((conversation) => {
                    // ✅ FIX: Lấy other user từ participants.user (sau khi populate)
                    const otherParticipant =
                      conversation.type === "direct"
                        ? conversation.otherParticipant ||
                          conversation.participants?.find(
                            (p) =>
                              (p.user?._id || p.user)?.toString() !== user?._id
                          )?.user
                        : null;

                    // Hiển thị tên conversation
                    const displayName =
                      conversation.type === "group"
                        ? conversation.name || "Nhóm chat"
                        : otherParticipant?.username || "User";

                    const displayAvatar =
                      conversation.type === "group"
                        ? conversation.avatar
                        : otherParticipant?.avatar;

                    const isSelected =
                      selectedConversationId === conversation._id;

                    return (
                      <li key={conversation._id}>
                        <button
                          onClick={() => {
                            setSelectedConversationId(conversation._id);
                            navigate(
                              `/messages?conversation=${conversation._id}`
                            );
                          }}
                          className={`w-full flex items-center gap-3 text-left ${
                            isSelected ? "active" : ""
                          }`}
                        >
                          {displayAvatar ? (
                            <img
                              src={displayAvatar}
                              alt={displayName}
                              className="w-12 h-12 rounded-full"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-primary text-primary-content flex items-center justify-center">
                              <FiUser />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold truncate">
                              {displayName}
                              {conversation.type === "group" && (
                                <span className="text-xs text-base-content/60 ml-1">
                                  ({conversation.participants?.length || 0})
                                </span>
                              )}
                            </div>
                            {conversation.lastMessage && (
                              <div
                                className={`text-xs truncate ${
                                  isSelected
                                    ? "text-base-300"
                                    : "text-base-content/60"
                                }`}
                              >
                                {conversation.lastMessage.sender?.username ||
                                  "User"}
                                : {conversation.lastMessage.content}
                              </div>
                            )}
                          </div>
                          {conversation.unreadCount > 0 && (
                            <span className="badge badge-primary badge-sm">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Messages area - ✅ FIX: flex flex-col với màu sắc đẹp hơn */}
        <div
          className="col-span-12 md:col-span-8 card shadow-lg flex flex-col overflow-hidden"
          style={{
            height: "100%",
            maxHeight: "100%",
            background: "linear-gradient(to bottom, #f8f9fa 0%, #ffffff 100%)",
          }}
        >
          {!selectedConversationId ? (
            <div className="flex items-center justify-center h-full text-base-content/60">
              <div className="text-center">
                <FiMessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-semibold">
                  Chọn một cuộc trò chuyện
                </p>
                <p className="text-sm text-base-content/60 mt-2">
                  để bắt đầu nhắn tin
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* ✅ OPTIMIZED: Header với thông tin conversation */}
              {(() => {
                const currentConversation = conversations.find(
                  (c) => c._id === selectedConversationId
                );
                const otherParticipant =
                  currentConversation?.type === "direct"
                    ? currentConversation.otherParticipant ||
                      currentConversation.participants?.find(
                        (p) => (p.user?._id || p.user)?.toString() !== user?._id
                      )?.user
                    : null;
                const displayName =
                  currentConversation?.type === "group"
                    ? currentConversation.name || "Nhóm chat"
                    : otherParticipant?.username || "User";
                const displayAvatar =
                  currentConversation?.type === "group"
                    ? currentConversation.avatar
                    : otherParticipant?.avatar;

                return (
                  <div className="border-b border-base-300 p-4 bg-gradient-to-r from-primary/10 to-secondary/10 flex-shrink-0 shadow-sm">
                    <div className="flex items-center gap-3">
                      {displayAvatar ? (
                        <div className="ring-2 ring-primary/20 rounded-full p-0.5">
                          <img
                            src={displayAvatar}
                            alt={displayName}
                            className="w-10 h-10 rounded-full"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary text-primary-content flex items-center justify-center ring-2 ring-primary/20">
                          <FiUser />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-base-content">
                          {displayName}
                        </h3>
                        {currentConversation?.type === "group" && (
                          <p className="text-xs text-base-content/60">
                            {currentConversation.participants?.length || 0}{" "}
                            thành viên
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ✅ FIX: Messages list - Scroll riêng, không scroll cả trang + thêm màu sắc */}
              <div
                ref={messagesContainerRef}
                className="flex-1 min-h-0 overflow-y-auto px-4 py-4 bg-gradient-to-b from-base-100/50 to-base-100"
                style={{
                  overflowY: "auto",
                  WebkitOverflowScrolling: "touch",
                  overscrollBehavior: "contain",
                  backgroundImage:
                    "radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.03) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255, 119, 198, 0.03) 0%, transparent 50%)",
                }}
              >
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loading />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-8 text-base-content/60">
                    <FiMessageCircle className="w-12 h-12 mb-3 opacity-30" />
                    <p className="font-semibold">Chưa có tin nhắn nào</p>
                    <p className="text-sm mt-1">Hãy gửi tin nhắn đầu tiên!</p>
                  </div>
                ) : (
                  <div className="space-y-3 pb-2">
                    {messages.map((message) => {
                      // ✅ FIX: Check sender đúng cách
                      const senderId = message.sender?._id || message.sender;
                      const isOwn = senderId?.toString() === user?._id;
                      const senderName = message.sender?.username || "User";
                      const senderAvatar = message.sender?.avatar;

                      // Bỏ qua system messages
                      if (message.type === "system") {
                        return (
                          <div
                            key={message._id}
                            className="text-center text-xs text-base-content/60 py-2"
                          >
                            {message.content}
                          </div>
                        );
                      }

                      return (
                        <div
                          key={message._id}
                          className={`chat ${
                            isOwn ? "chat-end" : "chat-start"
                          }`}
                        >
                          <div className="chat-image avatar">
                            <div className="w-10 rounded-full">
                              {senderAvatar ? (
                                <img src={senderAvatar} alt={senderName} />
                              ) : (
                                <div className="bg-primary text-primary-content w-full h-full flex items-center justify-center">
                                  <FiUser />
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="chat-header">
                            {senderName}
                            <time className="text-xs opacity-50 ml-2">
                              {timeAgo(message.createdAt)}
                            </time>
                          </div>
                          <div
                            className={`chat-bubble ${
                              isOwn
                                ? "chat-bubble-primary shadow-md"
                                : "chat-bubble-secondary shadow-md"
                            }`}
                            style={
                              isOwn
                                ? {
                                    background:
                                      "linear-gradient(135deg, hsl(var(--p)) 0%, hsl(var(--pf)) 100%)",
                                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                                  }
                                : {
                                    background:
                                      "linear-gradient(135deg, hsl(var(--s)) 0%, hsl(var(--sf)) 100%)",
                                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                                  }
                            }
                          >
                            {message.content && (
                              <p className="whitespace-pre-wrap">
                                {message.content}
                              </p>
                            )}
                            {/* ✅ FIX: Hiển thị media từ attachments */}
                            {message.attachments &&
                              message.attachments.length > 0 && (
                                <div className="mt-2 space-y-2">
                                  {message.attachments.map(
                                    (attachment, idx) => {
                                      const mediaUrl = attachment.url;
                                      const isVideo =
                                        attachment.type === "file" ||
                                        /\.(mp4|webm|ogg|mov)(\?|$)/i.test(
                                          mediaUrl
                                        ) ||
                                        mediaUrl.includes("/video/") ||
                                        mediaUrl.includes(
                                          "resource_type=video"
                                        );
                                      const isImage =
                                        attachment.type === "image" ||
                                        /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(
                                          mediaUrl
                                        ) ||
                                        (!isVideo &&
                                          mediaUrl.includes("/image/"));

                                      if (isImage) {
                                        return (
                                          <div key={idx} className="relative">
                                            <img
                                              src={mediaUrl}
                                              alt={
                                                attachment.filename ||
                                                "Ảnh đính kèm"
                                              }
                                              className="max-w-xs max-h-64 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                              onClick={() =>
                                                window.open(mediaUrl, "_blank")
                                              }
                                              onError={(e) => {
                                                console.error(
                                                  "Error loading message image:",
                                                  mediaUrl
                                                );
                                                e.target.style.display = "none";
                                              }}
                                            />
                                          </div>
                                        );
                                      } else if (isVideo) {
                                        return (
                                          <div key={idx} className="relative">
                                            <video
                                              src={mediaUrl}
                                              className="max-w-xs max-h-64 rounded-lg object-cover border border-base-300"
                                              controls
                                              onError={(e) => {
                                                console.error(
                                                  "Error loading message video:",
                                                  mediaUrl
                                                );
                                                toast.error(
                                                  "Không thể tải video"
                                                );
                                              }}
                                            />
                                          </div>
                                        );
                                      } else {
                                        // Fallback cho file khác
                                        return (
                                          <div
                                            key={idx}
                                            className="border border-base-300 rounded-lg p-3 bg-base-200"
                                          >
                                            <a
                                              href={mediaUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-primary hover:underline"
                                            >
                                              {attachment.filename ||
                                                "Tải file đính kèm"}
                                              {attachment.size && (
                                                <span className="text-xs text-base-content/60 ml-2">
                                                  (
                                                  {(
                                                    attachment.size / 1024
                                                  ).toFixed(1)}{" "}
                                                  KB)
                                                </span>
                                              )}
                                            </a>
                                          </div>
                                        );
                                      }
                                    }
                                  )}
                                </div>
                              )}
                            {/* ✅ Backward compatible: Kiểm tra mediaUrl cũ nếu attachments chưa có */}
                            {(!message.attachments ||
                              message.attachments.length === 0) &&
                              message.mediaUrl && (
                                <div className="mt-2">
                                  {(() => {
                                    const mediaUrl = message.mediaUrl;
                                    const isVideo =
                                      /\.(mp4|webm|ogg|mov)(\?|$)/i.test(
                                        mediaUrl
                                      ) ||
                                      mediaUrl.includes("/video/") ||
                                      mediaUrl.includes("resource_type=video");

                                    if (isVideo) {
                                      return (
                                        <video
                                          src={mediaUrl}
                                          className="max-w-xs max-h-64 rounded-lg object-cover border border-base-300"
                                          controls
                                        />
                                      );
                                    } else {
                                      return (
                                        <img
                                          src={mediaUrl}
                                          alt="Ảnh đính kèm"
                                          className="max-w-xs max-h-64 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                          onClick={() =>
                                            window.open(mediaUrl, "_blank")
                                          }
                                        />
                                      );
                                    }
                                  })()}
                                </div>
                              )}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* ✅ OPTIMIZED: Input form sticky ở bottom với màu sắc */}
              <div className="border-t border-base-300 p-4 bg-gradient-to-r from-base-100 to-base-200/50 flex-shrink-0 shadow-lg">
                {/* Media preview - ✅ FIX: Tối ưu preview với error handling */}
                {mediaUrl && (
                  <div className="mb-3 relative inline-block max-w-xs">
                    {mediaType === "image" ? (
                      <div className="relative">
                        <img
                          src={mediaUrl}
                          alt="Preview"
                          className="max-w-xs max-h-48 rounded-lg object-cover border border-base-300"
                          onError={(e) => {
                            console.error(
                              "Error loading preview image:",
                              mediaUrl
                            );
                            e.target.style.display = "none";
                            toast.error("Không thể hiển thị preview ảnh");
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleRemoveMedia}
                          className="btn btn-circle btn-sm btn-error absolute top-2 right-2 shadow-lg"
                          title="Xóa file đính kèm"
                        >
                          <FiX />
                        </button>
                      </div>
                    ) : mediaType === "video" ? (
                      <div className="relative">
                        <video
                          src={mediaUrl}
                          className="max-w-xs max-h-48 rounded-lg object-cover border border-base-300"
                          controls
                          onError={(e) => {
                            console.error(
                              "Error loading preview video:",
                              mediaUrl
                            );
                            toast.error("Không thể hiển thị preview video");
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleRemoveMedia}
                          className="btn btn-circle btn-sm btn-error absolute top-2 right-2 shadow-lg"
                          title="Xóa file đính kèm"
                        >
                          <FiX />
                        </button>
                      </div>
                    ) : (
                      <div className="border border-base-300 rounded-lg p-4 bg-base-200 relative">
                        <p className="text-sm text-base-content/60">
                          File đã đính kèm
                        </p>
                        <button
                          type="button"
                          onClick={handleRemoveMedia}
                          className="btn btn-circle btn-sm btn-error absolute top-2 right-2"
                          title="Xóa file đính kèm"
                        >
                          <FiX />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ✅ OPTIMIZED: Input form với styling đẹp hơn */}
                <form
                  onSubmit={handleSendMessage}
                  className="flex gap-2 items-end"
                >
                  <label
                    className={`btn btn-ghost btn-circle btn-sm ${
                      isUploading ? "loading" : ""
                    } hover:bg-base-300 transition-colors`}
                    title="Đính kèm file (tối đa 25MB)"
                    disabled={isUploading}
                  >
                    <FiPaperclip className="w-5 h-5" />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Nhập tin nhắn..."
                      className="input input-bordered w-full focus:input-primary"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        // Enter để gửi (Shift+Enter để xuống dòng)
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                    />
                  </div>
                  <button
                    type="submit"
                    className={`btn btn-primary btn-circle ${
                      sendMessageMutation.isLoading ? "loading" : ""
                    }`}
                    disabled={
                      sendMessageMutation.isLoading || !newMessage.trim()
                    }
                    title="Gửi tin nhắn (Enter)"
                  >
                    <FiSend className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
