import { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, simulationAPI } from '../services/api';

type Theme = 'light' | 'dark';

/* ─────────────────────────────────────────────
   INJECT GLOBAL STYLES (fonts, keyframes, vars)
───────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:ital,wght@0,400;0,500;1,400&family=Instrument+Serif:ital@0;1&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --accent: #00e5a0;
    --accent-dim: rgba(0,229,160,0.12);
    --accent-glow: rgba(0,229,160,0.35);
    --red: #ff4d6a;
    --red-dim: rgba(255,77,106,0.12);
    --yellow: #ffc94d;
    --yellow-dim: rgba(255,201,77,0.12);
    --blue: #4d9fff;
    --blue-dim: rgba(77,159,255,0.12);
    --font-display: 'Syne', sans-serif;
    --font-mono: 'DM Mono', monospace;
    --font-serif: 'Instrument Serif', serif;
    --radius-sm: 8px;
    --radius-md: 14px;
    --radius-lg: 22px;
    --radius-xl: 32px;
    --trans: 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* DARK THEME (DEFAULT) */
  [data-smartdash="dark"] {
    --bg: #080b10;
    --bg-2: #0d1117;
    --bg-3: #111620;
    --bg-4: #161c28;
    --bg-5: #1c2333;
    --border: rgba(255,255,255,0.07);
    --border-strong: rgba(255,255,255,0.14);
    --text-1: #f0f4ff;
    --text-2: #8899b4;
    --text-3: #4e607a;
    --surface-glass: rgba(255,255,255,0.03);
  }

  /* LIGHT THEME */
  [data-smartdash="light"] {
    --bg: #f2f4f8;
    --bg-2: #ffffff;
    --bg-3: #f8f9fd;
    --bg-4: #eef0f8;
    --bg-5: #e4e8f4;
    --border: rgba(0,0,0,0.07);
    --border-strong: rgba(0,0,0,0.13);
    --text-1: #0a0e1a;
    --text-2: #4e607a;
    --text-3: #8899b4;
    --surface-glass: rgba(255,255,255,0.6);
  }

  @keyframes dash-fadein {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes dash-spin {
    to { transform: rotate(360deg); }
  }
  @keyframes dash-pulse-ring {
    0%   { box-shadow: 0 0 0 0 var(--accent-glow); }
    70%  { box-shadow: 0 0 0 10px transparent; }
    100% { box-shadow: 0 0 0 0 transparent; }
  }
  @keyframes dash-shimmer {
    0%   { background-position: -600px 0; }
    100% { background-position: 600px 0; }
  }
  @keyframes dash-float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-6px); }
  }
  @keyframes scanline {
    0%   { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
  }

  /* SCROLLBAR */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 99px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--text-3); }
`;

function injectStyles() {
  if (document.getElementById('smartdash-styles')) return;
  const el = document.createElement('style');
  el.id = 'smartdash-styles';
  el.textContent = GLOBAL_CSS;
  document.head.appendChild(el);
}

/* ─────────────────────────────────────────────
   ANIMATED NUMBER
───────────────────────────────────────────── */
function AnimatedNumber({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    const start = performance.now();
    const duration = 900;
    const from = 0;
    const to = value;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * ease);
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);
  return <>{display.toFixed(decimals)}</>;
}

/* ─────────────────────────────────────────────
   SPARKLINE
───────────────────────────────────────────── */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data.length) return null;
  const w = 80, h = 32, pad = 2;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  }).join(' ');
  const area = `M ${pts.split(' ')[0]} L ${pts.split(' ').join(' L ')} L ${w - pad},${h - pad} L ${pad},${h - pad} Z`;
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg-${color.replace('#', '')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts.split(' ')[pts.split(' ').length - 1].split(',')[0]} cy={pts.split(' ')[pts.split(' ').length - 1].split(',')[1]} r="3" fill={color} />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   MAIN DASHBOARD
───────────────────────────────────────────── */
export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [simulations, setSimulations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllRecent, setShowAllRecent] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as Theme) || 'dark';
  });
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => { injectStyles(); }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    rootRef.current?.setAttribute('data-smartdash', theme);
  }, [theme]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/login'); return; }
      const [userResponse, simulationsResponse] = await Promise.all([
        authAPI.getCurrentUser(),
        simulationAPI.getAll(),
      ]);
      setUser(userResponse.data);
      setSimulations(simulationsResponse.data);
    } catch (error: any) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setUser({ username: 'User', purpose: 'N/A' });
        setSimulations([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => { localStorage.removeItem('token'); navigate('/login'); };
  const toggleTheme = () => setTheme(p => p === 'light' ? 'dark' : 'light');
  const handleSimulationClick = (simId: number) => navigate(`/simulation?id=${simId}`);

  const handleDeleteSimulation = async (simId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this simulation?')) return;
    try {
      await simulationAPI.delete(simId);
      setSimulations(prev => prev.filter(s => s.id !== simId));
    } catch (error: any) {
      alert('Failed to delete: ' + (error.response?.data?.detail || error.message));
    }
  };

  const simulationsToShow = useMemo(() => {
    return showAllRecent ? simulations : simulations.slice(0, 4);
  }, [simulations, showAllRecent]);

  const completed = simulations.filter(s => s.results).length;
  const pending = simulations.length - completed;
  const completionRate = simulations.length ? Math.round((completed / simulations.length) * 100) : 0;

  const sparkData = useMemo(() => {
    return simulations.slice(-8).map(s => s.results?.mean ?? 0);
  }, [simulations]);

  /* ── LOADING ── */
  if (loading) {
    return (
      <div ref={rootRef} data-smartdash={theme} style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'var(--bg)', fontFamily: 'var(--font-display)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <div style={{
            width: 52, height: 52,
            border: '2px solid var(--border)',
            borderTopColor: 'var(--accent)',
            borderRadius: '50%',
            animation: 'dash-spin 0.8s linear infinite',
          }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-3)', letterSpacing: '0.1em' }}>
            INITIALIZING…
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div ref={rootRef} data-smartdash={theme} style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'var(--bg)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-2)', fontFamily: 'var(--font-display)', marginBottom: 20 }}>Failed to load user data</p>
          <button onClick={() => navigate('/login')} style={btnPrimary}>Back to Login</button>
        </div>
      </div>
    );
  }

  /* ── MAIN RENDER ── */
  return (
    <div ref={rootRef} data-smartdash={theme} style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg)',
      fontFamily: 'var(--font-display)',
      color: 'var(--text-1)',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* ── BACKGROUND GRID ── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(var(--border) 1px, transparent 1px),
          linear-gradient(90deg, var(--border) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        opacity: 0.5,
      }} />

      {/* ── GLOW ORBS ── */}
      <div style={{
        position: 'fixed', top: '-200px', right: '-100px', width: '600px', height: '600px',
        borderRadius: '50%', zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(0,229,160,0.06) 0%, transparent 70%)',
      }} />
      <div style={{
        position: 'fixed', bottom: '-200px', left: '-100px', width: '500px', height: '500px',
        borderRadius: '50%', zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(77,159,255,0.05) 0%, transparent 70%)',
      }} />

      {/* ─────────────── NAV ─────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px',
        height: 68,
        backgroundColor: theme === 'dark' ? 'rgba(8,11,16,0.85)' : 'rgba(242,244,248,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        animation: 'dash-fadein 0.4s ease both',
      }}>
        {/* LEFT */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 34, height: 34, borderRadius: var_radius_sm,
            background: 'linear-gradient(135deg, var(--accent) 0%, #00b37a 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px var(--accent-glow)',
            animation: 'dash-pulse-ring 3s ease infinite',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="#080b10" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-1)' }}>
            Smart<span style={{ color: 'var(--accent)' }}>Tracker</span>
          </span>
          <div style={{
            padding: '3px 10px', borderRadius: 99,
            border: '1px solid var(--border)',
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--text-3)', letterSpacing: '0.08em',
          }}>
            DASHBOARD
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={toggleTheme} aria-label="Toggle theme" style={{
            width: 36, height: 36, borderRadius: var_radius_sm,
            border: '1px solid var(--border)',
            backgroundColor: 'var(--bg-3)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-2)', fontSize: 15, transition: `border-color var(--trans)`,
          }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            {theme === 'dark' ? '☀' : '●'}
          </button>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '6px 14px', borderRadius: var_radius_sm,
            border: '1px solid var(--border)', backgroundColor: 'var(--bg-3)',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent) 0%, #00b37a 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800, color: '#080b10',
            }}>
              {user?.username?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>
              {user?.username}
            </span>
          </div>

          <button onClick={handleLogout} style={{
            padding: '7px 16px', borderRadius: var_radius_sm,
            border: '1px solid rgba(255,77,106,0.3)',
            backgroundColor: 'var(--red-dim)',
            color: 'var(--red)', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', transition: `all var(--trans)`, fontFamily: 'var(--font-display)',
          }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,77,106,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--red-dim)'; }}
          >
            Sign out
          </button>
        </div>
      </nav>

      {/* ─────────────── MAIN ─────────────── */}
      <main style={{
        position: 'relative', zIndex: 1,
        maxWidth: 1300, margin: '0 auto',
        padding: '44px 40px 80px',
      }}>

        {/* ── PAGE HEADER ── */}
        <div style={{ marginBottom: 40, animation: 'dash-fadein 0.5s ease 0.05s both' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', letterSpacing: '0.14em', marginBottom: 10 }}>
            SIMULATION CONTROL CENTER
          </p>
          <h1 style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05, color: 'var(--text-1)' }}>
            Command{' '}
            <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--accent)' }}>
              Dashboard
            </span>
          </h1>
          <p style={{ marginTop: 12, fontSize: 15, color: 'var(--text-2)', fontWeight: 500 }}>
            Monitor, manage, and launch your simulations in real-time.
          </p>
        </div>

        {/* ── STAT CARDS ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 28,
          animation: 'dash-fadein 0.5s ease 0.1s both',
        }}>
          {[
            {
              label: 'Total Simulations',
              value: simulations.length,
              color: 'var(--accent)',
              icon: (
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2"/>
                  <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2"/>
                  <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2"/>
                  <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2"/>
                </svg>
              ),
              spark: sparkData,
            },
            {
              label: 'Completed',
              value: completed,
              color: 'var(--accent)',
              icon: (
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                  <path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ),
              spark: sparkData,
            },
            {
              label: 'Pending',
              value: pending,
              color: 'var(--yellow)',
              icon: (
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              ),
              spark: [],
            },
            {
              label: 'Completion Rate',
              value: completionRate,
              suffix: '%',
              color: 'var(--blue)',
              icon: (
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              ),
              spark: [],
              isRate: true,
              rate: completionRate,
            },
          ].map((stat, i) => (
            <StatCard key={i} {...stat} index={i} />
          ))}
        </div>

        {/* ── LAUNCH PANEL ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
          marginBottom: 28,
          animation: 'dash-fadein 0.5s ease 0.15s both',
        }}>
          <LaunchCard
            title="Simulation Engine"
            subtitle="Raw parameter inputs — full manual control"
            tag="MANUAL MODE"
            tagColor="var(--accent)"
            icon={
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
            buttonLabel="Launch Simulation →"
            isPrimary
            onClick={() => navigate('/simulation')}
          />
          <LaunchCard
            title="Live IoT Feed"
            subtitle="Real sensor data stream — paste JSON or connect sensor"
            tag="LIVE DATA"
            tagColor="var(--blue)"
            icon={
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="2" fill="currentColor"/>
                <path d="M16.24 7.76a6 6 0 010 8.49M7.76 16.24a6 6 0 010-8.49M19.07 4.93a10 10 0 010 14.14M4.93 19.07a10 10 0 010-14.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            }
            buttonLabel="Open Live IoT →"
            isPrimary={false}
            onClick={() => navigate('/iot-live')}
          />
        </div>

        {/* ── RECENT SIMULATIONS ── */}
        <div style={{ animation: 'dash-fadein 0.5s ease 0.2s both' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 20,
          }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-1)' }}>
                Recent Simulations
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 3, fontFamily: 'var(--font-mono)' }}>
                {simulations.length} record{simulations.length !== 1 ? 's' : ''} total
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {simulations.length > 4 && (
                <button
                  onClick={() => setShowAllRecent(v => !v)}
                  style={{
                    padding: '7px 16px', borderRadius: var_radius_sm,
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg-3)',
                    color: 'var(--text-2)', fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', transition: `all var(--trans)`,
                    fontFamily: 'var(--font-display)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  {showAllRecent ? 'Show Less ↑' : `Show All (${simulations.length}) ↓`}
                </button>
              )}
              <button onClick={() => navigate('/simulation')} style={btnPrimary}>
                + New Simulation
              </button>
            </div>
          </div>

          {simulations.length === 0 ? (
            <EmptyState onNavigate={() => navigate('/simulation')} />
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 16,
            }}>
              {simulationsToShow.map((sim, i) => (
                <SimCard
                  key={sim.id}
                  sim={sim}
                  index={i}
                  hovered={hoveredCard === sim.id}
                  onHover={() => setHoveredCard(sim.id)}
                  onLeave={() => setHoveredCard(null)}
                  onClick={() => handleSimulationClick(sim.id)}
                  onDelete={(e: React.MouseEvent) => handleDeleteSimulation(sim.id, e)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/* ─────────────────────────────────────────────
   STAT CARD COMPONENT
───────────────────────────────────────────── */
function StatCard({ label, value, color, icon, spark, suffix = '', isRate = false, rate = 0, index }: any) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '22px 24px',
        borderRadius: var_radius_md,
        border: `1px solid ${hov ? 'var(--border-strong)' : 'var(--border)'}`,
        backgroundColor: 'var(--bg-2)',
        display: 'flex', flexDirection: 'column', gap: 16,
        cursor: 'default',
        transition: `all var(--trans)`,
        transform: hov ? 'translateY(-2px)' : 'none',
        boxShadow: hov ? `0 12px 32px rgba(0,0,0,0.15)` : 'none',
        animation: `dash-fadein 0.5s ease ${0.1 + index * 0.05}s both`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          width: 36, height: 36, borderRadius: var_radius_sm,
          backgroundColor: 'var(--bg-4)',
          border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color,
        }}>
          {icon}
        </div>
        {spark && spark.length > 1 && <Sparkline data={spark} color={color} />}
      </div>

      {isRate ? (
        <div>
          <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-1)', lineHeight: 1 }}>
            <AnimatedNumber value={rate} />
            <span style={{ fontSize: 20 }}>%</span>
          </div>
          <div style={{
            marginTop: 10, height: 4, borderRadius: 99,
            backgroundColor: 'var(--bg-5)', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', width: `${rate}%`, borderRadius: 99,
              background: `linear-gradient(90deg, ${color}, var(--accent))`,
              transition: 'width 0.9s cubic-bezier(0.4,0,0.2,1)',
            }} />
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text-1)', lineHeight: 1 }}>
          <AnimatedNumber value={value} />{suffix}
        </div>
      )}

      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
        {label}
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   LAUNCH CARD COMPONENT
───────────────────────────────────────────── */
function LaunchCard({ title, subtitle, tag, tagColor, icon, buttonLabel, isPrimary, onClick }: any) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '28px 32px',
        borderRadius: var_radius_lg,
        border: `1px solid ${hov ? 'var(--border-strong)' : 'var(--border)'}`,
        backgroundColor: 'var(--bg-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 24,
        transition: `all var(--trans)`,
        transform: hov ? 'translateY(-2px)' : 'none',
        boxShadow: hov && isPrimary ? `0 0 40px var(--accent-glow)` : hov ? '0 12px 32px rgba(0,0,0,0.1)' : 'none',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {isPrimary && (
        <div style={{
          position: 'absolute', inset: 0, opacity: hov ? 1 : 0,
          background: 'radial-gradient(ellipse at top left, rgba(0,229,160,0.05) 0%, transparent 60%)',
          transition: `opacity var(--trans)`, pointerEvents: 'none',
        }} />
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
        <div style={{
          width: 48, height: 48, borderRadius: var_radius_md,
          backgroundColor: isPrimary ? 'var(--accent-dim)' : 'var(--blue-dim)',
          border: `1px solid ${isPrimary ? 'rgba(0,229,160,0.2)' : 'rgba(77,159,255,0.2)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: isPrimary ? 'var(--accent)' : 'var(--blue)',
          flexShrink: 0,
          animation: 'dash-float 4s ease-in-out infinite',
        }}>
          {icon}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
              {title}
            </h3>
            <span style={{
              padding: '2px 8px', borderRadius: 99,
              fontSize: 10, fontWeight: 700,
              fontFamily: 'var(--font-mono)', letterSpacing: '0.08em',
              color: tagColor,
              backgroundColor: isPrimary ? 'var(--accent-dim)' : 'var(--blue-dim)',
              border: `1px solid ${isPrimary ? 'rgba(0,229,160,0.2)' : 'rgba(77,159,255,0.2)'}`,
            }}>
              {tag}
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 500, lineHeight: 1.5 }}>
            {subtitle}
          </p>
        </div>
      </div>

      <button
        onClick={onClick}
        style={{
          ...(isPrimary ? btnPrimary : btnSecondary),
          whiteSpace: 'nowrap', flexShrink: 0,
          transform: hov ? 'translateX(3px)' : 'none',
          transition: `transform var(--trans)`,
        }}
      >
        {buttonLabel}
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SIM CARD COMPONENT
───────────────────────────────────────────── */
function SimCard({ sim, index, hovered, onHover, onLeave, onClick, onDelete }: any) {
  const completed = !!sim.results;
  const dateStr = new Date(sim.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyPress={e => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      style={{
        padding: '22px 24px',
        borderRadius: var_radius_md,
        border: `1px solid ${hovered ? 'var(--border-strong)' : 'var(--border)'}`,
        backgroundColor: 'var(--bg-2)',
        cursor: 'pointer',
        transition: `all var(--trans)`,
        transform: hovered ? 'translateY(-3px)' : 'none',
        boxShadow: hovered ? '0 16px 40px rgba(0,0,0,0.15)' : 'none',
        animation: `dash-fadein 0.5s ease ${0.1 + index * 0.04}s both`,
        position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', gap: 14,
      }}
    >
      {/* accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: completed
          ? 'linear-gradient(90deg, var(--accent), transparent)'
          : 'linear-gradient(90deg, var(--yellow), transparent)',
        opacity: hovered ? 1 : 0,
        transition: `opacity var(--trans)`,
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{
            fontSize: 15, fontWeight: 700, color: 'var(--text-1)',
            letterSpacing: '-0.01em', margin: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {sim.name}
          </h4>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
            {dateStr}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{
            padding: '4px 10px', borderRadius: 99,
            fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)',
            backgroundColor: completed ? 'var(--accent-dim)' : 'var(--yellow-dim)',
            color: completed ? 'var(--accent)' : 'var(--yellow)',
            border: `1px solid ${completed ? 'rgba(0,229,160,0.2)' : 'rgba(255,201,77,0.2)'}`,
          }}>
            {completed ? '✓ Done' : '⏳ Pend'}
          </span>

          <button
            onClick={onDelete}
            title="Delete simulation"
            style={{
              width: 30, height: 30, borderRadius: var_radius_sm,
              border: '1px solid var(--border)',
              backgroundColor: 'transparent',
              color: 'var(--text-3)', cursor: 'pointer', fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: `all var(--trans)`,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(255,77,106,0.4)';
              e.currentTarget.style.backgroundColor = 'var(--red-dim)';
              e.currentTarget.style.color = 'var(--red)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-3)';
            }}
          >
            ×
          </button>
        </div>
      </div>

      {/* Meta */}
      {sim.results && (
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 10,
        }}>
          {[
            { k: 'Mean', v: Number(sim.results.mean).toFixed(4) },
            { k: 'Median', v: Number(sim.results.median).toFixed(4) },
          ].map(({ k, v }) => (
            <div key={k} style={{
              padding: '10px 14px',
              borderRadius: var_radius_sm,
              backgroundColor: 'var(--bg-3)',
              border: '1px solid var(--border)',
            }}>
              <p style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', marginBottom: 4 }}>{k.toUpperCase()}</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>{v}</p>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        paddingTop: 10,
        borderTop: '1px solid var(--border)',
      }}>
        <span style={{
          fontSize: 12, fontWeight: 700, color: hovered ? 'var(--accent)' : 'var(--text-3)',
          transition: `color var(--trans)`,
          fontFamily: 'var(--font-mono)', letterSpacing: '0.03em',
        }}>
          VIEW DETAILS →
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   EMPTY STATE
───────────────────────────────────────────── */
function EmptyState({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div style={{
      padding: '80px 20px', textAlign: 'center',
      borderRadius: var_radius_lg,
      border: '1px dashed var(--border)',
      backgroundColor: 'var(--bg-2)',
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: var_radius_lg,
        backgroundColor: 'var(--bg-3)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 20px',
        animation: 'dash-float 4s ease-in-out infinite',
      }}>
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)', marginBottom: 8, letterSpacing: '-0.02em' }}>
        No simulations yet
      </h3>
      <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 28 }}>
        Fire up your first simulation to see data appear here.
      </p>
      <button onClick={onNavigate} style={btnPrimary}>
        + Create First Simulation
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SHARED STYLE CONSTANTS
───────────────────────────────────────────── */
const var_radius_sm = '8px';
const var_radius_md = '14px';
const var_radius_lg = '20px';

const btnPrimary: React.CSSProperties = {
  padding: '9px 20px',
  borderRadius: var_radius_sm,
  border: 'none',
  background: 'linear-gradient(135deg, #00e5a0 0%, #00b37a 100%)',
  color: '#080b10',
  fontSize: 13,
  fontWeight: 800,
  cursor: 'pointer',
  fontFamily: "'Syne', sans-serif",
  boxShadow: '0 0 20px rgba(0,229,160,0.3)',
  transition: '0.22s cubic-bezier(0.4,0,0.2,1)',
};

const btnSecondary: React.CSSProperties = {
  padding: '9px 20px',
  borderRadius: var_radius_sm,
  border: '1px solid var(--border-strong)',
  backgroundColor: 'var(--bg-4)',
  color: 'var(--text-1)',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: "'Syne', sans-serif",
  transition: '0.22s cubic-bezier(0.4,0,0.2,1)',
};