import { Card, CardContent, CardHeader, CardTitle } from "../../components/header/card";
import { Bookmark, Heart, TrendingUp } from "lucide-react";

interface ActivitySummaryProps {
  onPageChange: (page: "bookmark") => void;
  onScrollToLiked: () => void;
  darkMode?: boolean;
}

export function ActivitySummary({ onPageChange, onScrollToLiked, darkMode }: ActivitySummaryProps) {
  // Mock data
  const bookmarkCount = 42;
  const likedCount = 28;
  const totalReadCount = 156;

  return (
    <Card className={`border-emerald-200 ${darkMode ? 'bg-gray-800' : ''}`}>
      <CardHeader>
        <CardTitle className="text-emerald-700">내 활동 요약</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className={`p-6 border rounded-lg hover:shadow-md transition-all cursor-pointer group ${darkMode ? 'border-gray-700 bg-gray-700' : 'border-emerald-200'}`}>
            <div className="flex flex-col items-center gap-3">
              <TrendingUp className="w-8 h-8 text-emerald-600 group-hover:scale-110 transition-transform" />
              <div className="text-center">
                <p className={darkMode ? "text-gray-400" : "text-gray-500"}>총 읽은 기사</p>
                <p className="text-emerald-600">{totalReadCount}개</p>
              </div>
            </div>
          </div>

          <div
            className={`p-6 border rounded-lg hover:shadow-md transition-all cursor-pointer group ${darkMode ? 'border-gray-700 bg-gray-700' : 'border-emerald-200'}`}
            onClick={() => onPageChange("bookmark")}
          >
            <div className="flex flex-col items-center gap-3">
              <Bookmark className="w-8 h-8 text-blue-600 group-hover:scale-110 transition-transform" />
              <div className="text-center">
                <p className={darkMode ? "text-gray-400" : "text-gray-500"}>북마크한 기사</p>
                <p className="text-blue-600">{bookmarkCount}개</p>
              </div>
            </div>
          </div>

          <div
            className={`p-6 border rounded-lg hover:shadow-md transition-all cursor-pointer group ${darkMode ? 'border-gray-700 bg-gray-700' : 'border-emerald-200'}`}
            onClick={onScrollToLiked}
          >
            <div className="flex flex-col items-center gap-3">
              <Heart className="w-8 h-8 text-rose-500 group-hover:scale-110 transition-transform" />
              <div className="text-center">
                <p className={darkMode ? "text-gray-400" : "text-gray-500"}>좋아요 한 기사</p>
                <p className="text-rose-500">{likedCount}개</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}