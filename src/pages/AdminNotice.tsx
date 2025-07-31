import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const AdminNotice = () => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState<string|null>(null);

  const handleSend = async () => {
    setSending(true);
    // 1. 모든 유저 id 조회
    const { data: users, error: userError } = await supabase.from('users').select('id');
    if (userError || !users) {
      setSending(false);
      setSuccess('유저 목록 조회 실패');
      return;
    }
    // 2. 각 유저에게 알림 insert
    const notifications = users.map((u: { id: string }) => ({
      user_id: u.id,
      message,
      read: false
    }));
    const { error: notifError } = await supabase.from('notifications').insert(notifications);
    setSending(false);
    setSuccess(notifError ? '발송 실패' : '전체 유저에게 공지 발송 완료!');
    setMessage('');
  };


  return (
    <div className="min-h-screen flex items-start justify-start bg-[#53D28C] p-0 m-0">
      <div className="w-full max-w-none h-full min-h-screen bg-white p-0 m-0 flex flex-col gap-0">
        <img src="/logo.png" alt="함께하는 세무회계 로고" className="w-48 mx-auto mt-8 mb-6" />
        <div className="mb-2">
          <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">공지사항 발송</h2>
        </div>
        <textarea
          className="w-full border border-gray-300 rounded-lg p-3 text-base focus:outline-none focus:ring-2 focus:ring-[#53D28C] focus:border-[#53D28C] min-h-[100px] resize-none transition"
          rows={4}
          placeholder="공지 내용을 입력하세요"
          value={message}
          onChange={e => setMessage(e.target.value)}
        />
        <Button
          className="w-full bg-[#53D28C] hover:bg-[#44b877] text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-60"
          onClick={handleSend}
          disabled={sending || !message}
        >
          {sending ? '발송 중...' : '전체 공지 발송'}
        </Button>
        {success && (
          <div className="text-center text-green-600 text-sm mt-2">{success}</div>
        )}
      </div>
    </div>
  );
};

export default AdminNotice;
