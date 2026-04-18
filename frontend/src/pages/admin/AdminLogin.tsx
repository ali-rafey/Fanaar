import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, LockKeyhole, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { api, setAuthToken } from '@/api/client';
import './AdminLogin.css';

type FeedbackState =
  | { type: 'error'; message: string }
  | { type: 'success'; message: string }
  | null;

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Something went wrong';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      if (isSignUp) {
        await api.admin.signUp(email, password, window.location.origin);
        setFeedback({ type: 'success', message: 'Verification email sent. Confirm the inbox message to activate access.' });
      } else {
        const data = await api.admin.signIn(email, password);
        setAuthToken(data.token);
        navigate('/123admin/dashboard');
      }
    } catch (error) {
      setFeedback({ type: 'error', message: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-shell">
        <section className="admin-login-brand">
          <div className="admin-login-brand-glow admin-login-brand-glow-a" />
          <div className="admin-login-brand-glow admin-login-brand-glow-b" />

          <div className="admin-login-brand-content">
            <span className="admin-login-badge">
              <ShieldCheck size={14} />
              Private Workspace
            </span>

            <div className="admin-login-brand-mark">
              <span className="admin-login-brand-arabic" lang="ar" dir="rtl">فنار</span>
              <span className="admin-login-brand-line" />
            </div>

            <div className="admin-login-brand-copy">
              <p className="admin-login-brand-kicker">Operations Console</p>
              <h1 className="admin-login-brand-title">Manage catalog, editorial content, and homepage media from one secure room.</h1>
              <p className="admin-login-brand-text">
                Designed for the team that maintains articles, categories, hero visuals, and the public showroom experience.
              </p>
            </div>

            <div className="admin-login-brand-points">
              <div className="admin-login-point">
                <Sparkles size={15} />
                <span>Homepage media and process imagery</span>
              </div>
              <div className="admin-login-point">
                <Sparkles size={15} />
                <span>Articles, specs, categories, and blogs</span>
              </div>
              <div className="admin-login-point">
                <Sparkles size={15} />
                <span>Refresh-token based admin sessions</span>
              </div>
            </div>
          </div>
        </section>

        <section className="admin-login-panel">
          <div className="admin-login-card">
            <div className="admin-login-header">
              <span className="admin-login-chip">{isSignUp ? 'Create Access' : 'Secure Sign In'}</span>
              <h2 className="admin-login-title">{isSignUp ? 'Provision a new admin account' : 'Welcome back'}</h2>
              <p className="admin-login-subtitle">
                {isSignUp
                  ? 'Create a controlled account and finish setup through email verification.'
                  : 'Use your admin credentials to enter the Fanaar control room.'}
              </p>
            </div>

            <div className="admin-login-mode-switch" role="tablist" aria-label="Authentication mode">
              <button
                type="button"
                className={`admin-login-mode-btn ${!isSignUp ? 'active' : ''}`}
                onClick={() => {
                  setIsSignUp(false);
                  setFeedback(null);
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`admin-login-mode-btn ${isSignUp ? 'active' : ''}`}
                onClick={() => {
                  setIsSignUp(true);
                  setFeedback(null);
                }}
              >
                Sign Up
              </button>
            </div>

            {feedback && (
              <div className={`admin-login-feedback ${feedback.type}`}>
                {feedback.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="admin-login-form">
              <div className="admin-login-field">
                <label className="admin-login-field-label" htmlFor="admin-email">Email</label>
                <div className="admin-login-input-wrap">
                  <Mail className="admin-login-input-icon" />
                  <input
                    id="admin-email"
                    type="email"
                    className="admin-login-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@fanaar.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="admin-login-field">
                <label className="admin-login-field-label" htmlFor="admin-password">Password</label>
                <div className="admin-login-input-wrap">
                  <LockKeyhole className="admin-login-input-icon" />
                  <input
                    id="admin-password"
                    type="password"
                    className="admin-login-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="admin-login-btn" disabled={loading}>
                <span>{loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Enter Admin Panel')}</span>
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
