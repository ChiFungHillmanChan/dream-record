import { DreamLoading } from '@/components/DreamLoading';

export default function Loading() {
  return (
    <DreamLoading 
      messages={[
        "正在調整夢境頻率...",
        "更新靈魂參數...",
        "儲存偏好設定..."
      ]} 
    />
  );
}

