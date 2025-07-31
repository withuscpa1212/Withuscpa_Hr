-- leave_days 테이블: 직원별 총연차(earned_days) 직접 관리용
CREATE TABLE IF NOT EXISTS public.leave_days (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  earned_days integer NOT NULL DEFAULT 15,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 직원 추가 시 leave_days에 자동 삽입 트리거(옵션)
-- 필요시 아래 트리거 함수 활성화
--
-- CREATE OR REPLACE FUNCTION public.handle_new_leave_days()
-- RETURNS trigger AS $$
-- BEGIN
--   INSERT INTO public.leave_days (user_id, earned_days)
--   VALUES (new.id, 15);
--   RETURN new;
-- END;
-- $$ LANGUAGE plpgsql;
--
-- CREATE TRIGGER insert_leave_days_after_user
-- AFTER INSERT ON public.users
-- FOR EACH ROW EXECUTE FUNCTION public.handle_new_leave_days();
