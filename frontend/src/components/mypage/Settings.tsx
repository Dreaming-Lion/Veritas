import { Card, CardContent, CardHeader, CardTitle } from "../../components/header/card";
import { Switch } from "../../components/header/switch";
import { Label } from "../../components/header/label";
import { Badge } from "../../components/header/badge";
import { Moon, Sun, Bell, Mail, Tag } from "lucide-react";
import { useState } from "react";

interface SettingsProps {
  darkMode: boolean;
  onDarkModeChange: (checked: boolean) => void;
}

export function Settings({ darkMode, onDarkModeChange }: SettingsProps) {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  const allCategories = [
    "국회", "대통령실", "정당", "선거", "외교", 
    "국방", "행정", "지방정치", "정책", "법안",
    "여당", "야당", "국제정치", "통일", "안보"
  ];

  const [selectedCategories, setSelectedCategories] = useState([
    "국회", "대통령실", "정당", "선거"
  ]);

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  return (
    <Card className={`border-emerald-200 ${darkMode ? 'bg-gray-800' : ''}`}>
      <CardHeader>
        <CardTitle className="text-emerald-700 flex items-center gap-2">
          <Tag className="w-5 h-5" />
          설정 및 개인화
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 다크모드 설정 */}
        <div className="space-y-3">
          <h3 className={`${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
            {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            화면 설정
          </h3>
          <div className={`flex items-center justify-between p-4 border rounded-lg ${darkMode ? 'border-gray-700 bg-gray-700' : 'border-emerald-100'}`}>
            <div className="space-y-1">
              <Label htmlFor="dark-mode" className={darkMode ? 'text-white' : ''}>다크 모드</Label>
              <p className={darkMode ? "text-gray-400" : "text-gray-500"}>어두운 테마로 전환합니다</p>
            </div>
            <Switch
              id="dark-mode"
              checked={darkMode}
              onCheckedChange={onDarkModeChange}
            />
          </div>
        </div>

        {/* 알림 설정 */}
        <div className="space-y-3">
          <h3 className={`${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
            <Bell className="w-5 h-5" />
            알림 설정
          </h3>
          <div className="space-y-3">
            <div className={`flex items-center justify-between p-4 border rounded-lg ${darkMode ? 'border-gray-700 bg-gray-700' : 'border-emerald-100'}`}>
              <div className="space-y-1">
                <Label htmlFor="email-notifications" className={`flex items-center gap-2 ${darkMode ? 'text-white' : ''}`}>
                  <Mail className="w-4 h-4" />
                  이메일 알림
                </Label>
                <p className={darkMode ? "text-gray-400" : "text-gray-500"}>새로운 기사와 업데이트를 이메일로 받습니다</p>
              </div>
              <Switch
                id="email-notifications"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>

            <div className={`flex items-center justify-between p-4 border rounded-lg ${darkMode ? 'border-gray-700 bg-gray-700' : 'border-emerald-100'}`}>
              <div className="space-y-1">
                <Label htmlFor="push-notifications" className={`flex items-center gap-2 ${darkMode ? 'text-white' : ''}`}>
                  <Bell className="w-4 h-4" />
                  푸시 알림
                </Label>
                <p className={darkMode ? "text-gray-400" : "text-gray-500"}>중요한 소식을 실시간으로 알림받습니다</p>
              </div>
              <Switch
                id="push-notifications"
                checked={pushNotifications}
                onCheckedChange={setPushNotifications}
              />
            </div>
          </div>
        </div>

        {/* 관심 카테고리 설정 */}
        <div className="space-y-3">
          <h3 className={`${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
            <Tag className="w-5 h-5" />
            관심 카테고리
          </h3>
          <p className={darkMode ? "text-gray-400" : "text-gray-500"}>관심 있는 카테고리를 선택하세요 (추천 기사에 반영됩니다)</p>
          <div className={`flex flex-wrap gap-2 p-4 border rounded-lg ${darkMode ? 'border-gray-700 bg-gray-700' : 'border-emerald-100'}`}>
            {allCategories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategories.includes(category) ? "default" : "outline"}
                className={`cursor-pointer transition-all ${
                  selectedCategories.includes(category)
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                    : "border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50"
                }`}
                onClick={() => toggleCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
          <p className="text-emerald-600">
            {selectedCategories.length}개 카테고리 선택됨
          </p>
        </div>
      </CardContent>
    </Card>
  );
}