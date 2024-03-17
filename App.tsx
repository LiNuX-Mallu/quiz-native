import React, {useCallback, useEffect, useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  SafeAreaView,
  Appearance,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import Socket from './src/instances/socket';
import Game from './src/components/Game/Game';
import {Modal} from 'react-native';

function App(): React.JSX.Element {
  const [ID, setID] = useState<string | null>(null);
  const [oppID, setOppID] = useState<string | null>(null);
  const isDark = Appearance.getColorScheme() === 'dark';
  const [socket] = useState(Socket.connect());
  const [request, setRequest] = useState<string | null>(null);
  const [requestFriend, setRequestFriend] = useState<string | boolean>(false);
  const [alert, setAlert] = useState<number | null>(null);
  const [searching, setSearching] = useState('none');

  function receiveID(id: string) {
    setID(id.toString());
  }

  const receiveAlert = useCallback((code: number) => {
    setAlert(code);
  }, []);

  const receiveRequest = useCallback(
    (id: string) => {
      if (ID === null || id.toString() === ID || oppID !== null) {
        return undefined;
      }
      setRequest(id.toString());
    },
    [ID, oppID],
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

  const receiveAcceptance = useCallback((id: string) => {
    if (id.toString() === ID) {
      return undefined;
    }
    socket.off('receiveAccept', receiveAcceptance);
    setSearching('none');
    requestFriend && setRequestFriend(false);
    request && setRequest(null);
    setOppID(id);
  }, [ID, socket, request, requestFriend]);

  const sendRequest = (friend: string | null) => {
    setSearching(friend ? 'friend' : 'random');
    setRequest(null);
    if (oppID) {
      return undefined;
    }
    socket.on('receiveAccept', receiveAcceptance);
    socket.emit('sendRequest', {ID, friend});
  };

  if (oppID !== null && ID !== null) {
    return <Game socket={socket} setOppID={setOppID} oppID={oppID} ID={ID} />;
  }

  return (
    <SafeAreaView style={homeStyles.container}>
      <Text style={homeStyles.title}>Quiz App</Text>
      <Pressable>
        {ID !== null ? (
          <Text style={{color: isDark ? '#f7f7f7' : '#000000'}}>
            Your ID: {ID}
          </Text>
        ) : (
          <ActivityIndicator size="small" />
        )}
      </Pressable>
      <View style={homeStyles.buttons}>
        <Pressable
          onPress={() => setRequestFriend(true)}
          style={({pressed}) => [
            {
              ...homeStyles.btn,
              backgroundColor: pressed ? '#2788af5e' : '#2789af',
            },
          ]}>
          <Text style={homeStyles.btntext}>Play with a friend</Text>
        </Pressable>
        <Text style={{textAlign: 'center', fontWeight: '500'}}>OR</Text>
        <Pressable
          onPress={() => sendRequest(null)}
          style={({pressed}) => [
            {
              ...homeStyles.btn,
              backgroundColor: pressed ? '#1c941c4b' : '#1c941c',
            },
          ]}>
          <Text style={homeStyles.btntext}>{searching === 'random' ? 'Searching for players' : 'Play with random player'}</Text>
          {searching === 'random' && <ActivityIndicator size={16} />}
        </Pressable>
      </View>

      {/* Modal for play with friend */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={requestFriend !== false}
        onRequestClose={() => {
          setRequestFriend(false);
          setAlert(null);
          setSearching('none');
          }}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#e9e9e9bc',
          }}>
          <View
            style={{
              width: '85%',
              minHeight: '20%',
              backgroundColor: '#131313',
              borderRadius: 5,
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 30,
              gap: 20,
              overflow: 'hidden',
            }}>
            {alert === 404 && <Text style={{color: 'red'}}>Invalid ID provided!</Text>}
            {alert !== 404 && searching === 'friend' &&
            <View style={{
              width: '100%',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
            }}>
              <Text style={{fontSize: 16}}>Waiting friend to accept request</Text>
              <ActivityIndicator size={16} />
            </View>}
            <TextInput
              style={{
                width: '100%',
                fontSize: 16,
              }}
              placeholder="Enter ID here"
              keyboardType="number-pad"
              onChangeText={setRequestFriend}
              value={typeof requestFriend === 'string' ? requestFriend : ''}
            />
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                width: '100%',
                justifyContent: 'space-evenly',
                gap: 10,
              }}>
              <Pressable
                onPress={() => {
                  setRequestFriend(false);
                  setAlert(null);
                  setSearching('none');
                }}
                style={({pressed}) => [
                  {
                    backgroundColor: pressed ? '#80808073' : '#5f5f5f',
                    padding: 5,
                    borderRadius: 3,
                    paddingLeft: 10,
                    paddingRight: 10,
                  },
                ]}>
                <Text style={{fontSize: 17, width: 90, textAlign: 'center'}}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setAlert(null);
                  sendRequest(typeof requestFriend === 'string' ? requestFriend : '404');
                }}
                style={({pressed}) => [
                  {
                    backgroundColor: pressed ? '#0f6191ae' : '#2467b4',
                    padding: 5,
                    borderRadius: 3,
                    paddingLeft: 10,
                    paddingRight: 10,
                  },
                ]}>
                <Text style={{fontSize: 17, width: 90, textAlign: 'center'}}>
                  Request
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal for request */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={request !== null}
        onRequestClose={() => setRequest(null)}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#e9e9e9bc',
          }}>
          <View
            style={{
              width: '85%',
              height: '30%',
              backgroundColor: '#131313',
              borderRadius: 5,
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 30,
            }}>
            <Text style={{fontSize: 30, textAlign: 'center'}}>Request</Text>
            <Text style={{fontSize: 15, textAlign: 'center'}}>
              Someone looking for a pair!
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                width: '100%',
                justifyContent: 'space-evenly',
                gap: 10,
              }}>
              <Pressable
                onPress={() => setRequest(null)}
                style={({pressed}) => [
                  {
                    backgroundColor: pressed ? '#dd3d3d8f' : '#dd3d3d',
                    padding: 5,
                    borderRadius: 3,
                    paddingLeft: 10,
                    paddingRight: 10,
                  },
                ]}>
                <Text style={{fontSize: 17, width: 90, textAlign: 'center'}}>
                  Reject
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  socket.emit('acceptRequest', {from: ID, to: request});
                  setOppID(request);
                  setRequest(null);
                }}
                style={({pressed}) => [
                  {
                    backgroundColor: pressed ? '#10ad1099' : '#00b900',
                    padding: 5,
                    borderRadius: 3,
                    paddingLeft: 10,
                    paddingRight: 10,
                  },
                ]}>
                <Text style={{fontSize: 17, width: 90, textAlign: 'center'}}>
                  Accept
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

//styles
const homeStyles = StyleSheet.create({
  container: {
    backgroundColor: '#161616',
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
    flexDirection: 'row',
    gap: 5,
  },
  btntext: {
    color: '#f5f5f5',
    fontWeight: '400',
    fontSize: 15,
  },
});

export default App;
