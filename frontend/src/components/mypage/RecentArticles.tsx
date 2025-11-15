import { Card, CardContent, CardHeader, CardTitle } from "../../components/header/card";
import { Button } from "../../components/header/button";
import { ChevronRight, Clock } from "lucide-react";
import { useState } from "react";
import { ArticleHistoryDialog } from "../mypage/ArticleHistoryDialog";

interface RecentArticlesProps {
  darkMode?: boolean;
}

export function RecentArticles({ darkMode }: RecentArticlesProps) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Mock data
  const recentArticles = [
    {
      id: 1,
      title: "국회 본회의, 2025년 예산안 심사 본격화",
      category: "국회",
      viewedAt: "2025-11-13 15:30",
      thumbnail: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=400&h=250&fit=crop"
    },
    {
      id: 2,
      title: "여야 정치협상 '4+1' 회동...주요 법안 처리 논의",
      category: "정당",
      viewedAt: "2025-11-13 14:20",
      thumbnail: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=400&h=250&fit=crop"
    },
    {
      id: 3,
      title: "대통령실, 한미 정상회담 준비 본격화",
      category: "외교",
      viewedAt: "2025-11-13 11:45",
      thumbnail: "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&h=250&fit=crop"
    },
    {
      id: 4,
      title: "야당, 방송4법 재의결 추진...여당 반발",
      category: "국회",
      viewedAt: "2025-11-12 16:30",
      thumbnail: "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=400&h=250&fit=crop"
    },
    {
      id: 5,
      title: "지방선거 D-100...각 정당 후보 경선 시작",
      category: "선거",
      viewedAt: "2025-11-12 09:15",
      thumbnail: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=400&h=250&fit=crop"
    }
  ];

  return (
    <>
      <Card className={`border-emerald-200 ${darkMode ? 'bg-gray-800' : ''}`}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-emerald-700">최근 본 기사</CardTitle>
            <Button 
              variant="ghost" 
              onClick={() => setIsHistoryOpen(true)}
              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
            >
              더보기 →
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentArticles.map((article) => (
              <div 
                key={article.id}
                className={`border rounded-lg p-4 hover:shadow-md cursor-pointer transition-all group ${darkMode ? 'border-gray-700 bg-gray-700' : 'border-emerald-200 bg-white'}`}
              >
                <div className="space-y-3">
                  <div className={`flex items-center justify-between ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    <span>{article.viewedAt.split(' ')[0]}</span>
                    <Clock className="w-4 h-4" />
                  </div>
                  
                  <img 
                    src={article.thumbnail}
                    alt={article.title}
                    className="w-full h-40 object-cover rounded"
                  />
                  
                  <h3 className={`line-clamp-2 min-h-[3rem] ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {article.title}
                  </h3>
                  
                  <div className="flex items-center justify-between pt-2">
                    <span className={darkMode ? "text-gray-400" : "text-gray-500"}>{article.category}</span>
                    <span className="text-emerald-600 group-hover:underline">
                      자세히 보기 →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <ArticleHistoryDialog 
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
      />
    </>
  );
}