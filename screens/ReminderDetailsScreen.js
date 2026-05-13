import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  SafeAreaView, KeyboardAvoidingView, Platform,
  StyleSheet, Alert, useWindowDimensions, ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import { findUserByEmail } from '../services/userService';
import { DatePickerField, TimePickerField } from '../components/DateTimeFields';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function Section({ title, open, onToggle, children }) {
  return (
    <View style={styles.section}>
      <TouchableOpacity style={styles.sectionHeader} onPress={onToggle} activeOpacity={0.7}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionArrow}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {open && <View style={styles.sectionBody}>{children}</View>}
    </View>
  );
}

export default function ReminderDetailsScreen({ route, navigation, onUpdate, onDelete, currentUser }) {
  const { reminder } = route.params;
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const [title, setTitle] = useState(reminder.title);
  const [titleError, setTitleError] = useState('');
  const [description, setDescription] = useState(reminder.description || '');
  const [date, setDate] = useState(reminder.date || '');
  const [time, setTime] = useState(reminder.time || '');
  const [completedBy, setCompletedBy] = useState(reminder.completedBy || {});
  const [sharedWith, setSharedWith] = useState(reminder.sharedWith || []);
  const [shareInput, setShareInput] = useState('');
  const [shareError, setShareError] = useState('');
  const [shareLoading, setShareLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [openBasicInfo, setOpenBasicInfo] = useState(true);
  const [openCompletion, setOpenCompletion] = useState(false);
  const [openSharing, setOpenSharing] = useState(false);

  const isOwner = reminder.ownerId === currentUser.id;

  const myDone = completedBy[currentUser.email] || false;
  const allValues = Object.values(completedBy);
  const fullyCompleted = allValues.length > 0 && allValues.every(v => v === true);

  function toggleMyStatus() {
    setCompletedBy(prev => ({ ...prev, [currentUser.email]: !prev[currentUser.email] }));
  }

  function buildCompletedBy(ownerEmail, sharedWith) {
    const result = {};
    result[ownerEmail] = completedBy[ownerEmail] || false;
    for (const email of sharedWith) {
      result[email] = completedBy[email] || false;
    }
    return result;
  }

  async function handleSave() {
    if (isOwner && !title.trim()) {
      setTitleError('Title is required.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      if (isOwner) {
        const ownerEmail = reminder.ownerEmail || currentUser.email;
        const newCompletedBy = buildCompletedBy(ownerEmail, sharedWith);
        await onUpdate(reminder.id, {
          title: title.trim(),
          description: description.trim(),
          date: date.trim(),
          time: time.trim(),
          ownerId: reminder.ownerId,
          ownerEmail,
          sharedWith,
          completedBy: newCompletedBy,
        });
      } else {
        await onUpdate(reminder.id, {
          title: reminder.title,
          description: reminder.description,
          date: reminder.date,
          time: reminder.time || '',
          ownerId: reminder.ownerId,
          ownerEmail: reminder.ownerEmail,
          sharedWith: reminder.sharedWith,
          completedBy,
        });
      }
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


  const basicInfoFields = (
    <>
      <Text style={[styles.label, styles.labelFirst]}>Title</Text>
      <TextInput
        style={[styles.input, !isOwner && styles.inputReadOnly]}
        value={title}
        onChangeText={(text) => { setTitle(text); setTitleError(''); }}
        placeholder="Enter title"
        placeholderTextColor="#9CA3AF"
        editable={isOwner}
      />
      {titleError ? <Text style={styles.fieldError}>{titleError}</Text> : null}

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, !isOwner && styles.inputReadOnly]}
        value={description}
        onChangeText={setDescription}
        placeholder="Enter description"
        placeholderTextColor="#9CA3AF"
        editable={isOwner}
      />

      <Text style={styles.label}>Date</Text>
      <DatePickerField value={date} onChange={setDate} editable={isOwner} />

      <Text style={styles.label}>Time</Text>
      <TimePickerField value={time} onChange={setTime} editable={isOwner} />
    </>
  );

  const completionFields = (
    <>
      <Text style={[styles.label, styles.labelFirst]}>Overall Status</Text>
      <View style={[styles.statusBadge, fullyCompleted ? styles.statusCompleted : styles.statusPending]}>
        <Text style={[styles.statusBadgeText, fullyCompleted ? styles.statusTextGreen : styles.statusTextOrange]}>
          {fullyCompleted ? '✓  Fully Completed' : '○  Pending'}
        </Text>
      </View>

      <Text style={styles.label}>My Status</Text>
      <TouchableOpacity
        style={[styles.statusButton, myDone ? styles.statusCompleted : styles.statusPending]}
        onPress={toggleMyStatus}
        activeOpacity={0.75}
      >
        <Text style={[styles.statusButtonText, myDone ? styles.statusTextGreen : styles.statusTextOrange]}>
          {myDone ? '✓  Marked as done — tap to undo' : '○  Tap to mark as done'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.label}>Completion by User</Text>
      <View style={styles.completionList}>
        {Object.entries(completedBy).map(([email, done], index, arr) => (
          <View
            key={email}
            style={[styles.completionRow, index === arr.length - 1 && styles.completionRowLast]}
          >
            <Text style={styles.completionEmail} numberOfLines={1}>{email}</Text>
            <View style={[styles.completionBadge, done ? styles.completionBadgeDone : styles.completionBadgePending]}>
              <Text style={[styles.completionBadgeText, done ? styles.statusTextGreen : styles.statusTextOrange]}>
                {done ? '✓ Done' : '○ Pending'}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </>
  );

  const sharingFields = (
    <>
      <Text style={[styles.label, styles.labelFirst]}>Share with</Text>
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

      {sharedWith.length > 0 ? (
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
      ) : (
        <Text style={styles.shareEmptyHint}>Not shared with anyone yet.</Text>
      )}
    </>
  );

  const actionButtons = (
    <>
      {loading && <Text style={styles.loadingText}>Please wait…</Text>}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.saveButton, loading && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading
          ? <ActivityIndicator size="small" color="#fff" />
          : <Text style={styles.buttonText}>Save Changes</Text>
        }
      </TouchableOpacity>

      {isOwner && (
        <>
          <View style={styles.divider} />
          <TouchableOpacity
            style={[styles.deleteButton, loading && styles.buttonDisabled]}
            onPress={handleDelete}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>Delete Reminder</Text>
          </TouchableOpacity>
        </>
      )}
    </>
  );


  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.ownerBadgeRow}>
            <View style={[styles.ownerBadge, isOwner ? styles.ownerBadgeMine : styles.ownerBadgeShared]}>
              <Text style={[styles.ownerBadgeText, isOwner ? styles.ownerBadgeTextMine : styles.ownerBadgeTextShared]}>
                {isOwner ? '✦  Your reminder' : '↗  Shared with you'}
              </Text>
            </View>
          </View>

          {!isWide && (
            <>
              <Section title="Basic Info" open={openBasicInfo} onToggle={() => setOpenBasicInfo(p => !p)}>
                {basicInfoFields}
              </Section>
              <Section title="Completion" open={openCompletion} onToggle={() => setOpenCompletion(p => !p)}>
                {completionFields}
              </Section>
              {isOwner && (
                <Section title="Sharing" open={openSharing} onToggle={() => setOpenSharing(p => !p)}>
                  {sharingFields}
                </Section>
              )}
            </>
          )}

          {isWide && (
            <View style={styles.columnsWide}>
              <View style={styles.columnWide}>{basicInfoFields}</View>
              <View style={styles.columnWide}>
                {completionFields}
                {isOwner && sharingFields}
              </View>
            </View>
          )}

          {actionButtons}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F0F2F8' },
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#F0F2F8' },
  content: { padding: 16, paddingBottom: 200, flexGrow: 1 },

  ownerBadgeRow: { alignItems: 'flex-start', marginBottom: 14 },
  ownerBadge: { borderRadius: 20, paddingVertical: 5, paddingHorizontal: 14 },
  ownerBadgeMine: { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' },
  ownerBadgeShared: { backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A' },
  ownerBadgeText: { fontSize: 12, fontWeight: '700' },
  ownerBadgeTextMine: { color: '#1D4ED8' },
  ownerBadgeTextShared: { color: '#D97706' },

  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  sectionArrow: { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },
  sectionBody: {
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },

  columnsWide: { flexDirection: 'row', gap: 20, alignItems: 'flex-start' },
  columnWide: { flex: 1 },

  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 16, marginBottom: 6 },
  labelFirst: { marginTop: 8 },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A1A2E',
    width: '100%',
  },
  inputReadOnly: { backgroundColor: '#F3F4F6', color: '#9CA3AF' },
  fieldError: { color: '#DC2626', fontSize: 12, marginTop: 4 },

  statusBadge: { borderRadius: 12, padding: 12, alignItems: 'center' },
  statusButton: { borderRadius: 12, padding: 14, alignItems: 'center' },
  statusCompleted: { backgroundColor: '#DCFCE7', borderWidth: 1, borderColor: '#86EFAC' },
  statusPending: { backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A' },
  statusBadgeText: { fontSize: 14, fontWeight: '700' },
  statusButtonText: { fontSize: 14, fontWeight: '600' },
  statusTextGreen: { color: '#16A34A' },
  statusTextOrange: { color: '#D97706' },

  completionList: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  completionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  completionRowLast: { borderBottomWidth: 0 },
  completionEmail: { fontSize: 13, color: '#374151', flex: 1, marginRight: 8 },
  completionBadge: { borderRadius: 12, paddingVertical: 3, paddingHorizontal: 8 },
  completionBadgeDone: { backgroundColor: '#DCFCE7' },
  completionBadgePending: { backgroundColor: '#FEF3C7' },
  completionBadgeText: { fontSize: 11, fontWeight: '700' },

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
  chipText: { fontSize: 12, color: '#1D4ED8', maxWidth: 200 },
  chipRemove: { fontSize: 11, color: '#4A90D9', fontWeight: '700' },
  shareEmptyHint: { fontSize: 13, color: '#9CA3AF', marginTop: 8 },

  loadingText: { textAlign: 'center', color: '#9CA3AF', marginTop: 16, fontSize: 14 },
  error: { color: '#DC2626', fontSize: 13, marginTop: 12, textAlign: 'center' },
  saveButton: {
    backgroundColor: '#4A90D9',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    width: '100%',
    shadowColor: '#4A90D9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  deleteButton: {
    backgroundColor: '#DC2626',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    width: '100%',
  },
  buttonDisabled: { opacity: 0.5 },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginTop: 28, marginBottom: 4 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
