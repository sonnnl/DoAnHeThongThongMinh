# Hệ Thống Notifications và Direct Messages

## 🔔 Notification System

### Các Loại Notifications

#### Post Related

- `post_upvote` - Ai đó upvote post của bạn
- `post_comment` - Ai đó comment vào post của bạn
- `post_mention` - Ai đó mention bạn trong post (@username)

#### Comment Related

- `comment_upvote` - Ai đó upvote comment của bạn
- `comment_reply` - Ai đó reply comment của bạn
- `comment_mention` - Ai đó mention bạn trong comment

#### Direct Message

- `new_message` - Tin nhắn mới

#### Moderation

- `post_removed` - Post của bạn bị xóa
- `comment_removed` - Comment của bạn bị xóa
- `user_banned` - Bạn bị ban
- `user_unbanned` - Bạn được unban
- `report_accepted` - Report của bạn được chấp nhận
- `report_rejected` - Report của bạn bị từ chối

#### System

- `welcome` - Chào mừng user mới
- `badge_earned` - Đạt badge mới
- `achievement` - Đạt thành tích
- `system_announcement` - Thông báo từ admin

### API Endpoints

```javascript
// GET /api/notifications
// Lấy danh sách notifications (with pagination)
Query params:
  - page: number
  - limit: number
  - unread: boolean (filter chỉ lấy unread)

Response:
{
  notifications: [
    {
      _id: "...",
      type: "post_upvote",
      sender: { username, avatar },
      message: "john_doe đã upvote bài viết của bạn",
      link: "/posts/slug",
      isRead: false,
      createdAt: "..."
    }
  ],
  pagination: { ... },
  unreadCount: 5
}

// GET /api/notifications/unread-count
// Lấy số notifications chưa đọc
Response: { count: 5 }

// PUT /api/notifications/:id/read
// Đánh dấu 1 notification đã đọc

// PUT /api/notifications/mark-all-read
// Đánh dấu tất cả đã đọc

// DELETE /api/notifications/:id
// Xóa 1 notification

// DELETE /api/notifications
// Xóa tất cả notifications
```

### Frontend Implementation

```jsx
// Notification Badge Component
<NotificationBadge count={unreadCount} />

// Notification Dropdown
<NotificationDropdown>
  {notifications.map(notif => (
    <NotificationItem
      key={notif._id}
      notification={notif}
      onRead={() => markAsRead(notif._id)}
    />
  ))}
</NotificationDropdown>

// Real-time updates với WebSocket
socket.on('notification', (data) => {
  addNotification(data);
  updateUnreadCount();
  showToast(data.message);
});
```

### Creating Notifications

```javascript
// Trong Post.methods.addUpvote
await Notification.createNotification({
  recipient: post.author,
  sender: userId,
  type: "post_upvote",
  message: `${user.username} đã upvote bài viết của bạn`,
  targetType: "Post",
  targetId: post._id,
  link: `/posts/${post.slug}`,
});
```

---

## 💬 Direct Messages System

### Conversations

#### Direct Conversation (1-on-1)

```javascript
// POST /api/messages/conversations/direct
Body: {
  userId: "user_id_to_chat_with"
}

Response: {
  conversation: {
    _id: "...",
    type: "direct",
    participants: [
      {
        user: { _id, username, avatar },
        unreadCount: 0,
        lastReadAt: "..."
      }
    ],
    lastMessage: {
      content: "Hi!",
      sender: { ... },
      sentAt: "..."
    }
  }
}
```

#### Group Conversation

```javascript
// POST /api/messages/conversations/group
Body: {
  name: "Nhóm React Developers",
  participants: ["user_id_1", "user_id_2", "user_id_3"],
  avatar: "https://..."  // optional
}

// POST /api/messages/conversations/:id/add-member
Body: {
  userId: "user_id_to_add"
}

// POST /api/messages/conversations/:id/remove-member
Body: {
  userId: "user_id_to_remove"
}

// POST /api/messages/conversations/:id/leave
// Current user leaves group
```

### Messages

```javascript
// GET /api/messages/:conversationId
// Lấy messages (with pagination)
Query params:
  - page: number
  - limit: number
  - before: messageId (for infinite scroll)

Response: {
  messages: [
    {
      _id: "...",
      sender: { username, avatar },
      content: "Hello!",
      type: "text",
      attachments: [],
      replyTo: null,
      readBy: [...],
      isEdited: false,
      createdAt: "..."
    }
  ]
}

// POST /api/messages/:conversationId
// Gửi message mới
Body: {
  content: "Hello!",
  type: "text",
  replyTo: "message_id",  // optional
  attachments: [...]  // optional
}

// PUT /api/messages/:conversationId/:messageId
// Edit message
Body: {
  content: "Updated content"
}

// DELETE /api/messages/:conversationId/:messageId
// Xóa message (soft delete)

// PUT /api/messages/:conversationId/mark-read
// Đánh dấu tất cả messages trong conversation đã đọc
```

### Frontend Implementation

#### Conversations List

```jsx
<ConversationsList>
  {conversations.map((conv) => (
    <ConversationItem
      key={conv._id}
      conversation={conv}
      onClick={() => openConversation(conv._id)}
    >
      <Avatar src={conv.avatar} />
      <div>
        <h4>{conv.name || conv.participants[0].username}</h4>
        <p>{conv.lastMessage.content}</p>
      </div>
      {conv.unreadCount > 0 && <Badge count={conv.unreadCount} />}
    </ConversationItem>
  ))}
</ConversationsList>
```

#### Chat Window

```jsx
<ChatWindow conversationId={conversationId}>
  <ChatHeader conversation={conversation} />

  <MessagesList>
    {messages.map((msg) => (
      <MessageBubble
        key={msg._id}
        message={msg}
        isOwn={msg.sender._id === currentUser._id}
        onReply={() => setReplyTo(msg)}
        onEdit={() => editMessage(msg)}
        onDelete={() => deleteMessage(msg._id)}
      />
    ))}
  </MessagesList>

  <MessageInput
    onSend={sendMessage}
    replyTo={replyTo}
    onAttach={handleAttach}
  />
</ChatWindow>
```

#### Real-time với WebSocket

```javascript
// Connect
socket.emit("join_conversation", conversationId);

// Receive new message
socket.on("new_message", (message) => {
  addMessage(message);
  scrollToBottom();
  playNotificationSound();
});

// Typing indicator
socket.emit("typing", { conversationId, isTyping: true });
socket.on("user_typing", ({ userId, isTyping }) => {
  updateTypingStatus(userId, isTyping);
});

// Read receipts
socket.on("message_read", ({ messageId, userId }) => {
  updateReadStatus(messageId, userId);
});
```

### Features Giống VOZ

#### 1. Multi-user Conversations

- Tạo group chat với nhiều người
- Add/remove members
- Admin quản lý group
- Leave group

#### 2. Rich Message Types

- Text
- Images (drag & drop)
- Files (PDF, docs, etc.)
- Reply to message
- Edit message (trong 5 phút)
- Delete message

#### 3. Read Receipts

- Seen by list
- Read/unread status
- Last seen timestamp

#### 4. Conversation Management

- Mute notifications
- Archive conversations
- Delete conversations
- Pin conversations

#### 5. Search

- Search conversations by name
- Search messages in conversation
- Search messages globally

### AI Toxic Detection trong Messages

```javascript
// Khi gửi message
const message = await DirectMessage.create({
  conversation: conversationId,
  sender: userId,
  content: content,
});

// Call AI service
const toxicResult = await aiService.detectToxic(content);

if (toxicResult.isToxic && toxicResult.confidence > 0.8) {
  // Auto-flag hoặc block message
  message.aiAnalysis = {
    isToxic: true,
    toxicScore: toxicResult.confidence,
    analyzedAt: Date.now(),
  };

  // Thông báo cho moderators
  await Notification.createNotification({
    recipient: moderatorId,
    type: "system_announcement",
    message: "Phát hiện tin nhắn toxic",
  });
}

await message.save();
```

### Performance Optimization

#### Pagination

```javascript
// Cursor-based pagination cho messages
const messages = await DirectMessage.find({
  conversation: conversationId,
  _id: { $lt: cursor }, // Load messages before cursor
})
  .sort({ createdAt: -1 })
  .limit(50);
```

#### Caching

```javascript
// Cache conversations list
const conversations = await redis.get(`user:${userId}:conversations`);
if (!conversations) {
  conversations = await Conversation.find({ "participants.user": userId });
  await redis.setex(
    `user:${userId}:conversations`,
    300,
    JSON.stringify(conversations)
  );
}
```

#### Lazy Loading

```javascript
// Load messages khi scroll lên
<InfiniteScroll
  dataLength={messages.length}
  next={loadMoreMessages}
  hasMore={hasMore}
  loader={<Spinner />}
  scrollableTarget="message-list"
  inverse={true} // Scroll direction reversed
>
  {messages.map((msg) => (
    <MessageBubble {...msg} />
  ))}
</InfiniteScroll>
```

---

## 🚀 Implementation Checklist

### Backend

- [x] Notification model
- [x] Conversation model
- [x] DirectMessage model
- [x] Notification routes
- [x] Message routes
- [ ] Notification controller
- [ ] Message controller
- [ ] WebSocket setup (Socket.IO)
- [ ] AI integration trong messages
- [ ] Notification background job (xóa cũ)

### Frontend

- [ ] Notification bell icon với badge
- [ ] Notification dropdown
- [ ] Notification list page
- [ ] Conversations list page
- [ ] Chat window component
- [ ] Message input với file upload
- [ ] Real-time updates (Socket.IO client)
- [ ] Push notifications (optional)
- [ ] Mobile responsive

### Testing

- [ ] Test notification creation
- [ ] Test message sending/receiving
- [ ] Test real-time updates
- [ ] Test AI toxic detection trong messages
- [ ] Test group chat features
- [ ] Load testing với nhiều messages

---

**Good luck! 🎉**
