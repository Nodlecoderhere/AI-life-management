import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Target, 
  CheckCircle2, 
  ArrowRight, 
  Brain, 
  Zap, 
  Mountain, 
  TrendingUp, 
  Clock,
  ChevronRight,
  Loader2,
  Calendar,
  Layout,
  Mail,
  Lock,
  User,
  LogOut,
  ShieldCheck,
  Quote,
  Lightbulb,
  Trophy,
  Activity,
  Compass,
  Star,
  Moon,
  Sun
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { auth } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  User as FirebaseUser,
  sendEmailVerification
} from 'firebase/auth';

// AI Prompting
const SYSTEM_INSTRUCTION = `You are an elite life coach and growth strategist specializing in AI-driven productivity. 
Your goal is to take a user's goals, current habits, and challenges, and provide a structured "Strategic Growth Plan".
Identify:
1. Short-term wins (next 7 days)
2. Mid-term milestones (next 30 days)
3. Habit optimizations (specific techniques)
4. Potential roadblocks and how to bypass them.
Format the response clearly with sections. Use bullet points and bold text for key actions.`;

const MOTIVATIONAL_QUOTES = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Act as if what you do makes a difference. It does.", author: "William James" },
  { text: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" }
];

const STRATEGIC_TIPS = [
  { 
    title: "The 80/20 Protocol", 
    desc: "80% of your results come from 20% of your activities. Identify and double down on high-impact tasks.",
    icon: <Activity className="w-5 h-5" />
  },
  { 
    title: "Micro-Habit Chain", 
    desc: "Start habits so small they're impossible to fail. Consistency trumps intensity in the long run.",
    icon: <TrendingUp className="w-5 h-5" />
  },
  { 
    title: "Deep Work Mastery", 
    desc: "Dedicate 90-minute distraction-free blocks for your most cognitively demanding strategic work.",
    icon: <Brain className="w-5 h-5" />
  },
  { 
    title: "Evening Retrospective", 
    desc: "Spend 5 minutes nightly reviewing wins and anchoring your top 3 priorities for tomorrow.",
    icon: <Clock className="w-5 h-5" />
  },
  { 
    title: "Systems over Outcomes", 
    desc: "Build a system that makes your desired outcome inevitable rather than just wishing for results.",
    icon: <Layout className="w-5 h-5" />
  }
];

type View = 'landing' | 'login' | 'signup' | 'dashboard' | 'verify';

export default function App() {
  const [view, setView] = useState<View>('landing');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [verificationEmail, setVerificationEmail] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(pre-screen-dark)').matches);
    }
    return true; // Default to dark for cyberpunk vibe
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);
  
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    fullName: ''
  });

  const [formData, setFormData] = useState({
    name: '',
    goals: '',
    habits: '',
    challenges: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);
  const [randomQuote, setRandomQuote] = useState(MOTIVATIONAL_QUOTES[0]);
  const planRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRandomQuote(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);
  }, [view]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setPlan(null);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('API Key not found. Please check your environment variables.');
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `User Name: ${formData.name}\nGoals: ${formData.goals}\nCurrent Habits: ${formData.habits}\nChallenges: ${formData.challenges}`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [prompt],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION
        }
      });

      setPlan(response.text || "I was unable to generate a plan. Please try again.");
    } catch (error) {
      console.error("error generating plan:", error);
      setPlan("An error occurred while generating your plan. Please check your configuration and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && !currentUser.emailVerified) {
        // If user is logged in but not verified (e.g. on page reload), 
        // we force them to the verification screen and sign them out.
        const email = currentUser.email || '';
        await signOut(auth);
        setVerificationEmail(email);
        setView('verify');
        setUser(null);
      } else {
        setUser(currentUser);
        if (currentUser && currentUser.emailVerified) {
          setView('dashboard');
        }
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAuthInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAuthForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, authForm.email, authForm.password);
      if (!userCredential.user.emailVerified) {
        await signOut(auth);
        setVerificationEmail(authForm.email);
        setView('verify');
      } else {
        setView('dashboard');
      }
    } catch (error: any) {
      console.error("Sign in error:", error);
      setAuthError("Email or password is incorrect");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, authForm.email, authForm.password);
      if (userCredential.user) {
        await sendEmailVerification(userCredential.user);
        await signOut(auth);
        setVerificationEmail(authForm.email);
        setView('verify');
      }
    } catch (error: any) {
      console.error("Sign up error:", error);
      if (error.code === 'auth/email-already-in-use') {
        setAuthError("User already exists. Please sign in");
      } else {
        setAuthError(error.message);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setView('landing');
      setPlan(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  useEffect(() => {
    if (plan && planRef.current) {
      planRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [plan]);

  if (authLoading && !user) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-[#050505]' : 'bg-[#f0f0f0]'}`}>
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDarkMode ? 'dark bg-[#050505] text-white' : 'bg-[#f0f0f0] text-black'}`}>
      <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button 
            onClick={() => setView(user ? 'dashboard' : 'landing')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity group"
          >
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center neon-box text-black">
              <Zap className="w-6 h-6 fill-black" />
            </div>
            <span className="font-display font-bold text-2xl tracking-tighter uppercase neon-text transition-all group-hover:tracking-widest">Vispro AI</span>
          </button>
          
          <div className="hidden md:flex items-center gap-8 text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">
            <a href="#features" className="hover:text-accent hover:opacity-100 transition-all">Features</a>
            <a href="#about" className="hover:text-accent hover:opacity-100 transition-all">About</a>
            {user ? (
              <button onClick={() => setView('dashboard')} className="text-accent hover:opacity-100 font-black">Command Hub</button>
            ) : (
              <button onClick={() => setView('landing')} className="hover:text-accent hover:opacity-100">Initiate</button>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-accent neon-box"
              title="Toggle Neural Interface"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            {user ? (
              <>
                <div className="hidden sm:flex flex-col items-end mr-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Operator</span>
                  <span className="text-xs font-mono text-accent truncate max-w-[120px]">{user.email?.split('@')[0]}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-white/5 hover:bg-neon-magenta/20 border border-white/10 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all active:scale-95"
                >
                  <LogOut className="w-4 h-4 text-neon-magenta" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => setView('login')}
                  className="text-xs font-bold uppercase tracking-widest opacity-60 hover:opacity-100 transition-colors"
                >
                  Login
                </button>
                <button 
                  onClick={() => setView('signup')}
                  className="bg-accent text-black px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:neon-box transition-all active:scale-95 shadow-xl shadow-accent/20"
                >
                  Join Net
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <AnimatePresence mode="wait">
        {view === 'landing' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Hero Section */}
            <section className="relative pt-48 pb-24 px-6 overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl aspect-square bg-[radial-gradient(circle_at_center,var(--color-accent),transparent_70%)] opacity-[0.07] -z-10 animate-pulse" />
              
              <div className="max-w-4xl mx-auto text-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                >
                  <span className="inline-block py-1 px-4 rounded-lg bg-accent/10 text-accent text-[10px] font-black uppercase tracking-[0.3em] mb-8 border border-accent/20 neon-box">
                    Neural Enhancement Interface v2.0
                  </span>
                  <h1 className="text-7xl md:text-9xl font-display font-black leading-[0.85] tracking-tighter mb-10 text-balance uppercase italic">
                    Upgrade your <span className="text-accent neon-text">existence.</span>
                  </h1>
                  <p className="text-xl opacity-60 max-w-2xl mx-auto mb-12 text-balance leading-relaxed font-medium">
                    Vispro AI fuses quantum processing with behavioral architecture to reconstruct your productivity matrix. 
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                    <button 
                      onClick={() => setView('signup')}
                      className="w-full sm:w-auto bg-accent text-black px-10 py-5 rounded-xl flex items-center justify-center gap-3 font-black uppercase tracking-widest hover:translate-x-2 transition-all neon-box"
                    >
                      Initialize Link <ArrowRight className="w-5 h-5" />
                    </button>
                    <button className="w-full sm:w-auto px-10 py-5 rounded-xl bg-white/5 border border-white/10 font-bold uppercase tracking-widest hover:bg-white/10 transition-colors">
                      The Protocol
                    </button>
                  </div>
                </motion.div>
              </div>
            </section>

            {/* Features Content */}
            <section id="features" className="py-32 px-6 bg-accent/5 relative">
              <div className="absolute inset-0 bg-brand-primary opacity-50 dark:opacity-0" />
              <div className="max-w-7xl mx-auto relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                  <FeatureCard 
                    icon={<Brain className="w-8 h-8" />}
                    title="Neural Mapping"
                    description="Decipher the cognitive gridlocked patterns holding your performance at bay."
                    delay={0.1}
                  />
                  <FeatureCard 
                    icon={<Target className="w-8 h-8" />}
                    title="Habit Foundry"
                    description="Forge titanium routines using quantum-validated behavioral data."
                    delay={0.2}
                  />
                  <FeatureCard 
                    icon={<Zap className="w-8 h-8" />}
                    title="Kinetic Strategy"
                    description="Dynamic plan recalibration based on real-time neuro-feedback loops."
                    delay={0.3}
                  />
                </div>
              </div>
            </section>
          </motion.div>
        )}

        {view === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pt-28 pb-20 px-6 max-w-7xl mx-auto"
          >
            {/* Dashboard Header */}
            <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-12">
              <div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 text-accent mb-6"
                >
                  <Activity className="w-5 h-5 neon-text" />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] neon-text">System Status: Active</span>
                </motion.div>
                <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter uppercase italic">
                   Direct <span className="text-accent neon-text">Command</span>
                </h1>
              </div>
              <div className="flex gap-4">
                <div className="flex flex-col items-end px-6 border-r border-white/10">
                  <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest mb-1">Last Sync</span>
                  <span className="text-xs font-mono text-neon-magenta">{new Date().toLocaleTimeString()}</span>
                </div>
                <button 
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 hover:border-accent hover:text-accent transition-all"
                >
                  {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Daily Quote Hero */}
              <div className="lg:col-span-8 flex flex-col gap-10">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-brand-secondary border border-white/5 p-10 md:p-16 rounded-[4rem] relative overflow-hidden group shadow-2xl cyber-border"
                >
                  <div className="absolute top-0 right-0 w-80 h-80 bg-accent/20 blur-[120px] -mr-40 -mt-40 rounded-full animate-pulse" />
                  <Quote className="w-16 h-16 text-accent/20 mb-10" />
                  <blockquote className="relative">
                    <p className="text-4xl md:text-6xl font-display font-black italic leading-[0.9] mb-10 text-balance uppercase tracking-tighter">
                      "{randomQuote.text}"
                    </p>
                    <footer className="flex items-center gap-6">
                      <div className="w-12 h-[2px] bg-neon-magenta" />
                      <cite className="text-neon-magenta font-black uppercase tracking-[0.3em] text-xs not-italic">
                        Source: {randomQuote.author}
                      </cite>
                    </footer>
                  </blockquote>
                </motion.div>

                {/* Plan Generator Trigger */}
                <div className="bg-white/5 border border-white/10 p-12 rounded-[4rem] relative group">
                   <div className="absolute -top-4 -left-4 w-20 h-20 border-t-2 border-l-2 border-accent opacity-50" />
                   <div className="flex items-center gap-6 mb-10">
                      <div className="w-16 h-16 bg-accent/20 rounded-3xl flex items-center justify-center border border-accent/30 neon-box">
                        <Compass className="text-accent w-8 h-8" />
                      </div>
                      <h2 className="text-3xl font-display font-black uppercase tracking-tighter italic">Rebuild the Protocol</h2>
                   </div>
                   
                   <form onSubmit={generatePlan} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 px-2">Objective Matrix</label>
                        <input 
                          type="text" 
                          name="goals"
                          value={formData.goals}
                          onChange={handleInputChange}
                          className="w-full bg-black/40 px-6 py-5 rounded-2xl border border-white/10 focus:border-accent outline-none transition-all placeholder:text-white/10 font-medium"
                          placeholder="Target goal..."
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 px-2">Anomaly Detection</label>
                        <input 
                          type="text" 
                          name="challenges"
                          value={formData.challenges}
                          onChange={handleInputChange}
                          className="w-full bg-black/40 px-6 py-5 rounded-2xl border border-white/10 focus:border-accent outline-none transition-all placeholder:text-white/10 font-medium"
                          placeholder="Current roadblocks..."
                        />
                      </div>
                    </div>
                    <div className="flex flex-col justify-end">
                      <button 
                        type="submit"
                        disabled={isGenerating}
                        className="w-full bg-accent text-black py-6 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:translate-y-[-4px] transition-all neon-box disabled:opacity-30"
                      >
                        {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Recalibrate Strategy <Zap className="w-5 h-5 fill-black" /></>}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Sidebar: Insights & Tips */}
              <div className="lg:col-span-4 space-y-10">
                <div className="bg-brand-secondary border border-white/5 p-10 rounded-[4rem] cyber-border">
                  <div className="flex items-center gap-4 mb-10">
                    <Lightbulb className="w-6 h-6 text-neon-yellow neon-text" />
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-accent">Neural Insights</h3>
                  </div>
                  
                  <div className="space-y-8">
                    {STRATEGIC_TIPS.map((tip, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={idx} 
                        className="group cursor-default"
                      >
                        <div className="flex items-start gap-4">
                          <div className="mt-1 w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-accent group-hover:text-black transition-all">
                            {tip.icon}
                          </div>
                          <div>
                            <h4 className="font-black uppercase tracking-tighter text-sm mb-2 group-hover:text-accent transition-colors">{tip.title}</h4>
                            <p className="text-[11px] opacity-40 leading-relaxed font-bold tracking-tight">{tip.desc}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-12 pt-10 border-t border-white/10">
                    <div className="bg-neon-magenta/5 border border-neon-magenta/20 p-8 rounded-3xl flex items-center gap-6 group hover:bg-neon-magenta/10 transition-all">
                      <Trophy className="w-10 h-10 text-neon-magenta" />
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-neon-magenta mb-2">Sync Metrics</div>
                        <div className="text-2xl font-display font-black tracking-tighter">80% LOAD</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Result Area inside Dashboard */}
            <AnimatePresence>
              {plan && (
                <motion.section 
                  ref={planRef}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-16 bg-white/5 border border-accent/20 p-10 md:p-16 rounded-[4rem] relative overflow-hidden group"
                >
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent/10 blur-[60px] rounded-full" />
                  <div className="flex items-center gap-6 mb-16">
                    <div className="w-16 h-16 bg-accent border border-accent/50 rounded-2xl flex items-center justify-center neon-box">
                      <Layout className="w-8 h-8 text-black" />
                    </div>
                    <div>
                      <h2 className="text-4xl font-display font-black italic uppercase tracking-tighter">Processed <span className="text-accent neon-text">Logic</span></h2>
                      <p className="opacity-40 text-xs font-mono uppercase tracking-widest mt-2 px-1">Compiled successfully</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16 px-2">
                    <StatBox icon={<Calendar className="text-accent" />} label="Timeframe" value="90D" />
                    <StatBox icon={<TrendingUp className="text-neon-magenta" />} label="Yield" value="HIGH" />
                    <StatBox icon={<Mountain className="text-neon-yellow" />} label="Altitude" value="PEAK" />
                    <StatBox icon={<Clock className="text-accent" />} label="Cycles" value="45M" />
                  </div>

                  <div className="prose prose-invert max-w-none bg-black/40 rounded-[3rem] p-10 md:p-14 border border-white/5 whitespace-pre-wrap leading-relaxed font-sans text-white/70 italic text-lg shadow-inner">
                    {plan}
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {view === 'login' && (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="pt-32 pb-20 px-6 min-h-screen flex items-center justify-center"
          >
            <div className="max-w-md w-full">
              <div className="text-center mb-12">
                <div className="w-20 h-20 bg-accent rounded-3xl flex items-center justify-center mx-auto mb-8 neon-box text-black">
                  <Zap className="fill-black w-10 h-10" />
                </div>
                <h1 className="text-5xl font-display font-black mb-4 uppercase italic tracking-tighter">Link <span className="text-accent neon-text">Authorized</span></h1>
                <p className="opacity-40 font-bold uppercase tracking-[0.2em] text-[10px]">Access the neural net</p>
              </div>

              <form onSubmit={handleSignIn} className="bg-white/5 p-10 rounded-[3rem] border border-white/10 space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-[40px] rounded-full" />
                <div className="space-y-6">
                  <AuthInput 
                    icon={<Mail className="w-5 h-5 text-accent" />} 
                    label="Neural ID (Email)" 
                    type="email" 
                    name="email"
                    value={authForm.email}
                    onChange={handleAuthInputChange}
                    placeholder="operator@vox.net" 
                  />
                  <AuthInput 
                    icon={<Lock className="w-5 h-5 text-accent" />} 
                    label="Access Key (Password)" 
                    type="password" 
                    name="password"
                    value={authForm.password}
                    onChange={handleAuthInputChange}
                    placeholder="••••••••" 
                  />
                </div>

                {authError && (
                  <div className="bg-red-50 text-red-500 p-4 rounded-xl text-xs font-bold uppercase tracking-widest text-center border border-red-100">
                    {authError}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest px-1">
                  <label className="flex items-center gap-2 cursor-pointer group hover:text-accent transition-colors">
                    <input type="checkbox" className="w-4 h-4 rounded border-black/10 text-accent focus:ring-accent focus:ring-offset-0" />
                    <span className="text-black/40 group-hover:text-black transition-colors">Remember me</span>
                  </label>
                  <a href="#" className="text-accent hover:opacity-80 transition-opacity">Forgot Password?</a>
                </div>

                <button 
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-black text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black/90 transition-all active:scale-95 shadow-xl shadow-black/5 disabled:opacity-50"
                >
                  {authLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Sign In <ArrowRight className="w-5 h-5" /></>}
                </button>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-black/5"></div></div>
                  <div className="relative flex justify-center text-[10px] items-center"><span className="bg-white px-4 text-black/20 font-bold uppercase tracking-[0.2em]">Or continue with</span></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <SocialAuthButton label="Google" icon="https://www.google.com/favicon.ico" />
                  <SocialAuthButton label="Github" icon="https://github.com/favicon.ico" />
                </div>
              </form>

              <p className="text-center mt-8 text-sm text-black/40 font-medium">
                Don't have an account? <button onClick={() => { setView('signup'); setAuthError(null); }} className="text-accent font-bold hover:underline">Register now</button>
              </p>
            </div>
          </motion.div>
        )}

        {view === 'signup' && (
          <motion.div
            key="signup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="pt-32 pb-20 px-6 min-h-screen flex items-center justify-center bg-[#fbfbf9]"
          >
            <div className="max-w-md w-full">
              <div className="text-center mb-10">
                <div className="w-16 h-16 bg-accent rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-accent/20">
                  <Zap className="text-white w-8 h-8" />
                </div>
                <h1 className="text-4xl font-serif font-bold mb-2 text-black">Start your evolution</h1>
                <p className="text-black/40">Join a collective of high achievers</p>
              </div>

              <form onSubmit={handleSignUp} className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl shadow-black/5 border border-black/5 space-y-6">
                <div className="space-y-4 text-black">
                  <AuthInput 
                    icon={<User className="w-5 h-5" />} 
                    label="Full Name" 
                    type="text" 
                    name="fullName"
                    value={authForm.fullName}
                    onChange={handleAuthInputChange}
                    placeholder="Alex Rivera" 
                  />
                  <AuthInput 
                    icon={<Mail className="w-5 h-5" />} 
                    label="Email Address" 
                    type="email" 
                    name="email"
                    value={authForm.email}
                    onChange={handleAuthInputChange}
                    placeholder="alex@example.com" 
                  />
                  <AuthInput 
                    icon={<Lock className="w-5 h-5" />} 
                    label="Password" 
                    type="password" 
                    name="password"
                    value={authForm.password}
                    onChange={handleAuthInputChange}
                    placeholder="At least 8 characters" 
                  />
                </div>

                {authError && (
                  <div className="bg-red-50 text-red-500 p-4 rounded-xl text-xs font-bold uppercase tracking-widest text-center border border-red-100">
                    {authError}
                  </div>
                )}

                <div className="px-1">
                  <p className="text-[10px] text-black/40 leading-relaxed font-medium">
                    By clicking "Create Account", you agree to our <a href="#" className="text-accent hover:underline">Terms of Service</a> and <a href="#" className="text-accent hover:underline">Privacy Policy</a>.
                  </p>
                </div>

                <button 
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-black text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black/90 transition-all active:scale-95 shadow-xl shadow-black/5 disabled:opacity-50"
                >
                  {authLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Create Account <ArrowRight className="w-5 h-5" /></>}
                </button>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-black/5"></div></div>
                  <div className="relative flex justify-center text-[10px] items-center"><span className="bg-white px-4 text-black/20 font-bold uppercase tracking-[0.2em]">One-click registration</span></div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <SocialAuthButton label="Continue with Google" icon="https://www.google.com/favicon.ico" />
                </div>
              </form>

              <p className="text-center mt-8 text-sm text-black/40 font-medium">
                Already have an account? <button onClick={() => { setView('login'); setAuthError(null); }} className="text-accent font-bold hover:underline">Sign in instead</button>
              </p>
            </div>
          </motion.div>
        )}
        {view === 'verify' && (
          <motion.div
            key="verify"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="pt-32 pb-20 px-6 min-h-screen flex items-center justify-center bg-[#fbfbf9]"
          >
            <div className="max-w-md w-full text-center">
              <div className="w-20 h-20 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-serif font-bold mb-4 text-black">Verify your email</h2>
              <p className="text-black/60 leading-relaxed mb-10 text-balance px-4">
                We have sent you a verification email to <span className="text-black font-bold font-mono">{verificationEmail}</span>. Please verify it and log in.
              </p>
              
              <div className="space-y-4">
                <button 
                  onClick={() => {
                    setView('login');
                    setAuthError(null);
                  }}
                  className="w-full bg-black text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black/90 transition-all active:scale-95 shadow-xl shadow-black/5"
                >
                  Return to Login
                  <ArrowRight className="w-5 h-5" />
                </button>
                <p className="text-[10px] text-black/30 font-bold uppercase tracking-[0.2em]">
                  Didn't receive it? <button className="text-accent underline hover:opacity-80 transition-opacity">Resend Email</button>
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-black/5 bg-brand-secondary/20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="max-w-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-accent rounded flex items-center justify-center neon-box text-black">
                <Zap className="fill-black w-5 h-5" />
              </div>
              <span className="font-display font-black text-2xl tracking-tighter uppercase neon-text">Vispro AI</span>
            </div>
            <p className="text-sm opacity-50 leading-relaxed mb-8 font-medium italic">
              Empowering neural architectures to reach absolute peak performance through quantum-validated habit design.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-16">
            <FooterLinkGroup 
              title="System" 
              links={['Features', 'Intelligence', 'Core Net', 'Security']} 
            />
            <FooterLinkGroup 
              title="Matrix" 
              links={['Case Studies', 'Methodology', 'Academy', 'Library']} 
            />
            <FooterLinkGroup 
              title="Network" 
              links={['Privacy', 'Ethics', 'Careers', 'Contact']} 
            />
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-20 flex justify-between items-center text-[10px] font-black uppercase tracking-[0.4em] opacity-30">
          <span>&copy; 2026 VISPRO NEURAL NETWORKS</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-accent transition-colors">X-CORE</a>
            <a href="#" className="hover:text-accent transition-colors">LINK-ID</a>
            <a href="#" className="hover:text-accent transition-colors">SUBSPACE</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function AuthInput({ icon, label, type, name, value, onChange, placeholder }: { icon: React.ReactNode, label: string, type: string, name: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder: string }) {
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 px-2">{label}</label>
      <div className="relative group">
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-accent group-focus-within:neon-text transition-all">
          {icon}
        </div>
        <input 
          type={type} 
          name={name}
          value={value}
          onChange={onChange}
          required
          className="w-full bg-black/40 pl-14 pr-6 py-5 rounded-2xl border border-white/10 focus:border-accent outline-none transition-all placeholder:text-white/10 font-bold"
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

function SocialAuthButton({ label, icon }: { label: string, icon: string }) {
  return (
    <button className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 hover:border-accent transition-all active:scale-95 group">
      <img src={icon} alt={label} className="w-5 h-5 grayscale group-hover:grayscale-0 transition-all shadow-none" referrerPolicy="no-referrer" />
      <span className="text-[10px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100">{label}</span>
    </button>
  );
}

function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      viewport={{ once: true }}
      className="p-10 rounded-[3rem] bg-brand-secondary border border-white/5 hover:border-accent hover:translate-y-[-8px] transition-all group cyber-border relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 blur-[40px] rounded-full group-hover:bg-accent/10 transition-colors" />
      <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mb-10 text-accent group-hover:bg-accent group-hover:text-black transition-all">
        {icon}
      </div>
      <h3 className="text-2xl font-display font-black mb-4 uppercase italic tracking-tighter">{title}</h3>
      <p className="opacity-40 leading-relaxed font-bold tracking-tight text-sm">{description}</p>
    </motion.div>
  );
}

function StatBox({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="bg-white/5 border border-white/10 p-8 rounded-3xl text-center group hover:border-accent transition-all relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-accent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center mx-auto mb-4 text-accent transition-transform group-hover:scale-110">
        {icon}
      </div>
      <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-2">{label}</div>
      <div className="text-2xl font-display font-black tracking-tighter text-accent neon-text">{value}</div>
    </div>
  );
}

function FooterLinkGroup({ title, links }: { title: string, links: string[] }) {
  return (
    <div className="flex flex-col gap-4">
      <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 mb-2">{title}</h4>
      {links.map(link => (
        <a key={link} href="#" className="text-sm font-medium hover:text-accent transition-colors">{link}</a>
      ))}
    </div>
  );
}
