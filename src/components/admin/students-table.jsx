import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StudentDetailsModal } from "@/components/admin/student-details-modal";
import studentsService from "../../services/api/students.service";
import { useDebounce } from "@/hooks/useDebounce"; // 🔧 Use centralized debounce hook
import { cacheService } from "@/services/cache.service"; // ⚡ Cache optimization
import { invalidateDashboardCache } from "@/hooks/useDashboardData"; // ⚡ Invalidate dashboard after mutations

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

export function StudentsTable({ searchQuery = "" }) {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 🔧 Debounce search query with centralized hook (500ms for consistency)
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Optimized fetch function with caching
  const fetchStudents = useCallback(async (page = 1, search = "") => {
    try {
      setLoading(true);
      setCurrentPage(page); // Update page state immediately

      const params = {
        page,
        limit: 20,
      };

      if (search && search.trim()) {
        params.search = search.trim();
      }

      // ⚡ Use cache service for students
      const response = await cacheService.getStudents(
        async () => await studentsService.getStudents(params),
        params,
      );

      // Express backend returns { data: [...], pagination: { page, limit, total, totalPages } }
      setStudents(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setError(null);
    } catch (err) {
      console.error("Error fetching students:", err);
      setError("فشل في تحميل بيانات الطلاب");
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies to avoid infinite re-renders

  // Effect for search changes
  useEffect(() => {
    fetchStudents(1, debouncedSearchQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchQuery]);

  // Handle row click to show student details
  const handleRowClick = useCallback(async (studentId) => {
    try {
      const response = await studentsService.getStudent(studentId);
      // Express backend returns { success: true, data: {...} }
      setSelectedStudent(response.data || response);
    } catch (err) {
      console.error("Error fetching student details:", err);
      alert("فشل في تحميل تفاصيل الطالب");
    }
  }, []);

  // Optimized pagination handlers
  const handlePreviousPage = useCallback(() => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      fetchStudents(newPage, debouncedSearchQuery);
    }
  }, [currentPage, debouncedSearchQuery, fetchStudents]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      fetchStudents(newPage, debouncedSearchQuery);
    }
  }, [currentPage, totalPages, debouncedSearchQuery, fetchStudents]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="mr-2 text-sm text-muted-foreground">
          جاري التحميل...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-700 text-right">{error}</p>
        <Button
          onClick={() => fetchStudents(currentPage, debouncedSearchQuery)}
          className="mt-2"
          variant="outline"
          size="sm"
        >
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  return (
    <>
      <Table dir="rtl">
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">الصورة</TableHead>
            <TableHead className="text-right">الاسم</TableHead>
            <TableHead className="text-right">اللقب</TableHead>
            <TableHead className="text-right">رقم الهاتف</TableHead>
            <TableHead className="text-right">تاريخ الميلاد</TableHead>
            <TableHead className="text-right">السنة الدراسية</TableHead>
            <TableHead className="text-right">الفرع</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow
              key={student.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => handleRowClick(student.id)}
            >
              <TableCell className="text-right">
                <div className="w-10 h-10 rounded-full overflow-hidden border">
                  <img
                    src={
                      student.picture ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(student.firstName || "")}+${encodeURIComponent(student.lastName || "")}&background=0D8ABC&color=fff&size=100`
                    }
                    alt={`${student.firstName} ${student.lastName}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.firstName || "")}+${encodeURIComponent(student.lastName || "")}&background=0D8ABC&color=fff&size=100`;
                    }}
                  />
                </div>
              </TableCell>
              <TableCell className="text-right font-medium">
                {student.firstName}
              </TableCell>
              <TableCell className="text-right">{student.lastName}</TableCell>
              <TableCell className="text-right">{student.phone}</TableCell>
              <TableCell className="text-right">
                {student.birthDate ? new Date(student.birthDate).toLocaleDateString('ar-DZ') : "غير محدد"}
              </TableCell>
              <TableCell className="text-right">
                {getAcademicYear(student)}
              </TableCell>
              <TableCell className="text-right">
                {getBranchName(student.branch)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-muted-foreground">
            صفحة {currentPage} من {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
            >
              السابق
            </Button>
            <Button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
            >
              التالي
            </Button>
          </div>
        </div>
      )}

      {/* Student Details Modal */}
      {selectedStudent && (
        <StudentDetailsModal
          student={selectedStudent}
          open={!!selectedStudent}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedStudent(null);
            }
          }}
          onUpdate={() => {
            // ⚡ Invalidate cache after student update/delete
            cacheService.invalidateStudents();
            invalidateDashboardCache(); // Clear dashboard cache too
            
            // Refresh current page when student is updated
            fetchStudents(currentPage, debouncedSearchQuery);
            setSelectedStudent(null);
          }}
        />
      )}
    </>
  );
}
