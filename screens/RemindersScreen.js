import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  SafeAreaView, Platform,
} from 'react-native';

export default function RemindersScreen({ navigation, reminders, currentUser, loading, onLogout }) {
  const visibleReminders = reminders.filter(
    (r) => r.ownerId === currentUser.id || (r.sharedWith || []).includes(currentUser.email)
  );

  function handleLogout() {
    onLogout();
    navigation.replace('Login');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        <View style={styles.header}>
          <View>
            <Text style={styles.title}>My Reminders</Text>
            <Text style={styles.subtitle}>{currentUser?.email}</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {loading && <Text style={styles.loading}>Loading reminders…</Text>}

        <FlatList
          data={visibleReminders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !loading && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyTitle}>No reminders yet</Text>
                <Text style={styles.emptyText}>Tap the button below to add your first reminder.</Text>
              </View>
            )
          }
          renderItem={({ item }) => {
            const isOwner = item.ownerId === currentUser.id;
            const completedValues = Object.values(item.completedBy || {});
            const fullyCompleted = completedValues.length > 0 && completedValues.every(v => v === true);
            const sharedWith = item.sharedWith || [];

            return (
              <TouchableOpacity
                style={[styles.card, fullyCompleted ? styles.cardCompleted : styles.cardPending]}
                onPress={() => navigation.navigate('ReminderDetails', { reminder: item })}
                activeOpacity={0.75}
              >
                <View style={styles.cardHeader}>
                  <Text
                    style={[styles.cardTitle, fullyCompleted && styles.cardTitleDone]}
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>
                  <View style={[styles.badge, fullyCompleted ? styles.badgeGreen : styles.badgeOrange]}>
                    <Text style={[styles.badgeText, fullyCompleted ? styles.badgeTextGreen : styles.badgeTextOrange]}>
                      {fullyCompleted ? '✓ Done' : '○ Pending'}
                    </Text>
                  </View>
                </View>

                {item.description ? (
                  <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
                ) : null}

                <View style={styles.cardFooter}>
                  <View style={styles.cardMeta}>
                    {item.date ? (
                      <Text style={styles.cardDate}>📅 {item.date}</Text>
                    ) : null}
                    {!isOwner && (
                      <View style={styles.sharedChip}>
                        <Text style={styles.sharedChipText}>Shared with you</Text>
                      </View>
                    )}
                  </View>
                  {sharedWith.length > 0 && isOwner && (
                    <Text style={styles.sharedCount}>
                      {sharedWith.length} shared
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />

        <View style={styles.addButtonContainer}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddReminder')}
            activeOpacity={0.85}
          >
            <Text style={styles.addButtonText}>+ Add Reminder</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F0F2F8' },
  container: { flex: 1, backgroundColor: '#F0F2F8', paddingHorizontal: 20 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: { fontSize: 26, fontWeight: '800', color: '#1A1A2E', letterSpacing: -0.3 },
  subtitle: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },

  logoutButton: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutText: { fontSize: 13, color: '#DC2626', fontWeight: '600' },

  loading: { textAlign: 'center', color: '#9CA3AF', marginBottom: 8, fontSize: 14 },

  list: { paddingTop: 4, paddingBottom: 16 },

  emptyState: { alignItems: 'center', marginTop: 72, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardCompleted: { borderLeftColor: '#16A34A' },
  cardPending: { borderLeftColor: '#D97706' },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
    gap: 8,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', flex: 1 },
  cardTitleDone: { textDecorationLine: 'line-through', color: '#9CA3AF' },

  badge: { borderRadius: 20, paddingVertical: 3, paddingHorizontal: 10, flexShrink: 0 },
  badgeGreen: { backgroundColor: '#DCFCE7' },
  badgeOrange: { backgroundColor: '#FEF3C7' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  badgeTextGreen: { color: '#16A34A' },
  badgeTextOrange: { color: '#D97706' },

  cardDescription: { fontSize: 13, color: '#6B7280', marginBottom: 10, lineHeight: 19 },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  cardDate: { fontSize: 12, color: '#9CA3AF' },

  sharedChip: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  sharedChipText: { fontSize: 11, color: '#4A90D9', fontWeight: '600' },

  sharedCount: { fontSize: 12, color: '#9CA3AF' },

  addButtonContainer: {
    paddingTop: 8,
    paddingBottom: Platform.OS === 'android' ? 16 : 0,
  },
  addButton: {
    backgroundColor: '#4A90D9',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#4A90D9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
