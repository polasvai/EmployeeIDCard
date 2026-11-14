import { PDFDocument, rgb } from 'pdf-lib';
import { CR80, A4, MM_TO_PT } from '../constants/printSpecs';
import { generateQrCodeDataUrl, generateBarcodeDataUrl } from './barcodeGenerator';
import { createImage } from './imageProcessor';

/**
 * Replaces {{fieldName}} dynamic tokens with record values.
 */
export function resolveFieldToken(templateText, record) {
  if (!templateText) return '';
  return templateText.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, fieldKey) => {
    if (record[fieldKey] !== undefined && record[fieldKey] !== null) {
      return String(record[fieldKey]);
    }
    if (record.customFields && record.customFields[fieldKey] !== undefined) {
      return String(record.customFields[fieldKey]);
    }
    return '';
  });
}

/**
 * Renders one side (front or back) of an ID card onto an offscreen canvas at full 300 DPI.
 * @param {object} template - The template definition
 * @param {'front'|'back'} side - Which side to render
 * @param {object} record - The person's data record
 * @returns {Promise<string>} PNG Data URL
 */
export async function renderCardSideToCanvas(template, side, record) {
  const isLandscape = template.orientation !== 'portrait';
  const width = isLandscape ? CR80.landscape.widthPx : CR80.portrait.widthPx;
  const height = isLandscape ? CR80.landscape.heightPx : CR80.portrait.heightPx;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Could not get 2D canvas context');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const background = side === 'front' ? template.frontBackground : template.backBackground;
  const elements = (side === 'front' ? template.frontElements : template.backElements) || [];

  // 1. Draw Background
  if (background?.type === 'gradient') {
    const angleRad = ((background.gradientAngle || 135) * Math.PI) / 180;
    const x2 = Math.cos(angleRad) * width;
    const y2 = Math.sin(angleRad) * height;
    const grad = ctx.createLinearGradient(0, 0, x2, y2);
    grad.addColorStop(0, background.value || '#ffffff');
    grad.addColorStop(1, background.secondaryValue || '#e2e8f0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  } else if (background?.type === 'image' && background.value) {
    try {
      const bgImg = await createImage(background.value);
      ctx.drawImage(bgImg, 0, 0, width, height);
    } catch (e) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    }
  } else {
    ctx.fillStyle = background?.value || '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }

  // 2. Draw Elements in z-index order
  for (const elem of elements) {
    if (elem.visible === false) continue;

    ctx.save();

    const elemX = elem.x || 0;
    const elemY = elem.y || 0;
    const elemW = elem.width || 100;
    const elemH = elem.height || 100;

    switch (elem.type) {
      case 'shape': {
        ctx.fillStyle = elem.fill || '#000000';
        if (elem.shapeType === 'circle') {
          ctx.beginPath();
          ctx.ellipse(
            elemX + elemW / 2,
            elemY + elemH / 2,
            elemW / 2,
            elemH / 2,
            0,
            0,
            2 * Math.PI
          );
          ctx.fill();
        } else if (elem.shapeType === 'line') {
          ctx.strokeStyle = elem.stroke || elem.fill || '#000000';
          ctx.lineWidth = elem.strokeWidth || 2;
          ctx.beginPath();
          ctx.moveTo(elemX, elemY);
          ctx.lineTo(elemX + elemW, elemY + elemH);
          ctx.stroke();
        } else {
          // Rectangle with optional rounded corners
          const r = elem.cornerRadius || 0;
          if (r > 0 && ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(elemX, elemY, elemW, elemH, r);
            ctx.fill();
          } else {
            ctx.fillRect(elemX, elemY, elemW, elemH);
          }
        }
        break;
      }

      case 'text':
      case 'dynamicText': {
        let textContent = '';
        if (elem.type === 'dynamicText') {
          const val =
            record[elem.fieldKey] ??
            (record.customFields && record.customFields[elem.fieldKey]) ??
            elem.fallback ??
            '';
          textContent = `${elem.prefix || ''}${val}${elem.suffix || ''}`;
        } else {
          textContent = resolveFieldToken(elem.content || '', record);
        }

        const fontStyle = elem.fontStyle || 'normal';
        const fontSize = elem.fontSize || 24;
        const fontFamily = elem.fontFamily || 'Inter';
        ctx.font = `${fontStyle} ${fontSize}px "${fontFamily}", sans-serif`;
        ctx.fillStyle = elem.fill || '#000000';
        ctx.textBaseline = 'top';

        const align = elem.align || 'left';
        ctx.textAlign = align;

        let drawX = elemX;
        if (align === 'center') drawX = elemX + elemW / 2;
        if (align === 'right') drawX = elemX + elemW;

        // Support multiline text
        const lines = String(textContent).split('\n');
        const lineHeight = fontSize * (elem.lineHeight || 1.3);
        lines.forEach((line, index) => {
          ctx.fillText(line, drawX, elemY + index * lineHeight);
        });
        break;
      }

      case 'photo': {
        const photoUrl =
          record.photoUrl ||
          record[elem.fieldKey] ||
          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" fill="%2394a3b8"><rect width="200" height="200" fill="%23e2e8f0"/><circle cx="100" cy="80" r="40"/><path d="M40 180 c0-40 30-60 60-60 s60 20 60 60"/></svg>';

        try {
          const photoImg = await createImage(photoUrl);
          const r = elem.borderRadius || 0;

          ctx.beginPath();
          if (r >= elemW / 2) {
            ctx.ellipse(
              elemX + elemW / 2,
              elemY + elemH / 2,
              elemW / 2,
              elemH / 2,
              0,
              0,
              2 * Math.PI
            );
          } else if (r > 0 && ctx.roundRect) {
            ctx.roundRect(elemX, elemY, elemW, elemH, r);
          } else {
            ctx.rect(elemX, elemY, elemW, elemH);
          }
          ctx.closePath();
          ctx.clip();

          ctx.drawImage(photoImg, elemX, elemY, elemW, elemH);

          // Border stroke if present
          if (elem.borderWidth && elem.borderColor) {
            ctx.strokeStyle = elem.borderColor;
            ctx.lineWidth = elem.borderWidth * 2;
            ctx.stroke();
          }
        } catch (photoErr) {
          console.warn('Could not load record photo:', photoErr);
        }
        break;
      }

      case 'qrCode': {
        const payload = String(
          record[elem.fieldKey] ??
          (record.customFields && record.customFields[elem.fieldKey]) ??
          record.idNumber ??
          'ID-SAMPLE'
        );
        try {
          const qrDataUrl = await generateQrCodeDataUrl(payload, {
            width: elemW,
            margin: 1,
            darkColor: elem.darkColor || '#000000',
            lightColor: elem.lightColor || '#ffffff',
          });
          if (qrDataUrl) {
            const qrImg = await createImage(qrDataUrl);
            ctx.drawImage(qrImg, elemX, elemY, elemW, elemH);
          }
        } catch (qrErr) {
          console.warn('QR code generation failed:', qrErr);
        }
        break;
      }

      case 'barcode': {
        const payload = String(
          record[elem.fieldKey] ??
          (record.customFields && record.customFields[elem.fieldKey]) ??
          record.idNumber ??
          '12345678'
        );
        try {
          const barcodeDataUrl = generateBarcodeDataUrl(payload, {
            format: elem.barcodeType || 'CODE128',
            width: 2,
            height: elemH,
            displayValue: elem.showText !== false,
            lineColor: elem.lineColor || '#000000',
          });
          if (barcodeDataUrl) {
            const bcImg = await createImage(barcodeDataUrl);
            ctx.drawImage(bcImg, elemX, elemY, elemW, elemH);
          }
        } catch (bcErr) {
          console.warn('Barcode generation failed:', bcErr);
        }
        break;
      }

      case 'image': {
        if (elem.src) {
          try {
            const staticImg = await createImage(elem.src);
            ctx.drawImage(staticImg, elemX, elemY, elemW, elemH);
          } catch (e) {
            console.warn('Static image load error:', e);
          }
        }
        break;
      }

      default:
        break;
    }

    ctx.restore();
  }

  return canvas.toDataURL('image/png');
}

/**
 * Draws hairline crop marks at card corners on an imposed A4 PDF page.
 */
function drawCropMarks(page, x, y, width, height, markLength = 12) {
  const strokeColor = rgb(0.2, 0.2, 0.2);
  const thickness = 0.5;

  // Top-Left corner
  page.drawLine({ start: { x: x - markLength, y: y + height }, end: { x: x - 2, y: y + height }, thickness, color: strokeColor });
  page.drawLine({ start: { x: x, y: y + height + markLength }, end: { x: x, y: y + height + 2 }, thickness, color: strokeColor });

  // Top-Right corner
  page.drawLine({ start: { x: x + width + 2, y: y + height }, end: { x: x + width + markLength, y: y + height }, thickness, color: strokeColor });
  page.drawLine({ start: { x: x + width, y: y + height + markLength }, end: { x: x + width, y: y + height + 2 }, thickness, color: strokeColor });

  // Bottom-Left corner
  page.drawLine({ start: { x: x - markLength, y: y }, end: { x: x - 2, y: y }, thickness, color: strokeColor });
  page.drawLine({ start: { x: x, y: y - markLength }, end: { x: x, y: y - 2 }, thickness, color: strokeColor });

  // Bottom-Right corner
  page.drawLine({ start: { x: x + width + 2, y: y }, end: { x: x + width + markLength, y: y }, thickness, color: strokeColor });
  page.drawLine({ start: { x: x + width, y: y - markLength }, end: { x: x + width, y: y - 2 }, thickness, color: strokeColor });
}

/**
 * Main PDF Assembly and Export Engine.
 * Supports:
 * 1. Single Card Mode (Direct PVC Printer): strictly 85.6mm x 53.98mm pages
 * 2. A4 Sheet Imposition Mode: 8 or 10 cards per sheet with crop marks & duplex mirroring
 *
 * @param {object} config
 * @param {object} config.template - Active card template
 * @param {Array<object>} config.records - List of records to render
 * @param {'single'|'a4'} [config.mode='a4'] - 'single' for PVC card printers or 'a4' for sheet printing
 * @param {boolean} [config.includeBack=true] - Whether to generate back sides
 * @param {boolean} [config.mirrorBack=true] - Whether to horizontally mirror A4 back pages for duplex alignment
 * @param {function} [config.onProgress] - Callback for real-time progress updates
 * @returns {Promise<{ pdfBytes: Uint8Array, blob: Blob, download: (filename?: string) => void }>}
 */
export async function exportCardsPdf({
  template,
  records,
  mode = 'a4',
  includeBack = true,
  mirrorBack = true,
  onProgress = () => {},
}) {
  if (!records || records.length === 0) {
    throw new Error('No records selected for printing');
  }

  const pdfDoc = await PDFDocument.create();
  const isLandscape = template.orientation !== 'portrait';

  const cardWidthPt = isLandscape ? CR80.landscape.widthPt : CR80.portrait.widthPt;
  const cardHeightPt = isLandscape ? CR80.landscape.heightPt : CR80.portrait.heightPt;

  const totalSteps = records.length * (includeBack ? 2 : 1);
  let completedSteps = 0;

  const reportProgress = (statusText) => {
    completedSteps++;
    const percentage = Math.min(100, Math.round((completedSteps / totalSteps) * 100));
    onProgress({ current: completedSteps, total: totalSteps, percentage, statusText });
  };

  // Pre-render card images to memory
  const renderedCards = [];
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    reportProgress(`Rendering front: ${record.fullName || `Card ${i + 1}`}`);
    const frontDataUrl = await renderCardSideToCanvas(template, 'front', record);

    let backDataUrl = null;
    if (includeBack) {
      reportProgress(`Rendering back: ${record.fullName || `Card ${i + 1}`}`);
      backDataUrl = await renderCardSideToCanvas(template, 'back', record);
    }

    renderedCards.push({ record, frontDataUrl, backDataUrl });
  }

  if (mode === 'single') {
    // SINGLE CARD MODE (Direct PVC Printer)
    // Page dimensions match the CR80 card exactly
    for (const item of renderedCards) {
      // Front Page
      const frontImg = await pdfDoc.embedPng(item.frontDataUrl);
      const frontPage = pdfDoc.addPage([cardWidthPt, cardHeightPt]);
      frontPage.drawImage(frontImg, {
        x: 0,
        y: 0,
        width: cardWidthPt,
        height: cardHeightPt,
      });

      // Back Page
      if (includeBack && item.backDataUrl) {
        const backImg = await pdfDoc.embedPng(item.backDataUrl);
        const backPage = pdfDoc.addPage([cardWidthPt, cardHeightPt]);
        backPage.drawImage(backImg, {
          x: 0,
          y: 0,
          width: cardWidthPt,
          height: cardHeightPt,
        });
      }
    }
  } else {
    // A4 SHEET IMPOSITION MODE
    const gridConfig = isLandscape ? A4.landscapeGrid : A4.portraitGrid;
    const { cols, rows, maxCards, spacingPt } = gridConfig;

    const a4WidthPt = A4.widthPt;
    const a4HeightPt = A4.heightPt;

    // Calculate grid positioning to center on A4 page
    const totalGridWidth = cols * cardWidthPt + (cols - 1) * spacingPt;
    const totalGridHeight = rows * cardHeightPt + (rows - 1) * spacingPt;
    const startX = (a4WidthPt - totalGridWidth) / 2;
    const startY = (a4HeightPt - totalGridHeight) / 2;

    // Chunk records into pages
    for (let sheetIdx = 0; sheetIdx < renderedCards.length; sheetIdx += maxCards) {
      const sheetCards = renderedCards.slice(sheetIdx, sheetIdx + maxCards);

      // FRONT SHEET
      const frontSheet = pdfDoc.addPage([a4WidthPt, a4HeightPt]);

      for (let i = 0; i < sheetCards.length; i++) {
        const card = sheetCards[i];
        const col = i % cols;
        const row = Math.floor(i / cols);

        // PDF coordinate (0,0) is bottom-left
        const posX = startX + col * (cardWidthPt + spacingPt);
        const posY = a4HeightPt - startY - (row + 1) * cardHeightPt - row * spacingPt;

        const img = await pdfDoc.embedPng(card.frontDataUrl);
        frontSheet.drawImage(img, {
          x: posX,
          y: posY,
          width: cardWidthPt,
          height: cardHeightPt,
        });

        drawCropMarks(frontSheet, posX, posY, cardWidthPt, cardHeightPt);
      }

      // BACK SHEET (if requested)
      if (includeBack) {
        const backSheet = pdfDoc.addPage([a4WidthPt, a4HeightPt]);

        for (let i = 0; i < sheetCards.length; i++) {
          const card = sheetCards[i];
          if (!card.backDataUrl) continue;

          let col = i % cols;
          const row = Math.floor(i / cols);

          // If duplex mirroring is enabled, flip the column index horizontally
          // so back of card matches front of card when duplex flipped on long edge
          if (mirrorBack) {
            col = cols - 1 - col;
          }

          const posX = startX + col * (cardWidthPt + spacingPt);
          const posY = a4HeightPt - startY - (row + 1) * cardHeightPt - row * spacingPt;

          const img = await pdfDoc.embedPng(card.backDataUrl);
          backSheet.drawImage(img, {
            x: posX,
            y: posY,
            width: cardWidthPt,
            height: cardHeightPt,
          });

          drawCropMarks(backSheet, posX, posY, cardWidthPt, cardHeightPt);
        }
      }
    }
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });

  const download = (filename = 'ID_Cards_Print_Ready.pdf') => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return { pdfBytes, blob, download };
}
