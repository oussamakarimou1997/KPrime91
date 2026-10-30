import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  X,
  ChevronRight,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ChatMessage } from '../types';

export interface ChatToastItem {
  id: string; // toast ID or message ID
  message: ChatMessage;
  timestamp: number;
  unreadCount?: number;
}

interface GlobalChatNotificationsProps {
  notifications: ChatToastItem[];
  onDismiss: (id: string) => void;
  onOpenChat: (messageId?: string) => void;
  unreadCount: number;
}

const NotificationToast: React.FC<{
  item: ChatToastItem;
  onDismiss: (id: string) => void;
  onOpenChat: (messageId?: string) => void;
  unreadCount: number;
}> = ({ item, onDismiss, onOpenChat, unreadCount }) => {
  const { message } = item;
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [progress, setProgress] = useState(100);

  const DURATION_MS = 8000;

  // Auto-dismiss timer with pause on hover
  useEffect(() => {
    if (isHovered) return;

    const interval = 100;
    const step = (interval / DURATION_MS) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(timer);
          onDismiss(item.id);
          return 0;
        }
        return prev - step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isHovered, item.id, onDismiss]);

  const isLong = message.content.length > 110;
  const displayText = isLong && !isExpanded
    ? `${message.content.slice(0, 110)}...`
    : message.content;

  // Time format
  const formattedTime = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="pointer-events-auto bg-white rounded-2xl border border-stone-200/90 shadow-xl shadow-emerald-950/10 p-3.5 sm:p-4 transition-all duration-300 transform translate-x-0 hover:border-emerald-300 hover:shadow-2xl overflow-hidden relative group animate-in slide-in-from-right-8 fade-in-80"
      style={{
        maxWidth: '100%',
      }}
      role="alert"
    >
      {/* Top Progress bar indicator */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-stone-100">
        <div
          className="h-full bg-gradient-to-r from-emerald-600 to-emerald-800 transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header Row */}
      <div className="flex items-center justify-between gap-2 mb-2 pt-0.5">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-emerald-800 text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
            <MessageSquare className="w-3 h-3 text-emerald-200" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-950">
            Kprime Team Group Chat
          </span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              {unreadCount} {unreadCount === 1 ? 'unread' : 'unreads'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-stone-500 font-medium">
            {formattedTime}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(item.id);
            }}
            className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            title="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sender and Message Body */}
      <div className="flex items-start gap-2.5 mb-3">
        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-xs flex-shrink-0 mt-0.5"
          style={{ backgroundColor: message.senderAvatar || '#059669' }}
        >
          {message.senderName?.slice(0, 1) || 'U'}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="text-xs sm:text-sm font-bold text-stone-900 leading-tight">
              {message.senderName}
            </h4>
            {message.senderRole && (
              <span className="text-[10px] text-stone-600 bg-stone-100 px-1.5 py-0.2 rounded font-medium truncate">
                {message.senderRole}
              </span>
            )}
          </div>

          <p className="text-xs text-stone-700 mt-1 leading-relaxed break-words whitespace-pre-wrap">
            {displayText}
          </p>

          {isLong && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5"
            >
              {isExpanded ? (
                <>
                  <span>Show less</span>
                  <ChevronUp className="w-3 h-3" />
                </>
              ) : (
                <>
                  <span>View more</span>
                  <ChevronDown className="w-3 h-3" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-stone-100">
        <span className="text-[10px] text-stone-500">
          Shared group conversation
        </span>

        <button
          onClick={() => onOpenChat(message.id)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white text-xs font-semibold shadow-xs transition-all hover:gap-2"
        >
          <span>Open Group Chat</span>
          <ChevronRight className="w-3.5 h-3.5 text-emerald-300" />
        </button>
      </div>
    </div>
  );
};

export const GlobalChatNotifications: React.FC<GlobalChatNotificationsProps> = ({
  notifications,
  onDismiss,
  onOpenChat,
  unreadCount,
}) => {
  if (notifications.length === 0) return null;

  return (
    <div
      id="global-chat-notifications-stack"
      className="fixed top-4 right-3 sm:top-5 sm:right-6 z-50 flex flex-col gap-2.5 max-w-sm sm:max-w-md w-[calc(100vw-1.5rem)] pointer-events-none"
      aria-live="polite"
    >
      {notifications.map((item) => (
        <NotificationToast
          key={item.id}
          item={item}
          onDismiss={onDismiss}
          onOpenChat={onOpenChat}
          unreadCount={unreadCount}
        />
      ))}
    </div>
  );
};
