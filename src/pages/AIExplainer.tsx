import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Lightbulb, 
  Image as ImageIcon,
  Smile,
  Award,
  Loader2,
  BrainCircuit,
  Share2
} from 'lucide-react';
import { explainConcept, generateDiagram } from '../services/gemini';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import ReactMarkdown from 'react-markdown';
import confetti from 'canvas-confetti';
import { useTheme } from '../App';
import { cn } from '../lib/utils';

export default function AIExplainer() {
  const { theme } = useTheme();
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [diagram, setDiagram] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentTopicId, setCurrentTopicId] = useState<string | null>(null);
  const [isMastered, setIsMastered] = useState(false);

  const handleExplain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setDiagram(null);
    setIsMastered(false);

    try {
      const explanation = await explainConcept(topic);
      setResult(explanation);
      
      // Generate diagram in background
      generateDiagram(explanation.diagramPrompt).then(setDiagram);

      // Save to Firestore
      const user = auth.currentUser;
      if (user) {
        try {
          const docRef = await addDoc(collection(db, 'users', user.uid, 'topics'), {
            userId: user.uid,
            topic: topic,
            explanation: explanation.definition,
            examples: explanation.examples,
            memeExplanation: explanation.memeSummary,
            diagramPrompt: explanation.diagramPrompt,
            createdAt: serverTimestamp(),
            completed: false
          });
          setCurrentTopicId(docRef.id);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/topics`);
        }
      }
      
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: theme === 'light' ? ['#0A192F', '#1E3A8A', '#3B82F6'] : ['#D4AF37', '#F59E0B', '#B45309']
      });
    } catch (err) {
      console.error(err);
      setError("Failed to generate explanation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsMastered = async () => {
    const user = auth.currentUser;
    if (!user || !currentTopicId || isMastered) return;

    try {
      // Update topic status
      const topicRef = doc(db, 'users', user.uid, 'topics', currentTopicId);
      await updateDoc(topicRef, { completed: true });

      // Create certificate
      await addDoc(collection(db, 'users', user.uid, 'certificates'), {
        topic: topic,
        earnedAt: serverTimestamp(),
        type: 'Mastery'
      });

      setIsMastered(true);
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.6 },
        colors: theme === 'light' ? ['#0A192F', '#D4AF37'] : ['#D4AF37', '#FFFFFF']
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/topics/${currentTopicId}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn(
            "w-20 h-20 rounded-3xl flex items-center justify-center mx-auto",
            theme === 'light' ? "bg-primary/5" : "bg-gold/10"
          )}
        >
          <BookOpen className={cn("w-10 h-10", theme === 'light' ? "text-primary" : "text-gold")} />
        </motion.div>
        <h1 className={cn(
          "text-4xl font-bold tracking-tight",
          theme === 'light' ? "text-primary" : "text-gold"
        )}>AI Study Explainer</h1>
        <p className={cn(
          "italic serif max-w-lg mx-auto opacity-60",
          theme === 'light' ? "text-primary" : "text-gold"
        )}>
          Enter any complex topic, and I'll break it down into simple English with real-world examples.
        </p>
      </div>

      <form onSubmit={handleExplain} className="relative group">
        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
          <Search className={cn(
            "w-6 h-6 transition-colors",
            theme === 'light' ? "text-primary/20 group-focus-within:text-primary" : "text-gold/20 group-focus-within:text-gold"
          )} />
        </div>
        <input 
          type="text" 
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g., Binary Search Tree, Quantum Entanglement, Photosynthesis..."
          className={cn(
            "w-full pl-16 pr-32 py-6 border rounded-3xl shadow-xl transition-all text-lg font-medium outline-none",
            theme === 'light' 
              ? "bg-white border-primary/10 focus:ring-4 focus:ring-primary/5 focus:border-primary" 
              : "bg-gold/5 border-gold/20 focus:ring-4 focus:ring-gold/10 focus:border-gold text-gold placeholder:text-gold/30"
          )}
        />
        <button 
          type="submit"
          disabled={loading || !topic.trim()}
          className={cn(
            "absolute right-4 top-4 bottom-4 px-8 rounded-2xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2",
            theme === 'light' ? "bg-primary text-white hover:bg-primary/90" : "bg-gold text-black hover:bg-gold/90"
          )}
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          Explain
        </button>
      </form>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-20 space-y-6"
          >
            <div className="relative w-24 h-24 mx-auto">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className={cn("absolute inset-0 border-4 rounded-full opacity-20", theme === 'light' ? "border-primary" : "border-gold")}
              />
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                className={cn("absolute inset-0 border-t-4 rounded-full", theme === 'light' ? "border-primary" : "border-gold")}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <BrainCircuit className={cn("w-8 h-8", theme === 'light' ? "text-primary" : "text-gold")} />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xl font-bold">Consulting the AI Oracle...</p>
              <p className="opacity-60 italic serif">Simplifying complex concepts just for you.</p>
            </div>
          </motion.div>
        )}

        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Definition Section */}
            <section className={cn(
              "p-10 rounded-[3rem] border shadow-xl relative overflow-hidden",
              theme === 'light' ? "bg-white border-primary/10" : "bg-gold/5 border-gold/20"
            )}>
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <BookOpen className="w-40 h-40" />
              </div>
              <div className="relative z-10 space-y-6">
                <div className={cn("flex items-center gap-3", theme === 'light' ? "text-primary" : "text-gold")}>
                  <Lightbulb className="w-6 h-6" />
                  <h2 className="text-sm font-bold uppercase tracking-[0.2em]">The Concept</h2>
                </div>
                <h3 className="text-3xl font-bold leading-tight">{topic}</h3>
                <div className="prose prose-stone max-w-none opacity-80 leading-relaxed text-lg italic serif">
                  <ReactMarkdown>{result.definition}</ReactMarkdown>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Steps Section */}
              <section className={cn(
                "p-10 rounded-[3rem] shadow-xl space-y-6",
                theme === 'light' ? "bg-primary text-white" : "bg-gold text-black"
              )}>
                <div className={cn("flex items-center gap-3 opacity-60")}>
                  <CheckCircle2 className="w-6 h-6" />
                  <h2 className="text-sm font-bold uppercase tracking-[0.2em]">Step-by-Step</h2>
                </div>
                <div className="space-y-6">
                  {result.steps.map((step: string, i: number) => (
                    <div key={i} className="flex gap-4">
                      <span className="font-mono font-bold opacity-40">0{i + 1}</span>
                      <p className="font-medium leading-relaxed opacity-90">{step}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Meme Section */}
              <section className={cn(
                "p-10 rounded-[3rem] border shadow-xl space-y-6",
                theme === 'light' ? "bg-stone-50 border-stone-100" : "bg-gold/10 border-gold/20"
              )}>
                <div className={cn("flex items-center gap-3", theme === 'light' ? "text-primary" : "text-gold")}>
                  <Smile className="w-6 h-6" />
                  <h2 className="text-sm font-bold uppercase tracking-[0.2em]">Meme-ified</h2>
                </div>
                <div className={cn(
                  "p-6 rounded-2xl border-2 shadow-inner",
                  theme === 'light' ? "bg-white border-primary/10" : "bg-black/20 border-gold/20"
                )}>
                  <p className="text-2xl font-black uppercase tracking-tight text-center leading-none">
                    {result.memeSummary}
                  </p>
                </div>
                <p className="text-xs text-center font-mono uppercase tracking-widest opacity-40">
                  Memory Retention Boost: +40%
                </p>
              </section>
            </div>

            {/* Examples Section */}
            <section className={cn(
              "p-10 rounded-[3rem] border shadow-xl space-y-8",
              theme === 'light' ? "bg-white border-primary/10" : "bg-gold/5 border-gold/20"
            )}>
              <div className={cn("flex items-center gap-3", theme === 'light' ? "text-primary" : "text-gold")}>
                <Sparkles className="w-6 h-6" />
                <h2 className="text-sm font-bold uppercase tracking-[0.2em]">Real-World Examples</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {result.examples.map((example: string, i: number) => (
                  <div key={i} className={cn(
                    "p-6 rounded-2xl border transition-colors",
                    theme === 'light' ? "bg-stone-50 border-stone-100 hover:bg-primary/5" : "bg-gold/5 border-gold/10 hover:bg-gold/10"
                  )}>
                    <p className="font-medium italic serif leading-relaxed opacity-80">
                      "{example}"
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Diagram Section */}
            <section className={cn(
              "p-10 rounded-[3rem] shadow-xl space-y-8",
              theme === 'light' ? "bg-primary text-white" : "bg-black border border-gold/20"
            )}>
              <div className="flex items-center justify-between">
                <div className={cn("flex items-center gap-3", theme === 'light' ? "text-white/60" : "text-gold/60")}>
                  <ImageIcon className="w-6 h-6" />
                  <h2 className="text-sm font-bold uppercase tracking-[0.2em]">Visual Diagram</h2>
                </div>
                {!diagram && (
                  <div className="flex items-center gap-2 text-xs font-mono opacity-40">
                    <Loader2 className="w-3 h-3 animate-spin" /> Generating...
                  </div>
                )}
              </div>
              <div className={cn(
                "aspect-video rounded-2xl overflow-hidden flex items-center justify-center relative group",
                theme === 'light' ? "bg-white/5" : "bg-gold/5"
              )}>
                {diagram ? (
                  <img src={diagram} alt="Concept Diagram" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="text-center space-y-4">
                    <ImageIcon className="w-12 h-12 opacity-10 mx-auto" />
                    <p className="opacity-20 text-sm font-mono tracking-widest uppercase">Visualizing Logic...</p>
                  </div>
                )}
              </div>
              <p className="text-xs opacity-40 text-center italic serif">
                AI-generated visualization based on: "{result.diagramPrompt}"
              </p>
            </section>

            {/* Completion Action */}
            <div className="flex flex-col items-center gap-6 pt-8">
              <button 
                onClick={handleMarkAsMastered}
                disabled={isMastered}
                className={cn(
                  "px-12 py-5 rounded-full font-bold text-xl shadow-2xl transition-all flex items-center gap-3",
                  isMastered 
                    ? "bg-stone-400 cursor-not-allowed opacity-50" 
                    : theme === 'light' 
                      ? "bg-primary text-white shadow-primary/20 hover:scale-105" 
                      : "bg-gold text-black shadow-gold/20 hover:scale-105"
                )}
              >
                <Award className="w-6 h-6" />
                {isMastered ? 'Mastered!' : 'Mark as Mastered'}
              </button>

              <div className={cn(
                "p-6 rounded-2xl border shadow-sm flex items-center gap-4 max-w-md w-full",
                theme === 'light' ? "bg-white border-primary/10" : "bg-gold/5 border-gold/20"
              )}>
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                  theme === 'light' ? "bg-primary/5" : "bg-gold/10"
                )}>
                  <Share2 className={cn("w-5 h-5", theme === 'light' ? "text-primary" : "text-gold")} />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold">LinkedIn Network Automator</h4>
                  <p className="text-xs opacity-40 italic serif">Connect with experts in {topic}.</p>
                </div>
                <button 
                  onClick={() => {
                    const msg = `Hi, I just finished studying ${topic} on LearnLoop and I'm looking to connect with experts like you to learn more about your work in this field!`;
                    navigator.clipboard.writeText(msg);
                    alert("Personalized LinkedIn message copied to clipboard!");
                  }}
                  className={cn(
                    "px-4 py-2 text-xs font-bold rounded-lg transition-colors",
                    theme === 'light' ? "bg-primary text-white hover:bg-primary/90" : "bg-gold text-black hover:bg-gold/90"
                  )}
                >
                  Generate
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
