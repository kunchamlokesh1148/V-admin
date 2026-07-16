import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Box, Tag, ShoppingBag, Users, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = () => {
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <aside className="admin-sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          Admin<span>Portal</span>
        </div>
      </div>

      {/* Navigation Items */}
      <ul className="sidebar-menu">
        <li>
          <NavLink 
            to="/" 
            end
            className={({ isActive }) => `sidebar-item-link ${isActive ? 'active' : ''}`}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>
        </li>
        <li>
          <NavLink 
            to="/products" 
            className={({ isActive }) => `sidebar-item-link ${isActive ? 'active' : ''}`}
          >
            <Box size={18} />
            <span>Products</span>
          </NavLink>
        </li>
        <li>
          <NavLink 
            to="/categories" 
            className={({ isActive }) => `sidebar-item-link ${isActive ? 'active' : ''}`}
          >
            <Tag size={18} />
            <span>Categories</span>
          </NavLink>
        </li>
        <li>
          <NavLink 
            to="/orders" 
            className={({ isActive }) => `sidebar-item-link ${isActive ? 'active' : ''}`}
          >
            <ShoppingBag size={18} />
            <span>Orders</span>
          </NavLink>
        </li>
        <li>
          <NavLink 
            to="/customers" 
            className={({ isActive }) => `sidebar-item-link ${isActive ? 'active' : ''}`}
          >
            <Users size={18} />
            <span>Customers</span>
          </NavLink>
        </li>
      </ul>

      {/* Sidebar Footer Account Action */}
      <div className="sidebar-footer">
        <button 
          onClick={handleLogout}
          className="sidebar-item-link"
          style={{
            background: 'none',
            border: 'none',
            width: '100%',
            cursor: 'pointer',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
