import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Sparkles, Columns, MessageSquare, Shield, FileText
} from 'lucide-react';
import { api } from '../../services/api';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';

export const CandidateRankingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialJobId = searchParams.get('job_id');

  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(initialJobId ? parseInt(initialJobId) : null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('match_score');

  // Checkbox selection for side-by-side comparison
  const [selectedAppIds, setSelectedAppIds] = useState<number[]>([]);

  // Status & Note Update Modal
  const [activeAppForStatus, setActiveAppForStatus] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState<string>('Shortlisted');
  const [recruiterNotes, setRecruiterNotes] = useState<string>('');
  const [notifMessage, setNotifMessage] = useState<string>('');
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);

  // Candidate Inspection & SHAP Explanation Modal
  const [inspectingCandidate, setInspectingCandidate] = useState<any | null>(null);
  const [shapExplanation, setShapExplanation] = useState<any | null>(null);
  const [loadingShap, setLoadingShap] = useState<boolean>(false);

  useEffect(() => {
    api.getRecruiterJobs().then(jList => {
      setJobs(jList);
      if (!selectedJobId && jList.length > 0) {
        setSelectedJobId(jList[0].id);
      }
    });
  }, []);

  const loadCandidates = async () => {
    if (!selectedJobId) return;
    setLoading(true);
    try {
      const data = await api.getJobCandidates(selectedJobId, {
        status_filter: statusFilter || undefined,
        sort_by: sortBy
      });
      setCandidates(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedJobId) {
      loadCandidates();
      setSelectedAppIds([]);
    }
  }, [selectedJobId, statusFilter, sortBy]);

  const toggleSelectApp = (id: number) => {
    setSelectedAppIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleLaunchComparison = () => {
    if (selectedAppIds.length < 2) {
      alert('Please select at least 2 candidates to compare side-by-side.');
      return;
    }
    navigate(`/recruiter/comparison?app_ids=${selectedAppIds.join(',')}`);
  };

  const handleOpenStatusModal = (app: any) => {
    setActiveAppForStatus(app);
    setNewStatus(app.status);
    setRecruiterNotes(app.recruiter_notes || '');
    setNotifMessage(`Your application for this position has been moved to: ${app.status}.`);
  };

  const handleSaveStatus = async () => {
    if (!activeAppForStatus) return;
    setUpdatingStatus(true);
    try {
      await api.updateCandidateStatus(activeAppForStatus.id, {
        status: newStatus,
        recruiter_notes: recruiterNotes,
        notification_message: notifMessage
      });
      setActiveAppForStatus(null);
      loadCandidates();
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleInspectCandidate = async (cand: any) => {
    setInspectingCandidate(cand);
    setShapExplanation(null);
    setLoadingShap(true);
    try {
      const explanation = await api.predictAndExplain({
        candidate_id: cand.student_id,
        job_id: cand.job_id
      });
      setShapExplanation(explanation);
    } catch {
      // No active model or prediction unavailable
    } finally {
      setLoadingShap(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Applicant Matching & Candidate Rankings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Review candidates ordered by transparent requirement coverage, verified project evidence, and local ML predictions.
          </p>
        </div>

        {selectedAppIds.length >= 2 && (
          <button
            onClick={handleLaunchComparison}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/20"
          >
            <Columns className="w-4 h-4" />
            <span>Compare Selected ({selectedAppIds.length}) →</span>
          </button>
        )}
      </div>

      {/* Select Job & Controls Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Job Dropdown */}
        <div className="flex-1 max-w-md">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Select Job Vacancy</label>
          <select
            value={selectedJobId || ''}
            onChange={e => {
              const jid = parseInt(e.target.value);
              setSelectedJobId(jid);
              setSearchParams({ job_id: jid.toString() });
            }}
            className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
          >
            {jobs.map(j => (
              <option key={j.id} value={j.id}>
                {j.title} ({j.application_count} applicants)
              </option>
            ))}
          </select>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Status Filter</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <option value="">All Statuses</option>
              <option value="Interested">Interested</option>
              <option value="Under Review">Under Review</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="Interview Scheduled">Interview Scheduled</option>
              <option value="Interview Completed">Interview Completed</option>
              <option value="Selected">Selected</option>
              <option value="Not Selected">Not Selected</option>
              <option value="Withdrawn">Withdrawn</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Sort Metric</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <option value="match_score">Compatibility Score (High to Low)</option>
              <option value="readiness">Interview Readiness (ML Probability)</option>
              <option value="applied_at">Application Date (Newest First)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Candidate Table */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-600 border-r-transparent mb-2" />
          <p className="text-xs">Evaluating candidate ranking matrix...</p>
        </div>
      ) : candidates.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
          No candidates found for this position under selected filter.
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 w-10 text-center">
                    <span className="sr-only">Select</span>
                  </th>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Match Score</th>
                  <th className="py-3 px-4">Required Coverage</th>
                  <th className="py-3 px-4">ML Readiness Advisory</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {candidates.map(cand => {
                  const isSelected = selectedAppIds.includes(cand.id);
                  return (
                    <tr
                      key={cand.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                        isSelected ? 'bg-brand-50/30 dark:bg-brand-950/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectApp(cand.id)}
                          className="h-4 w-4 text-brand-600 rounded cursor-pointer"
                        />
                      </td>

                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block text-sm">{cand.student_name}</span>
                          <span className="text-[11px] text-slate-500 block">{cand.student_headline}</span>
                          <span className="text-[10px] text-slate-400">{cand.location} • {cand.student_projects?.length || 0} verified projects</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-baseline space-x-1">
                          <span className="text-base font-extrabold text-brand-600 dark:text-brand-400">{cand.match_score}%</span>
                          <span className="text-[10px] text-slate-400">composite</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block">TF-IDF: {cand.text_similarity}%</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="w-24 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-1">
                          <div
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${cand.required_coverage}%` }}
                          />
                        </div>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{cand.required_coverage}%</span>
                      </td>

                      <td className="py-3.5 px-4">
                        {cand.readiness_prediction ? (
                          <div>
                            <span className={`font-semibold ${
                              cand.readiness_prediction === 'High Readiness' ? 'text-emerald-600 dark:text-emerald-400' :
                              cand.readiness_prediction === 'Moderate Readiness' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'
                            }`}>
                              {cand.readiness_prediction}
                            </span>
                            {cand.readiness_probability && (
                              <span className="text-[10px] text-slate-400 block">
                                Pass Prob: {cand.readiness_probability}% ({cand.model_version_used})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Prediction Model Unavailable</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            cand.status === 'Selected' ? 'success' :
                            cand.status === 'Shortlisted' ? 'primary' :
                            cand.status === 'Interview Scheduled' ? 'info' :
                            cand.status === 'Not Selected' ? 'danger' : 'warning'
                          }
                          size="sm"
                        >
                          {cand.status}
                        </Badge>
                        {cand.recruiter_notes && (
                          <span className="text-[10px] text-brand-600 dark:text-brand-400 block mt-1">
                            • Confidential Notes Saved
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                        {cand.resume_report_id && (
                          <a
                            href={api.getReportDownloadUrl(cand.resume_report_id)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 transition-colors"
                            title="Download Candidate CV & Intelligence Report PDF"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>CV Report</span>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleInspectCandidate(cand)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
                        >
                          Profile & SHAP
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenStatusModal(cand)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:text-brand-300"
                        >
                          Update Status
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Status & Confidential Notes Update Modal */}
      {activeAppForStatus && (
        <Modal
          isOpen={!!activeAppForStatus}
          onClose={() => setActiveAppForStatus(null)}
          title={`Update Status: ${activeAppForStatus.student_name}`}
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold mb-1">Recruitment Pipeline Status</label>
              <select
                value={newStatus}
                onChange={e => {
                  const s = e.target.value;
                  setNewStatus(s);
                  setNotifMessage(`Your application for this position has been moved to: ${s}.`);
                }}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="Interested">Interested</option>
                <option value="Under Review">Under Review</option>
                <option value="Shortlisted">Shortlisted</option>
                <option value="Interview Scheduled">Interview Scheduled</option>
                <option value="Interview Completed">Interview Completed</option>
                <option value="Selected">Selected</option>
                <option value="Not Selected">Not Selected</option>
                <option value="Withdrawn">Withdrawn</option>
              </select>
            </div>

            <div>
              <div className="flex items-center space-x-1.5 font-semibold mb-1 text-slate-700 dark:text-slate-200">
                <Shield className="w-3.5 h-3.5 text-brand-600" />
                <span>Confidential Recruiter Notes (Strictly Hidden From Student)</span>
              </div>
              <textarea
                rows={3}
                value={recruiterNotes}
                onChange={e => setRecruiterNotes(e.target.value)}
                placeholder="Internal interview notes, technical feedback, strengths, and areas to probe..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <div className="flex items-center space-x-1.5 font-semibold mb-1 text-slate-700 dark:text-slate-200">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>Candidate In-App Notification Message</span>
              </div>
              <textarea
                rows={2}
                value={notifMessage}
                onChange={e => setNotifMessage(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
              <button
                onClick={() => setActiveAppForStatus(null)}
                className="px-4 py-2 text-slate-600 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStatus}
                disabled={updatingStatus}
                className="px-5 py-2 rounded-xl font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-60"
              >
                {updatingStatus ? 'Updating...' : 'Save Status & Notify'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Candidate Profile & Local SHAP Explainability Modal */}
      {inspectingCandidate && (
        <Modal
          isOpen={!!inspectingCandidate}
          onClose={() => setInspectingCandidate(null)}
          title={`Candidate Profile: ${inspectingCandidate.student_name}`}
          maxWidth="2xl"
        >
          <div className="space-y-5 text-xs">
            {/* Top Info */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{inspectingCandidate.student_name}</h4>
                <p className="text-slate-500">{inspectingCandidate.student_headline} • {inspectingCandidate.student_email}</p>
                <p className="text-slate-400 mt-1">Location: {inspectingCandidate.location} • Target: {inspectingCandidate.target_role}</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-extrabold text-brand-600 dark:text-brand-400 block">{inspectingCandidate.match_score}%</span>
                <span className="text-[10px] text-slate-400 uppercase">Composite Match</span>
              </div>
            </div>

            {/* CV Dossier & Report Access for Interviewer */}
            <div className="p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    Verified CV Intelligence & Interview Dossier
                  </h4>
                </div>
                {inspectingCandidate.resume_report_id && (
                  <a
                    href={api.getReportDownloadUrl(inspectingCandidate.resume_report_id)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Download Full Dossier PDF</span>
                  </a>
                )}
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Parsed from candidate's verified CV directly into MongoDB with zero local file retention.
                {inspectingCandidate.resume_filename && ` (Source: ${inspectingCandidate.resume_filename})`}
              </p>
            </div>

            {/* Assessment Scores */}
            {inspectingCandidate.assessment_scores && Object.keys(inspectingCandidate.assessment_scores).length > 0 && (
              <div>
                <h4 className="font-bold uppercase tracking-wider text-slate-400 mb-2">Technical Assessment Scores</h4>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {Object.entries(inspectingCandidate.assessment_scores).map(([k, v]) => (
                    <div key={k} className="p-2 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                      <span className="text-[10px] text-slate-400 uppercase block">{k.replace('_score', '')}</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{v as any}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SHAP Local Feature Attributions */}
            <div className="p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-brand-600" />
                <h4 className="font-bold text-slate-900 dark:text-white">
                  Local SHAP Explainability (Feature Attributions)
                </h4>
              </div>

              {loadingShap ? (
                <p className="text-slate-400 italic">Calculating local Shapley values...</p>
              ) : shapExplanation ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span>Advisory Readiness Prediction:</span>
                    <Badge variant="primary">{shapExplanation.readiness_label} ({shapExplanation.pass_probability}%)</Badge>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Feature Contribution Breakdown:</span>
                    {shapExplanation.feature_contributions?.map((fc: any) => (
                      <div key={fc.feature} className="flex items-center justify-between p-2 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{fc.feature} (Val: {fc.feature_value})</span>
                        <span className={`font-mono text-xs font-bold ${fc.shap_value > 0 ? 'text-emerald-600' : fc.shap_value < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                          {fc.shap_value > 0 ? `+${fc.shap_value}` : fc.shap_value}
                        </span>
                      </div>
                    ))}
                  </div>

                  <p className="text-[10px] text-slate-500 italic leading-relaxed pt-1">
                    Note: SHAP attributions describe relative mathematical feature influence on model inference, not definitive causal proof. Decisions must be human-reviewed.
                  </p>
                </div>
              ) : (
                <p className="text-slate-400 italic">No evaluated machine learning model is currently active.</p>
              )}
            </div>

            {/* Skills & Projects Details */}
            <div>
              <h4 className="font-bold uppercase tracking-wider text-slate-400 mb-1.5">Documented Skills</h4>
              <div className="flex flex-wrap gap-1">
                {inspectingCandidate.student_skills?.map((s: any) => (
                  <span key={s.name} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300">
                    {s.name} {s.verified && '✓'}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-bold uppercase tracking-wider text-slate-400 mb-1.5">Verified Projects ({inspectingCandidate.student_projects?.length || 0})</h4>
              <div className="space-y-2">
                {inspectingCandidate.student_projects?.map((p: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                    <span className="font-bold text-slate-900 dark:text-white block">{p.title}</span>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">{p.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
