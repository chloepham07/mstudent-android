// Nhân vật theo UI Kit: "Meme" (phong thư vàng chanh) và nhân vật theo loại việc. Nét đen 2.5px, không emoji.

import Svg, { Circle, Ellipse, Path, Polygon, Rect } from 'react-native-svg';

import { BRAND, usePalette } from '@/constants/theme';
import type { Category } from '@/lib/types';

const INK = BRAND.ink;

/** Meme đầy đủ (thân, tay, chân). Tay chân đổi sáng ở chế độ tối. */
export function Meme({ size = 120, wave = false }: { size?: number; wave?: boolean }) {
  const c = usePalette();
  return (
    <Svg width={size} height={(size * 112) / 120} viewBox="0 0 120 112" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Path d="M22 56 Q10 58 6 68" fill="none" stroke={c.limbs} strokeWidth={3} strokeLinecap="round" />
      <Circle cx={6} cy={68} r={4} fill={c.limbs} />
      <Path d={wave ? 'M98 50 Q112 40 110 26' : 'M98 56 Q110 50 112 40'} fill="none" stroke={c.limbs} strokeWidth={3} strokeLinecap="round" />
      <Circle cx={wave ? 110 : 112} cy={wave ? 26 : 40} r={4} fill={c.limbs} />
      <Path d="M46 84 L42 100 M74 84 L78 100" stroke={c.limbs} strokeWidth={3} strokeLinecap="round" />
      <Ellipse cx={40} cy={102} rx={6} ry={3.5} fill={c.limbs} />
      <Ellipse cx={80} cy={102} rx={6} ry={3.5} fill={c.limbs} />
      <Rect x={20} y={24} width={80} height={62} rx={12} fill={BRAND.lime} />
      <Path d="M24 30 L60 56 L96 30" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={49} cy={67} r={3.2} fill={INK} />
      <Circle cx={71} cy={67} r={3.2} fill={INK} />
      <Path d="M54 73 Q60 79 66 73" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}

/** Mặt Meme thu nhỏ trong vòng tròn (ảnh đại diện của trợ lý trong chat). */
export function MemeAvatar({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Circle cx={16} cy={16} r={16} fill={BRAND.lime} />
      <Path d="M7 10 L16 17 L25 10" fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={12.5} cy={21} r={1.4} fill={INK} />
      <Circle cx={19.5} cy={21} r={1.4} fill={INK} />
    </Svg>
  );
}

/** Nhân vật theo loại việc, ló ra ở góc dưới thẻ. `cardBg` để đổi màu khi trùng nền thẻ. */
export function CategoryCharacter({ category, cardBg, size = 80 }: { category: Category; cardBg?: string; size?: number }) {
  const h = (size * 72) / 80;
  const eyes = (y: number) => (
    <>
      <Circle cx={33} cy={y} r={2.6} fill={INK} />
      <Circle cx={47} cy={y} r={2.6} fill={INK} />
    </>
  );
  let body;
  switch (category) {
    case 'deadline':
      body = (
        <>
          <Rect x={10} y={12} width={60} height={48} rx={10} fill={cardBg === BRAND.lime ? BRAND.pinkDeep : cardBg === BRAND.pink ? BRAND.pinkDeep : BRAND.lime} />
          <Path d="M13 17 L40 37 L67 17" fill="none" stroke={INK} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          {eyes(46)}
          <Path d="M36 51 Q40 55 44 51" fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
        </>
      );
      break;
    case 'exam':
      body = (
        <>
          <Path d="M8 60 A32 32 0 0 1 72 60 Z" fill={BRAND.pinkDeep} />
          <Path d="M29 44 Q32 41 35 44 M45 44 Q48 41 51 44" fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
          <Path d="M36 51 Q40 54 44 51" fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
        </>
      );
      break;
    case 'class_change':
      body = (
        <>
          <Polygon points="40,8 68,24 68,52 40,68 12,52 12,24" fill={cardBg === BRAND.periwinkle ? BRAND.mint : BRAND.periwinkle} />
          <Path d="M30 38 Q33 41 36 38 M44 38 Q47 41 50 38" fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
          <Path d="M36 46 Q40 50 44 46" fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
        </>
      );
      break;
    case 'event':
      body = (
        <>
          <Circle cx={40} cy={38} r={28} fill={BRAND.mint} />
          {eyes(34)}
          <Path d="M33 43 Q40 50 47 43" fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
        </>
      );
      break;
    case 'admin':
      body = (
        <>
          <Polygon
            points="40,4 47,22 66,14 58,32 76,40 58,46 66,64 47,56 40,72 33,56 14,64 22,46 4,40 22,32 14,14 33,22"
            fill={cardBg === BRAND.lime ? BRAND.mint : BRAND.lime}
          />
          <Circle cx={34} cy={38} r={2.4} fill={INK} />
          <Circle cx={46} cy={38} r={2.4} fill={INK} />
          <Path d="M37 45 Q40 47 43 45" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" />
        </>
      );
      break;
    default:
      body = (
        <>
          <Rect x={14} y={14} width={52} height={52} rx={26} fill={BRAND.cloud} />
          <Circle cx={33} cy={38} r={2.4} fill={INK} />
          <Circle cx={47} cy={38} r={2.4} fill={INK} />
          <Path d="M35 47 L45 47" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
        </>
      );
  }
  return (
    <Svg width={size} height={h} viewBox="0 0 80 72" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {body}
    </Svg>
  );
}
