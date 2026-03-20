import { useState } from "react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Syne:wght@700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg-deep: #060a12; --bg-card: #0d1525; --bg-input: #111c30;
    --border: #1e2f4a; --accent1: #2463eb; --accent2: #06d6f5; --accent3: #7c3aed;
    --text-main: #e8edf5; --text-muted: #6b7fa3; --text-label: #9aaecf;
  }
  body { background: var(--bg-deep); color: var(--text-main); font-family: 'Space Grotesk', sans-serif; overflow-x: hidden; }
  .lp-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
  .lp-bg::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse 80% 60% at 10% 20%, rgba(36,99,235,.18) 0%, transparent 60%),
                radial-gradient(ellipse 60% 50% at 90% 80%, rgba(124,58,237,.15) 0%, transparent 55%),
                radial-gradient(ellipse 50% 40% at 50% 50%, rgba(6,214,245,.06) 0%, transparent 60%);
    animation: bgPulse 8s ease-in-out infinite alternate;
  }
  @keyframes bgPulse { 0%{opacity:.7;transform:scale(1)} 100%{opacity:1;transform:scale(1.05)} }
  .lp-grid {
    position: absolute; inset: 0;
    background-image: linear-gradient(rgba(36,99,235,.06) 1px,transparent 1px), linear-gradient(90deg,rgba(36,99,235,.06) 1px,transparent 1px);
    background-size: 48px 48px;
    mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%);
  }
  .lp-orb { position: absolute; border-radius: 50%; filter: blur(80px); animation: floatOrb 12s ease-in-out infinite; }
  .lp-orb-1 { width:320px;height:320px;background:rgba(36,99,235,.2);top:-80px;left:-80px;animation-delay:0s; }
  .lp-orb-2 { width:240px;height:240px;background:rgba(124,58,237,.18);bottom:-60px;right:-60px;animation-delay:-4s; }
  .lp-orb-3 { width:160px;height:160px;background:rgba(6,214,245,.12);top:40%;right:10%;animation-delay:-8s; }
  @keyframes floatOrb { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(20px,-20px) scale(1.08)} }
  .lp-page { position:relative;z-index:1;min-height:100vh;display:grid;grid-template-columns:1fr 1fr;align-items:stretch; }
  .lp-hero { display:flex;flex-direction:column;justify-content:center;padding:clamp(2rem,6vw,5rem);border-right:1px solid var(--border);overflow:hidden;animation:slideUp .7s cubic-bezier(.22,1,.36,1) both; }
  .lp-badge { display:inline-flex;align-items:center;gap:.5rem;background:rgba(36,99,235,.12);border:1px solid rgba(36,99,235,.35);border-radius:100px;padding:.35rem 1rem;font-size:.78rem;font-weight:600;color:var(--accent2);letter-spacing:.06em;text-transform:uppercase;width:fit-content;margin-bottom:2rem; }
  .lp-badge::before { content:'';width:8px;height:8px;background:var(--accent2);border-radius:50%;animation:blink 2s ease-in-out infinite; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }
  .lp-title { font-family:'Syne',sans-serif;font-size:clamp(2.2rem,4vw,3.6rem);font-weight:800;line-height:1.08;letter-spacing:-.02em;margin-bottom:1.5rem; }
  .lp-highlight { background:linear-gradient(135deg,var(--accent2) 0%,var(--accent1) 50%,var(--accent3) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text; }
  .lp-sub { font-size:1rem;color:var(--text-muted);line-height:1.7;max-width:420px;margin-bottom:3rem; }
  .lp-stats { display:flex;gap:2rem;flex-wrap:wrap; }
  .lp-stat { display:flex;flex-direction:column;gap:.2rem; }
  .lp-stat-val { font-family:'Syne',sans-serif;font-size:1.8rem;font-weight:800;background:linear-gradient(135deg,var(--accent2),var(--accent1));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text; }
  .lp-stat-lbl { font-size:.78rem;color:var(--text-muted);letter-spacing:.04em;text-transform:uppercase; }
  .lp-divider { width:60px;height:3px;background:linear-gradient(90deg,var(--accent1),var(--accent2));border-radius:4px;margin:2.5rem 0; }
  .lp-features { list-style:none;display:flex;flex-direction:column;gap:.9rem; }
  .lp-features li { display:flex;align-items:center;gap:.75rem;font-size:.9rem;color:var(--text-label); }
  .lp-features li::before { content:'';flex-shrink:0;width:18px;height:18px;background:linear-gradient(135deg,var(--accent1),var(--accent2));border-radius:50%;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white' width='10'%3E%3Cpath d='M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:center;background-size:10px; }
  .lp-form-panel { display:flex;flex-direction:column;justify-content:center;align-items:center;padding:clamp(2rem,5vw,4rem); }
  .lp-card { width:100%;max-width:440px;background:var(--bg-card);border:1px solid var(--border);border-radius:20px;padding:clamp(1.5rem,4vw,2.8rem);position:relative;overflow:hidden;animation:slideUp .7s .15s cubic-bezier(.22,1,.36,1) both; }
  .lp-card::before { content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--accent3),var(--accent1),var(--accent2)); }
  @keyframes slideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  .lp-logo { display:flex;align-items:center;gap:.75rem;margin-bottom:2rem; }
  .lp-logo-icon { width:40px;height:40px;background:linear-gradient(135deg,var(--accent1),var(--accent2));border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.2rem; }
  .lp-logo-text { font-family:'Syne',sans-serif;font-size:1.3rem;font-weight:800;background:linear-gradient(135deg,var(--accent2),var(--accent1));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text; }
  .lp-card-h { font-size:1.6rem;font-weight:700;margin-bottom:.4rem;letter-spacing:-.02em; }
  .lp-card-s { font-size:.9rem;color:var(--text-muted);margin-bottom:2rem; }
  .lp-social { display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-bottom:1.5rem; }
  .lp-social-btn { display:flex;align-items:center;justify-content:center;gap:.5rem;padding:.65rem;border:1px solid var(--border);border-radius:10px;background:var(--bg-input);color:var(--text-label);font-size:.85rem;font-weight:500;cursor:pointer;transition:border-color .2s,background .2s,color .2s,transform .15s;font-family:'Space Grotesk',sans-serif; }
  .lp-social-btn:hover { border-color:var(--accent1);background:rgba(36,99,235,.1);color:var(--text-main);transform:translateY(-1px); }
  .lp-sep { display:flex;align-items:center;gap:1rem;color:var(--text-muted);font-size:.8rem;margin-bottom:1.5rem; }
  .lp-sep::before,.lp-sep::after { content:'';flex:1;height:1px;background:var(--border); }
  .lp-fg { margin-bottom:1.2rem; }
  .lp-label { display:block;font-size:.82rem;font-weight:600;color:var(--text-label);margin-bottom:.5rem;letter-spacing:.03em; }
  .lp-iw { position:relative; }
  .lp-iw svg.ico { position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--text-muted);pointer-events:none;transition:color .2s; }
  .lp-input { width:100%;padding:.75rem .75rem .75rem 2.8rem;background:var(--bg-input);border:1px solid var(--border);border-radius:10px;color:var(--text-main);font-size:.92rem;font-family:'Space Grotesk',sans-serif;outline:none;transition:border-color .2s,box-shadow .2s; }
  .lp-input::placeholder { color:var(--text-muted); }
  .lp-input:focus { border-color:var(--accent1);box-shadow:0 0 0 3px rgba(36,99,235,.15); }
  .lp-eye { position:absolute;right:14px;top:50%;transform:translateY(-50%);cursor:pointer;color:var(--text-muted);background:none;border:none;padding:0;display:flex;align-items:center;transition:color .2s; }
  .lp-eye:hover { color:var(--accent2); }
  .lp-opts { display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;flex-wrap:wrap;gap:.5rem; }
  .lp-chk { display:flex;align-items:center;gap:.5rem;font-size:.85rem;color:var(--text-muted);cursor:pointer; }
  .lp-chk input[type=checkbox] { appearance:none;width:16px;height:16px;border:1px solid var(--border);border-radius:4px;background:var(--bg-input);cursor:pointer;position:relative;transition:border-color .2s,background .2s; }
  .lp-chk input[type=checkbox]:checked { background:var(--accent1);border-color:var(--accent1); }
  .lp-chk input[type=checkbox]:checked::after { content:'';position:absolute;top:2px;left:5px;width:5px;height:9px;border:2px solid white;border-top:none;border-left:none;transform:rotate(45deg); }
  .lp-forgot { font-size:.85rem;color:var(--accent2);text-decoration:none;transition:color .2s; }
  .lp-forgot:hover { color:var(--accent1); }
  .lp-btn { width:100%;padding:.85rem;background:linear-gradient(135deg,var(--accent1),var(--accent2));border:none;border-radius:10px;color:#fff;font-size:.95rem;font-weight:700;font-family:'Space Grotesk',sans-serif;cursor:pointer;letter-spacing:.04em;position:relative;overflow:hidden;transition:transform .15s,box-shadow .2s; }
  .lp-btn:hover { transform:translateY(-2px);box-shadow:0 8px 32px rgba(36,99,235,.4); }
  .lp-btn:active { transform:translateY(0); }
  .lp-footer { text-align:center;margin-top:1.5rem;font-size:.87rem;color:var(--text-muted); }
  .lp-footer a { color:var(--accent2);text-decoration:none;font-weight:600; }
  .lp-footer a:hover { color:var(--accent1); }
  @media (max-width:900px) {
    .lp-page { grid-template-columns:1fr; }
    .lp-hero { border-right:none;border-bottom:1px solid var(--border);padding:2.5rem 2rem 2rem; }
    .lp-title { font-size:clamp(1.8rem,7vw,2.6rem); }
    .lp-divider,.lp-features { display:none; }
  }
  @media (max-width:600px) {
    .lp-hero { padding:2rem 1.25rem 1.5rem; }
    .lp-form-panel { padding:1.5rem 1rem; }
    .lp-card { padding:1.5rem 1.25rem;border-radius:16px; }
    .lp-social { grid-template-columns:1fr; }
  }
`;

export default function LoginPage() {
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  return (
    <>
      <style>{styles}</style>

      {/* Background */}
      <div className="lp-bg">
        <div className="lp-grid" />
        <div className="lp-orb lp-orb-1" />
        <div className="lp-orb lp-orb-2" />
        <div className="lp-orb lp-orb-3" />
      </div>

      <div className="lp-page">
        {/* ── LEFT HERO ── */}
        <section className="lp-hero">
          <span className="lp-badge">Secure Platform</span>
          <h1 className="lp-title">
            Welcome<br />Back to<br />
            <span className="lp-highlight">AeroAuth</span>
          </h1>
          <p className="lp-sub">
            Sign in to access your dashboard, manage your projects, and harness
            the full power of cloud-based simulation tools.
          </p>
          <div className="lp-stats">
            {[["50K+", "Active Users"], ["99.9%", "Uptime"], ["256-bit", "Encryption"]].map(
              ([v, l]) => (
                <div className="lp-stat" key={l}>
                  <span className="lp-stat-val">{v}</span>
                  <span className="lp-stat-lbl">{l}</span>
                </div>
              )
            )}
          </div>
          <div className="lp-divider" />
          <ul className="lp-features">
            {["Zero-config cloud infrastructure", "Real-time collaboration & sharing",
              "Enterprise-grade security & compliance", "24/7 expert support included"].map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </section>

        {/* ── RIGHT FORM ── */}
        <section className="lp-form-panel">
          <div className="lp-card">
            <div className="lp-logo">
              <div className="lp-logo-icon">⚡</div>
              <span className="lp-logo-text">AeroAuth</span>
            </div>
            <h2 className="lp-card-h">Sign in</h2>
            <p className="lp-card-s">Enter your credentials to continue</p>

            {/* Social */}
            <div className="lp-social">
              <button className="lp-social-btn" type="button">
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </button>
              <button className="lp-social-btn" type="button">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                GitHub
              </button>
            </div>

            <div className="lp-sep">or continue with email</div>

            <form onSubmit={(e) => e.preventDefault()}>
              {/* Email */}
              <div className="lp-fg">
                <label className="lp-label" htmlFor="lp-email">Email Address</label>
                <div className="lp-iw">
                  <svg className="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <input id="lp-email" className="lp-input" type="email" placeholder="you@example.com"
                    value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
              {/* Password */}
              <div className="lp-fg">
                <label className="lp-label" htmlFor="lp-pass">Password</label>
                <div className="lp-iw">
                  <svg className="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                  <input id="lp-pass" className="lp-input" type={showPass ? "text" : "password"}
                    placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" className="lp-eye" onClick={() => setShowPass(!showPass)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </button>
                </div>
              </div>
              {/* Options */}
              <div className="lp-opts">
                <label className="lp-chk">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                  Remember me
                </label>
                <a href="#" className="lp-forgot">Forgot password?</a>
              </div>
              <button className="lp-btn" type="submit">Sign In →</button>
            </form>

            <div className="lp-footer">
              Don't have an account? <a href="/register">Create one free</a>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}