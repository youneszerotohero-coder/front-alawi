import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  BookOpen,
  Eye,
  EyeOff,
  Phone,
  Lock,
  User,
  GraduationCap,
} from "lucide-react";
import authService from "../../services/api/auth.service";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { loginSuccess } from "../../store/slices/authSlice";
import { useToast } from "../../hooks/use-toast";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    firstname: "",
    firstName: "",
    lastname: "",
    lastName: "",
    phone: "",
    password: "",
    password_confirmation: "",
    birth_date: "",
    address: "",
    school_name: "",
    schoolLevel: "MIDDLE_SCHOOL", // MIDDLE_SCHOOL or HIGH_SCHOOL
    middleSchoolGrade: "GRADE_1", // GRADE_1, GRADE_2, GRADE_3, GRADE_4
    highSchoolGrade: null, // GRADE_1, GRADE_2, GRADE_3
    branch: null, // For high school students
    year_of_study: "1AM", // For UI display
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [availableBranches, setAvailableBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { toast } = useToast();

  // Load saved form data from localStorage on mount
  useEffect(() => {
    const savedFormData = localStorage.getItem('registerFormData');
    if (savedFormData) {
      try {
        const parsed = JSON.parse(savedFormData);
        setFormData(parsed);
      } catch (error) {
        console.error('Error loading saved form data:', error);
      }
    }
  }, []);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    // Only save if there's at least some data entered
    const hasData = formData.firstname || formData.firstName || 
                   formData.lastname || formData.lastName || 
                   formData.phone || formData.address || 
                   formData.school_name || formData.birth_date;
    
    if (hasData) {
      localStorage.setItem('registerFormData', JSON.stringify(formData));
    }
  }, [formData]);

  // Mapping between UI values and DB enums
  const yearToGradeMapping = {
    // Middle School
    "1AM": { schoolLevel: "MIDDLE_SCHOOL", grade: "GRADE_1" },
    "2AM": { schoolLevel: "MIDDLE_SCHOOL", grade: "GRADE_2" },
    "3AM": { schoolLevel: "MIDDLE_SCHOOL", grade: "GRADE_3" },
    "4AM": { schoolLevel: "MIDDLE_SCHOOL", grade: "GRADE_4" },
    // High School
    "1AS": { schoolLevel: "HIGH_SCHOOL", grade: "GRADE_1" },
    "2AS": { schoolLevel: "HIGH_SCHOOL", grade: "GRADE_2" },
    "3AS": { schoolLevel: "HIGH_SCHOOL", grade: "GRADE_3" },
  };

  // Branches available for each high school grade
  const branchOptions = {
    GRADE_1: [
      { value: "SCIENTIFIC", label: "علمي" },
      { value: "LITERARY", label: "أدبي" },
    ],
    GRADE_2: [
      { value: "LANGUAGES", label: "لغات أجنبية" },
      { value: "PHILOSOPHY", label: "فلسفة وآداب" },
      { value: "ELECTRICAL", label: "تقني رياضي - كهرباء" },
      { value: "MECHANICAL", label: "تقني رياضي - ميكانيك" },
      { value: "CIVIL", label: "تقني رياضي - مدني" },
      { value: "INDUSTRIAL", label: "تقني رياضي - صناعة" },
      { value: "MATHEMATIC", label: "رياضيات" },
      { value: "GESTION", label: "تسيير واقتصاد" },
      { value: "EXPERIMENTAL_SCIENCES", label: "علوم تجريبية" },
    ],
    GRADE_3: [
      { value: "LANGUAGES", label: "لغات أجنبية" },
      { value: "PHILOSOPHY", label: "فلسفة وآداب" },
      { value: "ELECTRICAL", label: "تقني رياضي - كهرباء" },
      { value: "MECHANICAL", label: "تقني رياضي - ميكانيك" },
      { value: "CIVIL", label: "تقني رياضي - مدني" },
      { value: "INDUSTRIAL", label: "تقني رياضي - صناعة" },
      { value: "MATHEMATIC", label: "رياضيات" },
      { value: "GESTION", label: "تسيير واقتصاد" },
      { value: "EXPERIMENTAL_SCIENCES", label: "علوم تجريبية" },
    ],
  };

  // Update available branches when high school grade changes
  useEffect(() => {
    if (formData.highSchoolGrade && branchOptions[formData.highSchoolGrade]) {
      setAvailableBranches(branchOptions[formData.highSchoolGrade]);
      // Reset branch if it's not available for the new grade
      if (formData.branch) {
        const isBranchAvailable = branchOptions[formData.highSchoolGrade].some(
          (b) => b.value === formData.branch
        );
        if (!isBranchAvailable) {
          setFormData((prev) => ({ ...prev, branch: "" }));
        }
      }
    } else {
      setAvailableBranches([]);
      setFormData((prev) => ({ ...prev, branch: "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.highSchoolGrade, formData.branch]);

  const validateForm = () => {
    const newErrors = {};

    // Check both old and new field names for compatibility
    const firstName = formData.firstname || formData.firstName || "";
    const lastName = formData.lastname || formData.lastName || "";
    
    if (!firstName.trim()) {
      newErrors.firstName = "الاسم الأول مطلوب";
      newErrors.firstname = "الاسم الأول مطلوب";
    }

    if (!lastName.trim()) {
      newErrors.lastName = "الاسم الأخير مطلوب";
      newErrors.lastname = "الاسم الأخير مطلوب";
    }

    if (!formData.phone?.trim()) {
      newErrors.phone = "رقم الهاتف مطلوب";
    } else if (!/^[0-9]{6,15}$/.test(formData.phone)) {
      newErrors.phone = "رقم الهاتف غير صحيح";
    }

    if (!formData.password) {
      newErrors.password = "كلمة المرور مطلوبة";
    } else if (formData.password.length < 6) {
      newErrors.password = "كلمة المرور يجب أن تكون 6 أحرف على الأقل";
    }

    if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = "كلمات المرور غير متطابقة";
    }

    if (Object.keys(newErrors).length > 0) {
      console.log("Validation errors found:", newErrors);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isValid = validateForm();
    
    if (!isValid) {
      // Errors will be shown in the UI via state
      return;
    }

    setIsLoading(true);

    try {
      // Get the actual values from formData
      const firstName = formData.firstname || formData.firstName || "";
      const lastName = formData.lastname || formData.lastName || "";
      
      const userData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: formData.phone,
        password: formData.password,
        birthDate: formData.birth_date || null,
        schoolName: formData.school_name || null,
        address: formData.address || null,
        middleSchoolGrade: formData.middleSchoolGrade || null,
        highSchoolGrade: formData.highSchoolGrade || null,
        branch: formData.branch || null,
      };

      const response = await authService.register(userData);

      const { user } = response;

      if (user) {
        // Clear saved form data from localStorage after successful registration
        localStorage.removeItem('registerFormData');

        // Update Redux store (token is in httpOnly cookie)
        dispatch(loginSuccess({ user }));

        // Show success message
        toast({
          title: "تم إنشاء الحساب بنجاح",
          description: `مرحباً بك!`,
        });

        // Navigate based on user role (registration typically creates students)
        const userRole = user.role?.toLowerCase();
        if (userRole === "admin") {
          navigate("/admin", { replace: true });
        } else {
          navigate("/student/profile", { replace: true });
        }
      }
    } catch (error) {
      console.error("Registration error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config,
      });

      // Handle validation errors from backend
      if (error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        const formattedErrors = {};
        Object.keys(backendErrors).forEach((key) => {
          formattedErrors[key] = Array.isArray(backendErrors[key])
            ? backendErrors[key][0]
            : backendErrors[key];
        });
        setErrors(formattedErrors);
      } else {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "حدث خطأ أثناء إنشاء الحساب";
        setErrors({
          submit: errorMessage,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle year_of_study changes specially
    if (name === "year_of_study") {
      const mapping = yearToGradeMapping[value];
      if (mapping) {
        setFormData({
          ...formData,
          year_of_study: value,
          schoolLevel: mapping.schoolLevel,
          middleSchoolGrade: mapping.schoolLevel === "MIDDLE_SCHOOL" ? mapping.grade : null,
          highSchoolGrade: mapping.schoolLevel === "HIGH_SCHOOL" ? mapping.grade : null,
          // Reset branch when changing year (will be updated by useEffect)
          branch: "",
        });
      }
    } else {
      // Update the field with its exact name
      const updatedData = { ...formData, [name]: value };
      
      // Also store in alternate field name for compatibility
      if (name === 'firstname') {
        updatedData.firstName = value;
      } else if (name === 'lastname') {
        updatedData.lastName = value;
      } else if (name === 'firstName') {
        updatedData.firstname = value;
      } else if (name === 'lastName') {
        updatedData.lastname = value;
      }
      
      setFormData(updatedData);
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="relative max-w-lg w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-red-400 to-pink-500 p-4 rounded-full shadow-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            انضم إلينا اليوم
          </h2>
          <p className="text-gray-600">ابدأ رحلتك التعليمية معنا</p>
        </div>

        {/* Register Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Error Message */}
            {errors.submit && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700 text-right">
                  {errors.submit}
                </div>
              </div>
            )}

            {/* Name Fields */}
            <div className="space-y-6">
              {/* Nom et Prénom */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="firstname"
                    className="block text-sm font-medium text-gray-700 mb-2 text-right"
                  >
                    الاسم الأول
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="firstname"
                      name="firstname"
                      type="text"
                      required
                      className={`block w-full pr-10 pl-3 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-right placeholder-gray-400 text-gray-900 transition-all duration-200 ${
                        errors.firstname ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="الاسم الأول"
                      value={formData.firstname || ""}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.firstname && (
                    <p className="mt-1 text-sm text-red-600 text-right">
                      {errors.firstname}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="lastname"
                    className="block text-sm font-medium text-gray-700 mb-2 text-right"
                  >
                    الاسم الأخير
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="lastname"
                      name="lastname"
                      type="text"
                      required
                      className={`block w-full pr-10 pl-3 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-right placeholder-gray-400 text-gray-900 transition-all duration-200 ${
                        errors.lastname ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="الاسم الأخير"
                      value={formData.lastname || ""}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.lastname && (
                    <p className="mt-1 text-sm text-red-600 text-right">
                      {errors.lastname}
                    </p>
                  )}
                </div>
              </div>

              {/* Date de naissance */}
              <div>
                <label
                  htmlFor="birth_date"
                  className="block text-sm font-medium text-gray-700 mb-2 text-right"
                >
                  تاريخ الميلاد
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" className={`w-full justify-between pr-10 pl-3 py-2 h-9 text-sm ${errors.birth_date ? "border-red-500" : ""}`}>
                        {formData.birth_date ? (() => {
                          try {
                            const date = new Date(formData.birth_date + 'T00:00:00');
                            if (isNaN(date.getTime())) return formData.birth_date;
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            return `${year}/${month}/${day}`;
                          } catch {
                            return formData.birth_date;
                          }
                        })() : "اختر تاريخ الميلاد"}
                        <User className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="p-2 w-80 max-w-[90vw]">
                      <Calendar
                        mode="single"
                        selected={formData.birth_date ? new Date(formData.birth_date + 'T00:00:00') : undefined}
                        onSelect={(date) => {
                          if (date) {
                            // Format as YYYY-MM-DD without timezone issues
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            const iso = `${year}-${month}-${day}`;
                            handleChange({ target: { name: "birth_date", value: iso } });
                          } else {
                            handleChange({ target: { name: "birth_date", value: "" } });
                          }
                        }}
                        captionLayout="dropdown"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                {errors.birth_date && (
                  <p className="mt-1 text-sm text-red-600 text-right">
                    {errors.birth_date}
                  </p>
                )}
              </div>

              {/* Adresse */}
              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700 mb-2 text-right"
                >
                  العنوان
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                <input
                    id="address"
                    name="address"
                    type="text"
                    required
                  className={`block w-full pr-10 pl-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-right placeholder-gray-400 text-gray-900 transition-all duration-200 ${
                      errors.address ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="أدخل عنوانك"
                    value={formData.address || ""}
                    onChange={handleChange}
                  />
                </div>
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600 text-right">
                    {errors.address}
                  </p>
                )}
              </div>

              {/* École */}
              <div>
                <label
                  htmlFor="school_name"
                  className="block text-sm font-medium text-gray-700 mb-2 text-right"
                >
                  المدرسة
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <GraduationCap className="h-5 w-5 text-gray-400" />
                  </div>
                <input
                    id="school_name"
                    name="school_name"
                    type="text"
                    required
                  className={`block w-full pr-10 pl-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-right placeholder-gray-400 text-gray-900 transition-all duration-200 ${
                      errors.school_name ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="اسم المدرسة"
                    value={formData.school_name || ""}
                    onChange={handleChange}
                  />
                </div>
                {errors.school_name && (
                  <p className="mt-1 text-sm text-red-600 text-right">
                    {errors.school_name}
                  </p>
                )}
              </div>

              {/* Année d'étude */}
              <div>
                <label
                  htmlFor="year_of_study"
                  className="block text-sm font-medium text-gray-700 mb-2 text-right"
                >
                  السنة الدراسية
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <GraduationCap className="h-5 w-5 text-gray-400" />
                  </div>
                  <Select value={formData.year_of_study} onValueChange={(v) => handleChange({ target: { name: "year_of_study", value: v } })}>
                    <SelectTrigger className={`h-9 text-sm ${errors.year_of_study ? "border-red-500" : ""}`}>
                      <SelectValue placeholder="اختر السنة الدراسية" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 w-[var(--radix-select-trigger-width)]">
                      <SelectItem value="1AM" className="text-sm">السنة الأولى متوسط</SelectItem>
                      <SelectItem value="2AM" className="text-sm">السنة الثانية متوسط</SelectItem>
                      <SelectItem value="3AM" className="text-sm">السنة الثالثة متوسط</SelectItem>
                      <SelectItem value="4AM" className="text-sm">السنة الرابعة متوسط</SelectItem>
                      <SelectItem value="1AS" className="text-sm">السنة الأولى ثانوي</SelectItem>
                      <SelectItem value="2AS" className="text-sm">السنة الثانية ثانوي</SelectItem>
                      <SelectItem value="3AS" className="text-sm">السنة الثالثة ثانوي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {errors.year_of_study && (
                  <p className="mt-1 text-sm text-red-600 text-right">
                    {errors.year_of_study}
                  </p>
                )}
              </div>

              {/* Branch Selection - Only for High School */}
              {["1AS", "2AS", "3AS"].includes(formData.year_of_study) && (
                <div>
                  <label
                    htmlFor="branch"
                    className="block text-sm font-medium text-gray-700 mb-2 text-right"
                  >
                    الفرع الدراسي
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <BookOpen className="h-5 w-5 text-gray-400" />
                    </div>
                    <Select value={formData.branch || ""} onValueChange={(v) => handleChange({ target: { name: "branch", value: v } })} disabled={loadingBranches}>
                      <SelectTrigger className={`h-9 text-sm ${errors.branch ? "border-red-500" : ""}`}>
                        <SelectValue placeholder={loadingBranches ? "جاري تحميل الفروع..." : "اختر الفرع الدراسي"} />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 w-[var(--radix-select-trigger-width)]">
                        {availableBranches.map((branch) => (
                          <SelectItem key={branch.value} value={branch.value} className="text-sm">
                            {branch.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {errors.branch && (
                    <p className="mt-1 text-sm text-red-600 text-right">
                      {errors.branch}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Phone Field */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-2 text-right"
              >
                رقم الهاتف
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  pattern="[0-9]{10}"
                  className={`block w-full pr-10 pl-3 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-right placeholder-gray-400 text-gray-900 transition-all duration-200 ${
                    errors.phone ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="أدخل رقم هاتفك (10 أرقام)"
                  value={formData.phone || ""}
                  onChange={handleChange}
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600 text-right">
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2 text-right"
              >
                كلمة المرور
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength="6"
                  className={`block w-full pr-10 pl-12 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-right placeholder-gray-400 text-gray-900 transition-all duration-200 ${
                    errors.password ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="أدخل كلمة المرور (6 أحرف على الأقل)"
                  value={formData.password || ""}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 left-0 pl-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 text-right">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="password_confirmation"
                className="block text-sm font-medium text-gray-700 mb-2 text-right"
              >
                تأكيد كلمة المرور
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password_confirmation"
                  name="password_confirmation"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  className={`block w-full pr-10 pl-12 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-right placeholder-gray-400 text-gray-900 transition-all duration-200 ${
                    errors.password_confirmation
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="أعد إدخال كلمة المرور"
                  value={formData.password_confirmation || ""}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 left-0 pl-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password_confirmation && (
                <p className="mt-1 text-sm text-red-600 text-right">
                  {errors.password_confirmation}
                </p>
              )}
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
              </div>
              <div className="mr-3 text-sm">
                <label htmlFor="terms" className="text-gray-700">
                  أوافق على{" "}
                  <Link
                    to="/terms"
                    className="text-red-600 hover:text-red-500 font-medium"
                  >
                    الشروط والأحكام
                  </Link>{" "}
                  و{" "}
                  <Link
                    to="/privacy"
                    className="text-red-600 hover:text-red-500 font-medium"
                  >
                    سياسة الخصوصية
                  </Link>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-red-400 to-pink-500 hover:from-red-500 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    جاري إنشاء الحساب...
                  </div>
                ) : (
                  "إنشاء الحساب"
                )}
              </button>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">أو</span>
              </div>
            </div>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                لديك حساب بالفعل؟{" "}
                <Link
                  to="/login"
                  className="font-medium text-red-600 hover:text-red-500 transition-colors duration-200"
                >
                  سجل دخولك
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            © 2025 اسماعيل علواوي. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
