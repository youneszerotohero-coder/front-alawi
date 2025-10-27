import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Play,
  FileText,
  Download,
  BookOpen,
  Clock,
  User,
  Star,
} from "lucide-react";
import VideoPlayer from "../../components/student/VideoPlayer";
import { courseService } from "../../services/api/course.service";

const StudentCoursePage = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("video");
  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chapterData, setChapterData] = useState(null);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const response = await courseService.getCourse(id);
        
        if (response.data) {
          setCourseData(response.data);
          
          // Fetch chapter data if available
          if (response.data.chapterId) {
            // You might want to fetch chapter info here if needed
            // For now, we'll just use the course data
          }
        }
      } catch (error) {
        console.error('Error fetching course:', error);
        setCourseData({
          id: id,
          title: "الدورة",
          description: "جارٍ تحميل محتوى الدورة...",
          videoLink: "",
          explanationPdf: "",
          activitiesPdf: "",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id]);

  const tabs = [
    { id: "video", label: "الفيديو", icon: Play },
    { id: "summary", label: "ملخص الدرس", icon: FileText },
    { id: "exercises", label: "التمارين", icon: BookOpen },
  ];

  const handleDownloadPdf = async (pdfType) => {
    try {
      let filePath;
      if (pdfType === 'summary' && courseData?.explanationPdf) {
        filePath = `explanation/${courseData.explanationPdf}`;
      } else if (pdfType === 'exercises' && courseData?.activitiesPdf) {
        filePath = `activities/${courseData.activitiesPdf}`;
      } else {
        return;
      }
      
      // Construct the full URL from the environment or use the file path directly
      // Note: You may need to adjust this based on your actual file serving setup
      const fileUrl = `/api/v1/files/${filePath}`;
      window.open(fileUrl, '_blank');
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto mt-20 flex items-center justify-center h-64">
        <div className="text-gray-600 text-xl">جاري تحميل محتوى الدورة...</div>
      </div>
    );
  }

  if (!courseData) {
    return (
      <div className="max-w-7xl mx-auto mt-20 flex items-center justify-center h-64">
        <div className="text-red-600 text-xl">لم يتم العثور على الدورة</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto mt-20" dir="rtl">
      {/* Course Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex gap-4">
          <div className="w-full flex flex-col">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {courseData.title || "دورة الفيزياء"}
            </h1>
            <p className="text-gray-600 mb-4">
              {courseData.description || "لا يوجد وصف متاح"}
            </p>

            {/* Course Stats */}
            {courseData.chapter && (
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mt-2">
                <div className="flex items-center space-x-1 rtl:space-x-reverse">
                  <BookOpen className="w-4 h-4" />
                  <span>الفصل: {courseData.chapter.title}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex justify-end space-x-8 rtl:space-x-reverse px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 rtl:space-x-reverse py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === tab.id
                      ? "border-pink-500 text-pink-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "video" && (
            <div className="space-y-6">
              {courseData.videoLink ? (
                <VideoPlayer
                  videoSrc={courseData.videoLink}
                  title={courseData.title}
                  duration=""
                  thumbnail=""
                />
              ) : (
                <div className="bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 h-96 flex items-center justify-center">
                  <div className="text-center">
                    <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-600 mb-2">
                      لا يوجد فيديو متاح
                    </h4>
                    <p className="text-gray-500">
                      سيتم إضافة محتوى الفيديو قريباً
                    </p>
                  </div>
                </div>
              )}

              {/* Video Description */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  وصف الدرس
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {courseData.description || "لا يوجد وصف متاح لهذا الدرس"}
                </p>
              </div>
            </div>
          )}

          {activeTab === "summary" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  ملخص الدرس
                </h3>
                {courseData.explanationPdf && (
                  <button 
                    onClick={() => handleDownloadPdf('summary')}
                    className="flex items-center space-x-2 rtl:space-x-reverse bg-gradient-to-r from-red-400 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-red-500 hover:to-pink-600 transition-colors duration-200"
                  >
                    <Download className="w-4 h-4" />
                    <span>تحميل PDF</span>
                  </button>
                )}
              </div>

              {/* PDF Viewer Placeholder */}
              {courseData.explanationPdf ? (
                <div className="bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 h-96 flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-600 mb-2">
                      ملخص الدرس
                    </h4>
                    <p className="text-gray-500 mb-4">
                      اضغط على تحميل PDF لعرض الملف
                    </p>
                    <button 
                      onClick={() => handleDownloadPdf('summary')}
                      className="bg-gradient-to-r from-red-400 to-pink-500 text-white px-6 py-2 rounded-lg hover:from-red-500 hover:to-pink-600 transition-colors duration-200"
                    >
                      تحميل PDF
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 h-96 flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-600 mb-2">
                      لا يوجد ملخص متاح
                    </h4>
                    <p className="text-gray-500">
                      سيتم إضافة ملخص الدرس قريباً
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "exercises" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  تمارين الدرس
                </h3>
                {courseData.activitiesPdf && (
                  <button 
                    onClick={() => handleDownloadPdf('exercises')}
                    className="flex items-center space-x-2 rtl:space-x-reverse bg-gradient-to-r from-red-400 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-red-500 hover:to-pink-600 transition-colors duration-200"
                  >
                    <Download className="w-4 h-4" />
                    <span>تحميل PDF</span>
                  </button>
                )}
              </div>

              {/* PDF Viewer Placeholder */}
              {courseData.activitiesPdf ? (
                <div className="bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 h-96 flex items-center justify-center">
                  <div className="text-center">
                    <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-600 mb-2">
                      تمارين الدرس
                    </h4>
                    <p className="text-gray-500 mb-4">
                      اضغط على تحميل PDF لعرض التمارين
                    </p>
                    <button 
                      onClick={() => handleDownloadPdf('exercises')}
                      className="bg-gradient-to-r from-red-400 to-pink-500 text-white px-6 py-2 rounded-lg hover:from-red-500 hover:to-pink-600 transition-colors duration-200"
                    >
                      تحميل PDF
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 h-96 flex items-center justify-center">
                  <div className="text-center">
                    <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-600 mb-2">
                      لا توجد تمارين متاحة
                    </h4>
                    <p className="text-gray-500">
                      سيتم إضافة تمارين قريباً
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentCoursePage;
