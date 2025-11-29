import { DreamLoading } from '@/components/DreamLoading';

export default function Loading() {
  return (
    <DreamLoading 
      messages={[
        "正在準備分析報告...",
        "讀取夢境解析...",
        "呈現潛意識洞察..."
      ]} 
    />
  );
}

