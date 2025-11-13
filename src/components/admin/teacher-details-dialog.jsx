import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar,
  Phone,
  BookOpen,
  X,
  RefreshCw,
  Clock,
  Eye,
  Play,
  AlertCircle,
  KeyRound,
} from "lucide-react";
import { sessionService } from "@/services/api/session.service";
import AuthService from "@/services/api/auth.service";
import { SessionInstancesDialog } from "./session-instances-dialog";

export function TeacherDetailsDialog({ teacher, open, onOpenChange }) {
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    if (open && teacher) {
      loadSessions();
    }
  }, [open, teacher]);


  const loadSessions = async () => {
    if (!teacher) return;

    setSessionsLoading(true);
    try {
      const response = await sessionService.getSessions({
        teacherId: teacher.id,
        limit: 10,
      });
      setSessions(response.data || []);
    } catch (err) {
      console.error("Error loading sessions:", err);
    } finally {
      setSessionsLoading(false);
    }
  };

  // Removed teacher payouts section per request

  const formatDate = (dateString) => {
    try {
      if (!dateString) return "غير محدد";
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "غير محدد";
      return date.toLocaleDateString("ar-DZ");
    } catch {
      return "غير محدد";
    }
  };

  const formatTime = (timeString) => {
    try {
      if (!timeString) return "غير محدد";
      // Accept both ISO dateTime and HH:mm
      const date = timeString.includes("T")
        ? new Date(timeString)
        : new Date(`2000-01-01T${timeString}`);
      if (isNaN(date.getTime())) return "غير محدد";
      return date.toLocaleTimeString("ar-DZ", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "غير محدد";
    }
  };

  const getSessionStatusColor = (status) => {
    switch (status) {
      case "جارية":
        return "bg-blue-100 text-blue-800";
      case "قادمة":
        return "bg-yellow-100 text-yellow-800";
      case "مكتملة":
        return "bg-green-100 text-green-800";
      case "ملغية":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSessionTypeColor = (type) => {
    switch (type) {
      case "اشتراك":
        return "bg-green-100 text-green-800";
      case "مدفوعة":
        return "bg-blue-100 text-blue-800";
      case "مجانية":
        return "bg-gray-100 text-gray-800";
      case "معفي":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getGradeLabel = (session) => {
    // Prefer new fields
    const ms = session.middleSchoolGrade;
    const hs = session.highSchoolGrade;
    if (ms) {
      const map = {
        GRADE_1: "السنة الأولى متوسط",
        GRADE_2: "السنة الثانية متوسط",
        GRADE_3: "السنة الثالثة متوسط",
        GRADE_4: "السنة الرابعة متوسط",
      };
      return map[ms] || `متوسط (${ms})`;
    }
    if (hs) {
      const map = {
        GRADE_1: "السنة الأولى ثانوي",
        GRADE_2: "السنة الثانية ثانوي",
        GRADE_3: "السنة الثالثة ثانوي",
      };
      return map[hs] || `ثانوي (${hs})`;
    }
    // Legacy year_target fallback
    if (session.year_target) {
      const mapLegacy = {
        '1AM': 'السنة الأولى متوسط',
        '2AM': 'السنة الثانية متوسط',
        '3AM': 'السنة الثالثة متوسط',
        '4AM': 'السنة الرابعة متوسط',
        '1AS': 'السنة الأولى ثانوي',
        '2AS': 'السنة الثانية ثانوي',
        '3AS': 'السنة الثالثة ثانوي',
      };
      return mapLegacy[session.year_target] || session.year_target;
    }
    return "غير محدد";
  };

  const handleResetPassword = async () => {
    if (!teacher.phone) {
      alert("❌ خطأ\n\nالأستاذ لا يملك رقم هاتف");
      return;
    }

    const confirmMessage = `
🔑 إعادة تعيين كلمة المرور

هل أنت متأكد من إعادة تعيين كلمة المرور لهذا الأستاذ؟

الأستاذ: ${teacher.firstName} ${teacher.lastName}
الهاتف: ${teacher.phone}

سيتم تعيين كلمة المرور إلى: 00000000
    `;

    if (confirm(confirmMessage)) {
      try {
        // Find user by phone
        const user = await AuthService.getUserByPhone(teacher.phone);
        if (!user || !user.id) {
          alert("❌ خطأ\n\nلم يتم العثور على حساب مستخدم مرتبط بهذا الأستاذ");
          return;
        }

        await AuthService.resetPassword(user.id, "00000000");
        alert(`✅ تم بنجاح\n\nتم إعادة تعيين كلمة المرور إلى 00000000`);
      } catch (error) {
        console.error("Error resetting password:", error);
        const errorMessage =
          error.response?.data?.message || "فشل في إعادة تعيين كلمة المرور";
        alert(`❌ خطأ\n\n${errorMessage}`);
      }
    }
  };

  if (!teacher) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        <div className="space-y-6">
          {/* Actions */}
          <div className="flex gap-2 justify-start">
            <Button
              onClick={handleResetPassword}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <KeyRound className="h-4 w-4" />
              إعادة تعيين كلمة المرور
            </Button>
          </div>

          {/* Teacher Basic Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                {/* Teacher Avatar */}
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {teacher.firstName?.charAt(0) || "?"}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {teacher.firstName} {teacher.lastName}
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {teacher.module && (
                      <Badge variant="outline" className="text-blue-600 bg-blue-50">
                        {teacher.module_label || teacher.module}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    {teacher.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-blue-500" />
                        <span>{teacher.phone}</span>
                      </div>
                    )}
                    {teacher.years_labels && (
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-purple-500" />
                        <span>{teacher.years_labels}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>


          {/* Sessions Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Play className="h-5 w-5 text-blue-500" />
                  الجلسات الأخيرة
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadSessions}
                  disabled={sessionsLoading}
                  className="flex items-center gap-1"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${sessionsLoading ? "animate-spin" : ""}`}
                  />
                  تحديث
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {sessionsLoading && (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
                  <p className="text-gray-600">جاري تحميل الجلسات...</p>
                </div>
              )}

              {!sessionsLoading && sessions.length === 0 && (
                <div className="text-center py-8">
                  <Play className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">لا توجد جلسات متاحة</p>
                </div>
              )}

              {!sessionsLoading && sessions.length > 0 && (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">التاريخ</TableHead>
                        <TableHead className="text-right">الوقت</TableHead>
                        <TableHead className="text-right">النوع</TableHead>
                        <TableHead className="text-right">السنة</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-right">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessions.map((session) => {
                        const isOneTime = session.sessionType === "ONE_TIME";
                        const dateDisplay = isOneTime
                          ? formatDate(session.dateTime)
                          : Array.isArray(session.repeatDays) && session.repeatDays.length > 0
                            ? session.repeatDays.map((d) => ({
                                MONDAY: "الإثنين",
                                TUESDAY: "الثلاثاء",
                                WEDNESDAY: "الأربعاء",
                                THURSDAY: "الخميس",
                                FRIDAY: "الجمعة",
                                SATURDAY: "السبت",
                                SUNDAY: "الأحد",
                              }[d] || d)).join(", ")
                            : "غير محدد";
                        const timeDisplay = isOneTime
                          ? formatTime(session.dateTime)
                          : formatTime(session.startTime);
                        const typeDisplay = isOneTime ? "مرة واحدة" : "متكررة";
                        const statusDisplay = session.status === "COMPLETED"
                          ? "مكتملة"
                          : session.status === "CANCELLED"
                            ? "ملغية"
                            : "مجدولة";
                        const gradeDisplay = getGradeLabel(session);
                        return (
                        <TableRow key={session.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">
                            {dateDisplay}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-gray-500" />
                              {timeDisplay}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`text-xs ${getSessionTypeColor(typeDisplay)}`}
                            >
                              {typeDisplay}
                            </Badge>
                          </TableCell>
                            <TableCell>
                              {gradeDisplay}
                            </TableCell>
                          <TableCell>
                            <Badge
                              className={`text-xs ${getSessionStatusColor(statusDisplay)}`}
                            >
                              {statusDisplay}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedSession(session)}
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                            >
                              <Eye className="h-3 w-3" />
                              تفاصيل
                            </Button>
                          </TableCell>
                        </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>

      {/* Session Instances Dialog */}
      {selectedSession && (
        <SessionInstancesDialog
          session={selectedSession}
          open={!!selectedSession}
          onOpenChange={(open) => !open && setSelectedSession(null)}
        />
      )}

      {/* Teacher Payouts Section inside the dialog content above sessions list */}
    </Dialog>
  );
}
