import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setAuthToken } from '@/api/client';
import './AdminLogin.css';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        await api.admin.signUp(email, password, window.location.origin);
        setError('Please check your email to verify your account.');
      } else {
        const data = await api.admin.signIn(email, password);
        setAuthToken(data.token);
        navigate('/123admin/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <h1 className="admin-login-title">Admin Panel</h1>
          <p className="admin-login-subtitle">
            {isSignUp ? 'Create your account' : 'Sign in to manage your fabric catalog'}
          </p>
        </div>

        {error && (
          <div className="admin-login-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="admin-login-btn" disabled={loading}>
            {loading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        <div className="admin-login-toggle">
          <button
            type="button"
            className="admin-toggle-btn"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
          >
            {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
}
