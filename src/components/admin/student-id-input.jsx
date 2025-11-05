import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { QrCode, Search, User, Scan, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { StudentCheckinDialog } from "./student-checkin-dialog";
import { studentService } from "@/services/api/student.service";
import studentsService from "@/services/api/students.service";
import { useDebounce } from "@/hooks/useDebounce";

export function StudentIdInput() {
  const [searchMode, setSearchMode] = useState("id"); // "id" or "name"
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [student, setStudent] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [error, setError] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  // Debounce name search
  const debouncedNameSearch = useDebounce(studentName, 500);

  // Search students by name
  const searchStudentsByName = useCallback(async (name) => {
    setIsSearching(true);
    setError("");
    try {
      const response = await studentsService.getStudents({
        search: name,
        limit: 10,
        page: 1,
      });
      setSearchResults(response.data || []);
      setShowResults(true);
    } catch (err) {
      console.error("Error searching students:", err);
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Auto-focus on input when component mounts or mode changes
  useEffect(() => {
    const input = document.getElementById(
      searchMode === "id" ? "student-id-input" : "student-name-input"
    );
    if (input) {
      input.focus();
    }
    // Clear search results when switching modes
    if (searchMode === "id") {
      setSearchResults([]);
      setShowResults(false);
      setStudentName("");
    }
  }, [searchMode]);

  // Search students by name when debounced name changes
  useEffect(() => {
    if (searchMode === "name" && debouncedNameSearch.trim().length >= 2) {
      searchStudentsByName(debouncedNameSearch.trim());
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [debouncedNameSearch, searchMode, searchStudentsByName]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const input = document.getElementById('student-name-input');
      const container = event.target.closest('.search-results-container');
      const isClickOnInput = input && input.contains(event.target);
      
      if (showResults && !container && !isClickOnInput) {
        setShowResults(false);
      }
    };

    if (showResults) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showResults]);

  const handleIdInputChange = (e) => {
    const value = e.target.value;
    setStudentId(value);
    setError("");

    // Auto-submit when QR scanner inputs data (usually ends with Enter or specific length)
    if (value.length >= 8 && (value.includes("\n") || value.includes("\r"))) {
      handleSearchById(value.replace(/[\n\r]/g, ""));
    }
  };

  const handleNameInputChange = (e) => {
    const value = e.target.value;
    setStudentName(value);
    setError("");
    setShowResults(value.trim().length >= 2);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      if (searchMode === "id" && studentId.trim()) {
        handleSearchById(studentId.trim());
      }
      // For name search, selection is handled by clicking on results
    }
  };

  const handleSearchById = async (id = studentId) => {
    if (!id.trim()) {
      setError("يرجى إدخال معرف الطالب");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Get student with today's sessions and subscription status
      const studentData = await studentService.getStudentWithSessions(id);
      setStudent(studentData);
      setShowDialog(true);
      setStudentId(""); // Clear input after successful search
    } catch (err) {
      setError(err.response?.data?.message || "لم يتم العثور على الطالب");
      setStudent(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectStudent = async (selectedStudent) => {
    setShowResults(false);
    setStudentName("");
    setIsLoading(true);
    setError("");

    try {
      // Get student with today's sessions and subscription status
      const studentData = await studentService.getStudentWithSessions(
        selectedStudent.id
      );
      setStudent(studentData);
      setShowDialog(true);
    } catch (err) {
      setError(err.response?.data?.message || "خطأ في تحميل بيانات الطالب");
      setStudent(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDialogClose = () => {
    setShowDialog(false);
    setStudent(null);
    // Refocus on input after dialog closes
    setTimeout(() => {
      const input = document.getElementById(
        searchMode === "id" ? "student-id-input" : "student-name-input"
      );
      if (input) {
        input.focus();
      }
    }, 100);
  };

  // QR Code Pattern Component
  const QRCodePattern = () => (
    <div className="relative w-32 h-32 mx-auto mb-6">
      {/* QR Code Background */}
      <div className="absolute inset-0 bg-white border-2 border-gray-300 rounded-lg shadow-lg">
        {/* QR Code Pattern - Simplified representation */}
        <div className="grid grid-cols-8 gap-0.5 p-2 h-full">
          {/* Corner squares */}
          <div className="col-span-2 row-span-2 bg-black rounded-sm"></div>
          <div className="col-span-2 row-span-2 bg-black rounded-sm"></div>
          <div className="col-span-2 row-span-2 bg-black rounded-sm"></div>
          <div className="col-span-2 row-span-2 bg-black rounded-sm"></div>
          
          {/* Random pattern */}
          {Array.from({ length: 32 }).map((_, i) => (
            <div
              key={i}
              className={`w-full h-full rounded-sm ${
                Math.random() > 0.5 ? 'bg-black' : 'bg-white'
              }`}
            ></div>
          ))}
        </div>
      </div>
      
      {/* Scan Animation */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-24 h-0.5 bg-pink-500 animate-pulse"></div>
      </div>
      
      {/* Scan Icon */}
      <div className="absolute -top-2 -right-2 bg-pink-500 text-white rounded-full p-1">
        <Scan className="h-4 w-4" />
      </div>
    </div>
  );

  return (
    <>
      <div className="space-y-8">
        {/* Main Check-in Card */}
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-gray-50">
          <CardContent className="p-8">
             <div className="text-center space-y-4 mb-8">
               <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-500 to-red-500 rounded-2xl shadow-lg">
                 <QrCode className="h-8 w-8 text-white" />
               </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">نظام تسجيل الحضور</h2>
                <p className="text-muted-foreground">مسح معرف الطالب أو البحث بالاسم</p>
              </div>
            </div>
            <div className="max-w-md mx-auto space-y-8">

              {/* Tabs for Search Mode */}
              <Tabs value={searchMode} onValueChange={setSearchMode} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="id">بحث بالمعرف</TabsTrigger>
                  <TabsTrigger value="name">بحث بالاسم</TabsTrigger>
                </TabsList>

                {/* ID Search Tab */}
                <TabsContent value="id" className="space-y-4 mt-6">
                  <div className="relative">
                    <Input
                      id="student-id-input"
                      type="text"
                      placeholder="أدخل أو امسح معرف الطالب..."
                      value={studentId}
                      onChange={handleIdInputChange}
                      onKeyPress={handleKeyPress}
                      className="text-right text-lg h-12 pr-12 border-2 focus:border-pink-500 transition-colors"
                      disabled={isLoading}
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      {isLoading ? (
                        <div className="animate-spin h-5 w-5 border-2 border-pink-500 border-t-transparent rounded-full" />
                      ) : error ? (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <User className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}

                  <Button
                    onClick={() => handleSearchById()}
                    disabled={isLoading || !studentId.trim()}
                    className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 transition-all duration-200 shadow-lg"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                        جاري البحث...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        البحث عن الطالب
                      </div>
                    )}
                  </Button>
                </TabsContent>

                {/* Name Search Tab */}
                <TabsContent value="name" className="space-y-4 mt-6">
                  <div className="relative">
                    <Input
                      id="student-name-input"
                      type="text"
                      placeholder="ابحث بالاسم (أدخل حرفين على الأقل)..."
                      value={studentName}
                      onChange={handleNameInputChange}
                      onKeyPress={handleKeyPress}
                      className="text-right text-lg h-12 pr-12 border-2 focus:border-pink-500 transition-colors"
                      disabled={isLoading}
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      {isSearching ? (
                        <Loader2 className="h-5 w-5 animate-spin text-pink-500" />
                      ) : error ? (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <Search className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Search Results Dropdown */}
                  {showResults && (
                    <div className="relative search-results-container">
                      <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                        {isSearching && searchResults.length === 0 ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            جاري البحث...
                          </div>
                        ) : searchResults.length === 0 && studentName.trim().length >= 2 ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            لا توجد نتائج
                          </div>
                        ) : (
                          searchResults.map((result) => (
                            <button
                              key={result.id}
                              onClick={() => handleSelectStudent(result)}
                              className="w-full p-4 text-right hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                              disabled={isLoading}
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex-1">
                                  <p className="font-medium text-sm">
                                    {result.firstName} {result.lastName}
                                  </p>
                                  {result.user?.phone && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {result.user.phone}
                                    </p>
                                  )}
                                </div>
                                <div className="w-10 h-10 rounded-full overflow-hidden border">
                                  <img
                                    src={
                                      result.picture ||
                                      `https://ui-avatars.com/api/?name=${encodeURIComponent(result.firstName || "")}+${encodeURIComponent(result.lastName || "")}&background=0D8ABC&color=fff&size=100`
                                    }
                                    alt={`${result.firstName} ${result.lastName}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(result.firstName || "")}+${encodeURIComponent(result.lastName || "")}&background=0D8ABC&color=fff&size=100`;
                                    }}
                                  />
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

            </div>
          </CardContent>
        </Card>
      </div>

      {student && (
        <StudentCheckinDialog
          student={student}
          open={showDialog}
          onOpenChange={handleDialogClose}
        />
      )}
    </>
  );
}
