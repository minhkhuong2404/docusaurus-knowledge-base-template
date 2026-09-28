import ComponentTypes from '@theme-original/NavbarItem/ComponentTypes';
import CustomUserNavbarItem from './CustomUserNavbarItem';
import SearchNavbarItem from './SearchNavbarItem';
import ThemePaletteNavbarItem from './ThemePaletteNavbarItem';

export default {
  ...ComponentTypes,
  'custom-userNavbarItem': CustomUserNavbarItem,
  'custom-themePalettePicker': ThemePaletteNavbarItem,
  search: SearchNavbarItem,
};


