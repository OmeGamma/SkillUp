const RAW_API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();

export const getApiBase = (): string => {
  if (RAW_API_BASE) {
    const cleaned = RAW_API_BASE.replace(/\/+$/, '');
    return cleaned.endsWith('/api/v1') ? cleaned : `${cleaned}/api/v1`;
  }
  return '/api/v1';
};

const API_BASE = getApiBase();

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'student' | 'recruiter' | 'admin';
  recruiter_status: 'approved' | 'pending' | 'rejected';
  profile?: any;
}

class ApiService {
  private accessToken: string | null = null;
  private currentUser: User | null = null;

  private getToken(): string | null {
    return this.accessToken;
  }

  public setSession(token: string, user: User) {
    this.accessToken = token;
    this.currentUser = user;
  }

  public clearSession() {
    this.accessToken = null;
    this.currentUser = null;
  }

  public hasSession(): boolean {
    return this.accessToken !== null;
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public setCurrentUser(user: User): void {
    this.currentUser = user;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    let res: Response;
    try {
      res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });
    } catch (networkErr: any) {
      throw new Error(
        `Unable to connect to SkillUp backend API at "${API_BASE}". ` +
        `Please ensure your FastAPI backend is running and reachable. (${networkErr?.message || networkErr})`
      );
    }

    if (res.status === 401) {
      // If unauthorized, clear invalid session
      if (endpoint !== '/auth/login') {
        this.clearSession();
      }
    }

    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (!isJson) {
      const responseText = await res.text();
      const isHtml = responseText.trim().toLowerCase().startsWith('<!doctype') || responseText.trim().toLowerCase().startsWith('<html');
      
      if (isHtml) {
        throw new Error(
          `Backend API server not found at "${API_BASE}". The server responded with HTML (index.html) instead of API data. ` +
          `Firebase Hosting hosts only the frontend; the Python FastAPI backend must be running on a cloud server (e.g. Render, Railway, or Cloud Run) and configured in VITE_API_BASE_URL.`
        );
      }

      if (!res.ok) {
        throw new Error(responseText || `Request failed with status ${res.status} (${res.statusText})`);
      }

      try {
        return JSON.parse(responseText) as T;
      } catch {
        throw new Error(`Unexpected non-JSON response from server (status ${res.status}): ${responseText.slice(0, 150)}`);
      }
    }

    if (!res.ok) {
      let errorDetail = `Request failed (${res.status})`;
      try {
        const errJson = await res.json();
        errorDetail = errJson.detail || errJson.message || JSON.stringify(errJson);
      } catch {
        errorDetail = res.statusText || 'Request failed';
      }
      throw new Error(errorDetail);
    }

    // If 204 or no content
    if (res.status === 204) return {} as T;

    return res.json();
  }

  // --- Auth ---
  async login(credentials: { email: string; password: string }) {
    const data = await this.request<{ access_token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    this.setSession(data.access_token, data.user);
    return data;
  }

  async register(payload: { email: string; password: string; full_name: string; role: string; organization?: string; designation?: string }) {
    const data = await this.request<{ access_token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    this.setSession(data.access_token, data.user);
    return data;
  }

  async logout() {
    try {
      await this.request<{ message: string }>('/auth/logout', {
        method: 'POST',
      });
    } catch {
      // Ignore network errors on logout
    } finally {
      this.clearSession();
    }
  }

  async getMongoStatus() {
    return this.request<any>('/reports/mongodb/status');
  }

  async syncMongoReports() {
    return this.request<any>('/reports/mongodb/sync-all', {
      method: 'POST',
    });
  }

  async getMe() {
    return this.request<User>('/auth/me');
  }

  // --- Profiles ---
  async getStudentProfile() {
    return this.request<any>('/profile/student');
  }

  async updateStudentProfile(profileData: any) {
    return this.request<{ message: string; completeness_score: number }>('/profile/student', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async getRecruiterProfile() {
    return this.request<any>('/profile/recruiter');
  }

  async updateRecruiterProfile(profileData: any) {
    return this.request<{ message: string }>('/profile/recruiter', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // --- Resume Processing ---
  async uploadResume(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.request<{ message: string; filename: string; extracted_data: any; action_required: string }>('/resume/upload', {
      method: 'POST',
      body: formData,
    });
  }

  async confirmExtraction(payload: { skills: any[]; education?: any[]; projects?: any[] }) {
    return this.request<any>('/resume/confirm-extraction', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // --- Skill Matching & Gap Analysis ---
  async getPredefinedRoles() {
    return this.request<any[]>('/matching/roles');
  }

  async analyzePredefinedRole(roleName: string) {
    return this.request<any>('/matching/analyze-role', {
      method: 'POST',
      body: JSON.stringify({ role_name: roleName }),
    });
  }

  async analyzeCustomJob(payload: { title: string; description: string; required_skills: string[]; preferred_skills?: string[] }) {
    return this.request<any>('/matching/analyze-custom', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // --- Jobs ---
  async getJobs(params?: { q?: string; work_mode?: string; status_filter?: string }) {
    const query = new URLSearchParams();
    if (params?.q) query.set('q', params.q);
    if (params?.work_mode) query.set('work_mode', params.work_mode);
    if (params?.status_filter) query.set('status_filter', params.status_filter);
    return this.request<any[]>(`/jobs?${query.toString()}`);
  }

  async getRecruiterJobs() {
    return this.request<any[]>('/jobs/recruiter/my-jobs');
  }

  async getJobDetail(jobId: number) {
    return this.request<any>(`/jobs/${jobId}`);
  }

  async createJob(jobData: any) {
    return this.request<any>('/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  }

  async updateJob(jobId: number, jobData: any) {
    return this.request<any>(`/jobs/${jobId}`, {
      method: 'PUT',
      body: JSON.stringify(jobData),
    });
  }

  async deleteJob(jobId: number) {
    return this.request<any>(`/jobs/${jobId}`, {
      method: 'DELETE',
    });
  }

  // --- Applications ---
  async expressInterest(jobId: number) {
    return this.request<{ message: string; match_score: number }>('/applications/express-interest', {
      method: 'POST',
      body: JSON.stringify({ job_id: jobId }),
    });
  }

  async withdrawApplication(jobId: number) {
    return this.request<{ message: string }>(`/applications/withdraw/${jobId}`, {
      method: 'POST',
    });
  }

  async getStudentApplications() {
    return this.request<any[]>('/applications/student/my-applications');
  }

  async getJobCandidates(jobId: number, params?: { status_filter?: string; sort_by?: string }) {
    const query = new URLSearchParams();
    if (params?.status_filter) query.set('status_filter', params.status_filter);
    if (params?.sort_by) query.set('sort_by', params.sort_by);
    return this.request<any[]>(`/applications/recruiter/job/${jobId}?${query.toString()}`);
  }

  async updateCandidateStatus(applicationId: number, payload: { status: string; recruiter_notes?: string; notification_message?: string }) {
    return this.request<{ message: string }>(`/applications/${applicationId}/status`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async compareCandidates(appIds: number[]) {
    return this.request<{ candidates: any[] }>(`/applications/recruiter/compare?app_ids=${appIds.join(',')}`);
  }

  // --- Machine Learning & Explainability ---
  async getModels() {
    return this.request<any[]>('/ml/models');
  }

  async getActiveModel() {
    return this.request<{ has_active_model: boolean; model?: any; message?: string }>('/ml/active-model');
  }

  async previewDataset(datasetName?: string) {
    const query = datasetName ? `?dataset_name=${encodeURIComponent(datasetName)}` : '';
    return this.request<any>(`/ml/dataset/preview${query}`);
  }

  async validateDataset(datasetName?: string) {
    return this.request<any>('/ml/dataset/validate', {
      method: 'POST',
      body: JSON.stringify({ dataset_name: datasetName || 'demo_readiness_dataset.csv' }),
    });
  }

  async generateDemoDataset(numSamples: number = 600) {
    return this.request<any>(`/ml/dataset/generate-demo?num_samples=${numSamples}`, {
      method: 'POST',
    });
  }

  async trainModel(payload: { algorithm: string; target_column?: string; feature_columns?: string[]; hyperparameters?: any; version_tag?: string }) {
    return this.request<any>('/ml/train', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async activateModel(modelId: number) {
    return this.request<{ message: string }>(`/ml/models/${modelId}/activate`, {
      method: 'POST',
    });
  }

  async predictAndExplain(payload: { candidate_id?: number; features?: Record<string, number>; job_id?: number }) {
    return this.request<any>('/ml/predict-explain', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // --- Fairness & Bias Auditing ---
  async getFairnessHistory() {
    return this.request<any[]>('/fairness/history');
  }

  async runFairnessAudit(payload: { model_id: number; group_attribute: string; dataset_name?: string }) {
    return this.request<any>('/fairness/run-audit', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // --- Reports ---
  async getReports(reportType?: string) {
    const query = reportType ? `?report_type=${encodeURIComponent(reportType)}` : '';
    return this.request<any[]>(`/reports${query}`);
  }

  async getCandidateReports(candidateId: number, reportType?: string) {
    const query = reportType ? `?report_type=${encodeURIComponent(reportType)}` : '';
    return this.request<any[]>(`/reports/candidate/${candidateId}${query}`);
  }

  async getReportDetail(reportId: number) {
    return this.request<any>(`/reports/${reportId}`);
  }

  async createReport(payload: any) {
    return this.request<any>('/reports', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  getReportDownloadUrl(reportId: number) {
    return `${API_BASE}/reports/${reportId}/download-pdf`;
  }

  async compareAnalyses(id1: number, id2: number) {
    return this.request<any>(`/reports/compare/analyses?report_id_1=${id1}&report_id_2=${id2}`);
  }

  // --- Notifications ---
  async getNotifications() {
    return this.request<any[]>('/notifications');
  }

  async getUnreadNotificationCount() {
    return this.request<{ unread_count: number }>('/notifications/unread-count');
  }

  async markNotificationRead(id: number) {
    return this.request<{ message: string }>(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsRead() {
    return this.request<{ message: string }>('/notifications/mark-all-read', {
      method: 'PUT',
    });
  }

  // --- Admin ---
  async getAdminStats() {
    return this.request<any>('/admin/stats');
  }

  async getRecruitersList() {
    return this.request<any[]>('/admin/recruiters');
  }

  async updateRecruiterStatus(userId: number, status: 'approved' | 'rejected' | 'pending') {
    return this.request<{ message: string }>(`/admin/recruiters/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }
}

export const api = new ApiService();
