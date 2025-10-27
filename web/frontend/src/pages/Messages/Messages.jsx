/**
 * FILE: web/frontend/src/pages/Messages/Messages.jsx
 * MỤC ĐÍCH: Trang tin nhắn
 */

import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { messagesAPI } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import toast from "react-hot-toast";
import Loading from "../../components/UI/Loading";
import { FiSend, FiUser } from "react-icons/fi";
import { timeAgo } from "../../utils/helpers";

const Messages = () => {
  const { userId } = useParams();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");

  // Fetch conversations
  const { data: conversationsData, isLoading: conversationsLoading } = useQuery(
    "conversations",
    () => messagesAPI.getConversations()
  );

  // Fetch messages for selected conversation
  const { data: messagesData, isLoading: messagesLoading } = useQuery(
    ["messages", userId],
    () => {
      if (!userId) return null;
      return messagesAPI
        .getOrCreateConversation(userId)
        .then((conv) => messagesAPI.getMessages(conv.data._id));
    },
    {
      enabled: !!userId,
    }
  );

  // Send message mutation
  const sendMessageMutation = useMutation(
    (messageData) => messagesAPI.sendMessage(messageData),
    {
      onSuccess: () => {
        setNewMessage("");
        queryClient.invalidateQueries(["messages", userId]);
        queryClient.invalidateQueries("conversations");
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || "Gửi tin nhắn thất bại");
      },
    }
  );

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !userId) return;

    sendMessageMutation.mutate({
      toUser: userId,
      content: newMessage,
    });
  };

  const conversations = conversationsData?.data?.conversations || [];
  const messages = messagesData?.data?.messages || [];

  return (
    <div className="h-[calc(100vh-200px)]">
      <h1 className="text-3xl font-bold mb-6">Tin nhắn</h1>

      <div className="grid grid-cols-12 gap-6 h-full">
        {/* Conversations list */}
        <div className="col-span-12 md:col-span-4 card bg-base-100 shadow-md overflow-hidden">
          <div className="card-body p-0">
            <h2 className="text-xl font-bold p-4 border-b border-base-300">
              Cuộc trò chuyện
            </h2>
            <div className="overflow-y-auto flex-1">
              {conversationsLoading ? (
                <Loading />
              ) : conversations.length === 0 ? (
                <div className="text-center py-8 text-base-content/60 text-sm">
                  Chưa có cuộc trò chuyện nào
                </div>
              ) : (
                <ul className="menu p-2">
                  {conversations.map((conversation) => {
                    const otherUser = conversation.participants.find(
                      (p) => p._id !== user?._id
                    );
                    return (
                      <li key={conversation._id}>
                        <Link
                          to={`/messages/${otherUser?._id}`}
                          className={`flex items-center gap-3 ${
                            userId === otherUser?._id ? "active" : ""
                          }`}
                        >
                          {otherUser?.avatar ? (
                            <img
                              src={otherUser.avatar}
                              alt={otherUser.username}
                              className="w-12 h-12 rounded-full"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-primary text-primary-content flex items-center justify-center">
                              <FiUser />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold truncate">
                              {otherUser?.username}
                            </div>
                            {conversation.lastMessage && (
                              <div className="text-xs text-base-content/60 truncate">
                                {conversation.lastMessage.content}
                              </div>
                            )}
                          </div>
                          {conversation.unreadCount > 0 && (
                            <span className="badge badge-primary badge-sm">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Messages area */}
        <div className="col-span-12 md:col-span-8 card bg-base-100 shadow-md flex flex-col">
          {!userId ? (
            <div className="flex items-center justify-center h-full text-base-content/60">
              Chọn một cuộc trò chuyện để bắt đầu
            </div>
          ) : (
            <>
              {/* Messages list */}
              <div className="card-body overflow-y-auto flex-1">
                {messagesLoading ? (
                  <Loading />
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-base-content/60">
                    Chưa có tin nhắn nào. Hãy gửi tin nhắn đầu tiên!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const isOwn = message.sender._id === user?._id;
                      return (
                        <div
                          key={message._id}
                          className={`chat ${
                            isOwn ? "chat-end" : "chat-start"
                          }`}
                        >
                          <div className="chat-image avatar">
                            <div className="w-10 rounded-full">
                              {message.sender.avatar ? (
                                <img
                                  src={message.sender.avatar}
                                  alt={message.sender.username}
                                />
                              ) : (
                                <div className="bg-primary text-primary-content w-full h-full flex items-center justify-center">
                                  <FiUser />
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="chat-header">
                            {message.sender.username}
                            <time className="text-xs opacity-50 ml-2">
                              {timeAgo(message.createdAt)}
                            </time>
                          </div>
                          <div
                            className={`chat-bubble ${
                              isOwn
                                ? "chat-bubble-primary"
                                : "chat-bubble-secondary"
                            }`}
                          >
                            {message.content}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Send message form */}
              <div className="card-body pt-0">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nhập tin nhắn..."
                    className="input input-bordered flex-1"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <button
                    type="submit"
                    className={`btn btn-primary ${
                      sendMessageMutation.isLoading ? "loading" : ""
                    }`}
                    disabled={
                      sendMessageMutation.isLoading || !newMessage.trim()
                    }
                  >
                    <FiSend />
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
