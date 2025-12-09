import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import './LoginPage.css';

export default function LoginPage() {
  const [userid, setUserid] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { login, loading, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const trimmedUserid = userid.trim();
    if (!trimmedUserid) {
      setError('User ID is required');
      return;
    }

    const result = await login(trimmedUserid);
    
    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1500);
    } else {
      setError(result.error || 'Login failed');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Login</h1>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="userid">User ID</label>
            <input
              id="userid"
              type="text"
              value={userid}
              onChange={(e) => setUserid(e.target.value)}
              placeholder="Enter your User ID"
              disabled={loading}
              autoFocus
            />
          </div>

          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success" role="alert">
              Login successful! Redirecting...
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={loading || !userid.trim()}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

