import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { ServiceStatus } from '../types/auth';

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redeploying, setRedeploying] = useState<Record<string, boolean>>({});
  const [redeployMessage, setRedeployMessage] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchServiceStatus();
  }, []);

  const fetchServiceStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/v2/service_status');
      if (response.data.success && response.data.data) {
        setServices(response.data.data);
      }
    } catch (err) {
      setError('Failed to fetch service status');
      console.error('Service status fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeploy = async (serviceName: string) => {
    try {
      setRedeploying((prev) => ({ ...prev, [serviceName]: true }));
      setRedeployMessage((prev) => ({ ...prev, [serviceName]: '' }));

      const response = await api.post('/v2/custom/redeploy', {
        service: serviceName,
        branch: 'dev',
      });

      setRedeployMessage((prev) => ({
        ...prev,
        [serviceName]: response.data.message || 'Redeploy initiated successfully',
      }));

      // Refresh service status after a short delay
      setTimeout(() => {
        fetchServiceStatus();
      }, 2000);
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to redeploy service';
      setRedeployMessage((prev) => ({
        ...prev,
        [serviceName]: errorMessage,
      }));
      console.error('Redeploy error:', err);
    } finally {
      setRedeploying((prev) => ({ ...prev, [serviceName]: false }));
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-10 py-5 flex justify-between items-center w-full">
        <h1 className="text-2xl text-gray-900 m-0">Dashboard</h1>
        <button 
          onClick={handleLogout} 
          className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium cursor-pointer transition-colors hover:bg-red-700"
        >
          Logout
        </button>
      </div>
      <div className="p-10 max-w-7xl mx-auto w-full">
        <div className="bg-white rounded-lg p-8 border border-gray-200">
          <h2 className="text-3xl text-gray-900 m-0 mb-5">Welcome, {user?.name || user?.id || 'User'}!</h2>
          <div className="flex flex-col gap-3">
            <p className="m-0 text-base text-gray-600"><strong className="text-gray-900 mr-2">User ID:</strong> {user?.id}</p>
            {user?.email && <p className="m-0 text-base text-gray-600"><strong className="text-gray-900 mr-2">Email:</strong> {user.email}</p>}
            {user?.name && <p className="m-0 text-base text-gray-600"><strong className="text-gray-900 mr-2">Name:</strong> {user.name}</p>}
          </div>
        </div>

        <div className="bg-white rounded-lg p-8 border border-gray-200 mt-8">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-2xl text-gray-900 m-0">Service Status</h2>
            <button 
              onClick={fetchServiceStatus} 
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium cursor-pointer transition-colors hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-lg text-sm mb-5 bg-red-50 text-red-700 border border-red-200">
              {error}
            </div>
          )}

          {loading && services.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600 m-0">Loading service status...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 border-b-2 border-gray-200 text-sm uppercase tracking-wide">Service Name</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 border-b-2 border-gray-200 text-sm uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 border-b-2 border-gray-200 text-sm uppercase tracking-wide">Last Updated</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 border-b-2 border-gray-200 text-sm uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service) => (
                    <tr key={service.serviceName} className="hover:bg-gray-50">
                      <td className="px-4 py-4 border-b border-gray-100 font-medium text-gray-900">{service.serviceName}</td>
                      <td className="px-4 py-4 border-b border-gray-100">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                          service.status.toLowerCase() === 'up' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {service.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 border-b border-gray-100 text-sm text-gray-600">{formatDate(service.updatedAt)}</td>
                      <td className="px-4 py-4 border-b border-gray-100">
                        {service.status.toLowerCase() === 'down' ? (
                          <>
                            <button
                              onClick={() => handleRedeploy(service.serviceName)}
                              disabled={redeploying[service.serviceName]}
                              className="px-3 py-1.5 bg-green-600 text-white rounded-md text-xs font-medium cursor-pointer transition-colors hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                              {redeploying[service.serviceName] ? (
                                <>
                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  Redeploying...
                                </>
                              ) : (
                                'Redeploy'
                              )}
                            </button>
                            {redeployMessage[service.serviceName] && (
                              <p className={`text-xs mt-1 ${
                                redeployMessage[service.serviceName].includes('Failed') || redeployMessage[service.serviceName].includes('error')
                                  ? 'text-red-600'
                                  : 'text-green-600'
                              }`}>
                                {redeployMessage[service.serviceName]}
                              </p>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

