import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, MapPin, CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { Badge } from '../../components/Badge';

export const JobExplorerPage: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [workMode, setWorkMode] = useState<string>('');
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const data = await api.getJobs({
        q: search || undefined,
        work_mode: workMode || undefined,
      });
      setJobs(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [workMode]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadJobs();
  };

  const handleExpressInterest = async (jobId: number) => {
    setActionMsg(null);
    try {
      const res = await api.expressInterest(jobId);
      setActionMsg({ type: 'success', text: `Interest expressed successfully! Candidate match score: ${res.match_score}%` });
      loadJobs();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'Failed to express interest.' });
    }
  };

  const handleWithdraw = async (jobId: number) => {
    setActionMsg(null);
    try {
      await api.withdrawApplication(jobId);
      setActionMsg({ type: 'success', text: 'Interest withdrawn from position.' });
      loadJobs();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'Failed to withdraw interest.' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Recruitment Job Explorer
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Explore genuine job opportunities posted by verified recruiters. 
          Compatibility percentages are calculated locally from your actual resume and project evidence.
        </p>
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

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by job title, organization, or required skills..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
          />
        </form>

        <div className="flex items-center space-x-2">
          <select
            value={workMode}
            onChange={e => setWorkMode(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
          >
            <option value="">All Work Modes</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
            <option value="On-site">On-site</option>
          </select>

          <button
            type="button"
            onClick={loadJobs}
            className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
          >
            Filter
          </button>
        </div>
      </div>

      {/* Jobs Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-600 border-r-transparent mb-2" />
          <p className="text-xs">Fetching active vacancies...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
          No job postings matched your search criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs.map(job => (
            <div
              key={job.id}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-xs font-bold text-brand-600 dark:text-brand-400">{job.organization}</span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{job.title}</h3>
                  </div>
                  {job.is_demo && (
                    <Badge variant="warning" size="sm">Demo Posting</Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 dark:text-slate-400 mb-3">
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{job.location}</span>
                  </span>
                  <span>•</span>
                  <span>{job.work_mode}</span>
                  {job.salary_range && (
                    <>
                      <span>•</span>
                      <span>{job.salary_range}</span>
                    </>
                  )}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 mb-4 leading-relaxed">
                  {job.description}
                </p>

                {/* Skill Chips */}
                <div className="space-y-1.5 mb-4">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Required Skills:</span>
                  <div className="flex flex-wrap gap-1">
                    {job.required_skills?.map((s: string) => (
                      <span key={s} className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-300">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Footer Actions */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  {job.match_score !== null && (
                    <div className="flex items-baseline space-x-1">
                      <span className="text-base font-extrabold text-brand-600 dark:text-brand-400">{job.match_score}%</span>
                      <span className="text-[10px] text-slate-400">compatibility</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Link
                    to={`/student/jobs/${job.id}`}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-brand-600 transition-colors"
                  >
                    Details
                  </Link>

                  {job.student_interest_status && job.student_interest_status !== 'Withdrawn' ? (
                    <div className="flex items-center space-x-2">
                      <Badge variant="primary" size="sm">{job.student_interest_status}</Badge>
                      <button
                        onClick={() => handleWithdraw(job.id)}
                        className="text-[11px] text-rose-600 hover:underline"
                      >
                        Withdraw
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleExpressInterest(job.id)}
                      className="px-4 py-2 text-xs font-semibold rounded-xl text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition-colors"
                    >
                      Express Interest
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
