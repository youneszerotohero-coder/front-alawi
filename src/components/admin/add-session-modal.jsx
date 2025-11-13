import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { CalendarPlus, Loader2 } from "lucide-react";
import { sessionService } from "@/services/api/session.service";
import { teacherService } from "@/services/api/teacher.service";
import branchesService from "@/services/api/branches.service";
import { useToast } from "@/hooks/use-toast";
import { invalidateDashboardCache } from "@/hooks/useDashboardData"; // ⚡ Invalidate dashboard

const HIGH_SCHOOL_YEARS = ["1AS", "2AS", "3AS"];

export function AddSessionModal({ onSessionAdded }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    teacher: "",
    sessionType: "ONE_TIME",
    year_target: "1AM",
    branch_ids: [],
    date: "",
    time: "",
    duration: "",
    repeatDays: [],
    startTime: "",
    pricePerSession: "",
    group: 1,
  });
  const [availableBranches, setAvailableBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  useEffect(() => {
    if (open) {
      fetchTeachers();
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      setFormData({
        teacher: "",
        sessionType: "ONE_TIME",
        year_target: "1AM",
        branch_ids: [],
        date: "",
        time: "",
        duration: "",
        repeatDays: [],
        startTime: "",
        pricePerSession: "",
        group: 1,
      });
      setAvailableBranches([]);
      setLoadingBranches(false);
    }
  }, [open]);

  // Load branches when year changes
  useEffect(() => {
    const loadBranches = () => {
      if (
        formData.year_target &&
        HIGH_SCHOOL_YEARS.includes(formData.year_target)
      ) {
        setLoadingBranches(true);
        
        // Define branches based on year level (from schema)
        let branches = [];
        
        if (formData.year_target === "1AS") {
          // 1st year High School
          branches = [
            { id: "SCIENTIFIC", name: "علمي", code: "SCI" },
            { id: "LITERARY", name: "أدبي", code: "LIT" },
          ];
        } else if (formData.year_target === "2AS" || formData.year_target === "3AS") {
          // 2nd and 3rd year High School
          branches = [
            { id: "LANGUAGES", name: "لغات أجنبية", code: "LANG" },
            { id: "PHILOSOPHY", name: "فلسفة", code: "PHIL" },
            { id: "ELECTRICAL", name: "كهرباء", code: "ELEC" },
            { id: "MECHANICAL", name: "ميكانيك", code: "MECH" },
            { id: "CIVIL", name: "مدني", code: "CIV" },
            { id: "INDUSTRIAL", name: "صناعي", code: "IND" },
            { id: "MATHEMATIC", name: "رياضيات", code: "MATH" },
            { id: "GESTION", name: "تسيير واقتصاد", code: "GEST" },
            { id: "EXPERIMENTAL_SCIENCES", name: "علوم تجريبية", code: "EXP" },
          ];
        }

        setAvailableBranches(branches);
        setFormData((prev) => {
          const validSelection = prev.branch_ids.filter((id) =>
            branches.some((branch) => branch.id === id),
          );
          return { ...prev, branch_ids: validSelection };
        });
        setLoadingBranches(false);
      } else {
        setAvailableBranches([]);
        setFormData((prev) => ({ ...prev, branch_ids: [] }));
      }
    };

    loadBranches();
  }, [formData.year_target]);

  const fetchTeachers = async () => {
    try {
      // Fetch teachers directly from API without localStorage cache
      // Pass a parameter to bypass cache (limit with a value bypasses cache in teacherService)
      // Use limit 100 (max allowed) to get all teachers
      const response = await teacherService.getTeachers({ limit: 100 });
      // Response format: { data: [...], pagination: {...} }
      const teachersList = response?.data || [];
      setTeachers(teachersList);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      setTeachers([]);
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

    // Validate repetitive session fields
    if (formData.sessionType === "REPETITIVE" && formData.repeatDays.length === 0) {
      toast({
        title: "برجاء اختيار أيام التكرار",
        description: "يجب اختيار يوم واحد على الأقل للجلسات المتكررة.",
        variant: "destructive",
      });
      return;
    }

    // Validate price per session
    if (!formData.pricePerSession || parseFloat(formData.pricePerSession) <= 0) {
      toast({
        title: "برجاء إدخال سعر الجلسة",
        description: "يجب إدخال سعر إيجابي للجلسة.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const sessionData =
        sessionService.transformSessionForSubmission(formData);
      const response = await sessionService.createSession(sessionData);
      
      // Get the created session from the response
      const createdSession = response.data || response;

      invalidateDashboardCache();
      console.log("🔄 Session created - Adding to state");

      // Show success message
      const selectedTeacher = teachers.find((t) => t.id === formData.teacher);
      const teacherName = selectedTeacher 
        ? `${selectedTeacher.firstName} ${selectedTeacher.lastName}` 
        : "المعلم";
      const dateText = formData.sessionType === "ONE_TIME" 
        ? `في ${formData.date}` 
        : "كجلسة متكررة";
      toast({
        title: "تم إضافة الجلسة بنجاح",
        description: `تم جدولة جلسة جديدة مع ${teacherName} ${dateText}`,
      });

      setOpen(false);
      setFormData({
        teacher: "",
        sessionType: "ONE_TIME",
        year_target: "1AM",
        branch_ids: [],
        date: "",
        time: "",
        duration: "",
        repeatDays: [],
        startTime: "",
        pricePerSession: "",
        group: 1,
      });
      setAvailableBranches([]);

      // Pass the created session to the callback instead of triggering a refresh
      if (onSessionAdded && createdSession) {
        onSessionAdded(createdSession);
      }
    } catch (error) {
      console.error("Error creating session:", error);
      const errorMessage =
        error.response?.data?.message || "فشل في إنشاء الجلسة";
      toast({
        title: "خطأ في إضافة الجلسة",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <CalendarPlus className="ml-2 h-4 w-4" />
          إضافة جلسة
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle className="text-right">جدولة جلسة جديدة</DialogTitle>
          <DialogDescription className="text-right">
            إنشاء جلسة تدريس جديدة مع جميع التفاصيل اللازمة.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
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
                  <SelectItem value="ONE_TIME">جلسة لمرة واحدة</SelectItem>
                  <SelectItem value="REPETITIVE">جلسة متكررة</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
                  {loadingBranches && (
                    <p className="text-sm text-muted-foreground">
                      جاري تحميل الفروع...
                    </p>
                  )}

                  {!loadingBranches && availableBranches.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      لا توجد فروع متاحة لهذه السنة.
                    </p>
                  )}

                  {!loadingBranches && availableBranches.length > 0 && (
                    <div className="space-y-2">
                      {availableBranches.map((branch) => {
                        const branchId = branch.id;
                        const checkboxId = `branch-${branch.id}`;
                        const checked = formData.branch_ids.includes(branchId);

                        return (
                          <div
                            key={branch.id}
                            className="flex items-center justify-between rounded-md border p-2"
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox
                                id={checkboxId}
                                checked={checked}
                                onCheckedChange={(value) =>
                                  handleBranchToggle(branchId, value === true)
                                }
                                disabled={loadingBranches}
                              />
                              <Label
                                htmlFor={checkboxId}
                                className="cursor-pointer text-sm font-normal"
                              >
                                {branch.name}
                              </Label>
                            </div>
                            {branch.code && (
                              <span className="text-xs text-muted-foreground">
                                {branch.code}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ONE_TIME session fields */}
            {formData.sessionType === "ONE_TIME" && (
              <>
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
                    required
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="time" className="text-right">
                    الوقت
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) =>
                      setFormData({ ...formData, time: e.target.value })
                    }
                    className="col-span-3"
                    required
                  />
                </div>
              </>
            )}

            {/* REPETITIVE session fields */}
            {formData.sessionType === "REPETITIVE" && (
              <>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right mt-2">أيام التكرار</Label>
                  <div className="col-span-3 grid grid-cols-2 gap-2">
                    {[
                      { value: "MONDAY", label: "الإثنين" },
                      { value: "TUESDAY", label: "الثلاثاء" },
                      { value: "WEDNESDAY", label: "الأربعاء" },
                      { value: "THURSDAY", label: "الخميس" },
                      { value: "FRIDAY", label: "الجمعة" },
                      { value: "SATURDAY", label: "السبت" },
                      { value: "SUNDAY", label: "الأحد" },
                    ].map((day) => (
                      <div
                        key={day.value}
                        className="flex items-center gap-2 p-2 border rounded"
                      >
                        <Checkbox
                          id={day.value}
                          checked={formData.repeatDays.includes(day.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({
                                ...formData,
                                repeatDays: [...formData.repeatDays, day.value],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                repeatDays: formData.repeatDays.filter(
                                  (d) => d !== day.value
                                ),
                              });
                            }
                          }}
                        />
                        <Label htmlFor={day.value} className="cursor-pointer">
                          {day.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="startTime" className="text-right">
                    وقت البدء
                  </Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                    className="col-span-3"
                    required
                  />
                </div>
              </>
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

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="group" className="text-right">
                المجموعة
              </Label>
              <Input
                id="group"
                type="number"
                min="1"
                placeholder="1"
                value={formData.group}
                onChange={(e) =>
                  setFormData({ ...formData, group: parseInt(e.target.value, 10) || 1 })
                }
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                "جدولة الجلسة"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
