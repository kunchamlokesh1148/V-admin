import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { Bell } from 'lucide-react';

export const AdminLayout = () => {
  const { user, profile } = useAuth();
  const location = useLocation();

  // Get current page name from path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard Overview';
    if (path.startsWith('/products')) return 'Inventory Products';
    if (path.startsWith('/categories')) return 'Product Categories';
    if (path.startsWith('/orders')) return 'Customer Orders';
    if (path.startsWith('/customers')) return 'Registered Customers';
    return 'Admin Panel';
  };

  return (
    <div className="admin-container">
      <Sidebar />
      <div className="admin-main">
        {/* Header bar */}
        <header className="admin-header">
          <div className="header-title-area">
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>{getPageTitle()}</h2>
          </div>
          
          <div className="header-user-menu">
            <button className="btn btn-icon btn-secondary" style={{ border: 'none', position: 'relative' }}>
              <Bell size={18} />
              <span style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--error)'
              }}></span>
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="user-avatar">
                {profile?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'A'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                  {profile?.full_name || 'Administrator'}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {profile?.company_name || 'Main Office'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Area */}
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
