import { DreamLoading } from '@/components/DreamLoading';

export default function Loading() {
  return (
    <DreamLoading 
      messages={[
        "正在開啟夢境日記...",
        "準備記錄您的夢境...",
        "連結潛意識檔案..."
      ]} 
    />
  );
}

