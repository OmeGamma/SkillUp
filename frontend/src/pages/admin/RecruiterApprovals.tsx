import React, { useEffect, useState } from 'react';
import { Users, CheckCircle2, XCircle, Clock, Shield, Building } from 'lucide-react';
import { api } from '../../services/api';
import { Badge } from '../../components/Badge';

export const RecruiterApprovalsPage: React.FC = () => {
  const [recruiters, setRecruiters] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadRecruiters = async () => {
    setLoading(true);
    try {
      const data = await api.getRecruitersList();
      setRecruiters(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecruiters();
  }, []);

  const handleUpdateStatus = async (userId: number, newStatus: 'approved' | 'rejected' | 'pending') => {
    setActionMsg(null);
    try {
      await api.updateRecruiterStatus(userId, newStatus);
      setActionMsg({ type: 'success', text: `Recruiter account marked as ${newStatus}.` });
      loadRecruiters();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'Failed to update recruiter status.' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Recruiter Onboarding & Account Approvals
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Screen and authorize organization recruiter accounts before they are permitted to post vacancies or access candidate pipelines.
        </p>
      </div>

      {actionMsg && (
        <div className={`p-4 rounded-xl flex items-center space-x-2 text-xs ${
          actionMsg.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
            : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
        }`}>
          {actionMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-600" />}
          <span>{actionMsg.text}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-600 border-r-transparent mb-2" />
          <p className="text-xs">Loading recruiter onboarding directory...</p>
        </div>
      ) : recruiters.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
          No recruiter accounts registered.
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Recruiter / Talent Partner</th>
                  <th className="py-3 px-4">Organization & Title</th>
                  <th className="py-3 px-4">Approval Status</th>
                  <th className="py-3 px-4">Registered Date</th>
                  <th className="py-3 px-4 text-right">Administrative Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recruiters.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block text-sm">{r.full_name}</span>
                        <span className="text-[11px] text-slate-500">{r.email}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">{r.organization}</span>
                      <span className="text-[11px] text-slate-500">{r.designation} {r.department && `(${r.department})`}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          r.recruiter_status === 'approved' ? 'success' :
                          r.recruiter_status === 'rejected' ? 'danger' : 'warning'
                        }
                      >
                        {r.recruiter_status?.toUpperCase()}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(r.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-2">
                      {r.recruiter_status !== 'approved' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(r.id, 'approved')}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 transition-colors"
                        >
                          Approve Account
                        </button>
                      )}
                      {r.recruiter_status !== 'rejected' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(r.id, 'rejected')}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-300 transition-colors"
                        >
                          Reject
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
