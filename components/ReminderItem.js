import { View, Text, StyleSheet } from 'react-native';

export default function ReminderItem({ title, completed }) {
  return (
    <View style={styles.item}>
      <Text style={completed ? styles.done : styles.text}>{title}</Text>
      <Text style={styles.status}>{completed ? 'Done' : 'Pending'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: '#ccc' },
  text: { fontSize: 16 },
  done: { fontSize: 16, textDecorationLine: 'line-through', color: '#999' },
  status: { color: '#888' },
});
