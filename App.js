import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Button, FlatList, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [notes, setNotes] = useState([]);
  const [text, setText] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => { loadNotes(); }, []);

  async function loadNotes() {
    try {
      const json = await AsyncStorage.getItem('notes');
      if (json) setNotes(JSON.parse(json));
    } catch (e) { console.log('load error', e); }
  }

  async function saveNotes(newNotes) {
    try {
      setNotes(newNotes);
      await AsyncStorage.setItem('notes', JSON.stringify(newNotes));
    } catch (e) { console.log('save error', e); }
  }

  function startEdit(item) {
    setEditingId(item.id);
    setText(item.text);
  }

  function cancelEdit() {
    setEditingId(null);
    setText('');
  }

  function addOrUpdate() {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (editingId) {
      const updated = notes.map(n => n.id === editingId ? { ...n, text: trimmed, updatedAt: Date.now() } : n);
      saveNotes(updated);
      cancelEdit();
      return;
    }
    const newNote = { id: Date.now().toString() + Math.random().toString(36).slice(2), text: trimmed, createdAt: Date.now() };
    saveNotes([newNote, ...notes]);
    setText('');
  }

  function deleteNote(id) {
    Alert.alert('Delete', 'Delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const filtered = notes.filter(n => n.id !== id);
        saveNotes(filtered);
        if (editingId === id) cancelEdit();
      }}
    ]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📒 Simple Notes</Text>

      <TextInput
        style={styles.input}
        placeholder="Type note here..."
        value={text}
        onChangeText={setText}
        multiline
      />

      <View style={{flexDirection:'row', gap:8}}>
        <View style={{flex:1, marginRight:8}}>
          <Button title={editingId ? "Update" : "Add Note"} onPress={addOrUpdate} />
        </View>
        {editingId ? (
          <View style={{width:90}}>
            <Button title="Cancel" onPress={cancelEdit} />
          </View>
        ) : null}
      </View>

      <FlatList
        data={notes}
        keyExtractor={item => item.id}
        style={{marginTop:16}}
        renderItem={({item})=>(
          <TouchableOpacity onPress={()=>startEdit(item)} style={styles.note}>
            <Text style={{flex:1}}>{item.text}</Text>
            <View style={{width:80, flexDirection:'row', justifyContent:'flex-end', gap:6}}>
              <Button title="Edit" onPress={()=>startEdit(item)} />
              <Button title="Del" onPress={()=>deleteNote(item.id)} />
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, paddingTop: 48, backgroundColor:'#fff' },
  title: { fontSize: 22, fontWeight:'700', marginBottom: 12 },
  input: { borderWidth:1, borderColor:'#ccc', padding:10, borderRadius:6, minHeight:50 },
  note: { padding:10, borderBottomWidth:1, borderColor:'#eee', flexDirection:'row', alignItems:'center' }
});
