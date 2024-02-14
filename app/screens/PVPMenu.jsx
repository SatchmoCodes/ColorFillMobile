import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  Platform,
  ActivityIndicator,
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
import AsyncStorage from '@react-native-async-storage/async-storage'
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
  const [showSettings, setShowSettings] = useState()

  const [uid, setUid] = useState(null)
  const [userName, setUserName] = useState(null)

  async function initialLoad() {
    let gamesShown = await getGamesShown()
    console.log('gamesShown', gamesShown)
    if (gamesShown != null) {
      switch (gamesShown) {
        case 'openGames':
          gamesShown = 'Waiting'
          break
        case 'allGames':
          gamesShown = 'Playing'
          break
      }
      setShowSettings(gamesShown)
    } else {
      setShowSettings('Waiting')
    }
  }

  useEffect(() => {
    initialLoad()
  }, [])

  const getGamesShown = async () => {
    try {
      const value = await AsyncStorage.getItem('gamesShown')
      if (value !== null) {
        return value.toString()
      }
    } catch (e) {
      console.log(e)
    }
  }

  const reloadData = async () => {
    const docRef = collection(db, 'Games')
    const querySnapshot = await getDocs(docRef)
    const gameList = []
    if (!querySnapshot.empty) {
      querySnapshot.forEach((doc, index) => {
        const gameData = doc.data()
        if (
          gameData.gameState !== 'Playing' &&
          gameData.gameState !== 'Deleting' &&
          gameData.lobbyType !== 'Private'
        ) {
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
      // reloadData()
      initialLoad()
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
    let q
    const fiveMinutesAgo = new Date()
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5)
    if (showSettings === 'Playing') {
      q = query(
        collection(db, 'Games'),
        where('lobbyType', '==', 'Public'),
        where('gameState', 'in', ['Waiting', 'Playing', 'Finished']),
        where('createdAt', '>=', fiveMinutesAgo),
        orderBy('createdAt', 'asc'),
      )
    } else {
      q = query(
        collection(db, 'Games'),
        where('lobbyType', '==', 'Public'),
        where('gameState', '==', 'Waiting'),
        where('createdAt', '>=', fiveMinutesAgo),
        orderBy('createdAt', 'asc'),
      )
    }
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const gameList = []
      querySnapshot.forEach((doc, index) => {
        console.log(doc)
        const gameData = doc.data()
        if (gameData.gameState !== 'Deleting') {
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
      console.log(gameList)
      setGames(gameList)
      // console.log(gameList)
    })
    return unsubscribe
  }, [showSettings])

  async function handleJoin(id) {
    const docRef = doc(db, 'Games', id)
    const docSnap = await getDoc(docRef)
    const newData = {
      opponentName: userName,
      opponentUid: uid,
    }
    try {
      if (docSnap.exists()) {
        if (docSnap.data().ownerName != userName) {
          const update = await updateDoc(docRef, newData)
        }
      }
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
      const newData = {
        opponentName: userName,
        opponentUid: uid,
      }
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

  function handleSpectate(id, boardSize) {
    switch (boardSize) {
      case 'Small':
        boardSize = 11
        break
      case 'Medium':
        boardSize = 15
        break
      case 'Large':
        boardSize = 19
        break
    }
    navigation.navigate('PVPGame', { id, boardSize })
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
        <TouchableOpacity
          style={styles.buttonSmall}
          onPress={() => navigation.navigate('Filters')}
        >
          <Text style={styles.buttonText}>Filters</Text>
        </TouchableOpacity>
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
                Fog of War: {item.data.fog === true ? 'On' : 'Off'}
              </Text>
              <Text style={[{ fontSize: 15, color: colors.text }]}>
                Players: {item.data.opponentName == '' ? '(1/2)' : '(2/2)'}
              </Text>
              <View style={{ flexDirection: 'row' }}>
                <Text style={[{ fontSize: 15, color: colors.text }]}>
                  {item.data.ownerName}
                </Text>
                <Text style={{ color: colors.text }}>
                  {(item.data.gameState === 'Playing' ||
                    item.data.gameState === 'Finished') &&
                    ` - ${item.data.ownerScore}`}
                </Text>
              </View>

              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                }}
              >
                <Text style={[{ fontSize: 15, color: colors.text }]}>
                  {item.data.opponentName == ''
                    ? 'Waiting on Player...'
                    : item.data.opponentName}
                </Text>
                <Text style={{ color: colors.text }}>
                  {(item.data.gameState === 'Playing' ||
                    item.data.gameState === 'Finished') &&
                    ` - ${item.data.opponentScore}`}
                </Text>
                {item.data.opponentName === '' && (
                  <ActivityIndicator color="darkgreen"></ActivityIndicator>
                )}
              </View>
              {item.data.gameState !== 'Finished' && (
                <TouchableOpacity
                  style={styles.buttonSmall}
                  onPress={() =>
                    item.data.gameState === 'Waiting'
                      ? item.data.opponentName == '' && handleJoin(item.id)
                      : handleSpectate(item.id, item.data.size)
                  }
                >
                  <Text style={styles.buttonText}>
                    {userName === item.data.ownerName ||
                    userName === item.data.opponentName
                      ? 'Rejoin'
                      : item.data.gameState === 'Waiting'
                        ? 'Join Game'
                        : 'Spectate'}
                  </Text>
                </TouchableOpacity>
              )}
              {/* <TouchableOpacity style={styles.buttonSmall} onPress={() => handleJoin(item.id)}>
                <Text style={styles.buttonText}>Join Game</Text>
              </TouchableOpacity> */}
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
          <TouchableOpacity
            style={[styles.button, code.length < 6 && { opacity: 0.25 }]}
            onPress={() => code.length == 6 && handleCodeJoin()}
          >
            <Text style={[styles.buttonText]}>Join</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('PVPCreate')}
          >
            <Text style={styles.buttonText}>Create</Text>
          </TouchableOpacity>
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
    height: '20%',
  },
  colorImage: {
    maxWidth: '100%',
    height: '100%',
  },
  bottom: {
    height: '80%',
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
