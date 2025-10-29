import React, { useState, useEffect } from "react";
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
import { UserPlus } from "lucide-react";
import studentsService from "../../services/api/students.service";
import authService from "../../services/api/auth.service";
import { useToast } from "../../hooks/use-toast";
import { cacheService } from "@/services/cache.service";
import { invalidateDashboardCache } from "@/hooks/useDashboardData"; // ⚡ Invalidate dashboard

export function AddStudentModal({ onStudentAdded }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    birth_date: "",
    address: "",
    school_name: "",
    year_of_study: "",
    branch: "",
    password: "00000000",
  });
  const [availableBranches, setAvailableBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  // Load branches when year changes
  useEffect(() => {
    const loadBranches = () => {
      if (
        formData.year_of_study &&
        ["GRADE_1_HIGH", "GRADE_2_HIGH", "GRADE_3_HIGH"].includes(formData.year_of_study)
      ) {
        // Define branches based on year level
        const branchOptions = {
          "GRADE_1_HIGH": [
            { value: "SCIENTIFIC", label: "علمي" },
            { value: "LITERARY", label: "أدبي" }
          ],
          "GRADE_2_HIGH": [
            { value: "LANGUAGES", label: "آداب ولغات" },
            { value: "PHILOSOPHY", label: "فلسفة" },
            { value: "ELECTRICAL", label: "كهرباء" },
            { value: "MECHANICAL", label: "ميكانيك" },
            { value: "CIVIL", label: "مدني" },
            { value: "INDUSTRIAL", label: "صناعي" },
            { value: "MATHEMATIC", label: "رياضيات" },
            { value: "GESTION", label: "تسيير" }
          ],
          "GRADE_3_HIGH": [
            { value: "LANGUAGES", label: "آداب ولغات" },
            { value: "PHILOSOPHY", label: "فلسفة" },
            { value: "ELECTRICAL", label: "كهرباء" },
            { value: "MECHANICAL", label: "ميكانيك" },
            { value: "CIVIL", label: "مدني" },
            { value: "INDUSTRIAL", label: "صناعي" },
            { value: "MATHEMATIC", label: "رياضيات" },
            { value: "GESTION", label: "تسيير" }
          ]
        };

        setAvailableBranches(branchOptions[formData.year_of_study] || []);
      } else {
        setAvailableBranches([]);
        setFormData((prev) => ({ ...prev, branch: "" }));
      }
    };

    loadBranches();
  }, [formData.year_of_study]);

  const yearOptions = [
    { value: "GRADE_1_MIDDLE", label: "السنة الأولى متوسط" },
    { value: "GRADE_2_MIDDLE", label: "السنة الثانية متوسط" },
    { value: "GRADE_3_MIDDLE", label: "السنة الثالثة متوسط" },
    { value: "GRADE_4_MIDDLE", label: "السنة الرابعة متوسط" },
    { value: "GRADE_1_HIGH", label: "السنة الأولى ثانوي" },
    { value: "GRADE_2_HIGH", label: "السنة الثانية ثانوي" },
    { value: "GRADE_3_HIGH", label: "السنة الثالثة ثانوي" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

        try {
          // Process grade and branch data first
          let middleSchoolGrade = null;
          let highSchoolGrade = null;
          let branch = null;

          if (formData.year_of_study.startsWith('GRADE_') && formData.year_of_study.includes('MIDDLE')) {
            middleSchoolGrade = formData.year_of_study.replace('_MIDDLE', '');
          }
          
          if (formData.year_of_study.startsWith('GRADE_') && formData.year_of_study.includes('HIGH')) {
            highSchoolGrade = formData.year_of_study.replace('_HIGH', '');
          }
          
          if (formData.branch) {
            branch = formData.branch;
          }

          let userId;
          
          try {
            // First try to create a user using the auth service with processed data
            const userResponse = await authService.register({
              phone: formData.phone,
              password: formData.password,
              firstName: formData.firstName,
              lastName: formData.lastName,
              birthDate: formData.birth_date || null,
              address: formData.address || null,
              schoolName: formData.school_name || null,
              middleSchoolGrade: middleSchoolGrade,
              highSchoolGrade: highSchoolGrade,
              branch: branch,
            });
            userId = userResponse.user.id;
          } catch (error) {
            // If user already exists (409), we need to check if they have a student record
            if (error.response?.status === 409) {
              // For now, show a clear error message asking to use a different phone number
              throw new Error("رقم الهاتف مستخدم من قبل. يرجى استخدام رقم هاتف آخر أو البحث عن الطالب الموجود في قائمة الطلاب لتحديث بياناته.");
            } else {
              throw error;
            }
          }

          // The student record should already be created by the auth controller
          console.log('User and student created successfully with ID:', userId);

          // ⚡ Invalidate cache after creating student
          cacheService.invalidateStudents();
          invalidateDashboardCache();
          console.log("🔄 Student created - Cache invalidated");

      // Show success message
      toast({
        title: "تم إضافة الطالب بنجاح",
        description: `تم إنشاء حساب للطالب ${formData.firstName} ${formData.lastName}. كلمة المرور الافتراضية: 00000000`,
      });

      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        phone: "",
        birth_date: "",
        address: "",
        school_name: "",
        year_of_study: "",
        branch: "",
        password: "00000000",
      });

      setOpen(false);

      // Refresh parent component
      if (onStudentAdded) {
        onStudentAdded();
      }
    } catch (error) {
      console.error("Error adding student:", error);
      const errorMessage =
        error.response?.data?.message || "فشل في إضافة الطالب";
      toast({
        title: "خطأ في إضافة الطالب",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      phone: "",
      birth_date: "",
      address: "",
      school_name: "",
      year_of_study: "",
      branch: "",
      password: "00000000",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="ml-2 h-4 w-4" />
          إضافة طالب جديد
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[500px] h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle className="text-right">إضافة طالب جديد</DialogTitle>
          <DialogDescription className="text-right">
            إنشاء حساب طالب جديد مع كلمة مرور افتراضية (00000000)
            <br />
            <span className="text-sm text-orange-600">
              ⚠️ تأكد من أن رقم الهاتف غير مستخدم من قبل
            </span>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* الاسم الأول */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="firstName" className="text-right">
                الاسم الأول *
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                className="col-span-3 text-right"
                placeholder="أدخل الاسم الأول"
                required
              />
            </div>

            {/* اسم العائلة */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lastName" className="text-right">
                اسم العائلة *
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                className="col-span-3 text-right"
                placeholder="أدخل اسم العائلة"
                required
              />
            </div>

            {/* رقم الهاتف */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                رقم الهاتف *
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="col-span-3 text-right"
                placeholder="0555123456"
                required
              />
            </div>

            {/* تاريخ الميلاد */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="birth_date" className="text-right">
                تاريخ الميلاد
              </Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) =>
                  setFormData({ ...formData, birth_date: e.target.value })
                }
                className="col-span-3"
              />
            </div>

            {/* العنوان */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">
                العنوان
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="col-span-3 text-right"
                placeholder="أدخل العنوان"
              />
            </div>

            {/* اسم المدرسة */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="school_name" className="text-right">
                اسم المدرسة
              </Label>
              <Input
                id="school_name"
                value={formData.school_name}
                onChange={(e) =>
                  setFormData({ ...formData, school_name: e.target.value })
                }
                className="col-span-3 text-right"
                placeholder="أدخل اسم المدرسة"
              />
            </div>

            {/* السنة الدراسية */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="year_of_study" className="text-right">
                السنة الدراسية *
              </Label>
              <Select
                value={formData.year_of_study}
                onValueChange={(value) =>
                  setFormData({ ...formData, year_of_study: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="اختر السنة الدراسية" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year, index) => (
                    <SelectItem
                      key={index}
                      value={year.value}
                      className="text-right"
                    >
                      {year.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* الفرع الدراسي - للثانوي فقط */}
            {["GRADE_1_HIGH", "GRADE_2_HIGH", "GRADE_3_HIGH"].includes(formData.year_of_study) && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="branch" className="text-right">
                  الفرع الدراسي *
                </Label>
                <Select
                  value={formData.branch}
                  onValueChange={(value) =>
                    setFormData({ ...formData, branch: value })
                  }
                  disabled={loadingBranches}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue
                      placeholder={
                        loadingBranches
                          ? "جاري تحميل الفروع..."
                          : "اختر الفرع الدراسي"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBranches.map((branch) => (
                      <SelectItem
                        key={branch.value}
                        value={branch.value}
                        className="text-right"
                      >
                        {branch.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* كلمة المرور (للعرض فقط) */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                كلمة المرور
              </Label>
              <Input
                id="password"
                type="text"
                value="00000000"
                disabled
                className="col-span-3 bg-gray-100 text-center"
              />
            </div>

            {/* ملاحظة */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700 text-right">
                💡 ملاحظة: سيتم تعيين كلمة المرور الافتراضية "00000000" للطالب
                الجديد
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
              disabled={loading}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "جاري الإضافة..." : "إضافة الطالب"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
