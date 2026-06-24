'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, AlertCircle, Loader2, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

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

    // Map CEO credentials to main admin credentials transparently
    let loginIdentifier = identifier;
    let loginPassword = password;
    const isCeo = identifier.trim().toLowerCase() === 'ceo@autobourncars.com' && password === 'AB@2026';
    if (isCeo) {
      loginIdentifier = 'admin@gmail.com';
      loginPassword = 'autobourn@123';
    }

    try {
      // Resolve employee ID or email
      const resolveRes = await fetch('/api/auth/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginIdentifier }),
      });

      if (!resolveRes.ok) {
        setError('Employee ID or email not found. Contact your administrator.');
        setLoading(false);
        return;
      }

      const { email: resolvedEmail } = await resolveRes.json();

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: resolvedEmail,
        password: loginPassword,
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
          details: `Employee ${emp.name} logged in via /console portal${isCeo ? ' (as CEO)' : ''}`,
        });

        // Redirect based on role
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
      <div className="console-logo-wrapper">
        <Link href="/" className="console-logo">
          <div className="logo-container">
            <Image src="/logo.jpg" alt="Auto Bourn Logo" width={36} height={36} className="logo-img" />
          </div>
        </Link>
      </div>
      <div className="console-container">
        {/* Left Side: Brand Panel */}
        <div className="console-panel">
          <div className="console-panel-top">
            <div className="console-badge-pill">
              <span className="console-badge-dot" />
              ADMINISTRATOR PORTAL
            </div>
          </div>

          <div className="console-panel-middle">
            <h2 className="console-panel-title">
              Manage the <span className="highlight-text">Auto Bourn</span> ecosystem with ease.
            </h2>
            <p className="console-panel-desc">
              Log in to access complete dashboard controls, view metrics, manage luxury car listings, approve sellers, and manage all your platform data in one place.
            </p>

            <div className="console-features">
              {[
                {
                  svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>,
                  text: 'Admin: full dashboard access'
                },
                {
                  svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
                  text: 'Upload & manage car listings'
                },
                {
                  svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
                  text: 'Mark cars as sold or available'
                },
                {
                  svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
                  text: 'Track upload activity & reports'
                },
              ].map((f, i) => (
                <div key={i} className="console-feature-bullet">
                  <span className="bullet-icon">{f.svg}</span>
                  <span className="bullet-text">{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="console-panel-bottom">
            <div className="footer-divider" />
            <div className="footer-brand-row">
              <div className="footer-brand-square">A</div>
              <div className="footer-brand-text">
                <span className="footer-brand-title">Auto Bourn</span>
                <span className="footer-brand-sub">Management Console</span>
              </div>
              <span className="footer-brand-est">EST. 2026</span>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="console-right">
          <div className="console-form-container">
            <div className="console-header">
              <h1>Portal Access</h1>
              <p>Sign in using your administrator credentials below.</p>
            </div>

            <form onSubmit={handleLogin}>
              <div className="console-field">
                <label htmlFor="emp-id">EMAIL ADDRESS OR EMPLOYEE ID</label>
                <div className="console-input-wrap">
                  <span className="console-input-icon">
                    <User size={18} />
                  </span>
                  <input
                    id="emp-id"
                    type="text"
                    placeholder="Email address or Employee ID"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="console-field">
                <label htmlFor="emp-pw">PASSWORD</label>
                <div className="console-input-wrap">
                  <span className="console-input-icon">
                    <Lock size={18} />
                  </span>
                  <input
                    id="emp-pw"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
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
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    className="console-error-box"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                  >
                    <AlertCircle size={15} />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <button type="submit" className="console-submit-btn" disabled={loading}>
                {loading ? (
                  <span className="console-spinner">
                    <Loader2 size={20} />
                  </span>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3"/>
                    </svg>
                    Access Admin Console
                  </>
                )}
              </button>
            </form>


          </div>
        </div>
      </div>

      <style jsx>{`
        .console-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #FAF8F6;
          font-family: 'Outfit', sans-serif;
          padding: 2rem;
          position: relative;
        }

        .console-logo-wrapper {
          position: absolute;
          top: 2rem;
          left: 2rem;
          z-index: 10;
        }

        .console-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }

        .console-logo .logo-container {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          overflow: hidden;
          position: relative;
          border: 1px solid rgba(225, 6, 19, 0.2);
        }

        .console-logo .logo-img {
          object-fit: cover;
        }

        .console-logo .logo-text {
          font-family: 'Outfit', sans-serif;
          font-weight: 800;
          font-size: 0.9375rem;
          color: #E10613;
          letter-spacing: 0.08em;
        }

        @media (max-width: 640px) {
          .console-logo-wrapper {
            top: 1.5rem;
            left: 1.5rem;
          }
        }

        .console-container {
          display: grid;
          grid-template-columns: 420px 1fr;
          width: 100%;
          max-width: 980px;
          min-height: 620px;
          background: #FFFFFF;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.04);
          border: 1px solid rgba(0, 0, 0, 0.06);
        }

        /* Left Side Panel */
        .console-panel {
          background: linear-gradient(135deg, #E10613 0%, #4A0000 100%);
          padding: 3rem 2.5rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          color: #ffffff;
        }

        .console-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.25);
          color: #ffffff;
          border-radius: 20px;
          padding: 0.4rem 0.85rem;
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.08em;
        }

        .console-badge-dot {
          width: 6px;
          height: 6px;
          background-color: #4ADE80;
          border-radius: 50%;
        }

        .console-panel-middle {
          margin: 2rem 0;
        }

        .console-panel-title {
          font-size: 2.25rem;
          font-weight: 800;
          line-height: 1.2;
          margin-bottom: 1rem;
          letter-spacing: -0.02em;
          color: #ffffff;
        }

        .highlight-text {
          color: #FFD700;
        }

        .console-panel-desc {
          font-size: 0.9375rem;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.85);
          margin-bottom: 2rem;
        }

        .console-features {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .console-feature-bullet {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.875rem;
          color: #ffffff;
        }

        .bullet-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 7px;
          flex-shrink: 0;
          color: #ffffff;
        }

        .bullet-text {
          color: #ffffff;
          font-weight: 500;
        }

        /* Bottom Row */
        .footer-divider {
          height: 1px;
          background-color: rgba(255, 255, 255, 0.15);
          margin-bottom: 1.5rem;
        }

        .footer-brand-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .footer-brand-square {
          width: 38px;
          height: 38px;
          background-color: rgba(255, 255, 255, 0.15);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1.125rem;
          color: #ffffff;
        }

        .footer-brand-text {
          display: flex;
          flex-direction: column;
        }

        .footer-brand-title {
          font-weight: 700;
          font-size: 0.9375rem;
          letter-spacing: 0.02em;
          color: #ffffff;
        }

        .footer-brand-sub {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.75);
        }

        .footer-brand-est {
          margin-left: auto;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.6);
          letter-spacing: 0.05em;
        }

        /* Right Side Form */
        .console-right {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem 3rem 3rem 4.5rem;
        }

        .console-form-container {
          width: 100%;
          max-width: 360px;
        }

        .console-header {
          margin-bottom: 2.25rem;
        }

        .console-header h1 {
          font-size: 1.75rem;
          font-weight: 800;
          color: #1A1A1A;
          margin-bottom: 0.5rem;
          letter-spacing: -0.01em;
        }

        .console-header p {
          font-size: 0.875rem;
          color: #6A6A6A;
        }

        .console-field {
          margin-bottom: 1.25rem;
        }

        .console-field label {
          display: block;
          font-size: 0.75rem;
          font-weight: 700;
          color: #1A1A1A;
          margin-bottom: 0.5rem;
          letter-spacing: 0.05em;
        }

        .console-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .console-input-icon {
          position: absolute;
          left: 14px;
          color: #A0A0A0;
          pointer-events: none;
          display: flex;
          align-items: center;
        }

        .console-input-wrap input {
          width: 100%;
          padding: 0.875rem 1rem 0.875rem 2.75rem;
          background-color: #FAFAFA;
          border: 1px solid #ECECEC;
          border-radius: 12px;
          color: #1A1A1A;
          font-size: 0.9375rem;
          font-family: 'Outfit', sans-serif;
          outline: none;
          transition: all 0.2s ease;
        }

        .console-input-wrap input::placeholder {
          color: #B0B0B0;
        }

        .console-input-wrap input:focus {
          border-color: #E10613;
          background-color: #FFFFFF;
          box-shadow: 0 0 0 4px rgba(225, 6, 19, 0.06);
        }

        .console-toggle-pw {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: #B0B0B0;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
        }

        .console-toggle-pw:hover {
          color: #1A1A1A;
        }

        .console-error-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: #FFF5F5;
          border: 1px solid #FED7D7;
          color: #C53030;
          border-radius: 10px;
          padding: 0.75rem 1rem;
          font-size: 0.8125rem;
          margin-bottom: 1.25rem;
        }

        .console-submit-btn {
          width: 100%;
          padding: 0.9375rem;
          background-color: #E10613;
          border: none;
          border-radius: 12px;
          color: #FFFFFF;
          font-size: 0.9375rem;
          font-weight: 700;
          font-family: 'Outfit', sans-serif;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(225, 6, 19, 0.15);
        }

        .console-submit-btn:hover:not(:disabled) {
          background-color: #C70511;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(225, 6, 19, 0.25);
        }

        .console-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .console-spinner {
          animation: spin 1s linear infinite;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .console-footer-notes {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 2.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #F5F5F5;
          font-size: 0.75rem;
          color: #B0B0B0;
        }

        /* Responsive */
        @media (max-width: 960px) {
          .console-container {
            grid-template-columns: 1fr;
            max-width: 460px;
            min-height: auto;
            margin-top: 5rem;
          }
          .console-panel {
            display: none;
          }
          .console-right {
            padding: 3rem 2rem;
          }
        }
      `}</style>
    </div>
  );
}
