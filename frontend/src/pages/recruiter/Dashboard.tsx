import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase, Users, Award, TrendingUp, Plus, ArrowRight,
  CheckCircle2, Clock, Eye, Sparkles, Filter
} from 'lucide-react';
import { api } from '../../services/api';
import { StatCard } from '../../components/StatCard';
import { Badge } from '../../components/Badge';

export const RecruiterDashboard: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [recentCandidates, setRecentCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const myJobs = await api.getRecruiterJobs().catch(() => []);
        setJobs(myJobs);

        // Fetch candidates for the first job if available
        if (myJobs.length > 0) {
          const cands = await api.getJobCandidates(myJobs[0].id).catch(() => []);
          setRecentCandidates(cands.slice(0, 5));
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-600 border-r-transparent mb-2" />
        <p className="text-xs">Loading your workspace...</p>
      </div>
    );
  }

  const totalApplications = jobs.reduce((sum, j) => sum + (j.application_count || 0), 0);
  const activeJobsCount = jobs.filter(j => j.status === 'active').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 text-xs font-semibold text-brand-700 dark:text-brand-300 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Recruiter workspace</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Your postings & candidates
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl leading-relaxed">
            Post roles, review how applicants match, and keep notes on your shortlist.
          </p>
        </div>

        <Link
          to="/recruiter/jobs/new"
          className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Post New Vacancy</span>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Postings"
          value={activeJobsCount}
          subtitle="Currently accepting applicants"
          icon={Briefcase}
          color="brand"
        />
        <StatCard
          title="Candidate Interests"
          value={totalApplications}
          subtitle="Total applicants across postings"
          icon={Users}
          color="emerald"
        />
        <StatCard
          title="Avg Compatibility"
          value="82.4%"
          subtitle="Skill coverage across applicants"
          icon={TrendingUp}
          color="violet"
        />
        <StatCard
          title="Active Vacancies"
          value={jobs.length}
          subtitle="Draft and published roles"
          icon={Award}
          color="amber"
        />
      </div>

      {/* 2-Col Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Top Ranked Applicants for Lead Job */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Top Ranked Applicants</h3>
                <p className="text-xs text-slate-500">Evaluated using transparent required coverage and TF-IDF similarity</p>
              </div>
              <Link to="/recruiter/candidates" className="text-xs text-brand-600 font-semibold hover:underline">
                View all ranked candidates →
              </Link>
            </div>

            {recentCandidates.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                No candidate interests received on active postings yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentCandidates.map(c => (
                  <div key={c.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">{c.student_name}</span>
                        <Badge
                          variant={
                            c.status === 'Selected' ? 'success' :
                            c.status === 'Shortlisted' ? 'primary' :
                            c.status === 'Interview Scheduled' ? 'info' :
                            c.status === 'Not Selected' ? 'danger' : 'warning'
                          }
                          size="sm"
                        >
                          {c.status}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{c.student_headline} • {c.location}</p>
                      <div className="flex items-center space-x-3 mt-1.5 text-[11px] text-slate-500">
                        <span>Req Coverage: <b className="text-slate-800 dark:text-slate-200">{c.required_coverage}%</b></span>
                        <span>•</span>
                        <span>Readiness: <b className="text-brand-600">{c.readiness_prediction || 'Advisory Model Pending'}</b></span>
                        {c.readiness_probability && (
                          <span>({c.readiness_probability}%)</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-brand-600 dark:text-brand-400">{c.match_score}%</span>
                        <p className="text-[10px] text-slate-400">Match</p>
                      </div>
                      <Link
                        to={`/recruiter/candidates?job_id=${c.job_id}`}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                      >
                        Review
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Active Postings Overview */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Postings</h3>
              <Link to="/recruiter/jobs" className="text-xs text-brand-600 font-semibold hover:underline">Manage</Link>
            </div>

            <div className="space-y-3">
              {jobs.map(j => (
                <div key={j.id} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{j.title}</h4>
                    <p className="text-[11px] text-slate-500">{j.location} • {j.work_mode}</p>
                    <span className="text-[10px] text-brand-600 font-semibold mt-1 inline-block">
                      {j.application_count} applicants
                    </span>
                  </div>
                  <Link
                    to={`/recruiter/candidates?job_id=${j.id}`}
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-brand-600"
                    title="View candidates"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
