
import { useAuth } from '@/hooks/useAuth';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mint-50 to-mint-200 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex flex-col items-center mb-6">
            {/* 로고/아이콘 */}
            <div className="mb-3 flex items-center justify-center">
              <img src="/logo.png" alt="함께하는 HR 로고" style={{ width: 64, height: 64 }} />
            </div>
            <h1 className="text-5xl font-extrabold bg-gradient-to-r from-mint-500 via-mint-400 to-mint-600 bg-clip-text text-transparent tracking-tight drop-shadow mb-2">
              함께하는 HR
            </h1>
            <p className="text-lg text-mint-700 tracking-wide mb-2">HR 관리 시스템</p>
          </div>
        
        </div>

        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">환영합니다!</CardTitle>
            <CardDescription>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-700">간편한 출퇴근 관리</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">연차 신청 및 승인</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-gray-700">실시간 알림 시스템</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm text-gray-700">역할 기반 접근 제어</span>
              </div>
            </div>
            
            <div className="pt-4">
              <Link to="/auth">
                <Button className="w-full" size="lg">
                  시작하기
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
