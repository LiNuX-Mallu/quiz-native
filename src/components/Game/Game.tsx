import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import React, {useCallback, useEffect, useState} from 'react';
import { Socket } from 'socket.io-client';

interface Props {
  oppID: string;
  ID: string;
  setOppID: React.Dispatch<React.SetStateAction<string | null>>;
  socket: Socket;
}

interface Question {
  question: string;
  a: string;
  b: string;
  c: string;
  d: string;
  answer: string;
}

interface Game {
  started: boolean;
  score: number;
  attempt: number;
}

function Game({oppID, ID, setOppID, socket}: Props): React.JSX.Element {
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState({opp: 0, me: 0});
  const [started, setStarted] = useState(false);
  const [correct, setCorrect] = useState('');
  const [wrong, setWrong] = useState('');
  const gColor = '#17c717';
  const rColor = '#eb4e15';
  const dColor = '#ebebeb';

  //const isDark = Appearance.getColorScheme() === 'dark';

  const receiveExit = useCallback(
    (id: string) => {
      if (id !== oppID) {
        setOppID(null);
      }
    },
    [oppID, setOppID],
  );

  function receiveQuestions(qs: Question[]) {
    setQuestions(qs);
  }

  const receiveScore = useCallback(
    (game: Record<string, Game>) => {
      if (!oppID || !ID) {
        return undefined;
      }
      setScore({ opp: game[oppID].score, me: game[ID].score });
      if (game[oppID].attempt === 5 || game[ID].attempt === 5) {
        if (game[oppID].score > game[ID].score) {
          Alert.alert('Opponent won the game', 'press ok to exit', [
            {
              text: 'OK',
              onPress: () => setOppID(null),
            },
          ]);
        } else if (game[oppID].score < game[ID].score) {
          Alert.alert('You won the game', 'press ok to exit', [
            {
              text: 'OK',
              onPress: () => setOppID(null),
            },
          ]);
        } else {
          Alert.alert('It\'s a draw', 'press ok to exit', [
            {
              text: 'OK',
              onPress: () => setOppID(null),
            },
          ]);
        }
      }
    },
    [ID, oppID, setOppID]
  );

  useEffect(() => {
    if (oppID === null) {
      return setOppID(null);
    }
    socket.on('receiveExit', receiveExit);
    socket.on('receiveQuestions', receiveQuestions);
    socket.on('receiveScore', receiveScore);

    return () => {
      socket.off('receiveExit', receiveExit);
      socket.off('receiveQuestions', receiveQuestions);
      socket.off('receiveScore', receiveScore);
    };
  }, [ID, oppID, receiveExit, receiveScore, socket, setOppID]);

  const handleAnswer = (option: string) => {
    if (questions === null) {
      return false;
    }
    if (option === questions[qIndex].answer) {
      setCorrect(option);
      socket.emit('sendScore', { scored: true, from: ID, to: oppID });
    } else {
      setWrong(option);
      setCorrect(questions[qIndex].answer);
      socket.emit('sendScore', { scored: false, from: ID, to: oppID });
    }
    if (qIndex < 4) {
      setTimeout(() => {
        setQIndex(qIndex + 1);
        setCorrect('');
        setWrong('');
      }, 1000);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topbar}>
        <Text style={{fontSize: 17}}> {oppID} </Text>
        <Pressable
          onPress={() => {
            Alert.alert('', 'Are you sure?', [
              {
                text: 'No',
                style: 'cancel',
              },
              {
                text: 'Exit',
                style: 'default',
                onPress: () => {
                  setOppID(null);
                },
              },
            ]);
          }}
          style={{backgroundColor: '#adadad63', borderRadius: 3}}>
          <Text
            style={{
              fontSize: 16,
              paddingLeft: 8,
              paddingRight: 9,
            }}>
            Exit
          </Text>
        </Pressable>
      </View>
      {questions === null && !started && (
        <Pressable
          onPress={() => {
            setStarted(true);
            socket.emit('sendStart', { from: ID, to: oppID });
          }}
          style={{
            backgroundColor: '#e6e6e6',
            padding: 8,
            paddingRight: 15,
            paddingLeft: 15,
            borderRadius: 3,
          }}>
          <Text>start</Text>
        </Pressable>
      )}
      {questions === null && started && <ActivityIndicator size="large" />}
      {questions && (
        <View style={styles.score}>
          <Text
            style={{
              fontSize: 20,
              backgroundColor: '#2ea5d4',
              padding: 10,
              flex: 1,
              textAlign: 'center',
            }}>
            {score.me}
          </Text>
          <Text
            style={{
              fontSize: 20,
              backgroundColor: '#e76535',
              padding: 10,
              flex: 1,
              textAlign: 'center',
            }}>
            {score.opp}
          </Text>
        </View>
      )}
      {questions && (
        <View style={styles.question}>
          <Text
            style={{
              backgroundColor: '#4da34d',
              width: '100%',
              padding: 10,
              textAlign: 'center',
              fontSize: 16,
            }}>
            {questions[qIndex].question}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 3,
            }}>
            <Pressable onPress={() => handleAnswer('a')} style={{
              ...styles.option,
              backgroundColor: correct === 'a' ? gColor : wrong === 'a' ? rColor : dColor,
              }}>
              <Text style={styles.optionText}>{questions[qIndex].a}</Text>
            </Pressable>
            <Pressable onPress={() => handleAnswer('b')} style={{
              ...styles.option,
              backgroundColor: correct === 'b' ? gColor : wrong === 'b' ? rColor : dColor,
              }}>
              <Text style={styles.optionText}>{questions[qIndex].b}</Text>
            </Pressable>
          </View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 3,
            }}>
            <Pressable onPress={() => handleAnswer('c')} style={{
              ...styles.option,
              backgroundColor: correct === 'c' ? gColor : wrong === 'c' ? rColor : dColor,
              }}>
              <Text style={styles.optionText}>{questions[qIndex].c}</Text>
            </Pressable>
            <Pressable onPress={() => handleAnswer('d')} style={{
              ...styles.option,
              backgroundColor: correct === 'd' ? gColor : wrong === 'd' ? rColor : dColor,
              }}>
              <Text style={styles.optionText}>{questions[qIndex].c}</Text>
            </Pressable>
          </View>
        </View>
      )}
      {questions === null && (
        <Text>
          {started
            ? 'Waiting for opponent to start the game'
            : 'Press start button to begin the game'}
        </Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 50,
    paddingBottom: 40,
    paddingTop: 10,
  },
  topbar: {
    width: '100%',
    flexDirection: 'row',
    padding: 15,
    paddingRight: 20,
    paddingLeft: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  score: {
    width: '25%',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 3,
  },
  question: {
    width: '85%',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 5,
    gap: 3,
  },
  option: {
    flex: 1,
    padding: 12,
  },
  optionText: {
    textAlign: 'center',
  },
});

export default Game;
