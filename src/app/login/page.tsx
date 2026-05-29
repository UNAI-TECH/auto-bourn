'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Car, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Resolve employee ID/email to actual email address
      const resolveRes = await fetch('/api/auth/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email }),
      });

      if (!resolveRes.ok) {
        const errData = await resolveRes.json();
        setError(errData.error || 'Invalid Email or Employee ID');
        setLoading(false);
        return;
      }

      const { email: resolvedEmail } = await resolveRes.json();

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: resolvedEmail,
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Get employee role
        const { data: employee, error: empError } = await supabase
          .from('employees')
          .select('role, status')
          .eq('auth_user_id', data.user.id)
          .single();

        if (empError || !employee) {
          setError('Account not found in the system. Contact administrator.');
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        if (employee.status === 'suspended' || employee.status === 'inactive') {
          setError('Your account has been suspended. Contact administrator.');
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        // Log login activity
        const { data: empData } = await supabase
          .from('employees')
          .select('id')
          .eq('auth_user_id', data.user.id)
          .single();

        if (empData) {
          await supabase.from('activity_logs').insert({
            employee_id: empData.id,
            action: 'login',
            details: `${employee.role === 'admin' ? 'Admin' : 'Employee'} logged in`,
          });
        }

        // Redirect based on role
        if (employee.role === 'admin') {
          router.push('/dashboard');
        } else {
          router.push('/employee');
        }
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });

      if (resetError) {
        setError(resetError.message);
      } else {
        setSuccess('Password reset link sent! Check your email.');
        setTimeout(() => setMode('login'), 3000);
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Animated background */}
      <div className="login-bg">
        <div className="login-bg-gradient" />
        <div className="login-bg-grid" />
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="login-bg-orb"
            style={{
              left: `${20 + i * 15}%`,
              top: `${10 + i * 18}%`,
              width: `${100 + i * 50}px`,
              height: `${100 + i * 50}px`,
            }}
            animate={{
              x: [0, 30, -20, 0],
              y: [0, -40, 20, 0],
              scale: [1, 1.1, 0.95, 1],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Login card */}
      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">
            <Car size={28} />
          </div>
          <h1>AUTO BOURN</h1>
          <p>Management Console</p>
        </div>

        <AnimatePresence mode="wait">
          {mode === 'login' ? (
            <motion.form
              key="login"
              onSubmit={handleLogin}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="login-field">
                <label htmlFor="email">Email or Employee ID</label>
                <div className="login-input-wrapper">
                  <Mail size={18} className="login-input-icon" />
                  <input
                    id="email"
                    type="text"
                    placeholder="Enter email or Employee ID"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="login-field">
                <label htmlFor="password">Password</label>
                <div className="login-input-wrapper">
                  <Lock size={18} className="login-input-icon" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="login-toggle-pw"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div
                  className="login-error"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </motion.div>
              )}

              <button type="submit" className="login-submit" disabled={loading}>
                {loading ? (
                  <Loader2 size={20} className="login-spinner" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              <button
                type="button"
                className="login-forgot"
                onClick={() => {
                  setMode('forgot');
                  setError('');
                }}
              >
                Forgot Password?
              </button>
            </motion.form>
          ) : (
            <motion.form
              key="forgot"
              onSubmit={handleForgotPassword}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <p className="login-forgot-text">
                Enter your email address and we&apos;ll send you a link to reset your password.
              </p>

              <div className="login-field">
                <label htmlFor="reset-email">Email Address</label>
                <div className="login-input-wrapper">
                  <Mail size={18} className="login-input-icon" />
                  <input
                    id="reset-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && (
                <motion.div
                  className="login-error"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </motion.div>
              )}

              {success && (
                <motion.div
                  className="login-success"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <CheckCircle size={16} />
                  <span>{success}</span>
                </motion.div>
              )}

              <button type="submit" className="login-submit" disabled={loading}>
                {loading ? (
                  <Loader2 size={20} className="login-spinner" />
                ) : (
                  <>
                    Send Reset Link
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              <button
                type="button"
                className="login-forgot"
                onClick={() => {
                  setMode('login');
                  setError('');
                  setSuccess('');
                }}
              >
                ← Back to Login
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="login-footer">
          <span>Auto Bourn Management System</span>
          <span>© 2026</span>
        </div>
      </motion.div>

      <style jsx>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          position: relative;
          overflow: hidden;
          background: #0a0a0a;
        }

        .login-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
        }

        .login-bg-gradient {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 30% 20%, rgba(225, 6, 19, 0.08) 0%, transparent 50%),
                      radial-gradient(ellipse at 70% 80%, rgba(225, 6, 19, 0.05) 0%, transparent 50%),
                      linear-gradient(135deg, #0a0a0a 0%, #111111 50%, #0d0d0d 100%);
        }

        .login-bg-grid {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(225, 6, 19, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(225, 6, 19, 0.03) 1px, transparent 1px);
          background-size: 60px 60px;
        }

        .login-bg-orb {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(225, 6, 19, 0.08) 0%, transparent 70%);
          filter: blur(40px);
        }

        .login-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 440px;
          background: rgba(18, 18, 18, 0.9);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          border: 1px solid rgba(225, 6, 19, 0.15);
          border-radius: 24px;
          padding: 3rem;
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.5),
                      0 0 0 1px rgba(225, 6, 19, 0.05) inset;
        }

        .login-logo {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .login-logo-icon {
          width: 60px;
          height: 60px;
          border-radius: 16px;
          background: linear-gradient(135deg, #e10613, #c70511);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
          color: #ffffff;
          box-shadow: 0 8px 32px rgba(225, 6, 19, 0.25);
        }

        .login-logo h1 {
          font-family: 'Outfit', sans-serif;
          font-size: 1.5rem;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: 0.15em;
          margin-bottom: 0.25rem;
        }

        .login-logo p {
          font-size: 0.8125rem;
          color: rgba(255, 255, 255, 0.4);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .login-field {
          margin-bottom: 1.25rem;
        }

        .login-field label {
          display: block;
          font-size: 0.8125rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 0.5rem;
          letter-spacing: 0.02em;
        }

        .login-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .login-input-icon {
          position: absolute;
          left: 14px;
          color: rgba(255, 255, 255, 0.3);
          pointer-events: none;
          flex-shrink: 0;
        }

        .login-input-wrapper input {
          width: 100%;
          padding: 0.875rem 1rem 0.875rem 2.75rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: #ffffff;
          font-size: 0.9375rem;
          font-family: 'Inter', sans-serif;
          transition: all 0.3s ease;
          outline: none;
        }

        .login-input-wrapper input::placeholder {
          color: rgba(255, 255, 255, 0.25);
        }

        .login-input-wrapper input:focus {
          border-color: rgba(225, 6, 19, 0.5);
          background: rgba(225, 6, 19, 0.03);
          box-shadow: 0 0 0 3px rgba(225, 6, 19, 0.1);
        }

        .login-toggle-pw {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.3);
          cursor: pointer;
          padding: 4px;
          display: flex;
          transition: color 0.2s;
        }

        .login-toggle-pw:hover {
          color: rgba(212, 175, 55, 0.8);
        }

        .login-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 10px;
          color: #f87171;
          font-size: 0.8125rem;
          margin-bottom: 1rem;
        }

        .login-success {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.2);
          border-radius: 10px;
          color: #4ade80;
          font-size: 0.8125rem;
          margin-bottom: 1rem;
        }

        .login-submit {
          width: 100%;
          padding: 0.9375rem;
          background: linear-gradient(135deg, #e10613, #c70511);
          border: none;
          border-radius: 12px;
          color: #ffffff;
          font-size: 0.9375rem;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
          margin-top: 0.5rem;
          letter-spacing: 0.02em;
        }

        .login-submit:hover:not(:disabled) {
          background: linear-gradient(135deg, #ff1a26, #e10613);
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(225, 6, 19, 0.3);
        }

        .login-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .login-spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .login-forgot {
          width: 100%;
          padding: 0.75rem;
          background: none;
          border: none;
          color: rgba(225, 6, 19, 0.8);
          font-size: 0.8125rem;
          cursor: pointer;
          transition: color 0.2s;
          font-family: 'Inter', sans-serif;
          margin-top: 0.5rem;
        }

        .login-forgot:hover {
          color: #e10613;
        }

        .login-forgot-text {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.875rem;
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }

        .login-footer {
          display: flex;
          justify-content: space-between;
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .login-footer span {
          font-size: 0.6875rem;
          color: rgba(255, 255, 255, 0.25);
          letter-spacing: 0.02em;
        }

        @media (max-width: 480px) {
          .login-card {
            padding: 2rem 1.5rem;
            border-radius: 20px;
          }
        }
      `}</style>
    </div>
  );
}
