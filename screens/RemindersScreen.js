import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';

export default function RemindersScreen({ navigation, reminders, currentUser, loading }) {
  const visibleReminders = reminders.filter(
    (r) => r.ownerId === currentUser.id || r.sharedWith.includes(currentUser.id)
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Reminders</Text>
      <Text style={styles.subtitle}>Logged in as {currentUser?.email}</Text>

      {loading && <Text style={styles.loading}>Loading reminders...</Text>}

      <FlatList
        data={visibleReminders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading && <Text style={styles.empty}>No reminders yet. Tap below to add one.</Text>
        }
        renderItem={({ item }) => {
          const isOwner = item.ownerId === currentUser.id;
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('ReminderDetails', { reminder: item })}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, item.completed && styles.completedTitle]}>
                  {item.title}
                </Text>
                <View style={[styles.badge, item.completed ? styles.badgeGreen : styles.badgeOrange]}>
                  <Text style={styles.badgeText}>
                    {item.completed ? 'Done' : 'Pending'}
                  </Text>
                </View>
              </View>

              {item.description ? (
                <Text style={styles.cardDescription}>{item.description}</Text>
              ) : null}

              <View style={styles.cardFooter}>
                {item.date ? <Text style={styles.cardDate}>{item.date}</Text> : null}
                {!isOwner && <Text style={styles.sharedBadge}>Shared with you</Text>}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddReminder')}
      >
        <Text style={styles.addButtonText}>+ Add Reminder</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1A1A2E',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#999',
    marginBottom: 16,
    marginTop: 2,
  },
  loading: {
    textAlign: 'center',
    color: '#999',
    marginBottom: 8,
  },
  list: {
    paddingBottom: 16,
  },
  empty: {
    textAlign: 'center',
    color: '#aaa',
    marginTop: 60,
    fontSize: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A2E',
    flex: 1,
    marginRight: 8,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#aaa',
  },
  badge: {
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  badgeGreen: {
    backgroundColor: '#E8F8F0',
  },
  badgeOrange: {
    backgroundColor: '#FEF3E7',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#555',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  cardDate: {
    fontSize: 12,
    color: '#aaa',
  },
  sharedBadge: {
    fontSize: 12,
    color: '#4A90D9',
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#4A90D9',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
