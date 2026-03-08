import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BrainCircuit, 
  MessageSquare, 
  Send, 
  Sparkles, 
  Loader2, 
  UserCircle, 
  Award, 
  RefreshCw,
  XCircle,
  CheckCircle2
} from 'lucide-react';
import { interviewSimulation } from '../services/gemini';
import { useTheme } from '../App';
import { cn } from '../lib/utils';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, arrayUnion } from 'firebase/firestore';

export default function InterviewParadox() {
  const { theme } = useTheme();
  const [topic, setTopic] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [messages, setMessages] = useState<{ role: 'ai' | 'user', content: string }[]>([]);
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
      const response = await interviewSimulation(topic, []);
      setMessages([{ role: 'ai', content: response }]);

      // Save session to Firestore
      const user = auth.currentUser;
      if (user) {
        try {
          const docRef = await addDoc(collection(db, 'users', user.uid, 'interview_sessions'), {
            topic: topic,
            messages: [{ role: 'ai', content: response }],
            createdAt: serverTimestamp()
          });
          setSessionId(docRef.id);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/interview_sessions`);
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
      const response = await interviewSimulation(topic, [...messages, { role: 'user', content: userMsg }]);
      setMessages(prev => [...prev, { role: 'ai', content: response }]);

      // Update session in Firestore
      const user = auth.currentUser;
      if (user && sessionId) {
        try {
          const sessionRef = doc(db, 'users', user.uid, 'interview_sessions', sessionId);
          await updateDoc(sessionRef, {
            messages: arrayUnion(
              { role: 'user', content: userMsg },
              { role: 'ai', content: response }
            )
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/interview_sessions/${sessionId}`);
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
            theme === 'light' ? "bg-primary/5" : "bg-gold/10"
          )}
        >
          <BrainCircuit className={cn("w-10 h-10", theme === 'light' ? "text-primary" : "text-gold")} />
        </motion.div>
        <h1 className={cn(
          "text-4xl font-bold tracking-tight",
          theme === 'light' ? "text-primary" : "text-gold"
        )}>Interview Paradox</h1>
        <p className={cn(
          "italic serif max-w-lg mx-auto opacity-60",
          theme === 'light' ? "text-primary" : "text-gold"
        )}>
          Simulate tricky technical interviews from top companies. Test your deep understanding.
        </p>
      </div>

      {!isStarted ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-10 rounded-[3rem] border shadow-xl space-y-8 max-w-2xl mx-auto w-full",
            theme === 'light' ? "bg-white border-primary/10" : "bg-gold/5 border-gold/20"
          )}
        >
          <div className="space-y-4">
            <label className={cn("text-sm font-bold uppercase tracking-[0.2em] opacity-60", theme === 'light' ? "text-primary" : "text-gold")}>What topic are we interviewing for?</label>
            <input 
              type="text" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., React Lifecycle, SQL Optimization, Sorting Algorithms..."
              className={cn(
                "w-full p-6 border rounded-2xl transition-all text-lg font-medium outline-none",
                theme === 'light' 
                  ? "bg-stone-50 border-stone-200 focus:ring-4 focus:ring-primary/5 focus:border-primary text-stone-800" 
                  : "bg-black/20 border-gold/20 focus:ring-4 focus:ring-gold/10 focus:border-gold text-gold placeholder:text-gold/30"
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Strict Mode', icon: XCircle, color: theme === 'light' ? 'text-rose-500' : 'text-rose-400' },
              { label: 'Deep Logic', icon: BrainCircuit, color: theme === 'light' ? 'text-indigo-500' : 'text-indigo-400' },
              { label: 'Cross-Questioning', icon: RefreshCw, color: theme === 'light' ? 'text-amber-500' : 'text-amber-400' },
              { label: 'Real Feedback', icon: CheckCircle2, color: theme === 'light' ? 'text-emerald-500' : 'text-emerald-400' },
            ].map((feature) => (
              <div key={feature.label} className={cn(
                "flex items-center gap-3 p-4 rounded-xl border",
                theme === 'light' ? "bg-stone-50 border-stone-100" : "bg-black/20 border-gold/10"
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
            Start Mock Interview
          </button>
        </motion.div>
      ) : (
        <div className={cn(
          "flex-1 rounded-[3rem] border shadow-xl flex flex-col overflow-hidden",
          theme === 'light' ? "bg-white border-primary/10" : "bg-gold/5 border-gold/20"
        )}>
          {/* Chat Header */}
          <div className={cn(
            "p-6 border-b flex items-center justify-between",
            theme === 'light' ? "bg-primary/5 border-primary/10" : "bg-gold/10 border-gold/10"
          )}>
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                theme === 'light' ? "bg-primary/10" : "bg-gold/20"
              )}>
                <BrainCircuit className={cn("w-6 h-6", theme === 'light' ? "text-primary" : "text-gold")} />
              </div>
              <div>
                <h3 className={cn("font-bold", theme === 'light' ? "text-primary" : "text-gold")}>Interviewer: AI Architect</h3>
                <p className={cn("text-xs font-bold uppercase tracking-widest", theme === 'light' ? "text-primary/60" : "text-gold/60")}>Topic: {topic}</p>
              </div>
            </div>
            <button 
              onClick={() => { setIsStarted(false); setMessages([]); }}
              className={cn("p-2 transition-colors", theme === 'light' ? "text-primary/40 hover:text-primary" : "text-gold/40 hover:text-gold")}
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth">
            {messages.map((msg, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: msg.role === 'ai' ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "flex gap-4 max-w-[85%]",
                  msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                  msg.role === 'ai' 
                    ? (theme === 'light' ? "bg-primary text-white" : "bg-gold text-black")
                    : (theme === 'light' ? "bg-stone-900 text-white" : "bg-white text-black")
                )}>
                  {msg.role === 'ai' ? <BrainCircuit className="w-5 h-5" /> : <UserCircle className="w-5 h-5" />}
                </div>
                <div className={cn(
                  "p-6 rounded-[2rem] shadow-sm leading-relaxed italic serif",
                  msg.role === 'ai' 
                    ? (theme === 'light' ? "bg-stone-50 text-stone-800 rounded-tl-none border border-stone-100" : "bg-black/40 text-gold/90 rounded-tl-none border border-gold/10")
                    : (theme === 'light' ? "bg-stone-900 text-white rounded-tr-none" : "bg-gold text-black rounded-tr-none")
                )}>
                  {msg.content}
                </div>
              </motion.div>
            ))}
            {loading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-4 mr-auto"
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 animate-pulse",
                  theme === 'light' ? "bg-primary text-white" : "bg-gold text-black"
                )}>
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <div className={cn(
                  "p-6 rounded-[2rem] rounded-tl-none border flex items-center gap-2",
                  theme === 'light' ? "bg-stone-50 border-stone-100" : "bg-black/40 border-gold/10"
                )}>
                  <div className={cn("w-2 h-2 rounded-full animate-bounce", theme === 'light' ? "bg-primary/40" : "bg-gold/40")} />
                  <div className={cn("w-2 h-2 rounded-full animate-bounce delay-100", theme === 'light' ? "bg-primary/40" : "bg-gold/40")} />
                  <div className={cn("w-2 h-2 rounded-full animate-bounce delay-200", theme === 'light' ? "bg-primary/40" : "bg-gold/40")} />
                </div>
              </motion.div>
            )}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSend} className={cn(
            "p-6 border-t flex gap-4",
            theme === 'light' ? "bg-stone-50 border-primary/10" : "bg-black/20 border-gold/10"
          )}>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your answer here..."
              className={cn(
                "flex-1 p-4 border rounded-2xl transition-all font-medium outline-none",
                theme === 'light' 
                  ? "bg-white border-stone-200 focus:ring-4 focus:ring-primary/5 focus:border-primary text-stone-800" 
                  : "bg-black/40 border-gold/20 focus:ring-4 focus:ring-gold/10 focus:border-gold text-gold placeholder:text-gold/30"
              )}
            />
            <button 
              type="submit"
              disabled={loading || !input.trim()}
              className={cn(
                "p-4 rounded-2xl transition-all disabled:opacity-50 shadow-lg",
                theme === 'light' ? "bg-primary text-white hover:bg-primary/90" : "bg-gold text-black hover:bg-gold/90"
              )}
            >
              <Send className="w-6 h-6" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
