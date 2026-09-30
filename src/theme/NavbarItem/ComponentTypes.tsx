import ComponentTypes from '@theme-original/NavbarItem/ComponentTypes';
import CustomUserNavbarItem from './CustomUserNavbarItem';
import SearchNavbarItem from './SearchNavbarItem';
import ThemePaletteNavbarItem from './ThemePaletteNavbarItem';
import FocusMusicNavbarItem from './FocusMusicNavbarItem';

export default {
  ...ComponentTypes,
  'custom-userNavbarItem': CustomUserNavbarItem,
  'custom-themePalettePicker': ThemePaletteNavbarItem,
  'custom-focusMusic': FocusMusicNavbarItem,
  search: SearchNavbarItem,
};



