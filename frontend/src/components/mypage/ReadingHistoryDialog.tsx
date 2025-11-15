import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/header/dialog";
import { ScrollArea } from "../../components/header/scroll-area";
import { Clock, Calendar } from "lucide-react";
import { Separator } from "../../components/header/separator";

interface ReadingHistoryDialogProps {
  period: "week" | "month";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReadingHistoryDialog({ period, open, onOpenChange }: ReadingHistoryDialogProps) {
  // Mock reading history data
  const weeklyArticles = [
    {
      id: 1,
      title: "국회 본회의, 2025년 예산안 심사 본격화",
      category: "국회",
      viewedAt: "2025-11-13 15:30"
    },
    {
      id: 2,
      title: "여야 정치협상 '4+1' 회동...주요 법안 처리 논의",
      category: "정당",
      viewedAt: "2025-11-13 14:20"
    },
    {
      id: 3,
      title: "대통령실, 한미 정상회담 준비 본격화",
      category: "외교",
      viewedAt: "2025-11-13 11:45"
    },
    {
      id: 4,
      title: "야당, 방송4법 재의결 추진...여당 반발",
      category: "국회",
      viewedAt: "2025-11-12 16:30"
    },
    {
      id: 5,
      title: "지방선거 D-100...각 정당 후보 경선 시작",
      category: "선거",
      viewedAt: "2025-11-12 09:15"
    },
    {
      id: 6,
      title: "국방부, 2025 국방백서 발간...북핵 위협 대응 강화",
      category: "국방",
      viewedAt: "2025-11-11 18:00"
    },
    {
      id: 7,
      title: "행정안전부, 지방분권 로드맵 발표",
      category: "행정",
      viewedAt: "2025-11-11 14:30"
    },
    {
      id: 8,
      title: "국회 법사위, 선거법 개정안 논의 착수",
      category: "법안",
      viewedAt: "2025-11-10 16:45"
    },
    {
      id: 9,
      title: "외교부, 한중일 정상회담 추진 협의",
      category: "외교",
      viewedAt: "2025-11-10 11:20"
    },
    {
      id: 10,
      title: "여당 대표, '민생 최우선' 정책 드라이브 예고",
      category: "여당",
      viewedAt: "2025-11-09 15:00"
    },
    {
      id: 11,
      title: "국회 국정감사 마무리...주요 이슈 정리",
      category: "국회",
      viewedAt: "2025-11-08 13:30"
    },
    {
      id: 12,
      title: "통일부, 대북 정책 방향 전환 검토",
      category: "통일",
      viewedAt: "2025-11-07 10:20"
    },
    {
      id: 13,
      title: "서울시장, 2030 서울플랜 발표",
      category: "지방정치",
      viewedAt: "2025-11-06 14:45"
    },
    {
      id: 14,
      title: "야당 원내대표, '정부 독주 견제' 강조",
      category: "야당",
      viewedAt: "2025-11-05 16:20"
    },
    {
      id: 15,
      title: "국회, 노동개혁 5법 본회의 통과",
      category: "법안",
      viewedAt: "2025-11-04 10:30"
    },
    {
      id: 16,
      title: "대통령실, 규제혁신 TF 출범",
      category: "대통령실",
      viewedAt: "2025-11-03 09:15"
    },
    {
      id: 17,
      title: "국회 정개특위, 연동형 비례대표제 논의",
      category: "선거",
      viewedAt: "2025-11-02 11:45"
    },
    {
      id: 18,
      title: "한미 국방장관 회담...안보 협력 강화",
      category: "국방",
      viewedAt: "2025-11-01 15:30"
    },
    {
      id: 19,
      title: "여야 5당 대표, 민생법안 처리 합의",
      category: "국회",
      viewedAt: "2025-10-31 13:20"
    },
    {
      id: 20,
      title: "청와대, G20 정상회의 성과 브리핑",
      category: "외교",
      viewedAt: "2025-10-30 16:00"
    }
  ];

  const monthlyArticles = [
    ...weeklyArticles,
    {
      id: 21,
      title: "국회 예결위, 복지예산 증액 결정",
      category: "국회",
      viewedAt: "2025-10-29 14:15"
    },
    {
      id: 22,
      title: "여당 정책위, 세법개정안 당론 확정",
      category: "정책",
      viewedAt: "2025-10-28 10:45"
    },
    {
      id: 23,
      title: "야당, 특검법 발의...여당 수용 불가 입장",
      category: "법안",
      viewedAt: "2025-10-27 15:30"
    },
    {
      id: 24,
      title: "대통령, 경제5단체 간담회 주재",
      category: "대통령실",
      viewedAt: "2025-10-26 09:20"
    },
    {
      id: 25,
      title: "국회의장, 여야 원내대표 회동 중재",
      category: "국회",
      viewedAt: "2025-10-25 13:45"
    }
  ];

  const articles = period === "week" ? weeklyArticles : monthlyArticles;
  const title = period === "week" ? "이번 주 읽은 기사" : "이번 달 읽은 기사";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="text-emerald-700 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {title} ({articles.length}개)
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-1">
            {articles.map((article, index) => (
              <div key={article.id}>
                <div className="flex items-start gap-3 p-3 hover:bg-emerald-50 rounded cursor-pointer transition-colors group">
                  <span className="text-gray-400 mt-1 flex-shrink-0">
                    {index + 1}.
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-gray-900 group-hover:text-emerald-600 transition-colors">
                      {article.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-gray-500">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                        {article.category}
                      </span>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{article.viewedAt}</span>
                      </div>
                    </div>
                  </div>
                </div>
                {index < articles.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}