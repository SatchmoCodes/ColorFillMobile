import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  Pressable,
  FlatList,
  Platform,
} from 'react-native'
import React, { useState, useEffect } from 'react'
import {
  query,
  collection,
  doc,
  addDoc,
  where,
  getDocs,
  getDoc,
  orderBy,
  serverTimestamp,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore'
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../firebaseConfig.js'
import { useIsFocused } from '@react-navigation/native'
import uuid from 'react-native-uuid'
import { useColorSchemeContext } from '../../App'

const PVPMenu = ({ navigation }) => {
  const { useColors } = useColorSchemeContext()
  const colors = useColors()

  const isFocused = useIsFocused()
  const auth = FIREBASE_AUTH
  const db = FIRESTORE_DB

  const [games, setGames] = useState([])
  const [code, setCode] = useState('')

  const [uid, setUid] = useState(null)
  const [userName, setUserName] = useState(null)

  const reloadData = async () => {
    const docRef = collection(db, 'Games')
    const querySnapshot = await getDocs(docRef)
    const gameList = []
    if (!querySnapshot.empty) {
      querySnapshot.forEach((doc, index) => {
        const gameData = doc.data()
        if (gameData.gameState !== 'Playing' && gameData.gameState !== 'Deleting') {
          let dateObj = gameData.createdAt.toDate()
          let timeCreated = dateObj.getTime() / 1000
          let currentTime = Math.floor(new Date().getTime() / 1000)
          console.log('timeCreated', timeCreated)
          console.log('currentTime', currentTime)
          console.log('currenttime - timecreatd', currentTime - timeCreated)
          if (currentTime - timeCreated <= 300) {
            gameList.push({
              id: doc.id,
              data: doc.data(),
            })
          }
        }
      })
      setGames(gameList)
    }
  }

  useEffect(() => {
    if (isFocused) {
      reloadData()
    }
  }, [isFocused])

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUid(user.uid)
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    const getUserData = async () => {
      const q = query(collection(db, 'Users'), where('uid', '==', uid))
      const querySnapshot = await getDocs(q)
      querySnapshot.forEach((doc) => {
        setUserName(doc.data().username)
      })
    }
    getUserData()
  }, [uid])

  useEffect(() => {
    const q = query(
      collection(db, 'Games'),
      where('lobbyType', '==', 'Public'),
      orderBy('createdAt', 'asc'),
    )
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const gameList = []
      querySnapshot.forEach((doc, index) => {
        const gameData = doc.data()
        if (gameData.gameState !== 'Playing' && gameData.gameState !== 'Deleting') {
          if (gameData.createdAt) {
            let dateObj = gameData.createdAt.toDate()
            let timeCreated = dateObj.getTime() / 1000
            let currentTime = Math.floor(new Date().getTime() / 1000)
            if (currentTime - timeCreated <= 300) {
              gameList.push({
                id: doc.id,
                data: doc.data(),
              })
            }
          }
        }
      })
      setGames(gameList)
      // console.log(gameList)
    })
    return unsubscribe
  }, [])

  async function handleJoin(id) {
    const docRef = doc(db, 'Games', id)
    const newData = { opponentName: userName }
    try {
      const update = await updateDoc(docRef, newData)
      navigation.navigate('PVPLobby', { id })
    } catch (error) {
      console.log(error)
    }
  }

  async function handleCodeJoin() {
    const upperCaseCode = code.toUpperCase()
    const gamesRef = collection(db, 'Games')
    const q = query(gamesRef, where('code', '==', upperCaseCode))
    const querySnapshot = await getDocs(q)
    querySnapshot.forEach((doc) => {
      console.log(doc.data())
    })
    if (!querySnapshot.empty) {
      if (querySnapshot.docs[0].data().opponentName != '') {
        alert('Game already full!')
        return
      }
      const id = querySnapshot.docs[0].id
      const docRef = doc(db, 'Games', id)
      const newData = { opponentName: userName }
      try {
        const update = await updateDoc(docRef, newData)
        navigation.navigate('PVPLobby', { id })
      } catch (error) {
        console.log(error)
      }
    } else {
      setCode('')
      alert('No games found with that code!')
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.top}>
        <Image
          style={styles.colorImage}
          source={require('./../../assets/ColorFill.png')}
          resizeMode="contain"
        ></Image>
      </View>
      <View style={styles.bottom}>
        <Text style={[{ fontSize: 25, marginBottom: 10, color: colors.text }]}>
          Game List ({games.length} {games.length == 1 ? 'Game' : 'Games'})
        </Text>
        <FlatList
          style={[styles.gameList, { backgroundColor: colors.tableRow }]}
          data={games}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.gameItem, { backgroundColor: colors.game }]}>
              <Text style={[{ fontSize: 20, marginBottom: 10, color: colors.text }]}>
                Game Status: {item.data.gameState}
              </Text>
              <Text style={[{ fontSize: 15, color: colors.text }]}>
                Board Size: {item.data.size}
              </Text>
              <Text style={[{ fontSize: 15, color: colors.text }]}>
                Board Type: {item.data.boardType}
              </Text>
              <Text style={[{ fontSize: 15, color: colors.text }]}>
                Players: {item.data.opponentName == '' ? '(1/2)' : '(2/2)'}
              </Text>
              <Text style={[{ fontSize: 15, color: colors.text }]}>
                {item.data.ownerName}
              </Text>
              <Text style={[{ fontSize: 15, color: colors.text }]}>
                {item.data.opponentName == ''
                  ? 'Waiting on Player...'
                  : item.data.opponentName}
              </Text>
              {item.data.opponentName == '' && (
                <Pressable
                  style={styles.buttonSmall}
                  onPress={() => handleJoin(item.id)}
                >
                  <Text style={styles.buttonText}>Join Game</Text>
                </Pressable>
              )}
              {/* <Pressable style={styles.buttonSmall} onPress={() => handleJoin(item.id)}>
                <Text style={styles.buttonText}>Join Game</Text>
              </Pressable> */}
            </View>
          )}
        />
        <View style={styles.codeView}>
          <Text style={{ fontSize: 20, color: colors.text }}>Code:</Text>
          <TextInput
            style={[
              styles.codeInput,
              { fontSize: 20, backgroundColor: colors.tableRow, color: colors.text },
            ]}
            onChangeText={(e) => setCode(e)}
            maxLength={6}
            autoCapitalize="characters"
            value={code}
          ></TextInput>
        </View>

        <View style={styles.buttonOptions}>
          <Pressable
            style={[styles.button, code.length < 6 && { opacity: 0.25 }]}
            onPress={() => code.length == 6 && handleCodeJoin()}
          >
            <Text style={[styles.buttonText]}>Join</Text>
          </Pressable>
          <Pressable
            style={styles.button}
            onPress={() => navigation.navigate('PVPCreate')}
          >
            <Text style={styles.buttonText}>Create</Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

export default PVPMenu

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  top: {
    height: '30%',
  },
  colorImage: {
    maxWidth: '100%',
    height: '100%',
  },
  bottom: {
    height: '70%',
    // justifyContent: 'center',
    alignItems: 'center',
  },
  gameList: {
    width: '90%',
    margin: 'auto',
    borderWidth: 1,
  },
  gameItem: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'lightblue',
    marginTop: 20,
    marginBottom: 20,
  },
  codeView: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  codeInput: {
    minWidth: 200,
    padding: 10,
    borderWidth: 1,
    marginTop: 20,
    marginBottom: 20,
  },
  buttonOptions: {
    flexDirection: 'row',
    gap: 10,
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
  buttonSmall: {
    padding: 10,
    fontSize: 5,
    borderRadius: 50,
    width: 100,
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
