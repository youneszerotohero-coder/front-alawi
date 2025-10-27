import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Upload, FileText, X } from "lucide-react";

export function AddCourseModal({
  chapterId,
  chapterTitle,
  trigger,
  onAddCourse,
  onUploadPDF,
}) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    videoLink: "",
    explanationPdf: null,
    activitiesPdf: null,
  });
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (onAddCourse) {
      try {
        setUploading(true);

        // Create course first - include chapterId in the data
        const courseData = {
          chapterId: chapterId,
          title: formData.title,
          description: formData.description,
        };
        
        // Only add videoLink if it has a value
        if (formData.videoLink && formData.videoLink.trim()) {
          courseData.videoLink = formData.videoLink;
        }

        const newCourse = await onAddCourse(chapterId, courseData);

        // Upload PDFs if they exist
        if (formData.explanationPdf && onUploadPDF) {
          await onUploadPDF(newCourse.id, formData.explanationPdf, "explanation");
        }

        if (formData.activitiesPdf && onUploadPDF) {
          await onUploadPDF(newCourse.id, formData.activitiesPdf, "activities");
        }

        setOpen(false);
        setFormData({
          title: "",
          description: "",
          videoLink: "",
          explanationPdf: null,
          activitiesPdf: null,
        });
      } catch (error) {
        console.error("Error creating course:", error);
        // Error handling is done in the hook
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="ml-2 h-4 w-4" />
            إضافة درس
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle className="text-right">
            إضافة درس إلى {chapterTitle}
          </DialogTitle>
          <DialogDescription className="text-right">
            إنشاء درس جديد مع محتوى فيديو ومواد PDF.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="course-title" className="text-right">
                عنوان الدرس
              </Label>
              <Input
                id="course-title"
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
              <Label htmlFor="course-description" className="text-right mt-2">
                الوصف
              </Label>
              <Textarea
                id="course-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="col-span-3 text-right"
                placeholder="أدخل وصف الدرس"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="video-link" className="text-right">
                رابط الفيديو (اختياري)
              </Label>
              <Input
                id="video-link"
                type="url"
                value={formData.videoLink}
                onChange={(e) =>
                  setFormData({ ...formData, videoLink: e.target.value })
                }
                className="col-span-3 text-right"
                placeholder="https://youtube.com/watch?v=..."
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

                {formData.explanationPdf && (
                  <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-blue-800">
                            {formData.explanationPdf.name}
                          </p>
                          <p className="text-xs text-blue-600">
                            {(formData.explanationPdf.size / 1024 / 1024).toFixed(
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
                        onClick={() => removeFile("explanationPdf")}
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

                {formData.activitiesPdf && (
                  <div className="mt-2 p-2 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-green-800">
                            {formData.activitiesPdf.name}
                          </p>
                          <p className="text-xs text-green-600">
                            {(formData.activitiesPdf.size / 1024 / 1024).toFixed(
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
                        onClick={() => removeFile("activitiesPdf")}
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
              onClick={() => setOpen(false)}
              disabled={uploading}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={uploading}>
              {uploading ? "جاري الإضافة..." : "إضافة الدرس"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
