import { useState } from "react";
import { StudentsTable } from "@/components/admin/students-table";
import { AddStudentModal } from "@/components/admin/add-student-modal";
import { StudentsFilters } from "@/components/admin/students-filters";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminStudentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSearchChange = (query) => {
    setSearchQuery(query);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
  };

  const handleStudentAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div dir="rtl">
      {/* <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground text-right">الطلاب</h1>
          <p className="text-muted-foreground text-right">إدارة حسابات الطلاب ومتابعة تقدمهم</p>
        </div>
      </div> */}

      {/* Students Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-right">دليل الطلاب</CardTitle>
            <CardDescription className="text-right">
              البحث والتصفية للطلاب حسب معايير مختلفة
            </CardDescription>
          </div>
          <AddStudentModal onStudentAdded={handleStudentAdded} />
        </CardHeader>
        <CardContent>
          <StudentsFilters
            onSearchChange={handleSearchChange}
            onClearFilters={handleClearFilters}
          />
          <StudentsTable searchQuery={searchQuery} key={refreshTrigger} />
        </CardContent>
      </Card>
    </div>
  );
}
