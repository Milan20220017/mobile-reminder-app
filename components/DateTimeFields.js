import { View, Text, TouchableOpacity, Modal, StyleSheet, Platform } from 'react-native';
import { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';


export function toYMD(d) {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

function todayMidnight() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseYMD(str) {
  if (!str) return todayMidnight();
  const [y, m, day] = str.split('-').map(Number);
  const d = new Date(y, m - 1, day);
  return isNaN(d.getTime()) ? todayMidnight() : d;
}

function formatDateDisplay(str) {
  if (!str) return '';
  return parseYMD(str).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}


export function toHHMM(d) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function parseHHMM(str) {
  const d = new Date();
  if (str) {
    const [h, m] = str.split(':').map(Number);
    if (!isNaN(h) && !isNaN(m)) d.setHours(h, m, 0, 0);
  }
  return d;
}

function formatTimeDisplay(str) {
  if (!str) return '';
  return parseHHMM(str).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}


function webInputStyle(editable) {
  return {
    backgroundColor: editable ? '#F9FAFB' : '#F3F4F6',
    border: '1px solid #E5E7EB',
    borderRadius: 12,
    padding: '12px 14px',
    fontSize: 15,
    color: editable ? '#1A1A2E' : '#9CA3AF',
    width: '100%',
    outline: 'none',
    boxSizing: 'border-box',
    cursor: editable ? 'pointer' : 'default',
    fontFamily: 'inherit',
  };
}


export function DatePickerField({ value, onChange, editable }) {
  const [showPicker, setShowPicker] = useState(false);
  const minDate = todayMidnight();
  const selectedDate = parseYMD(value);

  if (Platform.OS === 'web') {
    return (
      <input
        type="date"
        value={value}
        min={toYMD(minDate)}
        disabled={!editable}
        onChange={(e) => { if (editable) onChange(e.target.value); }}
        style={webInputStyle(editable)}
      />
    );
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.field, !editable && styles.fieldReadOnly]}
        onPress={() => { if (editable) setShowPicker(true); }}
        activeOpacity={editable ? 0.7 : 1}
      >
        <Text style={[styles.fieldText, !value && styles.placeholder]}>
          {value ? formatDateDisplay(value) : 'Select date'}
        </Text>
        {editable && <Text style={styles.fieldIcon}>📅</Text>}
      </TouchableOpacity>

      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          minimumDate={minDate}
          onChange={(event, picked) => {
            setShowPicker(false);
            if (event.type === 'set' && picked) onChange(toYMD(picked));
          }}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal
          visible={showPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowPicker(false)}>
                  <Text style={styles.doneText}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="spinner"
                minimumDate={minDate}
                onChange={(_, picked) => { if (picked) onChange(toYMD(picked)); }}
                style={{ width: '100%' }}
              />
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}


export function TimePickerField({ value, onChange, editable }) {
  const [showPicker, setShowPicker] = useState(false);
  const selectedTime = parseHHMM(value);

  if (Platform.OS === 'web') {
    return (
      <input
        type="time"
        value={value}
        disabled={!editable}
        onChange={(e) => { if (editable) onChange(e.target.value); }}
        style={webInputStyle(editable)}
      />
    );
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.field, !editable && styles.fieldReadOnly]}
        onPress={() => { if (editable) setShowPicker(true); }}
        activeOpacity={editable ? 0.7 : 1}
      >
        <Text style={[styles.fieldText, !value && styles.placeholder]}>
          {value ? formatTimeDisplay(value) : 'Select time'}
        </Text>
        {editable && <Text style={styles.fieldIcon}>🕐</Text>}
      </TouchableOpacity>

      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          display="default"
          is24Hour={false}
          onChange={(event, picked) => {
            setShowPicker(false);
            if (event.type === 'set' && picked) onChange(toHHMM(picked));
          }}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal
          visible={showPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowPicker(false)}>
                  <Text style={styles.doneText}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={selectedTime}
                mode="time"
                display="spinner"
                is24Hour={false}
                onChange={(_, picked) => { if (picked) onChange(toHHMM(picked)); }}
                style={{ width: '100%' }}
              />
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}


const styles = StyleSheet.create({
  field: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  fieldReadOnly: { backgroundColor: '#F3F4F6' },
  fieldText: { fontSize: 15, color: '#1A1A2E', flex: 1 },
  placeholder: { color: '#9CA3AF' },
  fieldIcon: { fontSize: 16, marginLeft: 8 },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
  },
  modalHeader: {
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  doneText: { fontSize: 16, color: '#4A90D9', fontWeight: '700' },
});
