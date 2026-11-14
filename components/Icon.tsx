// Icon nét theo UI Kit (stroke 2, bo tròn). Màu theo `color`; luôn ẩn với trình đọc màn hình (nút chứa nó có nhãn).

import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconName = 'chat' | 'tasks' | 'calendar' | 'settings' | 'plus' | 'check' | 'send' | 'close' | 'left' | 'right' | 'tool';

export function Icon({ name, color, size = 24, stroke = 2 }: { name: IconName; color: string; size?: number; stroke?: number }) {
  const p = { fill: 'none', stroke: color, strokeWidth: stroke, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  let body;
  switch (name) {
    case 'chat':
      body = <Path d="M4 5h16v11H9l-5 4z" {...p} />;
      break;
    case 'tasks':
      body = <Path d="M10 6h10M10 12h10M10 18h10M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2" {...p} />;
      break;
    case 'calendar':
      body = (
        <>
          <Rect x={3} y={5} width={18} height={16} rx={3} {...p} />
          <Path d="M3 10h18M8 3v4M16 3v4" {...p} />
        </>
      );
      break;
    case 'settings':
      body = (
        <>
          <Path d="M4 7h9M17 7h3M4 17h3M11 17h9" {...p} />
          <Circle cx={15} cy={7} r={2} {...p} />
          <Circle cx={9} cy={17} r={2} {...p} />
        </>
      );
      break;
    case 'plus':
      body = <Path d="M12 5v14M5 12h14" {...p} />;
      break;
    case 'check':
      body = <Path d="M5 12l5 5 9-10" {...p} />;
      break;
    case 'send':
      body = <Path d="M5 12h14M13 6l6 6-6 6" {...p} />;
      break;
    case 'close':
      body = <Path d="M6 6l12 12M18 6L6 18" {...p} />;
      break;
    case 'left':
      body = <Path d="M15 6l-6 6 6 6" {...p} />;
      break;
    case 'right':
      body = <Path d="M9 6l6 6-6 6" {...p} />;
      break;
    case 'tool':
      body = <Path d="M14 6a4 4 0 0 0-5 5L4 16l4 4 5-5a4 4 0 0 0 5-5l-3 3-3-3z" {...p} />;
      break;
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {body}
    </Svg>
  );
}
