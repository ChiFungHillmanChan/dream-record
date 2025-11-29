import { DreamLoading } from '@/components/DreamLoading';

export default function Loading() {
  return (
    <DreamLoading 
      messages={[
        "正在彙整夢境碎片...",
        "分析週期波動...",
        "需要多啲時間，請耐心等待...",
        "生成週報圖表..."
      ]} 
    />
  );
}

