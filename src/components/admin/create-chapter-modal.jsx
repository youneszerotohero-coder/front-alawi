import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookOpen } from "lucide-react";
import { teacherService } from "@/services/api/teacher.service";

export function CreateChapterModal({ onAddChapter }) {
  const [open, setOpen] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    teacherId: "",
  });

  // Load teachers when modal opens
  useEffect(() => {
    if (open) {
      loadTeachers();
    }
  }, [open]);

  const loadTeachers = async () => {
    try {
      setLoadingTeachers(true);
      console.log("🔍 Loading teachers...");
      const response = await teacherService.getTeachers();
      console.log("✅ Teachers response:", response);
      // Service returns { data: [...], pagination: {...} }
      const teachersList = response?.data || [];
      console.log("📋 Teachers list:", teachersList, "Count:", teachersList.length);
      setTeachers(teachersList);
    } catch (error) {
      console.error("❌ Error loading teachers:", error);
      setTeachers([]);
    } finally {
      setLoadingTeachers(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onAddChapter) {
      onAddChapter(formData);
    }
    setOpen(false);
    setFormData({
      title: "",
      description: "",
      teacherId: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <BookOpen className="ml-2 h-4 w-4" />
          إضافة فصل جديد
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[500px]"
        dir="rtl"
        aria-describedby="chapter-create-description"
      >
        <DialogHeader>
          <DialogTitle className="text-right">إضافة فصل جديد</DialogTitle>
          <DialogDescription
            id="chapter-create-description"
            className="text-right"
          >
            أضف فصلاً جديداً لتنظيم المحتوى التعليمي.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                عنوان الفصل
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="col-span-3 text-right"
                placeholder="أدخل عنوان الفصل"
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
                placeholder="أدخل وصف الفصل"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="teacherId" className="text-right">
                الأستاذ
              </Label>
              <Select
                value={formData.teacherId}
                onValueChange={(value) =>
                  setFormData({ ...formData, teacherId: value })
                }
                disabled={loadingTeachers}
              >
                <SelectTrigger className="col-span-3 text-right">
                  <SelectValue placeholder={loadingTeachers ? "جاري التحميل..." : "اختر الأستاذ"} />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.firstName} {teacher.lastName}
                    </SelectItem>
                  ))}
                  {teachers.length === 0 && !loadingTeachers && (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
                      لا يوجد أساتذة متاحون
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              إلغاء
            </Button>
            <Button type="submit">إنشاء الفصل</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
