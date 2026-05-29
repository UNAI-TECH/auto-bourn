'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Shield, AlertCircle, Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
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
      // Resolve email or employee ID
      const resolveRes = await fetch('/api/auth/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email }),
      });

      if (!resolveRes.ok) {
        setError('Invalid credentials. Admin access only.');
        setLoading(false);
        return;
      }

      const { email: resolvedEmail } = await resolveRes.json();

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: resolvedEmail,
        password,
      });

      if (authError) {
        setError('Invalid email or password.');
        setLoading(false);
        return;
      }

      if (data.user) {
        const { data: emp } = await supabase
          .from('employees')
          .select('role, status, id')
          .eq('auth_user_id', data.user.id)
          .single();

        if (!emp || emp.role !== 'admin') {
          await supabase.auth.signOut();
          setError('Access denied. This portal is for administrators only.');
          setLoading(false);
          return;
        }

        if (emp.status === 'suspended' || emp.status === 'inactive') {
          await supabase.auth.signOut();
          setError('Your admin account has been deactivated.');
          setLoading(false);
          return;
        }

        await supabase.from('activity_logs').insert({
          employee_id: emp.id,
          action: 'login',
          details: 'Admin logged in via /admin portal',
        });

        router.push('/dashboard');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="admin-login-page">
      {/* Animated background */}
      <div className="admin-bg">
        <div className="admin-bg-gradient" />
        <div className="admin-bg-grid" />
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="admin-bg-orb"
            style={{
              left: `${10 + i * 25}%`,
              top: `${15 + i * 20}%`,
              width: `${120 + i * 60}px`,
              height: `${120 + i * 60}px`,
            }}
            animate={{ x: [0, 25, -15, 0], y: [0, -30, 15, 0], scale: [1, 1.08, 0.96, 1] }}
            transition={{ duration: 9 + i * 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>

      {/* Card */}
      <motion.div
        className="admin-card"
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Header */}
        <div className="admin-header">
          <div className="admin-badge">
            <Shield size={14} />
            <span>ADMIN PORTAL</span>
          </div>
          <div className="admin-logo-icon">
            <Shield size={28} />
          </div>
          <h1>AUTO BOURN</h1>
          <p>Administrator Access</p>
        </div>

        {/* Form */}
        <motion.form
          onSubmit={handleLogin}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="admin-field">
            <label htmlFor="admin-email">Admin Email</label>
            <div className="admin-input-wrap">
              <Mail size={17} className="admin-input-icon" />
              <input
                id="admin-email"
                type="text"
                placeholder="admin@autobourn.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div className="admin-field">
            <label htmlFor="admin-password">Password</label>
            <div className="admin-input-wrap">
              <Lock size={17} className="admin-input-icon" />
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="admin-toggle-pw"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                className="admin-error"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <AlertCircle size={15} />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button type="submit" className="admin-submit" disabled={loading}>
            {loading ? (
              <Loader2 size={20} className="admin-spinner" />
            ) : (
              <>
                Access Dashboard
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </motion.form>

        <div className="admin-footer">
          <span>🔒 Secure Admin Access</span>
          <a href="/console" className="admin-emp-link">Employee Login →</a>
        </div>
      </motion.div>

      <style jsx>{`
        .admin-checking {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #080808;
        }
        .admin-checking-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(225,6,19,.15);
          border-top-color: #e10613;
          border-radius: 50%;
        }
        .admin-login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          position: relative;
          overflow: hidden;
          background: #080808;
          font-family: 'Outfit', sans-serif;
        }
        .admin-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
        }
        .admin-bg-gradient {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 20% 20%, rgba(225,6,19,.12) 0%, transparent 55%),
            radial-gradient(ellipse at 80% 80%, rgba(225,6,19,.07) 0%, transparent 55%),
            linear-gradient(135deg, #080808 0%, #0f0f0f 60%, #0a0a0a 100%);
        }
        .admin-bg-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(225,6,19,.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(225,6,19,.04) 1px, transparent 1px);
          background-size: 50px 50px;
        }
        .admin-bg-orb {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(225,6,19,.1) 0%, transparent 70%);
          filter: blur(40px);
        }
        .admin-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 420px;
          background: rgba(14, 14, 14, 0.92);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          border: 1px solid rgba(225,6,19,.18);
          border-radius: 24px;
          padding: 2.5rem;
          box-shadow: 0 30px 90px rgba(0,0,0,.6), 0 0 0 1px rgba(225,6,19,.06) inset;
        }
        .admin-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .admin-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(225,6,19,.12);
          border: 1px solid rgba(225,6,19,.25);
          color: #e10613;
          border-radius: 20px;
          padding: .3rem .85rem;
          font-size: .6875rem;
          font-weight: 700;
          letter-spacing: .12em;
          margin-bottom: 1.25rem;
        }
        .admin-logo-icon {
          width: 64px;
          height: 64px;
          border-radius: 18px;
          background: linear-gradient(135deg, #e10613, #8b0000);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto .875rem;
          color: #fff;
          box-shadow: 0 8px 32px rgba(225,6,19,.35);
        }
        .admin-header h1 {
          font-family: 'Outfit', sans-serif;
          font-size: 1.625rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: .08em;
          margin: 0 0 .25rem;
        }
        .admin-header p {
          font-size: .8125rem;
          color: rgba(255,255,255,.45);
          margin: 0;
        }
        .admin-field {
          margin-bottom: 1rem;
        }
        .admin-field label {
          display: block;
          font-size: .8rem;
          font-weight: 500;
          color: rgba(255,255,255,.55);
          margin-bottom: .4rem;
          letter-spacing: .02em;
        }
        .admin-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .admin-input-icon {
          position: absolute;
          left: 13px;
          color: rgba(255,255,255,.3);
          pointer-events: none;
          flex-shrink: 0;
        }
        .admin-input-wrap input {
          width: 100%;
          padding: .875rem 1rem .875rem 2.75rem;
          background: rgba(255,255,255,.05);
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 12px;
          color: #fff;
          font-size: .9375rem;
          font-family: 'Outfit', sans-serif;
          outline: none;
          transition: all .25s;
        }
        .admin-input-wrap input::placeholder { color: rgba(255,255,255,.22); }
        .admin-input-wrap input:focus {
          border-color: rgba(225,6,19,.5);
          background: rgba(225,6,19,.04);
          box-shadow: 0 0 0 3px rgba(225,6,19,.1);
        }
        .admin-toggle-pw {
          position: absolute;
          right: 12px;
          background: 0;
          border: 0;
          color: rgba(255,255,255,.35);
          cursor: pointer;
          padding: 4px;
          display: flex;
          transition: color .2s;
        }
        .admin-toggle-pw:hover { color: rgba(255,255,255,.7); }
        .admin-error {
          display: flex;
          align-items: center;
          gap: .5rem;
          background: rgba(239,68,68,.1);
          border: 1px solid rgba(239,68,68,.25);
          color: #fca5a5;
          border-radius: 10px;
          padding: .75rem 1rem;
          font-size: .8125rem;
          margin-bottom: 1rem;
        }
        .admin-submit {
          width: 100%;
          padding: .9375rem;
          background: linear-gradient(135deg, #e10613, #8b0000);
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
          margin-top: .5rem;
          letter-spacing: .02em;
        }
        .admin-submit:hover:not(:disabled) {
          background: linear-gradient(135deg, #ff1a26, #c70511);
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(225,6,19,.4);
        }
        .admin-submit:disabled { opacity: .6; cursor: not-allowed; }
        .admin-spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .admin-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 1.5rem;
          padding-top: 1.25rem;
          border-top: 1px solid rgba(255,255,255,.07);
          font-size: .75rem;
          color: rgba(255,255,255,.3);
        }
        .admin-emp-link {
          color: rgba(225,6,19,.7);
          text-decoration: none;
          font-weight: 500;
          transition: color .2s;
        }
        .admin-emp-link:hover { color: #e10613; }
      `}</style>
    </div>
  );
}
