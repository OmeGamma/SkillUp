import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { api } from '../../services/api';

export const JobCreateEditPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const isEditing = !!jobId;

  const [formData, setFormData] = useState({
    title: '',
    organization: '',
    department: '',
    description: '',
    required_skills: '',
    preferred_skills: '',
    min_experience_years: 0.0,
    education_level: "Bachelor's in Computer Science or related",
    location: 'Bangalore, India',
    work_mode: 'Hybrid',
    salary_range: '',
    status: 'active',
    is_demo: false,
  });

  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditing) {
      api.getJobDetail(parseInt(jobId))
        .then(data => {
          setFormData({
            title: data.title,
            organization: data.organization,
            department: data.department || '',
            description: data.description,
            required_skills: data.required_skills?.join(', ') || '',
            preferred_skills: data.preferred_skills?.join(', ') || '',
            min_experience_years: data.min_experience_years || 0,
            education_level: data.education_level || '',
            location: data.location || '',
            work_mode: data.work_mode || 'Hybrid',
            salary_range: data.salary_range || '',
            status: data.status || 'active',
            is_demo: !!data.is_demo,
          });
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [jobId, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      title: formData.title,
      organization: formData.organization,
      department: formData.department,
      description: formData.description,
      required_skills: formData.required_skills.split(',').map(s => s.trim()).filter(Boolean),
      preferred_skills: formData.preferred_skills.split(',').map(s => s.trim()).filter(Boolean),
      min_experience_years: parseFloat(formData.min_experience_years as any) || 0.0,
      education_level: formData.education_level,
      location: formData.location,
      work_mode: formData.work_mode,
      salary_range: formData.salary_range,
      status: formData.status,
      is_demo: formData.is_demo,
    };

    try {
      if (isEditing) {
        await api.updateJob(parseInt(jobId!), payload);
      } else {
        await api.createJob(payload);
      }
      navigate('/recruiter/jobs');
    } catch (err: any) {
      setError(err.message || 'Failed to save job posting.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="py-16 text-center text-xs text-slate-400">Loading posting data...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link
        to="/recruiter/jobs"
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Postings</span>
      </Link>

      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          {isEditing ? 'Edit Job Posting' : 'Create New Vacancy Posting'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Specify core requirements, preferred competitive skills, and work modalities.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Job Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Senior Full Stack Engineer"
              className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Organization / Company Name</label>
            <input
              type="text"
              required
              value={formData.organization}
              onChange={e => setFormData({ ...formData, organization: e.target.value })}
              placeholder="e.g. CloudScale Systems"
              className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Work Mode</label>
            <select
              value={formData.work_mode}
              onChange={e => setFormData({ ...formData, work_mode: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <option value="Hybrid">Hybrid</option>
              <option value="Remote">Remote</option>
              <option value="On-site">On-site</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Location</label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. Bangalore, India"
              className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Min Experience (Years)</label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={formData.min_experience_years}
              onChange={e => setFormData({ ...formData, min_experience_years: parseFloat(e.target.value) || 0 })}
              className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">Required Skills (Comma-separated, normalized)</label>
          <input
            type="text"
            required
            value={formData.required_skills}
            onChange={e => setFormData({ ...formData, required_skills: e.target.value })}
            placeholder="e.g. React, TypeScript, Python, FastAPI, PostgreSQL"
            className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">Preferred Skills (Optional advantages)</label>
          <input
            type="text"
            value={formData.preferred_skills}
            onChange={e => setFormData({ ...formData, preferred_skills: e.target.value })}
            placeholder="e.g. Docker, Redis, Kubernetes, CI/CD"
            className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">Job Description & Responsibilities</label>
          <textarea
            rows={5}
            required
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            placeholder="Detailed overview of team mission, engineering responsibilities, and expected competencies..."
            className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Salary Range (Optional)</label>
            <input
              type="text"
              value={formData.salary_range}
              onChange={e => setFormData({ ...formData, salary_range: e.target.value })}
              placeholder="e.g. ₹10L - ₹16L / annum"
              className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Posting Status</label>
            <select
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <option value="active">Active (Accepting candidates)</option>
              <option value="draft">Draft (Saved only)</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 pt-6">
            <input
              type="checkbox"
              id="is_demo"
              checked={formData.is_demo}
              onChange={e => setFormData({ ...formData, is_demo: e.target.checked })}
              className="h-4 w-4 text-brand-600 rounded cursor-pointer"
            />
            <label htmlFor="is_demo" className="text-xs font-semibold cursor-pointer">
              Label as Demonstration Posting
            </label>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-3">
          <Link
            to="/recruiter/jobs"
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 text-xs font-semibold rounded-xl text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-60 shadow-md shadow-brand-500/20"
          >
            {submitting ? 'Saving Posting...' : isEditing ? 'Save Changes' : 'Publish Job Vacancy'}
          </button>
        </div>
      </form>
    </div>
  );
};
