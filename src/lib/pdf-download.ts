'use client';

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface PDFDownloadOptions {
  element: HTMLElement;
  fileName: string;
  title?: string;
  onProgress?: (message: string) => void;
}

export interface PDFDownloadResult {
  success: boolean;
  method: 'share' | 'download' | 'open' | 'print';
  error?: string;
}

// Detect device capabilities
function getDeviceInfo() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  const isMobile = isIOS || isAndroid || window.innerWidth < 768;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
    || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  
  return { isIOS, isAndroid, isMobile, isStandalone, isSafari };
}

// Method 1: Web Share API (best for mobile)
async function tryWebShare(pdfBlob: Blob, fileName: string, title: string): Promise<boolean> {
  if (!navigator.canShare || !navigator.share) return false;
  
  try {
    const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
    if (!navigator.canShare({ files: [file] })) return false;
    
    await navigator.share({
      files: [file],
      title: title,
      text: title
    });
    return true;
  } catch (err) {
    // User cancelled or share failed
    console.log('Web Share cancelled or failed:', err);
    return false;
  }
}

// Method 2: Direct blob download
async function tryBlobDownload(pdfBlob: Blob, fileName: string): Promise<boolean> {
  try {
    const blobUrl = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    
    // Use click event for better compatibility
    link.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    }, 10000);
    
    return true;
  } catch (err) {
    console.error('Blob download failed:', err);
    return false;
  }
}

// Method 3: Open in new tab (allows user to save manually)
function tryOpenInNewTab(pdfBlob: Blob, fileName: string): boolean {
  try {
    const blobUrl = URL.createObjectURL(pdfBlob);
    const newWindow = window.open(blobUrl, '_blank');
    
    if (newWindow) {
      // Set title for the new tab
      newWindow.document.title = fileName;
      
      // Cleanup after a delay
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 60000);
      
      return true;
    }
    return false;
  } catch (err) {
    console.error('Open in new tab failed:', err);
    return false;
  }
}

// Method 4: Print (works everywhere as last resort)
function triggerPrint(): boolean {
  try {
    window.print();
    return true;
  } catch (err) {
    console.error('Print failed:', err);
    return false;
  }
}

// Main PDF generation and download function
export async function downloadPDF(options: PDFDownloadOptions): Promise<PDFDownloadResult> {
  const { element, fileName, title = '報告', onProgress } = options;
  const device = getDeviceInfo();
  
  onProgress?.('正在準備內容...');
  
  try {
    // Wait for any animations to settle
    await new Promise(resolve => setTimeout(resolve, 200));
    
    onProgress?.('正在生成圖片...');
    
    // Capture the element with optimized settings
    const canvas = await html2canvas(element, {
      backgroundColor: '#0f1230',
      scale: device.isMobile ? 1.2 : 1.5, // Lower scale to prevent memory issues
      useCORS: true,
      allowTaint: true,
      logging: false,
      foreignObjectRendering: false,
      removeContainer: true,
      imageTimeout: 15000,
      // Ignore problematic elements
      ignoreElements: (el) => {
        // Ignore hidden elements and certain problematic classes
        const style = window.getComputedStyle(el);
        return style.display === 'none' || style.visibility === 'hidden';
      },
      onclone: (clonedDoc) => {
        // Remove animations from cloned document
        const style = clonedDoc.createElement('style');
        style.textContent = `
          *, *::before, *::after {
            animation: none !important;
            transition: none !important;
          }
        `;
        clonedDoc.head.appendChild(style);
      }
    });
    
    onProgress?.('正在生成 PDF...');
    
    // Generate PDF
    const imgData = canvas.toDataURL('image/jpeg', 0.85); // Use JPEG for smaller size
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    
    // Add first page
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    // Add additional pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    onProgress?.('正在下載...');
    
    // Get PDF as blob
    const pdfBlob = pdf.output('blob');
    
    // Try different download methods based on device
    if (device.isMobile || device.isStandalone) {
      // Mobile: Try Web Share first
      if (await tryWebShare(pdfBlob, fileName, title)) {
        return { success: true, method: 'share' };
      }
      
      // Then try blob download
      if (await tryBlobDownload(pdfBlob, fileName)) {
        return { success: true, method: 'download' };
      }
      
      // Then try opening in new tab
      if (tryOpenInNewTab(pdfBlob, fileName)) {
        return { success: true, method: 'open' };
      }
    } else {
      // Desktop: Try direct save first
      try {
        pdf.save(fileName);
        return { success: true, method: 'download' };
      } catch {
        // Try blob download as fallback
        if (await tryBlobDownload(pdfBlob, fileName)) {
          return { success: true, method: 'download' };
        }
        
        // Try opening in new tab
        if (tryOpenInNewTab(pdfBlob, fileName)) {
          return { success: true, method: 'open' };
        }
      }
    }
    
    // Last resort: print dialog
    triggerPrint();
    return { success: true, method: 'print' };
    
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('PDF generation failed:', errorMessage, err);
    
    // If PDF generation fails, offer print as fallback
    const confirmPrint = confirm(
      '生成 PDF 失敗。\n\n' +
      '你可以使用列印功能另存為 PDF：\n' +
      '• 電腦：選擇「儲存為 PDF」\n' +
      '• 手機：選擇「分享」或「儲存」\n\n' +
      '要開啟列印功能嗎？'
    );
    
    if (confirmPrint) {
      triggerPrint();
      return { success: true, method: 'print' };
    }
    
    return { 
      success: false, 
      method: 'download',
      error: errorMessage 
    };
  }
}

// Simpler version for pages that just want a working download
export async function simplePDFDownload(
  element: HTMLElement | null,
  fileName: string,
  setIsDownloading: (v: boolean) => void
): Promise<void> {
  if (!element) {
    alert('無法找到要下載的內容');
    return;
  }
  
  setIsDownloading(true);
  
  try {
    const result = await downloadPDF({
      element,
      fileName,
      title: fileName.replace(/_/g, ' ').replace('.pdf', '')
    });
    
    if (!result.success) {
      alert('下載失敗：' + (result.error ?? '未知錯誤'));
    } else if (result.method === 'open') {
      // Notify user that PDF opened in new tab
      alert('PDF 已在新分頁開啟，你可以從那裡儲存');
    }
  } finally {
    setIsDownloading(false);
  }
}

