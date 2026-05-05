import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useState } from 'react';
import { USERS } from '../App';

export default function ReminderDetailsScreen({ route, navigation, onUpdate, onDelete, currentUser }) {
  const { reminder } = route.params;

  const [title, setTitle] = useState(reminder.title);
  const [titleError, setTitleError] = useState('');
  const [description, setDescription] = useState(reminder.description || '');
  const [date, setDate] = useState(reminder.date || '');
  const [completed, setCompleted] = useState(reminder.completed || false);
  const [sharedWith, setSharedWith] = useState(reminder.sharedWith || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isOwner = reminder.ownerId === currentUser.id;

  function toggleShare(userId) {
    setSharedWith((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }

  async function handleSave() {
    if (!title.trim()) {
      setTitleError('Title is required.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onUpdate(reminder.id, {
        title: title.trim(),
        description: description.trim(),
        date: date.trim(),
        completed,
        ownerId: reminder.ownerId,
        sharedWith,
      });
      navigation.goBack();
    } catch (e) {
      setError('Failed to save changes. Please try again.');
      setLoading(false);
    }
  }

  function handleDelete() {
    Alert.alert('Delete Reminder', 'Are you sure you want to delete this reminder?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            setError('');
            await onDelete(reminder.id);
            navigation.goBack();
          } catch (e) {
            setError('Failed to delete reminder. Please try again.');
            setLoading(false);
          }
        },
      },
    ]);
  }

  const otherUsers = USERS.filter((u) => u.id !== currentUser.id);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      <View style={styles.ownerBadgeRow}>
        <View style={[styles.ownerBadge, isOwner ? styles.ownerBadgeMine : styles.ownerBadgeShared]}>
          <Text style={styles.ownerBadgeText}>
            {isOwner ? 'Your reminder' : 'Shared with you'}
          </Text>
        </View>
      </View>

      <Text style={styles.label}>Title</Text>
      <TextInput
        style={[styles.input, !isOwner && styles.inputReadOnly]}
        value={title}
        onChangeText={(text) => { setTitle(text); setTitleError(''); }}
        placeholder="Enter title"
        placeholderTextColor="#999"
        editable={isOwner}
      />
      {titleError ? <Text style={styles.fieldError}>{titleError}</Text> : null}

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, !isOwner && styles.inputReadOnly]}
        value={description}
        onChangeText={setDescription}
        placeholder="Enter description"
        placeholderTextColor="#999"
        editable={isOwner}
      />

      <Text style={styles.label}>Date</Text>
      <TextInput
        style={[styles.input, !isOwner && styles.inputReadOnly]}
        value={date}
        onChangeText={setDate}
        placeholder="e.g. 2026-05-10"
        placeholderTextColor="#999"
        editable={isOwner}
      />

      <Text style={styles.label}>Status</Text>
      <TouchableOpacity
        style={[styles.statusButton, completed ? styles.statusCompleted : styles.statusPending]}
        onPress={() => setCompleted((prev) => !prev)}
      >
        <Text style={styles.statusButtonText}>
          {completed ? '✓  Completed — tap to mark Pending' : '○  Pending — tap to mark Completed'}
        </Text>
      </TouchableOpacity>

      {isOwner && (
        <>
          <Text style={styles.label}>Share with</Text>
          <View style={styles.userRow}>
            {otherUsers.map((user) => {
              const selected = sharedWith.includes(user.id);
              return (
                <TouchableOpacity
                  key={user.id}
                  style={[styles.userChip, selected && styles.userChipSelected]}
                  onPress={() => toggleShare(user.id)}
                >
                  <Text style={[styles.userChipText, selected && styles.userChipTextSelected]}>
                    {user.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}

      {loading && <Text style={styles.loading}>Please wait...</Text>}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Save Changes</Text>
      </TouchableOpacity>

      {isOwner && (
        <TouchableOpacity
          style={[styles.buttonDanger, loading && styles.buttonDisabled]}
          onPress={handleDelete}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Delete Reminder</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  ownerBadgeRow: {
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  ownerBadge: {
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  ownerBadgeMine: {
    backgroundColor: '#E8F0FD',
  },
  ownerBadgeShared: {
    backgroundColor: '#FEF3E7',
  },
  ownerBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginTop: 16,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#1A1A2E',
  },
  inputReadOnly: {
    backgroundColor: '#F0F0F0',
    color: '#888',
  },
  fieldError: {
    color: '#E74C3C',
    fontSize: 13,
    marginTop: 4,
  },
  statusButton: {
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  statusCompleted: {
    backgroundColor: '#E8F8F0',
    borderWidth: 1,
    borderColor: '#27AE60',
  },
  statusPending: {
    backgroundColor: '#FEF3E7',
    borderWidth: 1,
    borderColor: '#E67E22',
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
  },
  userRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  userChip: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C0C0C0',
    backgroundColor: '#fff',
  },
  userChipSelected: {
    backgroundColor: '#4A90D9',
    borderColor: '#4A90D9',
  },
  userChipText: {
    color: '#444',
    fontSize: 14,
  },
  userChipTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loading: {
    textAlign: 'center',
    color: '#999',
    marginTop: 16,
  },
  error: {
    color: '#E74C3C',
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#4A90D9',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDanger: {
    backgroundColor: '#E74C3C',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
