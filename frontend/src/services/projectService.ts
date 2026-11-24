import { api } from '../lib/api';
import type {
  ApiResponse,
  ProjectDetailResponse,
  ProjectListFilters,
  ProjectListItem,
  Proyek,
  StoreProyekPayload,
  UpdateProyekPayload,
} from '../types/api';

export const projectService = {
  async getProjects(filters?: ProjectListFilters): Promise<ProjectListItem[]> {
    const response = await api.get<ApiResponse<ProjectListItem[]>>('/projects', {
      params: filters,
    });
    return response.data.data;
  },

  async getProjectDetail(idProyek: number): Promise<ProjectDetailResponse> {
    const response = await api.get<ApiResponse<ProjectDetailResponse>>(`/projects/${idProyek}`);
    return response.data.data;
  },

  async createProject(payload: StoreProyekPayload): Promise<Proyek> {
    const response = await api.post<ApiResponse<Proyek>>('/projects', payload);
    return response.data.data;
  },

  async updateProject(idProyek: number, payload: UpdateProyekPayload): Promise<Proyek> {
    const response = await api.put<ApiResponse<Proyek>>(`/projects/${idProyek}`, payload);
    return response.data.data;
  },

  async deleteProject(idProyek: number): Promise<void> {
    await api.delete<ApiResponse<null>>(`/projects/${idProyek}`);
  },
};
