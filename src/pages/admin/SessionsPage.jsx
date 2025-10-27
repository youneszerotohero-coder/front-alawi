import { useState, useCallback, useEffect } from "react";
import { Calendar, Clock, CheckCircle, XCircle } from "lucide-react";
import { SessionsTable } from "@/components/admin/sessions-table";
import { AddSessionModal } from "@/components/admin/add-session-modal";
import { SessionsFilters } from "@/components/admin/sessions-filters";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { sessionService } from "@/services/api/session.service";

export default function AdminSessionsPage() {
  const [filters, setFilters] = useState({
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date().toISOString().split("T")[0],
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [stats, setStats] = useState({
    todayTotal: 0,
    todayProgrammed: 0,
    todayCancelled: 0,
    todayCompleted: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const handleSearchChange = (query) => {
    setSearchQuery(query);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setFilters({
      start_date: new Date().toISOString().split("T")[0],
      end_date: new Date().toISOString().split("T")[0],
    });
  };

  const fetchStats = async (currentFilters) => {
    try {
      setLoadingStats(true);
      const response = await sessionService.getSessions(currentFilters);

      if (response && response.data) {
        const sessions = response.data;

        setStats({
          todayTotal: sessions.length,
          todayProgrammed: sessions.filter(
            (s) => s.status_raw === null || s.status_raw === undefined,
          ).length,
          todayCancelled: sessions.filter((s) => s.status_raw === "cancelled")
            .length,
          todayCompleted: sessions.filter((s) => s.status_raw === "completed")
            .length,
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats(filters);
  }, [filters]);

  const handleSessionAdded = () => {
    setRefreshTrigger(prev => prev + 1);
    fetchStats(filters);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Filters */}
      {/* <Card>
        <CardContent className="pt-6">
          <SessionsFilters onFiltersChange={handleFiltersChange} />
        </CardContent>
      </Card> */}
      {/* All Sessions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-right">جميع الجلسات</CardTitle>
            <CardDescription className="text-right">
              عرض وإدارة جميع الجلسات المجدولة
            </CardDescription>
          </div>
          <AddSessionModal onSessionAdded={handleSessionAdded} />
        </CardHeader>
        <CardContent>
          <SessionsFilters
            onFiltersChange={handleFiltersChange}
            onSearchChange={handleSearchChange}
            onClearFilters={handleClearFilters}
          />
          <SessionsTable 
            filters={filters} 
            searchQuery={searchQuery} 
            key={refreshTrigger} 
          />
        </CardContent>
      </Card>
    </div>
  );
}
