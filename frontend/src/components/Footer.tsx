import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 transition-colors mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand Col */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2.5 mb-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-600 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Skill<span className="text-brand-600 dark:text-brand-400">Up</span>
              </span>
            </div>
            <p className="text-sm font-medium text-brand-600 dark:text-brand-400 mb-2">
              Figure out what to learn next — then prove you've got it.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
              SkillUp connects students and recruiters through resume parsing, skill matching, and a scoring model that runs on our own backend. No data leaves the platform for outside AI services.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <li><Link to="/student/dashboard" className="hover:text-brand-600 transition-colors">Student Workspace</Link></li>
              <li><Link to="/recruiter/dashboard" className="hover:text-brand-600 transition-colors">Recruiter Workspace</Link></li>
              <li><Link to="/admin/dashboard" className="hover:text-brand-600 transition-colors">Model Training Center</Link></li>
              <li><Link to="/student/resume" className="hover:text-brand-600 transition-colors">Local Resume Parser</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <p className="font-semibold text-slate-700 dark:text-slate-300">
            SkillUp : By OmeGamma
          </p>
          <p className="mt-2 sm:mt-0">
            © {new Date().getFullYear()} OmeGamma. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
