import { StudentIdInput } from "@/components/admin/student-id-input";

export default function AdminCheckInPage() {
  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground text-right">
            نظام تسجيل الحضور
          </h1>
          <p className="text-muted-foreground text-right">
            مسح معرف الطالب وإدارة حضور الطلاب
          </p>
        </div>
      </div>

      {/* Student ID Input Section */}
      <div className="max-w-4xl mx-auto">
        <StudentIdInput />
      </div>
    </div>
  );
}
