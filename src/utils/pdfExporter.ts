import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * 将预览区域 DOM 导出为 PDF 文件
 * 使用 html2canvas 截图后分页写入 A4 PDF
 */
export async function exportToPdf(element: HTMLElement, title: string = '诗词填空题'): Promise<void> {
  // A4 尺寸（毫米）
  const A4_WIDTH = 210;
  const A4_HEIGHT = 297;
  const MARGIN = 15; // 页边距
  const pdfContentWidth = A4_WIDTH - MARGIN * 2;
  const pdfContentHeight = A4_HEIGHT - MARGIN * 2;

  // 收集所有需要临时解除限制的元素及其原始样式
  const styleBackup: { el: HTMLElement; prop: string; value: string }[] = [];

  const backupStyle = (el: HTMLElement | null, prop: string) => {
    if (!el) return;
    styleBackup.push({ el, prop, value: el.style.getPropertyValue(prop) });
  };

  const clearStyle = (el: HTMLElement | null, prop: string) => {
    if (!el) return;
    el.style.setProperty(prop, 'visible', 'important');
  };

  // 1. 解除 previewRef 自身的 maxHeight / overflow
  backupStyle(element, 'max-height');
  backupStyle(element, 'overflow-y');
  backupStyle(element, 'overflow');
  element.style.setProperty('max-height', 'none', 'important');
  element.style.setProperty('overflow-y', 'visible', 'important');
  element.style.setProperty('overflow', 'visible', 'important');

  // 2. 解除父元素 .preview-section 的 overflow 限制
  const parentEl = element.parentElement;
  backupStyle(parentEl, 'overflow');
  backupStyle(parentEl, 'max-height');
  if (parentEl) {
    parentEl.style.setProperty('overflow', 'visible', 'important');
    parentEl.style.setProperty('max-height', 'none', 'important');
  }

  // 3. 解除 .exam-questions 等内部滚动容器的 overflow 限制
  const scrollContainers = element.querySelectorAll('.exam-questions');
  scrollContainers.forEach((container) => {
    const el = container as HTMLElement;
    backupStyle(el, 'overflow-y');
    backupStyle(el, 'overflow');
    backupStyle(el, 'max-height');
    el.style.setProperty('overflow-y', 'visible', 'important');
    el.style.setProperty('overflow', 'visible', 'important');
    el.style.setProperty('max-height', 'none', 'important');
  });

  // 4. 解除 .exam-paper 的 flex 限制（避免 flex 容器压缩子元素）
  const examPaper = element.querySelector('.exam-paper') as HTMLElement;
  if (examPaper) {
    backupStyle(examPaper, 'max-height');
    backupStyle(examPaper, 'overflow');
    examPaper.style.setProperty('max-height', 'none', 'important');
    examPaper.style.setProperty('overflow', 'visible', 'important');
  }

  // 截图完整内容
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });

  // 恢复所有样式（按逆序）
  for (let i = styleBackup.length - 1; i >= 0; i--) {
    const { el, prop, value } = styleBackup[i];
    if (value) {
      el.style.setProperty(prop, value);
    } else {
      el.style.removeProperty(prop);
    }
  }

  const imgWidth = canvas.width;
  const imgHeight = canvas.height;

  // 计算图片在 PDF 中的尺寸（保持宽高比，适配 A4 宽度）
  const pdfImgWidth = pdfContentWidth;
  const pdfImgHeight = (imgHeight / imgWidth) * pdfImgWidth;

  // 每页对应的 canvas 像素高度
  const pageCanvasHeight = pdfContentHeight * (imgWidth / pdfContentWidth);

  const pdf = new jsPDF('p', 'mm', 'a4');
  let pageCount = 0;

  while (pageCount * pageCanvasHeight < imgHeight) {
    if (pageCount > 0) {
      pdf.addPage();
    }

    // 计算当前页需要从 canvas 裁切的区域
    const srcY = pageCount * pageCanvasHeight;
    const srcH = Math.min(pageCanvasHeight, imgHeight - srcY);

    // 创建裁切后的 canvas
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = imgWidth;
    pageCanvas.height = srcH;
    const ctx = pageCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(
        canvas,
        0, srcY, imgWidth, srcH,   // 源区域
        0, 0, imgWidth, srcH       // 目标区域
      );
    }

    const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.92);
    const pagePdfImgHeight = (srcH / imgWidth) * pdfImgWidth;

    pdf.addImage(pageImgData, 'JPEG', MARGIN, MARGIN, pdfImgWidth, pagePdfImgHeight);

    pageCount++;

    // 防止死循环
    if (pageCount > 50) break;
  }

  const fileName = `${title}_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '')}.pdf`;
  pdf.save(fileName);
}
