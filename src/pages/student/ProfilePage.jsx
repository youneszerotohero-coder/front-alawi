import React, { useEffect, useMemo, useState } from "react";
import AuthService from "../../services/api/auth.service";
import branchesService from "../../services/api/branches.service";
import api from "../../services/api/axios.config";
// استخدام أيقونات من مكتبة lucide-react
import { Phone, Camera, BookOpen, Info } from "lucide-react";

const YEAR_LABELS = {
  "1AM": "السنة الأولى متوسط",
  "2AM": "السنة الثانية متوسط",
  "3AM": "السنة الثالثة متوسط",
  "4AM": "السنة الرابعة متوسط",
  "1AS": "السنة الأولى ثانوي",
  "2AS": "السنة الثانية ثانوي",
  "3AS": "السنة الثالثة ثانوي",
};

const formatBirthDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ar-DZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

// Helper function to convert grade to year format
function middleSchoolGradeToYear(middleGrade, highGrade) {
  if (middleGrade) {
    const gradeMap = { "GRADE_1": "1AM", "GRADE_2": "2AM", "GRADE_3": "3AM", "GRADE_4": "4AM" };
    return gradeMap[middleGrade];
  }
  if (highGrade) {
    const gradeMap = { "GRADE_1": "1AS", "GRADE_2": "2AS", "GRADE_3": "3AS" };
    return gradeMap[highGrade];
  }
  return null;
}

// Helper function to convert branch enum to Arabic name
function getBranchNameFromEnum(branchEnum) {
  if (!branchEnum) return "—";
  
  const branchMap = {
    "SCIENTIFIC": "علمي",
    "LITERARY": "أدبي",
    "LANGUAGES": "لغات أجنبية",
    "PHILOSOPHY": "فلسفة وآداب",
    "ELECTRICAL": "تقني رياضي - كهرباء",
    "MECHANICAL": "تقني رياضي - ميكانيك",
    "CIVIL": "تقني رياضي - مدني",
    "INDUSTRIAL": "تقني رياضي - صناعة",
    "MATHEMATIC": "رياضيات",
    "GESTION": "تسيير واقتصاد",
    "EXPERIMENTAL_SCIENCES": "علوم تجريبية",
  };
  
  return branchMap[branchEnum] || branchEnum;
}

// --- المكون الرئيسي لصفحة تعريف الطالب ---
const StudentProfilePage = () => {
  // --- Récupérer l'utilisateur connecté depuis le service d'auth ---
  const storedUser = AuthService.getCurrentUser() || null;
  const [currentUser, setCurrentUser] = useState(storedUser || null);
  const [loading, setLoading] = useState(false);
  const [subs, setSubs] = useState([]);
  const [subsLoading, setSubsLoading] = useState(false);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      const response = await api.get("/payments/active");
      const list = response?.data?.data?.subscriptions || [];
      setSubs(list);
    };
    fetchSubscriptions();
    // If we don't have a filled user in localStorage, try to fetch the profile
    const hasFirstName = storedUser?.firstname || storedUser?.firstName;
    const hasLastName = storedUser?.lastname || storedUser?.lastName;
    
    const shouldFetch =
      !storedUser ||
      !hasFirstName ||
      !hasLastName;
    
    if (shouldFetch) {
      setLoading(true);
      AuthService.getProfile()
        .then((profile) => {
          if (profile) setCurrentUser(profile);
        })
        .catch((e) => {
          // keep storedUser or show placeholders
          console.warn("Failed to load profile for ProfilePage:", e);
        })
        .finally(() => setLoading(false));
    }

    // Listen for profile updates (when profile is updated from settings page)
    const handleProfileUpdate = (event) => {
      const updatedUser = event.detail || AuthService.getCurrentUser();
      if (updatedUser) {
        setCurrentUser(updatedUser);
      }
    };

    window.addEventListener("profileUpdated", handleProfileUpdate);
    return () => {
      window.removeEventListener("profileUpdated", handleProfileUpdate);
    };
  }, []);
  const student = useMemo(() => {
    const u = currentUser || {};
    const branch = u.branch || null;
    
    // Combine firstName and lastName from backend
    const fullName = `${u.firstName || ""} ${u.lastName || ""}`.trim();
    
    return {
      // Use firstName/lastName from backend (camelCase), fallback to old fields
      name:
        fullName ||
        `${u.firstname || ""} ${u.lastname || ""}`.trim() ||
        u.name ||
        `طالب ${u.id || ""}`,
      firstName: u.firstName || u.firstname || "",
      lastName: u.lastName || u.lastname || "",
      id: u.id
        ? `S-${String(u.id).toString().slice(0, 6).padStart(6, "0")}`
        : "S-000000",
      phone: u.phone || "+213 000 000 000",
      grade: YEAR_LABELS[u.year_of_study] || 
             YEAR_LABELS[middleSchoolGradeToYear(u.middleSchoolGrade, u.highSchoolGrade)] || 
             u.year_of_study || 
             "غير محدد",
      rawGrade: u.year_of_study || u.middleSchoolGrade || u.highSchoolGrade || "",
      gradeLevel: "student",
      profilePic: u.profilePicUrl || (u.profilePicPath ? `/${u.profilePicPath}` : (u.picture || u.profilePic || null)),
      // Generate QR from the user's public UUID if available
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${u.uuid ? `${u.uuid}` : u.id ? `${u.id}` : "unknown"}`,
      idShort: u.uuid
        ? `S-${String(u.uuid).slice(0, 8)}`
        : u.id
          ? `S-${String(u.id).toString().slice(0, 6).padStart(6, "0")}`
          : "S-000000",
      birth_date: u.birthDate || u.birth_date || "",
      birthDateFormatted: formatBirthDate(u.birthDate || u.birth_date),
      address: u.address || "",
      school_name: u.schoolName || u.school_name || "",
      free_subscriber: u.hasFreeSubscription !== undefined ? u.hasFreeSubscription : (u.free_subscriber || false),
      branch: u.branch,
      branchName: u.branch ? getBranchNameFromEnum(u.branch) : "—",
      middleSchoolGrade: u.middleSchoolGrade,
      highSchoolGrade: u.highSchoolGrade,
    };
  }, [currentUser]);

  const daysToExpire = (sub) => {
    return typeof sub.days_remaining === "number" ? sub.days_remaining : 0;
  };

  return (
    <div dir="rtl" className="min-h-screen font-sans mt-16 lg:mt-20">
      {loading && (
        <div className="max-w-6xl mx-auto p-6 text-center text-gray-600">
          جارٍ تحميل بيانات الملف الشخصي ...
        </div>
      )}

      {/* ## قسم الترويسة والملف الشخصي ## */}
      <div className="bg-gradient-to-br from-red-400 to-pink-500 text-white p-8 md:p-12 shadow-lg">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center text-center md:text-right gap-8">
          {/* الصورة الشخصية */}
          <div className="relative group flex-shrink-0">
            {student.profilePic ? (
              <img
                src={student.profilePic}
                alt="الصورة الشخصية"
                className="w-40 h-40 rounded-full object-cover border-4 border-white/50 shadow-xl"
              />
            ) : (
              <div className="w-40 h-40 rounded-full bg-white/30 border-4 border-white/50 shadow-xl flex items-center justify-center text-white text-3xl">
                {student.name?.charAt(0) || "طالب"}
              </div>
            )}
            {/* <div className="absolute inset-0 bg-black bg-opacity-60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer">
              <Camera size={36} />
              <span className="text-sm mt-1">تغيير الصورة</span>
            </div> */}
          </div>

          {/* معلومات الطالب */}
          <div className="flex-grow">
            <h1 className="text-3xl md:text-4xl font-bold">{student.name}</h1>
          </div>

          {/* رمز الاستجابة السريعة */}
          <div className="flex-shrink-0 bg-white p-3 rounded-2xl shadow-lg">
            <img
              src={student.qrCode}
              alt="رمز الاستجابة السريعة للحضور"
              className="w-28 h-28"
            />
          </div>
        </div>
      </div>

      {/* ## قسم معلومات الطالب ## */}
      <div className="max-w-6xl mx-auto my-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4 text-gray-700">
            <Info className="w-5 h-5" />
            <h2 className="text-xl font-semibold">معلومات الطالب</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-800 text-sm">
            <div>
              <span className="text-gray-500">الاسم:</span> {student.name}
            </div>
            {student.firstName && student.lastName && (
              <>
                <div>
                  <span className="text-gray-500">الاسم الأول:</span> {student.firstName}
                </div>
                <div>
                  <span className="text-gray-500">اسم العائلة:</span> {student.lastName}
                </div>
              </>
            )}
            <div>
              <span className="text-gray-500">الهاتف:</span> {student.phone}
            </div>
            <div>
              <span className="text-gray-500">السنة الدراسية:</span>{" "}
              {student.grade}
            </div>
            <div>
              <span className="text-gray-500">الفرع الدراسي:</span>{" "}
              {student.branchName}
            </div>
            <div>
              <span className="text-gray-500">المدرسة:</span>{" "}
              {student.school_name || "—"}
            </div>
            <div>
              <span className="text-gray-500">تاريخ الميلاد:</span>{" "}
              {student.birthDateFormatted}
            </div>
            <div>
              <span className="text-gray-500">العنوان:</span>{" "}
              {student.address || "—"}
            </div>
          </div>
        </div>
      </div>

      {/* ## قسم الاشتراكات النشطة ## */}
      <div className="max-w-6xl mx-auto my-0 lg:my-10">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              الاشتراكات النشطة
            </h2>
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm text-gray-500">
              <BookOpen className="w-5 h-5" />
              <span>{subs.length} اشتراك</span>
            </div>
          </div>
          {subsLoading && (
            <div className="text-center text-gray-500">
              جارٍ تحميل الاشتراكات...
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {!subsLoading &&
              subs.map((sub) => {
                // Determine theme based on publisher status
                const isPublisher = sub.is_publisher === true;
                const isGoldenTheme = isPublisher;
                
                return (
                <div
                  key={sub.id}
                  className={`
                      relative overflow-hidden rounded-2xl p-6 shadow-xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl
                      ${isGoldenTheme 
                          ? "bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 text-white"
                          : "bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 text-white"}
                    `}
                >
                  {/* Effet brillant pour carte Publisher (Golden) */}
                  {isGoldenTheme && (
                    <>
                      <div className="absolute top-0 left-0 w-full h-full opacity-30 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
                      <div className="absolute -top-20 -right-20 w-40 h-40 bg-yellow-300 rounded-full opacity-20 blur-3xl"></div>
                      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-amber-300 rounded-full opacity-20 blur-3xl"></div>
                    </>
                  )}

                  {/* Décoration carte (cercles) */}
                  <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white opacity-10"></div>
                  <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white opacity-10"></div>

                  {/* Contenu de la carte */}
                  <div className="relative z-10">
                    {/* Nom du professeur */}
                    <h3
                      className={`
                        text-2xl font-bold mb-4
                        ${isGoldenTheme ? "text-yellow-50" : "text-white"}
                      `}
                    >
                      {sub.teacher_name || "أستاذ"}
                    </h3>

                    {/* Informations de validité */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="opacity-80">تاريخ البداية</span>
                        <span className="font-semibold">
                          {new Date(sub.starts_at).toLocaleDateString("ar-DZ")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="opacity-80">تاريخ الانتهاء</span>
                        <span className="font-semibold">
                          {new Date(sub.ends_at).toLocaleDateString("ar-DZ")}
                        </span>
                      </div>
                    </div>

                    {/* Barre de progression */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-1 opacity-80">
                        <span>المدة المتبقية</span>
                        <span className="font-semibold">
                          {daysToExpire(sub)} يوم
                        </span>
                      </div>
                      <div className="w-full bg-white bg-opacity-20 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            daysToExpire(sub) <= 3
                              ? "bg-red-400"
                              : isGoldenTheme
                                ? "bg-yellow-200"
                                : "bg-white"
                          }`}
                          style={{
                            width: `${Math.min(100, (daysToExpire(sub) / 30) * 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Messages d'alerte */}
                    {daysToExpire(sub) <= 3 && (
                      <div className="bg-red-500 bg-opacity-20 border border-red-300 border-opacity-30 rounded-lg px-3 py-2 text-xs mt-3">
                        ⚠️ سينتهي اشتراكك قريبًا، يرجى التجديد
                      </div>
                    )}
                    {daysToExpire(sub) > 3 && isGoldenTheme && (
                      <div className="bg-yellow-900 bg-opacity-20 border border-yellow-300 border-opacity-30 rounded-lg px-3 py-2 text-xs mt-3">
                        ✨ وصول كامل لجميع المحتويات
                      </div>
                    )}
                  </div>
                </div>
              );
              })}
          </div>

          {/* Empty State (if no courses) */}
          {!subsLoading && subs.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                لا توجد اشتراكات نشطة
              </h3>
              <p className="text-gray-500 mb-6">
                قم بالاشتراك للوصول إلى المحتوى
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProfilePage;
