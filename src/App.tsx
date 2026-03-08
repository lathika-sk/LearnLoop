import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, loginWithGoogle, logout, ensureUserProfile } from './firebase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  BookOpen, 
  FileText, 
  UserCircle, 
  LogOut, 
  BrainCircuit, 
  Gamepad2, 
  Code2, 
  Ghost, 
  Smile, 
  MessageSquare, 
  Award,
  Menu,
  X,
  Sparkles,
  Search,
  Moon,
  Sun,
  Compass
} from 'lucide-react';
import { cn } from './lib/utils';

// Theme Context
const ThemeContext = React.createContext<{ theme: 'light' | 'dark', toggleTheme: () => void }>({ theme: 'light', toggleTheme: () => {} });

export const useTheme = () => React.useContext(ThemeContext);

// Pages
import Dashboard from './pages/Dashboard';
import TopicSolver from './pages/TopicSolver';
import PaperAnalyzer from './pages/PaperAnalyzer';
import CareerPathfinder from './pages/CareerPathfinder';
import SkillLearning from './pages/SkillLearning';
import InterviewPrep from './pages/InterviewPrep';
import RelaxGame from './pages/RelaxGame';

// Auth Guard Component
const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        await ensureUserProfile(u);
        setUser(u);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-black/5 text-center"
        >
          <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <BrainCircuit className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-stone-900 mb-2">Welcome to LearnLoop</h1>
          <p className="text-stone-500 mb-8 italic serif">Your AI-powered study companion for deep learning.</p>
          
          <button
            onClick={loginWithGoogle}
            className="w-full py-4 px-6 bg-stone-900 text-white rounded-2xl font-medium flex items-center justify-center gap-3 hover:bg-stone-800 transition-colors shadow-lg"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            Sign in with Google
          </button>
          
          <p className="mt-6 text-xs text-stone-400 uppercase tracking-widest font-mono">
            Secure Student Authentication
          </p>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
};

// Main Layout Component
const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const user = auth.currentUser;
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Topic Solver', path: '/solver', icon: BookOpen },
    { name: 'Paper Analyzer', path: '/analyzer', icon: FileText },
    { name: 'Career Pathfinder', path: '/career', icon: Compass },
    { name: 'Skill Learning', path: '/learning', icon: Code2 },
    { name: 'Interview Prep', path: '/interview', icon: BrainCircuit },
    { name: 'Relax Game', path: '/relax', icon: Gamepad2 },
  ];

  return (
    <div className={cn(
      "min-h-screen flex transition-colors duration-300",
      theme === 'light' ? "bg-white text-primary" : "bg-black text-gold"
    )}>
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className={cn(
          "border-r flex flex-col sticky top-0 h-screen z-50 overflow-hidden transition-colors duration-300",
          theme === 'light' ? "bg-primary text-white border-white/10" : "bg-black text-gold border-gold/20"
        )}
      >
        <div className="p-6 flex items-center justify-between">
          <AnimatePresence mode="wait">
            {isSidebarOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  theme === 'light' ? "bg-white text-primary" : "bg-gold text-black"
                )}>
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <span className="font-bold text-xl tracking-tight">LearnLoop</span>
              </motion.div>
            )}
          </AnimatePresence>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={cn(
              "p-2 rounded-lg transition-colors",
              theme === 'light' ? "hover:bg-white/10" : "hover:bg-gold/10"
            )}
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className={cn(
                  "flex items-center gap-4 p-3 rounded-xl transition-all group",
                  isActive 
                    ? (theme === 'light' ? "bg-white text-primary font-medium shadow-lg" : "bg-gold text-black font-medium shadow-lg shadow-gold/20")
                    : (theme === 'light' ? "text-white/60 hover:bg-white/10 hover:text-white" : "text-gold/60 hover:bg-gold/10 hover:text-gold")
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "" : (theme === 'light' ? "text-white/40 group-hover:text-white" : "text-gold/40 group-hover:text-gold"))} />
                {isSidebarOpen && <span className="text-sm">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-white/10">
          <div className={cn("flex items-center gap-3 p-2 rounded-xl", isSidebarOpen ? (theme === 'light' ? "bg-white/5" : "bg-gold/5") : "")}>
            <img 
              src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`} 
              className={cn("w-10 h-10 rounded-full border-2 shadow-sm", theme === 'light' ? "border-white/20" : "border-gold/20")}
              alt="Profile"
              referrerPolicy="no-referrer"
            />
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.displayName}</p>
                <p className="text-xs opacity-60 truncate">{user?.email}</p>
              </div>
            )}
          </div>
          <button 
            onClick={logout}
            className={cn(
              "w-full mt-4 flex items-center gap-4 p-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-colors",
              !isSidebarOpen && "justify-center"
            )}
          >
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && <span className="text-sm font-medium">Sign Out</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className={cn(
          "h-16 backdrop-blur-md border-b flex items-center justify-between px-8 sticky top-0 z-40 transition-colors duration-300",
          theme === 'light' ? "bg-white/80 border-primary/10" : "bg-black/80 border-gold/20"
        )}>
          <div className={cn(
            "flex items-center gap-4 px-4 py-2 rounded-full w-96 transition-colors duration-300",
            theme === 'light' ? "bg-primary/5" : "bg-gold/5"
          )}>
            <Search className={cn("w-4 h-4", theme === 'light' ? "text-primary/40" : "text-gold/40")} />
            <input 
              type="text" 
              placeholder="Search concepts, topics, or papers..." 
              className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:opacity-50"
            />
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className={cn(
                "p-2 rounded-full transition-colors",
                theme === 'light' ? "bg-primary/5 text-primary hover:bg-primary/10" : "bg-gold/5 text-gold hover:bg-gold/10"
              )}
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors duration-300",
              theme === 'light' ? "bg-primary/5 border-primary/10 text-primary" : "bg-gold/5 border-gold/20 text-gold"
            )}>
              <Award className="w-4 h-4" />
              <span className="text-xs font-bold">1,240 XP</span>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <BrowserRouter>
        <AuthGuard>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/solver" element={<TopicSolver />} />
              <Route path="/analyzer" element={<PaperAnalyzer />} />
              <Route path="/career" element={<CareerPathfinder />} />
              <Route path="/learning" element={<SkillLearning />} />
              <Route path="/interview" element={<InterviewPrep />} />
              <Route path="/relax" element={<RelaxGame />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </AuthGuard>
      </BrowserRouter>
    </ThemeContext.Provider>
  );
}
