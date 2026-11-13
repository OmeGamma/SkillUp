import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Cpu, FileText, CheckCircle2, ArrowRight,
  BarChart3, Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Badge } from '../components/Badge';

export const LandingPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [activeModel, setActiveModel] = useState<any>(null);
  const [demoLoginLoading, setDemoLoginLoading] = useState<string | null>(null);

  useEffect(() => {
    // Fetch live database jobs for demo showcase
    api.getJobs()
      .then(res => setActiveJobs(res.slice(0, 3)))
      .catch(() => {});

    api.getActiveModel()
      .then(res => {
        if (res.has_active_model) setActiveModel(res.model);
      })
      .catch(() => {});
  }, []);

  const handleQuickDemoLogin = async (email: string, pass: string, roleKey: string) => {
    setDemoLoginLoading(roleKey);
    try {
      await login({ email, password: pass });
      if (roleKey === 'admin') navigate('/admin/dashboard');
      else if (roleKey === 'recruiter') navigate('/recruiter/dashboard');
      else navigate('/student/dashboard');
    } catch (err: any) {
      alert(`Login failed: ${err.message}`);
    } finally {
      setDemoLoginLoading(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-slate-200/80 dark:border-slate-800 bg-gradient-to-b from-white via-indigo-50/20 to-transparent dark:from-slate-950 dark:via-brand-950/10 dark:to-transparent">
        {/* Ambient background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-brand-400/20 to-accent-400/20 blur-3xl -z-10 rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight">
            Build Skills. Predict Readiness.{' '}
            <span className="brand-gradient-text block sm:inline">Unlock Opportunities.</span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            SkillUp matches students to jobs based on skills pulled from their actual resumes — and shows recruiters the evidence behind every score instead of a black-box number.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/20 transition-all hover:scale-[1.02]"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              Sign In to Workspace
            </Link>
          </div>

          {/* Instant 1-Click Demo Sandbox */}
          <div className="mt-12 max-w-3xl mx-auto p-4 sm:p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-lg text-left">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
                  Try it instantly — demo accounts
                </span>
              </div>
              <span className="text-[11px] text-slate-400">Sample data already loaded</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Student Button */}
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('arjun.sharma@skillup.com', 'student123', 'student')}
                disabled={!!demoLoginLoading}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-500 bg-slate-50 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-brand-600">Student Portal</span>
                  <Badge variant="success" size="sm">Candidate</Badge>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Arjun Sharma (Full Stack)</p>
                <span className="text-[10px] text-brand-600 dark:text-brand-400 font-semibold mt-2 inline-block">
                  {demoLoginLoading === 'student' ? 'Signing in...' : 'Open student view →'}
                </span>
              </button>

              {/* Recruiter Button */}
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('recruiter@omegamma.com', 'recruiter123', 'recruiter')}
                disabled={!!demoLoginLoading}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-500 bg-slate-50 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-brand-600">Recruiter Portal</span>
                  <Badge variant="primary" size="sm">Recruiter</Badge>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Mr. Kunal (CloudScale Systems)</p>
                <span className="text-[10px] text-brand-600 dark:text-brand-400 font-semibold mt-2 inline-block">
                  {demoLoginLoading === 'recruiter' ? 'Signing in...' : 'Open recruiter view →'}
                </span>
              </button>

              {/* Admin Button */}
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin@skillup.com', 'admin123', 'admin')}
                disabled={!!demoLoginLoading}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-500 bg-slate-50 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-brand-600">Admin Portal</span>
                  <Badge variant="danger" size="sm">ML Center</Badge>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Model Training & Fairness</p>
                <span className="text-[10px] text-brand-600 dark:text-brand-400 font-semibold mt-2 inline-block">
                  {demoLoginLoading === 'admin' ? 'Signing in...' : 'Open admin view →'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Core Architectural Pillars */}
      <section className="py-16 md:py-24 bg-white dark:bg-slate-900 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-2">
              How it works
            </h2>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
              No black-box scores. Here's what actually happens behind the scenes.
            </p>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Most job platforms hide how candidates get ranked. SkillUp shows the matching formula, lists skill gaps, and explains which features pushed each score up or down.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-brand-300 transition-all">
              <div className="h-12 w-12 rounded-xl bg-brand-100 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-5">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
                Resume parser that runs locally
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                Upload a PDF or Word resume and SkillUp extracts skills, projects, and education on our own backend — nothing is sent to an outside service. Students can review and edit everything before it lands on their profile.
              </p>
              <div className="text-xs font-semibold text-brand-600 dark:text-brand-400 flex items-center space-x-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-1" />
                <span>Separates resume claims from project proof</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-brand-300 transition-all">
              <div className="h-12 w-12 rounded-xl bg-accent-100 dark:bg-accent-950/80 text-accent-600 dark:text-accent-400 flex items-center justify-center mb-5">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
                Skill matching & gap analysis
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                Compares a candidate's skills against what a job actually asks for — required vs. preferred coverage plus text similarity — then turns the gaps into a short list of things worth learning next.
              </p>
              <div className="text-xs font-semibold text-brand-600 dark:text-brand-400 flex items-center space-x-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-1" />
                <span>See the exact formula behind each score</span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-brand-300 transition-all">
              <div className="h-12 w-12 rounded-xl bg-violet-100 dark:bg-violet-950/80 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-5">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
                A scoring model you can inspect
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                Admins can train and version scikit-learn models from the training center. Each prediction comes with SHAP values showing which features helped or hurt, and the model is checked for fairness across groups.
              </p>
              <div className="text-xs font-semibold text-brand-600 dark:text-brand-400 flex items-center space-x-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-1" />
                <span>Fairness checks built in</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Demonstration Postings Showcase */}
      {activeJobs.length > 0 && (
        <section className="py-16 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200/80 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Open roles right now</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Live postings from the demo database</p>
              </div>
              <Link to="/login" className="mt-4 sm:mt-0 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center">
                <span>Explore all vacancies</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {activeJobs.map(job => (
                <div key={job.id} className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">{job.organization}</span>
                      <Badge variant={job.work_mode === 'Remote' ? 'success' : 'neutral'} size="sm">
                        {job.work_mode}
                      </Badge>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">{job.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                      {job.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {job.required_skills?.slice(0, 4).map((s: string) => (
                        <span key={s} className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{job.location}</span>
                    <Link
                      to="/login"
                      className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center"
                    >
                      <span>Express Interest</span>
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Model Status Banner */}
      {activeModel && (
        <section className="py-6 bg-brand-900 text-white border-t border-brand-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="font-semibold">Model in use:</span>
              <span className="text-brand-200">{activeModel.name} ({activeModel.version})</span>
            </div>
            <div className="mt-2 sm:mt-0 flex items-center space-x-4 text-brand-200">
              <span>Test F1-Score: {(activeModel.metrics?.f1 * 100).toFixed(1)}%</span>
              <span>ROC-AUC: {(activeModel.metrics?.roc_auc * 100).toFixed(1)}%</span>
              <Link to="/admin/training" className="text-white underline font-semibold">See model details</Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
