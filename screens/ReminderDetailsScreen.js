import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  SafeAreaView, StyleSheet, Alert, useWindowDimensions,
} from 'react-native';
import { useState } from 'react';

// Collapsible section — used only on mobile width
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
  const isWide = width >= 600;

  const [title, setTitle] = useState(reminder.title);
  const [titleError, setTitleError] = useState('');
  const [description, setDescription] = useState(reminder.description || '');
  const [date, setDate] = useState(reminder.date || '');
  const [completedBy, setCompletedBy] = useState(reminder.completedBy || {});
  const [shareEmail, setShareEmail] = useState((reminder.sharedWith || [])[0] || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Mobile section open/close state
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
        const newSharedWith = shareEmail.trim() ? [shareEmail.trim().toLowerCase()] : [];
        const ownerEmail = reminder.ownerEmail || currentUser.email;
        const newCompletedBy = buildCompletedBy(ownerEmail, newSharedWith);
        await onUpdate(reminder.id, {
          title: title.trim(),
          description: description.trim(),
          date: date.trim(),
          ownerId: reminder.ownerId,
          ownerEmail,
          sharedWith: newSharedWith,
          completedBy: newCompletedBy,
        });
      } else {
        await onUpdate(reminder.id, {
          title: reminder.title,
          description: reminder.description,
          date: reminder.date,
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

  // ── Shared field blocks (used in both layouts) ─────────────────────────────

  const basicInfoFields = (
    <>
      <Text style={[styles.label, styles.labelFirst]}>Title</Text>
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
    </>
  );

  const completionFields = (
    <>
      <Text style={[styles.label, styles.labelFirst]}>Overall Status</Text>
      <View style={[styles.statusBadge, fullyCompleted ? styles.statusCompleted : styles.statusPending]}>
        <Text style={styles.statusBadgeText}>
          {fullyCompleted ? '✓  Fully Completed' : '○  Pending'}
        </Text>
      </View>

      <Text style={styles.label}>My Status</Text>
      <TouchableOpacity
        style={[styles.statusButton, myDone ? styles.statusCompleted : styles.statusPending]}
        onPress={toggleMyStatus}
      >
        <Text style={styles.statusButtonText}>
          {myDone ? '✓  I marked this done — tap to undo' : '○  Mark as done for me'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.label}>Completion by User</Text>
      <View style={styles.completionList}>
        {Object.entries(completedBy).map(([email, done]) => (
          <View key={email} style={styles.completionRow}>
            <Text style={styles.completionEmail} numberOfLines={1}>{email}</Text>
            <Text style={[styles.completionMark, done ? styles.completionDone : styles.completionPending]}>
              {done ? '✓' : '○'}
            </Text>
          </View>
        ))}
      </View>
    </>
  );

  const sharingFields = (
    <>
      <Text style={[styles.label, styles.labelFirst]}>Share with (email)</Text>
      <TextInput
        style={styles.input}
        value={shareEmail}
        onChangeText={setShareEmail}
        placeholder="Enter user's email to share"
        placeholderTextColor="#999"
        autoCapitalize="none"
        keyboardType="email-address"
      />
    </>
  );

  const actionButtons = (
    <>
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
        <>
          <View style={styles.divider} />
          <TouchableOpacity
            style={[styles.buttonDanger, loading && styles.buttonDisabled]}
            onPress={handleDelete}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Delete Reminder</Text>
          </TouchableOpacity>
        </>
      )}
    </>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* Owner badge — always full width */}
        <View style={styles.ownerBadgeRow}>
          <View style={[styles.ownerBadge, isOwner ? styles.ownerBadgeMine : styles.ownerBadgeShared]}>
            <Text style={styles.ownerBadgeText}>
              {isOwner ? 'Your reminder' : 'Shared with you'}
            </Text>
          </View>
        </View>

        {/* ── MOBILE: collapsible sections ── */}
        {!isWide && (
          <>
            <Section
              title="Basic Info"
              open={openBasicInfo}
              onToggle={() => setOpenBasicInfo(p => !p)}
            >
              {basicInfoFields}
            </Section>

            <Section
              title="Completion"
              open={openCompletion}
              onToggle={() => setOpenCompletion(p => !p)}
            >
              {completionFields}
            </Section>

            {isOwner && (
              <Section
                title="Sharing"
                open={openSharing}
                onToggle={() => setOpenSharing(p => !p)}
              >
                {sharingFields}
              </Section>
            )}
          </>
        )}

        {/* ── WIDE: two-column layout ── */}
        {isWide && (
          <View style={styles.columnsWide}>
            <View style={styles.columnWide}>
              {basicInfoFields}
            </View>
            <View style={styles.columnWide}>
              {completionFields}
              {isOwner && sharingFields}
            </View>
          </View>
        )}

        {/* Actions — always visible at the bottom */}
        {actionButtons}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  content: {
    padding: 16,
    paddingBottom: 100,
    flexGrow: 1,
  },
  ownerBadgeRow: {
    alignItems: 'flex-start',
    marginBottom: 12,
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

  // ── Collapsible section ──────────────────────────────────────────────────
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 10,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  sectionArrow: {
    fontSize: 11,
    color: '#999',
  },
  sectionBody: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },

  // ── Two-column layout (wide) ─────────────────────────────────────────────
  columnsWide: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'flex-start',
  },
  columnWide: {
    flex: 1,
  },

  // ── Fields ──────────────────────────────────────────────────────────────
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginTop: 16,
    marginBottom: 6,
  },
  labelFirst: {
    marginTop: 8,
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

  // ── Status ───────────────────────────────────────────────────────────────
  statusBadge: {
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#444',
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

  // ── Completion list ───────────────────────────────────────────────────────
  completionList: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  completionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  completionEmail: {
    fontSize: 14,
    color: '#444',
    flex: 1,
    marginRight: 8,
  },
  completionMark: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  completionDone: {
    color: '#27AE60',
  },
  completionPending: {
    color: '#E67E22',
  },

  // ── Actions ───────────────────────────────────────────────────────────────
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
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDanger: {
    backgroundColor: '#E74C3C',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginTop: 24,
    marginBottom: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
