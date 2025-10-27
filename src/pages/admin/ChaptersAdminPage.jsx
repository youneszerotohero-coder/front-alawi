import { useState } from "react";
import { ChaptersGrid } from "@/components/admin/chapters-grid";
import { CreateChapterModal } from "@/components/admin/create-chapter-modal";
import { useChapters } from "@/hooks/useChapters";

export default function AdminChaptersPage() {
  const {
    chapters,
    loading,
    error,
    addChapter,
    updateChapter,
    deleteChapter,
    addCourse,
    updateCourse,
    deleteCourse,
    uploadCoursePDF,
  } = useChapters();


  const handleAddChapter = async (chapterData) => {
    return await addChapter(chapterData);
  };

  const handleAddCourse = async (chapterId, courseData) => {
    return await addCourse(chapterId, courseData);
  };

  const handleUpdateCourse = async (chapterId, courseId, updates) => {
    return await updateCourse(chapterId, courseId, updates);
  };

  const handleDeleteCourse = async (chapterId, courseId) => {
    return await deleteCourse(chapterId, courseId);
  };

  const handleUpdateChapter = async (chapterId, updates) => {
    return await updateChapter(chapterId, updates);
  };

  const handleDeleteChapter = async (chapterId) => {
    if (
      window.confirm(
        "هل أنت متأكد من حذف هذا الفصل؟ سيتم حذف جميع الدروس المرتبطة به.",
      )
    ) {
      try {
        return await deleteChapter(chapterId);
      } catch (error) {
        console.error("Error deleting chapter:", error);
        throw error;
      }
    }
    return null;
  };

  const handleUploadPDF = async (courseId, file, type) => {
    try {
      return await uploadCoursePDF(courseId, file, type);
    } catch (error) {
      console.error("Error uploading PDF:", error);
      throw error;
    }
  };

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground text-right">
            الفصول والدورات
          </h1>
          <p className="text-muted-foreground text-right">
            إدارة المحتوى التعليمي ومواد الدورة
          </p>
        </div>
        <CreateChapterModal onAddChapter={handleAddChapter} />
      </div>


      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-right">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="text-lg text-muted-foreground">جاري التحميل...</div>
        </div>
      )}

      {/* Chapters Grid */}
      {!loading && (
        <ChaptersGrid
          chapters={chapters}
          onAddCourse={handleAddCourse}
          onUpdateCourse={handleUpdateCourse}
          onDeleteCourse={handleDeleteCourse}
          onUpdateChapter={handleUpdateChapter}
          onDeleteChapter={handleDeleteChapter}
          onUploadPDF={handleUploadPDF}
        />
      )}
    </div>
  );
}
