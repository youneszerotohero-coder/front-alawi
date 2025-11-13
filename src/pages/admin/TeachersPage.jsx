import { useState, useRef } from "react";
import { TeachersTable } from "@/components/admin/teachers-table";
import { AddTeacherModal } from "@/components/admin/add-teacher-modal";
import { TeachersFilters } from "@/components/admin/teachers-filters";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminTeachersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const addTeacherToTableRef = useRef(null);

  const handleSearchChange = (query) => {
    setSearchQuery(query);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
  };

  const handleTeacherAdded = (newTeacher) => {
    // Call the addTeacherToState function from TeachersTable
    if (addTeacherToTableRef.current && newTeacher) {
      addTeacherToTableRef.current(newTeacher);
    }
  };

  return (
    <div dir="rtl">
      {/* Teachers Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-right">دليل المعلمين</CardTitle>
            <CardDescription className="text-right">
              البحث والتصفية للمعلمين حسب معايير مختلفة
            </CardDescription>
          </div>
          <AddTeacherModal onTeacherAdded={handleTeacherAdded} />
        </CardHeader>
        <CardContent>
          <TeachersFilters
            onSearchChange={handleSearchChange}
            onClearFilters={handleClearFilters}
          />
          <TeachersTable 
            searchQuery={searchQuery} 
            onAddTeacherRef={(ref) => { addTeacherToTableRef.current = ref; }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
