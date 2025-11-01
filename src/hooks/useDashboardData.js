import { useState, useEffect } from "react";
// TEMPORARY: API integration disabled - using dummy data
// import dashboardService from "../services/dashboardService";

// DUMMY DATA - Temporarily replacing API calls
const getDummyDashboardCards = (period) => {
  // Adjust values slightly based on period to simulate different data
  const multiplier = period === "daily" ? 1 : period === "weekly" ? 7 : 30;
  
  return {
    cards: {
      total_students: { value: 245 * multiplier },
      total_teachers: { value: 18 },
      total_revenue: { value: 125000 * multiplier },
      total_sessions: { value: 89 * multiplier },
    },
  };
};

export const useDashboardCards = (period = "daily", date = null) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simulate API loading delay
    setLoading(true);
    setTimeout(() => {
      const dummyData = getDummyDashboardCards(period);
      setData(dummyData);
      setLoading(false);
      console.log("📊 [DUMMY DATA] Dashboard cards loaded");
    }, 500); // 500ms delay to simulate API call
  }, [period, date]);

  return { 
    data, 
    loading, 
    error: null, 
    refetch: () => {
      setLoading(true);
      setTimeout(() => {
        const dummyData = getDummyDashboardCards(period);
        setData(dummyData);
        setLoading(false);
      }, 500);
    }
  };
};

const getDummyTopTeachers = (limit, period) => {
  const multiplier = period === "daily" ? 1 : period === "weekly" ? 7 : 30;
  
  const teachers = [
    { name: "أحمد محمد", revenue: 8500 * multiplier, students: 12, sessions: 45 * multiplier, rate: 95 },
    { name: "فاطمة علي", revenue: 7200 * multiplier, students: 10, sessions: 38 * multiplier, rate: 92 },
    { name: "محمد خالد", revenue: 6800 * multiplier, students: 9, sessions: 35 * multiplier, rate: 88 },
    { name: "سارة أحمد", revenue: 5900 * multiplier, students: 8, sessions: 30 * multiplier, rate: 85 },
    { name: "علي حسن", revenue: 5200 * multiplier, students: 7, sessions: 28 * multiplier, rate: 82 },
    { name: "ليلى كريم", revenue: 4800 * multiplier, students: 6, sessions: 25 * multiplier, rate: 80 },
    { name: "يوسف نور", revenue: 4200 * multiplier, students: 5, sessions: 22 * multiplier, rate: 78 },
    { name: "نورا سعيد", revenue: 3800 * multiplier, students: 5, sessions: 20 * multiplier, rate: 75 },
  ];

  return teachers.slice(0, limit).map((teacher, index) => ({
    teacher_uuid: `teacher-${index + 1}`,
    teacher_name: teacher.name,
    total_revenue: teacher.revenue,
    active_students: teacher.students,
    completed_sessions: teacher.sessions,
    completion_rate: teacher.rate,
  }));
};

export const useTopTeachers = (limit = 10, period = "daily", date = null) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const dummyData = getDummyTopTeachers(limit, period);
      setData(dummyData);
      setLoading(false);
      console.log("📊 [DUMMY DATA] Top teachers loaded");
    }, 600);
  }, [limit, period, date]);

  return { 
    data, 
    loading, 
    error: null, 
    refetch: () => {
      setLoading(true);
      setTimeout(() => {
        const dummyData = getDummyTopTeachers(limit, period);
        setData(dummyData);
        setLoading(false);
      }, 600);
    }
  };
};

const getDummyRevenueTimeSeries = (period, days) => {
  const data = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    if (period === "daily") {
      date.setDate(date.getDate() - i);
    } else if (period === "weekly") {
      date.setDate(date.getDate() - (i * 7));
    } else {
      date.setMonth(date.getMonth() - i);
    }
    
    // Generate realistic revenue data with some variation
    const baseRevenue = 3000 + Math.random() * 2000;
    const revenue = Math.round(baseRevenue);
    const teacherCut = Math.round(revenue * 0.7); // 70% to teacher
    const schoolCut = Math.round(revenue * 0.3); // 30% to school
    const profit = schoolCut; // School's profit
    
    data.push({
      date: date.toISOString().split('T')[0],
      revenue: revenue,
      profit: profit,
      school_cut: schoolCut,
      teacher_cut: teacherCut,
    });
  }
  
  return { data };
};

export const useRevenueTimeSeries = (
  period = "daily",
  days = 30,
  startDate = null,
  endDate = null,
) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const result = getDummyRevenueTimeSeries(period, days);
      setData(result.data || []);
      setLoading(false);
      console.log("📊 [DUMMY DATA] Revenue time series loaded");
    }, 700);
  }, [period, days, startDate, endDate]);

  return { 
    data, 
    loading, 
    error: null, 
    refetch: () => {
      setLoading(true);
      setTimeout(() => {
        const result = getDummyRevenueTimeSeries(period, days);
        setData(result.data || []);
        setLoading(false);
      }, 700);
    }
  };
};

// TEMPORARY: Disabled - using dummy data
export const useTeacherPerformance = (
  teacherUuid = null,
  period = "daily",
  date = null,
) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Return dummy empty data
    setLoading(true);
    setTimeout(() => {
      setData([]);
      setLoading(false);
      console.log("📊 [DUMMY DATA] Teacher performance - empty data");
    }, 300);
  }, [teacherUuid, period, date]);

  return { 
    data, 
    loading, 
    error: null, 
    refetch: () => {
      setLoading(true);
      setTimeout(() => {
        setData([]);
        setLoading(false);
      }, 300);
    }
  };
};

// TEMPORARY: Cache invalidation disabled (using dummy data)
export const invalidateDashboardCache = () => {
  console.log("📊 [DUMMY DATA] Cache invalidation skipped (using dummy data)");
  // Cache clearing disabled since we're using dummy data
  // const keys = Object.keys(localStorage).filter(key => 
  //   key.startsWith('cache_dashboard_') || 
  //   key.startsWith('cache_top_teachers_') || 
  //   key.startsWith('cache_revenue_')
  // );
  // keys.forEach(key => localStorage.removeItem(key));
  // console.log(`🗑️  [Cache INVALIDATED] Removed ${keys.length} dashboard cache entries`);
};
