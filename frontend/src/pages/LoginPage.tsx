// @ts-nocheck
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotification } from '../context/NotificationContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Sun, Moon, Loader2, ArrowRight, Cpu, BarChart3, Wrench, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import vigyaniLogo from '../../assets/vigyani-logo.png';
import sfmLogo from '../../assets/SFM-logo-updated-transparent.png';

const BrandLogo = ({ isDark, size = "large" }) => {
  const iconSize = size === "large" ? "h-40 lg:h-48 xl:h-64 w-auto max-w-full object-contain" : "h-24 w-auto max-w-full object-contain";
  
  return (
    <div className="flex -ml-8 items-center gap-4 group/logo cursor-pointer">
      <div className="relative flex items-center justify-center">
        <div className={`absolute inset-0 blur-3xl rounded-full opacity-0 group-hover/logo:opacity-50 transition-opacity duration-300 ${isDark ? 'bg-rose-500/40' : 'bg-blue-500/30'}`} />
        <img 
          src={sfmLogo} 
          alt="SFM Spartans Facility Management" 
          className={`${iconSize} relative z-10 transition-transform duration-300 group-hover/logo:scale-105 drop-shadow-2xl`} 
        />
      </div>
    </div>
  );
};


/* ── Feature items for the left panel ── */
const features = [
  { icon: Cpu, label: 'Asset Tracking', desc: 'AI-powered monitoring' },
  { icon: Wrench, label: 'Smart Maintenance', desc: 'Predictive scheduling' },
  { icon: BarChart3, label: 'Real-time Insights', desc: 'Live dashboards' },
];

/* ── Stagger helpers ── */
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.3 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  const isDark = theme === 'dark';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      addNotification('success', 'Welcome back!');
      navigate('/');
    } catch (error) {
      addNotification('error', error.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex selection:bg-rose-500/30 ${isDark ? 'bg-[#0a0e1a]' : 'bg-white'}`}>
      
      {/* ═══════════════════ LEFT SIDE — Branding Panel ═══════════════════ */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">

        {/* ── Theme Backgrounds (Instant Transition) ── */}
        <div className={`absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-rose-50/40 ${isDark ? 'hidden' : 'block'}`} />
        <div className={`absolute inset-0 bg-gradient-to-br from-[#0f1629] via-[#0a0e1a] to-[#0d1117] ${isDark ? 'block' : 'hidden'}`} />

        {/* ── Layer 1: Animated dot-grid ── */}
        <div
          className={`absolute inset-0 ${isDark ? 'hidden' : 'block'}`}
          style={{ backgroundImage: 'radial-gradient(circle, hsl(var(--primary)/0.15) 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }}
        />
        <div
          className={`absolute inset-0 ${isDark ? 'block' : 'hidden'}`}
          style={{ backgroundImage: 'radial-gradient(circle, hsl(var(--primary)/0.05) 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }}
        />

        {/* ── Layer 3: Floating gradient orbs ── */}
        <motion.div
          animate={{ x: [0, 30, -10, 0], y: [0, -20, 15, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className={`absolute -top-24 -left-24 w-[520px] h-[520px] rounded-full blur-[100px] ${isDark ? 'bg-blue-600/15' : 'bg-rose-400/10'}`}
        />
        <motion.div
          animate={{ x: [0, -25, 20, 0], y: [0, 25, -15, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          className={`absolute -bottom-32 -right-20 w-[480px] h-[480px] rounded-full blur-[100px] ${isDark ? 'bg-rose-600/15' : 'bg-blue-300/10'}`}
        />

        {/* ── Layer 4: Subtle horizontal glow lines ── */}
        <div className={`absolute top-[30%] left-0 right-0 h-px bg-gradient-to-r from-transparent ${isDark ? 'via-rose-500/15' : 'via-rose-500/10'} to-transparent`} />
        <div className={`absolute top-[70%] left-0 right-0 h-px bg-gradient-to-r from-transparent ${isDark ? 'via-blue-500/15' : 'via-blue-500/10'} to-transparent`} />

        {/* ── Layer 5: Vertical border/divider ── */}
        <div className={`absolute top-0 bottom-0 right-0 w-px ${isDark ? 'bg-white/[0.04]' : 'bg-slate-200'}`} />

        {/* ═══ CONTENT ═══ */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full h-full">

          {/* ── Top: Logo ── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <BrandLogo size="large" isDark={isDark} />
          </motion.div>

          {/* ── Middle: Hero copy + Features ── */}
          <div className="flex flex-col gap-12 xl:gap-14 mt-4">
            {/* Hero text */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-6"
            >
              <h1 className={`text-4xl xl:text-[3.75rem] font-black tracking-tight leading-[1.1] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Smart Facility{' '}
                <br className="hidden xl:block" />
                Management,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-500 bg-[length:200%_200%] animate-gradient-shift">
                  Simplified.
                </span>
              </h1>
              <p className={`text-lg xl:text-xl max-w-md leading-relaxed font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Harness <span className="text-rose-500 font-bold">AI-driven intelligence</span> to
                automate workflows, predict maintenance, and optimize every square foot of your infrastructure.
              </p>
            </motion.div>

            {/* Feature pills */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-4"
            >
              {features.map((f) => (
                <motion.div
                  key={f.label}
                  variants={itemVariants}
                  whileHover={{ x: 8 }}
                  className={`group/feat flex items-center gap-5 px-6 py-4 rounded-2xl
                    transition-all duration-300 cursor-default w-fit shadow-sm
                    ${isDark 
                      ? 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-rose-500/40' 
                      : 'bg-white/60 backdrop-blur-md border border-slate-200 hover:border-rose-400/30 hover:shadow-lg hover:shadow-rose-100'}`}
                >
                  <div className={`flex items-center justify-center w-11 h-11 rounded-xl
                    transition-all duration-300 ring-1
                    ${isDark 
                      ? 'bg-gradient-to-br from-rose-500/20 to-blue-600/10 ring-rose-500/20 group-hover/feat:ring-rose-500/50 group-hover/feat:shadow-[0_0_15px_hsl(346,87%,60%,0.3)]' 
                      : 'bg-gradient-to-br from-rose-50 to-blue-50 ring-rose-500/10 group-hover/feat:bg-rose-100/50 group-hover/feat:ring-rose-500/30'}`}
                  >
                    <f.icon className="h-5 w-5 text-rose-500 transition-transform duration-300 group-hover/feat:scale-110" />
                  </div>
                  <div>
                    <p className={`text-base font-bold tracking-tight ${isDark ? 'text-white/95' : 'text-slate-800'}`}>
                      {f.label}
                    </p>
                    <p className={`text-sm font-semibold ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                      {f.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* ── Bottom: Branding footer ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-col gap-6 mt-auto pt-8"
          >
            <div className={`h-px w-full ${isDark ? 'bg-gradient-to-r from-transparent via-white/[0.08] to-transparent' : 'bg-gradient-to-r from-transparent via-slate-200 to-transparent'}`} />
            <div className="flex items-center justify-between">
              <p className={`text-xs font-bold tracking-[0.15em] uppercase ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                © 2025 SFM — Intelligence first
              </p>
              <div className="flex items-center gap-3 group/vigyani cursor-pointer">
                <span className={`text-xs font-bold ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                  Powered by
                </span>
                <div className="relative p-1.5 rounded-lg transition-transform duration-300 group-hover/vigyani:scale-110">
                  <img
                    src={vigyaniLogo}
                    alt="Vigyani AI"
                    className="h-6 w-auto transition-transform duration-700 group-hover/vigyani:rotate-[360deg] drop-shadow-md"
                  />
                </div>
                <span className="text-xs font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-rose-500 to-indigo-500 opacity-80 group-hover/vigyani:opacity-100 transition-opacity duration-300">
                  Vigyani AI
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ═══════════════════ RIGHT SIDE — Login Form ═══════════════════ */}
      <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden bg-transparent">
        
        {/* Right Side Theme Background */}
        <div className={`absolute inset-0 bg-slate-50/50 ${isDark ? 'hidden' : 'block'}`} />
        <div className={`absolute inset-0 bg-[#0d1117]/50 ${isDark ? 'block' : 'hidden'}`} />

        {/* Theme toggle */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.8 }}
          className="absolute top-8 right-8 z-50"
        >
          <Button
            variant="outline"
            size="icon"
            className={`rounded-full w-12 h-12 shadow-sm transition-all duration-300 backdrop-blur-md border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 ${isDark ? 'hover:shadow-rose-500/10' : 'hover:shadow-rose-500/20'}`}
            onClick={toggleTheme}
            data-testid="login-theme-toggle"
          >
            <div className="relative w-5 h-5">
              <Sun className={`absolute inset-0 w-5 h-5 text-amber-500 transition-transform duration-300 ease-in-out ${isDark ? 'rotate-90 opacity-0 scale-50' : 'rotate-0 opacity-100 scale-100'}`} />
              <Moon className={`absolute inset-0 w-5 h-5 text-indigo-400 transition-transform duration-300 ease-in-out ${isDark ? 'rotate-0 opacity-100 scale-100' : '-rotate-90 opacity-0 scale-50'}`} />
            </div>
          </Button>
        </motion.div>

        {/* Login Card — glassmorphism + floating animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md animate-float relative z-10"
        >
          <Card
            className={`
              relative overflow-hidden
              backdrop-blur-2xl
              rounded-[2rem]
              border-t-4 border-t-rose-500
              ${isDark 
                ? 'bg-[#161b22]/80 border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:shadow-[0_25px_60px_rgba(0,0,0,0.6)]' 
                : 'bg-white/80 border-black/[0.05] shadow-[0_20px_50px_rgba(0,0,0,0.08)] hover:shadow-[0_25px_60px_rgba(0,0,0,0.12)]'}
            `}
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-500/40 to-transparent" />

            <CardHeader className="space-y-4 text-center pb-10 pt-12">
              <div className="flex items-center justify-center mb-6 lg:hidden">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <BrandLogo size="small" isDark={isDark} />
                </motion.div>
              </div>
              <CardTitle className={`text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Welcome back
              </CardTitle>
              <CardDescription className={`text-base font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Enter your credentials to access your secure portal
              </CardDescription>
            </CardHeader>

            <CardContent className="pb-12 px-10">
              <form onSubmit={handleSubmit} className="space-y-7">
                {/* Email field */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="space-y-3 group/input"
                >
                  <Label
                    htmlFor="email"
                    className={`text-sm font-bold tracking-widest uppercase transition-colors duration-300 group-focus-within/input:text-rose-500 
                      ${isDark ? 'text-slate-400' : 'text-slate-500'}
                    `}
                  >
                    Email Address
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@demo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={`
                        h-14 text-base rounded-2xl
                        backdrop-blur-sm
                        transition-all duration-300 ease-in-out
                        focus:scale-[1.015]
                        focus:ring-2 focus:ring-rose-500/20
                        focus:border-rose-500/50
                        ${isDark 
                          ? 'bg-background/40 border-border/50 focus:bg-background/80 placeholder:text-muted-foreground/30 text-white' 
                          : 'bg-slate-50/80 border-slate-200 focus:bg-white placeholder:text-slate-400 text-slate-900'}
                      `}
                      data-testid="login-email-input"
                    />
                  </div>
                </motion.div>

                {/* Password field */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="space-y-3 group/input"
                >
                  <Label
                    htmlFor="password"
                    className={`text-sm font-bold tracking-widest uppercase transition-colors duration-300 group-focus-within/input:text-rose-500 
                      ${isDark ? 'text-slate-400' : 'text-slate-500'}
                    `}
                  >
                    Secure Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className={`
                        h-14 text-base rounded-2xl
                        backdrop-blur-sm
                        transition-all duration-300 ease-in-out
                        focus:scale-[1.015]
                        focus:ring-2 focus:ring-rose-500/20
                        focus:border-rose-500/50
                        ${isDark 
                          ? 'bg-background/40 border-border/50 focus:bg-background/80 placeholder:text-muted-foreground/30 text-white' 
                          : 'bg-slate-50/80 border-slate-200 focus:bg-white placeholder:text-slate-400 text-slate-900'}
                      `}
                      data-testid="login-password-input"
                    />
                  </div>
                </motion.div>

                {/* Submit button */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="pt-4"
                >
                  <Button
                    type="submit"
                    className="
                      w-full h-14 text-base font-bold rounded-2xl text-white
                      bg-gradient-to-r from-rose-600 via-rose-500 to-indigo-600
                      bg-[length:200%_auto] hover:bg-right
                      transition-all duration-500 ease-in-out
                      active:scale-[0.97]
                      hover:scale-[1.03]
                      hover:shadow-[0_12px_40px_rgba(225,29,72,0.4)]
                      group/btn overflow-hidden relative
                    "
                    disabled={loading}
                    data-testid="login-submit-btn"
                  >
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-1000 ease-in-out" />
                    
                    <span className="relative flex items-center justify-center gap-3">
                      {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : null}
                      <span className="tracking-wide">Sign In to Dashboard</span>
                      {!loading && (
                        <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover/btn:translate-x-2" />
                      )}
                    </span>
                  </Button>
                </motion.div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
