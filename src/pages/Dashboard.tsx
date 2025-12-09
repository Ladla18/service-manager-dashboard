import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { ServiceStatus } from '../types/auth';
import './Dashboard.css';

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>
      <div className="dashboard-content">
        <div className="welcome-card">
          <h2>Welcome, {user?.name || user?.id || 'User'}!</h2>
          <div className="user-info">
            <p><strong>User ID:</strong> {user?.id}</p>
            {user?.email && <p><strong>Email:</strong> {user.email}</p>}
            {user?.name && <p><strong>Name:</strong> {user.name}</p>}
          </div>
        </div>

        <div className="service-status-card">
          <div className="service-status-header">
            <h2>Service Status</h2>
            <button onClick={fetchServiceStatus} className="refresh-button" disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          {loading && services.length === 0 ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading service status...</p>
            </div>
          ) : (
            <div className="service-status-table">
              <table>
                <thead>
                  <tr>
                    <th>Service Name</th>
                    <th>Status</th>
                    <th>Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service) => (
                    <tr key={service.serviceName}>
                      <td className="service-name">{service.serviceName}</td>
                      <td>
                        <span className={`status-badge status-${service.status.toLowerCase()}`}>
                          {service.status}
                        </span>
                      </td>
                      <td className="updated-at">{formatDate(service.updatedAt)}</td>
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

