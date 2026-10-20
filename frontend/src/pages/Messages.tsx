import { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Send, MessageSquare, ArrowLeft, Search } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import Avatar from '../components/Avatar';
import CropThumb from '../components/CropThumb';

interface ApiCommitment {
  id: number;
  demand?: {
    crop?: { cropName: string };
    buyer?: { user?: { id: number; name: string } };
  };
  farmer?: { user?: { id: number; name: string } };
}

interface Message {
  id: number;
  content: string;
  senderId: number;
  createdAt: string;
}

export default function Messages() {
  const { user } = useAuth();
  const [commitments, setCommitments] = useState<ApiCommitment[]>([]);
  const [selected, setSelected] = useState<ApiCommitment | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [query, setQuery] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    api.get('/commitments').then(r => setCommitments(r.data)).catch(() => {});
  }, []);

  const loadMessages = (commitmentId: number) => {
    api.get(`/messages/${commitmentId}`).then(r => setMessages(r.data)).catch(() => {});
  };

  useEffect(() => {
    if (!selected) return;
    loadMessages(selected.id);
    pollRef.current = setInterval(() => loadMessages(selected.id), 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selected]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelect = (c: ApiCommitment) => {
    if (pollRef.current) clearInterval(pollRef.current);
    setMessages([]);
    setSelected(c);
  };

  const handleSend = async () => {
    if (!content.trim() || !selected) return;
    setSending(true);
    try {
      await api.post(`/messages/${selected.id}`, { content: content.trim() });
      setContent('');
      loadMessages(selected.id);
    } catch {}
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // Get the name of the other party in the conversation
  const otherPartyName = (c: ApiCommitment) => {
    if (user?.role === 'farmer') {
      return c.demand?.buyer?.user?.name ?? 'Buyer';
    }
    return c.farmer?.user?.name ?? 'Farmer';
  };

  const cropName = (c: ApiCommitment) => c.demand?.crop?.cropName ?? 'Commitment';

  const visible = query
    ? commitments.filter(c => `${otherPartyName(c)} ${cropName(c)}`.toLowerCase().includes(query.toLowerCase()))
    : commitments;

  return (
    <div>
      <PageHeader title="Messages" subtitle="Coordinate deliveries with the people on the other side of each order." />

      <div className="card flex overflow-hidden" style={{ height: 'min(72vh, 720px)' }}>

        {/* Conversation list */}
        <div className={`${selected ? 'hidden md:flex' : 'flex'} w-full shrink-0 flex-col border-r border-gray-100 md:w-80`}>
          <div className="border-b border-gray-100 p-3">
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search conversations"
                className="input h-9 pl-9" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {commitments.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
                <MessageSquare size={26} className="text-gray-300" />
                <p className="text-sm text-gray-500">No conversations yet</p>
              </div>
            )}
            {visible.map(c => (
              <button
                key={c.id}
                onClick={() => handleSelect(c)}
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors ${selected?.id === c.id ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
              >
                <div className="relative shrink-0">
                  <Avatar name={otherPartyName(c)} size={42} />
                  <span className="absolute -bottom-0.5 -right-0.5">
                    <CropThumb name={cropName(c)} size={18} rounded="full" className={`ring-2 ${selected?.id === c.id ? 'ring-gray-100' : 'ring-white'}`} />
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">{otherPartyName(c)}</p>
                  <p className="truncate text-xs text-gray-500">{cropName(c)} · #{c.id}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        {!selected ? (
          <div className="hidden flex-1 flex-col items-center justify-center gap-3 bg-gray-50/60 px-8 text-center md:flex">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-500"><MessageSquare size={20} /></span>
            <p className="font-semibold text-gray-900">Your conversations</p>
            <p className="max-w-xs text-sm text-gray-500">Select a conversation to start messaging about an order.</p>
          </div>
        ) : (
          <div className="flex min-w-0 flex-1 flex-col">
            {/* Chat header */}
            <div className="flex h-16 shrink-0 items-center gap-3 border-b border-gray-100 px-4 sm:px-5">
              <button onClick={() => setSelected(null)} className="-ml-1 rounded-full p-2 text-gray-500 hover:bg-gray-100 md:hidden" aria-label="Back to conversations">
                <ArrowLeft size={18} />
              </button>
              <Avatar name={otherPartyName(selected)} size={38} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold leading-tight text-gray-900">{otherPartyName(selected)}</p>
                <p className="truncate text-xs text-gray-500">{cropName(selected)} · Commitment #{selected.id}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-gray-50/60 px-4 py-5 sm:px-6">
              {messages.length === 0 && (
                <p className="m-auto text-sm text-gray-400">No messages yet. Say hello.</p>
              )}
              {messages.map(m => {
                const isMine = m.senderId === user?.id;
                return (
                  <div key={m.id} className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                    {!isMine && <Avatar name={otherPartyName(selected)} size={26} />}
                    <div className="max-w-[75%]">
                      <div
                        className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${isMine ? 'rounded-br-sm bg-forest-800 text-white' : 'rounded-bl-sm border border-gray-200 bg-white text-gray-800'}`}
                      >
                        {m.content}
                      </div>
                      <p className={`mt-1 text-[10px] text-gray-400 ${isMine ? 'text-right' : 'text-left'}`}>
                        {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="flex shrink-0 items-center gap-2 border-t border-gray-100 p-3">
              <input
                value={content}
                onChange={e => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="input h-10 flex-1"
              />
              <button
                onClick={handleSend}
                disabled={!content.trim() || sending}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-forest-800 text-white transition-colors hover:bg-forest-700 disabled:opacity-40"
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
