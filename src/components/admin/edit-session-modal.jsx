import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { sessionService } from "@/services/api/session.service";
import { teacherService } from "@/services/api/teacher.service";
import { useToast } from "@/hooks/use-toast";
import { cacheService } from "@/services/cache.service";
import { invalidateDashboardCache } from "@/hooks/useDashboardData"; // ⚡ Invalidate dashboard

const HIGH_SCHOOL_YEARS = ["1AS", "2AS", "3AS"];

// Static branch options - same as register page
const BRANCH_OPTIONS = {
  "1AS": [
    { value: "SCIENTIFIC", label: "علمي" },
    { value: "LITERARY", label: "أدبي" },
  ],
  "2AS": [
    { value: "LANGUAGES", label: "آداب ولغات" },
    { value: "PHILOSOPHY", label: "فلسفة" },
    { value: "ELECTRICAL", label: "كهرباء" },
    { value: "MECHANICAL", label: "ميكانيك" },
    { value: "CIVIL", label: "مدني" },
    { value: "INDUSTRIAL", label: "صناعي" },
    { value: "MATHEMATIC", label: "رياضيات" },
    { value: "GESTION", label: "تسيير" },
    { value: "EXPERIMENTAL_SCIENCES", label: "علوم تجريبية" },
  ],
  "3AS": [
    { value: "LANGUAGES", label: "آداب ولغات" },
    { value: "PHILOSOPHY", label: "فلسفة" },
    { value: "ELECTRICAL", label: "كهرباء" },
    { value: "MECHANICAL", label: "ميكانيك" },
    { value: "CIVIL", label: "مدني" },
    { value: "INDUSTRIAL", label: "صناعي" },
    { value: "MATHEMATIC", label: "رياضيات" },
    { value: "GESTION", label: "تسيير" },
    { value: "EXPERIMENTAL_SCIENCES", label: "علوم تجريبية" },
  ],
};

export function EditSessionModal({
  session,
  open,
  onOpenChange,
  onSessionUpdated,
}) {
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    teacher: "",
    year_target: "1AM",
    branch_ids: [],
    date: "",
    time: "",
    duration: "",
    pricePerSession: "",
  });
  const [availableBranches, setAvailableBranches] = useState([]);

  // Initialize form data when session prop changes
  useEffect(() => {
    if (session && open) {
      // Extract date and time from start_time with proper validation
      let date = "";
      let time = "";
      let duration = "1h";

      // Handle date/time extraction safely based on session type
      if (session.sessionType === 'ONE_TIME' && session.dateTime) {
        const sessionDateTime = new Date(session.dateTime);
        if (!isNaN(sessionDateTime.getTime())) {
          date = sessionDateTime.toISOString().split("T")[0];
          time = sessionDateTime.toTimeString().slice(0, 5);
        }
      } else if (session.sessionType === 'REPETITIVE' && session.startTime) {
        // For repetitive sessions, use current date with the session's start time
        const now = new Date();
        date = now.toISOString().split("T")[0];
        time = session.startTime; // startTime is already in "HH:mm" format
      }

      // Calculate duration from session duration (in minutes)
      if (session.duration) {
        const durationMinutes = session.duration;
        const durationHours = durationMinutes / 60;
        
        if (durationHours === 1) duration = "1h";
        else if (durationHours === 1.5) duration = "1.5h";
        else if (durationHours === 2) duration = "2h";
        else if (durationHours === 2.5) duration = "2.5h";
        else if (durationHours === 3) duration = "3h";
      }

      // Fallback to current date/time if no valid date found
      if (!date) {
        const now = new Date();
        date = now.toISOString().split("T")[0];
        time = now.toTimeString().slice(0, 5);
      }

      // Extract branch IDs - handle branches array
      const branchIds = [];
      if (session.branches && Array.isArray(session.branches)) {
        // Branches array from schema
        branchIds.push(...session.branches);
      } else if (session.branch) {
        // Backward compatibility: single branch
        branchIds.push(session.branch);
      }

      // Determine year_target from grade fields
      let yearTarget = "1AM"; // default
      if (session.middleSchoolGrade) {
        const gradeMap = {
          'GRADE_1': '1AM',
          'GRADE_2': '2AM', 
          'GRADE_3': '3AM',
          'GRADE_4': '4AM'
        };
        yearTarget = gradeMap[session.middleSchoolGrade] || "1AM";
      } else if (session.highSchoolGrade) {
        const gradeMap = {
          'GRADE_1': '1AS',
          'GRADE_2': '2AS',
          'GRADE_3': '3AS'
        };
        yearTarget = gradeMap[session.highSchoolGrade] || "1AS";
      }

      setFormData({
        teacher: session.teacherId || "",
        sessionType: session.sessionType || "ONE_TIME", // Preserve original session type
        year_target: yearTarget,
        branch_ids: branchIds,
        date: date,
        time: time,
        duration: duration,
        pricePerSession: session.pricePerSession || "",
        repeatDays: session.repeatDays || [], // For repetitive sessions
        startTime: session.startTime || "", // For repetitive sessions
      });

      fetchTeachers();
    }
  }, [session, open]);

  useEffect(() => {
    if (!open) {
      setAvailableBranches([]);
    }
  }, [open]);

  // Load branches when year changes - using static definitions
  useEffect(() => {
    if (
      formData.year_target &&
      HIGH_SCHOOL_YEARS.includes(formData.year_target)
    ) {
      // Use static branch options
      const branches = BRANCH_OPTIONS[formData.year_target] || [];
      setAvailableBranches(branches);
      
      // Keep existing selection if valid
      setFormData((prev) => {
        const validSelection = prev.branch_ids.filter((id) =>
          branches.some((branch) => branch.value === id),
        );
        return { ...prev, branch_ids: validSelection };
      });
    } else {
      setAvailableBranches([]);
      setFormData((prev) => ({ ...prev, branch_ids: [] }));
    }
  }, [formData.year_target]);

  const fetchTeachers = async () => {
    try {
      // Use cache service to avoid repeated API calls
      const data = await cacheService.getTeachers(async () => {
        const response = await teacherService.getTeachers();
        return response.data || [];
      });
      setTeachers(data);
    } catch (error) {
      console.error("Error fetching teachers:", error);
    }
  };

  const handleBranchToggle = (branchId, checked) => {
    setFormData((prev) => {
      const current = new Set(prev.branch_ids);
      if (checked) {
        current.add(branchId);
      } else {
        current.delete(branchId);
      }
      return { ...prev, branch_ids: Array.from(current) };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isHighSchoolYear = HIGH_SCHOOL_YEARS.includes(formData.year_target);

    if (isHighSchoolYear && formData.branch_ids.length === 0) {
      toast({
        title: "برجاء اختيار فرع",
        description:
          "يجب اختيار فرع واحد على الأقل للجلسات الخاصة بالطور الثانوي.",
        variant: "destructive",
      });
      return;
    }

    // Validate conditional fields based on session type
    if (formData.sessionType === "ONE_TIME") {
      if (!formData.date) {
        toast({
          title: "برجاء اختيار التاريخ",
          description: "يجب اختيار تاريخ للجلسة الواحدة.",
          variant: "destructive",
        });
        return;
      }
    } else if (formData.sessionType === "REPETITIVE") {
      if (!formData.startTime) {
        toast({
          title: "برجاء اختيار وقت البداية",
          description: "يجب اختيار وقت البداية للجلسات المتكررة.",
          variant: "destructive",
        });
        return;
      }
      if (formData.repeatDays.length === 0) {
        toast({
          title: "برجاء اختيار يوم التكرار",
          description: "يجب اختيار يوم التكرار للجلسات المتكررة.",
          variant: "destructive",
        });
        return;
      }
    }

    // Validate price per session
    if (!formData.pricePerSession || parseFloat(formData.pricePerSession) <= 0) {
      toast({
        title: "برجاء إدخال سعر صحيح",
        description: "يجب إدخال سعر الجلسة (يجب أن يكون أكبر من صفر).",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const sessionData =
        sessionService.transformSessionForSubmission(formData);
      await sessionService.updateSession(session.id, sessionData);

      // ⚡ Invalidate cache after session update
      cacheService.invalidateSessions();
      invalidateDashboardCache();
      console.log("🔄 Session updated - Cache invalidated");

      // Show success message
      const selectedTeacher = teachers.find((t) => t.id === formData.teacher);
      toast({
        title: "تم تحديث الجلسة بنجاح",
        description: `تم تعديل جلسة ${selectedTeacher ? `${selectedTeacher.firstName} ${selectedTeacher.lastName}` : "المعلم"} في ${formData.date}`,
      });

      onOpenChange(false);
      onSessionUpdated?.();
    } catch (error) {
      console.error("Error updating session:", error);
      const errorMessage =
        error.response?.data?.message || "فشل في تحديث الجلسة";
      toast({
        title: "خطأ في تحديث الجلسة",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!session) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle className="text-right">
            تعديل الجلسة #{session.id}
          </DialogTitle>
          <DialogDescription className="text-right">
            تحديث معلومات الجلسة التدريسية.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="teacher" className="text-right">
                المعلم
              </Label>
              <Select
                value={formData.teacher}
                onValueChange={(value) =>
                  setFormData({ ...formData, teacher: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="اختر المعلم" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.firstName} {teacher.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sessionType" className="text-right">
                نوع الجلسة
              </Label>
              <Select
                value={formData.sessionType}
                onValueChange={(value) =>
                  setFormData({ ...formData, sessionType: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="اختر نوع الجلسة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONE_TIME">جلسة واحدة</SelectItem>
                  <SelectItem value="REPETITIVE">جلسات متكررة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Conditional Fields Based on Session Type */}
            {formData.sessionType === "ONE_TIME" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  التاريخ
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
            )}

            {formData.sessionType === "REPETITIVE" && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="startTime" className="text-right">
                    وقت البداية
                  </Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>

                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right mt-2">أيام التكرار</Label>
                  <div className="col-span-3 space-y-2">
                    <Select
                      value={formData.repeatDays.length > 0 ? formData.repeatDays[0] : ""}
                      onValueChange={(value) => {
                        if (value) {
                          setFormData((prev) => ({
                            ...prev,
                            repeatDays: [value], // Single selection
                          }));
                        } else {
                          setFormData((prev) => ({
                            ...prev,
                            repeatDays: [],
                          }));
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر يوم التكرار" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MONDAY">الاثنين</SelectItem>
                        <SelectItem value="TUESDAY">الثلاثاء</SelectItem>
                        <SelectItem value="WEDNESDAY">الأربعاء</SelectItem>
                        <SelectItem value="THURSDAY">الخميس</SelectItem>
                        <SelectItem value="FRIDAY">الجمعة</SelectItem>
                        <SelectItem value="SATURDAY">السبت</SelectItem>
                        <SelectItem value="SUNDAY">الأحد</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="year_target" className="text-right">
                السنة المستهدفة
              </Label>
              <Select
                value={formData.year_target}
                onValueChange={(value) =>
                  setFormData({ ...formData, year_target: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="اختر السنة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1AM">الأولى متوسط</SelectItem>
                  <SelectItem value="2AM">الثانية متوسط</SelectItem>
                  <SelectItem value="3AM">الثالثة متوسط</SelectItem>
                  <SelectItem value="4AM">الرابعة متوسط</SelectItem>
                  <SelectItem value="1AS">الأولى ثانوي</SelectItem>
                  <SelectItem value="2AS">الثانية ثانوي</SelectItem>
                  <SelectItem value="3AS">الثالثة ثانوي</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Branch Selection - Only for High School */}
            {HIGH_SCHOOL_YEARS.includes(formData.year_target) && (
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right mt-2">الفروع المستهدفة</Label>
                <div className="col-span-3 flex flex-col gap-2">
                  {availableBranches.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      لا توجد فروع متاحة لهذه السنة.
                    </p>
                  )}

                  {availableBranches.length > 0 && (
                    <div className="space-y-2">
                      {availableBranches.map((branch) => {
                        const branchId = branch.value;
                        const checkboxId = `edit-branch-${branch.value}`;
                        const checked = formData.branch_ids.includes(branchId);

                        return (
                          <div
                            key={branch.value}
                            className="flex items-center justify-between rounded-md border p-2"
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox
                                id={checkboxId}
                                checked={checked}
                                onCheckedChange={(value) =>
                                  handleBranchToggle(branchId, value === true)
                                }
                              />
                              <Label
                                htmlFor={checkboxId}
                                className="cursor-pointer text-sm font-normal"
                              >
                                {branch.label}
                              </Label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}


            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="duration" className="text-right">
                المدة
              </Label>
              <Select
                value={formData.duration}
                onValueChange={(value) =>
                  setFormData({ ...formData, duration: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="اختر المدة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">1 ساعة</SelectItem>
                  <SelectItem value="1.5h">1.5 ساعة</SelectItem>
                  <SelectItem value="2h">2 ساعة</SelectItem>
                  <SelectItem value="2.5h">2.5 ساعة</SelectItem>
                  <SelectItem value="3h">3 ساعات</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pricePerSession" className="text-right">
                سعر الجلسة (دج) *
              </Label>
              <Input
                id="pricePerSession"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.pricePerSession}
                onChange={(e) =>
                  setFormData({ ...formData, pricePerSession: e.target.value })
                }
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري التحديث...
                </>
              ) : (
                "حفظ التعديلات"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
