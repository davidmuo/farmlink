import { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Send, MessageSquare } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

const GREEN = '#6DFF8A';

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

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: "'Syne', sans-serif" }}>
        Messages
      </h1>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden flex" style={{ height: '70vh' }}>

        {/* Conversation list */}
        <div className="w-72 shrink-0 border-r border-gray-100 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Conversations</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {commitments.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-2 px-6 text-center">
                <MessageSquare size={28} className="text-gray-200" />
                <p className="text-sm text-gray-400">No conversations yet</p>
              </div>
            )}
            {commitments.map(c => (
              <button
                key={c.id}
                onClick={() => handleSelect(c)}
                className={`w-full text-left px-4 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition-colors ${selected?.id === c.id ? 'bg-gray-50' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ fontFamily: "'Syne', sans-serif" }}>
                    {otherPartyName(c).charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{cropName(c)}</p>
                    <p className="text-xs text-gray-400 truncate">{otherPartyName(c)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8">
            <MessageSquare size={36} className="text-gray-200" />
            <p className="text-sm text-gray-400">Select a conversation to start messaging</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-w-0">
            {/* Chat header */}
            <div className="h-14 flex items-center px-5 border-b border-gray-100 shrink-0 gap-3">
              <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ fontFamily: "'Syne', sans-serif" }}>
                {otherPartyName(selected).charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 leading-tight">{cropName(selected)}</p>
                <p className="text-xs text-gray-400">{otherPartyName(selected)}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2.5">
              {messages.map(m => {
                const isMine = m.senderId === user?.id;
                return (
                  <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[70%]">
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm ${isMine ? 'rounded-br-md' : 'bg-gray-100 text-gray-800 rounded-bl-md'}`}
                        style={isMine ? { background: GREEN, color: '#111827' } : {}}
                      >
                        {m.content}
                      </div>
                      <p className={`text-[10px] text-gray-300 mt-1 ${isMine ? 'text-right' : 'text-left'}`}>
                        {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-5 py-4 border-t border-gray-100 flex items-center gap-3 shrink-0">
              <input
                value={content}
                onChange={e => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2.5 text-sm bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 transition"
              />
              <button
                onClick={handleSend}
                disabled={!content.trim() || sending}
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-opacity disabled:opacity-40"
                style={{ background: GREEN }}
              >
                <Send size={14} className="text-gray-900" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
