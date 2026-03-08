import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  BookOpen, 
  FileText, 
  Trophy, 
  TrendingUp, 
  Clock, 
  ChevronRight,
  Award,
  BrainCircuit,
  Star,
  Activity
} from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot, getCountFromServer } from 'firebase/firestore';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [stats, setStats] = useState({
    completed: 0,
    certificates: 0,
    totalXp: 1240,
    streak: 5
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const user = auth.currentUser;

    // Fetch Recent Activity (Topics & Analyses)
    const fetchRecentActivity = () => {
      const topicsRef = collection(db, 'users', user.uid, 'topics');
      const q = query(topicsRef, orderBy('createdAt', 'desc'), limit(5));

      return onSnapshot(q, (snapshot) => {
        const activities = snapshot.docs.map(doc => ({
          id: doc.id,
          type: 'Topic Solver',
          title: doc.data().topic,
          time: doc.data().createdAt?.toDate().toLocaleDateString() || 'Recently',
          icon: BookOpen,
          color: 'text-emerald-500'
        }));
        setRecentActivity(activities);
        setLoading(false);
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'topics'));
    };

    const cleanup = fetchRecentActivity();

    // Fetch Stats
    const fetchStats = async () => {
      const topicsRef = collection(db, 'users', user.uid, 'topics');
      const certsRef = collection(db, 'users', user.uid, 'certificates');
      const progressRef = collection(db, 'users', user.uid, 'course_progress');
      
      try {
        const [topicsSnap, certsSnap, progressSnap] = await Promise.all([
          getCountFromServer(topicsRef),
          getCountFromServer(certsRef),
          getCountFromServer(progressRef)
        ]);

        setStats(prev => ({
          ...prev,
          completed: topicsSnap.data().count,
          certificates: certsSnap.data().count,
          totalXp: (topicsSnap.data().count * 50) + (certsSnap.data().count * 500) + 1240
        }));
      } catch (error) {
        console.error("Stats Error:", error);
      }
    };

    fetchStats();

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight">Student Dashboard</h1>
        <p className="text-stone-500 italic serif">Welcome back, {auth.currentUser?.displayName}. Here's your learning progress.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Topics Solved', value: stats.completed, icon: BrainCircuit, color: 'bg-emerald-500' },
          { label: 'Certificates', value: stats.certificates, icon: Award, color: 'bg-amber-500' },
          { label: 'Total XP', value: stats.totalXp.toLocaleString(), icon: Star, color: 'bg-indigo-500' },
          { label: 'Study Streak', value: `${stats.streak} Days`, icon: TrendingUp, color: 'bg-rose-500' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl shadow-xl border border-black/5 flex items-center gap-4"
          >
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg", stat.color)}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">{stat.label}</p>
              <p className="text-2xl font-bold text-stone-900">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              Recent Learning History
            </h2>
            <button className="text-xs font-bold text-stone-400 hover:text-stone-900 uppercase tracking-widest">View All</button>
          </div>
          
          <div className="bg-white rounded-3xl shadow-xl border border-black/5 overflow-hidden">
            {recentActivity.length > 0 ? (
              <div className="divide-y divide-stone-100">
                {recentActivity.map((activity, i) => (
                  <div key={activity.id} className="p-6 flex items-center justify-between hover:bg-stone-50 transition-colors group cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center", activity.color)}>
                        <activity.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-stone-900">{activity.title}</p>
                        <p className="text-xs text-stone-400">{activity.type} • {activity.time}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-stone-900 transition-colors" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <p className="text-stone-400 italic">No recent activity. Start solving topics to see them here!</p>
              </div>
            )}
          </div>
        </div>

        {/* Study Performance Analytics */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Study Performance
          </h2>
          <div className="bg-stone-900 text-white p-8 rounded-[40px] shadow-xl space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <p className="text-xs uppercase tracking-widest text-stone-500 font-bold">Weekly Goal</p>
                <p className="text-xl font-bold">85%</p>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '85%' }}
                  className="h-full bg-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-[10px] uppercase tracking-widest text-stone-500 font-bold mb-1">Focus Score</p>
                <p className="text-lg font-bold">92</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-[10px] uppercase tracking-widest text-stone-500 font-bold mb-1">Retention</p>
                <p className="text-lg font-bold">78%</p>
              </div>
            </div>

            <div className="pt-8 border-t border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-5 h-5 text-indigo-400" />
                <p className="text-sm font-medium">Time Spent Today: <span className="text-white font-bold">2h 45m</span></p>
              </div>
              <p className="text-xs text-stone-500 leading-relaxed italic">
                "You're in the top 5% of learners this week. Keep up the momentum!"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
