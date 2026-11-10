import React, { useEffect, useState } from 'react';
import {
  Scale, Shield, AlertTriangle, CheckCircle2, Play, RefreshCw,
  Info, BarChart3, HelpCircle, ArrowRight
} from 'lucide-react';
import { api } from '../../services/api';
import { Badge } from '../../components/Badge';

export const FairnessAuditPage: React.FC = () => {
  const [models, setModels] = useState<any[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const [groupAttribute, setGroupAttribute] = useState<string>('education_tier');
  const [auditHistory, setAuditHistory] = useState<any[]>([]);
  const [currentResult, setCurrentResult] = useState<any | null>(null);
  const [running, setRunning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getModels().then(mList => {
      setModels(mList);
      if (mList.length > 0) {
        setSelectedModelId(mList[0].id);
      }
    });

    api.getFairnessHistory().then(h => setAuditHistory(h));
  }, []);

  const handleRunAudit = async () => {
    if (!selectedModelId) return;
    setRunning(true);
    setError(null);
    try {
      const res = await api.runFairnessAudit({
        model_id: selectedModelId,
        group_attribute: groupAttribute
      });
      setCurrentResult(res.results);
      // Reload history
      api.getFairnessHistory().then(h => setAuditHistory(h));
    } catch (err: any) {
      setError(err.message || 'Fairness audit execution failed.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center space-x-2 text-xs font-semibold text-violet-600 dark:text-violet-400 mb-1">
          <Scale className="w-4 h-4 text-violet-600" />
          <span>Bias checks for trained models</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Fairness Audit
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Checks whether a model treats different groups differently — comparing selection rates,
          true positive rates, and the common 80% (four-fifths) rule of thumb.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Governance Notice */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-start space-x-3 text-xs text-slate-600 dark:text-slate-300">
        <Shield className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1 leading-relaxed">
          <span className="font-bold text-slate-900 dark:text-white">Note:</span>
          <p>
            Sensitive attributes are used only here, for checking whether the model is fair. They are never fed into the model as inputs when scoring candidates.
          </p>
        </div>
      </div>

      {/* Audit Configuration Bar */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Run an audit</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Target Model Version</label>
            <select
              value={selectedModelId || ''}
              onChange={e => setSelectedModelId(parseInt(e.target.value))}
              className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              {models.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.version}) {m.status === 'active' ? '[ACTIVE]' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Group to compare</label>
            <select
              value={groupAttribute}
              onChange={e => setGroupAttribute(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <option value="education_tier">Education Tier (Tier-1, Tier-2, Tier-3)</option>
              <option value="gender_audit">Demographic Proxy Audit (Female, Male, Non-Binary)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleRunAudit}
              disabled={running || !selectedModelId}
              className="w-full py-2.5 rounded-xl text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 shadow-sm flex items-center justify-center space-x-1.5 disabled:opacity-60"
            >
              {running ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              <span>{running ? 'Running...' : 'Run audit'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Audit Output Result */}
      {currentResult && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Results</span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Attribute: {currentResult.group_attribute} ({currentResult.total_audited_samples} samples)
              </h3>
            </div>

            <div>
              <Badge variant={currentResult.passed_four_fifths_benchmark ? 'success' : 'danger'} size="md">
                {currentResult.passed_four_fifths_benchmark ? 'Passes 80% rule' : 'Possible bias (< 0.80)'}
              </Badge>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <span className="text-slate-400 uppercase text-[10px] block">Disparate Impact Ratio</span>
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white block mt-1">
                {currentResult.disparate_impact_ratio}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">
                {currentResult.disparate_impact_ratio >= 0.80 ? 'Complies with 4/5ths standard' : 'Potential adverse selection impact'}
              </span>
            </div>

            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <span className="text-slate-400 uppercase text-[10px] block">Equal Opportunity Difference</span>
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white block mt-1">
                {currentResult.equal_opportunity_difference}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Max disparity in True Positive Rates (TPR)
              </span>
            </div>

            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <span className="text-slate-400 uppercase text-[10px] block">Reference Groups</span>
              <span className="font-semibold text-slate-900 dark:text-white block mt-1">
                Privileged: {currentResult.privileged_group_ref}
              </span>
              <span className="font-semibold text-slate-600 dark:text-slate-400 block">
                Unprivileged: {currentResult.unprivileged_group_ref}
              </span>
            </div>
          </div>

          {/* Group Breakdown Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Results by group</h4>
            <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Subgroup</th>
                    <th className="py-2.5 px-3">Sample Size</th>
                    <th className="py-2.5 px-3">Selection Rate</th>
                    <th className="py-2.5 px-3">True Positive Rate (TPR)</th>
                    <th className="py-2.5 px-3">False Positive Rate (FPR)</th>
                    <th className="py-2.5 px-3">Precision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {Object.entries(currentResult.group_metrics || {}).map(([gName, gStat]: any) => (
                    <tr key={gName}>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{gName}</td>
                      <td className="py-2.5 px-3">{gStat.sample_size}</td>
                      <td className="py-2.5 px-3 font-semibold">{(gStat.selection_rate * 100).toFixed(1)}%</td>
                      <td className="py-2.5 px-3 text-emerald-600 font-semibold">{(gStat.true_positive_rate * 100).toFixed(1)}%</td>
                      <td className="py-2.5 px-3 text-rose-500">{(gStat.false_positive_rate * 100).toFixed(1)}%</td>
                      <td className="py-2.5 px-3">{(gStat.precision * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Warnings and Statistical Uncertainty */}
          {currentResult.warnings?.length > 0 && (
            <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 text-xs text-amber-800 dark:text-amber-300 space-y-1">
              <span className="font-bold block">Warnings:</span>
              {currentResult.warnings.map((w: string, i: number) => (
                <p key={i}>• {w}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Audit History Log */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Past audits
        </h3>
        <p className="text-xs text-slate-500">
          Every fairness check that's been run, across all model versions.
        </p>

        {auditHistory.length === 0 ? (
          <p className="text-xs text-slate-400 py-3">No audits recorded yet.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {auditHistory.map(a => (
              <div key={a.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">{a.model_name} ({a.model_version})</span>
                  <p className="text-slate-500">Audited Attribute: {a.group_attribute} • {new Date(a.created_at).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    Disparate Ratio: {a.metrics?.disparate_impact_ratio}
                  </span>
                  <Badge variant={a.metrics?.passed_four_fifths_benchmark ? 'success' : 'warning'} size="sm">
                    {a.metrics?.passed_four_fifths_benchmark ? 'Passed' : 'Review'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
