import { Ionicons } from '@expo/vector-icons'
import { getPendingMineEntries } from '@lingora/database'
import { useQuery } from '@tanstack/react-query'
import { Tabs } from 'expo-router'
import type { JSX } from 'react'
import { useServices } from '../../lib/services'
import { colors } from '../../lib/theme'

export default function TabsLayout(): JSX.Element {
  const { db } = useServices()
  const mineQuery = useQuery({
    queryKey: ['mine-queue'],
    queryFn: () => getPendingMineEntries(db),
  })
  const pendingCount = mineQuery.data?.length ?? 0

  return (
    <Tabs
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { fontWeight: '700', color: colors.text },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => <Ionicons name="search" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="decks"
        options={{
          title: 'Decks',
          tabBarIcon: ({ color, size }) => <Ionicons name="albums" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="mine"
        options={{
          title: 'Mine',
          ...(pendingCount > 0 && { tabBarBadge: pendingCount }),
          tabBarIcon: ({ color, size }) => <Ionicons name="download" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-sharp" size={size} color={color} />,
        }}
      />
    </Tabs>
  )
}
