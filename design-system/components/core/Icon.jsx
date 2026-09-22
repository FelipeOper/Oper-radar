import React from 'react';
export function Icon({ name, weight = 'regular', size, color, className, style, label, ...rest }) {
  const w = weight === 'fill' ? 'ph-fill' : weight === 'bold' ? 'ph-bold' : 'ph';
  return <i className={[w, 'ph-' + name, className].filter(Boolean).join(' ')} style={{ fontSize: size, color, lineHeight: 1, ...style }} aria-hidden={label ? undefined : true} aria-label={label} role={label ? 'img' : undefined} {...rest} />;
}
