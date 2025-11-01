import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  MoreHorizontal,
  Edit,
  Loader2,
  AlertCircle,
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { sessionService } from "@/services/api/session.service";
import { useToast } from "@/hooks/use-toast";
import { EditSessionModal } from "./edit-session-modal";
import { cacheService } from "@/services/cache.service"; // ⚡ Cache optimization
import { invalidateDashboardCache } from "@/hooks/useDashboardData"; // ⚡ Invalidate dashboard

export function SessionsTable({ filters = {}, searchQuery = "" }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  });
  const { toast } = useToast();
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusDialogAction, setStatusDialogAction] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState(null);
  const [instancesDialogOpen, setInstancesDialogOpen] = useState(false);
  const [selectedSessionForInstances, setSelectedSessionForInstances] = useState(null);
  const [sessionInstances, setSessionInstances] = useState([]);
  const [instancesLoading, setInstancesLoading] = useState(false);
  const [instancesPage, setInstancesPage] = useState(1);
  const [instancesPagination, setInstancesPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Fetch sessions when component mounts or filters change
  useEffect(() => {
    fetchSessions();
  }, [filters, searchQuery, currentPage]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("📡 Fetching sessions with filters:", filters);
      
      // Cache is now handled inside sessionService.getSessions
      const response = await sessionService.getSessions({
        ...filters,
        search: searchQuery,
        page: currentPage,
      });

      console.log("📥 Sessions response:", response);

      if (response && response.data) {
        setSessions(response.data);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      } else {
        setSessions([]);
      }
    } catch (err) {
      console.error("❌ Error fetching sessions:", err);
      setError("فشل في تحميل الجلسات");
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusDialogOpenChange = (open) => {
    setStatusDialogOpen(open);
    if (!open) {
      setStatusDialogAction(null);
      setSelectedSession(null);
      setCancelReason("");
    }
  };

  const openStatusDialog = (session, action) => {
    setSelectedSession(session);
    setStatusDialogAction(action);
    setCancelReason("");
    setStatusDialogOpen(true);
  };

  const handleStatusChange = async (sessionId, newStatus) => {
    try {
      await sessionService.updateSession(sessionId, { status: newStatus });
      
      // ⚡ Invalidate cache after status update
      cacheService.invalidateSessions();
      invalidateDashboardCache();
      console.log("🔄 Session status updated - Cache invalidated");
      
      toast({
        title: "تم تحديث الحالة",
        description: `تم تحديث حالة الجلسة إلى ${newStatus === "COMPLETED" ? "مكتملة" : newStatus === "CANCELLED" ? "ملغية" : "مجدولة"}.`,
      });

      await fetchSessions();
    } catch (error) {
      const description =
        error?.response?.data?.message ||
        error.message ||
        "تعذر تحديث حالة الجلسة";
      toast({
        title: "فشل تحديث الحالة",
        description,
        variant: "destructive",
      });
    }
  };

  const fetchSessionInstances = async (sessionId, page = 1) => {
    try {
      setInstancesLoading(true);
      const response = await sessionService.getSession(sessionId, { page, limit: 5 });
      console.log("📊 Session instances response:", response);
      if (response && response.data) {
        // Backend returns sessionInstances, not instances
        setSessionInstances(response.data.sessionInstances || []);
        console.log("📄 Instances:", response.data.sessionInstances?.length || 0);
        if (response.instancesPagination) {
          console.log("📖 Pagination:", response.instancesPagination);
          setInstancesPagination(response.instancesPagination);
        }
      }
    } catch (error) {
      console.error("Error fetching session instances:", error);
      toast({
        title: "خطأ في تحميل تفاصيل الجلسة",
        description: "تعذر تحميل تفاصيل الجلسة",
        variant: "destructive",
      });
    } finally {
      setInstancesLoading(false);
    }
  };

  const handleSessionClick = (session) => {
    setSelectedSessionForInstances(session);
    setInstancesPage(1);
    setInstancesDialogOpen(true);
    fetchSessionInstances(session.id, 1);
  };

  const handleInstancesDialogClose = () => {
    setInstancesDialogOpen(false);
    setSelectedSessionForInstances(null);
    setSessionInstances([]);
    setInstancesPage(1);
    setInstancesPagination({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
    });
  };

  const handleInstancesPageChange = (newPage) => {
    if (selectedSessionForInstances) {
      setInstancesPage(newPage);
      fetchSessionInstances(selectedSessionForInstances.id, newPage);
    }
  };

  const handleStatusSubmit = async () => {
    if (!selectedSession || !statusDialogAction) {
      return;
    }

    const trimmedReason = cancelReason.trim();

    if (statusDialogAction === "cancel" && trimmedReason.length === 0) {
      toast({
        title: "سبب الإلغاء مطلوب",
        description: "يرجى كتابة سبب واضح قبل تأكيد الإلغاء.",
        variant: "destructive",
      });
      return;
    }

    setStatusUpdating(true);

    try {
      if (statusDialogAction === "complete") {
        await sessionService.updateSessionStatus(
          selectedSession.id,
          "completed",
        );
        
        // ⚡ Invalidate cache after status update
        cacheService.invalidateSessions();
        invalidateDashboardCache();
        console.log("🔄 Session completed - Cache invalidated");
        
        toast({
          title: "تم تأكيد الجلسة",
          description: "تم تحديث حالة الجلسة إلى مكتملة.",
        });
      } else {
        await sessionService.updateSessionStatus(
          selectedSession.id,
          "cancelled",
          {
            cancelReason: trimmedReason,
          },
        );
        
        // ⚡ Invalidate cache after cancellation
        cacheService.invalidateSessions();
        invalidateDashboardCache();
        console.log("🔄 Session cancelled - Cache invalidated");
        
        toast({
          title: "تم إلغاء الجلسة",
          description: "تم حفظ سبب الإلغاء وتحديث حالة الجلسة.",
        });
      }

      handleStatusDialogOpenChange(false);
      await fetchSessions();
    } catch (error) {
      const description =
        error?.response?.data?.message ||
        error.message ||
        "تعذر تحديث حالة الجلسة";
      toast({
        title: "فشل تحديث الحالة",
        description,
        variant: "destructive",
      });
    } finally {
      setStatusUpdating(false);
    }
  };

  const getYearTargetInArabic = (yearTarget) => {
    const yearMap = {
      "1AM": "السنة الأولى متوسط",
      "2AM": "السنة الثانية متوسط",
      "3AM": "السنة الثالثة متوسط",
      "4AM": "السنة الرابعة متوسط",
      "1AS": "السنة الأولى ثانوي",
      "2AS": "السنة الثانية ثانوي",
      "3AS": "السنة الثالثة ثانوي",
    };
    return yearMap[yearTarget] || yearTarget;
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) return "غير محدد";
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "غير محدد";

      return date.toLocaleDateString("ar-DZ", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "غير محدد";
    }
  };

  const formatTime = (timeString) => {
    try {
      if (!timeString) return "غير محدد";
      const date = new Date(timeString);
      if (isNaN(date.getTime())) return "غير محدد";

      return date.toLocaleTimeString("ar-DZ", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "غير محدد";
    }
  };

  const pendingSessions = sessions.filter(
    (session) => session.needs_status_confirmation,
  );

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-sm text-muted-foreground">جاري تحميل الجلسات...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
          <p className="text-sm text-destructive mb-4">{error}</p>
          <Button onClick={fetchSessions} variant="outline">
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">لا توجد جلسات</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {pendingSessions.length > 0 && (
        <Alert className="mb-4" dir="rtl">
          <AlertTitle>جلسات تحتاج إلى تأكيد</AlertTitle>
          <AlertDescription className="space-y-3 text-right">
            <p>
              هناك {pendingSessions.length} جلسة انتهى توقيتها وما زالت بانتظار
              تحديد حالتها.
            </p>
            <div className="flex items-center justify-end gap-2">
              <Button
                size="sm"
                onClick={() => openStatusDialog(pendingSessions[0], "complete")}
              >
                <CheckCircle2 className="ml-2 h-4 w-4" />
                تأكيد كمنتهية
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openStatusDialog(pendingSessions[0], "cancel")}
              >
                <Ban className="ml-2 h-4 w-4" />
                إلغاء مع سبب
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">المعلم</TableHead>
              <TableHead className="text-right">نوع الجلسة</TableHead>
              <TableHead className="text-right">السنة المستهدفة</TableHead>
              <TableHead className="text-right">الفرع</TableHead>
              <TableHead className="text-right">التاريخ/الأيام</TableHead>
              <TableHead className="text-right">الوقت</TableHead>
              <TableHead className="text-right">المدة</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session) => {
              const statusRaw = session.status_raw;
              const isPending = statusRaw === null || statusRaw === undefined;
              const isCancelled = statusRaw === "cancelled";

              return (
                <TableRow 
                  key={session.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSessionClick(session)}
                >
                  <TableCell className="font-medium text-right">
                    {session.teacher?.firstName && session.teacher?.lastName
                      ? `${session.teacher.firstName} ${session.teacher.lastName}`
                      : session.teacher_name || "غير محدد"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={session.sessionType === "ONE_TIME" ? "default" : "secondary"}>
                      {session.sessionType === "ONE_TIME" ? "مرة واحدة" : "متكررة"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {session.middleSchoolGrade 
                      ? `${session.middleSchoolGrade} متوسط`
                      : session.highSchoolGrade 
                        ? `${session.highSchoolGrade} ثانوي` 
                        : getYearTargetInArabic(session.year_target)}
                  </TableCell>
                  <TableCell className="text-right">
                    {session.branch || "غير محدد"}
                  </TableCell>
                  <TableCell className="text-right">
                    {session.sessionType === "ONE_TIME" 
                      ? formatDate(session.dateTime) 
                      : session.repeatDays && session.repeatDays.length > 0
                        ? session.repeatDays.map(day => {
                            const dayMap = {
                              'MONDAY': 'الإثنين',
                              'TUESDAY': 'الثلاثاء',
                              'WEDNESDAY': 'الأربعاء',
                              'THURSDAY': 'الخميس',
                              'FRIDAY': 'الجمعة',
                              'SATURDAY': 'السبت',
                              'SUNDAY': 'الأحد'
                            };
                            return dayMap[day] || day;
                          }).join(', ')
                        : "غير محدد"}
                  </TableCell>
                  <TableCell className="text-right">
                    {session.sessionType === "ONE_TIME"
                      ? session.dateTime ? formatTime(session.dateTime) : "غير محدد"
                      : session.startTime || "غير محدد"}
                  </TableCell>
                  <TableCell className="text-right">
                    {session.duration ? `${session.duration} دقيقة` : "غير محدد"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="h-8 w-8 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="sr-only">فتح القائمة</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setSessionToEdit(session);
                            setEditDialogOpen(true);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          تعديل
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Info */}
      {pagination.total > 0 && (
        <div className="flex items-center justify-between px-2 py-4">
          <div className="text-sm text-muted-foreground">
            عرض {sessions.length} من {pagination.total} جلسة
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground">
              الصفحة {pagination.current_page} من {pagination.last_page}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || loading}
              >
                <ChevronRight className="h-4 w-4 ml-1" />
                السابق
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.min(pagination.last_page, prev + 1),
                  )
                }
                disabled={currentPage === pagination.last_page || loading}
              >
                التالي
                <ChevronLeft className="h-4 w-4 mr-1" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog
        open={statusDialogOpen}
        onOpenChange={handleStatusDialogOpenChange}
      >
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">
              {statusDialogAction === "cancel"
                ? "إلغاء الجلسة"
                : "تأكيد إنهاء الجلسة"}
            </DialogTitle>
            <DialogDescription className="text-right space-y-2">
              {selectedSession && (
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-medium">الأستاذ:</span>
                    <span>{selectedSession.teacher_name || "غير محدد"}</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-medium">المادة:</span>
                    <span>{selectedSession.module || "غير محدد"}</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-medium">التاريخ:</span>
                    <span>{formatDate(selectedSession.start_time)}</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-medium">الوقت:</span>
                    <span>{formatTime(selectedSession.start_time)}</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-medium">المدة:</span>
                    <span>{selectedSession.duration || "غير محدد"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">السنة المستهدفة:</span>
                    <span>
                      {getYearTargetInArabic(selectedSession.year_target)}
                    </span>
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          {statusDialogAction === "cancel" && (
            <div className="space-y-2 mt-4">
              <label
                htmlFor="cancel-reason"
                className="block text-sm font-medium text-right"
              >
                سبب الإلغاء <span className="text-red-500">*</span>
              </label>
              <Textarea
                id="cancel-reason"
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
                placeholder="اشرح بإيجاز سبب إلغاء الجلسة (مثال: غياب الأستاذ، ظروف طارئة، إلخ...)"
                className="text-right"
                rows={4}
                disabled={statusUpdating}
              />
            </div>
          )}

          {statusDialogAction === "complete" && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800 text-right">
                ✓ سيتم تعليم هذه الجلسة كمكتملة وسيظهر ذلك في جميع جداول
                التقارير.
              </p>
            </div>
          )}

          <DialogFooter className="sm:flex-row-reverse sm:space-x-reverse mt-4">
            <Button
              onClick={handleStatusSubmit}
              disabled={statusUpdating || !statusDialogAction}
              className={
                statusDialogAction === "cancel"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
              }
            >
              {statusUpdating ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : statusDialogAction === "cancel" ? (
                "تأكيد الإلغاء"
              ) : (
                "تأكيد الانتهاء"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleStatusDialogOpenChange(false)}
              disabled={statusUpdating}
            >
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Session Modal */}
      <EditSessionModal
        session={sessionToEdit}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSessionUpdated={() => {
          fetchSessions();
          setSessionToEdit(null);
        }}
      />

      {/* Session Instances Dialog */}
      <Dialog open={instancesDialogOpen} onOpenChange={handleInstancesDialogClose}>
        <DialogContent className="max-w-4xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">
              تفاصيل الجلسة - {selectedSessionForInstances?.teacher_name || "غير محدد"}
            </DialogTitle>
            <DialogDescription className="text-right">
              عرض جميع حالات الجلسة
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {instancesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="mr-2">جاري تحميل التفاصيل...</span>
              </div>
            ) : sessionInstances.length > 0 ? (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">التاريخ</TableHead>
                        <TableHead className="text-right">الوقت</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-right">الحضور</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessionInstances.map((instance, index) => (
                        <TableRow key={instance.id || index}>
                          <TableCell className="text-right">
                            {formatDate(instance.dateTime)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatTime(instance.dateTime)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge 
                              variant={
                                instance.status === "COMPLETED" ? "default" :
                                instance.status === "CANCELLED" ? "destructive" :
                                "secondary"
                              }
                            >
                              {instance.status === "COMPLETED" ? "مكتملة" :
                               instance.status === "CANCELLED" ? "ملغية" :
                               "مجدولة"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {instance.attendance_count || 0} طالب
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination for Instances - Always show when there are instances */}
                {instancesPagination.total > 0 && (
                  <div className="flex items-center justify-between px-2">
                    <div className="text-sm text-muted-foreground">
                      عرض {sessionInstances.length} من {instancesPagination.total} حالة
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-muted-foreground">
                        الصفحة {instancesPagination.page} من {instancesPagination.totalPages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleInstancesPageChange(instancesPage - 1)}
                          disabled={instancesPage === 1 || instancesLoading}
                        >
                          <ChevronRight className="h-4 w-4 ml-1" />
                          السابق
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleInstancesPageChange(instancesPage + 1)}
                          disabled={instancesPage === instancesPagination.totalPages || instancesLoading}
                        >
                          التالي
                          <ChevronLeft className="h-4 w-4 mr-1" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">لا توجد تفاصيل متاحة لهذه الجلسة</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleInstancesDialogClose}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
