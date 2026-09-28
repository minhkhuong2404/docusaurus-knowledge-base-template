import React from 'react';
import ThemePalettePicker from '../../components/ThemePalettePicker';

export default function ThemePaletteNavbarItem({
  className,
}: {
  mobile?: boolean;
  className?: string;
}): React.JSX.Element {
  return (
    <div className={`navbar__item ${className || ''}`}>
      <ThemePalettePicker />
    </div>
  );
}
