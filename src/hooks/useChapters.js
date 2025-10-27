import { useState, useCallback, useEffect } from "react";
import { chapterService } from "@/services/api/chapter.service";
import { courseService } from "@/services/api/course.service";

export const useChapters = () => {
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load chapters from API
  const loadChapters = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await chapterService.getChapters(filters);
      
      // Backend returns { success: true, data: { chapters: [], pagination: {} } }
      let chaptersData = [];
      if (response?.success && response?.data?.chapters && Array.isArray(response.data.chapters)) {
        chaptersData = response.data.chapters;
      } else if (response?.data && Array.isArray(response.data)) {
        chaptersData = response.data;
      } else if (Array.isArray(response)) {
        chaptersData = response;
      } else {
        console.warn("Unexpected API response structure:", response);
        chaptersData = [];
      }
      
      // Load courses for each chapter
      const chaptersWithCourses = await Promise.all(
        chaptersData.map(async (chapter) => {
          try {
            // Fetch courses for this chapter
            const coursesResponse = await courseService.getCourses({ chapterId: chapter.id });
            console.log(`Courses response for chapter ${chapter.id}:`, coursesResponse);
            
            // Backend returns { success: true, data: [...courses...], pagination: {...} }
            const coursesData = coursesResponse?.data || [];
            console.log(`Courses data for chapter ${chapter.id}:`, coursesData);
            
            return {
              ...chapter,
              courses: Array.isArray(coursesData) ? coursesData : []
            };
          } catch (error) {
            console.error(`Error loading courses for chapter ${chapter.id}:`, error);
            return {
              ...chapter,
              courses: []
            };
          }
        })
      );
      
      setChapters(chaptersWithCourses);
    } catch (err) {
      setError(err.message || "فشل في تحميل الفصول");
      console.error("Error loading chapters:", err);
      setChapters([]); // Ensure we always have an array even on error
    } finally {
      setLoading(false);
    }
  }, []);

  // Load chapters on mount
  useEffect(() => {
    loadChapters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addChapter = useCallback(async (chapterData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await chapterService.createChapter(chapterData);
      // Backend returns { success: true, data: chapter }
      const newChapter = response.data || response;

      setChapters((prev) => [...prev, { ...newChapter, courses: [] }]);
      return newChapter;
    } catch (err) {
      setError(err.message || "فشل في إنشاء الفصل");
      console.error("Error creating chapter:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateChapter = useCallback(async (chapterId, updates) => {
    try {
      setLoading(true);
      setError(null);
      const response = await chapterService.updateChapter(chapterId, updates);
      // Backend returns { success: true, data: chapter }
      const updatedChapter = response.data || response;

      setChapters((prev) =>
        prev.map((chapter) =>
          chapter.id === chapterId
            ? { ...chapter, ...updatedChapter }
            : chapter,
        ),
      );
      return updatedChapter;
    } catch (err) {
      setError(err.message || "فشل في تحديث الفصل");
      console.error("Error updating chapter:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteChapter = useCallback(async (chapterId) => {
    try {
      setLoading(true);
      setError(null);
      // Backend returns { success: true, data: chapter, message: string }
      await chapterService.deleteChapter(chapterId);

      setChapters((prev) => prev.filter((chapter) => chapter.id !== chapterId));
    } catch (err) {
      setError(err.message || "فشل في حذف الفصل");
      console.error("Error deleting chapter:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const addCourse = useCallback(async (chapterId, courseData) => {
    try {
      setLoading(true);
      setError(null);

      // Don't add chapterId here if it's already in the data
      // The component should handle adding chapterId
      
      console.log("Creating course with data:", courseData);
      const response = await courseService.createCourse(courseData);
      console.log("Response received in addCourse:", response);

      // Backend returns { success: true, data: course }
      const courseResponseData = response.data || response;

      if (!courseResponseData) {
        console.error("Invalid response structure:", response);
        throw new Error("Format de réponse invalide du serveur");
      }

      setChapters((prev) =>
        prev.map((chapter) => {
          if (chapter.id === chapterId) {
            return {
              ...chapter,
              courses: [
                ...(chapter.courses || []),
                {
                  ...courseResponseData,
                  pdf_summary: courseResponseData.pdf_summary || null,
                  exercises_pdf: courseResponseData.exercises_pdf || null,
                },
              ],
            };
          }
          return chapter;
        }),
      );
      return courseResponseData;
    } catch (err) {
      setError(err.message || "فشل في إنشاء الدرس");
      console.error("Error creating course:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCourse = useCallback(async (chapterId, courseId, updates) => {
    try {
      setLoading(true);
      setError(null);
      const response = await courseService.updateCourse(courseId, updates);
      // Backend returns { success: true, data: course }
      const updatedCourse = response.data || response;

      setChapters((prev) =>
        prev.map((chapter) =>
          chapter.id === chapterId
            ? {
                ...chapter,
                courses: (chapter.courses || []).map((course) =>
                  course.id === courseId
                    ? { ...course, ...updatedCourse }
                    : course,
                ),
              }
            : chapter,
        ),
      );
      return updatedCourse;
    } catch (err) {
      setError(err.message || "فشل في تحديث الدرس");
      console.error("Error updating course:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCourse = useCallback(async (chapterId, courseId) => {
    try {
      setLoading(true);
      setError(null);
      // Backend returns { success: true, data: course, message: string }
      await courseService.deleteCourse(courseId);

      setChapters((prev) =>
        prev.map((chapter) =>
          chapter.id === chapterId
            ? {
                ...chapter,
                courses: (chapter.courses || []).filter(
                  (course) => course.id !== courseId,
                ),
              }
            : chapter,
        ),
      );
    } catch (err) {
      setError(err.message || "فشل في حذف الدرس");
      console.error("Error deleting course:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadCoursePDF = useCallback(
    async (courseId, file, type) => {
      try {
        setLoading(true);
        setError(null);
        console.log("Uploading PDF:", { courseId, type, fileName: file.name });

        const response = await courseService.uploadCoursePDF(
          courseId,
          file,
          type,
        );
        console.log("Upload response:", response.data);

        // Mettre à jour le state des chapitres après l'upload réussi
        // Rechargez les données complètes après l'upload
        const reloadResponse = await courseService.getCourse(courseId);
        // Backend returns { success: true, data: course }
        const reloadedCourse = reloadResponse.data || reloadResponse;
        console.log("Reloaded course data:", reloadedCourse);

        setChapters((prev) => {
          const newChapters = prev.map((chapter) => {
            const newCourses = chapter.courses.map((course) => {
              if (course.id === courseId) {
                // Utilisez les données fraîchement rechargées
                return reloadedCourse;
              }
              return course;
            });
            return { ...chapter, courses: newCourses };
          });
          console.log("New chapters state:", newChapters);
          return newChapters;
        });

        return response.data;
      } catch (err) {
        setError(err.message || "فشل في رفع ملف PDF");
        console.error("Error uploading PDF:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setChapters],
  );

  const getChapterById = useCallback(
    (chapterId) => {
      return chapters.find((chapter) => chapter.id === chapterId);
    },
    [chapters],
  );

  const getCourseById = useCallback(
    (chapterId, courseId) => {
      const chapter = getChapterById(chapterId);
      return chapter?.courses?.find((course) => course.id === courseId);
    },
    [getChapterById],
  );

  return {
    chapters,
    loading,
    error,
    loadChapters,
    addChapter,
    updateChapter,
    deleteChapter,
    addCourse,
    updateCourse,
    deleteCourse,
    uploadCoursePDF,
    getChapterById,
    getCourseById,
  };
};
