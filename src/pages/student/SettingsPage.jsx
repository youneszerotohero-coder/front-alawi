import React, { useState, useEffect } from "react";
import AuthService from "../../services/api/auth.service";
import studentsService from "../../services/api/students.service";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Page paramètres profil étudiant (limite: une modification complète par jour)
export default function StudentSettingsPage() {
  const [user, setUser] = useState(AuthService.getCurrentUser());
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    phone: "",
    birth_date: "",
    address: "",
    school_name: "",
    year_of_study: "",
    branch_id: "",
  });
  const [passwords, setPasswords] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });
  const [changePasswordForm, setChangePasswordForm] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  }); // Separate state for password change
  const [pictureFile, setPictureFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [canModify, setCanModify] = useState(true);
  const [availableBranches, setAvailableBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  // Helper function to convert grade enums to year_of_study format
  const gradeToYearOfStudy = (middleSchoolGrade, highSchoolGrade) => {
    if (middleSchoolGrade) {
      const gradeMap = {
        'GRADE_1': '1AM',
        'GRADE_2': '2AM',
        'GRADE_3': '3AM',
        'GRADE_4': '4AM',
      };
      return gradeMap[middleSchoolGrade] || '';
    }
    if (highSchoolGrade) {
      const gradeMap = {
        'GRADE_1': '1AS',
        'GRADE_2': '2AS',
        'GRADE_3': '3AS',
      };
      return gradeMap[highSchoolGrade] || '';
    }
    return '';
  };

  // Helper function to convert year_of_study to grade enums
  const yearOfStudyToGrades = (yearOfStudy) => {
    if (!yearOfStudy) return { middleSchoolGrade: null, highSchoolGrade: null };
    
    if (yearOfStudy.endsWith('AM')) {
      const gradeMap = {
        '1AM': 'GRADE_1',
        '2AM': 'GRADE_2',
        '3AM': 'GRADE_3',
        '4AM': 'GRADE_4',
      };
      return { middleSchoolGrade: gradeMap[yearOfStudy] || null, highSchoolGrade: null };
    }
    
    if (yearOfStudy.endsWith('AS')) {
      const gradeMap = {
        '1AS': 'GRADE_1',
        '2AS': 'GRADE_2',
        '3AS': 'GRADE_3',
      };
      return { middleSchoolGrade: null, highSchoolGrade: gradeMap[yearOfStudy] || null };
    }
    
    return { middleSchoolGrade: null, highSchoolGrade: null };
  };

  useEffect(() => {
    const init = async () => {
      // Refresh profile from backend
      try {
        const profile = await AuthService.getProfile();
        if (profile) {
          setUser(profile);
          // Convert grades to year_of_study format
          const yearOfStudy = gradeToYearOfStudy(profile.middleSchoolGrade, profile.highSchoolGrade);
          setForm({
            firstname: profile.firstname || profile.firstName || "",
            lastname: profile.lastname || profile.lastName || "",
            phone: profile.phone || "",
            birth_date: profile.birth_date || (profile.birthDate ? profile.birthDate.split('T')[0] : "") || "",
            address: profile.address || "",
            school_name: profile.school_name || profile.schoolName || "",
            year_of_study: yearOfStudy || "",
            branch_id: profile.branch || "",
          });
          // compute canModify
          if (profile.last_profile_update_at || profile.updatedAt) {
            const last = new Date(profile.last_profile_update_at || profile.updatedAt);
            const now = new Date();
            const diffHours = (now - last) / (1000 * 60 * 60);
            setCanModify(diffHours >= 24);
          } else {
            setCanModify(true);
          }
        }
      } catch {}
      const u = AuthService.getCurrentUser();
      if (u && !user) {
        const yearOfStudy = gradeToYearOfStudy(u.middleSchoolGrade, u.highSchoolGrade);
        setForm({
          firstname: u.firstname || u.firstName || "",
          lastname: u.lastname || u.lastName || "",
          phone: u.phone || "",
          birth_date: u.birth_date || (u.birthDate ? u.birthDate.split('T')[0] : "") || "",
          address: u.address || "",
          school_name: u.school_name || u.schoolName || "",
          year_of_study: yearOfStudy || "",
          branch_id: u.branch || "",
        });
        // compute canModify
        if (u.last_profile_update_at) {
          const last = new Date(u.last_profile_update_at);
          const now = new Date();
          const diffHours = (now - last) / (1000 * 60 * 60);
          setCanModify(diffHours >= 24);
        } else {
          setCanModify(true);
        }
      }
    };
    init();
  }, []);

  // Static branch options - same as other pages
  const BRANCH_OPTIONS = {
    "1AS": [
      { value: "SCIENTIFIC", label: "علمي" },
      { value: "LITERARY", label: "أدبي" },
    ],
    "2AS": [
      { value: "LANGUAGES", label: "آداب ولغات" },
      { value: "PHILOSOPHY", label: "فلسفة" },
      { value: "ELECTRICAL", label: "كهرباء" },
      { value: "MECHANICAL", label: "ميكانيك" },
      { value: "CIVIL", label: "مدني" },
      { value: "INDUSTRIAL", label: "صناعي" },
      { value: "MATHEMATIC", label: "رياضيات" },
      { value: "GESTION", label: "تسيير" },
      { value: "EXPERIMENTAL_SCIENCES", label: "علوم تجريبية" },
    ],
    "3AS": [
      { value: "LANGUAGES", label: "آداب ولغات" },
      { value: "PHILOSOPHY", label: "فلسفة" },
      { value: "ELECTRICAL", label: "كهرباء" },
      { value: "MECHANICAL", label: "ميكانيك" },
      { value: "CIVIL", label: "مدني" },
      { value: "INDUSTRIAL", label: "صناعي" },
      { value: "MATHEMATIC", label: "رياضيات" },
      { value: "GESTION", label: "تسيير" },
      { value: "EXPERIMENTAL_SCIENCES", label: "علوم تجريبية" },
    ],
  };

  // Load branches when year changes
  useEffect(() => {
    if (form.year_of_study && ["1AS", "2AS", "3AS"].includes(form.year_of_study)) {
      const branches = BRANCH_OPTIONS[form.year_of_study] || [];
      setAvailableBranches(branches);
    } else {
      setAvailableBranches([]);
    }
  }, [form.year_of_study]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };
  const handlePassChange = (e) => {
    const { name, value } = e.target;
    setPasswords((p) => ({ ...p, [name]: value }));
  };

  const handleChangePasswordInput = (e) => {
    const { name, value } = e.target;
    setChangePasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const fd = new FormData();

      // Map UI fields to backend fields
      const firstName = form.firstname?.trim() || "";
      const lastName = form.lastname?.trim() || "";
      const phone = form.phone?.trim() || "";
      const birthDate = form.birth_date ? new Date(form.birth_date).toISOString() : "";
      const address = form.address || "";
      const schoolName = form.school_name || "";

      if (firstName) fd.append('firstName', firstName);
      if (lastName) fd.append('lastName', lastName);
      if (phone) fd.append('phone', phone);
      if (birthDate) fd.append('birthDate', birthDate);
      if (address) fd.append('address', address);
      if (schoolName) fd.append('schoolName', schoolName);

      // Convert year_of_study to grade enums
      if (form.year_of_study) {
        const { middleSchoolGrade, highSchoolGrade } = yearOfStudyToGrades(form.year_of_study);
        if (middleSchoolGrade) {
          fd.append('middleSchoolGrade', middleSchoolGrade);
        }
        if (highSchoolGrade) {
          fd.append('highSchoolGrade', highSchoolGrade);
        }
      }

      // Add branch if year is high school
      if (form.branch_id && ["1AS", "2AS", "3AS"].includes(form.year_of_study)) {
        fd.append('branch', form.branch_id);
      }

      if (pictureFile && pictureFile instanceof File) {
        fd.append('profilePic', pictureFile);
      }

      const current = AuthService.getCurrentUser();
      const userId = current?.userId || current?.id;
      if (!userId) throw new Error('User not identified');

      const response = await studentsService.updateStudentByUserId(userId, fd);
      const updated = response?.data;

      if (updated) {
        // Merge updated student fields back into local user cache
        const newUser = {
          ...(AuthService.getCurrentUser() || {}),
          firstName: updated.firstName ?? firstName ?? '',
          lastName: updated.lastName ?? lastName ?? '',
          phone: updated.phone ?? phone ?? '',
          birthDate: updated.birthDate ?? birthDate ?? null,
          address: updated.address ?? address ?? '',
          schoolName: updated.schoolName ?? schoolName ?? '',
          profilePicPath: updated.profilePicPath || undefined,
          middleSchoolGrade: updated.middleSchoolGrade || null,
          highSchoolGrade: updated.highSchoolGrade || null,
          branch: updated.branch || null,
        };

        localStorage.setItem('user', JSON.stringify(newUser));
        setUser(newUser);
        
        const yearOfStudy = gradeToYearOfStudy(updated.middleSchoolGrade, updated.highSchoolGrade);
        setForm((prev) => ({
          ...prev,
          firstname: newUser.firstName || '',
          lastname: newUser.lastName || '',
          phone: newUser.phone || '',
          birth_date: newUser.birthDate ? newUser.birthDate.split('T')[0] : '',
          address: newUser.address || '',
          school_name: newUser.schoolName || '',
          year_of_study: yearOfStudy,
          branch_id: newUser.branch || '',
        }));
        setPictureFile(null);
        setSuccess("تم تحديث معلومات الحساب بنجاح");
      }
    } catch (err) {
      setError(err.response?.data?.message || "فشل تحديث المعلومات");
    } finally {
      setLoading(false);
    }
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (!changePasswordForm.current_password) {
        setError("كلمة المرور الحالية مطلوبة");
        setLoading(false);
        return;
      }
      if (changePasswordForm.new_password !== changePasswordForm.new_password_confirmation) {
        setError("تأكيد كلمة المرور غير مطابق");
        setLoading(false);
        return;
      }
      
      // Transform to API format
      const passwordData = {
        current_password: changePasswordForm.current_password,
        password: changePasswordForm.new_password,
        password_confirmation: changePasswordForm.new_password_confirmation,
      };
      
      await AuthService.changePassword(passwordData);
      setSuccess("تم تغيير كلمة المرور بنجاح");
      // mark local canModify false as backend will set last_profile_update_at
      setCanModify(false);
      setChangePasswordForm({
        current_password: "",
        new_password: "",
        new_password_confirmation: "",
      });
    } catch (err) {
      setError(err.response?.data?.message || "فشل تغيير كلمة المرور");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="max-w-5xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold mb-4">إعدادات الحساب</h1>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded p-3 text-sm">
          {success}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>تعديل المعلومات الشخصية</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitProfile} className="grid gap-3 md:gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label>الاسم</Label>
              <Input
                name="firstname"
                value={form.firstname}
                onChange={handleChange}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label>اللقب</Label>
              <Input
                name="lastname"
                value={form.lastname}
                onChange={handleChange}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label>الهاتف</Label>
              <Input name="phone" value={form.phone} onChange={handleChange} className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label>تاريخ الميلاد</Label>
              <Input
                type="date"
                name="birth_date"
                value={form.birth_date}
                onChange={handleChange}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label>العنوان</Label>
              <Input
                name="address"
                value={form.address}
                onChange={handleChange}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label>اسم المدرسة</Label>
              <Input
                name="school_name"
                value={form.school_name}
                onChange={handleChange}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label>السنة الدراسية</Label>
              <Select
                value={form.year_of_study}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, year_of_study: value, branch_id: "" }))
                }
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="اختر السنة الدراسية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1AM">الأولى متوسط</SelectItem>
                  <SelectItem value="2AM">الثانية متوسط</SelectItem>
                  <SelectItem value="3AM">الثالثة متوسط</SelectItem>
                  <SelectItem value="4AM">الرابعة متوسط</SelectItem>
                  <SelectItem value="1AS">الأولى ثانوي</SelectItem>
                  <SelectItem value="2AS">الثانية ثانوي</SelectItem>
                  <SelectItem value="3AS">الثالثة ثانوي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Branch Selection - Only for High School */}
            {["1AS", "2AS", "3AS"].includes(form.year_of_study) && (
              <div className="space-y-1">
                <Label>الفرع الدراسي</Label>
                <Select
                  value={form.branch_id}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, branch_id: value }))
                  }
                  disabled={loadingBranches}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue
                      placeholder={
                        loadingBranches
                          ? "جاري تحميل الفروع..."
                          : "اختر الفرع الدراسي"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 w-[var(--radix-select-trigger-width)]">
                    {availableBranches.map((branch) => (
                      <SelectItem key={branch.value} value={branch.value} className="text-sm">
                        {branch.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1">
              <Label>صورة جديدة (اختياري)</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setPictureFile(e.target.files?.[0] || null)}
                className="text-sm"
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={loading || !canModify} className="h-9 px-3 text-sm">
                {loading ? "جاري الحفظ..." : "حفظ التعديلات"}
              </Button>
            </div>
            {!canModify && (
              <p className="text-xs text-yellow-600 md:col-span-2">
                لقد قمت بتعديل بياناتك اليوم، الرجاء المحاولة بعد 24 ساعة.
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>تغيير كلمة المرور</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitPassword} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1 md:col-span-2">
              <Label>كلمة المرور الحالية</Label>
              <Input
                type="password"
                name="current_password"
                value={changePasswordForm.current_password}
                onChange={handleChangePasswordInput}
                placeholder="أدخل كلمة المرور الحالية"
              />
            </div>
            <div className="space-y-1">
              <Label>كلمة المرور الجديدة</Label>
              <Input
                type="password"
                name="new_password"
                value={changePasswordForm.new_password}
                onChange={handleChangePasswordInput}
                placeholder="أدخل كلمة المرور الجديدة"
              />
            </div>
            <div className="space-y-1">
              <Label>تأكيد كلمة المرور الجديدة</Label>
              <Input
                type="password"
                name="new_password_confirmation"
                value={changePasswordForm.new_password_confirmation}
                onChange={handleChangePasswordInput}
                placeholder="أعد إدخال كلمة المرور الجديدة"
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? "جاري الحفظ..." : "تأكيد التغيير"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
