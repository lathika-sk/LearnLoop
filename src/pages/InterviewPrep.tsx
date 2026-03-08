import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BrainCircuit, MessageSquare, Terminal, Trophy, ChevronRight, Loader2, Send, User, Bot } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

interface Message {
  role: 'user' | 'bot';
  text: string;
}

export default function InterviewPrep() {
  const [mode, setMode] = useState<'menu' | 'mock' | 'aptitude'>('menu');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const startMockInterview = async () => {
    setMode('mock');
    setLoading(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "You are a technical interviewer for a top tech company. Start a mock interview for a Software Engineer role. Ask the first question.",
      });
      setMessages([{ role: 'bot', text: response.text || "Hello! Let's start the interview. Tell me about a challenging technical problem you've solved." }]);
    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { role: 'user', text: input } as Message];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: { systemInstruction: "You are a technical interviewer. Continue the mock interview based on the user's response. Be professional and challenging." }
      });
      
      // For simplicity in this demo, we'll just send the last message
      const response = await chat.sendMessage({ message: input });
      setMessages([...newMessages, { role: 'bot', text: response.text || "Interesting. Can you elaborate on that?" }]);
    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFeedback = async () => {
    setLoading(true);
    try {
      const history = messages.map(m => `${m.role}: ${m.text}`).join('\n');
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze this mock interview transcript and provide constructive feedback on technical knowledge, communication, and areas for improvement:\n\n${history}`,
      });
      setFeedback(response.text || "Great job! You showed strong technical skills.");
    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight">Interview Prep</h1>
        <p className="text-stone-500 italic serif">Sharpen your skills with AI-powered mock interviews and aptitude tests.</p>
      </div>

      <AnimatePresence mode="wait">
        {mode === 'menu' ? (
          <motion.div
            key="menu"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            <button
              onClick={startMockInterview}
              className="group p-12 bg-white rounded-[40px] border border-black/5 shadow-xl hover:shadow-2xl transition-all text-left space-y-6"
            >
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Mock Interview</h2>
                <p className="text-stone-500 text-sm leading-relaxed">
                  Practice with our AI interviewer. Get real-time questions and professional feedback on your performance.
                </p>
              </div>
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                Start Session <ChevronRight className="w-4 h-4" />
              </div>
            </button>

            <button
              onClick={() => setMode('aptitude')}
              className="group p-12 bg-stone-900 text-white rounded-[40px] border border-white/5 shadow-xl hover:shadow-2xl transition-all text-left space-y-6"
            >
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <Terminal className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Aptitude Test</h2>
                <p className="text-stone-400 text-sm leading-relaxed">
                  Challenge yourself with logical, mathematical, and technical aptitude questions designed for top companies.
                </p>
              </div>
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                Take Test <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          </motion.div>
        ) : mode === 'mock' ? (
          <motion.div
            key="mock"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-2 flex flex-col h-[600px] bg-white rounded-[40px] shadow-xl border border-black/5 overflow-hidden">
              <div className="p-6 border-b flex items-center justify-between bg-stone-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">AI Interviewer</p>
                    <p className="text-[10px] uppercase tracking-widest text-emerald-600 font-bold">Live Session</p>
                  </div>
                </div>
                <button onClick={() => setMode('menu')} className="text-xs font-bold text-stone-400 hover:text-stone-900">End Session</button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-stone-900 text-white rounded-tr-none' 
                        : 'bg-stone-100 text-stone-800 rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-stone-100 p-4 rounded-2xl rounded-tl-none">
                      <Loader2 className="w-4 h-4 animate-spin text-stone-400" />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t bg-stone-50">
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type your response..."
                    className="flex-1 bg-white border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    onClick={sendMessage}
                    className="p-3 bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition-all"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <section className="bg-stone-900 text-white p-8 rounded-[40px] shadow-xl">
                <div className="flex items-center gap-2 mb-6">
                  <Trophy className="w-6 h-6 text-amber-400" />
                  <h2 className="text-xl font-bold">Performance</h2>
                </div>
                <button
                  onClick={getFeedback}
                  disabled={loading || messages.length < 2}
                  className="w-full py-4 bg-white text-black rounded-2xl font-bold text-sm hover:scale-[1.02] transition-all disabled:opacity-50"
                >
                  Get Instant Feedback
                </button>
                {feedback && (
                  <div className="mt-6 p-6 bg-white/5 rounded-2xl border border-white/10 text-xs leading-relaxed text-stone-300">
                    {feedback}
                  </div>
                )}
              </section>

              <section className="bg-white p-8 rounded-[40px] shadow-xl border border-black/5">
                <h3 className="font-bold mb-4">Interview Tips</h3>
                <ul className="space-y-3 text-sm text-stone-500">
                  <li className="flex gap-2">
                    <ChevronRight className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    Use the STAR method for behavioral questions.
                  </li>
                  <li className="flex gap-2">
                    <ChevronRight className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    Explain your thought process clearly.
                  </li>
                  <li className="flex gap-2">
                    <ChevronRight className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    Don't be afraid to ask clarifying questions.
                  </li>
                </ul>
              </section>
            </div>
          </motion.div>
        ) : (
          <div className="h-[600px] flex flex-col items-center justify-center text-center p-12 bg-white rounded-[40px] border border-black/5 shadow-xl">
            <Terminal className="w-16 h-16 text-stone-300 mb-4" />
            <h3 className="text-2xl font-bold">Aptitude Test Coming Soon</h3>
            <p className="text-stone-500 mt-2">We're curating the best questions for you.</p>
            <button onClick={() => setMode('menu')} className="mt-8 text-emerald-600 font-bold">Back to Menu</button>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
