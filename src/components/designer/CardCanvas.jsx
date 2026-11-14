import React, { useRef, useEffect, useState } from 'react';
import {
  Stage,
  Layer,
  Rect,
  Text as KonvaText,
  Image as KonvaImage,
  Transformer,
  Line,
  Group,
} from 'react-konva';
import { CR80 } from '../../constants/printSpecs';
import { generateQrCodeDataUrl, generateBarcodeDataUrl } from '../../utils/barcodeGenerator';

// Helper component for handling image elements on Konva canvas
function CanvasImageElement({ elem, isSelected, onSelect, onChange }) {
  const [imageObj, setImageObj] = useState(null);
  const shapeRef = useRef(null);

  useEffect(() => {
    let active = true;
    const img = new window.Image();
    img.crossOrigin = 'Anonymous';

    if (elem.type === 'qrCode') {
      generateQrCodeDataUrl(elem.fallback || 'SAMPLE-1001', {
        width: elem.width || 150,
        darkColor: elem.darkColor || '#000000',
      }).then((url) => {
        if (active && url) img.src = url;
      });
    } else if (elem.type === 'barcode') {
      const url = generateBarcodeDataUrl(elem.fallback || '12345678', {
        format: elem.barcodeType || 'CODE128',
        lineColor: elem.lineColor || '#000000',
        height: elem.height || 60,
      });
      if (active && url) img.src = url;
    } else if (elem.type === 'photo') {
      img.src =
        elem.src ||
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="360" fill="%2394a3b8"><rect width="300" height="360" fill="%23e2e8f0"/><circle cx="150" cy="130" r="60"/><path d="M60 300 c0-50 40-70 90-70 s90 20 90 70"/></svg>';
    } else if (elem.src) {
      img.src = elem.src;
    }

    img.onload = () => {
      if (active) setImageObj(img);
    };

    return () => {
      active = false;
    };
  }, [elem.type, elem.fallback, elem.src, elem.width, elem.height, elem.darkColor, elem.lineColor]);

  return (
    <Group
      id={elem.id}
      x={elem.x}
      y={elem.y}
      width={elem.width}
      height={elem.height}
      draggable={!elem.locked}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => {
        onChange({
          ...elem,
          x: Math.round(e.target.x()),
          y: Math.round(e.target.y()),
        });
      }}
      onTransformEnd={(e) => {
        const node = e.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);

        onChange({
          ...elem,
          x: Math.round(node.x()),
          y: Math.round(node.y()),
          width: Math.max(20, Math.round(node.width() * scaleX)),
          height: Math.max(20, Math.round(node.height() * scaleY)),
        });
      }}
      ref={shapeRef}
    >
      {/* Background/Frame placeholder */}
      {elem.type === 'photo' && (
        <Rect
          width={elem.width}
          height={elem.height}
          fill="#f1f5f9"
          cornerRadius={elem.borderRadius || 0}
          stroke={elem.borderColor || '#cbd5e1'}
          strokeWidth={elem.borderWidth || 2}
        />
      )}

      {imageObj && (
        <KonvaImage
          image={imageObj}
          width={elem.width}
          height={elem.height}
          cornerRadius={elem.borderRadius || 0}
        />
      )}

      {/* Label indicator for dynamic placeholders */}
      {elem.type === 'photo' && (
        <KonvaText
          text="PHOTO FRAME"
          x={10}
          y={elem.height - 24}
          fontSize={12}
          fontFamily="Inter"
          fill="#64748b"
          opacity={0.8}
        />
      )}
    </Group>
  );
}

// Helper component for background image
function CanvasBackgroundImage({ background, width, height }) {
  const [bgImg, setBgImg] = useState(null);

  useEffect(() => {
    if (background?.type === 'image' && background.value) {
      const img = new window.Image();
      img.crossOrigin = 'Anonymous';
      img.src = background.value;
      img.onload = () => setBgImg(img);
    } else {
      setBgImg(null);
    }
  }, [background?.type, background?.value]);

  if (background?.type === 'image' && bgImg) {
    return (
      <KonvaImage
        image={bgImg}
        x={0}
        y={0}
        width={width}
        height={height}
        opacity={background.opacity !== undefined ? background.opacity : 1}
        listening={false}
      />
    );
  }

  return null;
}

export default function CardCanvas({
  template,
  currentSide,
  selectedId,
  onSelectId,
  onUpdateElement,
  showSafeGuides = true,
  showBleedGuides = true,
}) {
  const containerRef = useRef(null);
  const transformerRef = useRef(null);
  const stageRef = useRef(null);
  const [scale, setScale] = useState(0.7);

  const isLandscape = template.orientation !== 'portrait';
  const canvasWidth = isLandscape ? CR80.landscape.widthPx : CR80.portrait.widthPx;
  const canvasHeight = isLandscape ? CR80.landscape.heightPx : CR80.portrait.heightPx;

  const background = currentSide === 'front' ? template.frontBackground : template.backBackground;
  const elements = (currentSide === 'front' ? template.frontElements : template.backElements) || [];

  // Responsive canvas viewport scaling
  useEffect(() => {
    function updateDimensions() {
      if (!containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      const padding = 60;
      const availW = Math.max(300, clientWidth - padding);
      const availH = Math.max(300, clientHeight - padding);

      const scaleX = availW / canvasWidth;
      const scaleY = availH / canvasHeight;
      const fitScale = Math.min(scaleX, scaleY, 0.95);
      setScale(fitScale);
    }

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [canvasWidth, canvasHeight]);

  // Attach Konva Transformer to selected node
  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;

    if (selectedId) {
      const selectedNode = stageRef.current.findOne(`#${selectedId}`);
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer().batchDraw();
        return;
      }
    }
    transformerRef.current.nodes([]);
    transformerRef.current.getLayer().batchDraw();
  }, [selectedId, elements, currentSide]);

  const handleStageClick = (e) => {
    // If clicking on empty stage background, deselect
    if (e.target === e.target.getStage() || e.target.name() === 'background-rect') {
      onSelectId(null);
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 h-full bg-slate-950 flex items-center justify-center p-6 overflow-hidden relative select-none"
    >
      {/* Zoom / Info Watermark */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 text-xs bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300 pointer-events-none">
        <span className="font-semibold text-indigo-400 capitalize">{currentSide} Side</span>
        <span>•</span>
        <span className="font-mono">{canvasWidth} × {canvasHeight} px (300 DPI)</span>
        <span>•</span>
        <span>{Math.round(scale * 100)}% View</span>
      </div>

      <div
        className="rounded-2xl shadow-2xl overflow-hidden ring-1 ring-slate-800/80 shadow-black/80 transition-transform"
        style={{
          width: canvasWidth * scale,
          height: canvasHeight * scale,
        }}
      >
        <Stage
          ref={stageRef}
          width={canvasWidth * scale}
          height={canvasHeight * scale}
          scaleX={scale}
          scaleY={scale}
          onClick={handleStageClick}
          onTap={handleStageClick}
        >
          <Layer>
            {/* Card Background Rect */}
            <Rect
              name="background-rect"
              x={0}
              y={0}
              width={canvasWidth}
              height={canvasHeight}
              fill={background?.type === 'image' ? '#ffffff' : (background?.value || '#ffffff')}
            />

            {/* Custom Uploaded Background Image */}
            <CanvasBackgroundImage
              background={background}
              width={canvasWidth}
              height={canvasHeight}
            />

            {/* Elements Layer */}
            {elements.map((elem) => {
              if (elem.visible === false) return null;
              const isSelected = elem.id === selectedId;

              if (['qrCode', 'barcode', 'photo', 'image'].includes(elem.type)) {
                return (
                  <CanvasImageElement
                    key={elem.id}
                    elem={elem}
                    isSelected={isSelected}
                    onSelect={() => onSelectId(elem.id)}
                    onChange={onUpdateElement}
                  />
                );
              }

              if (elem.type === 'shape') {
                return (
                  <Rect
                    key={elem.id}
                    id={elem.id}
                    x={elem.x}
                    y={elem.y}
                    width={elem.width}
                    height={elem.height}
                    fill={elem.fill || '#1e40af'}
                    cornerRadius={elem.cornerRadius || 0}
                    draggable={!elem.locked}
                    onClick={() => onSelectId(elem.id)}
                    onTap={() => onSelectId(elem.id)}
                    onDragEnd={(e) => {
                      onUpdateElement({
                        ...elem,
                        x: Math.round(e.target.x()),
                        y: Math.round(e.target.y()),
                      });
                    }}
                    onTransformEnd={(e) => {
                      const node = e.target;
                      const scaleX = node.scaleX();
                      const scaleY = node.scaleY();
                      node.scaleX(1);
                      node.scaleY(1);
                      onUpdateElement({
                        ...elem,
                        x: Math.round(node.x()),
                        y: Math.round(node.y()),
                        width: Math.max(5, Math.round(node.width() * scaleX)),
                        height: Math.max(5, Math.round(node.height() * scaleY)),
                      });
                    }}
                  />
                );
              }

              // Text or DynamicText
              const textString =
                elem.type === 'dynamicText'
                  ? `${elem.prefix || ''}${elem.fallback || `{{${elem.fieldKey}}}`}${elem.suffix || ''}`
                  : elem.content || 'Text';

              return (
                <KonvaText
                  key={elem.id}
                  id={elem.id}
                  x={elem.x}
                  y={elem.y}
                  width={elem.width}
                  text={textString}
                  fontSize={elem.fontSize || 24}
                  fontFamily={elem.fontFamily || 'Inter'}
                  fontStyle={elem.fontStyle || 'normal'}
                  fill={elem.fill || '#0f172a'}
                  align={elem.align || 'left'}
                  draggable={!elem.locked}
                  onClick={() => onSelectId(elem.id)}
                  onTap={() => onSelectId(elem.id)}
                  onDragEnd={(e) => {
                    onUpdateElement({
                      ...elem,
                      x: Math.round(e.target.x()),
                      y: Math.round(e.target.y()),
                    });
                  }}
                  onTransformEnd={(e) => {
                    const node = e.target;
                    const scaleX = node.scaleX();
                    node.scaleX(1);
                    node.scaleY(1);
                    onUpdateElement({
                      ...elem,
                      x: Math.round(node.x()),
                      y: Math.round(node.y()),
                      width: Math.max(50, Math.round(node.width() * scaleX)),
                    });
                  }}
                />
              );
            })}

            {/* Guides Layer */}
            {showBleedGuides && (
              <Rect
                x={CR80.bleedPx}
                y={CR80.bleedPx}
                width={canvasWidth - 2 * CR80.bleedPx}
                height={canvasHeight - 2 * CR80.bleedPx}
                stroke="#ef4444"
                strokeWidth={1 / scale}
                dash={[6 / scale, 6 / scale]}
                listening={false}
              />
            )}

            {showSafeGuides && (
              <Rect
                x={CR80.safeMarginPx}
                y={CR80.safeMarginPx}
                width={canvasWidth - 2 * CR80.safeMarginPx}
                height={canvasHeight - 2 * CR80.safeMarginPx}
                stroke="#10b981"
                strokeWidth={1 / scale}
                dash={[8 / scale, 4 / scale]}
                listening={false}
              />
            )}

            {/* Konva Interactive Selection Box */}
            <Transformer
              ref={transformerRef}
              rotateEnabled={false}
              boundBoxFunc={(oldBox, newBox) => {
                // Minimum size safeguard
                if (newBox.width < 15 || newBox.height < 15) {
                  return oldBox;
                }
                return newBox;
              }}
              borderStroke="#6366f1"
              borderStrokeWidth={2 / scale}
              anchorStroke="#6366f1"
              anchorFill="#ffffff"
              anchorSize={8 / scale}
              anchorCornerRadius={2 / scale}
            />
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
