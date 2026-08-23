import React from 'react';
import SearchBar from '@theme/SearchBar';
import NavbarSearch from '@theme/Navbar/Search';

export default function SearchNavbarItem({
  className,
}: {
  mobile?: boolean;
  className?: string;
}) {
  return (
    <NavbarSearch className={className}>
      <SearchBar />
    </NavbarSearch>
  );
}
