import { Card, CardContent, CardHeader, CardTitle } from "../../components/header/card";
import { Badge } from "../../components/header/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/header/tabs";
import { BarChart, TrendingUp, Hash } from "lucide-react";
import { useState } from "react";
import { KeywordArticlesDialog } from "../mypage/KeywordArticlesDialog";
import { ReadingHistoryDialog } from "../mypage/ReadingHistoryDialog";

interface ReadingStatsProps {
  darkMode?: boolean;
}

export function ReadingStats({ darkMode }: ReadingStatsProps) {
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month">("week");

  // Mock data
  const weeklyStats = {
    articlesRead: 23,
    mostReadCategory: "국회"
  };

  const monthlyStats = {
    articlesRead: 87,
    mostReadCategory: "대통령실"
  };

  const topKeywords = [
    { keyword: "예산안", count: 15 },
    { keyword: "국회", count: 12 },
    { keyword: "정책", count: 10 },
    { keyword: "외교", count: 8 },
    { keyword: "여야협상", count: 7 },
    { keyword: "선거", count: 6 },
    { keyword: "법안심사", count: 5 },
    { keyword: "국정감사", count: 4 }
  ];

  const handleArticlesClick = (period: "week" | "month") => {
    setSelectedPeriod(period);
    setIsHistoryOpen(true);
  };

  return (
    <>
      <Card className={`border-emerald-200 ${darkMode ? 'bg-gray-800' : ''}`}>
        <CardHeader>
          <CardTitle className="text-emerald-700 flex items-center gap-2">
            <BarChart className="w-5 h-5" />
            읽기 통계
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="week" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="week">이번 주</TabsTrigger>
              <TabsTrigger value="month">이번 달</TabsTrigger>
            </TabsList>
            
            <TabsContent value="week" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  className={`p-6 border rounded-lg cursor-pointer hover:shadow-md transition-all group ${darkMode ? 'border-gray-700 bg-gray-700' : 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white'}`}
                  onClick={() => handleArticlesClick("week")}
                >
                  <div className="flex items-center gap-2 text-emerald-600 mb-2">
                    <TrendingUp className="w-5 h-5" />
                    <span className={darkMode ? "text-gray-400" : "text-gray-500"}>읽은 기사</span>
                  </div>
                  <p className="text-emerald-700">{weeklyStats.articlesRead}개</p>
                  <p className="text-emerald-500 mt-2 group-hover:underline">자세히 보기 →</p>
                </div>

                <div className={`p-6 border rounded-lg ${darkMode ? 'border-gray-700 bg-gray-700' : 'border-emerald-200 bg-gradient-to-br from-purple-50 to-white'}`}>
                  <div className="flex items-center gap-2 text-purple-600 mb-2">
                    <Hash className="w-5 h-5" />
                    <span className={darkMode ? "text-gray-400" : "text-gray-500"}>최다 카테고리</span>
                  </div>
                  <p className="text-purple-700">{weeklyStats.mostReadCategory}</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="month" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  className={`p-6 border rounded-lg cursor-pointer hover:shadow-md transition-all group ${darkMode ? 'border-gray-700 bg-gray-700' : 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white'}`}
                  onClick={() => handleArticlesClick("month")}
                >
                  <div className="flex items-center gap-2 text-emerald-600 mb-2">
                    <TrendingUp className="w-5 h-5" />
                    <span className={darkMode ? "text-gray-400" : "text-gray-500"}>읽은 기사</span>
                  </div>
                  <p className="text-emerald-700">{monthlyStats.articlesRead}개</p>
                  <p className="text-emerald-500 mt-2 group-hover:underline">자세히 보기 →</p>
                </div>

                <div className={`p-6 border rounded-lg ${darkMode ? 'border-gray-700 bg-gray-700' : 'border-emerald-200 bg-gradient-to-br from-purple-50 to-white'}`}>
                  <div className="flex items-center gap-2 text-purple-600 mb-2">
                    <Hash className="w-5 h-5" />
                    <span className={darkMode ? "text-gray-400" : "text-gray-500"}>최다 카테고리</span>
                  </div>
                  <p className="text-purple-700">{monthlyStats.mostReadCategory}</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* 자주 본 키워드 */}
          <div className={`mt-8 pt-6 border-t ${darkMode ? 'border-gray-700' : 'border-emerald-100'}`}>
            <h3 className={`${darkMode ? 'text-white' : 'text-gray-900'} mb-4 flex items-center gap-2`}>
              <Hash className="w-5 h-5 text-emerald-600" />
              자주 본 기사 키워드
            </h3>
            <div className="flex flex-wrap gap-3">
              {topKeywords.map((item, index) => (
                <Badge
                  key={item.keyword}
                  variant="outline"
                  className={`px-4 py-2 cursor-pointer transition-all hover:shadow-md ${darkMode ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-emerald-200 hover:bg-emerald-50'}`}
                  style={{
                    fontSize: `${1 + (topKeywords.length - index) * 0.05}rem`
                  }}
                  onClick={() => setSelectedKeyword(item.keyword)}
                >
                  #{item.keyword}
                  <span className="ml-2 text-emerald-600">{item.count}</span>
                </Badge>
              ))}
            </div>
            <p className={`mt-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>💡 키워드를 클릭하면 관련 기사를 볼 수 있습니다</p>
          </div>
        </CardContent>
      </Card>

      <KeywordArticlesDialog 
        keyword={selectedKeyword}
        open={!!selectedKeyword}
        onOpenChange={(open) => !open && setSelectedKeyword(null)}
      />

      <ReadingHistoryDialog
        period={selectedPeriod}
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
      />
    </>
  );
}