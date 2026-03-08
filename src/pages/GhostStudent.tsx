import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Ghost, 
  MessageSquare, 
  Send, 
  Sparkles, 
  Loader2, 
  UserCircle, 
  Award, 
  RefreshCw,
  HelpCircle,
  Lightbulb
} from 'lucide-react';
import { ghostStudentChat } from '../services/gemini';
import { useTheme } from '../App';
import { cn } from '../lib/utils';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, arrayUnion } from 'firebase/firestore';

export default function GhostStudent() {
  const { theme } = useTheme();
  const [topic, setTopic] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [messages, setMessages] = useState<{ role: 'ghost' | 'user', content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsStarted(true);
    setLoading(true);
    try {
      const response = await ghostStudentChat(topic, "Hi Ghosty! I'm starting to study this topic.");
      setMessages([{ role: 'ghost', content: response }]);

      // Save session to Firestore
      const user = auth.currentUser;
      if (user) {
        try {
          const docRef = await addDoc(collection(db, 'users', user.uid, 'ghost_sessions'), {
            topic: topic,
            messages: [{ role: 'ghost', content: response }],
            createdAt: serverTimestamp()
          });
          setSessionId(docRef.id);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/ghost_sessions`);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const response = await ghostStudentChat(topic, userMsg);
      setMessages(prev => [...prev, { role: 'ghost', content: response }]);

      // Update session in Firestore
      const user = auth.currentUser;
      if (user && sessionId) {
        try {
          const sessionRef = doc(db, 'users', user.uid, 'ghost_sessions', sessionId);
          await updateDoc(sessionRef, {
            messages: arrayUnion(
              { role: 'user', content: userMsg },
              { role: 'ghost', content: response }
            )
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/ghost_sessions/${sessionId}`);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col space-y-8">
      <div className="text-center space-y-4 shrink-0">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn(
            "w-20 h-20 rounded-3xl flex items-center justify-center mx-auto",
            theme === 'light' ? "bg-indigo-100 text-indigo-600" : "bg-gold/10 text-gold"
          )}
        >
          <Ghost className="w-10 h-10" />
        </motion.div>
        <h1 className={cn(
          "text-4xl font-bold tracking-tight",
          theme === 'light' ? "text-primary" : "text-gold"
        )}>Ghost-Student Collaboration</h1>
        <p className={cn(
          "italic serif max-w-lg mx-auto",
          theme === 'light' ? "text-primary/60" : "text-gold/60"
        )}>
          Study with "Ghosty", an AI peer who asks doubts, gives hints, and keeps you motivated.
        </p>
      </div>

      {!isStarted ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-10 rounded-[3rem] border shadow-xl space-y-8 max-w-2xl mx-auto w-full",
            theme === 'light' ? "bg-white border-primary/10" : "bg-black border-gold/20"
          )}
        >
          <div className="space-y-4">
            <label className={cn("text-sm font-bold uppercase tracking-[0.2em]", theme === 'light' ? "text-stone-400" : "text-gold/40")}>What are we studying together?</label>
            <input 
              type="text" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Photosynthesis, Neural Networks, World War II..."
              className={cn(
                "w-full p-6 border rounded-2xl transition-all text-lg font-medium outline-none",
                theme === 'light' 
                  ? "bg-stone-50 border-stone-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-primary" 
                  : "bg-gold/5 border-gold/20 focus:ring-4 focus:ring-gold/10 focus:border-gold text-gold placeholder:text-gold/30"
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Peer Learning', icon: Ghost, color: theme === 'light' ? 'text-indigo-500' : 'text-gold' },
              { label: 'Doubt Clearing', icon: HelpCircle, color: theme === 'light' ? 'text-rose-500' : 'text-gold' },
              { label: 'Study Hints', icon: Lightbulb, color: theme === 'light' ? 'text-amber-500' : 'text-gold' },
              { label: 'Friendly Competition', icon: Award, color: theme === 'light' ? 'text-emerald-500' : 'text-gold' },
            ].map((feature) => (
              <div key={feature.label} className={cn(
                "flex items-center gap-3 p-4 rounded-xl border",
                theme === 'light' ? "bg-stone-50 border-stone-100" : "bg-gold/5 border-gold/10"
              )}>
                <feature.icon className={cn("w-5 h-5", feature.color)} />
                <span className={cn("text-sm font-bold", theme === 'light' ? "text-stone-700" : "text-gold/80")}>{feature.label}</span>
              </div>
            ))}
          </div>

          <button 
            onClick={handleStart}
            disabled={!topic.trim()}
            className={cn(
              "w-full py-5 rounded-2xl font-bold text-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg",
              theme === 'light' ? "bg-primary text-white hover:bg-primary/90" : "bg-gold text-black hover:bg-gold/90"
            )}
          >
            <Sparkles className="w-6 h-6" />
            Start Study Session
          </button>
        </motion.div>
      ) : (
        <div className={cn(
          "flex-1 rounded-[3rem] border shadow-xl flex flex-col overflow-hidden",
          theme === 'light' ? "bg-white border-primary/10" : "bg-black border-gold/20"
        )}>
          {/* Chat Header */}
          <div className={cn(
            "p-6 border-b flex items-center justify-between",
            theme === 'light' ? "bg-indigo-50/30 border-primary/5" : "bg-gold/5 border-gold/10"
          )}>
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                theme === 'light' ? "bg-indigo-100 text-indigo-600" : "bg-gold/10 text-gold"
              )}>
                <Ghost className="w-6 h-6" />
              </div>
              <div>
                <h3 className={cn("font-bold", theme === 'light' ? "text-primary" : "text-gold")}>Ghosty (AI Peer)</h3>
                <p className={cn("text-xs font-bold uppercase tracking-widest", theme === 'light' ? "text-indigo-600" : "text-gold/60")}>Studying: {topic}</p>
              </div>
            </div>
            <button 
              onClick={() => { setIsStarted(false); setMessages([]); }}
              className={cn(
                "p-2 transition-colors",
                theme === 'light' ? "text-stone-400 hover:text-indigo-600" : "text-gold/40 hover:text-gold"
              )}
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages */}
          <div 
            ref={scrollRef} 
            className={cn(
              "flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth relative",
              theme === 'light' ? "bg-[#e5ddd5]" : "bg-[#0b141a]"
            )}
            style={{
              backgroundImage: theme === 'light' 
                ? 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")'
                : 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
              backgroundBlendMode: theme === 'light' ? 'overlay' : 'soft-light',
              backgroundSize: '400px'
            }}
          >
            {messages.map((msg, i) => (
              <motion.div 
                key={`${msg.role}-${i}`}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={cn(
                  "flex flex-col max-w-[75%] relative",
                  msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                <div className={cn(
                  "px-4 py-2 rounded-2xl shadow-sm text-[15px] leading-relaxed relative",
                  msg.role === 'ghost' 
                    ? (theme === 'light' ? "bg-white text-stone-800 rounded-tl-none" : "bg-[#202c33] text-[#e9edef] rounded-tl-none")
                    : (theme === 'light' ? "bg-[#dcf8c6] text-stone-800 rounded-tr-none" : "bg-[#005c4b] text-[#e9edef] rounded-tr-none")
                )}>
                  {/* Bubble Tail */}
                  <div className={cn(
                    "absolute top-0 w-4 h-4",
                    msg.role === 'ghost' 
                      ? (theme === 'light' ? "-left-2 bg-white" : "-left-2 bg-[#202c33]")
                      : (theme === 'light' ? "-right-2 bg-[#dcf8c6]" : "-right-2 bg-[#005c4b]"),
                    "clip-path-tail"
                  )} style={{
                    clipPath: msg.role === 'ghost' 
                      ? 'polygon(100% 0, 0 0, 100% 100%)' 
                      : 'polygon(0 0, 100% 0, 0 100%)'
                  }} />
                  
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  
                  <div className={cn(
                    "text-[10px] mt-1 text-right opacity-50 font-medium",
                    msg.role === 'user' && theme === 'light' ? "text-stone-600" : ""
                  )}>
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </motion.div>
            ))}
            {loading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex mr-auto"
              >
                <div className={cn(
                  "px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5",
                  theme === 'light' ? "bg-white" : "bg-[#202c33]"
                )}>
                  <div className={cn("w-1.5 h-1.5 rounded-full animate-bounce", theme === 'light' ? "bg-stone-400" : "bg-gold/40")} />
                  <div className={cn("w-1.5 h-1.5 rounded-full animate-bounce delay-100", theme === 'light' ? "bg-stone-400" : "bg-gold/40")} />
                  <div className={cn("w-1.5 h-1.5 rounded-full animate-bounce delay-200", theme === 'light' ? "bg-stone-400" : "bg-gold/40")} />
                </div>
              </motion.div>
            )}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSend} className={cn(
            "p-4 flex gap-2 items-center",
            theme === 'light' ? "bg-[#f0f2f5]" : "bg-[#202c33]"
          )}>
            <div className="flex-1 relative">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message"
                className={cn(
                  "w-full py-3 px-6 rounded-full transition-all font-medium outline-none border-none",
                  theme === 'light' 
                    ? "bg-white text-stone-800 placeholder:text-stone-400" 
                    : "bg-[#2a3942] text-[#e9edef] placeholder:text-[#8696a0]"
                )}
              />
            </div>
            <button 
              type="submit"
              disabled={loading || !input.trim()}
              className={cn(
                "w-12 h-12 rounded-full transition-all disabled:opacity-50 flex items-center justify-center shrink-0",
                theme === 'light' ? "bg-[#00a884] text-white hover:bg-[#008f6f]" : "bg-[#00a884] text-white hover:bg-[#008f6f]"
              )}
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
