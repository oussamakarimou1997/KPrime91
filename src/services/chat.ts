import { ChatMessage } from '../types';
import { getAuthToken } from './auth';

type MessageListener = (event: {
  type: 'new_message' | 'message_updated' | 'message_deleted' | 'reconnected' | 'connection_status';
  message?: ChatMessage;
  status?: 'connected' | 'connecting' | 'disconnected';
}) => void;

let eventSource: EventSource | null = null;
let reconnectTimeout: any = null;
let listeners: Set<MessageListener> = new Set();
let isConnecting = false;
let currentStatus: 'connected' | 'connecting' | 'disconnected' = 'disconnected';

export function getChatConnectionStatus() {
  return currentStatus;
}

function notifyListeners(event: any) {
  listeners.forEach((listener) => {
    try {
      listener(event);
    } catch (e) {
      console.error('Error in chat listener:', e);
    }
  });
}

export function subscribeToChat(listener: MessageListener): () => void {
  listeners.add(listener);
  // Send current status immediately
  listener({ type: 'connection_status', status: currentStatus });

  // If not connected and have token, start SSE
  if (!eventSource && !isConnecting) {
    connectChatSSE();
  }

  return () => {
    listeners.delete(listener);
    // If no more listeners and not needed, we can keep or disconnect
  };
}

export function connectChatSSE(): void {
  const token = getAuthToken();
  if (!token) {
    currentStatus = 'disconnected';
    notifyListeners({ type: 'connection_status', status: 'disconnected' });
    return;
  }

  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }

  isConnecting = true;
  currentStatus = 'connecting';
  notifyListeners({ type: 'connection_status', status: 'connecting' });

  try {
    const url = `/api/chat/stream?token=${encodeURIComponent(token)}`;
    eventSource = new EventSource(url);

    eventSource.addEventListener('connected', () => {
      isConnecting = false;
      currentStatus = 'connected';
      notifyListeners({ type: 'connection_status', status: 'connected' });
      notifyListeners({ type: 'reconnected' });
    });

    eventSource.addEventListener('new_message', (e: MessageEvent) => {
      try {
        const message: ChatMessage = JSON.parse(e.data);
        notifyListeners({ type: 'new_message', message });
        window.dispatchEvent(new CustomEvent('kprime_new_chat_message', { detail: message }));
      } catch (err) {
        console.error('Failed to parse incoming message:', err);
      }
    });

    eventSource.addEventListener('message_updated', (e: MessageEvent) => {
      try {
        const message: ChatMessage = JSON.parse(e.data);
        notifyListeners({ type: 'message_updated', message });
      } catch (err) {
        console.error('Failed to parse updated message:', err);
      }
    });

    eventSource.addEventListener('message_deleted', (e: MessageEvent) => {
      try {
        const message: ChatMessage = JSON.parse(e.data);
        notifyListeners({ type: 'message_deleted', message });
      } catch (err) {
        console.error('Failed to parse deleted message:', err);
      }
    });

    eventSource.onerror = () => {
      isConnecting = false;
      currentStatus = 'disconnected';
      notifyListeners({ type: 'connection_status', status: 'disconnected' });

      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }

      // Reconnect after 3.5 seconds
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      reconnectTimeout = setTimeout(() => {
        if (listeners.size > 0 && getAuthToken()) {
          connectChatSSE();
        }
      }, 3500);
    };
  } catch (err) {
    console.error('Failed to establish EventSource:', err);
    isConnecting = false;
    currentStatus = 'disconnected';
    notifyListeners({ type: 'connection_status', status: 'disconnected' });
  }
}

export function disconnectChatSSE(): void {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
  isConnecting = false;
  currentStatus = 'disconnected';
  notifyListeners({ type: 'connection_status', status: 'disconnected' });
}

// Fetch messages with pagination
export async function fetchMessages(options?: {
  limit?: number;
  before?: string;
}): Promise<{ messages: ChatMessage[]; totalCount: number; hasMore: boolean }> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Not authenticated. Please sign in to access Team Chat.');
  }

  const params = new URLSearchParams();
  if (options?.limit) params.set('limit', String(options.limit));
  if (options?.before) params.set('before', options.before);

  const res = await fetch(`/api/chat/messages?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch messages (${res.status})`);
  }

  return res.json();
}

// Send new message
export async function sendChatMessage(content: string): Promise<ChatMessage> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Not authenticated. Please sign in to send messages.');
  }

  const res = await fetch('/api/chat/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to send message (${res.status})`);
  }

  const data = await res.json();
  return data.message;
}

// Edit existing message
export async function editChatMessage(id: string, content: string): Promise<ChatMessage> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Not authenticated.');
  }

  const res = await fetch(`/api/chat/messages/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to edit message (${res.status})`);
  }

  const data = await res.json();
  return data.message;
}

// Delete message
export async function deleteChatMessage(id: string): Promise<ChatMessage> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Not authenticated.');
  }

  const res = await fetch(`/api/chat/messages/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to delete message (${res.status})`);
  }

  const data = await res.json();
  return data.message;
}

// Mark messages as read
export async function markChatAsRead(): Promise<void> {
  const token = getAuthToken();
  if (!token) return;

  try {
    await fetch('/api/chat/read', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    window.dispatchEvent(new CustomEvent('kprime_chat_read'));
  } catch (err) {
    console.error('Failed to mark chat as read:', err);
  }
}

// Get unread count
export async function fetchUnreadCount(): Promise<number> {
  const token = getAuthToken();
  if (!token) return 0;

  try {
    const res = await fetch('/api/chat/unread-count', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.ok) {
      const data = await res.json();
      return data.unreadCount || 0;
    }
  } catch (err) {
    console.error('Failed to fetch unread count:', err);
  }
  return 0;
}
