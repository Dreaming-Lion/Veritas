import { Card, CardContent, CardHeader, CardTitle } from "../../components/header/card";
import { Button } from "../../components/header/button";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/header/avatar";
import { Mail, User, KeyRound, Edit } from "lucide-react";

interface UserProfileProps {
  darkMode?: boolean;
}

export function UserProfile({ darkMode }: UserProfileProps) {
  // Mock data
  const user = {
    nickname: "김철수",
    email: "kimcheolsu@example.com",
    profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop"
  };

  const handlePasswordChange = () => {
    console.log("비밀번호 변경");
    // 비밀번호 변경 로직
  };

  const handleProfileEdit = () => {
    console.log("회원정보 수정");
    // 회원정보 수정 로직
  };

  return (
    <Card className={`border-emerald-200 ${darkMode ? 'bg-gray-800' : ''}`}>
      <CardHeader>
        <CardTitle className="text-emerald-700">내 정보</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="flex flex-col items-center gap-3">
            <Avatar className="w-24 h-24 border-2 border-emerald-200">
              <AvatarImage src={user.profileImage} alt={user.nickname} />
              <AvatarFallback className="bg-emerald-100 text-emerald-700">{user.nickname.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
          
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-emerald-600" />
              <div>
                <p className={darkMode ? "text-gray-400" : "text-gray-500"}>닉네임</p>
                <p className={darkMode ? "text-white" : "text-gray-900"}>{user.nickname}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-emerald-600" />
              <div>
                <p className={darkMode ? "text-gray-400" : "text-gray-500"}>이메일</p>
                <p className={darkMode ? "text-white" : "text-gray-900"}>{user.email}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3 pt-2">
              <Button onClick={handlePasswordChange} variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                <KeyRound className="w-4 h-4 mr-2" />
                비밀번호 변경
              </Button>
              <Button onClick={handleProfileEdit} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                <Edit className="w-4 h-4 mr-2" />
                회원정보 수정
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}