
import { useState } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
type UserProfile = Database['public']['Tables']['users']['Row'];
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const Profile = () => {
  const { profile, updateProfile, loading } = useUserProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    position: '',
    hire_date: '',
    phone: '',
    address: '',
    bank: '',
    account_number: '',
    avatar_url: ''
  });
  const [avatarFile, setAvatarFile] = useState<File|null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string|null>(null);

  const handleEdit = () => {
    console.log('handleEdit called, profile:', profile);
    if (profile) {
      setFormData({
        name: profile.name || '',
        department: profile.department || '',
        position: profile.position || '',
        hire_date: profile.hire_date || '',
        phone: profile.phone || '',
        address: profile.address || '',
        bank: profile.bank || '',
        account_number: profile.account_number || '',
        avatar_url: profile.avatar_url || ''
      });
      setAvatarPreview(profile.avatar_url || null);
    } else {
      setFormData({
        name: '',
        department: '',
        position: '',
        hire_date: '',
        phone: '',
        address: '',
        bank: '',
        account_number: '',
        avatar_url: ''
      });
      setAvatarPreview(null);
    }
    setAvatarFile(null);
    setIsEditing(true);
    setTimeout(() => {
      console.log('isEditing:', isEditing);
    }, 100);
  };

  // Handle avatar file change
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    try {
      let avatarUrl = formData.avatar_url;
      // If a new file is selected, upload to Supabase Storage
      if (avatarFile && profile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${profile.id}_${Date.now()}.${fileExt}`;
        const { data, error } = await supabase.storage.from('avatars').upload(fileName, avatarFile, { upsert: true });
        if (error) throw error;
        const { publicUrl } = supabase.storage.from('avatars').getPublicUrl(fileName).data || {};
        avatarUrl = publicUrl || '';
      }
      const result = await updateProfile({
        name: formData.name,
        department: formData.department,
        position: formData.position,
        hire_date: formData.hire_date || null,
        phone: formData.phone,
        address: formData.address,
        bank: formData.bank,
        account_number: formData.account_number,
        avatar_url: avatarUrl
      });
      if (result && result.success) {
        setIsEditing(false);
        setAvatarFile(null);
        toast.success('프로필이 성공적으로 업데이트되었습니다!');
      } else {
        toast.error('프로필 업데이트 중 오류가 발생했습니다. ' + (result?.error?.message || ''));
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('프로필 업데이트 중 알 수 없는 오류가 발생했습니다.');
    }
  };



  const handleCancel = () => {
    setIsEditing(false);
    setFormData({ name: '', department: '', position: '', hire_date: '', phone: '', address: '', bank: '', account_number: '', avatar_url: '' });
    setAvatarPreview(null);
    setAvatarFile(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center gap-2">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 mb-2">
          <img
            src={profile?.avatar_url || '/placeholder.svg'}
            alt="프로필 사진"
            className="object-cover w-full h-full"
          />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">프로필 관리</h1>
        <p className="text-gray-600">개인 정보를 확인하고 수정할 수 있습니다.</p>

      </div>

      <Card>
        <CardHeader>
          <CardTitle>개인 정보</CardTitle>
          <CardDescription>
            이름과 부서, 직급, 입사일 정보를 관리할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
  <Label htmlFor="name">이름 *</Label>
  <Input
    id="name"
    value={formData.name}
    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
    placeholder="이름을 입력하세요"
    required
    readOnly={false}
  />
</div>
<div>
  <Label htmlFor="phone">휴대폰번호</Label>
  <Input
    id="phone"
    type="tel"
    value={formData.phone}
    onChange={e => setFormData({ ...formData, phone: e.target.value })}
    placeholder="휴대폰번호를 입력하세요"
    inputMode="tel"
    pattern="[0-9\-]*"
    maxLength={20}
  />
</div>
                <div>
                  <Label htmlFor="department">부서</Label>
                  <select
                    id="department"
                    className="border px-2 py-1 rounded w-full"
                    value={["회계AA","회계DD","회계CC","회계FF","IT","노무"].includes(formData.department) ? formData.department : "__custom__"}
                    onChange={e => {
                      if (e.target.value === "__custom__") {
                        setFormData({ ...formData, department: "" });
                      } else {
                        setFormData({ ...formData, department: e.target.value });
                      }
                    }}
                  >
                    <option value="">선택하세요</option>
                    <option value="회계AA">회계AA</option>
                    <option value="회계DD">회계DD</option>
                    <option value="회계CC">회계CC</option>
                    <option value="회계FF">회계FF</option>
                    <option value="IT">IT</option>
                    <option value="노무">노무</option>
                    <option value="__custom__">직접입력</option>
                  </select>
                  {(!["회계AA","회계DD","회계CC","회계FF","IT","노무"].includes(formData.department)) && (
                    <Input
                      className="mt-2"
                      id="department_custom"
                      value={formData.department}
                      onChange={e => setFormData({ ...formData, department: e.target.value })}
                      placeholder="부서를 직접 입력하세요"
                      readOnly={false}
                    />
                  )}
                </div>
                <div>
                  <Label htmlFor="position">직급 *</Label>
                  <select
                    id="position"
                    className="border px-2 py-1 rounded w-full"
                    value={["사원","주임","대리","팀장","과장"].includes(formData.position) ? formData.position : "__custom__"}
                    onChange={e => {
                      if (e.target.value === "__custom__") {
                        setFormData({ ...formData, position: "" });
                      } else {
                        setFormData({ ...formData, position: e.target.value });
                      }
                    }}
                    required
                  >
                    <option value="">선택하세요</option>
                    <option value="사원">사원</option>
                    <option value="주임">주임</option>
                    <option value="대리">대리</option>
                    <option value="팀장">팀장</option>
                    <option value="과장">과장</option>
                    <option value="__custom__">직접입력</option>
                  </select>
                  {(!["사원","주임","대리","팀장","과장"].includes(formData.position)) && (
                    <Input
                      className="mt-2"
                      id="position_custom"
                      value={formData.position}
                      onChange={e => setFormData({ ...formData, position: e.target.value })}
                      placeholder="직급을 직접 입력하세요"
                      required
                      readOnly={false}
                    />
                  )}
                </div>
                <div>
                  <Label htmlFor="hire_date">입사일</Label>
                  <Input
                    id="hire_date"
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                    readOnly={false}
                  />
                </div>
              </div>
              {/* 주소, 은행, 계좌번호 입력 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <Label htmlFor="address">주소</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="주소를 입력하세요"
                  />
                </div>
                <div>
                  <Label htmlFor="bank">은행</Label>
                  <Input
                    id="bank"
                    value={formData.bank}
                    onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                    placeholder="은행명을 입력하세요"
                  />
                </div>
                <div>
                  <Label htmlFor="account_number">계좌번호</Label>
                  <Input
                    id="account_number"
                    value={formData.account_number}
                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                    placeholder="계좌번호를 입력하세요"
                  />
                </div>
              </div>
              <div className="flex space-x-2 pt-4">
                <Button onClick={handleSave} disabled={!formData.name || !formData.position}>
                  저장
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  취소
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>
    <Label>이름</Label>
    <div className="py-2 px-2 border rounded bg-gray-50">{profile?.name || '-'}</div>
  </div>
  <div>
    <Label>휴대폰번호</Label>
    <div className="py-2 px-2 border rounded bg-gray-50">{profile?.phone || '-'}</div>
  </div>
  <div>
    <Label>부서</Label>
    <div className="py-2 px-2 border rounded bg-gray-50">{profile?.department || '-'}</div>
  </div>
  <div>
    <Label>직급</Label>
    <div className="py-2 px-2 border rounded bg-gray-50">{profile?.position || '-'}</div>
  </div>
  <div>
    <Label>입사일</Label>
    <div className="py-2 px-2 border rounded bg-gray-50">{profile?.hire_date ? new Date(profile.hire_date).toLocaleDateString('ko-KR') : '-'}</div>
  </div>
  <div>
    <Label>주소</Label>
    <div className="py-2 px-2 border rounded bg-gray-50">{profile?.address || '-'}</div>
  </div>
  <div>
    <Label>은행</Label>
    <div className="py-2 px-2 border rounded bg-gray-50">{profile?.bank || '-'}</div>
  </div>
  <div>
    <Label>계좌번호</Label>
    <div className="py-2 px-2 border rounded bg-gray-50">{profile?.account_number || '-'}</div>
  </div>
</div>
              <div className="pt-4">
                <Button onClick={handleEdit}>
                  정보 수정
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
