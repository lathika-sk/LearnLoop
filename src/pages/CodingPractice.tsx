import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Code2, 
  Terminal, 
  Play, 
  CheckCircle2, 
  Award, 
  ArrowRight, 
  BrainCircuit, 
  Sparkles,
  ChevronRight,
  Lock,
  RefreshCw,
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTheme } from '../App';
import { cn } from '../lib/utils';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const PROBLEMS = [
  {
    id: 1,
    title: "Reverse a String",
    difficulty: "Easy",
    xp: 50,
    description: "Write a function that reverses a given string.",
    starterCode: "function reverseString(str) {\n  // Your code here\n}",
    testCase: "reverseString('hello') === 'olleh'"
  },
  {
    id: 2,
    title: "Find Maximum in Array",
    difficulty: "Easy",
    xp: 50,
    description: "Write a function that returns the largest number in an array.",
    starterCode: "function findMax(arr) {\n  // Your code here\n}",
    testCase: "findMax([1, 5, 3]) === 5"
  },
  {
    id: 3,
    title: "Check for Palindrome",
    difficulty: "Medium",
    xp: 100,
    description: "Write a function that checks if a string is a palindrome.",
    starterCode: "function isPalindrome(str) {\n  // Your code here\n}",
    testCase: "isPalindrome('racecar') === true"
  }
];

export default function CodingPractice() {
  const { theme } = useTheme();
  const [selectedProblem, setSelectedProblem] = useState<any>(null);
  const [code, setCode] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [completedIds, setCompletedIds] = useState<number[]>([]);
  const [isClaiming, setIsClaiming] = useState(false);

  const handleClaimCertificate = async () => {
    const user = auth.currentUser;
    if (!user || !selectedProblem || isClaiming) return;

    setIsClaiming(true);
    try {
      await addDoc(collection(db, 'users', user.uid, 'certificates'), {
        topic: selectedProblem.title,
        earnedAt: serverTimestamp(),
        type: 'Coding Challenge',
        xp: selectedProblem.xp
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/certificates`);
    }

    try {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: theme === 'light' ? ['#0A192F', '#D4AF37'] : ['#D4AF37', '#FFFFFF']
      });
      
      setSelectedProblem(null);
      if (!completedIds.includes(selectedProblem.id)) {
        setCompletedIds([...completedIds, selectedProblem.id]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsClaiming(false);
    }
  };

  const handleRun = () => {
    setIsRunning(true);
    // Simulate code execution
    setTimeout(() => {
      setIsRunning(false);
      setIsSuccess(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }, 1500);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn(
            "w-20 h-20 rounded-3xl flex items-center justify-center mx-auto",
            theme === 'light' ? "bg-emerald-100 text-emerald-600" : "bg-gold/10 text-gold"
          )}
        >
          <Code2 className="w-10 h-10" />
        </motion.div>
        <h1 className={cn(
          "text-4xl font-bold tracking-tight",
          theme === 'light' ? "text-primary" : "text-gold"
        )}>Coding Practice</h1>
        <p className={cn(
          "italic serif max-w-lg mx-auto",
          theme === 'light' ? "text-primary/60" : "text-gold/60"
        )}>
          Solve algorithmic challenges, earn XP, and receive digital certificates.
        </p>
      </div>

      {!selectedProblem ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PROBLEMS.map((problem, i) => (
            <motion.div 
              key={problem.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => {
                setSelectedProblem(problem);
                setCode(problem.starterCode);
                setIsSuccess(false);
              }}
              className={cn(
                "p-8 rounded-[2.5rem] border shadow-lg hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden",
                theme === 'light' ? "bg-white border-primary/10" : "bg-black border-gold/20"
              )}
            >
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <Code2 className={cn("w-24 h-24", theme === 'light' ? "text-primary" : "text-gold")} />
              </div>
              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                    problem.difficulty === 'Easy' 
                      ? (theme === 'light' ? "bg-emerald-100 text-emerald-700" : "bg-emerald-500/20 text-emerald-400") 
                      : (theme === 'light' ? "bg-amber-100 text-amber-700" : "bg-gold/20 text-gold")
                  )}>
                    {problem.difficulty}
                  </span>
                  {completedIds.includes(problem.id) && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  )}
                </div>
                <h3 className={cn("text-xl font-bold", theme === 'light' ? "text-primary" : "text-gold")}>{problem.title}</h3>
                <p className={cn(
                  "text-sm italic serif leading-relaxed line-clamp-2",
                  theme === 'light' ? "text-stone-500" : "text-gold/60"
                )}>
                  {problem.description}
                </p>
                <div className="pt-4 flex items-center justify-between">
                  <div className={cn("flex items-center gap-2", theme === 'light' ? "text-amber-600" : "text-gold")}>
                    <Award className="w-4 h-4" />
                    <span className="text-xs font-bold">{problem.xp} XP</span>
                  </div>
                  <ChevronRight className={cn("w-5 h-5 transition-all", theme === 'light' ? "text-stone-300 group-hover:text-stone-900 group-hover:translate-x-1" : "text-gold/20 group-hover:text-gold group-hover:translate-x-1")} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[600px]"
        >
          {/* Problem Description */}
          <div className={cn(
            "p-10 rounded-[3rem] border shadow-xl flex flex-col space-y-6 overflow-y-auto",
            theme === 'light' ? "bg-white border-primary/10" : "bg-black border-gold/20"
          )}>
            <button 
              onClick={() => setSelectedProblem(null)}
              className={cn(
                "text-sm font-bold uppercase tracking-widest flex items-center gap-2 transition-colors",
                theme === 'light' ? "text-stone-400 hover:text-stone-900" : "text-gold/40 hover:text-gold"
              )}
            >
              <ArrowRight className="w-4 h-4 rotate-180" /> Back to Problems
            </button>
            <div className="space-y-4">
              <h2 className={cn("text-3xl font-bold", theme === 'light' ? "text-primary" : "text-gold")}>{selectedProblem.title}</h2>
              <div className="flex items-center gap-4">
                <span className={cn(
                  "px-3 py-1 text-xs font-bold rounded-full uppercase tracking-widest",
                  theme === 'light' ? "bg-emerald-100 text-emerald-700" : "bg-emerald-500/20 text-emerald-400"
                )}>
                  {selectedProblem.difficulty}
                </span>
                <span className={cn("text-xs font-mono uppercase tracking-widest", theme === 'light' ? "text-stone-400" : "text-gold/40")}>Points: {selectedProblem.xp} XP</span>
              </div>
              <p className={cn(
                "text-lg italic serif leading-relaxed",
                theme === 'light' ? "text-stone-600" : "text-gold/80"
              )}>
                {selectedProblem.description}
              </p>
            </div>

            <div className={cn("pt-6 border-t space-y-4", theme === 'light' ? "border-stone-100" : "border-gold/10")}>
              <h4 className={cn("text-sm font-bold uppercase tracking-widest flex items-center gap-2", theme === 'light' ? "text-primary" : "text-gold")}>
                <Terminal className="w-4 h-4" /> Test Case
              </h4>
              <div className={cn(
                "p-4 rounded-xl font-mono text-sm border",
                theme === 'light' ? "bg-stone-50 text-stone-600 border-stone-100" : "bg-gold/5 text-gold/80 border-gold/20"
              )}>
                {selectedProblem.testCase}
              </div>
            </div>

            {isSuccess && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "mt-auto p-6 rounded-2xl border space-y-4",
                  theme === 'light' ? "bg-emerald-50 border-emerald-100" : "bg-emerald-500/10 border-emerald-500/20"
                )}
              >
                <div className={cn("flex items-center gap-3", theme === 'light' ? "text-emerald-700" : "text-emerald-400")}>
                  <CheckCircle2 className="w-6 h-6" />
                  <h4 className="font-bold">Challenge Completed!</h4>
                </div>
                <p className={cn(
                  "text-sm italic serif",
                  theme === 'light' ? "text-emerald-600" : "text-emerald-400/80"
                )}>You've successfully solved this problem and earned {selectedProblem.xp} XP.</p>
                <button 
                  onClick={handleClaimCertificate}
                  disabled={isClaiming}
                  className={cn(
                    "w-full py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2",
                    theme === 'light' ? "bg-emerald-600 text-white hover:bg-emerald-500" : "bg-emerald-500 text-black hover:bg-emerald-400",
                    isClaiming && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isClaiming ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Award className="w-5 h-5" />
                  )}
                  {isClaiming ? 'Claiming...' : 'Claim Certificate'}
                </button>
              </motion.div>
            )}
          </div>

          {/* Code Editor Simulation */}
          <div className={cn(
            "rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border",
            theme === 'light' ? "bg-stone-900 border-primary/10" : "bg-black border-gold/20"
          )}>
            <div className={cn(
              "p-6 border-b flex items-center justify-between",
              theme === 'light' ? "bg-stone-800/50 border-white/5" : "bg-gold/5 border-gold/10"
            )}>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="ml-4 text-xs font-mono text-stone-400 uppercase tracking-widest">solution.js</span>
              </div>
              <div className="flex items-center gap-4">
                <button className="text-stone-400 hover:text-white transition-colors">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 p-8 font-mono text-lg text-emerald-400/90 relative">
              <textarea 
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="absolute inset-0 w-full h-full p-8 bg-transparent border-none focus:ring-0 resize-none text-emerald-400/90 font-mono outline-none"
                spellCheck={false}
              />
            </div>

            <div className={cn(
              "p-6 border-t flex items-center justify-between",
              theme === 'light' ? "bg-stone-800/50 border-white/5" : "bg-gold/5 border-gold/10"
            )}>
              <div className="flex items-center gap-4">
                {isRunning && (
                  <div className="flex items-center gap-2 text-xs font-mono text-emerald-500 uppercase tracking-widest">
                    <Loader2 className="w-3 h-3 animate-spin" /> Running Tests...
                  </div>
                )}
              </div>
              <button 
                onClick={handleRun}
                disabled={isRunning}
                className={cn(
                  "px-8 py-3 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg",
                  theme === 'light' ? "bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-900/20" : "bg-gold text-black hover:bg-gold/90 shadow-gold/20"
                )}
              >
                <Play className="w-4 h-4 fill-current" /> Run Code
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
