import React, { useEffect, useState } from 'react';
import {
  Target, CheckCircle2, AlertTriangle,
  BookOpen, Sparkles, Save, RefreshCw, Info
} from 'lucide-react';
import { api } from '../../services/api';
import { Badge } from '../../components/Badge';

export const SkillMatchingPage: React.FC = () => {
  const [roles, setRoles] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('Full Stack Developer');
  const [customMode, setCustomMode] = useState<boolean>(false);
  const [customJob, setCustomJob] = useState({ title: '', description: '', required_skills: '', preferred_skills: '' });
  
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [matchResult, setMatchResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    api.getPredefinedRoles()
      .then(res => {
        setRoles(res);
        if (res.length > 0) {
          handleAnalyzePredefined(res[0].role_name);
        }
      })
      .catch(() => {});
  }, []);

  const handleAnalyzePredefined = async (roleName: string) => {
    setSelectedRole(roleName);
    setAnalyzing(true);
    setError(null);
    setSaveSuccess(null);
    try {
      const res = await api.analyzePredefinedRole(roleName);
      setMatchResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze skill match.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAnalyzeCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customJob.title.trim()) return;
    setAnalyzing(true);
    setError(null);
    setSaveSuccess(null);
    try {
      const reqSkills = customJob.required_skills.split(',').map(s => s.trim()).filter(Boolean);
      const prefSkills = customJob.preferred_skills.split(',').map(s => s.trim()).filter(Boolean);
      const res = await api.analyzeCustomJob({
        title: customJob.title,
        description: customJob.description,
        required_skills: reqSkills,
        preferred_skills: prefSkills
      });
      setMatchResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to evaluate custom job description.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveReport = async () => {
    if (!matchResult) return;
    try {
      const targetName = customMode ? customJob.title : selectedRole;
      await api.createReport({
        report_type: 'skill_gap',
        title: `Skill Gap & Readiness Analysis: ${targetName}`,
        target_role_or_job: targetName,
        overall_score: matchResult.overall_score,
        summary: `Career readiness analysis for ${targetName}. Required skill coverage: ${matchResult.required_coverage}%, Preferred coverage: ${matchResult.preferred_coverage}%, TF-IDF similarity: ${matchResult.text_similarity}%.`,
        methodology: matchResult.methodology?.formula || 'Composite weighted score',
        data: matchResult
      });
      setSaveSuccess('Report successfully saved to your Report History! You can download official PDFs from the Reports workspace.');
    } catch (err: any) {
      setError(err.message || 'Failed to save report.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center space-x-2 text-xs font-semibold text-brand-600 dark:text-brand-400 mb-1">
          <Target className="w-4 h-4 text-brand-600" />
          <span>Skill check</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Match your skills to a role
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Pick a role or paste a job description to see which required skills you already have,
          which ones you're missing, and what to learn next.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Mode Switcher */}
      <div className="flex items-center space-x-3">
        <button
          type="button"
          onClick={() => setCustomMode(false)}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            !customMode
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
          }`}
        >
          Predefined Industry Catalog
        </button>
        <button
          type="button"
          onClick={() => setCustomMode(true)}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            customMode
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
          }`}
        >
          Analyze Custom Job Description
        </button>
      </div>

      {/* Target Selector */}
      {!customMode ? (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Select Benchmark Target Role
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            {roles.map(r => (
              <button
                key={r.role_name}
                type="button"
                onClick={() => handleAnalyzePredefined(r.role_name)}
                className={`p-3 text-left rounded-xl border text-xs transition-all ${
                  selectedRole === r.role_name
                    ? 'border-brand-600 bg-brand-50/50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 font-bold shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>{r.role_name}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <form onSubmit={handleAnalyzeCustom} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Position Title</label>
              <input
                type="text"
                required
                value={customJob.title}
                onChange={e => setCustomJob({ ...customJob, title: e.target.value })}
                placeholder="e.g. Distributed Backend Engineer"
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Required Skills (Comma-separated)</label>
              <input
                type="text"
                required
                value={customJob.required_skills}
                onChange={e => setCustomJob({ ...customJob, required_skills: e.target.value })}
                placeholder="e.g. Python, FastAPI, PostgreSQL, Docker"
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Preferred Skills (Optional)</label>
            <input
              type="text"
              value={customJob.preferred_skills}
              onChange={e => setCustomJob({ ...customJob, preferred_skills: e.target.value })}
              placeholder="e.g. Redis, Kubernetes, CI/CD"
              className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Job Description Text</label>
            <textarea
              rows={3}
              value={customJob.description}
              onChange={e => setCustomJob({ ...customJob, description: e.target.value })}
              placeholder="Paste job posting description to compute TF-IDF cosine similarity against your profile..."
              className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={analyzing}
            className="px-5 py-2 text-xs font-semibold rounded-xl text-white bg-brand-600 hover:bg-brand-700 shadow-sm flex items-center space-x-1.5"
          >
            {analyzing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>Analyze Custom Job Requirements</span>
          </button>
        </form>
      )}

      {/* Results View */}
      {analyzing ? (
        <div className="py-16 text-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-600" />
          <p className="text-xs">Computing TF-IDF cosine similarities and evidence rates...</p>
        </div>
      ) : matchResult && (
        <div className="space-y-6">
          {/* Composite Score Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Composite Compatibility Score
              </span>
              <div className="flex items-baseline space-x-3 mt-1">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                  {matchResult.overall_score}%
                </span>
                <span className="text-xs text-slate-500">
                  {matchResult.overall_score >= 80 ? 'High Competence Match' : matchResult.overall_score >= 60 ? 'Moderate Match' : 'Development Growth Required'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2 max-w-xl leading-relaxed">
                Formula: <code className="text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-[11px]">{matchResult.methodology?.formula}</code>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSaveReport}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-white bg-brand-600 hover:bg-brand-700 shadow-sm flex items-center space-x-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Analysis</span>
              </button>
            </div>
          </div>

          {/* Tri-Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-medium text-slate-400 uppercase">Required Skills Coverage (50%)</span>
              <h4 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{matchResult.required_coverage}%</h4>
              <p className="text-[11px] text-slate-500 mt-1">{matchResult.matched_required?.length} of {matchResult.matched_required?.length + matchResult.missing_required?.length} core skills verified</p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-medium text-slate-400 uppercase">Preferred Advantage Coverage (25%)</span>
              <h4 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{matchResult.preferred_coverage}%</h4>
              <p className="text-[11px] text-slate-500 mt-1">{matchResult.matched_preferred?.length} preferred skills present</p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-medium text-slate-400 uppercase">TF-IDF Resume Similarity (25%)</span>
              <h4 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{matchResult.text_similarity}%</h4>
              <p className="text-[11px] text-slate-500 mt-1">Cosine vector similarity across context</p>
            </div>
          </div>

          {/* 2-Col Skills Comparison Table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Matched Required Skills */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Verified Matched Requirements ({matchResult.matched_required?.length})
                </h3>
              </div>

              {matchResult.matched_required?.length === 0 ? (
                <p className="text-xs text-slate-400 py-3">No core required skills matched yet.</p>
              ) : (
                <div className="space-y-2">
                  {matchResult.matched_required?.map((m: any) => (
                    <div key={m.skill} className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-900 dark:text-white">{m.skill}</span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        m.verified ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {m.evidence_type}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Prioritized Skill Gaps */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Prioritized Skill Gaps ({matchResult.missing_required?.length})
                </h3>
              </div>

              {matchResult.missing_required?.length === 0 ? (
                <p className="text-xs text-emerald-600 py-3">Outstanding! You have documented all core requirements for this role.</p>
              ) : (
                <div className="space-y-2">
                  {matchResult.missing_required?.map((m: any) => (
                    <div key={m.skill} className="p-2.5 rounded-lg border border-amber-100 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white">{m.skill}</span>
                        <p className="text-[10px] text-slate-500">{m.reason}</p>
                      </div>
                      <Badge variant="warning" size="sm">Priority Gap</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Learning Pathway & Recommendations */}
          {matchResult.learning_recommendations?.length > 0 && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-brand-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Targeted Learning Action Plan
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Actionable micro-activities prioritized to close skill gaps for this specific benchmark
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {matchResult.learning_recommendations.map((rec: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-brand-600 dark:text-brand-400">{rec.skill}</span>
                      <Badge variant="neutral" size="sm">{rec.estimated_hours}</Badge>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{rec.action}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transparency Disclaimer Notice */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-start space-x-3 text-xs text-slate-500 dark:text-slate-400">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-brand-600" />
            <p className="leading-relaxed">
              <b>Transparency Notice:</b> SkillUp matching algorithms operate with total explainability. 
              {matchResult.methodology?.transparency_note}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
