import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { getApiUrl, setApiUrl, COMMON_API_URLS } from '../utils/apiConfig';
import { updateApiBaseUrl, api } from '../api/client';

export default function LoginPage() {
  const storedUrl = getApiUrl();
  const isValidUrl = COMMON_API_URLS.some((url) => url.value === storedUrl);
  const initialUrl = isValidUrl ? storedUrl : COMMON_API_URLS[0].value;
  
  const [userid, setUserid] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [apiUrl, setApiUrlState] = useState(initialUrl);
  const { login, loading, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // Update API client when URL changes
    updateApiBaseUrl(apiUrl);
  }, [apiUrl]);

  const handleApiUrlChange = (value: string) => {
    setApiUrlState(value);
    setApiUrl(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const trimmedUserid = userid.trim();
    if (!trimmedUserid) {
      setError('User ID is required');
      return;
    }

    // Update API client if URL changed
    if (apiUrl !== api.defaults.baseURL) {
      updateApiBaseUrl(apiUrl);
      setApiUrl(apiUrl);
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
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-5">
      <div className="bg-white rounded-lg p-10 border border-gray-200 w-full max-w-md">
        <h1 className="text-3xl font-semibold text-gray-900 text-center mb-8">Login</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="apiUrl" className="text-sm font-medium text-gray-700">Choose Client</label>
            <select
              id="apiUrl"
              value={apiUrl}
              onChange={(e) => handleApiUrlChange(e.target.value)}
              disabled={loading}
              className="px-4 py-3 border-2 border-gray-200 rounded-lg text-base bg-white text-gray-900 cursor-pointer transition-colors focus:outline-none focus:border-blue-600 disabled:bg-gray-50 disabled:cursor-not-allowed"
            >
              {COMMON_API_URLS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="userid" className="text-sm font-medium text-gray-700">User ID</label>
            <input
              id="userid"
              type="text"
              value={userid}
              onChange={(e) => setUserid(e.target.value)}
              placeholder="Enter your User ID"
              disabled={loading}
              autoFocus
              className="px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-colors focus:outline-none focus:border-blue-600 disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>

          {error && (
            <div className="px-4 py-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="px-4 py-3 rounded-lg text-sm bg-green-50 text-green-700 border border-green-200" role="alert">
              Login successful! Redirecting...
            </div>
          )}

          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white rounded-md text-base font-medium cursor-pointer transition-colors flex items-center justify-center gap-2 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loading || !userid.trim()}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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

