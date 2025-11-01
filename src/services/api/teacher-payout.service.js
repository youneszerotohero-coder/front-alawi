import api from "./axios.config";

const ENDPOINT = "/teacher-payouts";

export const teacherPayoutService = {
  async list(params = {}) {
    const response = await api.get(ENDPOINT, { params });
    return {
      data: response.data?.data || [],
      pagination: response.data?.pagination || { page: 1, limit: 20, total: 0 },
    };
  },
  async getById(id) {
    const response = await api.get(`${ENDPOINT}/${id}`);
    return response.data?.data;
  },
  async create(payload) {
    const response = await api.post(ENDPOINT, payload);
    return response.data?.data;
  },
  async update(id, payload) {
    const response = await api.put(`${ENDPOINT}/${id}`, payload);
    return response.data?.data;
  },
  async remove(id) {
    const response = await api.delete(`${ENDPOINT}/${id}`);
    return response.data;
  },
};

export default teacherPayoutService;


