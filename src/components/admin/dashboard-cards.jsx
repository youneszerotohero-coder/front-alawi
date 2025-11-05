import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  GraduationCap,
  DollarSign,
  Clock,
  TrendingUp,
  Building2,
  UserCircle,
} from "lucide-react";
import { useDashboardCards } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";
import dashboardService from "@/services/dashboardService";

const DashboardCards = ({ period = "daily", date = null }) => {
  const { data, loading, error } = useDashboardCards(period, date);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-6">
        <Card className="col-span-full">
          <CardContent className="pt-6">
            <div className="text-center text-red-500">
              خطأ في تحميل بيانات لوحة التحكم
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data?.cards) {
    return null;
  }

  const cards = data.cards;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-6">
      {/* Total Students */}
      <Card className="bg-pink-50 border-pink-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-right text-gray-800">
            إجمالي الطلاب
          </CardTitle>
          <Users className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-right text-gray-800">
            {dashboardService.formatNumber(cards.total_students?.value || 0)}
          </div>
          <p className="text-xs text-gray-600 text-right">
            <span className="text-red-500 font-semibold">نشط</span> في النظام
          </p>
        </CardContent>
      </Card>

      {/* Total Teachers */}
      <Card className="bg-pink-50 border-pink-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-right text-gray-800">
            إجمالي المعلمين
          </CardTitle>
          <GraduationCap className="h-4 w-4 text-pink-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-right text-gray-800">
            {dashboardService.formatNumber(cards.total_teachers?.value || 0)}
          </div>
          <p className="text-xs text-gray-600 text-right">
            <span className="text-pink-500 font-semibold">مسجل</span> في المنصة
          </p>
        </CardContent>
      </Card>

      {/* Total Revenue */}
      <Card className="bg-pink-50 border-pink-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-right text-gray-800">
            إجمالي الإيرادات
          </CardTitle>
          <DollarSign className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-right text-gray-800">
            {dashboardService.formatCurrency(cards.total_revenue?.value || 0)}
          </div>
          <p className="text-xs text-gray-600 text-right">
            <span className="text-red-500 font-semibold">إجمالي</span> الإيرادات
          </p>
        </CardContent>
      </Card>

      {/* Total Sessions */}
      <Card className="bg-pink-50 border-pink-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-right text-gray-800">
            إجمالي الجلسات
          </CardTitle>
          <Clock className="h-4 w-4 text-pink-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-right text-gray-800">
            {dashboardService.formatNumber(cards.total_sessions?.value || 0)}
          </div>
          <p className="text-xs text-gray-600 text-right">
            <span className="text-pink-500 font-semibold">جلسة</span> في الفترة
          </p>
        </CardContent>
      </Card>

      {/* School Share */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-right text-gray-800">
            حصة المدرسة
          </CardTitle>
          <Building2 className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-right text-gray-800">
            {dashboardService.formatCurrency(cards.school_share?.value || 0)}
          </div>
          <p className="text-xs text-gray-600 text-right">
            <span className="text-blue-500 font-semibold">حصة</span> المدرسة
          </p>
        </CardContent>
      </Card>

      {/* Teacher Share */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-right text-gray-800">
            حصة المعلم
          </CardTitle>
          <UserCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-right text-gray-800">
            {dashboardService.formatCurrency(cards.teacher_share?.value || 0)}
          </div>
          <p className="text-xs text-gray-600 text-right">
            <span className="text-green-500 font-semibold">حصة</span> المعلمين
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardCards;
