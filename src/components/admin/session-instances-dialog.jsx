import { useState, useEffect, useCallback } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
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
  FileText,
} from "lucide-react";
import { sessionService } from "@/services/api/session.service";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export function SessionInstancesDialog({ session, open, onOpenChange }) {
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [selectedInstances, setSelectedInstances] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [pagination, setPagination] = useState(null);

  const loadSessionInstances = useCallback(async (page = 1, isInitialLoad = false) => {
    if (!session) return;

    if (isInitialLoad) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);
    
    try {
      const resp = await sessionService.getSession(session.id, { 
        page, 
        limit: 4 
      });
      const apiInstances = resp?.data?.sessionInstances || [];
      const instancesPagination = resp?.instancesPagination;
      
      if (isInitialLoad) {
        setInstances(apiInstances);
      } else {
        // Append new instances to existing ones
        setInstances(prev => [...prev, ...apiInstances]);
      }
      
      // Update pagination state
      if (instancesPagination) {
        setPagination(instancesPagination);
        const totalPages = instancesPagination.totalPages || 1;
        setHasMore(page < totalPages);
        setCurrentPage(page);
      } else {
        // Fallback: if no pagination info, assume no more if we got less than limit
        setHasMore(apiInstances.length >= 4);
        setCurrentPage(page);
      }
    } catch (err) {
      console.error("Error loading session instances:", err);
      setError("تعذر تحميل تفاصيل الجلسة");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [session]);

  useEffect(() => {
    if (open && session) {
      // Reset state when dialog opens
      setInstances([]);
      setCurrentPage(1);
      setHasMore(false);
      setPagination(null);
      loadSessionInstances(1, true);
      setSelectedInstances(new Set());
    }
  }, [open, session, loadSessionInstances]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadSessionInstances(currentPage + 1, false);
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

  const handleToggleSelect = (instanceId) => {
    const newSelected = new Set(selectedInstances);
    if (newSelected.has(instanceId)) {
      newSelected.delete(instanceId);
    } else {
      newSelected.add(instanceId);
    }
    setSelectedInstances(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedInstances.size === instancesArray.length) {
      setSelectedInstances(new Set());
    } else {
      setSelectedInstances(new Set(instancesArray.map((i) => i.id)));
    }
  };

  const formatCurrencyForPDF = (amount) => {
    return new Intl.NumberFormat("ar-DZ").format(amount);
  };

  const generatePDF = async () => {
    if (selectedInstances.size === 0) {
      alert("يرجى تحديد صف واحد على الأقل");
      return;
    }

    const selectedData = instancesArray.filter((instance) =>
      selectedInstances.has(instance.id)
    );

    // Calculate totals
    const totalAttendance = selectedData.reduce(
      (sum, it) => sum + (it._count?.attendances ?? it.attendance_count ?? 0),
      0
    );
    const totalFreeAttendance = selectedData.reduce(
      (sum, it) => sum + (it.free_attendance_count ?? 0),
      0
    );
    const totalRevenue = selectedData.reduce(
      (sum, it) => sum + (it.revenue || 0),
      0
    );
    const totalTeacherShare = selectedData.reduce(
      (sum, it) => sum + (it.teacher_share || 0),
      0
    );
    const totalSchoolShare = selectedData.reduce(
      (sum, it) => sum + (it.school_share || 0),
      0
    );

    // Create a temporary container for the PDF content
    const tempContainer = document.createElement("div");
    tempContainer.style.position = "absolute";
    tempContainer.style.left = "-9999px";
    tempContainer.style.width = "1200px";
    tempContainer.style.padding = "20px";
    tempContainer.style.backgroundColor = "white";
    tempContainer.style.fontFamily = "Arial, sans-serif";
    tempContainer.style.direction = "rtl";
    tempContainer.style.textAlign = "right";

    // Create header
    const header = document.createElement("div");
    header.style.marginBottom = "20px";
    header.innerHTML = `
      <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">تقرير الجلسات</h1>
      <p style="font-size: 14px; margin-bottom: 5px;">الجلسة: ${session.module || session.title || "غير محدد"}</p>
      <p style="font-size: 12px;">تاريخ التقرير: ${new Date().toLocaleDateString("ar-DZ")}</p>
    `;
    tempContainer.appendChild(header);

    // Create table
    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";
    table.style.marginBottom = "20px";

    // Table header
    const thead = document.createElement("thead");
    thead.innerHTML = `
      <tr style="background-color: #f3f4f6;">
        <th style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">التاريخ</th>
        <th style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">الوقت</th>
        <th style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">الحالة</th>
        <th style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">الحضور</th>
        <th style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">اعفاء</th>
        <th style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">الإيراد</th>
        <th style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">حصة الأستاذ</th>
        <th style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">حصة المدرسة</th>
        <th style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">الدفع</th>
      </tr>
    `;
    table.appendChild(thead);

    // Table body
    const tbody = document.createElement("tbody");
    selectedData.forEach((instance) => {
      const dateVal = instance.dateTime || instance.date;
      const statusLabel = statusToArabic(instance.status);
      const attendanceCount = instance._count?.attendances ?? instance.attendance_count ?? 0;
      const freeAttendanceCount = instance.free_attendance_count ?? 0;

      const row = document.createElement("tr");
      row.innerHTML = `
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatDate(dateVal)}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatTime(dateVal)}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${statusLabel}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${attendanceCount}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${freeAttendanceCount}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(instance.revenue || 0)}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(instance.teacher_share || 0)}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(instance.school_share || 0)}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${instance.isPaid ? "مدفوع" : "غير مدفوع"}</td>
      `;
      tbody.appendChild(row);
    });

    // Totals row
    const totalsRow = document.createElement("tr");
    totalsRow.style.backgroundColor = "#f9fafb";
    totalsRow.style.fontWeight = "bold";
    totalsRow.innerHTML = `
      <td colspan="3" style="border: 1px solid #ddd; padding: 8px; text-align: right;">الإجمالي</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${totalAttendance}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${totalFreeAttendance}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(totalRevenue)}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(totalTeacherShare)}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(totalSchoolShare)}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;"></td>
    `;
    tbody.appendChild(totalsRow);

    table.appendChild(tbody);
    tempContainer.appendChild(table);

    // Append to body temporarily
    document.body.appendChild(tempContainer);

    try {
      // Convert to canvas
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      // Create PDF
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 297; // A4 width in mm (landscape)
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

      // Download PDF
      const fileName = `تقرير_جلسات_${new Date().getTime()}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("حدث خطأ أثناء إنشاء التقرير");
    } finally {
      // Remove temporary container
      document.body.removeChild(tempContainer);
    }
  };

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
                  onClick={() => {
                    setInstances([]);
                    setCurrentPage(1);
                    setHasMore(false);
                    loadSessionInstances(1, true);
                  }}
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
                  <div className="flex items-center justify-between mb-4">
                    <Button
                      onClick={generatePDF}
                      disabled={selectedInstances.size === 0}
                      className="flex items-center gap-2"
                      variant="default"
                    >
                      <FileText className="h-4 w-4" />
                      تقرير ({selectedInstances.size})
                    </Button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedInstances.size === instancesArray.length && instancesArray.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead className="text-right">التاريخ</TableHead>
                        <TableHead className="text-right">الوقت</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-right">الحضور</TableHead>
                        <TableHead className="text-right">اعفاء</TableHead>
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
                            <TableCell>
                              <Checkbox
                                checked={selectedInstances.has(instance.id)}
                                onCheckedChange={() => handleToggleSelect(instance.id)}
                              />
                            </TableCell>
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
                                <UserX className="h-3 w-3 text-blue-500" />
                                {instance.free_attendance_count ?? 0}
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
                  
                  {/* Load More Button */}
                  {hasMore && (
                    <div className="flex justify-center mt-4">
                      <Button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        {loadingMore ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            جاري التحميل...
                          </>
                        ) : (
                          <>
                            تحميل المزيد
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                  
                  {/* Pagination Info */}
                  {pagination && (
                    <div className="text-center text-sm text-gray-500 mt-2">
                      صفحة {pagination.page || currentPage} من {pagination.totalPages || 1} 
                      {" "}({pagination.total || instances.length} إجمالي)
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
