'use client';

import Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Group, Image as KImage, Layer, Rect, Stage, Transformer } from 'react-konva';
import { useImage } from '@/modules/designer/canvas/use-image';
import {
  initialDesignBox,
  insideRatio,
  MIN_INSIDE,
  type Rect as Box,
} from '@/modules/designer/print-area';
import type { Design } from '@/modules/designer/use-designer-state';

const MIN_SIZE = 40;
const WHEEL_STEP = 1.05;

// Konva reads these when it creates canvases, so they must be set before the Stage mounts.
// This chunk is client-only (loaded with ssr: false).
if (typeof window !== 'undefined') {
  Konva.hitOnDragEnabled = true;
  Konva.pixelRatio = Math.min(2, window.devicePixelRatio || 1);
}

interface DesignCanvasProps {
  size: number;
  mockupSrc: string;
  design: Design;
  area: Box;
  /** Fires on the first drag so the one-time canvas hint can dismiss. */
  onInteract: () => void;
}

interface Point {
  x: number;
  y: number;
}

function tokens() {
  const css = getComputedStyle(document.documentElement);
  return {
    accent: css.getPropertyValue('--color-accent').trim() || 'currentColor',
    surface: css.getPropertyValue('--color-surface').trim() || 'white',
  };
}

/**
 * The mockup canvas (BRD 6.4.3). Two layers: a static, cached mockup and one interactive
 * layer holding the clipped design, the Transformer (a sibling of the clip group so its
 * anchors stay reachable outside the area) and the dashed print-area outline. Drag, corner
 * resize, rotation with snaps, wheel and pinch scaling, double-tap recentre, and a snap-back
 * when less than 25 % of the design remains inside the area.
 */
export function DesignCanvas({ size, mockupSrc, design, area, onInteract }: DesignCanvasProps) {
  const mockup = useImage(mockupSrc);
  const designImg = useImage(design.url);
  const [prevMockup, setPrevMockup] = useState<HTMLImageElement | null>(null);
  // Client-only component: tokens are read from the live stylesheet, never hard-coded.
  const [colors] = useState(tokens);
  const [hover, setHover] = useState(false);
  const [dragging, setDragging] = useState(false);

  const designRef = useRef<Konva.Image>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const mockupRef = useRef<Konva.Image>(null);
  const prevRef = useRef<Konva.Image>(null);
  const lastValid = useRef<Point | null>(null);
  const lastMockup = useRef<HTMLImageElement | null>(null);
  const pinch = useRef<{ dist: number } | null>(null);

  const initialBox = useMemo(
    () => initialDesignBox(area, design.width, design.height),
    [area, design.width, design.height],
  );
  // Re-placement key: the box, plus the mockup so a colour swap re-centres too (BRD 6.4.3).
  const placement = useMemo(
    () => ({ box: initialBox, mockup: mockupSrc }),
    [initialBox, mockupSrc],
  );

  // Mockup crossfade (200 ms) when the product or colour changes.
  useEffect(() => {
    if (!mockup) return;
    const previous = lastMockup.current;
    lastMockup.current = mockup;
    if (previous && previous !== mockup) {
      setPrevMockup(previous);
      mockupRef.current?.opacity(0);
      mockupRef.current?.to({ opacity: 1, duration: 0.2 });
      prevRef.current?.opacity(1);
      prevRef.current?.to({ opacity: 0, duration: 0.2, onFinish: () => setPrevMockup(null) });
    }
    mockupRef.current?.cache();
  }, [mockup]);

  // Place the design (60 % of the area width, centred) whenever the design, the area, or the
  // mockup (product or colour, BRD 6.4.3) changes.
  useEffect(() => {
    const node = designRef.current;
    if (!node || !designImg) return;
    const { box } = placement;
    node.setAttrs({
      image: designImg,
      x: box.x + box.width / 2,
      y: box.y + box.height / 2,
      width: box.width,
      height: box.height,
      offsetX: box.width / 2,
      offsetY: box.height / 2,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
    });
    lastValid.current = { x: node.x(), y: node.y() };
    trRef.current?.nodes([node]);
    trRef.current?.forceUpdate();
    node.getLayer()?.batchDraw();
  }, [designImg, placement]);

  function recentre() {
    const node = designRef.current;
    if (!node) return;
    node.to({
      x: initialBox.x + initialBox.width / 2,
      y: initialBox.y + initialBox.height / 2,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      duration: 0.2,
      easing: Konva.Easings.EaseOut,
    });
    lastValid.current = {
      x: initialBox.x + initialBox.width / 2,
      y: initialBox.y + initialBox.height / 2,
    };
  }

  function settle() {
    const node = designRef.current;
    if (!node) return;
    const box = node.getClientRect();
    if (insideRatio(box, area) < MIN_INSIDE && lastValid.current) {
      node.to({ ...lastValid.current, duration: 0.2, easing: Konva.Easings.EaseOut });
    } else {
      lastValid.current = { x: node.x(), y: node.y() };
    }
  }

  function scaleAbout(node: Konva.Image, factor: number, pointer: Point | null) {
    const old = node.scaleX();
    const maxScale = (size * 1.5) / Math.max(node.width(), node.height());
    const minScale = MIN_SIZE / Math.max(node.width(), node.height());
    const next = Math.min(maxScale, Math.max(minScale, old * factor));
    if (pointer) {
      const local = { x: (pointer.x - node.x()) / old, y: (pointer.y - node.y()) / old };
      node.position({ x: pointer.x - local.x * next, y: pointer.y - local.y * next });
    }
    node.scale({ x: next, y: next });
    node.getLayer()?.batchDraw();
  }

  function onWheel(e: KonvaEventObject<WheelEvent>) {
    e.evt.preventDefault();
    const node = designRef.current;
    const stage = node?.getStage();
    if (!node || !stage) return;
    const factor = e.evt.deltaY < 0 ? WHEEL_STEP : 1 / WHEEL_STEP;
    scaleAbout(node, factor, stage.getPointerPosition());
    lastValid.current = { x: node.x(), y: node.y() };
  }

  function onTouchMove(e: KonvaEventObject<TouchEvent>) {
    const [t1, t2] = [e.evt.touches[0], e.evt.touches[1]];
    const node = designRef.current;
    if (!t1 || !t2 || !node) return;
    e.evt.preventDefault();
    if (node.isDragging()) node.stopDrag();
    const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
    if (pinch.current) scaleAbout(node, dist / pinch.current.dist, null);
    pinch.current = { dist };
  }

  function onTouchEnd() {
    if (pinch.current) settle();
    pinch.current = null;
  }

  const outlineVisible = hover || dragging;

  return (
    <Stage
      width={size}
      height={size}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <Layer listening={false}>
        {prevMockup && <KImage ref={prevRef} image={prevMockup} width={size} height={size} />}
        {mockup && <KImage ref={mockupRef} image={mockup} width={size} height={size} />}
      </Layer>
      <Layer>
        <Group clipX={area.x} clipY={area.y} clipWidth={area.width} clipHeight={area.height}>
          {designImg && (
            <KImage
              ref={designRef}
              id="design"
              name="design"
              image={designImg}
              draggable
              onDragStart={() => {
                setDragging(true);
                onInteract();
              }}
              onDragEnd={() => {
                setDragging(false);
                settle();
              }}
              onTransformStart={() => setDragging(true)}
              onTransformEnd={() => {
                setDragging(false);
                settle();
              }}
              onDblClick={recentre}
              onDblTap={recentre}
              onWheel={onWheel}
              onMouseEnter={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'grab';
              }}
              onMouseLeave={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'default';
              }}
            />
          )}
        </Group>
        <Rect
          x={area.x}
          y={area.y}
          width={area.width}
          height={area.height}
          stroke={colors.accent}
          strokeWidth={1.5}
          dash={[6, 4]}
          opacity={outlineVisible ? 0.6 : 0}
          listening={false}
        />
        <Transformer
          ref={trRef}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
          keepRatio
          flipEnabled={false}
          rotationSnaps={[0, 90, 180, 270]}
          rotationSnapTolerance={8}
          anchorSize={12}
          anchorCornerRadius={6}
          anchorStroke={colors.accent}
          anchorFill={colors.surface}
          anchorStrokeWidth={1.5}
          borderStroke={colors.accent}
          borderStrokeWidth={1}
          rotateAnchorOffset={28}
          boundBoxFunc={(oldBox, newBox) =>
            Math.abs(newBox.width) < MIN_SIZE || Math.abs(newBox.height) < MIN_SIZE
              ? oldBox
              : newBox
          }
        />
      </Layer>
    </Stage>
  );
}
