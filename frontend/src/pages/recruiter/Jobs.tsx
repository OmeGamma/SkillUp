import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase, Plus, Users, Edit3, Trash2, MapPin, Eye,
  CheckCircle2, AlertCircle, Clock
} from 'lucide-react';
import { api } from '../../services/api';
import { Badge } from '../../components/Badge';

export const RecruiterJobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const data = await api.getRecruiterJobs();
      setJobs(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this job posting?')) return;
    try {
      await api.deleteJob(id);
      setActionMsg({ type: 'success', text: 'Job posting deleted.' });
      loadJobs();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'Failed to delete job.' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Job Postings Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create, update, and manage your organization's open vacancies and candidate pipelines
          </p>
        </div>

        <Link
          to="/recruiter/jobs/new"
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Post New Vacancy</span>
        </Link>
      </div>

      {actionMsg && (
        <div className={`p-4 rounded-xl flex items-center space-x-2 text-xs ${
          actionMsg.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
            : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
        }`}>
          {actionMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
          <span>{actionMsg.text}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-600 border-r-transparent mb-2" />
          <p className="text-xs">Loading postings...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
          No job postings created yet. Click "Post New Vacancy" to publish your first opportunity.
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map(job => (
            <div
              key={job.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-brand-600 dark:text-brand-400">{job.organization}</span>
                  <Badge variant={job.status === 'active' ? 'success' : 'neutral'} size="sm">
                    {job.status}
                  </Badge>
                  {job.is_demo && <Badge variant="warning" size="sm">Demonstration</Badge>}
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white">{job.title}</h3>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{job.location} ({job.work_mode})</span>
                  </span>
                  <span>•</span>
                  <span>Min Exp: {job.min_experience_years || 0} yrs</span>
                  <span>•</span>
                  <span>Created: {new Date(job.created_at).toLocaleDateString()}</span>
                </div>

                <div className="flex flex-wrap gap-1 pt-1">
                  {job.required_skills?.map((s: string) => (
                    <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-3 self-end md:self-auto">
                <Link
                  to={`/recruiter/candidates?job_id=${job.id}`}
                  className="inline-flex items-center space-x-1 px-3.5 py-2 rounded-xl text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:text-brand-300 transition-colors"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{job.application_count} Applicants</span>
                </Link>

                <Link
                  to={`/recruiter/jobs/${job.id}/edit`}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Edit posting"
                >
                  <Edit3 className="w-4 h-4" />
                </Link>

                <button
                  onClick={() => handleDelete(job.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  title="Delete posting"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
