import { Card, CardContent, CardHeader, CardTitle } from "../../components/header/card";
import { Button } from "../../components/header/button";
import { Heart, Clock } from "lucide-react";
import { forwardRef } from "react";

interface LikedArticlesProps {
  darkMode?: boolean;
}

export const LikedArticles = forwardRef<HTMLDivElement, LikedArticlesProps>(({ darkMode }, ref) => {
  // Mock data
  const likedArticles = [
    {
      id: 1,
      title: "국회 본회의, 2025년 예산안 심사 본격화",
      category: "국회",
      likedAt: "2025-11-13 15:30",
      thumbnail: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=400&h=250&fit=crop"
    },
    {
      id: 2,
      title: "대통령실, 한미 정상회담 준비 본격화",
      category: "외교",
      likedAt: "2025-11-12 18:20",
      thumbnail: "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&h=250&fit=crop"
    },
    {
      id: 3,
      title: "국방부, 2025년 국방예산 사용 계획 발표",
      category: "국방",
      likedAt: "2025-11-10 14:15",
      thumbnail: "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=400&h=250&fit=crop"
    }
  ];

  return (
    <div ref={ref}>
      <Card className={`border-rose-200 ${darkMode ? 'bg-gray-800' : ''}`}>
        <CardHeader>
          <CardTitle className="text-rose-500 flex items-center gap-2">
            <Heart className="w-5 h-5" />
            좋아요 한 기사
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {likedArticles.map((article) => (
              <div 
                key={article.id}
                className={`border rounded-lg p-4 hover:shadow-md cursor-pointer transition-all group ${darkMode ? 'border-gray-700 bg-gray-700' : 'border-rose-200 bg-white'}`}
              >
                <div className="space-y-3">
                  <div className={`flex items-center justify-between ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    <span>{article.likedAt.split(' ')[0]}</span>
                    <Heart className="w-4 h-4 fill-current text-rose-500" />
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
                    <span className="text-rose-500 group-hover:underline">
                      자세히 보기 →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

LikedArticles.displayName = "LikedArticles";