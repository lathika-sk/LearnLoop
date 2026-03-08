import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, GraduationCap, Briefcase, TrendingUp, DollarSign, ChevronRight, Loader2, Save, CheckCircle2 } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

interface Recommendation {
  course: string;
  careerPath: string;
  eligibility: string;
  salary: string;
  futureScope: string;
}

export default function CareerPathfinder() {
  const [level, setLevel] = useState<'12th' | 'UG' | 'PG'>('12th');
  const [interests, setInterests] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'users', auth.currentUser.uid, 'career_recommendations'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ids = new Set<string>();
      snapshot.forEach(doc => {
        const data = doc.data();
        data.recommendations.forEach((rec: Recommendation) => ids.add(rec.course));
      });
      setSavedIds(ids);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'career_recommendations'));
    return () => unsubscribe();
  }, []);

  const getRecommendations = async () => {
    if (!interests.trim()) return;
    setLoading(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `I am a student who just completed ${level}. My interests and strengths are: ${interests}. 
        Recommend 3 suitable courses and career paths. Include eligibility, average salary, and future scope for each.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                course: { type: Type.STRING },
                careerPath: { type: Type.STRING },
                eligibility: { type: Type.STRING },
                salary: { type: Type.STRING },
                futureScope: { type: Type.STRING }
              },
              required: ["course", "careerPath", "eligibility", "salary", "futureScope"]
            }
          }
        }
      });

      const data = JSON.parse(response.text || '[]');
      setRecommendations(data);
    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveToProfile = async () => {
    if (!recommendations.length || !auth.currentUser) return;
    try {
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'career_recommendations'), {
        userId: auth.currentUser.uid,
        level,
        interests,
        recommendations,
        createdAt: serverTimestamp()
      });
      alert("Recommendations saved!");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'career_recommendations');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto space-y-16">
        <header className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-medium uppercase tracking-[0.2em] text-white/60"
          >
            <Compass className="w-3 h-3" />
            AI Career Intelligence
          </motion.div>
          <h1 className="text-7xl font-light tracking-tight leading-none">
            Design Your <span className="text-white/40 italic serif">Future.</span>
          </h1>
          <p className="text-white/40 max-w-2xl mx-auto text-lg font-light">
            Precision-engineered career guidance powered by advanced neural networks.
          </p>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          <div className="lg:col-span-1 space-y-8 sticky top-24">
            <div className="space-y-6">
              <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/30">Academic Level</label>
              <div className="flex flex-col gap-2">
                {(['12th', 'UG', 'PG'] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLevel(l)}
                    className={`px-6 py-4 rounded-2xl text-sm font-medium transition-all text-left flex items-center justify-between group ${
                      level === l ? 'bg-white text-black' : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {l === '12th' ? 'After 12th Grade' : l === 'UG' ? 'After Undergraduate' : 'After Postgraduate'}
                    <ChevronRight className={`w-4 h-4 transition-transform ${level === l ? 'translate-x-0' : '-translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/30">Interests & Strengths</label>
              <textarea
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="e.g., I love coding, solving logical puzzles, and I'm good at mathematics."
                className="w-full h-40 bg-white/5 border border-white/10 rounded-3xl p-6 text-sm focus:ring-1 focus:ring-white/40 transition-all resize-none placeholder:text-white/20"
              />
            </div>

            <button
              onClick={getRecommendations}
              disabled={loading}
              className="w-full py-6 bg-white text-black rounded-full font-bold uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Compass className="w-4 h-4" />}
              Generate Intelligence
            </button>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <AnimatePresence mode="wait">
              {recommendations.length > 0 ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-12"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-6">
                    <h2 className="text-2xl font-light">Recommended Paths</h2>
                    <button onClick={saveToProfile} className="text-xs uppercase tracking-widest text-white/40 hover:text-white transition-colors flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      Archive Results
                    </button>
                  </div>

                  <div className="space-y-8">
                    {recommendations.map((rec, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="group relative p-8 rounded-[40px] bg-white/5 border border-white/10 hover:border-white/20 transition-all"
                      >
                        <div className="flex flex-col md:flex-row gap-8">
                          <div className="flex-1 space-y-6">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/40">
                                <GraduationCap className="w-3 h-3" />
                                Recommended Course
                              </div>
                              <h3 className="text-3xl font-light">{rec.course}</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/40">
                                  <Briefcase className="w-3 h-3" />
                                  Career Path
                                </div>
                                <p className="text-sm text-white/80">{rec.careerPath}</p>
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/40">
                                  <DollarSign className="w-3 h-3" />
                                  Average Salary
                                </div>
                                <p className="text-sm text-white/80">{rec.salary}</p>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/40">
                                <TrendingUp className="w-3 h-3" />
                                Future Scope
                              </div>
                              <p className="text-sm text-white/60 leading-relaxed font-light">{rec.futureScope}</p>
                            </div>
                          </div>

                          <div className="md:w-48 flex flex-col justify-between items-end">
                            <div className="text-right space-y-1">
                              <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">Eligibility</div>
                              <div className="text-xs font-medium">{rec.eligibility}</div>
                            </div>
                            {savedIds.has(rec.course) && (
                              <div className="flex items-center gap-2 text-emerald-400 text-[10px] uppercase tracking-widest">
                                <CheckCircle2 className="w-4 h-4" />
                                Saved
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <div className="h-[600px] flex flex-col items-center justify-center text-center space-y-6 border border-white/5 rounded-[60px] bg-white/[0.02]">
                  <div className="w-24 h-24 rounded-full border border-white/10 flex items-center justify-center">
                    <Compass className="w-8 h-8 text-white/20" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-light">Awaiting Parameters</h3>
                    <p className="text-white/20 text-sm max-w-xs mx-auto">
                      Define your academic level and interests to initialize the career mapping engine.
                    </p>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>
    </div>
  );
}
