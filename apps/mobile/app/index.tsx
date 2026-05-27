import type { CefrLevel } from '@lingora/types'
import { StyleSheet, Text, View } from 'react-native'

const currentLevel: CefrLevel = 'A1'

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lingora</Text>
      <Text style={styles.subtitle}>Level: {currentLevel}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: '500',
    color: '#534AB7',
  },
  subtitle: {
    fontSize: 16,
    color: '#5F5E5A',
    marginTop: 8,
  },
})
