// hooks/useDeviceType.ts
import { useEffect, useState } from 'react';
import { Dimensions, Platform } from 'react-native';

export const useDeviceType = () => {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const width = Dimensions.get('window').width;
      // Consider devices with width > 768px as desktop/tablet
      // You can adjust this threshold as needed
      setIsDesktop(width > 768);
    };

    // Check initial device
    checkDevice();

    // Add event listener for dimension changes
    const subscription = Dimensions.addEventListener('change', checkDevice);

    return () => subscription?.remove();
  }, []);

  return { isDesktop };
};