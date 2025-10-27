import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { teacherService } from "@/services/api/teacher.service";
import { cacheService } from "@/services/cache.service";

export function SessionsFilters({ onFiltersChange, onSearchChange, onClearFilters }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleSearch = useCallback(() => {
    const filters = {
      search: searchTerm.trim(),
      teacherId:
        selectedTeacher !== "all" && selectedTeacher
          ? selectedTeacher
          : undefined,
    };
    onFiltersChange?.(filters);
    onSearchChange?.(searchTerm.trim());
  }, [searchTerm, selectedTeacher, onFiltersChange, onSearchChange]);

  const handleTeacherChange = useCallback((teacherId) => {
    setSelectedTeacher(teacherId);
    const filters = {
      search: searchTerm.trim(),
      teacherId: teacherId !== "all" && teacherId ? teacherId : undefined,
    };
    onFiltersChange?.(filters);
  }, [searchTerm, onFiltersChange]);

  const fetchTeachers = async () => {
    try {
      // Use cache service instead of direct API call
      const data = await cacheService.getTeachers(async () => {
        const response = await teacherService.getTeachers();
        return response.data || [];
      });
      setTeachers(data);
    } catch (error) {
      console.error("Error fetching teachers:", error);
    }
  };

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedTeacher("");
    onClearFilters?.();
  }, [onClearFilters]);

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter") {
        handleSearch();
      }
    },
    [handleSearch],
  );

  const handleInputChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  return (
    <div className="space-y-4 mb-6" dir="rtl">
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="البحث برقم الجلسة، المعلم، أو المادة... (اضغط Enter للبحث)"
            value={searchTerm}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className="text-right pr-10"
          />
        </div>
        <Select value={selectedTeacher} onValueChange={handleTeacherChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="تصفية بالمعلم" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع المعلمين</SelectItem>
            {teachers.map((teacher) => (
              <SelectItem key={teacher.id} value={teacher.id}>
                {`${teacher.firstName} ${teacher.lastName}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleSearch} variant="default" size="sm" className="bg-pink-500 hover:bg-pink-600">
          <Search className="h-4 w-4 ml-2" />
          بحث
        </Button>

        {(searchTerm || selectedTeacher !== "") && (
          <Button variant="outline" onClick={clearFilters} size="sm">
            <X className="h-4 w-4 ml-2" />
            مسح
          </Button>
        )}
      </div>
    </div>
  );
}
