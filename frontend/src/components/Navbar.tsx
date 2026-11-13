import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, LogOut, User as UserIcon, Menu, X, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { NotificationBell } from './NotificationBell';
import { Badge } from './Badge';

export const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  // Student Links
  const studentLinks = [
    { name: 'Dashboard', path: '/student/dashboard' },
    { name: 'Profile', path: '/student/profile' },
    { name: 'Resume Analyzer', path: '/student/resume' },
    { name: 'Skill Matching', path: '/student/matching' },
    { name: 'Job Explorer', path: '/student/jobs' },
    { name: 'Reports', path: '/student/reports' },
  ];

  // Recruiter Links
  const recruiterLinks = [
    { name: 'Dashboard', path: '/recruiter/dashboard' },
    { name: 'Job Postings', path: '/recruiter/jobs' },
    { name: 'Candidate Ranking', path: '/recruiter/candidates' },
    { name: 'Candidate Comparison', path: '/recruiter/comparison' },
  ];

  // Admin Links
  const adminLinks = [
    { name: 'System Overview', path: '/admin/dashboard' },
    { name: 'Model Training', path: '/admin/training' },
    { name: 'Fairness Audit', path: '/admin/fairness' },
    { name: 'Recruiter Approvals', path: '/admin/recruiters' },
  ];

  const currentNavLinks = !isAuthenticated
    ? []
    : user?.role === 'admin'
    ? adminLinks
    : user?.role === 'recruiter'
    ? recruiterLinks
    : studentLinks;

  const roleBadgeVariant = {
    admin: 'danger',
    recruiter: 'primary',
    student: 'success'
  }[user?.role || 'student'] as any;

  return (
    <nav className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Link to={isAuthenticated ? `/${user?.role}/dashboard` : '/'} className="flex items-center space-x-2.5 group">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">
                  Skill<span className="text-brand-600 dark:text-brand-400">Up</span>
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            {isAuthenticated && (
              <div className="hidden lg:flex items-center space-x-1 ml-6">
                {currentNavLinks.map(link => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive(link.path)
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 font-semibold'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right Controls */}
          <div className="hidden sm:flex items-center space-x-3">
            <ThemeToggle />

            {isAuthenticated ? (
              <>
                <NotificationBell />

                <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
                  >
                    <div className="h-8 w-8 rounded-full bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold text-xs">
                      {user?.full_name?.charAt(0) || 'U'}
                    </div>
                    <div className="text-left hidden md:block">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                        {user?.full_name}
                      </p>
                      <div className="flex items-center mt-0.5">
                        <Badge variant={roleBadgeVariant} size="sm">
                          {user?.role}
                        </Badge>
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {userDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-50"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                        <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">{user?.full_name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                      </div>
                      <Link
                        to={user?.role === 'recruiter' ? '/recruiter/dashboard' : user?.role === 'admin' ? '/admin/dashboard' : '/student/profile'}
                        className="flex items-center space-x-2 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        <span>Manage Profile</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-brand-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm shadow-brand-500/20 transition-all hover:shadow"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center space-x-2 sm:hidden">
            <ThemeToggle />
            {isAuthenticated && <NotificationBell />}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-200 dark:border-slate-800 px-4 pt-2 pb-4 space-y-1 bg-white dark:bg-slate-900">
          {isAuthenticated ? (
            <>
              <div className="py-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user?.full_name}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
                <div className="mt-1">
                  <Badge variant={roleBadgeVariant} size="sm">Role: {user?.role}</Badge>
                </div>
              </div>

              {currentNavLinks.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive(link.path)
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {link.name}
                </Link>
              ))}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full mt-3 flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <div className="pt-2 space-y-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2 text-sm font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2 text-sm font-medium text-white bg-brand-600 rounded-lg"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
