import React, { useEffect, useState } from 'react';
import {
  Download, Calendar,
  Columns
} from 'lucide-react';
import { api } from '../../services/api';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';

export const StudentReportsPage: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  // Comparison State
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [report1Id, setReport1Id] = useState<number | null>(null);
  const [report2Id, setReport2Id] = useState<number | null>(null);
  const [comparisonResult, setComparisonResult] = useState<any | null>(null);
  const [comparing, setComparing] = useState(false);

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await api.getReports();
      setReports(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleRunComparison = async () => {
    if (!report1Id || !report2Id) return;
    setComparing(true);
    try {
      const res = await api.compareAnalyses(report1Id, report2Id);
      setComparisonResult(res);
    } catch (err: any) {
      alert(`Comparison failed: ${err.message}`);
    } finally {
      setComparing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Reports & progress
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            View your skill evaluations, download PDF summaries, and see how your scores have changed over time.
          </p>
        </div>

        {reports.length >= 2 && (
          <button
            onClick={() => {
              setReport1Id(reports[reports.length - 1].id);
              setReport2Id(reports[0].id);
              setShowCompareModal(true);
            }}
            className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 hover:bg-brand-100 transition-colors"
          >
            <Columns className="w-4 h-4" />
            <span>Compare two reports</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-600 border-r-transparent mb-2" />
          <p className="text-xs">Loading report repository...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
          No reports saved yet. Run a skill analysis or gap evaluation to generate persistent reports.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reports.map(rep => (
            <div
              key={rep.id}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="primary" size="sm">{rep.report_type.replace('_', ' ').toUpperCase()}</Badge>
                  <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(rep.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white">{rep.title}</h3>
                <p className="text-xs text-brand-600 dark:text-brand-400 font-semibold mt-0.5">
                  Target: {rep.target_role_or_job}
                </p>

                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                  {rep.summary}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-[10px] text-slate-400 uppercase block">Overall</span>
                    <span className="font-bold text-slate-900 dark:text-white">{rep.overall_score}%</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-[10px] text-slate-400 uppercase block">Required</span>
                    <span className="font-bold text-slate-900 dark:text-white">{rep.data?.required_coverage || 0}%</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-[10px] text-slate-400 uppercase block">Similarity</span>
                    <span className="font-bold text-slate-900 dark:text-white">{rep.data?.text_similarity || 0}%</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedReport(rep)}
                  className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900"
                >
                  View Full Detail
                </button>

                <a
                  href={api.getReportDownloadUrl(rep.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 hover:bg-brand-100 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download ReportLab PDF</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report Detail Modal */}
      {selectedReport && (
        <Modal
          isOpen={!!selectedReport}
          onClose={() => setSelectedReport(null)}
          title={selectedReport.title}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Target Position</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">{selectedReport.target_role_or_job}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px] uppercase">Overall Score</span>
                <span className="font-extrabold text-brand-600 dark:text-brand-400 text-lg">{selectedReport.overall_score}%</span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-1">Executive Summary</h4>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{selectedReport.summary}</p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-1">Methodology & Formula</h4>
              <p className="text-slate-500 font-mono text-[11px] bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">{selectedReport.methodology}</p>
            </div>

            {selectedReport.data?.skills && Array.isArray(selectedReport.data.skills) && (
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1.5">Extracted & Verified Skills ({selectedReport.data.skills.length})</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedReport.data.skills.map((s: any) => (
                    <span key={s.name || s} className="px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-950 text-brand-800 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                      {s.name || s} {s.verified && '✓'}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedReport.data?.matched_required && (
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1.5">Matched Core Competencies</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedReport.data.matched_required.map((m: any) => (
                    <span key={m.skill} className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {m.skill} ({m.evidence_type})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedReport.data?.missing_required && (
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1.5">Target Skill Gaps</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedReport.data.missing_required.map((m: any) => (
                    <span key={m.skill} className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      {m.skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <a
                href={api.getReportDownloadUrl(selectedReport.id)}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 text-xs font-semibold rounded-xl text-white bg-brand-600 hover:bg-brand-700 flex items-center space-x-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Export ReportLab PDF</span>
              </a>
            </div>
          </div>
        </Modal>
      )}

      {/* Comparison Modal */}
      <Modal
        isOpen={showCompareModal}
        onClose={() => {
          setShowCompareModal(false);
          setComparisonResult(null);
        }}
        title="Side-by-Side Progression Analysis"
        maxWidth="2xl"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-500">
            Compare two historical evaluations to calculate quantifiable skill growth and metric shifts.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Baseline Report (Earlier)</label>
              <select
                value={report1Id || ''}
                onChange={e => setReport1Id(parseInt(e.target.value))}
                className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                {reports.map(r => (
                  <option key={r.id} value={r.id}>{r.title} ({new Date(r.created_at).toLocaleDateString()})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Target Report (Recent)</label>
              <select
                value={report2Id || ''}
                onChange={e => setReport2Id(parseInt(e.target.value))}
                className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                {reports.map(r => (
                  <option key={r.id} value={r.id}>{r.title} ({new Date(r.created_at).toLocaleDateString()})</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleRunComparison}
            disabled={comparing}
            className="w-full py-2.5 rounded-xl font-semibold text-white bg-brand-600 hover:bg-brand-700"
          >
            {comparing ? 'Calculating Delta...' : 'Compute Competence Delta'}
          </button>

          {comparisonResult && (
            <div className="mt-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="font-bold">Score Progression Delta:</span>
                <span className={`text-base font-extrabold ${comparisonResult.score_delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {comparisonResult.score_delta >= 0 ? `+${comparisonResult.score_delta}` : comparisonResult.score_delta}%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase">Baseline ({new Date(comparisonResult.baseline.date).toLocaleDateString()})</span>
                  <span className="text-xl font-bold block mt-1">{comparisonResult.baseline.overall_score}%</span>
                  <span className="text-[10px] text-slate-500">Req: {comparisonResult.baseline.required_coverage}%</span>
                </div>
                <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase">Comparison ({new Date(comparisonResult.comparison.date).toLocaleDateString()})</span>
                  <span className="text-xl font-bold block mt-1">{comparisonResult.comparison.overall_score}%</span>
                  <span className="text-[10px] text-slate-500">Req: {comparisonResult.comparison.required_coverage}%</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                {comparisonResult.progression_summary}
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
