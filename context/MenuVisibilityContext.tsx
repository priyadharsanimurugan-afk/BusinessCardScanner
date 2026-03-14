// components/context/MenuVisibilityContext.tsx
import React, { createContext, useContext, useState } from 'react';

type MenuVisibilityContextType = {
  isMenuVisible: boolean;
  setMenuVisible: (visible: boolean) => void;
};

const MenuVisibilityContext = createContext<MenuVisibilityContextType>({
  isMenuVisible: true,
  setMenuVisible: () => {},
});

export const useMenuVisibility = () => useContext(MenuVisibilityContext);

export const MenuVisibilityProvider = ({ children }: { children: React.ReactNode }) => {
  const [isMenuVisible, setMenuVisible] = useState(true);

  return (
    <MenuVisibilityContext.Provider value={{ isMenuVisible, setMenuVisible }}>
      {children}
    </MenuVisibilityContext.Provider>
  );
};