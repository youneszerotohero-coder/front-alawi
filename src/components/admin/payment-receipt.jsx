import { useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { X, Printer } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export function PaymentReceipt({ payment, student, session, open, onClose }) {
  const receiptRef = useRef(null);
  const hasPrintedRef = useRef(false);

  if (!open || !payment) return null;

  // Get teacher name from session or payment response
  const teacherName = 
    (session?.teacher?.firstName && session?.teacher?.lastName
      ? `${session.teacher.firstName} ${session.teacher.lastName}`
      : null) ||
    (payment?.session?.teacher?.firstName && payment?.session?.teacher?.lastName
      ? `${payment.session.teacher.firstName} ${payment.session.teacher.lastName}`
      : "غير محدد");

  // Generate QR code URL for student - use userId if available, otherwise use student id
  const studentId = student?.userId || payment?.student?.userId || student?.id || payment?.studentId || payment?.student?.id;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${studentId}`;

  // Calculate start date (payment creation date)
  const startDate = payment.createdAt ? new Date(payment.createdAt) : new Date();
  
  // Calculate end date (30 days after start date)
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 30);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("ar-DZ").format(amount) + " دج";
  };

  const formatDate = (date) => {
    if (!date) return new Date().toLocaleDateString("ar-DZ");
    return new Date(date).toLocaleDateString("ar-DZ");
  };

  const handlePrint = useCallback(async () => {
    if (!receiptRef.current) return;

    try {
      // Create a temporary container for printing
      const tempContainer = document.createElement("div");
      tempContainer.style.position = "absolute";
      tempContainer.style.left = "-9999px";
      tempContainer.style.width = "400px";
      tempContainer.style.padding = "20px";
      tempContainer.style.backgroundColor = "white";
      tempContainer.style.fontFamily = "Arial, sans-serif";
      tempContainer.style.direction = "rtl";
      tempContainer.style.textAlign = "right";

      // Clone the receipt content
      const receiptContent = receiptRef.current.cloneNode(true);
      tempContainer.appendChild(receiptContent);

      // Append to body temporarily
      document.body.appendChild(tempContainer);

      // Wait a bit for images to load
      await new Promise(resolve => setTimeout(resolve, 500));

      // Convert to canvas and create PDF
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [80, 200], // Receipt size
      });

      const imgWidth = 80;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

      // Download PDF
      const fileName = `إيصال_دفع_${new Date().getTime()}.pdf`;
      pdf.save(fileName);

      // Remove temporary container
      document.body.removeChild(tempContainer);
    } catch (error) {
      console.error("Error printing receipt:", error);
      alert("حدث خطأ أثناء طباعة الإيصال");
    }
  }, []);

  // Auto-print when receipt opens
  useEffect(() => {
    if (open && payment && receiptRef.current && !hasPrintedRef.current) {
      // Wait a bit for the modal to render and images to load
      const timer = setTimeout(() => {
        handlePrint();
        hasPrintedRef.current = true;
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [open, payment, handlePrint]);

  // Reset print flag when modal closes
  useEffect(() => {
    if (!open) {
      hasPrintedRef.current = false;
    }
  }, [open]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">إيصال الدفع</h2>
            <div className="flex gap-2">
              <Button
                onClick={handlePrint}
                variant="default"
                size="default"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Printer className="h-4 w-4" />
                طباعة
              </Button>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div ref={receiptRef} className="space-y-4 print:block">
            {/* Header with School Name */}
            <div className="text-center border-b pb-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Delta School</h2>
              <h3 className="text-xl font-bold text-gray-900">إيصال استلام</h3>
            </div>

            {/* Teacher Name */}
            <div className="border-b pb-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">الأستاذ:</span>
                <span className="font-semibold text-gray-900">{teacherName}</span>
              </div>
            </div>

            {/* Start Date */}
            <div className="border-b pb-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">تاريخ البداية:</span>
                <span className="font-semibold text-gray-900">
                  {formatDate(startDate)}
                </span>
              </div>
            </div>

            {/* End Date */}
            <div className="border-b pb-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">تاريخ الانتهاء:</span>
                <span className="font-semibold text-gray-900">
                  {formatDate(endDate)}
                </span>
              </div>
            </div>

            {/* Amount */}
            <div className="border-b pb-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">المبلغ:</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(payment.amount)}
                </span>
              </div>
            </div>

            {/* QR Code */}
            <div className="border-b pb-3">
              <div className="text-center">
                <p className="text-gray-600 mb-2">رمز الاستجابة السريعة</p>
                <div className="flex justify-center">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    className="w-32 h-32 border-2 border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <Button onClick={onClose} variant="default" className="w-full">
              إغلاق
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

