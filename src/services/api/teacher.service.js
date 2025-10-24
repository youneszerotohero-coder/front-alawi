// Utilisation de l'instance axios centralisée
import axiosInstance from "./axios.config";
import cacheService from "../cache.service";

export const teacherService = {
  // Récupérer tous les professeurs (avec pagination & filtres)
  async getTeachers(params = {}) {
    try {
      // Use cache only when no filters/pagination to avoid stale listings
      const useCache = !params || Object.keys(params).length === 0;
      if (useCache) {
        return await cacheService.getTeachers(async () => {
          const response = await axiosInstance.get("/teachers");
          // Express backend returns { success: true, data: [...], pagination: {...} }
          return {
            data: response.data.data,
            pagination: response.data.pagination,
          };
        });
      }
      const response = await axiosInstance.get("/teachers", { params });
      return {
        data: response.data.data,
        pagination: response.data.pagination,
      };
    } catch (error) {
      console.error("Erreur lors de la récupération des professeurs:", error);
      throw error;
    }
  },

  // Récupérer un professeur par ID
  async getTeacher(id) {
    try {
      const response = await axiosInstance.get(`/teachers/${id}`);
      // Express backend returns { success: true, data: {...} }
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération du professeur:", error);
      throw error;
    }
  },

  // Créer un nouveau professeur
  async createTeacher(teacherData) {
    try {
      const response = await axiosInstance.post("/teachers", teacherData);
      // Express backend returns { success: true, data: {...} }
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la création du professeur:", error);
      throw error;
    }
  },

  // Mettre à jour un professeur
  async updateTeacher(id, teacherData) {
    try {
      const response = await axiosInstance.patch(
        `/teachers/${id}`,
        teacherData,
      );
      // Express backend returns { success: true, data: {...} }
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la mise à jour du professeur:", error);
      throw error;
    }
  },

  // Supprimer un professeur
  async deleteTeacher(id) {
    try {
      const response = await axiosInstance.delete(`/teachers/${id}`);
      // Express backend returns { success: true, message: "..." }
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la suppression du professeur:", error);
      throw error;
    }
  },

  // Récupérer le nombre d'étudiants abonnés à un professeur
  async getTeacherStudentsCount(teacherId) {
    try {
      const response = await axiosInstance.get(
        `/teachers/${teacherId}/students-count`,
      );
      return response.data;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération du nombre d'étudiants:",
        error,
      );
      return { count: 0 };
    }
  },
};
