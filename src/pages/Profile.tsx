
import { useState } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
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
    position: ''
  });

  const handleEdit = () => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        department: profile.department || '',
        position: profile.position || ''
      });
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile(formData);
      setIsEditing(false);
      toast.success('프로필이 성공적으로 업데이트되었습니다!');
    } catch (error) {
      toast.error('프로필 업데이트 중 오류가 발생했습니다.');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({ name: '', department: '', position: '' });
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">프로필 관리</h1>
        <p className="text-gray-600">개인 정보를 확인하고 수정할 수 있습니다.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>개인 정보</CardTitle>
          <CardDescription>
            이름과 부서, 직급 정보를 관리할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isEditing ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">이메일</Label>
                  <p className="text-sm text-gray-900">{profile?.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">역할</Label>
                  <p className="text-sm text-gray-900">
                    {profile?.role === 'admin' ? '관리자' : 
                     profile?.role === 'manager' ? '매니저' : '직원'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">이름</Label>
                  <p className="text-sm text-gray-900">{profile?.name || '미설정'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">부서</Label>
                  <p className="text-sm text-gray-900">{profile?.department || '미설정'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">직급</Label>
                  <p className="text-sm text-gray-900">{profile?.position || '미설정'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">입사일</Label>
                  <p className="text-sm text-gray-900">
                    {profile?.hire_date ? new Date(profile.hire_date).toLocaleDateString('ko-KR') : '미설정'}
                  </p>
                </div>
              </div>
              <div className="pt-4">
                <Button onClick={handleEdit}>
                  정보 수정
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">이름</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="이름을 입력하세요"
                  />
                </div>
                <div>
                  <Label htmlFor="department">부서</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="부서를 입력하세요"
                  />
                </div>
                <div>
                  <Label htmlFor="position">직급</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="직급을 입력하세요"
                  />
                </div>
              </div>
              <div className="flex space-x-2 pt-4">
                <Button onClick={handleSave}>
                  저장
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  취소
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
