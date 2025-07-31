
import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Clock, 
  Calendar, 
  Bell, 
  User, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Users,
  Moon,
  Sun
} from 'lucide-react';


const Layout = () => {
  const { user, signOut } = useAuth();
  const { profile, loading } = useUserProfile();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">프로필 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const navigation = [
    { name: '대시보드', href: '/dashboard', icon: Home },
    { name: '출근 관리', href: '/attendance', icon: Clock },
    { name: '연차 관리', href: '/leave', icon: Calendar },
    { name: '알림', href: '/notifications', icon: Bell },
    { name: '프로필', href: '/profile', icon: User },
  ];

  // 관리자 전용 메뉴
  if (profile?.role === 'admin') {
    navigation.push(
      { name: '근태관리', href: '/admin/attendance', icon: Clock },
      { name: '근무시간', href: '/admin/workhours', icon: Calendar },
      { name: '직원 관리', href: '/admin/employees', icon: Users },
      { name: '연차 승인', href: '/admin/leaves', icon: Calendar },
      { name: '공지 발송', href: '/admin/notice', icon: Bell }
    );
  }

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-mint-50 to-blue-50 flex animate-fadeIn">
      {/* 모바일 사이드바 오버레이 */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white/80 backdrop-blur-xl shadow-2xl border-r border-mint-100 rounded-r-3xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex-shrink-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
  <div className="flex flex-col h-full">
    {/* Logo/Brand */}
    <div className="flex items-center justify-between h-20 px-6 border-b border-mint-100 bg-gradient-to-r from-mint-100/60 to-blue-100/30">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="함께하는 HR 로고" style={{ width: 36, height: 36, borderRadius: 8 }} />
          <h1 className="text-xl font-extrabold text-mint-700 tracking-tight drop-shadow-sm">함께하는 HR</h1>
        </div>
      </div>
      <button
        onClick={() => setSidebarOpen(false)}
        className="lg:hidden text-mint-400 hover:text-mint-600 transition"
      >
        <X className="h-7 w-7" />
      </button>
    </div>

    {/* Navigation */}
    <nav className="flex-1 mt-8 px-4">
      <ul className="space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <li key={item.name}>
              <Link
                to={item.href}
                className={`group flex items-center gap-3 px-4 py-2 text-base font-semibold rounded-xl transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-mint-300/70 to-blue-200/70 text-mint-900 shadow-md'
                    : 'text-gray-500 hover:bg-mint-50 hover:text-mint-700'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className={`h-5 w-5 transition ${isActive ? 'text-mint-700 scale-110 drop-shadow' : 'text-mint-400 group-hover:text-mint-700'}`} />
                <span>{item.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>

    {/* Profile Card */}
    <div className="px-6 py-5 mt-auto mb-4 rounded-2xl border border-mint-100 bg-white/70 shadow-lg flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-mint-400 rounded-full flex items-center justify-center shadow">
          <span className="text-white text-xl font-bold drop-shadow">
            {profile?.name?.[0] || user.email?.[0]?.toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-mint-800 truncate">{profile?.name || '사용자'}</p>
          <Badge variant="secondary" className="text-xs bg-mint-100 text-mint-700 border-none">
            {profile?.role === 'admin' ? '관리자' : profile?.role === 'manager' ? '매니저' : '직원'}
          </Badge>
        </div>
        <Link to="/profile" className="p-2 rounded-full hover:bg-mint-50 transition" title="설정">
          <Settings className="w-5 h-5 text-mint-400" />
        </Link>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
        className="w-full mt-2 text-mint-400 hover:text-white hover:bg-gradient-to-r hover:from-mint-400 hover:to-blue-400 transition shadow"
      >
        <LogOut className="h-4 w-4 mr-2" /> 로그아웃
      </Button>
    </div>
  </div>
</div>
<style>{`
@keyframes fadeIn { from { opacity: 0; transform: translateY(15px);} to { opacity: 1; transform: none; } }
.animate-fadeIn { animation: fadeIn 0.7s cubic-bezier(.4,0,.2,1); }
`}</style>


      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex flex-col min-w-0">
  {/* 상단 헤더 (모바일) */}
  <header className="bg-white/80 backdrop-blur border-b border-mint-100 shadow-sm lg:hidden">
    <div className="flex items-center justify-between px-4 py-3">
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden text-mint-400 hover:text-mint-700 transition"
      >
        <Menu className="h-6 w-6" />
      </button>
      <div className="flex items-center space-x-4">
        <span className="text-sm text-mint-500 font-semibold">
          {new Date().toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
          })}
        </span>
      </div>
    </div>
  </header>

  {/* 페이지 컨텐츠 */}
  <main className="flex-1 p-6 md:p-10 xl:p-16 bg-gradient-to-br from-white/90 to-mint-50/60">
    <div className="max-w-5xl mx-auto w-full">
      <Outlet />
    </div>
  </main>
</div>
    </div>
  );
};

export default Layout;
