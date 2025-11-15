import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/header/dialog";
import { ScrollArea } from "../../components/header/scroll-area";
import { Clock, Tag } from "lucide-react";

interface KeywordArticlesDialogProps {
  keyword: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeywordArticlesDialog({ keyword, open, onOpenChange }: KeywordArticlesDialogProps) {
  // Mock articles data based on keyword
  const getArticlesByKeyword = (keyword: string) => {
    const allArticles: Record<string, any[]> = {
      "예산안": [
        {
          id: 1,
          title: "국회 본회의, 2025년 예산안 심사 본격화",
          category: "국회",
          viewedAt: "2025-11-13 15:30",
          thumbnail: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=400&h=250&fit=crop"
        },
        {
          id: 2,
          title: "국회 예결위, 복지예산 증액 결정",
          category: "국회",
          viewedAt: "2025-10-29 14:15",
          thumbnail: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=400&h=250&fit=crop"
        },
        {
          id: 3,
          title: "여야, 추경예산안 처리 시한 합의",
          category: "정당",
          viewedAt: "2025-10-20 10:20",
          thumbnail: "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=400&h=250&fit=crop"
        }
      ],
      "국회": [
        {
          id: 4,
          title: "야당, 방송4법 재의결 추진...여당 반발",
          category: "국회",
          viewedAt: "2025-11-12 16:30",
          thumbnail: "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=400&h=250&fit=crop"
        },
        {
          id: 5,
          title: "국회 국정감사 마무리...주요 이슈 정리",
          category: "국회",
          viewedAt: "2025-11-08 13:30",
          thumbnail: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=400&h=250&fit=crop"
        }
      ],
      "정책": [
        {
          id: 6,
          title: "여당 정책위, 세법개정안 당론 확정",
          category: "정책",
          viewedAt: "2025-10-28 10:45",
          thumbnail: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=400&h=250&fit=crop"
        },
        {
          id: 7,
          title: "정부, 신산업 육성 정책 발표",
          category: "정책",
          viewedAt: "2025-10-15 14:20",
          thumbnail: "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&h=250&fit=crop"
        }
      ],
      "외교": [
        {
          id: 8,
          title: "대통령실, 한미 정상회담 준비 본격화",
          category: "외교",
          viewedAt: "2025-11-13 11:45",
          thumbnail: "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&h=250&fit=crop"
        },
        {
          id: 9,
          title: "외교부, 한중일 정상회담 추진 협의",
          category: "외교",
          viewedAt: "2025-11-10 11:20",
          thumbnail: "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=400&h=250&fit=crop"
        }
      ]
    };

    return allArticles[keyword] || [];
  };

  const articles = keyword ? getArticlesByKeyword(keyword) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="text-emerald-700 flex items-center gap-2">
            <Tag className="w-5 h-5" />
            #{keyword} 관련 기사 ({articles.length}개)
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[600px] pr-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {articles.map((article) => (
              <div 
                key={article.id}
                className="border border-emerald-200 rounded-lg p-4 hover:shadow-md cursor-pointer transition-all group bg-white"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-gray-400">
                    <span>{article.viewedAt.split(' ')[0]}</span>
                    <Clock className="w-4 h-4" />
                  </div>
                  
                  <img 
                    src={article.thumbnail}
                    alt={article.title}
                    className="w-full h-32 object-cover rounded"
                  />
                  
                  <h3 className="text-gray-900 line-clamp-2 min-h-[3rem]">
                    {article.title}
                  </h3>
                  
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-gray-500">{article.category}</span>
                    <span className="text-emerald-600 group-hover:underline">
                      자세히 보기 →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {articles.length === 0 && keyword && (
            <div className="text-center py-12 text-gray-500">
              <Tag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>해당 키워드와 관련된 기사가 없습니다.</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}