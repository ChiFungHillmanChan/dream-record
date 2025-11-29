import { DreamLoading } from '@/components/DreamLoading';

export default function Loading() {
  return (
    <DreamLoading 
      messages={[
        "正在進入管理者領域...",
        "讀取全知視野...",
        "系統校準中..."
      ]} 
    />
  );
}

