import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smile, 
  Sparkles, 
  Search, 
  Loader2, 
  RefreshCw, 
  Share2, 
  Download, 
  BrainCircuit,
  Award
} from 'lucide-react';
import { generateMeme } from '../services/gemini';
import confetti from 'canvas-confetti';
import { useTheme } from '../App';
import { cn } from '../lib/utils';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function Memeifier() {
  const { theme } = useTheme();
  const [concept, setConcept] = useState('');
  const [loading, setLoading] = useState(false);
  const [meme, setMeme] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMemeify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept.trim()) return;

    setLoading(true);
    setError(null);
    setMeme(null);

    try {
      const response = await generateMeme(concept);
      setMeme(response);

      // Save to Firestore
      const user = auth.currentUser;
      if (user) {
        try {
          await addDoc(collection(db, 'users', user.uid, 'memes'), {
            concept: concept,
            meme: response,
            createdAt: serverTimestamp()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/memes`);
        }
      }

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00FF00', '#000000', '#FFFFFF']
      });
    } catch (err) {
      console.error(err);
      setError("Failed to meme-ify. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border-4 border-black dark:border-gold overflow-hidden bg-white dark:bg-black">
        {/* Left Column: Input */}
        <div className="lg:col-span-5 p-12 border-b-4 lg:border-b-0 lg:border-r-4 border-black dark:border-gold space-y-12">
          <div className="space-y-4">
            <div className="text-6xl font-black uppercase tracking-tighter leading-none">
              01<br />
              <span className="text-2xl">Concept</span>
            </div>
            <p className="font-mono text-sm uppercase tracking-widest opacity-60">
              Input any complex academic theory or concept.
            </p>
          </div>

          <form onSubmit={handleMemeify} className="space-y-8">
            <div className="space-y-4">
              <input 
                type="text" 
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="RECURSION..."
                className={cn(
                  "w-full p-6 border-4 border-black dark:border-gold rounded-none text-2xl font-black uppercase outline-none transition-all",
                  theme === 'light' 
                    ? "bg-white focus:bg-black focus:text-white" 
                    : "bg-black focus:bg-gold focus:text-black"
                )}
              />
            </div>
            <button 
              type="submit"
              disabled={loading || !concept.trim()}
              className={cn(
                "w-full py-8 border-4 border-black dark:border-gold rounded-none font-black text-3xl uppercase tracking-tighter transition-all flex items-center justify-center gap-4",
                theme === 'light' 
                  ? "bg-[#00FF00] hover:bg-black hover:text-[#00FF00]" 
                  : "bg-gold hover:bg-white hover:text-black"
              )}
            >
              {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Sparkles className="w-8 h-8" />}
              Meme-ify
            </button>
          </form>

          <div className="pt-12 border-t-4 border-black dark:border-gold space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 border-2 border-black dark:border-gold flex items-center justify-center font-black">?</div>
              <p className="text-xs font-mono uppercase leading-tight">
                Humor is the ultimate memory hack. We turn dry logic into spicy memes.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Result */}
        <div className="lg:col-span-7 bg-[#F0F0F0] dark:bg-zinc-900 relative min-h-[600px] flex flex-col">
          <div className="absolute top-0 left-0 w-full h-12 border-b-4 border-black dark:border-gold flex items-center px-6 font-mono text-xs uppercase tracking-widest">
            Output_Stream // Memory_Retention_Active
          </div>

          <div className="flex-1 flex items-center justify-center p-12">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.2 }}
                  className="text-center space-y-8"
                >
                  <div className="text-8xl font-black animate-bounce">LOL</div>
                  <p className="font-mono text-xl uppercase tracking-tighter">Generating Brain-Rot...</p>
                </motion.div>
              ) : meme ? (
                <motion.div 
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full space-y-12"
                >
                  <div className="bg-white dark:bg-black border-4 border-black dark:border-gold p-12 shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] dark:shadow-[20px_20px_0px_0px_rgba(212,175,55,1)]">
                    <p className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none break-words">
                      {meme}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <button className="px-8 py-4 border-4 border-black dark:border-gold bg-white dark:bg-black font-black uppercase tracking-tighter hover:bg-black hover:text-white dark:hover:bg-gold dark:hover:text-black transition-all">
                      Share
                    </button>
                    <button className="px-8 py-4 border-4 border-black dark:border-gold bg-white dark:bg-black font-black uppercase tracking-tighter hover:bg-black hover:text-white dark:hover:bg-gold dark:hover:text-black transition-all">
                      Download
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="text-center opacity-10 space-y-4">
                  <Smile className="w-48 h-48 mx-auto" />
                  <p className="text-4xl font-black uppercase">Awaiting Input</p>
                </div>
              )}
            </AnimatePresence>
          </div>

          <div className="h-24 border-t-4 border-black dark:border-gold flex items-center justify-between px-12 overflow-hidden">
            <div className="flex gap-8 animate-marquee whitespace-nowrap font-black uppercase text-2xl">
              <span>Memory Boost +40%</span>
              <span>•</span>
              <span>Dopamine Spike Detected</span>
              <span>•</span>
              <span>Study Harder Laugh Louder</span>
              <span>•</span>
              <span>Memory Boost +40%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
