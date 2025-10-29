import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

export function SessionsFilters({ onFiltersChange, onSearchChange, onClearFilters }) {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = useCallback(() => {
    const filters = {
      search: searchTerm.trim(),
    };
    onFiltersChange?.(filters);
    onSearchChange?.(searchTerm.trim());
  }, [searchTerm, onFiltersChange, onSearchChange]);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
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
            placeholder="البحث بالمعلم (الاسم الأول أو الأخير)... (اضغط Enter للبحث)"
            value={searchTerm}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className="text-right pr-10"
          />
        </div>
        <Button onClick={handleSearch} variant="default" size="sm" className="bg-pink-500 hover:bg-pink-600">
          <Search className="h-4 w-4 ml-2" />
          بحث
        </Button>

        {searchTerm && (
          <Button variant="outline" onClick={clearFilters} size="sm">
            <X className="h-4 w-4 ml-2" />
            مسح
          </Button>
        )}
      </div>
    </div>
  );
}
