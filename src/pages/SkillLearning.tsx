import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, CheckCircle, Award, BookOpen, Code, Database, Globe, Layout, ChevronRight, Loader2, Download } from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, doc, setDoc, onSnapshot, query, where, serverTimestamp } from 'firebase/firestore';
import { jsPDF } from 'jspdf';

interface Course {
  id: string;
  title: string;
  icon: any;
  description: string;
  videoUrl: string;
  duration: string;
}

const COURSES: Course[] = [
  { id: 'python', title: 'Python Mastery', icon: Code, description: 'Learn Python from basics to advanced concepts.', videoUrl: 'https://www.youtube.com/embed/rfscVS0vtbw', duration: '10:00' },
  { id: 'sql', title: 'SQL for Data', icon: Database, description: 'Master relational databases and SQL queries.', videoUrl: 'https://www.youtube.com/embed/HXV3zeQKqGY', duration: '12:00' },
  { id: 'dbms', title: 'DBMS Fundamentals', icon: Database, description: 'Understand database management systems architecture.', videoUrl: 'https://www.youtube.com/embed/3EJlovevfcA', duration: '15:00' },
  { id: 'html', title: 'Modern HTML/CSS', icon: Globe, description: 'Build responsive websites with HTML5 and CSS3.', videoUrl: 'https://www.youtube.com/embed/mU6anWqZJcc', duration: '08:00' },
  { id: 'fullstack', title: 'Fullstack Development', icon: Layout, description: 'End-to-end web development with MERN stack.', videoUrl: 'https://www.youtube.com/embed/7CqJlxBYj-M', duration: '20:00' },
];

export default function SkillLearning() {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [watching, setWatching] = useState(false);
  const [watchTime, setWatchTime] = useState(0);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'users', auth.currentUser.uid, 'course_progress'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const p: Record<string, number> = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        p[data.courseId] = data.progress;
      });
      setProgress(p);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'course_progress'));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let interval: any;
    if (watching && selectedCourse && (progress[selectedCourse.id] || 0) < 100) {
      interval = setInterval(() => {
        setWatchTime(prev => {
          const next = prev + 1;
          // Simulate progress: 10 seconds of watching = 100% for demo purposes
          if (next >= 10) {
            updateProgress(selectedCourse.id, 100);
            setWatching(false);
            return 0;
          }
          const currentProgress = Math.floor((next / 10) * 100);
          updateProgress(selectedCourse.id, currentProgress);
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [watching, selectedCourse]);

  const updateProgress = async (courseId: string, p: number) => {
    if (!auth.currentUser) return;
    const progressRef = doc(db, 'users', auth.currentUser.uid, 'course_progress', courseId);
    try {
      await setDoc(progressRef, {
        userId: auth.currentUser.uid,
        courseId,
        progress: p,
        completed: p === 100,
        lastAccessed: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `course_progress/${courseId}`);
    }
  };

  const generateCertificate = (course: Course) => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Certificate Design
    doc.setFillColor(245, 245, 245);
    doc.rect(0, 0, 297, 210, 'F');
    
    doc.setDrawColor(16, 185, 129); // Emerald
    doc.setLineWidth(5);
    doc.rect(10, 10, 277, 190);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(40);
    doc.setTextColor(30, 41, 59);
    doc.text('CERTIFICATE', 148.5, 60, { align: 'center' });
    
    doc.setFontSize(20);
    doc.setFont('helvetica', 'normal');
    doc.text('OF COMPLETION', 148.5, 75, { align: 'center' });

    doc.setFontSize(16);
    doc.text('This is to certify that', 148.5, 100, { align: 'center' });

    doc.setFontSize(30);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text(auth.currentUser?.displayName || 'Student', 148.5, 120, { align: 'center' });

    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(`has successfully completed the course`, 148.5, 140, { align: 'center' });

    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(course.title, 148.5, 155, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'italic');
    doc.text(`Issued on ${new Date().toLocaleDateString()} by LearnLoop AI`, 148.5, 180, { align: 'center' });

    doc.save(`${course.id}-certificate.pdf`);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight">Skill Learning</h1>
        <p className="text-stone-500 italic serif">Master industry-relevant skills with structured video lessons and certification.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-4">Available Courses</h2>
          <div className="space-y-3">
            {COURSES.map((course) => {
              const p = progress[course.id] || 0;
              const isSelected = selectedCourse?.id === course.id;
              return (
                <button
                  key={course.id}
                  onClick={() => {
                    setSelectedCourse(course);
                    setWatching(false);
                    setWatchTime(0);
                  }}
                  className={`w-full p-4 rounded-2xl border transition-all text-left flex items-center gap-4 ${
                    isSelected ? 'bg-emerald-50 border-emerald-200 shadow-md' : 'bg-white border-stone-100 hover:border-stone-200'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isSelected ? 'bg-emerald-500 text-white' : 'bg-stone-100 text-stone-500'}`}>
                    <course.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-stone-900 truncate">{course.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1 bg-stone-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${p}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-stone-400">{p}%</span>
                    </div>
                  </div>
                  {p === 100 && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selectedCourse ? (
              <motion.div
                key={selectedCourse.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-3xl shadow-xl border border-black/5 overflow-hidden"
              >
                <div className="aspect-video bg-black relative">
                  {watching ? (
                    <iframe
                      width="100%"
                      height="100%"
                      src={`${selectedCourse.videoUrl}?autoplay=1`}
                      title={selectedCourse.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                      <button
                        onClick={() => setWatching(true)}
                        className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
                      >
                        <Play className="w-8 h-8 fill-current" />
                      </button>
                      <p className="text-white/60 font-medium">Click to start learning</p>
                    </div>
                  )}
                </div>

                <div className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">{selectedCourse.title}</h2>
                      <p className="text-stone-500 text-sm">{selectedCourse.description}</p>
                    </div>
                    {progress[selectedCourse.id] === 100 && (
                      <button
                        onClick={() => generateCertificate(selectedCourse)}
                        className="flex items-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-xl font-bold text-sm hover:bg-stone-800 transition-all shadow-lg"
                      >
                        <Download className="w-4 h-4" />
                        Download Certificate
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-stone-50 rounded-2xl border border-black/5">
                      <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-1">Duration</p>
                      <p className="font-bold">{selectedCourse.duration}</p>
                    </div>
                    <div className="p-4 bg-stone-50 rounded-2xl border border-black/5">
                      <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-1">Status</p>
                      <p className="font-bold">{progress[selectedCourse.id] === 100 ? 'Completed' : 'In Progress'}</p>
                    </div>
                    <div className="p-4 bg-stone-50 rounded-2xl border border-black/5">
                      <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-1">XP Reward</p>
                      <p className="font-bold text-emerald-600">+500 XP</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-stone-50 rounded-3xl border border-dashed border-stone-200">
                <BookOpen className="w-16 h-16 text-stone-300 mb-4" />
                <h3 className="text-lg font-bold text-stone-400">Select a course to begin</h3>
                <p className="text-stone-400 text-sm mt-2">Choose from our curated list of technical skills.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
