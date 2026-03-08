import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, BrainCircuit, BookOpen, Lightbulb, Save, Loader2 } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import ReactMarkdown from 'react-markdown';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export default function TopicSolver() {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ explanation: string, examples: string[], diagramPrompt: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const solveTopic = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Explain the following topic in depth for a student: ${topic}. 
        Provide a clear explanation, real-world examples, and a description of a diagram that would help visualize it.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              explanation: { type: Type.STRING, description: "Detailed markdown explanation" },
              examples: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of real-world examples" },
              diagramPrompt: { type: Type.STRING, description: "Description of a diagram to visualize the topic" }
            },
            required: ["explanation", "examples", "diagramPrompt"]
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      setResult(data);
    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveToHistory = async () => {
    if (!result || !auth.currentUser) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'topics'), {
        userId: auth.currentUser.uid,
        topic,
        explanation: result.explanation,
        examples: result.examples,
        diagramPrompt: result.diagramPrompt,
        createdAt: serverTimestamp()
      });
      alert("Topic saved to your history!");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${auth.currentUser.uid}/topics`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight">Topic Solver</h1>
        <p className="text-stone-500 italic serif">Understand difficult topics with AI-powered explanations and examples.</p>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-xl border border-black/5">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && solveTopic()}
              placeholder="e.g., Explain normalization in DBMS"
              className="w-full pl-12 pr-4 py-4 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
          <button
            onClick={solveTopic}
            disabled={loading}
            className="px-8 py-4 bg-stone-900 text-white rounded-2xl font-medium hover:bg-stone-800 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <BrainCircuit className="w-5 h-5" />}
            Solve
          </button>
        </div>
      </div>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white p-8 rounded-3xl shadow-xl border border-black/5">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-emerald-600" />
                  <h2 className="text-xl font-bold">Explanation</h2>
                </div>
                <button
                  onClick={saveToHistory}
                  disabled={saving}
                  className="flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-emerald-600 transition-colors"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save to History
                </button>
              </div>
              <div className="prose prose-stone max-w-none">
                <ReactMarkdown>{result.explanation}</ReactMarkdown>
              </div>
            </section>

            <section className="bg-white p-8 rounded-3xl shadow-xl border border-black/5">
              <div className="flex items-center gap-2 mb-6">
                <Lightbulb className="w-6 h-6 text-amber-500" />
                <h2 className="text-xl font-bold">Real-World Examples</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.examples.map((example, i) => (
                  <div key={i} className="p-4 bg-stone-50 rounded-2xl border border-black/5 text-sm leading-relaxed">
                    {example}
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <section className="bg-stone-900 text-white p-8 rounded-3xl shadow-xl sticky top-24">
              <div className="flex items-center gap-2 mb-6">
                <BrainCircuit className="w-6 h-6 text-emerald-400" />
                <h2 className="text-xl font-bold">Visual Concept</h2>
              </div>
              <p className="text-stone-400 text-sm mb-6 leading-relaxed italic">
                "A visual representation of this topic would include..."
              </p>
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10 text-sm font-mono text-emerald-300">
                {result.diagramPrompt}
              </div>
              <div className="mt-8 pt-8 border-t border-white/10">
                <p className="text-xs uppercase tracking-widest text-stone-500 mb-2">AI Reasoning</p>
                <p className="text-sm text-stone-300">
                  Generated using Gemini 3 Flash for optimal speed and clarity.
                </p>
              </div>
            </section>
          </div>
        </motion.div>
      )}
    </div>
  );
}
