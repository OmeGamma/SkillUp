import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, Briefcase, Award, TrendingUp, CheckCircle2,
  Clock, ArrowRight, Zap, Target, Sparkles, BookOpen, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { StatCard } from '../../components/StatCard';
import { Badge } from '../../components/Badge';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [profData, appsData, jobsData, repData] = await Promise.all([
          api.getStudentProfile().catch(() => null),
          api.getStudentApplications().catch(() => []),
          api.getJobs().catch(() => []),
          api.getReports().catch(() => [])
        ]);

        setProfile(profData);
        setApplications(appsData);
        setReports(repData);
        
        // Sort jobs by match score if available
        if (jobsData && Array.isArray(jobsData)) {
          const sorted = [...jobsData].sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
          setRecommendedJobs(sorted.slice(0, 4));
        }
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center text-slate-500">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-600 border-r-transparent mb-3" />
        <p className="text-sm font-medium">Loading candidate workspace...</p>
      </div>
    );
  }

  const completeness = profile?.completeness_score || 25;
  const verifiedSkillsCount = profile?.skills?.filter((s: any) => s.verified).length || 0;
  const totalSkillsCount = profile?.skills?.length || 0;
  const assessmentCoding = profile?.assessment_scores?.coding_score || 75;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome & Completeness Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-brand-600 to-accent-600 text-white shadow-lg shadow-brand-500/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Target Role: {profile?.target_role || 'Software Engineer'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.full_name}!
          </h1>
          <p className="text-brand-100 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
            Your skills are matched against open roles — see where you stand and what's missing.
          </p>
        </div>

        {/* Profile Completeness Gauge */}
        <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 min-w-[240px]">
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span>Profile Completeness</span>
            <span>{completeness}%</span>
          </div>
          <div className="w-full bg-black/20 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-white h-full rounded-full transition-all duration-500"
              style={{ width: `${completeness}%` }}
            />
          </div>
          <Link
            to="/student/profile"
            className="text-[11px] text-white underline font-semibold mt-2.5 inline-block hover:text-brand-100"
          >
            {completeness < 100 ? 'Complete profile for higher recruiter visibility →' : 'Edit candidate profile →'}
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Verified Skills"
          value={`${verifiedSkillsCount} / ${totalSkillsCount}`}
          subtitle="Project-backed technical evidence"
          icon={Award}
          color="emerald"
        />
        <StatCard
          title="Active Applications"
          value={applications.length}
          subtitle="Recruiter interest expressions"
          icon={Briefcase}
          color="brand"
        />
        <StatCard
          title="Coding Benchmark"
          value={`${assessmentCoding}%`}
          subtitle="Diagnostic readiness score"
          icon={TrendingUp}
          color="violet"
        />
        <StatCard
          title="Saved Reports"
          value={reports.length}
          subtitle="Exportable PDF career analyses"
          icon={FileText}
          color="amber"
        />
      </div>

      {/* Workspace Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/student/resume"
          className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-brand-500 hover:shadow-md transition-all flex items-center justify-between group"
        >
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-brand-600">Local Resume Analyzer</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Extract & audit PDF/DOCX skills</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          to="/student/matching"
          className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-brand-500 hover:shadow-md transition-all flex items-center justify-between group"
        >
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 rounded-lg bg-accent-50 dark:bg-accent-950/60 text-accent-600 dark:text-accent-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-brand-600">Skill Gap Analysis</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Calculate coverage & learning path</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          to="/student/jobs"
          className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-brand-500 hover:shadow-md transition-all flex items-center justify-between group"
        >
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-brand-600">Explore Open Roles</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Match against recruiter postings</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Main 2-Col Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Applications */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Recruitment Applications</h3>
                <p className="text-xs text-slate-500">Real-time status updates and transparent match metrics</p>
              </div>
              <Link to="/student/jobs" className="text-xs text-brand-600 font-semibold hover:underline">
                View all jobs →
              </Link>
            </div>

            {applications.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                You haven't expressed interest in any postings yet. Browse open jobs to apply.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {applications.slice(0, 5).map(app => (
                  <div key={app.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{app.job_title}</h4>
                        <span className="text-xs text-slate-400">• {app.organization}</span>
                      </div>
                      <div className="flex items-center space-x-3 mt-1 text-[11px] text-slate-500">
                        <span>Work Mode: {app.work_mode}</span>
                        <span>•</span>
                        <span>Match: <b className="text-brand-600">{app.match_score}%</b></span>
                        <span>•</span>
                        <span>Applied: {new Date(app.applied_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          app.status === 'Selected' ? 'success' :
                          app.status === 'Shortlisted' ? 'primary' :
                          app.status === 'Interview Scheduled' ? 'info' :
                          app.status === 'Not Selected' ? 'danger' : 'warning'
                        }
                      >
                        {app.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Recommended Jobs for Candidate */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Recommended Job Opportunities</h3>
            <p className="text-xs text-slate-500 mb-4">Ranked by calculated composite compatibility with your verified profile</p>

            <div className="space-y-3">
              {recommendedJobs.map(job => (
                <div key={job.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{job.title}</h4>
                      {job.is_demo && <Badge variant="warning" size="sm">Demo Posting</Badge>}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{job.organization} • {job.location} ({job.work_mode})</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {job.required_skills?.slice(0, 4).map((s: string) => (
                        <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {job.match_score !== null && (
                      <div className="text-right">
                        <span className="text-xs font-bold text-brand-600 dark:text-brand-400">{job.match_score}%</span>
                        <p className="text-[10px] text-slate-400">Match</p>
                      </div>
                    )}
                    <Link
                      to={`/student/jobs/${job.id}`}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors whitespace-nowrap"
                    >
                      Inspect Role
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Skill Health & Recommendations */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Evidence Breakdown</h3>
            <p className="text-xs text-slate-500 mb-4">Verification status of your technical profile</p>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center space-x-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Project-Backed Skills</span>
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">{verifiedSkillsCount}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center space-x-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Self-Reported / Resume</span>
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">{totalSkillsCount - verifiedSkillsCount}</span>
              </div>

              <div className="p-3 rounded-lg bg-brand-50/50 dark:bg-brand-950/20 border border-brand-100 dark:border-brand-900 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <span className="font-semibold text-brand-700 dark:text-brand-300">Tip:</span> Skills supported by explicit project descriptions or GitHub repositories receive 2x higher ranking weight in recruiter candidate screenings.
              </div>
            </div>
          </div>

          {/* Quick Learning Roadmap Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center space-x-2 mb-3">
              <BookOpen className="w-4 h-4 text-brand-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recommended Activity</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Benchmark your skills against the <b className="text-slate-700 dark:text-slate-300">Full Stack Developer</b> role catalog to identify high-priority gaps.
            </p>
            <Link
              to="/student/matching"
              className="w-full py-2 px-3 text-center rounded-lg border border-brand-600 text-brand-600 dark:text-brand-400 font-semibold text-xs hover:bg-brand-50 dark:hover:bg-brand-950/50 transition-colors block"
            >
              Run Skill Gap Analysis →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
