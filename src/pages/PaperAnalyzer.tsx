import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Upload, BrainCircuit, ListChecks, AlertCircle, Loader2, Save } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export default function PaperAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ importantQuestions: string[], repeatedTopics: string[], summary: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.png', '.jpg'] },
    multiple: false
  });

  const analyzePaper = async () => {
    if (!file || !preview) return;
    setLoading(true);
    try {
      const base64Data = preview.split(',')[1];
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType: file.type } },
            { text: "Analyze this question paper. Extract important questions, identify repeated topics (if any are implied or common in this subject), and provide a summary of the paper's difficulty and focus areas." }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              importantQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
              repeatedTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
              summary: { type: Type.STRING }
            },
            required: ["importantQuestions", "repeatedTopics", "summary"]
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      setResult(data);
    } catch (error) {
      console.error("Analysis Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveAnalysis = async () => {
    if (!result || !auth.currentUser || !file) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'paper_analyses'), {
        userId: auth.currentUser.uid,
        fileName: file.name,
        importantQuestions: result.importantQuestions,
        repeatedTopics: result.repeatedTopics,
        summary: result.summary,
        createdAt: serverTimestamp()
      });
      alert("Analysis saved to your profile!");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${auth.currentUser.uid}/paper_analyses`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight">Paper Analyzer</h1>
        <p className="text-stone-500 italic serif">Upload previous year papers to identify patterns and important topics.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <div 
            {...getRootProps()} 
            className={`
              border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer
              ${isDragActive ? 'border-emerald-500 bg-emerald-50' : 'border-stone-200 hover:border-stone-300 bg-white'}
            `}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center">
                <Upload className="w-8 h-8 text-stone-400" />
              </div>
              <div>
                <p className="font-bold text-lg">
                  {file ? file.name : "Drop your question paper here"}
                </p>
                <p className="text-stone-500 text-sm mt-1">
                  Supports JPEG, PNG (PDF support coming soon)
                </p>
              </div>
            </div>
          </div>

          {preview && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative rounded-3xl overflow-hidden border border-black/5 shadow-xl bg-white p-4"
            >
              <img src={preview} alt="Preview" className="w-full h-auto rounded-2xl" />
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <button 
                  onClick={analyzePaper}
                  disabled={loading}
                  className="px-8 py-4 bg-white text-stone-900 rounded-2xl font-bold flex items-center gap-2 shadow-2xl hover:scale-105 transition-transform disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <BrainCircuit className="w-5 h-5" />}
                  Analyze Now
                </button>
              </div>
            </motion.div>
          )}
        </div>

        <div className="space-y-8">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <section className="bg-white p-8 rounded-3xl shadow-xl border border-black/5">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <ListChecks className="w-6 h-6 text-emerald-600" />
                      <h2 className="text-xl font-bold">Important Questions</h2>
                    </div>
                    <button 
                      onClick={saveAnalysis}
                      disabled={saving}
                      className="text-stone-400 hover:text-emerald-600 transition-colors"
                    >
                      {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    </button>
                  </div>
                  <ul className="space-y-3">
                    {result.importantQuestions.map((q, i) => (
                      <li key={i} className="flex gap-3 text-sm text-stone-600 leading-relaxed">
                        <span className="font-mono text-emerald-500 font-bold">0{i+1}</span>
                        {q}
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="bg-stone-900 text-white p-8 rounded-3xl shadow-xl">
                  <div className="flex items-center gap-2 mb-6">
                    <AlertCircle className="w-6 h-6 text-amber-400" />
                    <h2 className="text-xl font-bold">Repeated Topics</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.repeatedTopics.map((topic, i) => (
                      <span key={i} className="px-4 py-2 bg-white/10 rounded-full text-xs font-medium border border-white/10">
                        {topic}
                      </span>
                    ))}
                  </div>
                </section>

                <section className="bg-white p-8 rounded-3xl shadow-xl border border-black/5">
                  <h2 className="text-xl font-bold mb-4">Paper Summary</h2>
                  <p className="text-stone-600 text-sm leading-relaxed">
                    {result.summary}
                  </p>
                </section>
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-center p-12 bg-stone-50 rounded-3xl border border-dashed border-stone-200"
              >
                <FileText className="w-16 h-16 text-stone-300 mb-4" />
                <h3 className="text-lg font-bold text-stone-400">No Analysis Yet</h3>
                <p className="text-stone-400 text-sm mt-2">Upload a paper to see AI insights here.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
