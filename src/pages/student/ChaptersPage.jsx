import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Zap, Globe, Atom, Thermometer, Eye, Magnet, Radio, X, Play, FileText, Clock, BookOpen } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { chapterService } from '@/services/api/chapter.service';

const StudentChaptersPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const fetchChapters = async () => {
      try {
        setLoading(true);
        const response = await chapterService.getChapters({ 
          includeCourses: true,
          limit: 100 
        });
        
        if (response.data) {
          // Handle both response structures
          const chaptersData = response.data.chapters || response.data;
          console.log('API Response:', response);
          console.log('Chapters data:', chaptersData);
          
          if (Array.isArray(chaptersData)) {
            setChapters(chaptersData);
          } else if (chaptersData.chapters && Array.isArray(chaptersData.chapters)) {
            setChapters(chaptersData.chapters);
          }
        }
      } catch (error) {
        console.error('Error fetching chapters:', error);
        setChapters([]);
      } finally {
        setLoading(false);
      }
    };

    fetchChapters();
  }, []);

  // Icon mapping for subjects
  const getChapterIcon = (title) => {
    if (title.includes('ميكانيكا')) return <Globe className="w-8 h-8" />;
    if (title.includes('كهرباء') || title.includes('مغناطيس')) return <Zap className="w-8 h-8" />;
    if (title.includes('ضوء') || title.includes('بصريات')) return <Eye className="w-8 h-8" />;
    if (title.includes('حرارة') || title.includes('ديناميكا')) return <Thermometer className="w-8 h-8" />;
    if (title.includes('ذرية') || title.includes('نووية')) return <Atom className="w-8 h-8" />;
    if (title.includes('موجات') || title.includes('صوت')) return <Radio className="w-8 h-8" />;
    return <BookOpen className="w-8 h-8" />;
  };

  const getChapterSubject = (title) => {
    if (title.includes('ميكانيكا')) return "الميكانيكا";
    if (title.includes('كهرباء') || title.includes('مغناطيس')) return "الكهرومغناطيسية";
    if (title.includes('ضوء') || title.includes('بصريات')) return "البصريات";
    if (title.includes('حرارة') || title.includes('ديناميكا')) return "الديناميكا الحرارية";
    if (title.includes('ذرية') || title.includes('نووية')) return "الفيزياء الحديثة";
    if (title.includes('موجات') || title.includes('صوت')) return "الموجات";
    return "فيزياء";
  };

  const filteredChapters = useMemo(() => {
    if (!chapters || chapters.length === 0) return [];
    return chapters.filter(chapter => 
      chapter.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chapter.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getChapterSubject(chapter.title)?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, chapters]);

  const openDialog = (chapter) => {
    console.log('Opening dialog for chapter:', chapter);
    console.log('Courses in chapter:', chapter.courses);
    setSelectedChapter(chapter);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setSelectedChapter(null);
    setDialogOpen(false);
  };

  const handleCourseClick = (courseId) => {
    navigate(`/student/courses/${courseId}`);
    closeDialog();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-400 to-pink-500 p-6 mt-16 lg:mt-20 flex items-center justify-center" dir="rtl">
        <div className="text-white text-xl">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-400 to-pink-500 p-6 mt-16 lg:mt-20" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">فصول الفيزياء</h1>
          <p className="text-red-100 text-lg">استكشف عالم الفيزياء من خلال فصول تفاعلية ومحتوى تعليمي شامل</p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8 max-w-md mx-auto">
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="w-full pr-10 pl-4 py-3 border border-red-200 rounded-xl bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent placeholder-gray-500 text-right"
            placeholder="ابحث عن فصل أو موضوع..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Chapter Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChapters.map((chapter) => (
            <div
              key={chapter.id}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 cursor-pointer border border-white/20 hover:scale-105 hover:shadow-xl"
              onClick={() => openDialog(chapter)}
            >
              <div className="flex items-center mb-4">
                <div className="text-white ml-3">
                  {getChapterIcon(chapter.title)}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">{chapter.title}</h3>
                  <span className="inline-block bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                    {getChapterSubject(chapter.title)}
                  </span>
                </div>
              </div>
              <p className="text-red-100 text-sm leading-relaxed">{chapter.description || ""}</p>
              <div className="mt-4 flex justify-between items-center">
                <span className="text-white/80 text-sm">
                  {chapter.courses?.length || 0} دروس
                </span>
                <button className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm font-medium">
                  عرض الدروس
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredChapters.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-white/60 text-lg">
              لم يتم العثور على فصول تتطابق مع بحثك
            </div>
          </div>
        )}
      </div>

      {/* Courses Dialog */}
      {selectedChapter && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden p-0 shadow-xl border-0" dir="rtl">
            <div className="bg-gradient-to-r from-red-400 to-pink-500 px-6 py-4 relative rounded-t-lg">
              <DialogHeader className="pr-0">
                <div className="flex items-center">
                  <div className="text-white ml-3 hidden md:block">
                    {getChapterIcon(selectedChapter.title)}
                  </div>
                  <div className="flex-1">
                    <DialogTitle className="text-xl md:text-2xl font-bold text-white text-right">
                      {selectedChapter.title}
                    </DialogTitle>
                    <DialogDescription className="text-right text-red-100 mt-2 hidden md:block">
                      {selectedChapter.description || ""}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
            </div>

              <div className="overflow-y-auto max-h-[calc(80vh-140px)] p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 text-right">قائمة الدروس</h3>
              <div className="space-y-4">
                {selectedChapter.courses && Array.isArray(selectedChapter.courses) && selectedChapter.courses.length > 0 ? (
                  selectedChapter.courses.map((course, index) => (
                    <div
                      key={course.id}
                      className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer hover:border-red-400"
                      onClick={() => handleCourseClick(course.id)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-r from-red-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm ml-3">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-gray-800 text-right">{course.title}</h4>
                            <p className="text-gray-600 text-sm mt-1 text-right">{course.description || ""}</p>
                          </div>
                        </div>
                      </div>

                      {course.explanationPdf && (
                        <div className="bg-blue-50 rounded-lg p-4 mt-4">
                          <div className="flex items-center mb-2">
                            <FileText className="w-4 h-4 text-blue-600 ml-2" />
                            <h5 className="font-semibold text-blue-800 text-right">ملخص الدرس</h5>
                          </div>
                          <p className="text-blue-700 text-sm text-right">متوفر</p>
                        </div>
                      )}

                      {course.activitiesPdf && (
                        <div className="bg-green-50 rounded-lg p-4 mt-4">
                          <div className="flex items-center mb-2">
                            <FileText className="w-4 h-4 text-green-600 ml-2" />
                            <h5 className="font-semibold text-green-800 text-right">التمارين</h5>
                          </div>
                          <p className="text-green-700 text-sm text-right">متوفر</p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    لا توجد دروس متاحة في هذا الفصل
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default StudentChaptersPage;