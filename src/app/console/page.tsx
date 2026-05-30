'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Lock, ArrowRight, Car, AlertCircle, Loader2, BadgeCheck } from 'lucide-react';

export default function EmployeeConsolePage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Resolve employee ID or email
      const resolveRes = await fetch('/api/auth/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: identifier }),
      });

      if (!resolveRes.ok) {
        setError('Employee ID or email not found. Contact your administrator.');
        setLoading(false);
        return;
      }

      const { email: resolvedEmail } = await resolveRes.json();

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: resolvedEmail,
        password,
      });

      if (authError) {
        setError('Incorrect password. Please try again.');
        setLoading(false);
        return;
      }

      if (data.user) {
        const { data: emp } = await supabase
          .from('employees')
          .select('role, status, id, name')
          .eq('auth_user_id', data.user.id)
          .single();

        if (!emp) {
          await supabase.auth.signOut();
          setError('Account not found. Please contact your administrator.');
          setLoading(false);
          return;
        }

        if (emp.status === 'suspended') {
          await supabase.auth.signOut();
          setError('Your account has been suspended. Contact the administrator.');
          setLoading(false);
          return;
        }

        if (emp.status === 'inactive') {
          await supabase.auth.signOut();
          setError('Your account is inactive. Contact the administrator.');
          setLoading(false);
          return;
        }

        await supabase.from('activity_logs').insert({
          employee_id: emp.id,
          action: 'login',
          details: `Employee ${emp.name} logged in via /console portal`,
        });

        // Admin logging in from employee console — redirect to dashboard
        if (emp.role === 'admin') {
          router.push('/dashboard');
        } else {
          router.push('/employee');
        }
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="console-page">
      {/* Background */}
      <div className="console-bg">
        <div className="console-bg-gradient" />
        <div className="console-bg-dots" />
      </div>

      {/* Left brand panel */}
      <div className="console-panel">
        <motion.div
          className="console-panel-inner"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="console-panel-logo">
            <Image src="/logo.jpg" alt="Auto Bourn Logo" width={56} height={56} style={{ objectFit: 'cover', borderRadius: '12px' }} />
          </div>
          <h2>AUTO BOURN</h2>
          <p>Management Portal</p>

          <div className="console-features">
            {[
              { icon: '🛡️', text: 'Admin: full dashboard access' },
              { icon: '🚗', text: 'Upload & manage car listings' },
              { icon: '✅', text: 'Mark cars as sold or available' },
              { icon: '📊', text: 'Track upload activity & reports' },
            ].map((f, i) => (
              <motion.div
                key={i}
                className="console-feature-item"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <span>{f.icon}</span>
                <span>{f.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right login card */}
      <div className="console-right">
        <motion.div
          className="console-card"
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="console-header">
            <div className="console-badge">
              <BadgeCheck size={13} />
              <span>AUTO BOURN PORTAL</span>
            </div>
            <h1>Welcome Back</h1>
            <p>Sign in with your ID or email address</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="console-field">
              <label htmlFor="emp-id">Employee ID or Email</label>
              <div className="console-input-wrap">
                <span className="console-input-prefix">@</span>
                <input
                  id="emp-id"
                  type="text"
                  placeholder="e.g. EMP001 or your email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="console-field">
              <label htmlFor="emp-pw">Password</label>
              <div className="console-input-wrap">
                <Lock size={16} className="console-input-icon" />
                <input
                  id="emp-pw"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="console-toggle-pw"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  className="console-error"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  <AlertCircle size={15} />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button type="submit" className="console-submit" disabled={loading}>
              {loading ? (
                <Loader2 size={20} className="console-spinner" />
              ) : (
                <>
                  Sign In to Console
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="console-help">
            Don&apos;t have credentials? Contact your{' '}
            <a href="/admin">administrator</a>.
          </p>

          <div className="console-footer">
            <span>Auto Bourn Employee Console</span>
            <span>© 2026</span>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        .console-checking {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fafafa;
        }
        .console-checking-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(225,6,19,.15);
          border-top-color: #e10613;
          border-radius: 50%;
        }
        .console-page {
          min-height: 100vh;
          display: flex;
          font-family: 'Outfit', sans-serif;
          background: #fafafa;
          position: relative;
          overflow: hidden;
        }
        .console-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
        }
        .console-bg-gradient {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 70% 50%, rgba(225,6,19,.04) 0%, transparent 60%);
        }
        .console-bg-dots {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(0,0,0,.06) 1px, transparent 1px);
          background-size: 24px 24px;
        }

        /* Left panel */
        .console-panel {
          width: 380px;
          flex-shrink: 0;
          background: linear-gradient(160deg, #e10613 0%, #8b0000 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem 2.5rem;
          position: relative;
          z-index: 1;
        }
        @media(max-width: 768px) { .console-panel { display: none; } }
        .console-panel-inner {
          color: #fff;
        }
        .console-panel-logo {
          width: 60px;
          height: 60px;
          border-radius: 16px;
          background: rgba(255,255,255,.15);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.25rem;
          backdrop-filter: blur(10px);
        }
        .console-panel-inner h2 {
          font-family: 'Outfit', sans-serif;
          font-size: 1.875rem;
          font-weight: 800;
          letter-spacing: .08em;
          margin: 0 0 .35rem;
        }
        .console-panel-inner p {
          font-size: .875rem;
          opacity: .75;
          margin: 0 0 2rem;
        }
        .console-features {
          display: flex;
          flex-direction: column;
          gap: .875rem;
        }
        .console-feature-item {
          display: flex;
          align-items: center;
          gap: .875rem;
          font-size: .875rem;
          opacity: .9;
        }
        .console-feature-item span:first-child {
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        /* Right side */
        .console-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          position: relative;
          z-index: 1;
        }
        .console-card {
          width: 100%;
          max-width: 400px;
          background: #fff;
          border-radius: 20px;
          padding: 2.5rem;
          box-shadow: 0 8px 40px rgba(0,0,0,.08), 0 2px 8px rgba(0,0,0,.04);
          border: 1px solid rgba(0,0,0,.06);
        }
        .console-header {
          margin-bottom: 1.75rem;
        }
        .console-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(225,6,19,.08);
          border: 1px solid rgba(225,6,19,.2);
          color: #e10613;
          border-radius: 20px;
          padding: .3rem .85rem;
          font-size: .6875rem;
          font-weight: 700;
          letter-spacing: .1em;
          margin-bottom: 1rem;
        }
        .console-header h1 {
          font-family: 'Outfit', sans-serif;
          font-size: 1.625rem;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0 0 .35rem;
        }
        .console-header p {
          font-size: .875rem;
          color: #8a8a8a;
          margin: 0;
        }
        .console-field {
          margin-bottom: .875rem;
        }
        .console-field label {
          display: block;
          font-size: .8rem;
          font-weight: 500;
          color: #4a4a4a;
          margin-bottom: .4rem;
        }
        .console-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .console-input-prefix {
          position: absolute;
          left: 13px;
          color: #e10613;
          font-weight: 700;
          font-size: 1rem;
          pointer-events: none;
          line-height: 1;
        }
        .console-input-icon {
          position: absolute;
          left: 13px;
          color: #b0b0b0;
          pointer-events: none;
          flex-shrink: 0;
        }
        .console-input-wrap input {
          width: 100%;
          padding: .875rem 1rem .875rem 2.5rem;
          background: #f5f5f5;
          border: 1.5px solid #ececec;
          border-radius: 12px;
          color: #1a1a1a;
          font-size: .9375rem;
          font-family: 'Outfit', sans-serif;
          outline: none;
          transition: all .25s;
        }
        .console-input-wrap input::placeholder { color: #b0b0b0; }
        .console-input-wrap input:focus {
          border-color: #e10613;
          background: rgba(225,6,19,.02);
          box-shadow: 0 0 0 3px rgba(225,6,19,.08);
        }
        .console-toggle-pw {
          position: absolute;
          right: 12px;
          background: 0;
          border: 0;
          color: #b0b0b0;
          cursor: pointer;
          padding: 4px;
          display: flex;
          transition: color .2s;
        }
        .console-toggle-pw:hover { color: #4a4a4a; }
        .console-error {
          display: flex;
          align-items: center;
          gap: .5rem;
          background: #fff1f2;
          border: 1px solid rgba(239,68,68,.2);
          color: #dc2626;
          border-radius: 10px;
          padding: .75rem 1rem;
          font-size: .8125rem;
          margin-bottom: .875rem;
        }
        .console-submit {
          width: 100%;
          padding: .9375rem;
          background: linear-gradient(135deg, #e10613, #c70511);
          border: none;
          border-radius: 12px;
          color: #fff;
          font-size: .9375rem;
          font-weight: 600;
          font-family: 'Outfit', sans-serif;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: .5rem;
          transition: all .3s;
          margin-top: .25rem;
          letter-spacing: .02em;
        }
        .console-submit:hover:not(:disabled) {
          background: linear-gradient(135deg, #ff1a26, #e10613);
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(225,6,19,.3);
        }
        .console-submit:disabled { opacity: .6; cursor: not-allowed; }
        .console-spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .console-help {
          text-align: center;
          font-size: .8125rem;
          color: #8a8a8a;
          margin-top: 1.25rem;
        }
        .console-help a {
          color: #e10613;
          font-weight: 500;
          text-decoration: none;
        }
        .console-help a:hover { text-decoration: underline; }
        .console-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 1.5rem;
          padding-top: 1.25rem;
          border-top: 1px solid #ececec;
          font-size: .75rem;
          color: #b0b0b0;
        }
      `}</style>
    </div>
  );
}
