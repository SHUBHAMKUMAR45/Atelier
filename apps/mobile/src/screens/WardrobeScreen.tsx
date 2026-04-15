import React, { useState } from 'react'
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Image, Dimensions,
  RefreshControl, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Plus, Filter, Shirt, Search, Trash2 } from 'lucide-react-native'
import { COLORS, SHADOWS, SPACING } from '../theme'
import { useWardrobe } from '../hooks'
import { Haptics } from '../lib/haptics'

const { width } = Dimensions.get('window')
const COLUMN_COUNT = 2
const ITEM_WIDTH = (width - (SPACING.lg * 2) - SPACING.md) / COLUMN_COUNT

export default function WardrobeScreen() {
  const { items, isLoading, refresh, deleteItem } = useWardrobe()
  const [isSearching, setIsSearching] = useState(false)

  async function handleDelete(id: string) {
    await deleteItem(id)
  }

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.9}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.imageUrl }} style={styles.image} />
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
        <TouchableOpacity 
          style={styles.deleteOverlay}
          onPress={() => handleDelete(item._id)}
        >
          <Trash2 size={16} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.itemColor}>{item.color || 'Default'}</Text>
      </View>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Your Collection</Text>
          <Text style={styles.title}>Wardrobe</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} activeOpacity={0.8}>
          <Plus size={24} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Search & Filter Bar */}
      <View style={styles.searchBar}>
        <View style={styles.searchInput}>
          <Search size={18} color={COLORS.secondary} />
          <Text style={styles.searchPlaceholder}>Search items...</Text>
        </View>
        <TouchableOpacity style={styles.filterBtn}>
          <Filter size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Grid */}
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={item => item._id}
        numColumns={COLUMN_COUNT}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={isLoading} 
            onRefresh={refresh}
            tintColor={COLORS.brand}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Shirt size={48} color={COLORS.secondary} strokeWidth={1} />
            </View>
            <Text style={styles.emptyTitle}>Empty Wardrobe</Text>
            <Text style={styles.emptySub}>Add your first item to start styling</Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.brand,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: -1,
  },
  addBtn: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.minimal,
  },
  searchBar: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: 12,
    marginBottom: SPACING.md,
  },
  searchInput: {
    flex: 1,
    height: 48,
    backgroundColor: COLORS.secondaryBackground,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
  },
  searchPlaceholder: {
    color: COLORS.secondary,
    fontSize: 15,
    fontWeight: '600',
  },
  filterBtn: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.secondaryBackground,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 120,
    gap: SPACING.md,
  },
  card: {
    width: ITEM_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    marginRight: SPACING.md,
    ...SHADOWS.card,
  },
  imageContainer: {
    width: '100%',
    height: ITEM_WIDTH * 1.3,
    backgroundColor: COLORS.secondaryBackground,
    position: 'relative',
    borderRadius: 24, // Inner rounding
    overflow: 'hidden',
  },
  deleteOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32, height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  categoryBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  cardInfo: {
    padding: 14,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  itemColor: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: '600',
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: COLORS.secondaryBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primary,
  },
  emptySub: {
    fontSize: 14,
    color: COLORS.secondary,
    textAlign: 'center',
    marginTop: 6,
    fontWeight: '600',
  },
})
