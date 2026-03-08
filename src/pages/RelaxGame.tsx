import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gamepad2, Timer, Trophy, X, RefreshCw, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
}

export default function RelaxGame() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [highScore, setHighScore] = useState(0);

  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    setTimeLeft(300);
    setBubbles([]);
  };

  const spawnBubble = useCallback(() => {
    const newBubble: Bubble = {
      id: Date.now(),
      x: Math.random() * 80 + 10, // 10% to 90%
      y: Math.random() * 80 + 10,
      size: Math.random() * 40 + 40,
      color: `hsl(${Math.random() * 360}, 70%, 70%)`
    };
    setBubbles(prev => [...prev, newBubble]);
  }, []);

  useEffect(() => {
    let interval: any;
    if (isPlaying && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
        if (Math.random() > 0.7) spawnBubble();
      }, 1000);
    } else if (timeLeft === 0) {
      setIsPlaying(false);
      if (score > highScore) setHighScore(score);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
    return () => clearInterval(interval);
  }, [isPlaying, timeLeft, score, highScore, spawnBubble]);

  const popBubble = (id: number) => {
    setBubbles(prev => prev.filter(b => b.id !== id));
    setScore(prev => prev + 10);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-[calc(100vh-200px)] flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold tracking-tight">Zen Break</h1>
          <p className="text-stone-500 italic serif">A 5-minute refresh for your mind. Pop the bubbles to relax.</p>
        </div>
        <div className="flex gap-4">
          <div className="px-6 py-3 bg-white rounded-2xl border border-black/5 shadow-sm flex items-center gap-3">
            <Timer className="w-5 h-5 text-emerald-500" />
            <span className="font-mono font-bold text-xl">{formatTime(timeLeft)}</span>
          </div>
          <div className="px-6 py-3 bg-stone-900 text-white rounded-2xl shadow-lg flex items-center gap-3">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-xl">{score}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 relative bg-stone-50 rounded-[40px] border-2 border-dashed border-stone-200 overflow-hidden">
        <AnimatePresence>
          {!isPlaying ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm"
            >
              <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                <Gamepad2 className="w-12 h-12 text-emerald-600" />
              </div>
              <h2 className="text-3xl font-bold mb-2">Ready for a break?</h2>
              <p className="text-stone-500 mb-8">The game will automatically end after 5 minutes.</p>
              <button
                onClick={startGame}
                className="px-12 py-4 bg-stone-900 text-white rounded-full font-bold text-lg hover:scale-105 transition-all shadow-xl flex items-center gap-3"
              >
                <RefreshCw className="w-5 h-5" />
                Start Refresh
              </button>
              {highScore > 0 && (
                <p className="mt-6 text-sm font-bold text-stone-400 uppercase tracking-widest">
                  Personal Best: {highScore}
                </p>
              )}
            </motion.div>
          ) : (
            <div className="absolute inset-0">
              {bubbles.map(bubble => (
                <motion.button
                  key={bubble.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  onClick={() => popBubble(bubble.id)}
                  className="absolute rounded-full cursor-pointer shadow-lg border-2 border-white/50 backdrop-blur-[2px]"
                  style={{
                    left: `${bubble.x}%`,
                    top: `${bubble.y}%`,
                    width: bubble.size,
                    height: bubble.size,
                    backgroundColor: bubble.color,
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Sparkles className="w-1/2 h-1/2 text-white/40 absolute top-1/4 left-1/4" />
                </motion.button>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Decorative elements */}
        <div className="absolute bottom-8 left-8 text-[10px] uppercase tracking-[0.3em] font-bold text-stone-300">
          Zen Mode Active
        </div>
      </div>
    </div>
  );
}
