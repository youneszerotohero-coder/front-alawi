import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { teachersService } from "@/services/teachersService";
import { cacheService } from "@/services/cache.service"; // ⚡ Cache
import { invalidateDashboardCache } from "@/hooks/useDashboardData"; // ⚡ Dashboard cache

export function EditTeacherModal({
  teacher,
  open,
  onOpenChange,
  onTeacherUpdated,
}) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    specialization: [],
    middleSchoolGrades: [],
    highSchoolGrades: [],
    branches: [],
    percentageShare: 70,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const MIDDLE_SCHOOL_GRADES = [
    { value: "GRADE_1", label: "السنة الأولى متوسط" },
    { value: "GRADE_2", label: "السنة الثانية متوسط" },
    { value: "GRADE_3", label: "السنة الثالثة متوسط" },
    { value: "GRADE_4", label: "السنة الرابعة متوسط" },
  ];

  const HIGH_SCHOOL_GRADES = [
    { value: "GRADE_1", label: "السنة الأولى ثانوي" },
    { value: "GRADE_2", label: "السنة الثانية ثانوي" },
    { value: "GRADE_3", label: "السنة الثالثة ثانوي" },
  ];

  const BRANCH_OPTIONS = [
    // 1st year High School
    { value: "SCIENTIFIC", label: "علمي" },
    { value: "LITERARY", label: "أدبي" },
    // 2nd and 3rd year High School
    { value: "LANGUAGES", label: "آداب ولغات" },
    { value: "PHILOSOPHY", label: "فلسفة" },
    { value: "ELECTRICAL", label: "كهرباء" },
    { value: "MECHANICAL", label: "ميكانيك" },
    { value: "CIVIL", label: "مدني" },
    { value: "INDUSTRIAL", label: "صناعي" },
    { value: "MATHEMATIC", label: "رياضيات" },
    { value: "GESTION", label: "تسيير" },
  ];

  const MODULE_OPTIONS = [
    { value: "math", label: "الرياضيات" },
    { value: "physique", label: "الفيزياء" },
    { value: "chimie", label: "الكيمياء" },
    { value: "svt", label: "علوم الطبيعة و الحياة" },
    { value: "francais", label: "اللغة الفرنسية" },
    { value: "anglais", label: "اللغة الإنجليزية" },
    { value: "arabe", label: "اللغة العربية" },
    { value: "histoire", label: "التاريخ" },
    { value: "geographie", label: "الجغرافيا" },
    { value: "philosophie", label: "الفلسفة" },
    { value: "informatique", label: "الإعلام الآلي" },
  ];

  useEffect(() => {
    if (teacher) {
      setFormData({
        firstName: teacher.firstName || "",
        lastName: teacher.lastName || "",
        phone: teacher.phone || "",
        specialization: Array.isArray(teacher.specialization) ? teacher.specialization : [],
        middleSchoolGrades: Array.isArray(teacher.middleSchoolGrades) ? teacher.middleSchoolGrades : [],
        highSchoolGrades: Array.isArray(teacher.highSchoolGrades) ? teacher.highSchoolGrades : [],
        branches: Array.isArray(teacher.branches) ? teacher.branches : [],
        percentageShare: teacher.percentageShare || 70,
      });
      setError(null);
    }
  }, [teacher]);

  const toggleArrayField = (field, value) => {
    setFormData((prev) => {
      const exists = prev[field].includes(value);
      return {
        ...prev,
        [field]: exists
          ? prev[field].filter((item) => item !== value)
          : [...prev[field], value],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!teacher?.id) return;
    setSubmitting(true);
    setError(null);
    try {
      // Build payload per backend teacher model schema
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim() || null,
        specialization: formData.specialization,
        middleSchoolGrades: formData.middleSchoolGrades,
        highSchoolGrades: formData.highSchoolGrades,
        branches: formData.branches,
        percentageShare: formData.percentageShare,
      };
      await teachersService.updateTeacher(teacher.id, payload);
      
      // ⚡ Invalidate cache after teacher update
      cacheService.invalidateTeachers();
      invalidateDashboardCache();
      console.log("🔄 Teacher updated - Cache invalidated");
      
      if (onTeacherUpdated) onTeacherUpdated();
      onOpenChange(false);
    } catch (err) {
      const msg = err?.response?.data?.message || "فشل تحديث بيانات الأستاذ";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle>تعديل بيانات الأستاذ</DialogTitle>
          <DialogDescription>
            قم بتحديث المعلومات ثم اضغط حفظ.
          </DialogDescription>
        </DialogHeader>
        {error && <div className="text-red-600 text-sm mb-3">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-3">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">الاسم الأول *</Label>
                <Input
                  id="firstName"
                  required
                  placeholder="مثال: محمد"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">اسم العائلة *</Label>
                <Input
                  id="lastName"
                  required
                  placeholder="مثال: علي"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="05XXXXXXXX"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>التخصصات</Label>
              <div className="grid grid-cols-2 gap-2">
                {MODULE_OPTIONS.map((m) => (
                  <label
                    key={m.value}
                    className="flex items-center gap-2 text-sm bg-gray-50 rounded px-2 py-1 border"
                  >
                    <Checkbox
                      checked={formData.specialization.includes(m.value)}
                      onCheckedChange={() => toggleArrayField('specialization', m.value)}
                    />
                    <span>{m.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>المراحل المتوسطة</Label>
              <div className="grid grid-cols-2 gap-2">
                {MIDDLE_SCHOOL_GRADES.map((grade) => (
                  <label
                    key={grade.value}
                    className="flex items-center gap-2 text-sm bg-gray-50 rounded px-2 py-1 border"
                  >
                    <Checkbox
                      checked={formData.middleSchoolGrades.includes(grade.value)}
                      onCheckedChange={() => toggleArrayField('middleSchoolGrades', grade.value)}
                    />
                    <span>{grade.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>المراحل الثانوية</Label>
              <div className="grid grid-cols-2 gap-2">
                {HIGH_SCHOOL_GRADES.map((grade) => (
                  <label
                    key={grade.value}
                    className="flex items-center gap-2 text-sm bg-gray-50 rounded px-2 py-1 border"
                  >
                    <Checkbox
                      checked={formData.highSchoolGrades.includes(grade.value)}
                      onCheckedChange={() => toggleArrayField('highSchoolGrades', grade.value)}
                    />
                    <span>{grade.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>الفروع الدراسية</Label>
              <div className="grid grid-cols-2 gap-2">
                {BRANCH_OPTIONS.map((branch) => (
                  <label
                    key={branch.value}
                    className="flex items-center gap-2 text-sm bg-gray-50 rounded px-2 py-1 border"
                  >
                    <Checkbox
                      checked={formData.branches.includes(branch.value)}
                      onCheckedChange={() => toggleArrayField('branches', branch.value)}
                    />
                    <span>{branch.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="percentageShare">نسبة الاستاذ (%)</Label>
              <Input
                id="percentageShare"
                type="number"
                min="0"
                max="100"
                placeholder="مثال: 70"
                value={formData.percentageShare}
                onChange={(e) =>
                  setFormData({ ...formData, percentageShare: parseFloat(e.target.value) || 70 })
                }
              />
            </div>
          </div>
          <DialogFooter className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "جاري الحفظ..." : "حفظ التعديلات"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
