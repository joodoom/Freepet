'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { messagesAPI, Conversation, Message, User } from '@/lib/api';
import { MessageSquare, Send, ArrowLeft, Loader2, UserCircle, Trash2, Flag, X, Shield, PawPrint } from 'lucide-react';
import { PageShell } from '@/components/ui';

const REPORT_REASONS = [
  'Спам',
  'Оскорбления',
  'Неприемлемый контент',
  'Мошенничество',
  'Другое',
];

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChat, setActiveChat] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [deleteModal, setDeleteModal] = useState<number | null>(null);
  const [reportModal, setReportModal] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportComment, setReportComment] = useState('');
  const prevMessagesCount = useRef(0);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(savedUser));
  }, [router]);

  useEffect(() => {
    if (!user) return;
    loadConversations();
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const userId = searchParams.get('user');
    if (userId) {
      setActiveChat(parseInt(userId));
    }
  }, [searchParams]);

  useEffect(() => {
    if (!activeChat || !user) return;
    loadMessages(activeChat);
    const interval = setInterval(() => loadMessages(activeChat), 3000);
    return () => clearInterval(interval);
  }, [activeChat, user]);

  useEffect(() => {
    if (messages.length > prevMessagesCount.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesCount.current = messages.length;
  }, [messages]);

  const loadConversations = async () => {
    try {
      const response = await messagesAPI.getConversations();
      setConversations(response.data);
    } catch {}
  };

  const loadMessages = async (userId: number) => {
    try {
      const response = await messagesAPI.getMessages(userId);
      setMessages(response.data);
    } catch {}
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    setSending(true);
    try {
      await messagesAPI.send({
        receiver_id: activeChat,
        text: newMessage.trim(),
      });
      setNewMessage('');
      await loadMessages(activeChat);
      await loadConversations();
    } catch {}
    setSending(false);
  };

  const handleDelete = async (messageId: number) => {
    try {
      await messagesAPI.delete(messageId);
      setDeleteModal(null);
      if (activeChat) await loadMessages(activeChat);
      await loadConversations();
    } catch {}
  };

  const handleReport = async () => {
    if (!reportReason || !reportModal) return;
    try {
      await messagesAPI.report({
        message_id: reportModal,
        reason: reportReason,
        comment: reportComment || undefined,
      });
      setReportModal(null);
      setReportReason('');
      setReportComment('');
    } catch {}
  };

  const openChat = (userId: number) => {
    setActiveChat(userId);
    setMessages([]);
    prevMessagesCount.current = 0;
  };

  if (!user) return null;

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="eyebrow">Сообщения</span>
            <h1 className="display-title mt-2 text-3xl sm:text-4xl">Тёплые разговоры</h1>
          </div>
          <span className="badge badge-neutral">
            <PawPrint className="h-3.5 w-3.5" /> {conversations.length} диалогов
          </span>
        </div>

        <div className="surface-card h-[calc(100vh-240px)] min-h-[540px] overflow-hidden sm:h-[calc(100vh-220px)]">
          <div className="flex h-full">
            <div className={`${activeChat ? 'hidden md:flex' : 'flex'} w-full flex-col border-r border-white/10 md:w-80`}>
              <div className="flex items-center border-b border-white/10 bg-white/5 p-4">
                <h2 className="flex items-center space-x-2 text-lg font-bold text-white">
                  <MessageSquare className="h-5 w-5 text-green-300" />
                  <span>Сообщения</span>
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="p-6 text-center text-slate-400">
                    <MessageSquare className="mx-auto mb-3 h-12 w-12 opacity-20" />
                    <p className="text-sm font-semibold">Пока нет сообщений</p>
                    <p className="mt-1 text-xs">Напишите владельцу питомца из бронирования</p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.user_id}
                      onClick={() => openChat(conv.user_id)}
                      className={`w-full border-b border-white/5 p-4 text-left transition-colors hover:bg-white/5 ${activeChat === conv.user_id ? 'border-l-4 border-l-primary-400 bg-primary-500/10' : ''} ${conv.is_admin_chat ? 'border-l-4 border-l-green-500 bg-green-500/5' : ''}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl ${conv.is_admin_chat ? 'bg-green-500/20' : 'bg-primary-500/20'}`}>
                          {conv.is_admin_chat ? (
                            <Shield className="h-5 w-5 text-green-300" />
                          ) : (
                            <UserCircle className="h-6 w-6 text-primary-300" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <p className={`truncate text-sm font-bold ${conv.is_admin_chat ? 'text-green-300' : 'text-white'}`}>
                              {conv.is_admin_chat ? 'Поддержка' : conv.username}
                            </p>
                            {conv.unread_count > 0 && (
                              <span className="ml-2 rounded-full bg-green-500 px-2 py-0.5 text-xs font-bold text-white">
                                {conv.unread_count}
                              </span>
                            )}
                          </div>
                          {conv.pet_name && (
                            <p className="mt-0.5 text-xs text-green-300">Питомец: {conv.pet_name}</p>
                          )}
                          <p className="mt-0.5 truncate text-xs text-slate-400">
                            {conv.is_admin_chat && !conv.last_message ? 'Напишите нам' : conv.last_message}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className={`${activeChat ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
              {activeChat ? (
                <>
                  <div className="flex items-center space-x-3 border-b border-white/10 bg-white/5 p-4">
                    <button
                      onClick={() => setActiveChat(null)}
                      className="flex h-11 w-11 -ml-2 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/10 hover:text-white md:hidden"
                      aria-label="Назад к диалогам"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl ${conversations.find(c => c.user_id === activeChat)?.is_admin_chat ? 'bg-green-500/20' : 'bg-primary-500/20'}`}>
                      {conversations.find(c => c.user_id === activeChat)?.is_admin_chat ? (
                        <Shield className="h-5 w-5 text-green-300" />
                      ) : (
                        <UserCircle className="h-5 w-5 text-primary-300" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className={`truncate text-sm font-bold ${conversations.find(c => c.user_id === activeChat)?.is_admin_chat ? 'text-green-300' : 'text-white'}`}>
                        {conversations.find(c => c.user_id === activeChat)?.is_admin_chat
                          ? 'Поддержка'
                          : conversations.find(c => c.user_id === activeChat)?.username || 'Чат'}
                      </p>
                      {conversations.find(c => c.user_id === activeChat)?.pet_name && (
                        <p className="truncate text-xs text-green-300">
                          {conversations.find(c => c.user_id === activeChat)?.pet_name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`group flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex max-w-[86%] flex-col sm:max-w-xs lg:max-w-md ${msg.sender_id === user.id ? 'items-end' : 'items-start'}`}>
                          <div
                            className={`px-4 py-2.5 shadow-lg ${
                              msg.sender_id === user.id
                                ? 'rounded-3xl rounded-br-md bg-primary-600/90 text-white'
                                : 'rounded-3xl rounded-bl-md border border-white/10 bg-white/10 text-white'
                            }`}
                          >
                            <p className="text-sm leading-relaxed">{msg.text}</p>
                            <p className={`mt-1 text-xs ${msg.sender_id === user.id ? 'text-primary-100' : 'text-slate-400'}`}>
                              {new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>

                          <div className={`mt-1 flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'} opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100`}>
                            {msg.sender_id === user.id ? (
                              <button
                                onClick={() => setDeleteModal(msg.id)}
                                className="flex items-center space-x-1 rounded-full px-3 py-2 text-xs font-semibold text-red-300 transition-colors hover:bg-white/5 hover:text-red-200"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>Удалить</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => setReportModal(msg.id)}
                                className="flex items-center space-x-1 rounded-full px-3 py-2 text-xs font-semibold text-slate-400 transition-colors hover:bg-white/5 hover:text-red-300"
                              >
                                <Flag className="h-4 w-4" />
                                <span>Пожаловаться</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  <form onSubmit={handleSend} className="border-t border-white/10 bg-white/5 p-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="field flex-1 !rounded-full !py-2.5 text-sm"
                        placeholder="Введите сообщение..."
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-green-600 text-white shadow-neon-emerald transition-all hover:bg-green-500 disabled:opacity-50"
                        aria-label="Отправить сообщение"
                      >
                        {sending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center p-8 text-slate-400">
                  <div className="text-center">
                    <MessageSquare className="mx-auto mb-4 h-16 w-16 opacity-20" />
                    <p className="font-semibold">Выберите чат или начните новый</p>
                    <p className="mt-1 text-sm">Все договорённости остаются в одном месте.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {deleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="modal-panel w-full max-w-sm">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <h3 className="display-title text-lg">Удалить сообщение?</h3>
              <button
                onClick={() => setDeleteModal(null)}
                className="flex h-11 w-11 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Отмена удаления"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-300">Сообщение будет скрыто от вас и другого пользователя.</p>
            </div>
            <div className="flex justify-end gap-2 border-t border-white/10 p-5">
              <button
                onClick={() => setDeleteModal(null)}
                className="btn btn-ghost px-4 py-2 text-sm"
              >
                Отмена
              </button>
              <button
                onClick={() => handleDelete(deleteModal)}
                className="btn bg-red-600 px-4 py-2 text-sm text-white transition-colors hover:bg-red-500"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {reportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="modal-panel w-full max-w-sm">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <h3 className="display-title text-lg">Пожаловаться</h3>
              <button
                onClick={() => { setReportModal(null); setReportReason(''); setReportComment(''); }}
                className="flex h-11 w-11 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Закрыть жалобу"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 p-5">
              <div className="space-y-1">
                {REPORT_REASONS.map((r) => (
                  <label key={r} className="flex cursor-pointer items-center space-x-2 rounded-xl px-2 py-2 transition-colors hover:bg-white/5">
                    <input
                      type="radio"
                      name="reason"
                      value={r}
                      checked={reportReason === r}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="h-4 w-4 text-primary-400 focus:ring-primary-400"
                    />
                    <span className="text-sm text-slate-300">{r}</span>
                  </label>
                ))}
              </div>
              <textarea
                value={reportComment}
                onChange={(e) => setReportComment(e.target.value)}
                className="field resize-none text-sm"
                rows={2}
                placeholder="Комментарий (необязательно)"
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-white/10 p-5">
              <button
                onClick={() => { setReportModal(null); setReportReason(''); setReportComment(''); }}
                className="btn btn-ghost px-4 py-2 text-sm"
              >
                Отмена
              </button>
              <button
                onClick={handleReport}
                disabled={!reportReason}
                className="btn bg-red-600 px-4 py-2 text-sm text-white transition-colors hover:bg-red-500 disabled:opacity-50"
              >
                Отправить
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <PageShell>
          <div className="flex h-[calc(100vh-64px)] items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary-300" />
          </div>
        </PageShell>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
