import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Platform,
} from 'react-native'
import React, { useState, useEffect } from 'react'
import { useNavigation, useRoute } from '@react-navigation/native'
import {
  query,
  collection,
  doc,
  addDoc,
  where,
  orderBy,
  onSnapshot,
  getDocs,
} from 'firebase/firestore'
import { FIRESTORE_DB } from '../../firebaseConfig'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useColorSchemeContext } from '../../App'

let docId

const BoardInfo = ({ navigation }) => {
  const { useColors } = useColorSchemeContext()

  const route = useRoute()
  const db = FIRESTORE_DB
  const colors = useColors()

  const [createdBy, setCreatedBy] = useState(null)
  const [highScore, setHighScore] = useState(null)
  const [scoreList, setScoreList] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (route) {
      docId = route.params?.id
      initialLoad()
    }
  }, [route])

  useEffect(() => {
    const q = query(
      collection(db, 'Scores'),
      where('boardId', '==', docId),
      orderBy('score', 'asc'),
      orderBy('createdAt', 'asc'),
    )
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const scoreListArr = []
      let gamemode
      if (!querySnapshot.empty) {
        if (querySnapshot.docs[0].data().gamemode == 'Progressive') {
          console.log('yeah')
          gamemode = 'Progressive'
        } else {
          gamemode = 'Free Play'
        }
        const highScoreData = {
          id: querySnapshot.docs[0].id,
          data: querySnapshot.docs[0].data(),
        }
        setHighScore(highScoreData)
        querySnapshot.forEach((doc) => {
          if (gamemode == 'Progressive') {
            console.log('true')
            scoreListArr.push({
              ...doc.data(),
              score:
                doc.data().score > 0 ? `+${doc.data().score}` : doc.data().score,
            })
          } else {
            scoreListArr.push(doc.data())
          }
        })
      }
      setScoreList(scoreListArr)
    })
    return unsubscribe
  }, [route])

  async function initialLoad() {
    const creatorQuery = query(
      collection(db, 'Scores'),
      where('boardId', '==', docId),
      orderBy('createdAt', 'asc'),
    )
    console.log(docId)
    const querySnapshot = await getDocs(creatorQuery)
    console.log(querySnapshot)
    if (!querySnapshot.empty) {
      console.log(querySnapshot.docs[0].data())
      setCreatedBy(querySnapshot.docs[0].data())
    }
    setLoading(false)
  }

  async function loadBoard(id, size) {
    if (size != 'Default') {
      switch (size) {
        case 'Small':
          size = '1'
          break
        case 'Medium':
          size = '2'
          break
        case 'Large':
          size = '3'
          break
      }
      await AsyncStorage.setItem('size', size)
      navigation.navigate('FreePlay', { id })
    } else {
      navigation.navigate('Progressive', { id })
    }
  }

  const LoadedView = ({ createdBy, highScore, scoreList }) => {
    return (
      <>
        <Text
          style={{
            textAlign: 'center',
            fontSize: 30,
            marginBottom: 30,
            marginTop: 30,
            color: colors.text,
          }}
        >
          Board Info
        </Text>
        {/* <Text style={{textAlign: 'center', fontSize: 20, color: colors.text}}>Board Code: {createdBy.boardId}</Text> */}
        <Text
          style={{
            textAlign: 'center',
            fontSize: 20,
            marginBottom: 10,
            color: colors.text,
          }}
        >
          Created By: {createdBy.createdBy}
        </Text>
        <Text
          style={{
            textAlign: 'center',
            fontSize: 20,
            marginBottom: 10,
            color: colors.text,
          }}
        >
          Board Size: {highScore.data.size}
        </Text>
        <Text
          style={{
            textAlign: 'center',
            fontSize: 20,
            marginBottom: 10,
            color: colors.text,
          }}
        >
          Best Score: {highScore.data.createdBy} ({highScore.data.score})
        </Text>
        <Text
          style={{
            textAlign: 'center',
            fontSize: 20,
            marginTop: 20,
            marginBottom: 20,
            color: colors.text,
          }}
        >
          All Scores
        </Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, { backgroundColor: colors.tableTop }]}>
            <View
              style={[
                styles.tableCol,
                { padding: 15, alignItems: 'center', width: '20%', maxWidth: '20%' },
              ]}
            >
              <Text style={[{ color: colors.text }]}>Rank</Text>
            </View>
            <View
              style={[
                styles.tableCol,
                { padding: 15, alignItems: 'center', width: '40%', maxWidth: '40%' },
              ]}
            >
              <Text style={[{ color: colors.text }]}>Username</Text>
            </View>
            <View
              style={[
                styles.tableCol,
                { padding: 15, alignItems: 'center', width: '40%', maxWidth: '40%' },
              ]}
            >
              <Text style={[{ color: colors.text }]}>Score</Text>
            </View>
          </View>
          <FlatList
            data={scoreList}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <View style={[styles.tableRow, { backgroundColor: colors.tableRow }]}>
                <View
                  style={[
                    styles.tableCol,
                    {
                      padding: 15,
                      alignItems: 'center',
                      width: '20%',
                      maxWidth: '20%',
                    },
                  ]}
                >
                  <Text style={[{ color: colors.text }]}>{index + 1}</Text>
                </View>
                <View
                  style={[
                    styles.tableCol,
                    {
                      padding: 15,
                      alignItems: 'center',
                      width: '40%',
                      maxWidth: '40%',
                    },
                  ]}
                >
                  <Text style={[{ color: colors.text }]}>{item.createdBy}</Text>
                </View>
                <View
                  style={[
                    styles.tableCol,
                    {
                      padding: 15,
                      alignItems: 'center',
                      width: '40%',
                      maxWidth: '40%',
                    },
                  ]}
                >
                  <Text style={[{ color: colors.text }]}>{item.score}</Text>
                </View>
              </View>
            )}
          />
        </View>
        <TouchableOpacity
          style={[styles.button, { marginTop: Platform.OS === 'web' && 30 }]}
          onPress={() => loadBoard(highScore.id, highScore.data.size)}
        >
          <Text style={styles.buttonText}>Play this board</Text>
        </TouchableOpacity>
      </>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {!loading ? (
        <LoadedView
          createdBy={createdBy}
          highScore={highScore}
          scoreList={scoreList}
        ></LoadedView>
      ) : (
        <ActivityIndicator size="large"></ActivityIndicator>
      )}
    </View>
  )
}

export default BoardInfo

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  table: {
    minWidth: 320,
    maxWidth: '90%',
    maxHeight: '50%',
    overflow: 'hidden',
  },
  tableRow: {
    display: 'flex',
    flexDirection: 'row',
    borderBottomWidth: 1,
    maxHeight: 50,
    borderTopWidth: 1,
  },
  tableCol: {
    flexGrow: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    width: '33%',
  },
  button: {
    padding: 20,
    fontSize: 5,
    borderRadius: 50,
    width: 150,
    margin: 'auto',
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop: 5,
    marginBottom: 5,
    backgroundColor: 'green',
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    textAlign: 'center',
    color: 'white',
    textShadowColor: 'black',
    textShadowRadius: 1,
    textShadowOffset: {
      width: 1,
      height: 1,
    },
  },
})
