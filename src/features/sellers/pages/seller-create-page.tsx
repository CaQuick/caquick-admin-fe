import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

import { PageHeader } from '@/shared/ui/page-header';

import { CreateSellerForm } from '../components/create-seller-form';

export function SellerCreatePage() {
  const navigate = useNavigate();
  return (
    <>
      <PageHeader
        title="판매자 등록"
        description="계정·사업자·매장을 한 번에 만듭니다. 정한 초기 비밀번호는 판매자에게 따로 전달해 주세요."
      />
      <CreateSellerForm
        onCreated={(accountId) => {
          toast.success('판매자를 등록했습니다.');
          void navigate({ to: '/sellers/$accountId', params: { accountId }, replace: true });
        }}
      />
    </>
  );
}
