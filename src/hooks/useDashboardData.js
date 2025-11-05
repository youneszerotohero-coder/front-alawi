import { useState, useEffect } from "react";
import dashboardService from "../services/dashboardService";

export const useDashboardCards = (period = "daily", date = null) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await dashboardService.getDashboardCards(period, date);
        setData(result);
      } catch (err) {
        console.error("Error fetching dashboard cards:", err);
        setError(err.message || "فشل في تحميل بيانات لوحة التحكم");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period, date]);

  return { 
    data, 
    loading, 
    error, 
    refetch: async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await dashboardService.getDashboardCards(period, date);
        setData(result);
      } catch (err) {
        console.error("Error fetching dashboard cards:", err);
        setError(err.message || "فشل في تحميل بيانات لوحة التحكم");
      } finally {
        setLoading(false);
      }
    }
  };
};

export const useTopTeachers = (limit = 10, period = "daily", date = null) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await dashboardService.getTopTeachers(limit, period, date);
        setData(result.data || []);
      } catch (err) {
        console.error("Error fetching top teachers:", err);
        setError(err.message || "فشل في تحميل بيانات المعلمين");
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [limit, period, date]);

  return { 
    data, 
    loading, 
    error, 
    refetch: async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await dashboardService.getTopTeachers(limit, period, date);
        setData(result.data || []);
      } catch (err) {
        console.error("Error fetching top teachers:", err);
        setError(err.message || "فشل في تحميل بيانات المعلمين");
        setData([]);
      } finally {
        setLoading(false);
      }
    }
  };
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
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await dashboardService.getRevenueTimeSeries(
          period,
          days,
          startDate,
          endDate
        );
        setData(result.data || []);
      } catch (err) {
        console.error("Error fetching revenue time series:", err);
        setError(err.message || "فشل في تحميل بيانات الإيرادات");
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period, days, startDate, endDate]);

  return { 
    data, 
    loading, 
    error, 
    refetch: async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await dashboardService.getRevenueTimeSeries(
          period,
          days,
          startDate,
          endDate
        );
        setData(result.data || []);
      } catch (err) {
        console.error("Error fetching revenue time series:", err);
        setError(err.message || "فشل في تحميل بيانات الإيرادات");
        setData([]);
      } finally {
        setLoading(false);
      }
    }
  };
};

export const useTeacherPerformance = (
  teacherUuid = null,
  period = "daily",
  date = null,
) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await dashboardService.getTeacherPerformance(
          teacherUuid,
          period,
          date
        );
        setData(result.data || []);
      } catch (err) {
        console.error("Error fetching teacher performance:", err);
        setError(err.message || "فشل في تحميل بيانات الأداء");
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [teacherUuid, period, date]);

  return { 
    data, 
    loading, 
    error, 
    refetch: async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await dashboardService.getTeacherPerformance(
          teacherUuid,
          period,
          date
        );
        setData(result.data || []);
      } catch (err) {
        console.error("Error fetching teacher performance:", err);
        setError(err.message || "فشل في تحميل بيانات الأداء");
        setData([]);
      } finally {
        setLoading(false);
      }
    }
  };
};

// Cache invalidation function
export const invalidateDashboardCache = () => {
  const keys = Object.keys(localStorage).filter(key => 
    key.startsWith('cache_dashboard_') || 
    key.startsWith('cache_top_teachers_') || 
    key.startsWith('cache_revenue_')
  );
  keys.forEach(key => localStorage.removeItem(key));
  console.log(`🗑️  [Cache INVALIDATED] Removed ${keys.length} dashboard cache entries`);
};
