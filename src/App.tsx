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
  Star
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
      <div className="min-h-screen flex items-center justify-center bg-[#fbfbf9]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-black/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button 
            onClick={() => setView(user ? 'dashboard' : 'landing')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-black">Vantage AI</span>
          </button>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium opacity-60 text-black">
            <a href="#features" className="hover:opacity-100 transition-opacity" onClick={(e) => { e.preventDefault(); setView(user ? 'dashboard' : 'landing'); setTimeout(() => document.getElementById('features')?.scrollIntoView({behavior: 'smooth'}), 100); }}>Features</a>
            <a href="#about" className="hover:opacity-100 transition-opacity">About</a>
            {user ? (
              <button onClick={() => setView('dashboard')} className="hover:opacity-100 transition-opacity font-bold text-accent">Dashboard</button>
            ) : (
              <button onClick={() => setView('landing')} className="hover:opacity-100 transition-opacity">Start Now</button>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="hidden sm:flex flex-col items-end mr-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-black/40">Logged in as</span>
                  <span className="text-xs font-semibold text-black truncate max-w-[120px]">{user.email}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-black/5 hover:bg-black/10 text-black px-4 py-2 rounded-full text-sm font-semibold transition-all active:scale-95"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => setView('login')}
                  className="text-sm font-semibold text-black/60 hover:text-black transition-colors"
                >
                  Log in
                </button>
                <button 
                  onClick={() => setView('signup')}
                  className="bg-black text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-black/80 transition-all active:scale-95 shadow-lg shadow-black/5"
                >
                  Get Started
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
            <section className="relative pt-40 pb-20 px-6 overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl aspect-square bg-[radial-gradient(circle_at_center,var(--color-accent),transparent_70%)] opacity-[0.03] -z-10" />
              
              <div className="max-w-4xl mx-auto text-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <span className="inline-block py-1 px-3 rounded-full bg-accent/10 text-accent text-xs font-bold uppercase tracking-widest mb-6">
                    The Future of Personal Growth
                  </span>
                  <h1 className="text-6xl md:text-8xl font-serif font-bold leading-[0.9] tracking-tighter mb-8 text-balance text-black">
                    Design your life with <span className="italic text-accent">precision.</span>
                  </h1>
                  <p className="text-xl text-black/60 max-w-2xl mx-auto mb-10 text-balance leading-relaxed">
                    Vantage AI leverages advanced neural models to help you structure your habits, achieve your ambitions, and overcome your barriers.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button 
                      onClick={() => setView('signup')}
                      className="w-full sm:w-auto bg-black text-white px-8 py-4 rounded-2xl flex items-center justify-center gap-2 font-semibold hover:gap-4 transition-all"
                    >
                      Create My Plan <ArrowRight className="w-5 h-5" />
                    </button>
                    <button className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white border border-black/10 font-semibold hover:bg-black/5 transition-colors text-black">
                      How it works
                    </button>
                  </div>
                </motion.div>
              </div>
            </section>

            {/* Features Content */}
            <section id="features" className="py-24 px-6 bg-brand-secondary/30">
              <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-black">
                  <FeatureCard 
                    icon={<Brain className="w-6 h-6" />}
                    title="Cognitive Analysis"
                    description="Identify subconscious patterns that hold you back from peak performance."
                    delay={0.1}
                  />
                  <FeatureCard 
                    icon={<Target className="w-6 h-6" />}
                    title="Goal Architect"
                    description="Deconstruct massive ambitions into actionable, daily atomic tasks."
                    delay={0.2}
                  />
                  <FeatureCard 
                    icon={<Zap className="w-6 h-6" />}
                    title="Adaptive Planning"
                    description="Our AI recalibrates your schedule based on your progress and energy levels."
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
            <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 text-accent mb-4"
                >
                  <Star className="w-5 h-5 fill-accent" />
                  <span className="text-xs font-bold uppercase tracking-[0.2em]">Strategic Command</span>
                </motion.div>
                <h1 className="text-4xl md:text-6xl font-serif font-bold text-black tracking-tight">
                  Welcome back, <span className="italic text-accent">Achiever.</span>
                </h1>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setView('landing')}
                  className="px-6 py-3 bg-black text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-black/80 transition-all flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  New Analysis
                </button>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Daily Quote Hero */}
              <div className="lg:col-span-8 flex flex-col gap-8 text-black">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-black text-white p-10 md:p-14 rounded-[3rem] relative overflow-hidden group shadow-2xl shadow-black/20"
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 blur-[100px] -mr-32 -mt-32 rounded-full" />
                  <Quote className="w-12 h-12 text-accent/30 mb-8" />
                  <blockquote className="relative">
                    <p className="text-3xl md:text-5xl font-serif italic leading-tight mb-8 text-balance">
                      "{randomQuote.text}"
                    </p>
                    <footer className="flex items-center gap-4">
                      <div className="w-10 h-[1px] bg-accent" />
                      <cite className="text-accent font-bold uppercase tracking-widest text-sm not-italic">
                        {randomQuote.author}
                      </cite>
                    </footer>
                  </blockquote>
                </motion.div>

                {/* Plan Generator Trigger */}
                <div className="bg-white border border-black/5 p-10 rounded-[3rem] shadow-xl shadow-black/5">
                   <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center">
                        <Compass className="text-accent w-6 h-6" />
                      </div>
                      <h2 className="text-2xl font-bold">Plan your next evolution</h2>
                   </div>
                   
                   <form onSubmit={generatePlan} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 px-1">Primary Objective</label>
                        <input 
                          type="text" 
                          name="goals"
                          value={formData.goals}
                          onChange={handleInputChange}
                          className="w-full px-5 py-4 rounded-2xl border border-black/10 focus:border-accent focus:ring-4 focus:ring-accent/5 outline-none transition-all placeholder:text-black/20"
                          placeholder="e.g. Master high-performance habits"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 px-1">Active Barriers</label>
                        <input 
                          type="text" 
                          name="challenges"
                          value={formData.challenges}
                          onChange={handleInputChange}
                          className="w-full px-5 py-4 rounded-2xl border border-black/10 focus:border-accent focus:ring-4 focus:ring-accent/5 outline-none transition-all placeholder:text-black/20"
                          placeholder="e.g. Procrastination in morning"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col justify-end">
                      <button 
                        type="submit"
                        disabled={isGenerating}
                        className="w-full bg-black text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black/90 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                      >
                        {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Generate Strategic Insight <ArrowRight className="w-5 h-5" /></>}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Sidebar: Insights & Tips */}
              <div className="lg:col-span-4 space-y-8 text-black">
                <div className="bg-[#fbfbf9] border border-black/5 p-8 rounded-[3rem]">
                  <div className="flex items-center gap-3 mb-8">
                    <Lightbulb className="w-5 h-5 text-accent" />
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-black">Strategic Suggestions</h3>
                  </div>
                  
                  <div className="space-y-6">
                    {STRATEGIC_TIPS.map((tip, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={idx} 
                        className="group cursor-default"
                      >
                        <div className="flex items-start gap-4 mb-2">
                          <div className="mt-1 w-8 h-8 rounded-lg bg-white border border-black/5 flex items-center justify-center shadow-sm group-hover:bg-accent group-hover:text-white transition-all">
                            {tip.icon}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm mb-1 group-hover:text-accent transition-colors">{tip.title}</h4>
                            <p className="text-[11px] text-black/40 leading-relaxed font-medium">{tip.desc}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-10 pt-8 border-t border-black/5">
                    <div className="bg-accent/5 p-6 rounded-2xl flex items-center gap-4">
                      <Trophy className="w-8 h-8 text-accent" />
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-accent mb-1">Weekly progress</div>
                        <div className="text-lg font-bold">12/15 Habits</div>
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
                  className="mt-12 bg-black text-white p-8 md:p-14 rounded-[3rem] shadow-2xl shadow-black/20"
                >
                  <div className="flex items-center gap-4 mb-12">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <Layout className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-serif italic">Your Strategic Blueprint</h2>
                      <p className="text-white/40 text-sm font-mono uppercase tracking-widest">Calculated Real-time</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                    <StatBox icon={<Calendar />} label="Duration" value="90 Days" />
                    <StatBox icon={<TrendingUp />} label="Intensity" value="High" />
                    <StatBox icon={<Mountain />} label="Focus" value="Growth" />
                    <StatBox icon={<Clock />} label="Daily Commit" value="45m" />
                  </div>

                  <div className="prose prose-invert max-w-none bg-white/5 rounded-[2rem] p-8 md:p-12 border border-white/10 whitespace-pre-wrap leading-relaxed font-sans text-white/80">
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
              <div className="text-center mb-10">
                <div className="w-16 h-16 bg-black rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-black/10">
                  <Sparkles className="text-white w-8 h-8" />
                </div>
                <h1 className="text-4xl font-serif font-bold mb-2 text-black">Welcome back</h1>
                <p className="text-black/40">Continue your journey with Vantage AI</p>
              </div>

              <form onSubmit={handleSignIn} className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl shadow-black/5 border border-black/5 space-y-6">
                <div className="space-y-4">
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
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
                <Sparkles className="text-white w-4 h-4" />
              </div>
              <span className="font-bold text-lg tracking-tight">Vantage AI</span>
            </div>
            <p className="text-sm text-black/50 leading-relaxed mb-8">
              Empowering individuals to reach their absolute peak performance through intelligent habit design and cognitive optimization.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-16">
            <FooterLinkGroup 
              title="Platform" 
              links={['Features', 'Intelligence', 'Science', 'Security']} 
            />
            <FooterLinkGroup 
              title="Resources" 
              links={['Case Studies', 'Methodology', 'Academy', 'Library']} 
            />
            <FooterLinkGroup 
              title="Global" 
              links={['Privacy', 'Ethics', 'Careers', 'Contact']} 
            />
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-20 flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em] text-black/30">
          <span>&copy; 2026 VANTAGE ANALYTICS CORP</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-black">Twitter</a>
            <a href="#" className="hover:text-black">LinkedIn</a>
            <a href="#" className="hover:text-black">Substack</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function AuthInput({ icon, label, type, name, value, onChange, placeholder }: { icon: React.ReactNode, label: string, type: string, name: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder: string }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-black/40 px-1">{label}</label>
      <div className="relative group text-black">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20 group-focus-within:text-accent transition-colors">
          {icon}
        </div>
        <input 
          type={type} 
          name={name}
          value={value}
          onChange={onChange}
          required
          className="w-full pl-12 pr-4 py-4 rounded-2xl border border-black/10 focus:border-accent focus:ring-4 focus:ring-accent/5 outline-none transition-all placeholder:text-black/10 text-sm font-medium"
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

function SocialAuthButton({ label, icon }: { label: string, icon: string }) {
  return (
    <button className="flex items-center justify-center gap-3 px-4 py-4 rounded-2xl border border-black/10 hover:bg-black/5 transition-all active:scale-95 group">
      <img src={icon} alt={label} className="w-5 h-5 grayscale group-hover:grayscale-0 transition-all" referrerPolicy="no-referrer" />
      <span className="text-xs font-bold uppercase tracking-widest text-black/60">{label}</span>
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
      className="p-8 group hover:bg-white transition-all rounded-[2rem] hover:shadow-2xl hover:shadow-black/5"
    >
      <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center mb-6 group-hover:bg-accent transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-black/50 leading-relaxed text-sm">{description}</p>
    </motion.div>
  );
}

function StatBox({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="bg-white/5 border border-white/5 p-6 rounded-2xl">
      <div className="text-accent mb-3">{icon}</div>
      <div className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-1">{label}</div>
      <div className="text-xl font-bold">{value}</div>
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
