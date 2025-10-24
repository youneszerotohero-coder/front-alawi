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
  DollarSign,
  Calendar,
  Clock,
  X,
  RefreshCw,
  UserCheck,
  UserX,
  AlertCircle,
  TrendingUp,
  BookOpen,
  Play,
} from "lucide-react";

export function SessionInstancesDialog({ session, open, onOpenChange }) {
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && session) {
      loadSessionInstances();
    }
  }, [open, session]);

  const loadSessionInstances = async () => {
    if (!session) return;

    setLoading(true);
    setError(null);
    try {
      // Mock data for now - replace with actual API call
      const mockInstances = [
        {
          id: 1,
          date: "2024-01-15",
          start_time: "10:00",
          end_time: "12:00",
          status: "مكتملة",
          attendance_count: 24,
          total_students: 25,
          revenue: 1200,
          teacher_share: 720,
          school_share: 480,
          attendance_rate: 96,
        },
        {
          id: 2,
          date: "2024-01-08",
          start_time: "10:00",
          end_time: "12:00",
          status: "مكتملة",
          attendance_count: 22,
          total_students: 25,
          revenue: 1100,
          teacher_share: 660,
          school_share: 440,
          attendance_rate: 88,
        },
        {
          id: 3,
          date: "2024-01-01",
          start_time: "10:00",
          end_time: "12:00",
          status: "مكتملة",
          attendance_count: 25,
          total_students: 25,
          revenue: 1250,
          teacher_share: 750,
          school_share: 500,
          attendance_rate: 100,
        },
        {
          id: 4,
          date: "2023-12-25",
          start_time: "10:00",
          end_time: "12:00",
          status: "ملغية",
          attendance_count: 0,
          total_students: 25,
          revenue: 0,
          teacher_share: 0,
          school_share: 0,
          attendance_rate: 0,
        },
      ];
      
      setInstances(mockInstances);
    } catch (err) {
      console.error("Error loading session instances:", err);
      setError("تعذر تحميل تفاصيل الجلسة");
    } finally {
      setLoading(false);
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("ar-DZ").format(amount) + " دج";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "مكتملة":
        return "bg-green-100 text-green-800";
      case "جارية":
        return "bg-blue-100 text-blue-800";
      case "قادمة":
        return "bg-yellow-100 text-yellow-800";
      case "ملغية":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getAttendanceRateColor = (rate) => {
    if (rate >= 90) return "text-green-600";
    if (rate >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  if (!session) return null;

  // Calculate totals
  const totalRevenue = instances.reduce((sum, instance) => sum + instance.revenue, 0);
  const totalTeacherShare = instances.reduce((sum, instance) => sum + instance.teacher_share, 0);
  const totalSchoolShare = instances.reduce((sum, instance) => sum + instance.school_share, 0);
  const totalAttendance = instances.reduce((sum, instance) => sum + instance.attendance_count, 0);
  const totalStudents = instances.reduce((sum, instance) => sum + instance.total_students, 0);
  const averageAttendanceRate = totalStudents > 0 ? (totalAttendance / totalStudents) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-6xl max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Play className="h-6 w-6 text-blue-500" />
              تفاصيل الجلسة
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Session Basic Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {session.module || "غير محدد"}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(session.date)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{formatTime(session.start_time)}</span>
                    </div>
                    <Badge className={getStatusColor(session.status)}>
                      {session.status}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadSessionInstances}
                  disabled={loading}
                  className="flex items-center gap-1"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  />
                  تحديث
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <h4 className="font-semibold text-green-800">إجمالي الإيرادات</h4>
                </div>
                <p className="text-2xl font-bold text-green-700">
                  {formatCurrency(totalRevenue)}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-800">إجمالي الحضور</h4>
                </div>
                <p className="text-2xl font-bold text-blue-700">
                  {totalAttendance} / {totalStudents}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  <h4 className="font-semibold text-purple-800">معدل الحضور</h4>
                </div>
                <p className={`text-2xl font-bold ${getAttendanceRateColor(averageAttendanceRate)}`}>
                  {averageAttendanceRate.toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Play className="h-5 w-5 text-amber-600" />
                  <h4 className="font-semibold text-amber-800">عدد الجلسات</h4>
                </div>
                <p className="text-2xl font-bold text-amber-700">
                  {instances.length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                تفصيل الإيرادات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <h4 className="font-semibold text-green-800">حصة الأستاذ</h4>
                  </div>
                  <p className="text-xl font-bold text-green-700">
                    {formatCurrency(totalTeacherShare)}
                  </p>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                    <h4 className="font-semibold text-blue-800">حصة المدرسة</h4>
                  </div>
                  <p className="text-xl font-bold text-blue-700">
                    {formatCurrency(totalSchoolShare)}
                  </p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                    <h4 className="font-semibold text-purple-800">متوسط الإيراد</h4>
                  </div>
                  <p className="text-xl font-bold text-purple-700">
                    {formatCurrency(totalRevenue / instances.length || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Session Instances Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                تفاصيل الجلسات
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading && (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
                  <p className="text-gray-600">جاري تحميل تفاصيل الجلسات...</p>
                </div>
              )}

              {error && (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-red-300 mx-auto mb-4" />
                  <p className="text-red-600 mb-4">{error}</p>
                  <Button onClick={loadSessionInstances} variant="outline">
                    إعادة المحاولة
                  </Button>
                </div>
              )}

              {!loading && !error && instances.length === 0 && (
                <div className="text-center py-8">
                  <Play className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">لا توجد جلسات متاحة</p>
                </div>
              )}

              {!loading && !error && instances.length > 0 && (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">التاريخ</TableHead>
                        <TableHead className="text-right">الوقت</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-right">الحضور</TableHead>
                        <TableHead className="text-right">معدل الحضور</TableHead>
                        <TableHead className="text-right">الإيراد</TableHead>
                        <TableHead className="text-right">حصة الأستاذ</TableHead>
                        <TableHead className="text-right">حصة المدرسة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {instances.map((instance) => (
                        <TableRow key={instance.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">
                            {formatDate(instance.date)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-gray-500" />
                              {formatTime(instance.start_time)} - {formatTime(instance.end_time)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`text-xs ${getStatusColor(instance.status)}`}>
                              {instance.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <UserCheck className="h-3 w-3 text-green-500" />
                              {instance.attendance_count} / {instance.total_students}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`font-medium ${getAttendanceRateColor(instance.attendance_rate)}`}>
                              {instance.attendance_rate}%
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3 text-green-500" />
                              {formatCurrency(instance.revenue)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-green-600 font-medium">
                              {formatCurrency(instance.teacher_share)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-blue-600 font-medium">
                              {formatCurrency(instance.school_share)}
                            </span>
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
    </Dialog>
  );
}
