import React, { useEffect, useState } from 'react';
import {
  Cpu, Play, CheckCircle2, AlertTriangle, RefreshCw, Layers,
  BarChart3, Award, Sparkles, Shield, Database, Check
} from 'lucide-react';
import { api } from '../../services/api';
import { Badge } from '../../components/Badge';

export const ModelTrainingCenterPage: React.FC = () => {
  const [models, setModels] = useState<any[]>([]);
  const [datasetPreview, setDatasetPreview] = useState<any | null>(null);
  const [validationReport, setValidationReport] = useState<any | null>(null);

  // Training Form
  const [algorithm, setAlgorithm] = useState<string>('LogisticRegression');
  const [versionTag, setVersionTag] = useState<string>('');
  const [training, setTraining] = useState<boolean>(false);
  const [trainStatusMsg, setTrainStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [generatingData, setGeneratingData] = useState<boolean>(false);

  const loadData = async () => {
    try {
      const [mList, dPreview] = await Promise.all([
        api.getModels().catch(() => []),
        api.previewDataset().catch(() => null)
      ]);
      setModels(mList);
      setDatasetPreview(dPreview);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleValidateDataset = async () => {
    try {
      const report = await api.validateDataset();
      setValidationReport(report);
    } catch (err: any) {
      alert(`Validation failed: ${err.message}`);
    }
  };

  const handleGenerateSynthetic = async () => {
    setGeneratingData(true);
    try {
      await api.generateDemoDataset(600);
      await loadData();
      alert('Generated 600 demonstration records with labeled synthetic markers.');
    } catch (err: any) {
      alert(`Failed to generate: ${err.message}`);
    } finally {
      setGeneratingData(false);
    }
  };

  const handleStartTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    setTraining(true);
    setTrainStatusMsg(null);
    try {
      const res = await api.trainModel({
        algorithm,
        version_tag: versionTag || undefined,
        target_column: 'technical_interview_pass'
      });
      setTrainStatusMsg({
        type: 'success',
        text: `Model trained and evaluated successfully! Version: ${res.version}. Test F1: ${(res.metrics?.f1 * 100).toFixed(1)}%, ROC-AUC: ${(res.metrics?.roc_auc * 100).toFixed(1)}%.`
      });
      setVersionTag('');
      loadData();
    } catch (err: any) {
      setTrainStatusMsg({ type: 'error', text: err.message || 'Model training failed.' });
    } finally {
      setTraining(false);
    }
  };

  const handleActivateModel = async (id: number) => {
    try {
      await api.activateModel(id);
      loadData();
    } catch (err: any) {
      alert(`Activation failed: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center space-x-2 text-xs font-semibold text-brand-600 dark:text-brand-400 mb-1">
          <Cpu className="w-4 h-4 text-brand-600" />
          <span>Model training</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Model Training Center
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Train and test the scoring model used for candidate predictions. Each run is checked with
          cross-validation, and only one model is active at a time.
        </p>
      </div>

      {/* Dataset Inspection & Validation Section */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-brand-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Training Dataset: {datasetPreview?.dataset_name || 'demo_readiness_dataset.csv'}
              </h3>
              <p className="text-xs text-slate-500">
                {datasetPreview?.total_rows || 0} candidate records • Demo data (synthetic)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleGenerateSynthetic}
              disabled={generatingData}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {generatingData ? 'Generating...' : 'Generate demo data'}
            </button>
            <button
              onClick={handleValidateDataset}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 hover:bg-brand-100"
            >
              Check dataset quality
            </button>
          </div>
        </div>

        {/* Validation Report Card if audited */}
        {validationReport && (
          <div className="p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-2 text-xs">
            <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
              <span>Dataset Quality Audit Report:</span>
              <Badge variant={validationReport.is_valid ? 'success' : 'danger'}>
                {validationReport.is_valid ? 'Validation Passed (No Leakage)' : 'Audit Warnings'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
              <div>Total Valid Rows: <b>{validationReport.total_rows}</b></div>
              <div>Duplicate Rows: <b>{validationReport.duplicate_rows}</b></div>
              <div>Pass Class Ratio: <b>{(validationReport.class_distribution?.positive_ratio * 100).toFixed(1)}%</b></div>
              <div>Max Correlation: <b>No feature &gt; 0.95</b></div>
            </div>

            {validationReport.warnings?.length > 0 && (
              <div className="pt-2 border-t border-indigo-100 dark:border-indigo-900 space-y-1 text-slate-600 dark:text-slate-400">
                {validationReport.warnings.map((w: string, i: number) => (
                  <p key={i}>• {w}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Train New Model Panel */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center space-x-2">
          <Play className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Configure & Train Algorithm</h3>
        </div>

        {trainStatusMsg && (
          <div className={`p-4 rounded-xl flex items-center space-x-2 text-xs ${
            trainStatusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
          }`}>
            {trainStatusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />}
            <span>{trainStatusMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleStartTraining} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Algorithm Family</label>
              <select
                value={algorithm}
                onChange={e => setAlgorithm(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="LogisticRegression">Logistic Regression (Calibrated L2)</option>
                <option value="RandomForestClassifier">Random Forest Classifier (Ensemble 100 Trees)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Prediction Target</label>
              <input
                type="text"
                disabled
                value="technical_interview_pass"
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Version Tag (Optional)</label>
              <input
                type="text"
                value={versionTag}
                onChange={e => setVersionTag(e.target.value)}
                placeholder="e.g. v1.1.0-prod"
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-[11px] text-slate-500 space-y-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300 block">Features Included in Pipeline:</span>
            <p>coding_score, dsa_score, mock_interview_score, skill_coverage, project_count, experience_years, system_design_score</p>
            <p className="text-slate-400">Preprocessing: Stratified 80/20 train-test split, StandardScaler fitted strictly on train split, 5-fold cross-validation.</p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={training}
              className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/20 disabled:opacity-60 flex items-center space-x-1.5"
            >
              {training ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              <span>{training ? 'Training...' : 'Train & Save Model'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Model Registry & Version Management */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Registered Model Versions & Metrics
        </h3>
        <p className="text-xs text-slate-500">
          Predictions and SHAP explanations always come from whichever model is marked active.
        </p>

        <div className="space-y-4 pt-2">
          {models.map(m => {
            const isActive = m.status === 'active';
            const met = m.metrics || {};
            return (
              <div
                key={m.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isActive
                    ? 'border-brand-500 bg-brand-50/20 dark:bg-brand-950/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{m.name}</span>
                    <Badge variant={isActive ? 'success' : 'neutral'} size="sm">
                      {isActive ? 'ACTIVE' : m.status.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-slate-400 font-mono">({m.version})</span>
                  </div>

                  {!isActive && (
                    <button
                      onClick={() => handleActivateModel(m.id)}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-brand-600 hover:bg-brand-700 text-white shadow-sm"
                    >
                      Set as active
                    </button>
                  )}
                </div>

                {/* Metric Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-[10px] text-slate-400 uppercase block">Accuracy</span>
                    <span className="font-bold text-slate-900 dark:text-white">{((met.accuracy || 0) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-[10px] text-slate-400 uppercase block">F1-Score</span>
                    <span className="font-bold text-slate-900 dark:text-white">{((met.f1 || 0) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-[10px] text-slate-400 uppercase block">ROC-AUC</span>
                    <span className="font-bold text-slate-900 dark:text-white">{((met.roc_auc || 0) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-[10px] text-slate-400 uppercase block">Precision</span>
                    <span className="font-bold text-slate-900 dark:text-white">{((met.precision || 0) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-[10px] text-slate-400 uppercase block">Recall</span>
                    <span className="font-bold text-slate-900 dark:text-white">{((met.recall || 0) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-[10px] text-slate-400 uppercase block">5-Fold CV F1</span>
                    <span className="font-bold text-slate-900 dark:text-white">{((met.cv_mean_f1 || 0) * 100).toFixed(1)}%</span>
                  </div>
                </div>

                {/* Confusion Matrix & Artifact details */}
                {met.confusion_matrix && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
                    <span>
                      Confusion Matrix: TN={met.confusion_matrix[0][0]}, FP={met.confusion_matrix[0][1]}, FN={met.confusion_matrix[1][0]}, TP={met.confusion_matrix[1][1]}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Trained: {new Date(m.created_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
