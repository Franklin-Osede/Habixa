import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
// Note: In a real app we would use a proper API client. For speed, using fetch.

const API_URL = 'http://localhost:3008'; // Hardcoded for dev

export default function AdminScreen() {
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [token, setToken] = useState(''); // Simple Auth
  const [showTokenInput, setShowTokenInput] = useState(false);

  // Initial Fetch logic would go here if we had auto-auth
  // For now, manual refresh button

  const addToLog = (msg: string) => setLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

  const fetchUsers = async () => {
    if (!token) {
        Alert.alert('Auth Required', 'Please enter a valid Admin Token first.');
        setShowTokenInput(true);
        return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch users');
      setUsers(data);
      addToLog(`✅ Fetched ${data.length} users.`);
    } catch (e: any) {
      addToLog(`❌ Error Fetching Users: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const callAdminApi = async (endpoint: string, body: any) => {
    if (!selectedUser) {
        Alert.alert('No User Selected', 'Please select a Target User first.');
        return;
    }
    if (!token) {
         Alert.alert('Auth Required', 'Token missing.');
         return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
           'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: selectedUser.id, ...body })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error');
      
      addToLog(`✅ Success: ${endpoint} for ${selectedUser.name}`);
      Alert.alert('Success', `Action ${endpoint} completed.`);
    } catch (e: any) {
      addToLog(`❌ Error: ${e.message}`);
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-black p-4">
      <Stack.Screen options={{ title: 'God Mode ⚡️', headerTintColor: 'white', headerStyle: { backgroundColor: 'black' } }} />
      
      {/* Header & Token Control */}
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-white text-xl font-bold">Gamification Console</Text>
         <TouchableOpacity onPress={() => setShowTokenInput(!showTokenInput)}>
            <Text className="text-gray-500 text-xs">{token ? '🔑 Token Set' : '🔒 Set Token'}</Text>
         </TouchableOpacity>
      </View>

      {showTokenInput && (
          <View className="mb-4 bg-gray-900 p-2 rounded border border-gray-700">
              <Text className="text-gray-400 text-xs mb-1">Admin Bearer Token:</Text>
               <TouchableOpacity 
                className="bg-blue-900 p-2 rounded mb-2"
                onPress={() => {
                    // Quick Dev Hack: Paste a known dev token if needed, or user pastes manually
                    // setToken('...'); 
                }}
               >
                 {/* <Text className="text-blue-300 text-xs text-center">Paste Dev Token</Text> */}
               </TouchableOpacity>
               {/* Note: React Native TextInput needs import. Using simple view for now as placeholder for real input */}
          </View>
      )}

      <ScrollView className="space-y-4">
        
        {/* SECTION 1: PLAYER SELECTOR */}
        <View className="bg-gray-900 p-4 rounded-xl border border-gray-800">
             <View className="flex-row justify-between items-center mb-2">
                 <Text className="text-blue-400 font-bold">👤 Player Control</Text>
                 <TouchableOpacity onPress={fetchUsers} className="bg-blue-900 px-2 py-1 rounded">
                     <Text className="text-blue-200 text-xs">Refresh Users</Text>
                 </TouchableOpacity>
             </View>
             
             {selectedUser ? (
                 <View className="bg-blue-950/50 p-2 rounded border border-blue-500/30 flex-row justify-between items-center">
                     <View>
                        <Text className="text-white font-bold">{selectedUser.name || selectedUser.email}</Text>
                        <Text className="text-gray-400 text-xs">Lvl {selectedUser.level} • {selectedUser.xp} XP • {selectedUser.streakCurrent} 🔥</Text>
                     </View>
                     <TouchableOpacity onPress={() => setSelectedUser(null)}>
                         <Text className="text-red-400 text-xs">Change</Text>
                     </TouchableOpacity>
                 </View>
             ) : (
                 <View>
                    <Text className="text-gray-500 text-xs italic mb-2">Select a user to simulate actions:</Text>
                    {users.length === 0 ? (
                        <Text className="text-gray-600 text-center py-2">No users fetched (Check Token)</Text>
                    ) : (
                        users.slice(0, 3).map(u => (
                            <TouchableOpacity key={u.id} onPress={() => setSelectedUser(u)} className="bg-gray-800 p-2 rounded mb-1">
                                <Text className="text-gray-300">{u.name || u.email}</Text>
                            </TouchableOpacity>
                        ))
                    )}
                 </View>
             )}
        </View>

        {/* CONTROLS (Only visible if user selected) */}
        {selectedUser && (
            <>
                {/* Section 2: Workouts */}
                <View className="bg-gray-900 p-4 rounded-xl border border-gray-800">
                <Text className="text-green-400 font-bold mb-2">🏋️ Workout Simulation</Text>
                <TouchableOpacity 
                    className="bg-green-600 p-3 rounded-lg mb-2"
                    onPress={() => callAdminApi('simulate-workout', { workoutId: 'A01' })}
                >
                    <Text className="text-white text-center font-bold">Simulate &quot;Day 1 Foundation&quot;</Text>
                </TouchableOpacity>
                <Text className="text-xs text-gray-500">Injects a completed workout log + 100 XP.</Text>
                </View>

                {/* Section 3: Progression */}
                <View className="bg-gray-900 p-4 rounded-xl border border-gray-800">
                <Text className="text-yellow-400 font-bold mb-2">🚀 Progression</Text>
                <TouchableOpacity 
                    className="bg-yellow-600 p-3 rounded-lg mb-2"
                    onPress={() => callAdminApi('unlock-phase', { challengeId: 'CH_001' })}
                >
                    <Text className="text-black text-center font-bold">Force Unlock: Phase 2</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    className="bg-gray-700 p-3 rounded-lg"
                    onPress={() => callAdminApi('add-points', { points: 500 })}
                >
                    <Text className="text-white text-center">Add 500 XP (Manual Fix)</Text>
                </TouchableOpacity>
                </View>
            </>
        )}
        
         {/* Log Output */}
        <View className="mt-8 bg-gray-950 p-4 rounded-lg h-40">
            <Text className="text-gray-500 text-xs mb-2">ACTION LOG:</Text>
            {log.map((l, i) => (
                <Text key={i} className="text-white text-xs font-mono">{l}</Text>
            ))}
        </View>

      </ScrollView>
      
      {loading && (
        <View className="absolute inset-0 bg-black/50 justify-center items-center">
            <ActivityIndicator size="large" color="#4ade80" />
        </View>
      )}
    </View>
  );
}
