import React from 'react';

/* Icones do design system (Phosphor, fonte carregada por design-system/styles.css).
   Cada export aceita a mesma API usada no app (size, color, style, className) e ignora
   propriedades exclusivas de SVG (strokeWidth). Para trocar um glifo, altere so o mapa. */
function phosphor(name, displayName) {
  function PhosphorIcon({ size = 16, color, style, className, strokeWidth: _strokeWidth, ...rest }) {
    return <i className={['ph', `ph-${name}`, className].filter(Boolean).join(' ')}
      style={{ fontSize: size, color, lineHeight: 1, display: 'inline-block', flexShrink: 0, ...style }}
      aria-hidden="true" {...rest} />;
  }
  PhosphorIcon.displayName = displayName;
  return PhosphorIcon;
}

export const Radar = phosphor('broadcast', 'Radar');
export const LayoutGrid = phosphor('squares-four', 'LayoutGrid');
export const Crosshair = phosphor('crosshair', 'Crosshair');
export const Building2 = phosphor('buildings', 'Building2');
export const Settings = phosphor('gear', 'Settings');
export const ListChecks = phosphor('list-checks', 'ListChecks');
export const MapPin = phosphor('map-pin', 'MapPin');
export const ExternalLink = phosphor('arrow-square-out', 'ExternalLink');
export const Search = phosphor('magnifying-glass', 'Search');
export const TrendingDown = phosphor('trend-down', 'TrendingDown');
export const ArrowDownRight = phosphor('arrow-down-right', 'ArrowDownRight');
export const ArrowUpRight = phosphor('arrow-up-right', 'ArrowUpRight');
export const Plus = phosphor('plus', 'Plus');
export const CheckCircle2 = phosphor('check-circle', 'CheckCircle2');
export const Circle = phosphor('circle', 'Circle');
export const Timer = phosphor('timer', 'Timer');
export const Flame = phosphor('flame', 'Flame');
export const PackageOpen = phosphor('package', 'PackageOpen');
export const Zap = phosphor('lightning', 'Zap');
export const Gauge = phosphor('gauge', 'Gauge');
export const MoreHorizontal = phosphor('dots-three', 'MoreHorizontal');
export const RotateCcw = phosphor('arrow-counter-clockwise', 'RotateCcw');
export const ShieldCheck = phosphor('shield-check', 'ShieldCheck');
export const Store = phosphor('storefront', 'Store');
export const Trash2 = phosphor('trash', 'Trash2');
export const LogOut = phosphor('sign-out', 'LogOut');
export const UserRound = phosphor('user', 'UserRound');
export const LockKeyhole = phosphor('lock-key', 'LockKeyhole');
export const Monitor = phosphor('monitor', 'Monitor');
export const Moon = phosphor('moon', 'Moon');
export const Sun = phosphor('sun', 'Sun');
export const Save = phosphor('floppy-disk', 'Save');
export const X = phosphor('x', 'X');
export const ScanLine = phosphor('scan', 'ScanLine');
export const BadgeInfo = phosphor('info', 'BadgeInfo');
export const ChevronUp = phosphor('caret-up', 'ChevronUp');
export const ChevronDown = phosphor('caret-down', 'ChevronDown');
export const Smartphone = phosphor('device-mobile', 'Smartphone');
export const Eye = phosphor('eye', 'Eye');
export const EyeOff = phosphor('eye-slash', 'EyeOff');
export const UploadCloud = phosphor('cloud-arrow-up', 'UploadCloud');
export const FileText = phosphor('file-text', 'FileText');
export const Pencil = phosphor('pencil-simple', 'Pencil');
export const History = phosphor('clock-counter-clockwise', 'History');
export const Undo2 = phosphor('arrow-u-up-left', 'Undo2');
export const Ruler = phosphor('ruler', 'Ruler');
export const Check = phosphor('check', 'Check');
export const Scale = phosphor('scales', 'Scale');
export const ArrowLeft = phosphor('arrow-left', 'ArrowLeft');
export const ChevronRight = phosphor('caret-right', 'ChevronRight');
export const SlidersHorizontal = phosphor('sliders-horizontal', 'SlidersHorizontal');
export const BarChart3 = phosphor('chart-bar', 'BarChart3');
