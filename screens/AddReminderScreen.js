import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, SafeAreaView, Platform,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import { findUserByEmail } from '../services/userService';
import { DatePickerField, TimePickerField } from '../components/DateTimeFields';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function AddReminderScreen({ navigation, onAdd, currentUser }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [sharedWith, setSharedWith] = useState([]);
  const [shareInput, setShareInput] = useState('');
  const [shareError, setShareError] = useState('');
  const [shareLoading, setShareLoading] = useState(false);
  const [titleError, setTitleError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleAddUser() {
    const email = shareInput.trim().toLowerCase();
    setShareError('');
    if (!email) { setShareError('Please enter an email address.'); return; }
    if (!isValidEmail(email)) { setShareError('Please enter a valid email address.'); return; }
    if (email === currentUser.email.toLowerCase()) { setShareError('You cannot share with yourself.'); return; }
    if (sharedWith.includes(email)) { setShareError('This user has already been added.'); return; }
    try {
      setShareLoading(true);
      const user = await findUserByEmail(email);
      if (!user) { setShareError('User with this email does not exist.'); return; }
      setSharedWith(prev => [...prev, email]);
      setShareInput('');
    } catch (e) {
      setShareError('Failed to check user. Please try again.');
    } finally {
      setShareLoading(false);
    }
  }

  function handleRemoveUser(email) {
    setSharedWith(prev => prev.filter(e => e !== email));
  }

  async function handleSave() {
    if (!title.trim()) { setTitleError('Title is required.'); return; }
    const ownerEmail = currentUser.email;
    const completedBy = { [ownerEmail]: false };
    for (const email of sharedWith) completedBy[email] = false;

    try {
      setLoading(true);
      setError('');
      await onAdd({
        title: title.trim(),
        description: description.trim(),
        date: date.trim(),
        time: time.trim(),
        ownerId: currentUser.id,
        ownerEmail,
        sharedWith,
        completedBy,
      });
      navigation.goBack();
    } catch (e) {
      setError('Failed to save reminder. Please try again.');
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
      >
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Details</Text>

        <Text style={styles.label}>Title <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={(text) => { setTitle(text); setTitleError(''); }}
          placeholder="What do you need to remember?"
          placeholderTextColor="#9CA3AF"
        />
        {titleError ? <Text style={styles.fieldError}>{titleError}</Text> : null}

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          value={description}
          onChangeText={setDescription}
          placeholder="Add more details (optional)"
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>Date</Text>
        <DatePickerField value={date} onChange={setDate} editable={true} />

        <Text style={styles.label}>Time</Text>
        <TimePickerField value={time} onChange={setTime} editable={true} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Share with others</Text>
        <Text style={styles.sectionHint}>Add people who can see and complete this reminder.</Text>

        <View style={styles.shareRow}>
          <TextInput
            style={[styles.input, styles.shareInput]}
            value={shareInput}
            onChangeText={(text) => { setShareInput(text); setShareError(''); }}
            placeholder="Enter user's email"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TouchableOpacity
            style={[styles.addUserButton, shareLoading && styles.buttonDisabled]}
            onPress={handleAddUser}
            disabled={shareLoading}
            activeOpacity={0.8}
          >
            {shareLoading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.addUserButtonText}>Add</Text>
            }
          </TouchableOpacity>
        </View>
        {shareError ? <Text style={styles.fieldError}>{shareError}</Text> : null}

        {sharedWith.length > 0 && (
          <View style={styles.chipList}>
            {sharedWith.map(email => (
              <View key={email} style={styles.chip}>
                <Text style={styles.chipText} numberOfLines={1}>{email}</Text>
                <TouchableOpacity
                  onPress={() => handleRemoveUser(email)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.chipRemove}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {sharedWith.length === 0 && (
          <Text style={styles.shareEmptyHint}>No users added yet.</Text>
        )}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.saveButton, loading && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading
          ? <ActivityIndicator size="small" color="#fff" />
          : <Text style={styles.saveButtonText}>Save Reminder</Text>
        }
      </TouchableOpacity>
    </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F0F2F8' },
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#F0F2F8' },
  content: { flexGrow: 1, padding: 16, paddingBottom: 200 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E', marginBottom: 4 },
  sectionHint: { fontSize: 13, color: '#9CA3AF', marginBottom: 16 },

  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 14, marginBottom: 6 },
  required: { color: '#DC2626' },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A1A2E',
  },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top', paddingTop: 12 },

  fieldError: { color: '#DC2626', fontSize: 12, marginTop: 4 },

  shareRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  shareInput: { flex: 1 },
  addUserButton: {
    backgroundColor: '#4A90D9',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 58,
  },
  addUserButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  chipList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  chipText: { fontSize: 13, color: '#1D4ED8', maxWidth: 200 },
  chipRemove: { fontSize: 11, color: '#4A90D9', fontWeight: '700' },

  shareEmptyHint: { fontSize: 13, color: '#9CA3AF', marginTop: 8 },

  error: { color: '#DC2626', fontSize: 13, textAlign: 'center', marginBottom: 12 },

  saveButton: {
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
  buttonDisabled: { opacity: 0.5 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
