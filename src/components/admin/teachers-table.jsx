import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EditTeacherModal } from "@/components/admin/edit-teacher-modal";
import { TeacherDetailsDialog } from "@/components/admin/teacher-details-dialog";
import {
  Edit,
  Trash2,
  Phone,
  BookOpen,
  Clock,
} from "lucide-react";
import { teachersService } from "@/services/teachersService";
import { useDebounce } from "@/hooks/useDebounce";
import { cacheService } from "@/services/cache.service"; // ⚡ Cache
import { invalidateDashboardCache } from "@/hooks/useDashboardData"; // ⚡ Dashboard cache

export function TeachersTable({ searchQuery = "" }) {
  const [teachers, setTeachers] = useState([]);
  const [meta, setMeta] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 12,
    total: 0,
  });
  const [filtersMeta, setFiltersMeta] = useState({ modules: [], years: [] });
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedTeacherForDetails, setSelectedTeacherForDetails] =
    useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const debouncedSearch = useDebounce(searchQuery, 500); // 🔧 Debounce search input
  const [yearFilter, setYearFilter] = useState("");
  const [page, setPage] = useState(1);
  const [refreshingCounts, setRefreshingCounts] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const mountedRef = useRef(true);
  const CACHE_KEY = "teacher_students_counts";
  const studentsCountCache = useRef({});

  // Load cache from sessionStorage once
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        
        // ⚡ Check if cache has many zeros (indicates stale cache)
        const values = Object.values(parsed);
        const zerosCount = values.filter(v => v === 0).length;
        const zerosPercentage = values.length > 0 ? (zerosCount / values.length) * 100 : 0;
        
        // If more than 50% are zeros, clear the cache
        if (zerosPercentage > 50) {
          console.log(`⚠️  Detected stale cache (${zerosPercentage.toFixed(0)}% zeros) - clearing...`);
          sessionStorage.removeItem(CACHE_KEY);
          studentsCountCache.current = {};
        } else {
          studentsCountCache.current = parsed;
          console.log(`📦 Loaded teachers cache (${values.length} entries)`);
        }
      }
    } catch {
      // Ignore sessionStorage errors (e.g., in incognito mode)
      sessionStorage.removeItem(CACHE_KEY);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadTeachers();
    return () => {
      mountedRef.current = false;
    };
  }, [page, debouncedSearch, yearFilter]); // 🔧 Use debouncedSearch instead of search

  const persistCache = () => {
    try {
      sessionStorage.setItem(
        CACHE_KEY,
        JSON.stringify(studentsCountCache.current),
      );
    } catch {
      // Ignore sessionStorage errors (e.g., in incognito mode)
    }
  };

  const loadTeachers = async () => {
    console.log("📊 Loading teachers..."); // 🔧 Performance log
    try {
      setLoading(true);
      const response = await teachersService.getTeachers({
        page,
        limit: meta.per_page || 12,
        search: debouncedSearch, // 🔧 Use debounced value
        // Note: year and module filters not supported by Express backend yet
      });
      const list = response.data || [];
      
      // Express backend returns { data: [...], pagination: { page, limit, total, totalPages } }
      const expressMetaToLaravelMeta = {
        current_page: response.pagination?.page || page,
        last_page: response.pagination?.totalPages || 1,
        per_page: response.pagination?.limit || 12,
        total: response.pagination?.total || 0,
      };
      setMeta(expressMetaToLaravelMeta);
      
      // Set studentsCount to 0 without making API calls
      const enriched = list.map((t) => ({
        ...t,
        studentsCount: 0,
      }));
      if (mountedRef.current) setTeachers(enriched);
    } catch {
      if (mountedRef.current) setError("خطأ في تحميل بيانات الأساتذة");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const refreshCounts = async () => {
    // Disabled: No longer fetching students count from API
    setRefreshingCounts(true);
    try {
      // Just set all counts to 0 without making API calls
      const updated = teachers.map((t) => ({
        ...t,
        studentsCount: 0,
      }));
      
      if (mountedRef.current) setTeachers(updated);
    } finally {
      if (mountedRef.current) setRefreshingCounts(false);
    }
  };

  const handleDeleteTeacher = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الأستاذ؟")) return;
    setDeleting(id);
    try {
      await teachersService.deleteTeacher(id);
      
      // ⚡ Invalidate cache after teacher deletion
      cacheService.invalidateTeachers();
      invalidateDashboardCache();
      console.log("🔄 Teacher deleted - Cache invalidated");
      
      await loadTeachers();
    } catch {
      alert("تعذر الحذف");
    } finally {
      setDeleting(null);
    }
  };

  const SkeletonCard = () => (
    <div className="animate-pulse bg-white rounded-lg shadow p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 bg-gray-200 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-3 bg-gray-100 rounded w-1/3" />
        </div>
      </div>
      <div className="h-3 bg-gray-100 rounded w-full" />
      <div className="grid grid-cols-2 gap-2">
        <div className="h-14 bg-gray-100 rounded" />
        <div className="h-14 bg-gray-100 rounded" />
      </div>
      <div className="h-10 bg-gray-100 rounded" />
    </div>
  );

  // Main render

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Button
          onClick={loadTeachers}
          className="bg-blue-600 hover:bg-blue-700"
        >
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col gap-4">
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading &&
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        {!loading &&
          teachers.map((teacher) => (
            <Card
              key={teacher.id}
              className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg cursor-pointer group bg-white"
              onClick={() => setSelectedTeacherForDetails(teacher)}
            >
              <CardHeader className="pb-3">
                {/* Header with Avatar and Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Teacher Avatar */}
                    <div className="relative">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                        {teacher.firstName?.charAt(0) || "?"}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      </div>
                    </div>
                    
                    {/* Teacher Name */}
                    <div>
                      <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {teacher.firstName} {teacher.lastName}
                      </CardTitle>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Teacher Info */}
                <div className="space-y-2">
                  {teacher.module && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-purple-50 rounded-lg p-2">
                      <BookOpen className="h-4 w-4 text-purple-500" />
                      <span className="font-medium">
                        {teacher.module_label || teacher.module}
                      </span>
                    </div>
                  )}
                  {teacher.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 rounded-lg p-2">
                      <Phone className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">{teacher.phone}</span>
                    </div>
                  )}
                </div>

                {/* Last Activity */}
                <div className="w-full flex justify-center items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-100">
                  <Clock className="h-3 w-3" />
                  <span>آخر نشاط: اليوم</span>
                                    {/* Action Buttons */}
                  <div className="flex gap-1 mr-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTeacher(teacher);
                      }}
                      className="flex items-center gap-1 h-7 px-2 text-xs hover:bg-blue-50"
                    >
                      <Edit className="w-3 h-3" /> تعديل
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={deleting === teacher.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTeacher(teacher.id);
                      }}
                      className="flex items-center gap-1 h-7 px-2 text-xs text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" /> حذف
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {!loading && teachers.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            لا توجد أساتذة مسجلين
          </h3>
          <p className="text-gray-500">ابدأ بإضافة أساتذة جدد إلى النظام</p>
        </div>
      )}

      {/* Pagination bottom */}
      {!loading && teachers.length > 0 && (
        <div className="flex items-center justify-between text-xs text-gray-600 pt-4 border-t">
          <div>إجمالي: {meta.total} أستاذ</div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              السابق
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.last_page}
              onClick={() => setPage((p) => p + 1)}
            >
              التالي
            </Button>
          </div>
        </div>
      )}

      {selectedTeacher && (
        <EditTeacherModal
          teacher={selectedTeacher}
          open={!!selectedTeacher}
          onOpenChange={(open) => !open && setSelectedTeacher(null)}
          onTeacherUpdated={() => {
            setSelectedTeacher(null);
            loadTeachers();
          }}
        />
      )}

      {selectedTeacherForDetails && (
        <TeacherDetailsDialog
          teacher={selectedTeacherForDetails}
          open={!!selectedTeacherForDetails}
          onOpenChange={(open) => !open && setSelectedTeacherForDetails(null)}
        />
      )}
    </div>
  );
}
