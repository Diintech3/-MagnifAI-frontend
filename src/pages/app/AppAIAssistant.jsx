import { useState, useRef, useEffect } from "react";
import { LuBot, LuSend, LuUser, LuSparkles, LuTrash2 } from "react-icons/lu";
import { useAuth } from "../../auth/AuthProvider";
import { toastFromError } from "../../lib/toast";

const SUGGESTIONS = [
  "Write a campaign speech for upcoming elections",
  "Create a social media post about development work",
  "Draft a press release for a new initiative",
  "Suggest hashtags for my political campaign",
];

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white shadow ${isUser ? "bg-indigo-600" : "bg-gradient-to-br from-violet-500 to-indigo-600"}`}>
        {isUser ? <LuUser className="h-4 w-4" /> : <LuBot className="h-4 w-4" />}
      </span>
      <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${isUser ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-white border border-slate-100 text-slate-800 shadow-sm rounded-tl-sm"}`}>
        {msg.content}
      </div>
    </div>
  );
}

export function AppAIAssistant() {
  const { token } = useAuth();
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! I'm HelloPaai, your AI assistant. I can help you write campaign speeches, social media posts, press releases, and more. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text) {
    const userMsg = text || input.trim();
    if (!userMsg) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      const res = await fetch("/api/app/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: userMsg, history: messages }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply || "Sorry, I couldn't process that." }]);
    } catch (e) {
      toastFromError(e, "Failed to get response");
      setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] p-4 sm:p-6 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow">
            <LuSparkles className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div>
            <h2 className="text-xl font-bold text-slate-900">HelloPaai</h2>
            <p className="text-sm text-slate-500">Your AI Campaign Assistant</p>
          </div>
        </div>
        <button onClick={() => setMessages([{ role: "assistant", content: "Hello! I'm HelloPaai, your AI assistant. How can I help you today?" }])}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">
          <LuTrash2 className="h-3.5 w-3.5" /> Clear
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-4">
        {messages.map((msg, i) => <Message key={i} msg={msg} />)}
        {loading && (
          <div className="flex gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow">
              <LuBot className="h-4 w-4" />
            </span>
            <div className="rounded-2xl rounded-tl-sm border border-slate-100 bg-white px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center h-5">
                {[0,1,2].map(i => <span key={i} className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => send(s)}
              className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Ask HelloPaai anything…"
          disabled={loading}
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60"
        />
        <button onClick={() => send()} disabled={loading || !input.trim()}
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition shadow">
          <LuSend className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
