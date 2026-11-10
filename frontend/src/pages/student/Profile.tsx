import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User, Mail, Phone, MapPin, Target, Eye, EyeOff, Plus, Trash2,
  CheckCircle2, AlertCircle, Save, Award, Briefcase, GraduationCap,
  Globe, Sparkles, FileText
} from 'lucide-react';
import { api } from '../../services/api';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';

export const StudentProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal states for adding items
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: '', category: 'Technical', source: 'self', verified: false, level: 'intermediate' });

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', description: '', technologies: '', github_url: '', role: '', outcome: '' });

  const [showExperienceModal, setShowExperienceModal] = useState(false);
  const [newExp, setNewExp] = useState({ company: '', role: '', start_date: '', end_date: 'Present', description: '', technologies: '' });

  const [showEducationModal, setShowEducationModal] = useState(false);
  const [newEdu, setNewEdu] = useState({ institution: '', degree: 'B.Tech', field_of_study: 'Computer Science', start_year: 2022, end_year: 2026, grade: '' });

  const loadProfile = async () => {
    try {
      const data = await api.getStudentProfile();
      setProfile(data);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to load profile.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    setStatusMsg(null);
    try {
      const res = await api.updateStudentProfile({
        headline: profile.headline,
        bio: profile.bio,
        phone: profile.phone,
        location: profile.location,
        target_role: profile.target_role,
        cgpa: profile.cgpa ? parseFloat(profile.cgpa) : null,
        is_discoverable: profile.is_discoverable,
        portfolio_url: profile.portfolio_url,
        github_url: profile.github_url,
        linkedin_url: profile.linkedin_url,
        education: profile.education,
        skills: profile.skills,
        projects: profile.projects,
        experience: profile.experience,
        certifications: profile.certifications,
        assessment_scores: profile.assessment_scores
      });
      setStatusMsg({ type: 'success', text: `Profile updated successfully! Completeness: ${res.completeness_score}%` });
      setProfile((prev: any) => ({ ...prev, completeness_score: res.completeness_score }));
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to save changes.' });
    } finally {
      setSaving(false);
    }
  };

  // Skill Add
  const handleAddSkill = () => {
    if (!newSkill.name.trim()) return;
    const updated = [...(profile.skills || []), { ...newSkill, name: newSkill.name.trim() }];
    setProfile({ ...profile, skills: updated });
    setNewSkill({ name: '', category: 'Technical', source: 'self', verified: false, level: 'intermediate' });
    setShowSkillModal(false);
  };

  const handleRemoveSkill = (index: number) => {
    const updated = profile.skills.filter((_: any, i: number) => i !== index);
    setProfile({ ...profile, skills: updated });
  };

  // Project Add
  const handleAddProject = () => {
    if (!newProject.title.trim()) return;
    const techs = newProject.technologies.split(',').map(t => t.trim()).filter(Boolean);
    const updated = [...(profile.projects || []), {
      title: newProject.title,
      description: newProject.description,
      technologies: techs,
      github_url: newProject.github_url,
      role: newProject.role,
      outcome: newProject.outcome
    }];
    setProfile({ ...profile, projects: updated });
    setNewProject({ title: '', description: '', technologies: '', github_url: '', role: '', outcome: '' });
    setShowProjectModal(false);
  };

  const handleRemoveProject = (index: number) => {
    const updated = profile.projects.filter((_: any, i: number) => i !== index);
    setProfile({ ...profile, projects: updated });
  };

  // Experience Add
  const handleAddExperience = () => {
    if (!newExp.company.trim() || !newExp.role.trim()) return;
    const techs = newExp.technologies.split(',').map(t => t.trim()).filter(Boolean);
    const updated = [...(profile.experience || []), { ...newExp, technologies: techs }];
    setProfile({ ...profile, experience: updated });
    setNewExp({ company: '', role: '', start_date: '', end_date: 'Present', description: '', technologies: '' });
    setShowExperienceModal(false);
  };

  const handleRemoveExperience = (index: number) => {
    const updated = profile.experience.filter((_: any, i: number) => i !== index);
    setProfile({ ...profile, experience: updated });
  };

  // Education Add
  const handleAddEducation = () => {
    if (!newEdu.institution.trim()) return;
    const updated = [...(profile.education || []), newEdu];
    setProfile({ ...profile, education: updated });
    setNewEdu({ institution: '', degree: 'B.Tech', field_of_study: 'Computer Science', start_year: 2022, end_year: 2026, grade: '' });
    setShowEducationModal(false);
  };

  const handleRemoveEducation = (index: number) => {
    const updated = profile.education.filter((_: any, i: number) => i !== index);
    setProfile({ ...profile, education: updated });
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-slate-500">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-600 border-r-transparent mb-3" />
        <p className="text-sm font-medium">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Candidate Profile & Skill Portfolio</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage your verified skills, projects, and target role benchmarks
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/student/resume"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <FileText className="w-4 h-4 text-brand-600" />
            <span>Upload Resume</span>
          </Link>

          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="inline-flex items-center space-x-1.5 px-5 py-2 text-xs font-semibold rounded-xl text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/20 disabled:opacity-60 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Changes...' : 'Save All Changes'}</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-xl flex items-center space-x-2 text-xs ${
          statusMsg.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
            : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
        }`}>
          {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Basic Profile Details & Privacy Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
            General Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                disabled
                value={profile.full_name || ''}
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <input
                type="text"
                disabled
                value={profile.email || ''}
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Professional Headline</label>
              <input
                type="text"
                value={profile.headline || ''}
                onChange={e => setProfile({ ...profile, headline: e.target.value })}
                placeholder="e.g. Full Stack Engineer | React & FastAPI"
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Job Role</label>
              <select
                value={profile.target_role || 'Full Stack Developer'}
                onChange={e => setProfile({ ...profile, target_role: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              >
                <option value="Full Stack Developer">Full Stack Developer</option>
                <option value="Frontend Developer">Frontend Developer</option>
                <option value="Backend Developer">Backend Developer</option>
                <option value="Data Scientist / ML Engineer">Data Scientist / ML Engineer</option>
                <option value="DevOps / Cloud Engineer">DevOps / Cloud Engineer</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Bio / Professional Summary</label>
            <textarea
              rows={3}
              value={profile.bio || ''}
              onChange={e => setProfile({ ...profile, bio: e.target.value })}
              placeholder="Highlight your engineering passions, core technical interests, and project outcomes..."
              className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Location</label>
              <input
                type="text"
                value={profile.location || ''}
                onChange={e => setProfile({ ...profile, location: e.target.value })}
                placeholder="City, Country"
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone (Optional)</label>
              <input
                type="text"
                value={profile.phone || ''}
                onChange={e => setProfile({ ...profile, phone: e.target.value })}
                placeholder="+91 XXXXX XXXXX"
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                CGPA <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={profile.cgpa || ''}
                onChange={e => setProfile({ ...profile, cgpa: e.target.value })}
                placeholder="e.g. 8.5"
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Visibility & External Links Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
            Visibility & Verification Links
          </h2>

          {/* Discoverability Toggle */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {profile.is_discoverable ? (
                  <Eye className="w-4 h-4 text-emerald-600" />
                ) : (
                  <EyeOff className="w-4 h-4 text-slate-400" />
                )}
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Recruiter Discoverability</h4>
                  <p className="text-[10px] text-slate-500">Allow verified recruiters to discover your profile</p>
                </div>
              </div>

              <input
                type="checkbox"
                checked={!!profile.is_discoverable}
                onChange={e => setProfile({ ...profile, is_discoverable: e.target.checked })}
                className="h-4 w-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500 cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">GitHub Profile URL</label>
            <div className="relative">
              <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="url"
                value={profile.github_url || ''}
                onChange={e => setProfile({ ...profile, github_url: e.target.value })}
                placeholder="https://github.com/username"
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">LinkedIn Profile URL</label>
            <div className="relative">
              <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="url"
                value={profile.linkedin_url || ''}
                onChange={e => setProfile({ ...profile, linkedin_url: e.target.value })}
                placeholder="https://linkedin.com/in/username"
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Portfolio Website</label>
            <div className="relative">
              <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="url"
                value={profile.portfolio_url || ''}
                onChange={e => setProfile({ ...profile, portfolio_url: e.target.value })}
                placeholder="https://yourportfolio.dev"
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              External links are used as references; project evidence is verified from documented project summaries below.
            </p>
          </div>
        </div>
      </div>

      {/* Skills Matrix Section */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Technical Skills Matrix
            </h2>
            <p className="text-xs text-slate-500">
              Categorized by verification source: Project Evidence, Resume Extraction, Self-Reported, or Assessment
            </p>
          </div>
          <button
            onClick={() => setShowSkillModal(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 hover:bg-brand-100 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Skill</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {(!profile.skills || profile.skills.length === 0) ? (
            <p className="text-xs text-slate-400 py-4">No skills registered yet. Upload a resume or add skills manually.</p>
          ) : (
            profile.skills.map((s: any, idx: number) => {
              const isProjectEvidence = s.source === 'project' || s.verified;
              const isResume = s.source === 'resume';
              return (
                <div
                  key={`${s.name}-${idx}`}
                  className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs ${
                    isProjectEvidence
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                      : isResume
                      ? 'bg-brand-50 text-brand-800 border-brand-200 dark:bg-brand-950/40 dark:text-brand-300 dark:border-brand-800'
                      : 'bg-slate-50 text-slate-800 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700'
                  }`}
                >
                  <span className="font-semibold">{s.name}</span>
                  <span className="text-[10px] opacity-75">
                    ({isProjectEvidence ? 'Project Verified' : isResume ? 'Resume' : 'Self-Reported'})
                  </span>
                  <button
                    onClick={() => handleRemoveSkill(idx)}
                    className="text-slate-400 hover:text-rose-500 ml-1"
                    title="Remove skill"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Projects Section */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Technical Projects & Evidence
            </h2>
            <p className="text-xs text-slate-500">
              Documented projects serve as authentic verification evidence for candidate ranking algorithms
            </p>
          </div>
          <button
            onClick={() => setShowProjectModal(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 hover:bg-brand-100 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Project</span>
          </button>
        </div>

        <div className="space-y-4 pt-2">
          {(!profile.projects || profile.projects.length === 0) ? (
            <p className="text-xs text-slate-400 py-4">No projects added. Documented projects provide empirical verification for skills.</p>
          ) : (
            profile.projects.map((p: any, idx: number) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-start">
                <div className="space-y-1.5 max-w-3xl">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">{p.title}</h3>
                    {p.role && <Badge variant="neutral" size="sm">{p.role}</Badge>}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{p.description}</p>
                  {p.outcome && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Outcome: {p.outcome}</p>
                  )}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {p.technologies?.map((tech: string) => (
                      <span key={tech} className="text-[10px] px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium text-brand-600 dark:text-brand-400">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveProject(idx)}
                  className="text-slate-400 hover:text-rose-500 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Experience & Education 2-Col */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Experience */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Experience & Internships
            </h2>
            <button
              onClick={() => setShowExperienceModal(true)}
              className="text-xs text-brand-600 font-semibold hover:underline flex items-center"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add
            </button>
          </div>

          <div className="space-y-3">
            {(!profile.experience || profile.experience.length === 0) ? (
              <p className="text-xs text-slate-400 py-3">No professional experience or internships listed.</p>
            ) : (
              profile.experience.map((exp: any, idx: number) => (
                <div key={idx} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{exp.role} • {exp.company}</h4>
                    <p className="text-[11px] text-slate-400">{exp.start_date} - {exp.end_date}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{exp.description}</p>
                  </div>
                  <button onClick={() => handleRemoveExperience(idx)} className="text-slate-400 hover:text-rose-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Education */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Education & Degrees
            </h2>
            <button
              onClick={() => setShowEducationModal(true)}
              className="text-xs text-brand-600 font-semibold hover:underline flex items-center"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add
            </button>
          </div>

          <div className="space-y-3">
            {(!profile.education || profile.education.length === 0) ? (
              <p className="text-xs text-slate-400 py-3">No education entries added yet.</p>
            ) : (
              profile.education.map((edu: any, idx: number) => (
                <div key={idx} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{edu.degree} in {edu.field_of_study}</h4>
                    <p className="text-[11px] text-slate-500">{edu.institution} ({edu.start_year} - {edu.end_year || 'Present'})</p>
                    {edu.grade && <p className="text-[10px] text-brand-600 font-medium mt-0.5">{edu.grade}</p>}
                  </div>
                  <button onClick={() => handleRemoveEducation(idx)} className="text-slate-400 hover:text-rose-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modals for Adding Entities */}
      {/* 1. Skill Modal */}
      <Modal isOpen={showSkillModal} onClose={() => setShowSkillModal(false)} title="Add Technical Skill">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Skill Name</label>
            <input
              type="text"
              value={newSkill.name}
              onChange={e => setNewSkill({ ...newSkill, name: e.target.value })}
              placeholder="e.g. React, Python, PostgreSQL, Docker..."
              className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Domain Category</label>
              <select
                value={newSkill.category}
                onChange={e => setNewSkill({ ...newSkill, category: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="Frontend">Frontend</option>
                <option value="Backend">Backend</option>
                <option value="Databases">Databases</option>
                <option value="DevOps">DevOps / Cloud</option>
                <option value="Data & AI">Data & Machine Learning</option>
                <option value="Core CS">Core CS & Architecture</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Proficiency Level</label>
              <select
                value={newSkill.level}
                onChange={e => setNewSkill({ ...newSkill, level: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
            <button
              onClick={() => setShowSkillModal(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleAddSkill}
              className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg"
            >
              Add Skill
            </button>
          </div>
        </div>
      </Modal>

      {/* 2. Project Modal */}
      <Modal isOpen={showProjectModal} onClose={() => setShowProjectModal(false)} title="Add Technical Project">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Project Title</label>
            <input
              type="text"
              value={newProject.title}
              onChange={e => setNewProject({ ...newProject, title: e.target.value })}
              placeholder="e.g. Distributed Task Queue"
              className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Technologies (Comma-separated)</label>
            <input
              type="text"
              value={newProject.technologies}
              onChange={e => setNewProject({ ...newProject, technologies: e.target.value })}
              placeholder="e.g. React, TypeScript, FastAPI, PostgreSQL"
              className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Description & Architecture</label>
            <textarea
              rows={3}
              value={newProject.description}
              onChange={e => setNewProject({ ...newProject, description: e.target.value })}
              placeholder="Describe what the system does, architectural patterns used, and challenges solved..."
              className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">GitHub / Code URL</label>
              <input
                type="url"
                value={newProject.github_url}
                onChange={e => setNewProject({ ...newProject, github_url: e.target.value })}
                placeholder="https://github.com/..."
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Quantifiable Outcome</label>
              <input
                type="text"
                value={newProject.outcome}
                onChange={e => setNewProject({ ...newProject, outcome: e.target.value })}
                placeholder="e.g. Reduced latency by 40%"
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
            <button onClick={() => setShowProjectModal(false)} className="px-4 py-2 text-xs font-medium text-slate-600">Cancel</button>
            <button onClick={handleAddProject} className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg">Add Project</button>
          </div>
        </div>
      </Modal>

      {/* 3. Experience Modal */}
      <Modal isOpen={showExperienceModal} onClose={() => setShowExperienceModal(false)} title="Add Work Experience / Internship">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Company / Organization</label>
              <input
                type="text"
                value={newExp.company}
                onChange={e => setNewExp({ ...newExp, company: e.target.value })}
                placeholder="e.g. ScaleUp Labs"
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Role Title</label>
              <input
                type="text"
                value={newExp.role}
                onChange={e => setNewExp({ ...newExp, role: e.target.value })}
                placeholder="e.g. Software Engineering Intern"
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Start Date</label>
              <input
                type="text"
                value={newExp.start_date}
                onChange={e => setNewExp({ ...newExp, start_date: e.target.value })}
                placeholder="e.g. May 2025"
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">End Date</label>
              <input
                type="text"
                value={newExp.end_date}
                onChange={e => setNewExp({ ...newExp, end_date: e.target.value })}
                placeholder="e.g. August 2025 or Present"
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Responsibilities & Impact</label>
            <textarea
              rows={3}
              value={newExp.description}
              onChange={e => setNewExp({ ...newExp, description: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
            <button onClick={() => setShowExperienceModal(false)} className="px-4 py-2 text-xs font-medium text-slate-600">Cancel</button>
            <button onClick={handleAddExperience} className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg">Save Experience</button>
          </div>
        </div>
      </Modal>

      {/* 4. Education Modal */}
      <Modal isOpen={showEducationModal} onClose={() => setShowEducationModal(false)} title="Add Education Degree">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Institution Name</label>
            <input
              type="text"
              value={newEdu.institution}
              onChange={e => setNewEdu({ ...newEdu, institution: e.target.value })}
              placeholder="e.g. Institute of Technology"
              className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Degree</label>
              <input
                type="text"
                value={newEdu.degree}
                onChange={e => setNewEdu({ ...newEdu, degree: e.target.value })}
                placeholder="e.g. B.Tech"
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Field of Study</label>
              <input
                type="text"
                value={newEdu.field_of_study}
                onChange={e => setNewEdu({ ...newEdu, field_of_study: e.target.value })}
                placeholder="e.g. Computer Science & Engineering"
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Start Year</label>
              <input
                type="number"
                value={newEdu.start_year}
                onChange={e => setNewEdu({ ...newEdu, start_year: parseInt(e.target.value) || 2022 })}
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">End Year</label>
              <input
                type="number"
                value={newEdu.end_year}
                onChange={e => setNewEdu({ ...newEdu, end_year: parseInt(e.target.value) || 2026 })}
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Grade / CGPA</label>
              <input
                type="text"
                value={newEdu.grade}
                onChange={e => setNewEdu({ ...newEdu, grade: e.target.value })}
                placeholder="e.g. 8.8 CGPA"
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
            <button onClick={() => setShowEducationModal(false)} className="px-4 py-2 text-xs font-medium text-slate-600">Cancel</button>
            <button onClick={handleAddEducation} className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg">Save Education</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
