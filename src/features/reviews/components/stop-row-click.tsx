import { type ReactNode } from 'react';

/**
 * 행 클릭(전문 시트 열기)을 받지 않는 칸. 링크·삭제 버튼과, 포털로 뜨는 삭제 다이얼로그 안의 클릭도
 * React 트리를 따라 행까지 올라오므로 여기서 끊는다.
 */
export function StopRowClick({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={className} onClick={(e) => e.stopPropagation()}>
      {children}
    </span>
  );
}
