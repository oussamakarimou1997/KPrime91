import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Send,
  Search,
  Smile,
  X,
  Edit2,
  Trash2,
  Check,
  AlertCircle,
  RefreshCw,
  Clock,
  User,
  Users,
  ShieldCheck,
  Radio,
  CornerDownLeft,
  ChevronDown,
  Sparkles,
  LogOut,
  LogIn,
  CheckCircle2,
} from 'lucide-react';
import { ChatMessage, AuthUser } from '../types';
import {
  fetchMessages,
  sendChatMessage,
  editChatMessage,
  deleteChatMessage,
  subscribeToChat,
  markChatAsRead,
  getChatConnectionStatus,
} from '../services/chat';
import {
  getCurrentUser,
  getAuthToken,
  loginAsUser,
  logout,
  fetchAuthorizedUsers,
} from '../services/auth';

const POPULAR_EMOJIS = ['🧪', '🌸', '💧', '✨', '👍', '❤️', '🔥', '👑', '🌿', '🎯', '👌', '👏'];

export const TeamChat: React.FC = () => {
  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(getCurrentUser());
  const [authorizedUsers, setAuthorizedUsers] = useState<AuthUser[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  
  // Loading & Pagination
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Input & Messaging
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState('');

  // Editing Message
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete Confirmation Modal
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Auto-scroll ref
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isFirstLoadRef = useRef(true);

  // 1. Load Authorized Users & Current User
  useEffect(() => {
    fetchAuthorizedUsers().then((users) => {
      setAuthorizedUsers(users);
      // If no current user, default login to first active user
      if (!getCurrentUser() && users.length > 0) {
        const active = users.find((u) => u.status === 'active') || users[0];
        loginAsUser(active.id).then((res) => {
          if (res.user) setCurrentUser(res.user);
        });
      }
    });

    const handleAuthChange = (e: any) => {
      setCurrentUser(e.detail?.user || null);
    };
    window.addEventListener('kprime_auth_changed', handleAuthChange);
    return () => window.removeEventListener('kprime_auth_changed', handleAuthChange);
  }, []);

  // 2. Load Messages & Subscribe to Real-Time SSE
  useEffect(() => {
    let isMounted = true;

    async function loadInitialMessages() {
      if (!getAuthToken()) {
        setIsLoadingInitial(false);
        return;
      }
      setIsLoadingInitial(true);
      setErrorBanner(null);
      try {
        const data = await fetchMessages({ limit: 50 });
        if (isMounted) {
          setMessages(data.messages);
          setHasMore(data.hasMore);
          setIsLoadingInitial(false);
          markChatAsRead();

          setTimeout(() => {
            if (isFirstLoadRef.current) {
              scrollToBottom('auto');
              isFirstLoadRef.current = false;
            }
          }, 100);
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorBanner(err.message || 'Failed to connect to team chat database.');
          setIsLoadingInitial(false);
        }
      }
    }

    loadInitialMessages();

    // Subscribe to real-time events
    const unsubscribe = subscribeToChat((event) => {
      if (event.type === 'connection_status' && event.status) {
        setConnectionStatus(event.status);
      } else if (event.type === 'new_message' && event.message) {
        const newMsg = event.message;
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        markChatAsRead();
        // If user is near bottom, scroll down
        setTimeout(() => scrollToBottom('smooth'), 50);
      } else if (event.type === 'message_updated' && event.message) {
        const updated = event.message;
        setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      } else if (event.type === 'message_deleted' && event.message) {
        const deleted = event.message;
        setMessages((prev) => prev.map((m) => (m.id === deleted.id ? deleted : m)));
      } else if (event.type === 'reconnected') {
        // Refresh recent messages silently on reconnection
        fetchMessages({ limit: 50 })
          .then((data) => {
            if (isMounted) {
              setMessages((prev) => {
                const map = new Map<string, ChatMessage>();
                data.messages.forEach((m) => map.set(m.id, m));
                prev.forEach((m) => map.set(m.id, m));
                return Array.from(map.values()).sort(
                  (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                );
              });
            }
          })
          .catch(() => {});
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [currentUser?.id]);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // 3. Load Older Messages (Pagination)
  const handleLoadOlder = async () => {
    if (isLoadingOlder || !hasMore || messages.length === 0) return;
    setIsLoadingOlder(true);
    const oldestTimestamp = messages[0].createdAt;
    try {
      const data = await fetchMessages({ limit: 30, before: oldestTimestamp });
      setMessages((prev) => [...data.messages, ...prev]);
      setHasMore(data.hasMore);
    } catch (err: any) {
      console.error('Failed to load older messages:', err);
    } finally {
      setIsLoadingOlder(false);
    }
  };

  // 4. Send Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const content = inputText.trim();
    if (!content || isSending) return;

    if (!currentUser) {
      setSendError('Please sign in with an authorized team member account.');
      return;
    }

    setIsSending(true);
    setSendError(null);
    try {
      const sent = await sendChatMessage(content);
      // Append immediately if not received through SSE yet
      setMessages((prev) => {
        if (prev.some((m) => m.id === sent.id)) return prev;
        return [...prev, sent];
      });
      setInputText('');
      setShowEmojiPicker(false);
      setTimeout(() => scrollToBottom('smooth'), 50);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (err: any) {
      setSendError(err.message || 'Failed to send message. Please retry.');
    } finally {
      setIsSending(false);
    }
  };

  // Keyboard shortcut: Enter to send, Shift+Enter for newline
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Textarea auto-resize
  const handleInputTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  // 5. Edit Message
  const handleStartEdit = (msg: ChatMessage) => {
    setEditingMessageId(msg.id);
    setEditingText(msg.content);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingText('');
  };

  const handleSaveEdit = async () => {
    if (!editingMessageId || !editingText.trim() || isSavingEdit) return;
    setIsSavingEdit(true);
    try {
      const updated = await editChatMessage(editingMessageId, editingText.trim());
      setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setEditingMessageId(null);
      setEditingText('');
    } catch (err: any) {
      alert(err.message || 'Failed to update message.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // 6. Delete Message
  const handleConfirmDelete = async () => {
    if (!deletingMessageId || isDeleting) return;
    setIsDeleting(true);
    try {
      const deleted = await deleteChatMessage(deletingMessageId);
      setMessages((prev) => prev.map((m) => (m.id === deleted.id ? deleted : m)));
      setDeletingMessageId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete message.');
    } finally {
      setIsDeleting(false);
    }
  };

  // 7. Quick Emoji Add
  const handleAddEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  // 8. Sign in with real authorized account (when logged out)
  const handleSignIn = async (targetUser: AuthUser) => {
    setIsLoadingInitial(true);
    const res = await loginAsUser(targetUser.id);
    if (res.success && res.user) {
      setCurrentUser(res.user);
    }
  };

  // 9. Filter messages by search query
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter(
      (m) =>
        m.content.toLowerCase().includes(q) ||
        m.senderName.toLowerCase().includes(q) ||
        (m.senderRole && m.senderRole.toLowerCase().includes(q))
    );
  }, [messages, searchQuery]);

  // Helper: Format Date Divider
  const getDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (d.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  };

  // Helper: Format Message Time
  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Group messages with date separators
  const messagesWithDividers = useMemo(() => {
    const items: Array<{ type: 'divider' | 'message'; dateLabel?: string; message?: ChatMessage }> = [];
    let lastDateLabel = '';

    filteredMessages.forEach((msg) => {
      const dateLabel = getDateLabel(msg.createdAt);
      if (dateLabel !== lastDateLabel) {
        items.push({ type: 'divider', dateLabel });
        lastDateLabel = dateLabel;
      }
      items.push({ type: 'message', message: msg });
    });

    return items;
  }, [filteredMessages]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col h-[calc(100vh-5rem)]">
      {/* Top Banner / Channel Card */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs mb-3 p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-950 p-0.5 shadow-sm flex items-center justify-center flex-shrink-0">
            <div className="w-full h-full bg-emerald-950 rounded-[10px] flex items-center justify-center text-emerald-400 font-serif font-bold text-lg">
              K
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif-luxury text-lg sm:text-xl font-bold text-stone-900 tracking-wide">
                Kprime Team Group Chat
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    connectionStatus === 'connected'
                      ? 'bg-emerald-500 animate-pulse'
                      : connectionStatus === 'connecting'
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                />
                {connectionStatus === 'connected' ? 'Live Real-Time' : connectionStatus === 'connecting' ? 'Connecting...' : 'Offline'}
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Single shared group conversation for all Sales Men & atelier compounding formulators.
            </p>
          </div>
        </div>

        {/* Right Controls: Search & Real Authenticated Team Identity */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Search Bar */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search group messages..."
              className="w-full pl-9 pr-7 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Real Authenticated User Profile */}
          {currentUser ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50/80 text-left shadow-2xs">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-2xs"
                style={{ backgroundColor: currentUser.avatarColor || '#059669' }}
              >
                {currentUser.name?.slice(0, 1) || 'U'}
              </div>
              <div className="hidden md:block">
                <div className="text-xs font-semibold text-stone-900 leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-emerald-800 font-medium">
                  {currentUser.role || 'Sales Formulator'}
                </div>
              </div>
              <button
                onClick={() => {
                  logout();
                  setCurrentUser(null);
                }}
                className="ml-1 p-1 text-stone-400 hover:text-rose-600 rounded-md hover:bg-stone-200/50 transition-colors"
                title="Sign Out of Atelier"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="text-xs text-stone-500 font-medium px-2.5 py-1.5 bg-stone-100 rounded-lg">
              Not Signed In
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Body Card */}
      <div className="flex-1 bg-white rounded-2xl border border-stone-200 shadow-sm flex flex-col overflow-hidden relative">
        {/* Error Banner */}
        {errorBanner && (
          <div className="bg-rose-50 border-b border-rose-200 px-4 py-2.5 flex items-center justify-between text-xs text-rose-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorBanner}</span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="text-rose-700 hover:underline font-semibold text-xs ml-4"
            >
              Retry
            </button>
          </div>
        )}

        {/* Unauthorized State if user is signed out */}
        {!currentUser ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-stone-50">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4 shadow-sm">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="font-serif-luxury text-xl font-bold text-stone-900 mb-2">
              Authorized Access Required
            </h3>
            <p className="text-sm text-stone-500 max-w-md mb-6">
              The Kprime Team Group Chat is protected by database security rules. Only authenticated team members can read and post messages.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              {authorizedUsers.slice(0, 3).map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSignIn(user)}
                  className="px-4 py-2 rounded-xl bg-white border border-stone-300 text-stone-800 hover:border-emerald-600 hover:text-emerald-800 font-semibold text-xs transition-all shadow-2xs flex items-center gap-2"
                >
                  <div
                    className="w-4 h-4 rounded-full text-white text-[9px] flex items-center justify-center font-bold"
                    style={{ backgroundColor: user.avatarColor || '#059669' }}
                  >
                    {user.name.slice(0, 1)}
                  </div>
                  Sign in as {user.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Scrollable Messages Area */}
            <div
              ref={chatScrollContainerRef}
              className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 bg-gradient-to-b from-stone-50/60 to-white"
            >
              {/* Pagination / Load Older Button */}
              {hasMore && (
                <div className="text-center py-2">
                  <button
                    onClick={handleLoadOlder}
                    disabled={isLoadingOlder}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-stone-200 text-stone-600 hover:text-emerald-800 hover:border-emerald-300 transition-all shadow-2xs disabled:opacity-50"
                  >
                    {isLoadingOlder ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                    )}
                    <span>{isLoadingOlder ? 'Loading older history...' : 'Load older messages'}</span>
                  </button>
                </div>
              )}

              {/* Initial Loading Skeleton */}
              {isLoadingInitial && (
                <div className="space-y-4 py-8">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`flex gap-3 max-w-md ${i % 2 === 0 ? 'ml-auto flex-row-reverse' : ''}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-stone-200 animate-pulse flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-stone-200 rounded w-28 animate-pulse" />
                        <div className="h-12 bg-stone-200 rounded-2xl animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!isLoadingInitial && filteredMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3 border border-emerald-100 shadow-2xs">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <h4 className="font-serif-luxury text-base font-bold text-stone-900 mb-1">
                    {searchQuery ? 'No matching messages found' : 'Welcome to Kprime Team Group Chat!'}
                  </h4>
                  <p className="text-xs text-stone-500 max-w-sm mb-4">
                    {searchQuery
                      ? `No messages matched "${searchQuery}". Try a different keyword or sender name.`
                      : 'This is the single group conversation shared by all Sales Men and compounding formulators. Send a message below to coordinate mixes, bottle sizes, and inventory with your team.'}
                  </p>
                  {!searchQuery && (
                    <div className="flex flex-wrap justify-center gap-2">
                      {[
                        '🧪 Stock check on Bergamot & Ambroxan oils',
                        '✨ New 36ml bottle batch ready for dispatch',
                        '🎯 VIP formula consultation: Aventus 60%',
                      ].map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => setInputText(prompt)}
                          className="text-xs px-3 py-1.5 rounded-full bg-stone-100 hover:bg-emerald-50 text-stone-700 hover:text-emerald-900 border border-stone-200 hover:border-emerald-300 transition-all"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Message List */}
              {messagesWithDividers.map((item, index) => {
                if (item.type === 'divider') {
                  return (
                    <div key={`divider-${index}`} className="flex items-center my-4">
                      <div className="flex-1 border-t border-stone-200" />
                      <span className="px-3 py-0.5 text-[11px] font-semibold text-stone-400 bg-white border border-stone-200/80 rounded-full shadow-2xs">
                        {item.dateLabel}
                      </span>
                      <div className="flex-1 border-t border-stone-200" />
                    </div>
                  );
                }

                const msg = item.message!;
                const isMine = currentUser && msg.senderId === currentUser.id;
                const isEditingThis = editingMessageId === msg.id;

                return (
                  <div
                    key={msg.id}
                    className={`group flex items-end gap-2.5 sm:gap-3 transition-opacity ${
                      isMine ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {/* Other User Avatar */}
                    {!isMine && (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-xs flex-shrink-0 mb-1"
                        style={{ backgroundColor: msg.senderAvatar || '#059669' }}
                        title={`${msg.senderName} (${msg.senderRole || 'Formulator'})`}
                      >
                        {msg.senderName?.slice(0, 1) || 'U'}
                      </div>
                    )}

                    {/* Message Bubble Container */}
                    <div
                      className={`max-w-[85%] sm:max-w-lg lg:max-w-xl flex flex-col ${
                        isMine ? 'items-end' : 'items-start'
                      }`}
                    >
                      {/* Sender Meta (shown for other users) */}
                      {!isMine && (
                        <div className="flex items-center gap-1.5 ml-1 mb-1 text-[11px]">
                          <span className="font-semibold text-stone-800">{msg.senderName}</span>
                          {msg.senderRole && (
                            <span className="text-[10px] text-stone-600 bg-stone-100 px-1.5 py-0.2 rounded font-medium">
                              {msg.senderRole}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Bubble */}
                      <div
                        className={`relative px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs transition-all ${
                          msg.isDeleted
                            ? 'bg-stone-100 border border-dashed border-stone-300 text-stone-400 italic'
                            : isMine
                            ? 'bg-gradient-to-br from-emerald-800 to-emerald-950 text-white rounded-br-xs selection:bg-emerald-400 selection:text-emerald-950 shadow-emerald-950/10'
                            : 'bg-white border border-stone-200 text-stone-900 rounded-bl-xs'
                        }`}
                      >
                        {isEditingThis ? (
                          // Inline Edit Box
                          <div className="space-y-2 min-w-[240px]">
                            <textarea
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              className="w-full p-2 bg-white text-stone-900 rounded-lg text-xs border border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                              rows={2}
                              autoFocus
                            />
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={handleCancelEdit}
                                className="px-2 py-1 text-[11px] rounded bg-stone-200 text-stone-700 hover:bg-stone-300 font-medium"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleSaveEdit}
                                disabled={isSavingEdit || !editingText.trim()}
                                className="px-2.5 py-1 text-[11px] rounded bg-emerald-600 text-white hover:bg-emerald-700 font-medium flex items-center gap-1 disabled:opacity-50"
                              >
                                {isSavingEdit && <RefreshCw className="w-3 h-3 animate-spin" />}
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {/* Message Content */}
                            <div className="whitespace-pre-wrap break-words">{msg.content}</div>

                            {/* Message Footer: Timestamp + Status */}
                            <div
                              className={`flex items-center gap-1 mt-1 text-[10px] select-none ${
                                isMine ? 'text-emerald-200/80 justify-end' : 'text-stone-600 justify-end'
                              }`}
                            >
                              {msg.isEdited && !msg.isDeleted && (
                                <span className="italic opacity-80">(edited)</span>
                              )}
                              <span>{formatTime(msg.createdAt)}</span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Hover Actions (Edit, Delete) for Owner */}
                      {isMine && !msg.isDeleted && !isEditingThis && (
                        <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-center gap-1 mt-0.5 mr-1">
                          <button
                            onClick={() => handleStartEdit(msg)}
                            className="p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                            title="Edit message"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setDeletingMessageId(msg.id)}
                            className="p-1 rounded text-stone-400 hover:text-rose-600 hover:bg-stone-100"
                            title="Delete message"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Current User Avatar */}
                    {isMine && (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-xs flex-shrink-0 mb-1"
                        style={{ backgroundColor: currentUser.avatarColor || '#059669' }}
                        title={`${currentUser.name} (${currentUser.role || 'You'})`}
                      >
                        {currentUser.name?.slice(0, 1) || 'U'}
                      </div>
                    )}
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Composer Footer */}
            <div className="border-t border-stone-200 bg-white p-3 sm:p-4">
              {/* Send Error Alert */}
              {sendError && (
                <div className="mb-2 p-2 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                    <span>{sendError}</span>
                  </div>
                  <button
                    onClick={() => setSendError(null)}
                    className="text-rose-600 hover:text-rose-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Emoji Tray */}
              {showEmojiPicker && (
                <div className="mb-2 p-2 bg-stone-50 border border-stone-200 rounded-xl flex items-center gap-1.5 flex-wrap animate-in fade-in">
                  <span className="text-[11px] text-stone-600 font-semibold mr-1">Quick emojis:</span>
                  {POPULAR_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleAddEmoji(emoji)}
                      className="w-7 h-7 flex items-center justify-center text-sm rounded-lg hover:bg-white hover:shadow-2xs transition-all"
                    >
                      {emoji}
                    </button>
                  ))}
                  <button
                    onClick={() => setShowEmojiPicker(false)}
                    className="ml-auto text-stone-400 hover:text-stone-600 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Composer Form */}
              <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                {/* Emoji toggle */}
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`p-2.5 rounded-xl border transition-all flex-shrink-0 ${
                    showEmojiPicker
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'text-stone-500 hover:text-stone-800 border-stone-200 hover:bg-stone-50'
                  }`}
                  title="Insert emoji"
                >
                  <Smile className="w-5 h-5" />
                </button>

                {/* Textarea */}
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={inputText}
                    onChange={handleInputTextChange}
                    onKeyDown={handleKeyDown}
                    placeholder={`Message atelier team as ${currentUser.name}... (Press Enter to send, Shift+Enter for newline)`}
                    rows={1}
                    className="w-full resize-none py-2.5 px-3.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all max-h-32"
                  />
                </div>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!inputText.trim() || isSending}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-900 hover:from-emerald-900 hover:to-emerald-950 text-white font-semibold text-xs sm:text-sm transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                >
                  {isSending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span className="hidden sm:inline">Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span className="hidden sm:inline">Send</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingMessageId && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-stone-200 shadow-2xl">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h4 className="font-serif-luxury text-base font-bold text-stone-900 mb-1">
              Delete Message?
            </h4>
            <p className="text-xs text-stone-500 mb-4 leading-relaxed">
              This message will be removed from the team conversation. A placeholder will indicate it was deleted to preserve conversation context.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingMessageId(null)}
                disabled={isDeleting}
                className="px-3 py-1.5 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                {isDeleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Delete Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
