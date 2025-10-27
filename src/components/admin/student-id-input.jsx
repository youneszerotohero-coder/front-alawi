import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { QrCode, Search, User, Scan, CheckCircle, AlertCircle } from "lucide-react";
import { StudentCheckinDialog } from "./student-checkin-dialog";
import { studentService } from "@/services/api/student.service";

export function StudentIdInput() {
  const [studentId, setStudentId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [student, setStudent] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [error, setError] = useState("");

  // Auto-focus on input when component mounts
  useEffect(() => {
    const input = document.getElementById("student-id-input");
    if (input) {
      input.focus();
    }
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setStudentId(value);
    setError("");

    // Auto-submit when QR scanner inputs data (usually ends with Enter or specific length)
    if (value.length >= 8 && (value.includes("\n") || value.includes("\r"))) {
      handleSearch(value.replace(/[\n\r]/g, ""));
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && studentId.trim()) {
      handleSearch(studentId.trim());
    }
  };

  const handleSearch = async (id = studentId) => {
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

  const handleDialogClose = () => {
    setShowDialog(false);
    setStudent(null);
    // Refocus on input after dialog closes
    setTimeout(() => {
      const input = document.getElementById("student-id-input");
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
                <p className="text-muted-foreground">مسح معرف الطالب أو إدخاله يدوياً</p>
              </div>
            </div>
            <div className="max-w-md mx-auto space-y-8">

              {/* Input Section */}
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    id="student-id-input"
                    type="text"
                    placeholder="أدخل أو امسح معرف الطالب..."
                    value={studentId}
                    onChange={handleInputChange}
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
                  onClick={() => handleSearch()}
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
              </div>

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
