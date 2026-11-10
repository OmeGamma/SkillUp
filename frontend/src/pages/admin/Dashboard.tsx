import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, Cpu, Users, Briefcase, FileText, CheckCircle2,
  AlertTriangle, ArrowRight, Sparkles, Scale, Server
} from 'lucide-react';
import { api } from '../../services/api';
import { StatCard } from '../../components/StatCard';
import { Badge } from '../../components/Badge';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAdminStats()
      .then(res => setStats(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-600 border-r-transparent mb-2" />
        <p className="text-xs">Loading administrator control room...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-xs font-semibold text-rose-700 dark:text-rose-300 mb-2">
          <Shield className="w-3.5 h-3.5" />
          <span>System Administration & ML Governance</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          SkillUp Platform Control Center
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Manage local machine learning model training, post-hoc fairness disparity audits, recruiter onboarding approvals, and real database analytics.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Candidate Students"
          value={stats?.total_students || 0}
          subtitle="Registered student profiles"
          icon={Users}
          color="brand"
        />
        <StatCard
          title="Talent Recruiters"
          value={stats?.total_recruiters || 0}
          subtitle={`${stats?.pending_recruiter_approvals || 0} pending onboarding`}
          icon={Briefcase}
          color="emerald"
        />
        <StatCard
          title="Active Postings"
          value={`${stats?.active_jobs || 0} / ${stats?.total_jobs || 0}`}
          subtitle="Vacancies receiving applicants"
          icon={Briefcase}
          color="violet"
        />
        <StatCard
          title="Registered ML Models"
          value={stats?.total_models || 0}
          subtitle={`Active: ${stats?.active_model_version || 'None'}`}
          icon={Cpu}
          color="amber"
        />
      </div>

      {/* Quick Launch Suite */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="h-10 w-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-3">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Model Training Center</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Upload a dataset, check it for problems, train Logistic Regression or Random Forest, and keep track of model versions.
            </p>
          </div>
          <Link
            to="/admin/training"
            className="mt-6 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center space-x-1"
          >
            <span>Open training center</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="h-10 w-10 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-3">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Fairness Audit</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Checks whether the model treats different groups fairly — selection rates, disparate impact, and gaps in error rates.
            </p>
          </div>
          <Link
            to="/admin/fairness"
            className="mt-6 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline flex items-center space-x-1"
          >
            <span>Run an audit</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recruiter Approvals</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Approve new recruiter accounts before they can see candidate profiles.
            </p>
          </div>
          <Link
            to="/admin/recruiters"
            className="mt-6 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1"
          >
            <span>Manage Approvals ({stats?.pending_recruiter_approvals || 0})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
