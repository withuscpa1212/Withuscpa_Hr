
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Attendance from "./pages/Attendance";
import Leave from "./pages/Leave";
import NotFound from "./pages/NotFound";
import AdminEmployees from "./pages/AdminEmployees";
import AdminLeaves from "./pages/AdminLeaves";
import AdminNotice from "./pages/AdminNotice";
import Notifications from "./pages/Notifications";
import AdminAttendance from './pages/AdminAttendance';
import AdminWorkHours from './pages/AdminWorkHours';

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<Layout />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="profile" element={<Profile />} />
                <Route path="attendance" element={<Attendance />} />
                <Route path="leave" element={<Leave />} />
                {/* 관리자용 상세 기능 라우트 */}
                <Route path="admin/employees" element={<AdminEmployees />} />
                <Route path="admin/leaves" element={<AdminLeaves />} />
                <Route path="admin/notice" element={<AdminNotice />} />
                <Route path="notifications" element={<Notifications />} />
                {/* 관리자 근태 전체 기록 */}
                <Route path="admin/attendance" element={<AdminAttendance />} />
                {/* 관리자 근무시간 현황 */}
                <Route path="admin/workhours" element={<AdminWorkHours />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
