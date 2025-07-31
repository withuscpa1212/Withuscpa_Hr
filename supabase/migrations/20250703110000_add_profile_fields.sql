-- 프로필 정보 확장: 주소, 은행, 계좌번호 컬럼 추가
ALTER TABLE public.users ADD COLUMN address text;
ALTER TABLE public.users ADD COLUMN bank text;
ALTER TABLE public.users ADD COLUMN account_number text;
