import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Columns } from 'lucide-react';
import { api } from '../../services/api';
import { Badge } from '../../components/Badge';

export const CandidateComparisonPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const appIdsStr = searchParams.get('app_ids') || '';
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!appIdsStr) {
      setLoading(false);
      return;
    }
    const ids = appIdsStr.split(',').map(x => parseInt(x.trim())).filter(Boolean);
    if (ids.length > 0) {
      api.compareCandidates(ids)
        .then(res => setCandidates(res.candidates))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [appIdsStr]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-slate-500">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-600 border-r-transparent mb-2" />
        <p className="text-xs">Building side-by-side comparison matrix...</p>
      </div>
    );
  }

  if (candidates.length < 2) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-500 space-y-3">
        <Columns className="w-8 h-8 mx-auto text-slate-400" />
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Side-by-Side Comparison</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Please select at least 2 candidates from the Candidate Rankings table to compare.
        </p>
        <Link to="/recruiter/candidates" className="text-xs text-brand-600 font-semibold underline block">
          Return to Candidate Ranking
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link
        to="/recruiter/candidates"
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Candidate Rankings</span>
      </Link>

      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Side-by-Side Candidate Comparison Matrix
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Objective multi-dimensional comparison across verified requirements, test scores, and model readiness
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {candidates.map(c => (
          <div
            key={c.application_id}
            className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4"
          >
            {/* Header */}
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Applicant #{c.student_id}
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{c.student_name}</h3>
              <div className="flex items-center justify-between mt-2">
                <Badge variant="primary" size="sm">{c.status}</Badge>
                <span className="text-lg font-extrabold text-brand-600 dark:text-brand-400">{c.match_score}%</span>
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                <span className="text-slate-500">Required Skills Coverage</span>
                <span className="font-bold text-slate-900 dark:text-white">{c.required_coverage}%</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                <span className="text-slate-500">Preferred Skills Coverage</span>
                <span className="font-bold text-slate-900 dark:text-white">{c.preferred_coverage}%</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                <span className="text-slate-500">TF-IDF Vector Similarity</span>
                <span className="font-bold text-slate-900 dark:text-white">{c.text_similarity}%</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                <span className="text-slate-500">ML Interview Readiness</span>
                <span className="font-semibold text-brand-600 dark:text-brand-400">
                  {c.readiness_prediction}
                </span>
              </div>

              {c.coding_score !== null && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-slate-500">Pre-Interview Coding Score</span>
                  <span className="font-bold text-slate-900 dark:text-white">{c.coding_score}%</span>
                </div>
              )}

              {c.dsa_score !== null && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-slate-500">DSA Assessment Score</span>
                  <span className="font-bold text-slate-900 dark:text-white">{c.dsa_score}%</span>
                </div>
              )}
            </div>

            {/* Verified Skills */}
            <div className="pt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Verified Skills With Evidence ({c.verified_skills?.length || 0})
              </span>
              <div className="flex flex-wrap gap-1">
                {c.verified_skills?.slice(0, 6).map((s: string) => (
                  <span key={s} className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-medium">
                    {s} ✓
                  </span>
                ))}
              </div>
            </div>

            {/* Project Evidence Count */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>Verified Projects:</span>
              <span className="font-bold text-slate-900 dark:text-white">{c.projects_count}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
