import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/header/dialog";
import { ScrollArea } from "../../components/header/scroll-area";
import { Clock } from "lucide-react";

interface ArticleHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ArticleHistoryDialog({ open, onOpenChange }: ArticleHistoryDialogProps) {
  // Mock extended history data
  const articles = [
    {
      id: 1,
      title: "AI 기술의 최신 동향과 산업 전반에 미치는 영향",
      category: "기술",
      viewedAt: "2025-11-13 15:30",
      thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=250&fit=crop"
    },
    {
      id: 2,
      title: "클라우드 컴퓨팅의 미래: 2025년 전망",
      category: "IT",
      viewedAt: "2025-11-13 14:20",
      thumbnail: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=250&fit=crop"
    },
    {
      id: 3,
      title: "소프트웨어 개발 방법론의 진화",
      category: "개발",
      viewedAt: "2025-11-13 11:45",
      thumbnail: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&h=250&fit=crop"
    },
    {
      id: 4,
      title: "데이터 사이언스 트렌드 2025",
      category: "데이터",
      viewedAt: "2025-11-12 16:30",
      thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop"
    },
    {
      id: 5,
      title: "효율적인 프로젝트 관리를 위한 5가지 팁",
      category: "경영",
      viewedAt: "2025-11-12 09:15",
      thumbnail: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=250&fit=crop"
    },
    {
      id: 6,
      title: "사이버 보안의 중요성과 최신 위협",
      category: "보안",
      viewedAt: "2025-11-11 18:00",
      thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=250&fit=crop"
    },
    {
      id: 7,
      title: "블록체인 기술의 실제 활용 사례",
      category: "블록체인",
      viewedAt: "2025-11-11 14:30",
      thumbnail: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=250&fit=crop"
    },
    {
      id: 8,
      title: "모바일 앱 개발 트렌드",
      category: "모바일",
      viewedAt: "2025-11-10 16:45",
      thumbnail: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=250&fit=crop"
    },
    {
      id: 9,
      title: "디지털 마케팅 전략의 변화",
      category: "마케팅",
      viewedAt: "2025-11-10 11:20",
      thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop"
    },
    {
      id: 10,
      title: "원격 근무 시대의 협업 도구",
      category: "업무",
      viewedAt: "2025-11-09 15:00",
      thumbnail: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400&h=250&fit=crop"
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="text-emerald-700">전체 기사 히스토리</DialogTitle>
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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}