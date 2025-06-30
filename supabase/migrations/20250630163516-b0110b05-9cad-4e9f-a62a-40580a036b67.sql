
-- 1. 사용자 테이블 생성
CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  department text,
  position text,
  role text CHECK (role IN ('admin', 'manager', 'employee')) DEFAULT 'employee',
  hire_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. 출근 기록 테이블
CREATE TABLE public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  clock_in timestamptz,
  clock_out timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- 3. 연차 신청 테이블
CREATE TABLE public.leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  status text CHECK (status IN ('pending', 'approved', 'denied')) DEFAULT 'pending',
  requested_at timestamptz DEFAULT now(),
  approved_by uuid REFERENCES public.users(id),
  approved_at timestamptz
);

-- 4. 알림 테이블
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  type text CHECK (type IN ('leave_approved', 'leave_denied', 'announcement')),
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 5. 회원가입 시 자동으로 users 테이블에 삽입하는 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, hire_date)
  VALUES (new.id, new.email, CURRENT_DATE);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 회원가입 트리거
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- 7. 연차 자동 계산 뷰
CREATE VIEW public.remaining_leaves AS
SELECT
  u.id as user_id,
  u.name,
  u.hire_date,
  EXTRACT(MONTH FROM AGE(CURRENT_DATE, u.hire_date)) as total_months,
  EXTRACT(MONTH FROM AGE(CURRENT_DATE, u.hire_date)) as earned_days,
  COALESCE(SUM(lr.end_date - lr.start_date + 1), 0) as used_days,
  (EXTRACT(MONTH FROM AGE(CURRENT_DATE, u.hire_date)) - COALESCE(SUM(lr.end_date - lr.start_date + 1), 0)) as remaining_days
FROM public.users u
LEFT JOIN public.leave_requests lr ON u.id = lr.user_id AND lr.status = 'approved'
GROUP BY u.id, u.name, u.hire_date;

-- 8. 연차 승인/반려 시 알림 생성 함수
CREATE OR REPLACE FUNCTION public.notify_on_leave_approval()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'approved' THEN
    INSERT INTO public.notifications (user_id, type, message)
    VALUES (NEW.user_id, 'leave_approved', '연차 신청이 승인되었습니다.');
  ELSIF NEW.status = 'denied' THEN
    INSERT INTO public.notifications (user_id, type, message)
    VALUES (NEW.user_id, 'leave_denied', '연차 신청이 반려되었습니다.');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. 연차 상태 변경 트리거
CREATE TRIGGER on_leave_status_change
  AFTER UPDATE ON public.leave_requests
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE PROCEDURE notify_on_leave_approval();

-- 10. 관리자용 공지사항 전체 알림 함수
CREATE OR REPLACE FUNCTION public.broadcast_announcement(title text, content text)
RETURNS void AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.users LOOP
    INSERT INTO public.notifications (user_id, type, message)
    VALUES (r.id, 'announcement', title || ': ' || content);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. RLS 정책 활성화
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 12. 사용자 정보 RLS 정책
CREATE POLICY "Users can view and update their own info" ON public.users
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 13. 출근 기록 RLS 정책
CREATE POLICY "Users manage their own attendance" ON public.attendance
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Managers can view team attendance" ON public.attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- 14. 연차 신청 RLS 정책
CREATE POLICY "Users manage their own leave requests" ON public.leave_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users view their own leave requests" ON public.leave_requests
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins manage all leave requests" ON public.leave_requests
  FOR ALL USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 15. 알림 RLS 정책
CREATE POLICY "Users see their own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);
