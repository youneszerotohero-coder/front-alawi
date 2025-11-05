import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  User,
  Clock,
  CheckCircle,
  XCircle,
  CreditCard,
  Calendar,
  Loader2,
  Repeat,
} from "lucide-react";
import { paymentService } from "@/services/api/payment.service";
import { attendanceService } from "@/services/api/attendance.service";
import { toast } from "sonner";

const currencyFormatter = new Intl.NumberFormat("ar-DZ", {
  style: "currency",
  currency: "DZD",
  maximumFractionDigits: 0,
});

const formatCurrency = (value) => {
  if (value === undefined || value === null || value === "") {
    return "—";
  }
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return "—";
  }
  return currencyFormatter.format(numericValue);
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ar-DZ", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

const formatTime = (timeString) => {
  if (!timeString) return "—";
  
  // If it's just a time string like "14:30"
  if (typeof timeString === 'string' && timeString.match(/^\d{2}:\d{2}$/)) {
    return timeString;
  }
  
  // If it's a full date-time
  const date = new Date(timeString);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleTimeString("ar-DZ", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatAttendanceTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("ar-DZ", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function StudentCheckinDialog({ student, open, onOpenChange }) {
  const [todaysSessions, setTodaysSessions] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [checkingIn, setCheckingIn] = useState({});
  const [paymentConfirmation, setPaymentConfirmation] = useState(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [isProcessingConfirmation, setIsProcessingConfirmation] = useState(false);

  // Check if student has free subscription
  const isFreeStudent = student?.data?.student?.hasFreeSubscription || false;

  useEffect(() => {
    if (open && student?.data) {
      const data = student.data;
      
      // Set today's sessions
      const todaySessions = Array.isArray(data.todaysSessions)
        ? data.todaysSessions
        : [];
      setTodaysSessions(todaySessions);

      // Set upcoming sessions (previously called repetitive sessions)
      const upcoming = Array.isArray(data.upcomingSessions)
        ? data.upcomingSessions
        : [];
      setUpcomingSessions(upcoming);
    }
  }, [open, student]);

  // Handle payment for a session
  const handlePayment = async (session, sessionsCount) => {
    const key = `${session.id}-payment`;
    setCheckingIn((prev) => ({ ...prev, [key]: true }));

    try {
      const studentId = student?.data?.student?.id;
      if (!studentId) {
        toast.error("معرف الطالب غير موجود");
        return { success: false };
      }

      // Validate session data
      if (!session?.id) {
        toast.error("معرف الجلسة غير موجود");
        return { success: false };
      }

      if (!session?.pricePerSession || session.pricePerSession <= 0) {
        toast.error("سعر الجلسة غير صحيح");
        return { success: false };
      }

      if (!sessionsCount || sessionsCount <= 0) {
        toast.error("عدد الجلسات غير صحيح");
        return { success: false };
      }

      // Calculate amount
      const amount = session.pricePerSession * sessionsCount;

      // Validate calculated amount
      if (isNaN(amount) || amount <= 0) {
        toast.error("المبلغ المحسوب غير صحيح");
        return { success: false };
      }

      // Create payment data with validation
      const paymentData = {
        sessionId: session.id,
        studentId: studentId,
        amount: amount,
        sessionsCount: sessionsCount,
        paymentMethod: "cash",
      };

      // Log payment data for debugging
      console.log("Payment data being sent:", paymentData);

      // Create payment
      const paymentResponse = await paymentService.createPayment(paymentData);

      if (paymentResponse.success) {
        toast.success(
          sessionsCount === 1
            ? "تم دفع الجلسة بنجاح"
            : "تم دفع الاشتراك الشهري بنجاح"
        );

        // Update the session in state to reflect the payment
        const updateSessions = (sessions) =>
          sessions.map((s) =>
            s.id === session.id
              ? {
                  ...s,
                  hasActivePayment: true,
                  activePayment: paymentResponse.data,
                }
              : s
          );

        setTodaysSessions(updateSessions);
        setUpcomingSessions(updateSessions);

        return { success: true, payment: paymentResponse.data };
      }

      return { success: false };
    } catch (error) {
      console.error("Error processing payment:", error);
      const message = error.response?.data?.error || "خطأ في معالجة الدفع";
      toast.error(message);
      return { success: false, error };
    } finally {
      setCheckingIn((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Handle attendance marking
  const handleMarkAttendance = async (session) => {
    const key = `${session.id}-attendance`;
    setCheckingIn((prev) => ({ ...prev, [key]: true }));

    try {
      const studentId = student?.data?.student?.id;
      if (!studentId) {
        toast.error("معرف الطالب غير موجود");
        return { success: false };
      }

      // Mark attendance
      const attendanceResponse = await attendanceService.markAttendance(
        session.id,
        studentId
      );

      if (attendanceResponse.success) {
        toast.success("تم تسجيل الحضور بنجاح");

        // Update the session in state to reflect the attendance
        const updateSessions = (sessions) =>
          sessions.map((s) =>
            s.id === session.id
              ? {
                  ...s,
                  hasAttendanceToday: true,
                  attendanceToday: attendanceResponse.data,
                }
              : s
          );

        setTodaysSessions(updateSessions);
        setUpcomingSessions(updateSessions);

        // Notify other components to refresh
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("attendance:updated"));
        }

        return { success: true, attendance: attendanceResponse.data };
      }

      return { success: false };
    } catch (error) {
      console.error("Error marking attendance:", error);
      const message = error.response?.data?.error || "خطأ في تسجيل الحضور";
      toast.error(message);
      return { success: false, error };
    } finally {
      setCheckingIn((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleConfirmationOpenChange = (value) => {
    // Prevent closing if payment is being processed
    if (!value && isProcessingConfirmation) {
      return;
    }
    setConfirmationOpen(value);
    if (!value) {
      setPaymentConfirmation(null);
      setIsProcessingConfirmation(false);
    }
  };

  const openPaymentConfirmation = (session, sessionsCount) => {
    if (!session) return;

    const amount = session.pricePerSession * sessionsCount;
    const paymentType = sessionsCount === 1 ? "جلسة واحدة" : "اشتراك شهري (4 جلسات)";

    setPaymentConfirmation({
      session,
      sessionsCount,
      amount,
      paymentType,
    });
    setIsProcessingConfirmation(false);
    setConfirmationOpen(true);
  };

  const handleConfirmPayment = async (event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
    }

    if (!paymentConfirmation) {
      return;
    }
    
    // Validate amount before proceeding
    if (!paymentConfirmation.amount || paymentConfirmation.amount <= 0) {
      toast.error("المبلغ غير صحيح. يرجى التحقق من سعر الجلسة.");
      return;
    }

    setIsProcessingConfirmation(true);

    try {
      const { session, sessionsCount } = paymentConfirmation;

      const result = await handlePayment(session, sessionsCount);

      if (result?.success) {
        setConfirmationOpen(false);
        setPaymentConfirmation(null);
      }
    } catch (error) {
      console.error("Error confirming payment:", error);
      toast.error("حدث خطأ أثناء تأكيد الدفع");
    } finally {
      setIsProcessingConfirmation(false);
    }
  };

  const getPaymentStatus = (session) => {
    // Free students always have access
    if (isFreeStudent) {
      return {
        hasPayment: true,
        color: "bg-emerald-100 text-emerald-800 border-emerald-200",
        icon: CheckCircle,
        text: "طالب مجاني",
      };
    }

    // Check if session has active payment
    const hasPayment = session?.hasActivePayment || false;

    return {
      hasPayment,
      color: hasPayment
        ? "bg-green-100 text-green-800 border-green-200"
        : "bg-red-100 text-red-800 border-red-200",
      icon: hasPayment ? CheckCircle : XCircle,
      text: hasPayment ? "مدفوع" : "غير مدفوع",
    };
  };

  if (!student?.data) return null;

  const studentData = student.data.student;

  // Helper function to render a session row
  const renderSessionRow = (session) => {
    const paymentStatus = getPaymentStatus(session);
    const StatusIcon = paymentStatus.icon;
    const hasAttendance = session.hasAttendanceToday;
    const isProcessingPayment = checkingIn[`${session.id}-payment`];
    const isProcessingAttendance = checkingIn[`${session.id}-attendance`];

    return (
      <div key={session.id} className="border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-right flex-1">
            <h4 className="font-medium text-lg">{session.title}</h4>
            <p className="text-sm text-muted-foreground">
              {session.teacher?.firstName} {session.teacher?.lastName}
            </p>
            {session.startTime && (
              <p className="text-sm text-muted-foreground mt-1">
                <Clock className="h-3 w-3 inline ml-1" />
                {formatTime(session.startTime)} ({session.duration} دقيقة)
              </p>
            )}
          </div>
          <Badge className={paymentStatus.color}>
            <StatusIcon className="h-3 w-3 ml-1" />
            {paymentStatus.text}
          </Badge>
        </div>

        <Separator className="my-3" />

        {hasAttendance && (
          <div className="text-sm text-green-600 text-right mb-2">
            تم تسجيل الحضور
            {session.attendanceToday?.checkInTime &&
              ` عند ${formatAttendanceTime(session.attendanceToday.checkInTime)}`}
          </div>
        )}

        <div className="flex gap-2 justify-end">
          {paymentStatus.hasPayment ? (
            <Button
              onClick={() => handleMarkAttendance(session)}
              disabled={isProcessingAttendance || hasAttendance}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessingAttendance ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <CheckCircle className="h-4 w-4 ml-2" />
              )}
              {hasAttendance ? "تم تسجيل الحضور" : "تسجيل الحضور"}
            </Button>
          ) : (
            <>
              <Button
                onClick={() => openPaymentConfirmation(session, 1)}
                disabled={isProcessingPayment}
                variant="outline"
                className="border-orange-500 text-orange-600 hover:bg-orange-50"
              >
                {isProcessingPayment ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                ) : (
                  <CreditCard className="h-4 w-4 ml-2" />
                )}
                دفع جلسة ({formatCurrency(session.pricePerSession)})
              </Button>
              {/* Only show monthly payment button for REPETITIVE sessions */}
              {session.sessionType !== 'ONE_TIME' && (
                <Button
                  onClick={() => openPaymentConfirmation(session, 4)}
                  disabled={isProcessingPayment}
                  variant="outline"
                  className="border-blue-500 text-blue-600 hover:bg-blue-50"
                >
                  {isProcessingPayment ? (
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  ) : (
                    <Calendar className="h-4 w-4 ml-2" />
                  )}
                  دفع شهري ({formatCurrency(session.pricePerSession * 4)})
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        aria-describedby="student-checkin-description"
      >
        <DialogHeader>
          <DialogTitle className="text-right flex items-center gap-2">
            <User className="h-5 w-5" />
            معلومات الطالب - {studentData.firstName} {studentData.lastName}
          </DialogTitle>
          <div id="student-checkin-description" className="sr-only">
            تفاصيل حضور وجلسات الطالب
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Student Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-right text-lg">
                معلومات الطالب
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Student Photo */}
              <div className="flex justify-center mb-6">
                <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200 shadow-md">
                  <img
                    src={
                      studentData.picture ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(studentData.firstName || "")}+${encodeURIComponent(studentData.lastName || "")}&background=0D8ABC&color=fff&size=200`
                    }
                    alt={`${studentData.firstName} ${studentData.lastName}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(studentData.firstName || "")}+${encodeURIComponent(studentData.lastName || "")}&background=0D8ABC&color=fff&size=200`;
                    }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right">
                <div>
                  <p className="text-sm text-muted-foreground">الاسم الكامل</p>
                  <p className="font-medium">
                    {studentData.firstName} {studentData.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">المرحلة الدراسية</p>
                  <p className="font-medium">
                    {studentData.middleSchoolGrade || studentData.highSchoolGrade || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الهاتف</p>
                  <p className="font-medium">{studentData.phone || "—"}</p>
                </div>
                {studentData.hasFreeSubscription && (
                  <div className="col-span-full">
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                      <CheckCircle className="h-3 w-3 ml-1" />
                      طالب مجاني
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Today's Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-right flex items-center gap-2">
                <Clock className="h-5 w-5" />
                جلسات اليوم
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todaysSessions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  لا توجد جلسات لهذا اليوم
                </p>
              ) : (
                <div className="space-y-4">
                  {todaysSessions.map((session) => renderSessionRow(session))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Sessions */}
          {upcomingSessions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-right flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  الجلسات القادمة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingSessions.map((session) => renderSessionRow(session))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <AlertDialog
          open={confirmationOpen}
          onOpenChange={handleConfirmationOpenChange}
        >
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader className="text-right space-y-2">
              <AlertDialogTitle>تأكيد عملية الدفع</AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-muted-foreground text-right">
                يرجى مراجعة المعلومات التالية قبل تأكيد الدفع.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-3 text-right text-sm">
              <div>
                <span className="text-muted-foreground">الطالب:</span>{" "}
                {studentData.firstName} {studentData.lastName}
              </div>
              <div>
                <span className="text-muted-foreground">الجلسة:</span>{" "}
                {paymentConfirmation?.session?.title}
              </div>
              <div>
                <span className="text-muted-foreground">الأستاذ:</span>{" "}
                {paymentConfirmation?.session?.teacher?.firstName}{" "}
                {paymentConfirmation?.session?.teacher?.lastName}
              </div>
              <div>
                <span className="text-muted-foreground">نوع الدفع:</span>{" "}
                {paymentConfirmation?.paymentType}
              </div>
              <div>
                <span className="text-muted-foreground">المبلغ:</span>{" "}
                {formatCurrency(paymentConfirmation?.amount)}
              </div>
            </div>

            <AlertDialogFooter className="sm:justify-end">
              <AlertDialogCancel disabled={isProcessingConfirmation}>
                إلغاء
              </AlertDialogCancel>
              <Button
                onClick={handleConfirmPayment}
                disabled={isProcessingConfirmation}
                className="bg-green-600 hover:bg-green-700"
                type="button"
              >
                {isProcessingConfirmation ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    جاري التأكيد...
                  </span>
                ) : (
                  "تأكيد الدفع"
                )}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
