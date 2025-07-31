
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  department: string | null;
  position: string | null;
  phone: string | null;
  role: 'admin' | 'manager' | 'employee';
  hire_date: string | null;
  address: string | null;
  bank: string | null;
  account_number: string | null;
  avatar_url: string | null;
}

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      console.log('현재 로그인된 user.id:', user.id);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      console.log('쿼리 결과:', data, '에러:', error);

      if (error) throw error;
      
      // Type assertion to ensure role is properly typed
      const typedProfile: UserProfile = {
        ...data,
        phone: data.phone ?? null,
        role: data.role as 'admin' | 'manager' | 'employee'
      };
      
      setProfile(typedProfile);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { success: false, error: 'No user' };

    try {
      console.log('updateProfile called with:', updates, 'for user:', user.id);
      const { error, data } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        console.error('Supabase update error:', error);
        return { success: false, error };
      }
      await fetchProfile();
      return { success: true };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, error };
    }
  };


  return { profile, loading, updateProfile, refetch: fetchProfile };
};
