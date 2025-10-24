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
  Users,
  Calendar,
  Phone,
  BookOpen,
  X,
  RefreshCw,
  Clock,
  Eye,
  Play,
  UserCheck,
  AlertCircle,
} from "lucide-react";
import { sessionService } from "@/services/api/session.service";
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("ar-DZ");
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("ar-DZ", {
      hour: "2-digit",
      minute: "2-digit",
    });
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

  if (!teacher) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        <div className="space-y-6">
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
                        <TableHead className="text-right">المادة</TableHead>
                        <TableHead className="text-right">النوع</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-right">الطلاب</TableHead>
                        <TableHead className="text-right">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessions.map((session) => (
                        <TableRow key={session.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">
                            {formatDate(session.date)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-gray-500" />
                              {formatTime(session.start_time)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <BookOpen className="h-3 w-3 text-purple-500" />
                              {session.module || "غير محدد"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`text-xs ${getSessionTypeColor(session.type)}`}
                            >
                              {session.type || "غير محدد"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`text-xs ${getSessionStatusColor(session.status)}`}
                            >
                              {session.status || "غير محدد"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3 text-blue-500" />
                              {session.students_count || 0}
                            </div>
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
                      ))}
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
    </Dialog>
  );
}
