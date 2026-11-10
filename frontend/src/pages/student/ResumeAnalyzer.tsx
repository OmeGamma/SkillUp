import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, FileText, CheckCircle2, AlertCircle, ArrowRight,
  Sparkles, Shield, Trash2, Edit3, Plus, RefreshCw, Eye
} from 'lucide-react';
import { api } from '../../services/api';
import { Badge } from '../../components/Badge';

export const ResumeAnalyzerPage: React.FC = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [extractionResult, setExtractionResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'review' | 'raw'>('review');
  const [committing, setCommitting] = useState<boolean>(false);
  const [commitSuccess, setCommitSuccess] = useState<boolean>(false);

  // Editable extraction states
  const [editableSkills, setEditableSkills] = useState<any[]>([]);
  const [editableProjects, setEditableProjects] = useState<any[]>([]);
  const [editableEducation, setEditableEducation] = useState<any[]>([]);
  const [newSkillInput, setNewSkillInput] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      const ext = selected.name.toLowerCase();
      if (!ext.endsWith('.pdf') && !ext.endsWith('.docx')) {
        setError('Only .pdf and .docx documents are supported for local parsing.');
        setFile(null);
        return;
      }
      setFile(selected);
      setError(null);
      setExtractionResult(null);
      setCommitSuccess(false);
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const res = await api.uploadResume(file);
      setExtractionResult(res.extracted_data);
      setEditableSkills(res.extracted_data.skills || []);
      setEditableProjects(res.extracted_data.projects || []);
      setEditableEducation(res.extracted_data.education || []);
    } catch (err: any) {
      setError(err.message || 'Failed to process document locally.');
    } finally {
      setUploading(false);
    }
  };

  const handleAddCustomSkill = () => {
    if (!newSkillInput.trim()) return;
    setEditableSkills(prev => [
      ...prev,
      {
        name: newSkillInput.trim(),
        category: 'Technical',
        source: 'self',
        verified: false,
        level: 'intermediate'
      }
    ]);
    setNewSkillInput('');
  };

  const handleRemoveSkill = (index: number) => {
    setEditableSkills(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleConfirmAndCommit = async () => {
    setCommitting(true);
    setError(null);
    try {
      await api.confirmExtraction({
        skills: editableSkills,
        projects: editableProjects,
        education: editableEducation
      });
      setCommitSuccess(true);
      setTimeout(() => {
        navigate('/student/profile');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to commit extracted information.');
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center space-x-2 text-xs font-semibold text-brand-600 dark:text-brand-400 mb-1">
          <Shield className="w-4 h-4 text-emerald-500" />
          <span>Resume upload</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Resume analyzer
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Upload a PDF or Word resume. Skills, projects, and education are extracted and saved to your profile for recruiters to review.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start space-x-2.5 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {commitSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center space-x-2.5 text-xs text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Saved to your profile and reports. Redirecting...</span>
        </div>
      )}

      {/* Upload Box */}
      {!extractionResult && (
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-800 text-center space-y-4 hover:border-brand-500 transition-colors">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 shadow-sm">
            <Upload className="w-7 h-7" />
          </div>

          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Select Resume Document</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Supports standard <b>PDF</b> or <b>DOCX</b> files up to 10MB.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <label className="cursor-pointer px-4 py-2.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              <span>{file ? file.name : 'Choose File from Computer'}</span>
              <input
                type="file"
                accept=".pdf,.docx,.doc"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {file && (
              <button
                type="button"
                onClick={handleUploadAndAnalyze}
                disabled={uploading}
                className="px-6 py-2.5 text-xs font-semibold rounded-xl text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/20 disabled:opacity-60 transition-all flex items-center space-x-1.5"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Extracting Entities Locally...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Analyze Document Locally</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 max-w-lg mx-auto flex items-center justify-center space-x-4 text-[11px] text-slate-400">
            <span>✓ No data sent to third-party endpoints</span>
            <span>•</span>
            <span>✓ Zero Cloud LLM inference</span>
          </div>
        </div>
      )}

      {/* Review & Correction Stage */}
      {extractionResult && (
        <div className="space-y-6">
          {/* Top Bar */}
          <div className="p-4 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">Document Analyzed Successfully</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                Review and modify extracted attributes below. Click "Verify & Commit to Profile" to save.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setExtractionResult(null);
                  setFile(null);
                }}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900"
              >
                Upload Different File
              </button>
              <button
                onClick={handleConfirmAndCommit}
                disabled={committing}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm disabled:opacity-60 flex items-center space-x-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{committing ? 'Saving...' : 'Verify & Commit to Profile'}</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('review')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'review'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Extracted Entities ({editableSkills.length} Skills, {editableProjects.length} Projects)
            </button>
            <button
              onClick={() => setActiveTab('raw')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'raw'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Raw Document Text
            </button>
          </div>

          {activeTab === 'review' ? (
            <div className="space-y-6">
              {/* Skills Extraction Box */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Identified Skills & Technologies</h3>
                    <p className="text-xs text-slate-500">Skills backed by project text are marked as verified evidence</p>
                  </div>
                  {/* Add manual skill */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newSkillInput}
                      onChange={e => setNewSkillInput(e.target.value)}
                      placeholder="Add missing skill..."
                      className="px-3 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      onKeyDown={e => e.key === 'Enter' && handleAddCustomSkill()}
                    />
                    <button
                      onClick={handleAddCustomSkill}
                      className="p-1.5 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {editableSkills.map((s, idx) => {
                    const isEvidence = s.source === 'project' || s.verified;
                    return (
                      <div
                        key={`${s.name}-${idx}`}
                        className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs ${
                          isEvidence
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                            : 'bg-brand-50 text-brand-800 border-brand-200 dark:bg-brand-950/40 dark:text-brand-300 dark:border-brand-800'
                        }`}
                      >
                        <span className="font-semibold">{s.name}</span>
                        <span className="text-[10px] opacity-75">
                          ({isEvidence ? 'Project Evidence' : 'Resume Mention'})
                        </span>
                        <button
                          onClick={() => handleRemoveSkill(idx)}
                          className="text-slate-400 hover:text-rose-600 ml-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Projects Extraction Box */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Extracted Projects</h3>
                {editableProjects.length === 0 ? (
                  <p className="text-xs text-slate-400">No project headings detected in document.</p>
                ) : (
                  <div className="space-y-3">
                    {editableProjects.map((p, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{p.title}</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{p.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {p.technologies?.map((tech: string) => (
                            <span key={tech} className="text-[10px] px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-brand-600">
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Education Extraction Box */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Detected Education</h3>
                {editableEducation.length === 0 ? (
                  <p className="text-xs text-slate-400">No explicit degree patterns identified.</p>
                ) : (
                  <div className="space-y-2">
                    {editableEducation.map((edu, idx) => (
                      <div key={idx} className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs">
                        <span className="font-bold">{edu.degree} in {edu.field_of_study}</span>
                        <span className="text-slate-400"> • {edu.institution} ({edu.start_year} - {edu.end_year})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Extracted Plaintext Content</h3>
              <pre className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed">
                {extractionResult.raw_text}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
