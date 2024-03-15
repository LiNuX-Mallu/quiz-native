import React, {useCallback, useEffect, useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Alert,
  SafeAreaView,
  Appearance,
  ActivityIndicator,
} from 'react-native';
import Socket from './src/instances/socket';
import Game from './src/components/Game/Game';

function App(): React.JSX.Element {
  const [ID, setID] = useState<string | null>(null);
  const [oppID, setOppID] = useState<string | null>(null);
  const isDark = Appearance.getColorScheme() === 'dark';
  const [socket] = useState(Socket.connect());

  function receiveID(id: string) {
    setID(id);
  }

  const receiveAlert = useCallback(function (code: number) {
    let text: string;
    switch (code) {
      case 404:
        text = 'Invalid ID';
        break;
      default:
        text = 'Something went wrong';
    }
    Alert.alert(text);
  }, []);

  const receiveRequest = useCallback(
    (id: string) => {
      if (ID === null || id === ID || oppID !== null) {
        return undefined;
      }
      Alert.alert('Request', 'Someone looking for a partner', [
        {
          text: 'Reject',
          onPress: () => setOppID(null),
          style: 'cancel',
        },
        {
          text: 'Accept',
          onPress: () => {
            socket.emit('acceptRequest', {from: ID, to: id});
            setOppID(id);
          },
        },
      ]);
    },
    [ID, socket, oppID],
  );

  useEffect(() => {
    if (socket) {
      socket.on('recieveID', receiveID);
      socket.emit('joinID');
    }
  }, [socket]);

  useEffect(() => {
    if (ID === null) {
      return undefined;
    }
    socket.on('receiveAlert', receiveAlert);
    socket.on('receiveRequest', receiveRequest);
    () => {
      socket.emit('leaveID', ID);
      socket.off('receiveAlert', receiveAlert);
      socket.off('recieveID', receiveID);
      socket.off('receiveRequest', receiveRequest);
    };
  }, [socket, ID, receiveAlert, receiveRequest]);

  const sendRequest = (friend: string | null) => {
    if (oppID) {
      return undefined;
    }

    async function receiveAcceptance(id: string) {
      if (id === ID) {
        return undefined;
      }
      setOppID(id);
      socket.off('receiveAccept', receiveAcceptance);
    }

    socket.on('receiveAccept', receiveAcceptance);
    socket.emit('sendRequest', { ID, friend });
  };

  if (oppID !== null && ID !== null) {
    return (
      <Game socket={socket} setOppID={setOppID} oppID={oppID} ID={ID} />
    );
  }

  return (
    <SafeAreaView style={homeStyles.container}>
      <Text style={homeStyles.title}>Quiz App</Text>
      <Pressable>
        {ID !== null ? (
          <Text style={{color: isDark ? '#ffffff' : '#000000'}}>
            Your ID: {ID}
          </Text>
        ) : (
          <ActivityIndicator size="small" />
        )}
      </Pressable>
      <View style={homeStyles.buttons}>
        <Pressable style={({pressed}) => [
          {
            ...homeStyles.btn,
            backgroundColor: pressed ? '#2788af5e' : '#2789af',
          },
        ]}>
          <Text style={homeStyles.btntext}>Play with a friend</Text>
        </Pressable>
        <Text style={{textAlign: 'center', fontWeight: '500'}}>OR</Text>
        <Pressable onPress={() => sendRequest(null)} style={({pressed}) => [
          {
            ...homeStyles.btn,
            backgroundColor: pressed ? '#1c941c4b' : '#1c941c',
          },
        ]}>
          <Text style={homeStyles.btntext}>Play with random player</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

//styles
const homeStyles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 50,
  },
  title: {
    fontSize: 50,
    color: '#555555',
    fontWeight: '500',
    marginBottom: 80,
  },
  buttons: {
    width: '80%',
    gap: 20,
  },
  btn: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    borderRadius: 5,
    color: 'white',
  },
  btntext: {
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default App;
