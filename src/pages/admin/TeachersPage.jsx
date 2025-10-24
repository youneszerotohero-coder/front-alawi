import { TeachersTable } from "@/components/admin/teachers-table";
import { AddTeacherModal } from "@/components/admin/add-teacher-modal";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminTeachersPage() {
  return (
    <div dir="rtl">
      {/* Teachers Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-right">دليل المعلمين</CardTitle>
            <CardDescription className="text-right">
              إدارة ملفات المعلمين والوحدات وتقاسم الإيرادات
            </CardDescription>
          </div>
          <AddTeacherModal />
        </CardHeader>
        <CardContent>
          <TeachersTable />
        </CardContent>
      </Card>
    </div>
  );
}
