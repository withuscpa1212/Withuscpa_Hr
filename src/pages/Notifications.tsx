import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Notification {
  id: string;
  message: string;
  read: boolean;
  created_at: string;
  user_id: string | null;
}

const Notifications = () => {
  const { profile } = useUserProfile();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line
  }, [profile]);

  const fetchNotifications = async () => {
    if (!profile) return;
    setLoading(true);
    // Fetch user-specific and global notifications
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .or(`user_id.eq.${profile.id},user_id.is.null`)
      .order('created_at', { ascending: false });
    if (!error && data) {
      console.log('Fetched notifications:', data);
      setNotifications(data);
    } else if (error) {
      console.error('Fetch notifications error:', error);
    }
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    setMarking(id);
    const notif = notifications.find(n => n.id === id);
    if (!notif) return setMarking(null);

    if (!notif.user_id) {
      // 전체공지: 본인에게 해당 메시지의 알림이 있으면 읽음 처리, 없으면 새로 생성 후 읽음 처리
      const { data: userNotifs, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile?.id || '')
        .eq('message', notif.message);

      if (userNotifs && userNotifs.length > 0) {
        // 이미 존재하면 읽음 처리
        const { error: updateError } = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('user_id', profile?.id || '')
          .eq('message', notif.message)
          .is('read', false);
        if (updateError) console.error('Global notification update error:', updateError);
      } else {
        // 없으면 새로 생성 (읽음 상태로)
        const { error: insertError } = await supabase
          .from('notifications')
          .insert({
            user_id: profile?.id || '',
            message: notif.message,
            read: true,
            created_at: new Date().toISOString(),
          });
        if (insertError) console.error('Global notification insert error:', insertError);
      }
      // Optimistically update local state
      setNotifications((prev) => prev.map(n => (n.id === id || (n.message === notif.message && n.user_id === profile?.id)) ? { ...n, read: true } : n));
      setMarking(null);
      fetchNotifications();
      return;
    }

    // 일반 알림: 기존 방식
    const { error: normalUpdateError } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', profile?.id || '')
      .is('read', false);
    if (normalUpdateError) console.error('Notification update error:', normalUpdateError);
    // Optimistically update local state
    setNotifications((prev) => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setMarking(null);
    fetchNotifications();
  };




  return (
    <Card>
      <CardHeader>
        <CardTitle>알림</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 text-center text-gray-500">로딩 중...</div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center text-gray-500">알림이 없습니다.</div>
        ) : (
          <ul className="divide-y">
            {notifications.map((n) => (
              <li key={n.id} className="py-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 flex items-center gap-2">
                    {(!n.read && (n.user_id !== null || !notifications.some(x => x.user_id === profile?.id && x.message === n.message && x.read))) && <Badge variant="destructive">NEW</Badge>}
                    {n.message}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</div>
                </div>
                {!n.read && (
                  <Button size="sm" onClick={() => markAsRead(n.id)} disabled={marking === n.id}>
                    읽음 처리
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default Notifications;
