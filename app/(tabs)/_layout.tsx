//app/dashboard/_layout.tsx

import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Entypo } from '@expo/vector-icons';
import { colors } from '@/constants/colors';

function TabIcon({ name, label, focused, isScan = false }: { name: any; label: string; focused: boolean; isScan?: boolean }) {
  // if (isScan) {
  //   // Special rendering for the Scan tab to match the HTML design
  //   return (
  //     <View style={tabStyles.scanTab}>
  //       <View style={[tabStyles.scanOrb, focused && tabStyles.scanOrbActive]}>
  //         <Entypo name="camera" size={21} color={colors.white} />
  //       </View>
  //       <Text style={[tabStyles.scanLabel, focused && tabStyles.scanLabelActive]}>{label}</Text>
  //     </View>
  //   );
  // }

  // Rendering for all other tabs
  return (
    <View style={[tabStyles.tabItem, focused && tabStyles.tabItemActive]}>
      <Entypo 
        name={name} 
        size={20} 
        color={focused ? colors.amberDark : colors.text} 
      />
      <Text 
        style={[
          tabStyles.label, 
          focused ? tabStyles.labelActive : tabStyles.labelInactive
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  // Style for the main tab bar container
  tabBar: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 65,
    // paddingBottom: 6,
    paddingTop: 6,
    paddingHorizontal: 8,
    elevation: 20,
    shadowColor: colors.navy,
    shadowOpacity: 0.07,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 2 },
  },
  // Style for the wrapper of regular tabs
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    minWidth: 70,
  },
  // Active state for regular tabs (matches HTML: amber-light background)
  tabItemActive: {
    backgroundColor: colors.amberLight,
    height: 45,
    marginTop: 0,
    // paddingBottom: -8,

  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
    textAlign: 'center',
  },
  labelInactive: {
    color: colors.text,
  },
  labelActive: {
    color: colors.amberDark,
    fontWeight: '700',
  },
  // --- Styles for the special Scan Tab ---
  scanTab: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    marginTop: -16, // Pulls the orb up to overlap the tab bar
  },
  scanOrb: {
    width: 47,
    height: 47,
    backgroundColor: colors.amber,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.amber,
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 8,
    borderWidth: 3,
    borderColor: colors.white,
    marginBottom: 2,
  },
  scanOrbActive: {
    // Optional: Add a different style if the scan tab itself can be "active"
    // For now, it looks the same whether active or not, just like HTML.
  },
  scanLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text,
  },
  scanLabelActive: {
    color: colors.amberDark,
    fontWeight: '700',
  },
});

export default function TabLayout() {
  return (
    
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: tabStyles.tabBar,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => <TabIcon name="home" label="Home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: 'Contacts',
          tabBarIcon: ({ focused }) => <TabIcon name="old-phone" label="Contacts" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarIcon: ({ focused }) => <TabIcon name="camera" label="Scan" focused={focused} isScan={true} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => <TabIcon name="cog" label="Settings" focused={focused} />,
        }}
      />
    </Tabs>
  );
}