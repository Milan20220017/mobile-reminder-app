import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useState } from 'react';

export default function AddReminderScreen({ navigation, onAdd, currentUser }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [shareEmail, setShareEmail] = useState('');
  const [titleError, setTitleError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    if (!title.trim()) {
      setTitleError('Title is required.');
      return;
    }

    const sharedWith = shareEmail.trim() ? [shareEmail.trim().toLowerCase()] : [];
    const ownerEmail = currentUser.email;

    const completedBy = { [ownerEmail]: false };
    for (const email of sharedWith) {
      completedBy[email] = false;
    }

    const newReminder = {
      title: title.trim(),
      description: description.trim(),
      date: date.trim(),
      ownerId: currentUser.id,
      ownerEmail,
      sharedWith,
      completedBy,
    };

    try {
      setLoading(true);
      setError('');
      await onAdd(newReminder);
      navigation.goBack();
    } catch (e) {
      setError('Failed to save reminder. Please try again.');
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={(text) => { setTitle(text); setTitleError(''); }}
        placeholder="Enter title"
        placeholderTextColor="#999"
      />
      {titleError ? <Text style={styles.fieldError}>{titleError}</Text> : null}

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={styles.input}
        value={description}
        onChangeText={setDescription}
        placeholder="Enter description"
        placeholderTextColor="#999"
      />

      <Text style={styles.label}>Date</Text>
      <TextInput
        style={styles.input}
        value={date}
        onChangeText={setDate}
        placeholder="e.g. 2026-05-10"
        placeholderTextColor="#999"
      />

      <Text style={styles.label}>Share with (email)</Text>
      <TextInput
        style={styles.input}
        value={shareEmail}
        onChangeText={setShareEmail}
        placeholder="Enter user's email to share"
        placeholderTextColor="#999"
        autoCapitalize="none"
        keyboardType="email-address"
      />

      {loading && <Text style={styles.loading}>Saving...</Text>}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Save Reminder</Text>
      </TouchableOpacity>
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
  fieldError: {
    color: '#E74C3C',
    fontSize: 13,
    marginTop: 4,
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
  buttonDisabled: {
    backgroundColor: '#A0BFE0',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
