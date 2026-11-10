import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Building, Briefcase, Calendar, CheckCircle2,
  AlertCircle, Shield, Award, Sparkles
} from 'lucide-react';
import { api } from '../../services/api';
import { Badge } from '../../components/Badge';

export const JobDetailPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadJob = async () => {
    if (!jobId) return;
    setLoading(true);
    try {
      const data = await api.getJobDetail(parseInt(jobId));
      setJob(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJob();
  }, [jobId]);

  const handleExpressInterest = async () => {
    if (!job) return;
    setActionMsg(null);
    try {
      const res = await api.expressInterest(job.id);
      setActionMsg({ type: 'success', text: `Interest expressed! Calculated compatibility: ${res.match_score}%` });
      loadJob();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'Failed to express interest.' });
    }
  };

  const handleWithdraw = async () => {
    if (!job) return;
    setActionMsg(null);
    try {
      await api.withdrawApplication(job.id);
      setActionMsg({ type: 'success', text: 'Application withdrawn.' });
      loadJob();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'Failed to withdraw.' });
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-500">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-600 border-r-transparent mb-2" />
        <p className="text-xs">Loading position details...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-500">
        <p className="text-sm">Job posting not found.</p>
        <Link to="/student/jobs" className="text-xs text-brand-600 underline mt-2 inline-block">Back to Job Explorer</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link
        to="/student/jobs"
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Job Explorer</span>
      </Link>

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

      {/* Hero Header Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-xs font-bold text-brand-600 dark:text-brand-400">{job.organization}</span>
              {job.is_demo && <Badge variant="warning" size="sm">Demonstration Posting</Badge>}
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">{job.title}</h1>
            <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 mt-2">
              <span className="flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{job.location} ({job.work_mode})</span>
              </span>
              <span>•</span>
              <span>Min Experience: {job.min_experience_years || 0} years</span>
              {job.salary_range && (
                <>
                  <span>•</span>
                  <span>{job.salary_range}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {job.match_score !== null && (
              <div className="p-3 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-900 text-center">
                <span className="text-xl font-extrabold text-brand-600 dark:text-brand-400 block">{job.match_score}%</span>
                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Candidate Match</span>
              </div>
            )}

            {job.student_interest_status && job.student_interest_status !== 'Withdrawn' ? (
              <div className="flex items-center space-x-2">
                <Badge variant="primary">{job.student_interest_status}</Badge>
                <button onClick={handleWithdraw} className="text-xs text-rose-600 hover:underline">Withdraw</button>
              </div>
            ) : (
              <button
                onClick={handleExpressInterest}
                className="px-5 py-2.5 text-xs font-semibold rounded-xl text-white bg-brand-600 hover:bg-brand-700 shadow-sm"
              >
                Express Interest
              </button>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Role Overview & Responsibilities</h3>
          <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
            {job.description}
          </p>
        </div>

        {/* Requirements Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
              Required Core Skills
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {job.required_skills?.map((s: string) => (
                <span key={s} className="px-2.5 py-1 rounded-lg bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-xs font-semibold text-brand-700 dark:text-brand-300">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
              Preferred Competitive Skills
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {job.preferred_skills?.length ? (
                job.preferred_skills.map((s: string) => (
                  <span key={s} className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300">
                    {s}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400">None specified</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
