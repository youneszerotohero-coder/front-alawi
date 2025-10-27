import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  User,
  Phone,
  Calendar,
  GraduationCap,
  MapPin,
  Trash2,
  XCircle,
} from "lucide-react";
import studentsService from "../../services/api/students.service";
import { useState } from "react";

// Helper function to get academic year in Arabic
const getAcademicYear = (student) => {
  if (student.middleSchoolGrade) {
    const gradeMap = {
      "GRADE_1": "السنة الأولى متوسط",
      "GRADE_2": "السنة الثانية متوسط",
      "GRADE_3": "السنة الثالثة متوسط",
      "GRADE_4": "السنة الرابعة متوسط",
    };
    return gradeMap[student.middleSchoolGrade] || "غير محدد";
  }
  if (student.highSchoolGrade) {
    const gradeMap = {
      "GRADE_1": "السنة الأولى ثانوي",
      "GRADE_2": "السنة الثانية ثانوي",
      "GRADE_3": "السنة الثالثة ثانوي",
    };
    return gradeMap[student.highSchoolGrade] || "غير محدد";
  }
  return "غير محدد";
};

// Helper function to get branch name in Arabic
const getBranchName = (branch) => {
  if (!branch) return "غير محدد";
  
  const branchMap = {
    "SCIENTIFIC": "علمي",
    "LITERARY": "أدبي",
    "LANGUAGES": "لغات أجنبية",
    "PHILOSOPHY": "فلسفة وآداب",
    "ELECTRICAL": "تقني رياضي - كهرباء",
    "MECHANICAL": "تقني رياضي - ميكانيك",
    "CIVIL": "تقني رياضي - مدني",
    "INDUSTRIAL": "تقني رياضي - صناعة",
    "MATHEMATIC": "رياضيات",
    "GESTION": "تسيير واقتصاد",
  };
  
  return branchMap[branch] || branch;
};

export function StudentDetailsModal({ student, open, onOpenChange, onUpdate }) {
  const formatDate = (dateString) => {
    if (!dateString) return "غير محدد";
    try {
      return new Date(dateString).toLocaleDateString("fr-FR");
    } catch {
      return dateString;
    }
  };

  const toggleFreeSubscriber = async () => {
    if (!student.hasFreeSubscription) {
      // Si on active l'abonnement gratuit, confirmation simple
      if (confirm("هل أنت متأكد من تفعيل الاشتراك المجاني لهذا الطالب؟")) {
        try {
          const result = await studentsService.updateStudent(student.id, {
            hasFreeSubscription: true
          });
          alert(`✅ تم بنجاح\n\nتم تفعيل الاشتراك المجاني`);
          onUpdate && onUpdate();
        } catch (error) {
          console.error("Error toggling free subscriber:", error);
          alert("❌ خطأ\n\nفشل في تحديث حالة الاشتراك المجاني");
        }
      }
    } else {
      // Si on désactive l'abonnement gratuit, confirmation simple
      if (confirm("هل أنت متأكد من إلغاء الاشتراك المجاني لهذا الطالب؟")) {
        try {
          const result = await studentsService.updateStudent(student.id, {
            hasFreeSubscription: false
          });
          alert(`✅ تم بنجاح\n\nتم إلغاء الاشتراك المجاني`);
          onUpdate && onUpdate();
        } catch (error) {
          console.error("Error toggling free subscriber:", error);
          alert("❌ خطأ\n\nفشل في تحديث حالة الاشتراك المجاني");
        }
      }
    }
  };


  const handleDeleteStudent = async () => {
    // Confirmation avec détails
    const confirmMessage = `
🗑️ حذف الطالب

هل أنت متأكد من حذف هذا الطالب؟

الطالب: ${student.firstName} ${student.lastName}
الهاتف: ${student.phone}

⚠️ تحذير: هذا الإجراء لا يمكن التراجع عنه
سيتم حذف جميع البيانات المرتبطة بالطالب نهائياً من قاعدة البيانات
    `;

    if (confirm(confirmMessage)) {
      try {
        const result = await studentsService.deleteStudent(student.id);

        // Message de succès مخصص
        const successDiv = document.createElement("div");
        successDiv.innerHTML = `
          <div style="background: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 16px; color: #15803d; text-align: right;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold;">✅ تم الحذف بنجاح</h3>
            <p style="margin: 0;">تم حذف الطالب ${student.firstName} ${student.lastName} من قاعدة البيانات</p>
          </div>
        `;
        alert(result.message || "تم حذف الطالب بنجاح");
        onUpdate && onUpdate();
        onOpenChange(false);
      } catch (error) {
        console.error("Error deleting student:", error);
        const errorMessage =
          error.response?.data?.message || "فشل في حذف الطالب";

        // Message d'erreur personnalisé
        if (errorMessage.includes("اشتراكات نشطة")) {
          alert(
            `❌ لا يمكن حذف الطالب\n\n${errorMessage}\n\nيرجى إلغاء جميع الاشتراكات النشطة أولاً`,
          );
        } else {
          alert(`❌ خطأ في الحذف\n\n${errorMessage}`);
        }
      }
    }
  };


  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[80vh] overflow-y-auto"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-right">
            <User className="h-5 w-5" />
            {student.firstName} {student.lastName}
          </DialogTitle>
          <DialogDescription className="text-right">
            تفاصيل الطالب الشاملة
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6">
          {/* الإجراءات */}
          <div className="flex gap-2 justify-start">
            <Button
              onClick={handleDeleteStudent}
              variant="destructive"
              size="sm"
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              حذف الطالب
            </Button>
            <Button
              onClick={toggleFreeSubscriber}
              variant={student.hasFreeSubscription ? "secondary" : "default"}
              size="sm"
              className="flex items-center gap-2"
            >
              {student.hasFreeSubscription && (
                <XCircle className="h-4 w-4" />
              )}
              {student.hasFreeSubscription
                ? "إلغاء الاشتراك المجاني"
                : "تفعيل الاشتراك المجاني"}
            </Button>
          </div>

          {/* البيانات الشخصية */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-right">
                <User className="h-5 w-5" />
                البيانات الشخصية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                {/* Identity Card */}
                <div className="md:col-span-1">
                  <div className="rounded-xl border bg-gradient-to-br from-white to-gray-50 p-3 shadow-sm flex flex-col items-center">
                    <div className="w-32 h-32 rounded-lg overflow-hidden border shadow">
                      <img
                        src={
                          student.picture ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(student.firstName || "")}+${encodeURIComponent(student.lastName || "")}&background=0D8ABC&color=fff&size=200`
                        }
                        alt={student.firstName + " " + student.lastName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.firstName || "")}+${encodeURIComponent(student.lastName || "")}&background=0D8ABC&color=fff&size=200`;
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      الاسم الأول
                    </label>
                    <p className="text-sm">{student.firstName || "غير محدد"}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      اسم العائلة
                    </label>
                    <p className="text-sm">{student.lastName || "غير محدد"}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      تاريخ الميلاد
                    </label>
                    <p className="text-sm">{formatDate(student.birthDate)}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      الهاتف
                    </label>
                    <p className="text-sm">{student.phone || "غير محدد"}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      العنوان
                    </label>
                    <p className="text-sm">{student.address || "غير محدد"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* البيانات الأكاديمية */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-right">
                <GraduationCap className="h-5 w-5" />
                البيانات الأكاديمية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    اسم المدرسة
                  </label>
                  <p className="text-sm">{student.schoolName || "غير محدد"}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    السنة الدراسية
                  </label>
                  <p className="text-sm">
                    {getAcademicYear(student)}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    الفرع الدراسي
                  </label>
                  <p className="text-sm">
                    {getBranchName(student.branch)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* حالة الاشتراك */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-right">
                حالة الاشتراك
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">
                      حالة الاشتراك المجاني
                    </label>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          student.hasFreeSubscription ? "default" : "secondary"
                        }
                        className="text-sm"
                      >
                        {student.hasFreeSubscription ? "✅ نشط" : "❌ غير نشط"}
                      </Badge>
                    </div>
                  </div>
                </div>


                {!student.hasFreeSubscription && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-sm text-gray-600">
                      💡 يمكنك تفعيل الاشتراك المجاني لهذا الطالب باستخدام الزر
                      أدناه
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* الاشتراكات النشطة */}
          {student.subscriptions && student.subscriptions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-right">
                  <GraduationCap className="h-5 w-5" />
                  الاشتراكات النشطة مع الأساتذة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {student.subscriptions.map((subscription, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">
                            اسم الأستاذ
                          </label>
                          <p className="text-sm font-medium">
                            {subscription.teacher_name || "غير محدد"}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">
                            تاريخ البداية
                          </label>
                          <p className="text-sm">
                            {formatDate(subscription.starts_at)}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">
                            تاريخ الانتهاء
                          </label>
                          <p className="text-sm">
                            {formatDate(subscription.ends_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* التواريخ المهمة */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-right">
                <Calendar className="h-5 w-5" />
                التواريخ المهمة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    تاريخ التسجيل
                  </label>
                  <p className="text-sm">{formatDate(student.createdAt)}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    آخر تحديث
                  </label>
                  <p className="text-sm">{formatDate(student.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>

    </Dialog>
  );
}
