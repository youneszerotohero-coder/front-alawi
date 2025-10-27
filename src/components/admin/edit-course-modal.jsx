import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FileText, Upload, X } from "lucide-react";

export function EditCourseModal({
  course,
  chapterId,
  open,
  onOpenChange,
  onSave,
}) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    videoLink: "",
    explanationPdf: null,
    activitiesPdf: null,
  });

  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title || "",
        description: course.description || "",
        videoLink: course.videoLink || "",
        explanationPdf: null,
        activitiesPdf: null,
      });
    } else {
      setFormData({
        title: "",
        description: "",
        videoLink: "",
        explanationPdf: null,
        activitiesPdf: null,
      });
    }
  }, [course]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (onSave) {
      try {
        setUploading(true);

        // If there are no PDF files, send as JSON instead of FormData
        const hasPDFs = (formData.explanationPdf instanceof File) || (formData.activitiesPdf instanceof File);
        
        let courseData;
        if (hasPDFs) {
          // Use FormData for file uploads
          courseData = new FormData();
          courseData.append("title", formData.title);
          courseData.append("description", formData.description);
          courseData.append("chapterId", chapterId.toString());
          
          // Only add videoLink if it has a value
          if (formData.videoLink && formData.videoLink.trim()) {
            courseData.append("videoLink", formData.videoLink);
          }
          
          // Only add PDF files if they are actual File objects
          if (formData.explanationPdf instanceof File) {
            courseData.append("explanationPdf", formData.explanationPdf);
          }
          if (formData.activitiesPdf instanceof File) {
            courseData.append("activitiesPdf", formData.activitiesPdf);
          }
        } else {
          // Use plain JSON object (no files)
          courseData = {
            title: formData.title,
            description: formData.description,
            chapterId: chapterId
          };
          
          // Only add videoLink if it has a value
          if (formData.videoLink && formData.videoLink.trim()) {
            courseData.videoLink = formData.videoLink;
          }
        }

        console.log("Submitting course data:", courseData);
        console.log("Has PDFs:", hasPDFs);
        console.log("Is FormData:", courseData instanceof FormData);

        const response = await onSave(courseData);
        console.log("Saved course response (raw):", response);

        // Normalize response: accept axios-like response or raw data
        const savedCourse = response?.data || response;

        if (!savedCourse) {
          // Log a warning but don't throw an uncaught error — the caller already created the course
          console.warn(
            "No course data returned by onSave, but creation may have succeeded. Response:",
            response,
          );
          onOpenChange(false);
          return;
        }

        // Les fichiers PDF sont déjà inclus dans la création initiale
        // Pas besoin de les uploader séparément
        console.log("Course saved successfully:", savedCourse);
        onOpenChange(false); // Fermer le modal après succès
      } catch (error) {
        console.error("Error in handleSubmit:", error);
        // Ne pas fermer le modal en cas d'erreur
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSummaryFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setFormData({ ...formData, explanationPdf: file });
  };

  const handleExercisesFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setFormData({ ...formData, activitiesPdf: file });
  };

  const removeFile = (type) => {
    setFormData({ ...formData, [type]: null });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[500px]"
        dir="rtl"
        aria-describedby="course-form-description"
      >
        <DialogHeader>
          <DialogTitle className="text-right">
            {course ? "تعديل درس" : "إضافة درس جديد"}
          </DialogTitle>
          <div
            id="course-form-description"
            className="text-sm text-muted-foreground"
          >
            أدخل معلومات الدرس وقم برفع الملفات المطلوبة
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                عنوان الدرس
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="col-span-3 text-right"
                placeholder="أدخل عنوان الدرس"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right mt-2">
                الوصف
              </Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="col-span-3 min-h-[80px] px-3 py-2 text-right border border-input bg-background rounded-md text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="أدخل وصف الدرس"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="videoLink" className="text-right">
                رابط الفيديو (اختياري)
              </Label>
              <Input
                id="videoLink"
                type="url"
                value={formData.videoLink}
                onChange={(e) =>
                  setFormData({ ...formData, videoLink: e.target.value })
                }
                className="col-span-3 text-right"
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="duration" className="text-right">
                المدة
              </Label>
              <Input
                id="duration"
                value={formData.duration}
                onChange={(e) =>
                  setFormData({ ...formData, duration: e.target.value })
                }
                className="col-span-3 text-right"
                placeholder="مثال: 45 دقيقة"
                required
              />
            </div>

            {/* Summary PDF Upload */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="summary-pdf" className="text-right mt-2">
                ملخص PDF
              </Label>
              <div className="col-span-3">
                <div className="flex items-center gap-2">
                  <Input
                    id="summary-pdf"
                    type="file"
                    accept=".pdf"
                    onChange={handleSummaryFileChange}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="icon">
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  رفع ملف PDF للملخص
                </p>

                {formData.pdf_summary && (
                  <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-blue-800">
                            {formData.pdf_summary.name}
                          </p>
                          <p className="text-xs text-blue-600">
                            {(formData.pdf_summary.size / 1024 / 1024).toFixed(
                              2,
                            )}{" "}
                            MB
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile("pdf_summary")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Exercises PDF Upload */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="exercises-pdf" className="text-right mt-2">
                تمارين PDF
              </Label>
              <div className="col-span-3">
                <div className="flex items-center gap-2">
                  <Input
                    id="exercises-pdf"
                    type="file"
                    accept=".pdf"
                    onChange={handleExercisesFileChange}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="icon">
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  رفع ملف PDF للتمارين
                </p>

                {formData.exercises_pdf && (
                  <div className="mt-2 p-2 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-green-800">
                            {formData.exercises_pdf.name}
                          </p>
                          <p className="text-xs text-green-600">
                            {(
                              formData.exercises_pdf.size /
                              1024 /
                              1024
                            ).toFixed(2)}{" "}
                            MB
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile("exercises_pdf")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={uploading}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={uploading}>
              {uploading
                ? "جاري الحفظ..."
                : course
                  ? "حفظ التغييرات"
                  : "إضافة الدرس"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
