import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  Sparkles, 
  BrainCircuit, 
  Smile, 
  Frown, 
  Zap, 
  Coffee, 
  Loader2, 
  RefreshCw,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { doc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useTheme } from '../App';
import { cn } from '../lib/utils';

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey! });

export default function MoodSyllabus() {
  const { theme } = useTheme();
  const webcamRef = useRef<Webcam>(null);
  const [loading, setLoading] = useState(false);
  const [mood, setMood] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState(false);

  const handleManualMood = async (selectedMood: string) => {
    setLoading(true);
    setError(null);
    setMood(selectedMood);
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `The student is feeling ${selectedMood}. Suggest 3 specific study topics or activities that match this energy level. Return JSON with 'recommendations' (array of objects with 'title' and 'reason').`,
        config: {
          responseMimeType: "application/json"
        }
      });

      const result = JSON.parse(response.text);
      setRecommendations(result.recommendations);

      // Save to Firestore
      const user = auth.currentUser;
      if (user) {
        try {
          await updateDoc(doc(db, 'users', user.uid), { lastMood: selectedMood });
          await addDoc(collection(db, 'users', user.uid, 'mood_history'), {
            mood: selectedMood,
            recommendations: result.recommendations,
            createdAt: serverTimestamp()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
        }
      }
    } catch (err) {
      console.error(err);
      setError("Failed to generate recommendations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const capture = useCallback(async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) return;

    setLoading(true);
    setError(null);
    setMood(null);
    setRecommendations([]);

    try {
      // Extract base64 data
      const base64Data = imageSrc.split(',')[1];
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType: "image/jpeg" } },
            { text: "Analyze the student's facial expression and detect their mood (Tired, Energetic, Bored, Stressed, or Happy). Based on the mood, suggest 3 study topics or activities. If tired/stressed, suggest light theory or relaxation. If energetic/happy, suggest complex math or coding. Return JSON with 'mood' and 'recommendations' (array of objects with 'title' and 'reason')." }
          ]
        },
        config: {
          responseMimeType: "application/json"
        }
      });

      const result = JSON.parse(response.text);
      setMood(result.mood);
      setRecommendations(result.recommendations);

      // Save mood to user profile and history
      const user = auth.currentUser;
      if (user) {
        try {
          await updateDoc(doc(db, 'users', user.uid), {
            lastMood: result.mood
          });
          await addDoc(collection(db, 'users', user.uid, 'mood_history'), {
            mood: result.mood,
            recommendations: result.recommendations,
            createdAt: serverTimestamp()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
        }
      }
    } catch (err) {
      console.error(err);
      setError("Failed to analyze mood. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [webcamRef]);

  const getMoodIcon = (m: string) => {
    switch (m.toLowerCase()) {
      case 'energetic': return <Zap className="w-12 h-12 text-amber-500" />;
      case 'tired': return <Coffee className="w-12 h-12 text-stone-500" />;
      case 'happy': return <Smile className="w-12 h-12 text-emerald-500" />;
      case 'stressed': return <Frown className="w-12 h-12 text-rose-500" />;
      default: return <BrainCircuit className="w-12 h-12 text-indigo-500" />;
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
            theme === 'light' ? "bg-amber-100 text-amber-600" : "bg-gold/10 text-gold"
          )}
        >
          <Sparkles className="w-10 h-10" />
        </motion.div>
        <h1 className={cn(
          "text-4xl font-bold tracking-tight",
          theme === 'light' ? "text-primary" : "text-gold"
        )}>Mood-Based Syllabus Shifter</h1>
        <p className={cn(
          "italic serif max-w-lg mx-auto",
          theme === 'light' ? "text-primary/60" : "text-gold/60"
        )}>
          Let AI detect your current vibe and suggest the perfect study topics for your energy level.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Webcam Section */}
        <div className="space-y-6">
          <div className={cn(
            "p-8 rounded-[3rem] border shadow-xl space-y-6",
            theme === 'light' ? "bg-white border-primary/10" : "bg-black border-gold/20"
          )}>
            <div className="aspect-video bg-stone-900 rounded-2xl overflow-hidden relative group">
              {!cameraError ? (
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  onUserMediaError={() => setCameraError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white/40 p-8 text-center space-y-4">
                  <Camera className="w-12 h-12" />
                  <p className="text-sm font-medium">Camera access denied or unavailable. Use manual selection below.</p>
                </div>
              )}
              <div className="absolute inset-0 border-4 border-emerald-500/20 pointer-events-none" />
              {!cameraError && (
                <div className="absolute top-4 left-4 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">Live Feed</span>
                </div>
              )}
            </div>

            <button 
              onClick={capture}
              disabled={loading || cameraError}
              className={cn(
                "w-full py-5 rounded-2xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg",
                theme === 'light' ? "bg-primary text-white hover:bg-primary/90" : "bg-gold text-black hover:bg-gold/90"
              )}
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
              Analyze My Face
            </button>
          </div>

          <div className={cn(
            "p-8 rounded-[3rem] border shadow-xl space-y-6",
            theme === 'light' ? "bg-white border-primary/10" : "bg-black border-gold/20"
          )}>
            <h3 className="text-sm font-bold uppercase tracking-widest opacity-40">Or Select Manually</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {['Tired', 'Energetic', 'Bored', 'Stressed', 'Happy', 'Focused'].map((m) => (
                <button
                  key={m}
                  onClick={() => handleManualMood(m)}
                  disabled={loading}
                  className={cn(
                    "py-3 rounded-xl text-sm font-bold border-2 transition-all",
                    mood === m 
                      ? (theme === 'light' ? "bg-primary text-white border-primary" : "bg-gold text-black border-gold")
                      : (theme === 'light' ? "bg-stone-50 border-stone-100 text-stone-500 hover:border-primary/20" : "bg-gold/5 border-gold/10 text-gold/60 hover:border-gold/40")
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {!mood && !loading ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn(
                  "h-full border-2 border-dashed rounded-[3rem] flex flex-col items-center justify-center p-12 text-center space-y-4",
                  theme === 'light' ? "bg-stone-50 border-stone-200" : "bg-gold/5 border-gold/20"
                )}
              >
                <Camera className={cn("w-12 h-12", theme === 'light' ? "text-stone-300" : "text-gold/20")} />
                <p className={cn(
                  "italic serif",
                  theme === 'light' ? "text-stone-500" : "text-gold/40"
                )}>Capture your face to get personalized study recommendations.</p>
              </motion.div>
            ) : loading ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn(
                  "h-full p-12 rounded-[3rem] border shadow-xl flex flex-col items-center justify-center text-center space-y-6",
                  theme === 'light' ? "bg-white border-primary/10" : "bg-black border-gold/20"
                )}
              >
                <div className="relative w-24 h-24">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className={cn(
                      "absolute inset-0 border-4 rounded-full",
                      theme === 'light' ? "border-amber-500/20" : "border-gold/20"
                    )}
                  />
                  <motion.div 
                    animate={{ rotate: -360 }}
                    transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                    className={cn(
                      "absolute inset-0 border-t-4 rounded-full",
                      theme === 'light' ? "border-amber-500" : "border-gold"
                    )}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className={cn("w-8 h-8", theme === 'light' ? "text-amber-600" : "text-gold")} />
                  </div>
                </div>
                <p className={cn(
                  "text-xl font-bold",
                  theme === 'light' ? "text-primary" : "text-gold"
                )}>Reading your vibe...</p>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className={cn(
                  "p-8 rounded-[3rem] border shadow-xl flex items-center gap-6",
                  theme === 'light' ? "bg-white border-primary/10" : "bg-black border-gold/20"
                )}>
                  <div className={cn(
                    "w-20 h-20 rounded-2xl flex items-center justify-center shrink-0",
                    theme === 'light' ? "bg-stone-50" : "bg-gold/10"
                  )}>
                    {getMoodIcon(mood!)}
                  </div>
                  <div>
                    <h2 className={cn("text-sm font-bold uppercase tracking-[0.2em]", theme === 'light' ? "text-stone-400" : "text-gold/40")}>Detected Mood</h2>
                    <p className={cn("text-3xl font-bold", theme === 'light' ? "text-primary" : "text-gold")}>{mood}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className={cn("text-xl font-bold px-4", theme === 'light' ? "text-primary" : "text-gold")}>AI Recommendations</h3>
                  {recommendations.map((rec, i) => (
                    <motion.div 
                      key={`${rec.title}-${i}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={cn(
                        "p-6 rounded-2xl border shadow-sm transition-colors group",
                        theme === 'light' ? "bg-white border-primary/10 hover:border-amber-200" : "bg-black border-gold/20 hover:border-gold/40"
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                          theme === 'light' ? "bg-amber-50" : "bg-gold/10"
                        )}>
                          <CheckCircle2 className={cn("w-5 h-5", theme === 'light' ? "text-amber-600" : "text-gold")} />
                        </div>
                        <div className="flex-1">
                          <h4 className={cn(
                            "font-bold transition-colors",
                            theme === 'light' ? "text-primary group-hover:text-amber-700" : "text-gold group-hover:text-gold/80"
                          )}>{rec.title}</h4>
                          <p className={cn(
                            "text-sm italic serif mt-1",
                            theme === 'light' ? "text-stone-500" : "text-gold/60"
                          )}>{rec.reason}</p>
                        </div>
                        <ArrowRight className={cn("w-5 h-5 transition-colors", theme === 'light' ? "text-stone-300 group-hover:text-stone-900" : "text-gold/20 group-hover:text-gold")} />
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                <button 
                  onClick={() => setMood(null)}
                  className={cn(
                    "w-full py-4 text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors",
                    theme === 'light' ? "text-stone-400 hover:text-stone-900" : "text-gold/40 hover:text-gold"
                  )}
                >
                  <RefreshCw className="w-4 h-4" /> Retake Analysis
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
