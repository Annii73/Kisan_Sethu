import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home, User, Sprout, Cloud, TrendingUp, BookOpen,
  MessageCircle, Search, MessageSquare, Bug, X, LogOut
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const Navigation = ({ mobileMenuOpen, setMobileMenuOpen }) => {
  const { t } = useLanguage();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const navItems = [
    { path: '/', icon: Home, label: t('dashboard') },
    { path: '/profile', icon: User, label: t('profile') },
    { path: '/crop-advice', icon: Sprout, label: t('cropAdvice') },
    { path: '/weather', icon: Cloud, label: t('weather') },
    { path: '/market-prices', icon: TrendingUp, label: t('marketPrices') },
    { path: '/learning-hub', icon: BookOpen, label: t('learningHub') },
    { path: '/chatbot', icon: MessageCircle, label: t('chatbot') },
    { path: '/scheme-finder', icon: Search, label: t('schemeFinder') },
    { path: '/pest-detection', icon: Bug, label: t('pestDetection') },
    { path: '/feedback', icon: MessageSquare, label: t('feedback') }
  ];

  const NavContent = () => (
    <nav className="space-y-2">
      {navItems.map(({ path, icon: Icon, label }) => (
        <NavLink
          key={path}
          to={path}
          onClick={() => setMobileMenuOpen(false)}
          className={({ isActive }) =>
            `flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            }`
          }
        >
          <Icon className="h-5 w-5 mr-3" />
          {label}
        </NavLink>
      ))}

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
      >
        <LogOut className="h-5 w-5 mr-3" />
        Logout
      </button>
    </nav>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="flex-1 p-4">
          <NavContent />
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('menu')}
              </h2>

              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4">
              <NavContent />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navigation;