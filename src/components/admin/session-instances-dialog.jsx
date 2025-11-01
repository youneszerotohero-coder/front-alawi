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
  Play,
  TrendingUp,
} from "lucide-react";
import { sessionService } from "@/services/api/session.service";

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
      const resp = await sessionService.getSession(session.id, { limit: 4 });
      const apiInstances = resp?.data?.sessionInstances || [];
      setInstances(apiInstances);
    } catch (err) {
      console.error("Error loading session instances:", err);
      setError("تعذر تحميل تفاصيل الجلسة");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (value) => {
    try {
      if (!value) return "غير محدد";
      const date = new Date(value);
      if (isNaN(date.getTime())) return "غير محدد";
      return date.toLocaleDateString("ar-DZ");
    } catch {
      return "غير محدد";
    }
  };

  const formatTime = (value) => {
    try {
      if (!value) return "غير محدد";
      const date = typeof value === "string" && value.includes("T")
        ? new Date(value)
        : new Date(`2000-01-01T${value}`);
      if (isNaN(date.getTime())) return "غير محدد";
      return date.toLocaleTimeString("ar-DZ", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "غير محدد";
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("ar-DZ").format(amount) + " دج";
  };

  const getStatusColor = (statusLabel) => {
    switch (statusLabel) {
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

  const statusToArabic = (statusEnum) => {
    if (!statusEnum) return "مجدولة";
    if (statusEnum === "COMPLETED") return "مكتملة";
    if (statusEnum === "CANCELLED") return "ملغية";
    return "مجدولة";
  };

  if (!session) return null;

  const instancesArray = Array.isArray(instances) ? instances : [];
  const totalRevenue = instancesArray.reduce((sum, it) => sum + (it.revenue || 0), 0);
  const totalTeacherShare = instancesArray.reduce((sum, it) => sum + (it.teacher_share || 0), 0);
  const totalSchoolShare = instancesArray.reduce((sum, it) => sum + (it.school_share || 0), 0);

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
                    {session.module || session.title || "غير محدد"}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{session.dateTime ? formatDate(session.dateTime) : formatDate(session.date)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{session.dateTime ? formatTime(session.dateTime) : formatTime(session.start_time)}</span>
                    </div>
                    <Badge className={getStatusColor(statusToArabic(session.status))}>
                      {statusToArabic(session.status)}
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

          {/* Summary Statistics removed per request */}

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

              {!loading && !error && instancesArray.length === 0 && (
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
                        <TableHead className="text-right">الإيراد</TableHead>
                        <TableHead className="text-right">حصة الأستاذ</TableHead>
                        <TableHead className="text-right">حصة المدرسة</TableHead>
                        <TableHead className="text-right">الدفع</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {instancesArray.map((instance) => {
                        const dateVal = instance.dateTime || instance.date;
                        const statusLabel = statusToArabic(instance.status);
                        return (
                          <TableRow key={instance.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">
                              {formatDate(dateVal)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-gray-500" />
                                {formatTime(dateVal)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={`text-xs ${getStatusColor(statusLabel)}`}>
                                {statusLabel}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <UserCheck className="h-3 w-3 text-green-500" />
                                {instance._count?.attendances ?? instance.attendance_count ?? 0}
                              </div>
                            </TableCell>
                            
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3 text-green-500" />
                                {formatCurrency(instance.revenue || 0)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-green-600 font-medium">
                                {formatCurrency(instance.teacher_share || 0)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-blue-600 font-medium">
                                {formatCurrency(instance.school_share || 0)}
                              </span>
                            </TableCell>
                            <TableCell>
                              {instance.isPaid ? (
                                <Badge className="bg-green-100 text-green-800">مدفوع</Badge>
                              ) : instance.status === 'CANCELLED' ? (
                                <Button size="sm" variant="outline" disabled>
                                  ملغية
                                </Button>
                              ) : (
                                <Button size="sm" onClick={async () => {
                                  try {
                                    const res = await fetch(`/api/v1/session-instances/${instance.id}/pay`, { method: 'POST', credentials: 'include' });
                                    if (!res.ok) throw new Error('Failed to mark paid');
                                    await loadSessionInstances();
                                  } catch (e) {
                                    console.error(e);
                                    alert('تعذر وضع الحالة كمدفوعة');
                                  }
                                }}>دفع</Button>
                              )}
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
    </Dialog>
  );
}
