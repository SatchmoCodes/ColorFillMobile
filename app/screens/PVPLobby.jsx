import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { useRoute } from '@react-navigation/native'
import {
  query,
  collection,
  doc,
  getDoc,
  addDoc,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  updateDoc,
} from 'firebase/firestore'
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../firebaseConfig'
import { useNavigation, useIsFocused, StackActions } from '@react-navigation/native'
import { useColorSchemeContext } from '../../App'

let docId
let gameLoaded = false

const PVPLobby = () => {
  const { useColors } = useColorSchemeContext()
  const colors = useColors()

  const navigation = useNavigation()
  const isFocused = useIsFocused()
  const route = useRoute()
  const auth = FIREBASE_AUTH
  const db = FIRESTORE_DB

  const [uid, setUid] = useState(null)
  const [userName, setUserName] = useState(null)
  const [gameInfo, setGameInfo] = useState(null)

  const userNameRef = useRef(null)

  useEffect(() => {
    if (isFocused) {
      gameLoaded = false
    }
  }, [isFocused])

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      !gameLoaded && handleLeave()
    })
    return unsubscribe
  }, [navigation])

  async function handleLeave() {
    const docRef = doc(db, 'Games', docId)
    const docSnap = await getDoc(docRef)
    if (docSnap.data().gameState != 'Playing') {
      if (userNameRef.current == docSnap.data().ownerName) {
        console.log('owner left, deleting lobby')
        try {
          const update = await updateDoc(docRef, {
            gameState: 'Deleting',
          })
        } catch (error) {
          alert(error)
        }
        // navigation.pop()
      } else if (userNameRef.current == docSnap.data().opponentName) {
        console.log('opponent left, reopening lobby')
        try {
          const update = await updateDoc(docRef, {
            opponentName: '',
            opponentUid: '',
          })
        } catch (error) {
          console.log(error)
        }
      }
      userNameRef.current = null
    }
  }

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      // The user object will be null if not logged in or a user object if logged in
      setUid(user.uid)
    })

    // Clean up the subscription when the component unmounts
    return unsubscribe
  }, [])

  useEffect(() => {
    const getUserData = async () => {
      const q = query(collection(db, 'Users'), where('uid', '==', uid))
      const querySnapshot = await getDocs(q)
      if (querySnapshot.empty) {
      }
      querySnapshot.forEach((doc) => {
        userNameRef.current = doc.data().username
        setUserName(doc.data().username)
      })
    }
    getUserData()
  }, [uid])

  useEffect(() => {
    if (route) {
      docId = route.params?.id
    }
  }, [route])

  useEffect(() => {
    const docRef = doc(db, 'Games', docId)

    const unsubscribe = onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        let id = doc.id
        let boardSize
        switch (doc.data().size) {
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
        setGameInfo(doc.data())
        if (doc.data().gameState == 'Playing') {
          gameLoaded = true
          navigation.navigate('PVPGame', { id, boardSize })
        }
        if (
          doc.data().gameState == 'Deleting' &&
          userNameRef.current != doc.data().ownerName
        ) {
          // alert('host left the lobby')
          navigation.navigate('PVPMenu')
        }
      }
    })
    return unsubscribe
  }, [])

  async function startGame() {
    const docRef = doc(db, 'Games', docId)
    const newData = { gameState: 'Playing' }
    try {
      const update = await updateDoc(docRef, newData)
    } catch (error) {
      console.log(error)
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
        <Text style={{ fontSize: 30, marginBottom: 20, color: colors.text }}>
          Game Info
        </Text>
        <Text style={{ fontSize: 20, marginBottom: 10, color: colors.text }}>
          Board Size: {gameInfo != null && gameInfo.size}
        </Text>
        <Text style={{ fontSize: 20, marginBottom: 10, color: colors.text }}>
          Board Type: {gameInfo != null && gameInfo.boardType}
        </Text>
        <Text style={{ fontSize: 20, marginBottom: 10, color: colors.text }}>
          Fog of War: {gameInfo != null && gameInfo.fog === true ? 'On' : 'Off'}
        </Text>
        <Text
          style={{
            fontSize: 20,
            marginBottom: 10,
            marginTop: 10,
            color: colors.text,
          }}
        >
          Players
        </Text>
        <View style={[styles.players, { backgroundColor: colors.tableRow }]}>
          <View
            style={{ justifyContent: 'center', alignItems: 'center', width: '45%' }}
          >
            <Text
              style={{
                fontSize: 20,
                flexGrow: 1,
                textAlign: 'center',
                color: colors.text,
              }}
            >
              {gameInfo != null && gameInfo.ownerName}
            </Text>
          </View>
          <View
            style={{ justifyContent: 'center', alignItems: 'center', width: '10%' }}
          >
            <Text style={{ color: 'red' }}>VS</Text>
          </View>
          <View
            style={{ justifyContent: 'center', alignItems: 'center', width: '45%' }}
          >
            {gameInfo != null && gameInfo.opponentName == '' ? (
              <ActivityIndicator color="darkgreen"></ActivityIndicator>
            ) : (
              <Text
                style={{
                  fontSize: 20,
                  textAlign: 'center',
                  justifyContent: 'center',
                  color: colors.text,
                }}
              >
                {gameInfo != null && gameInfo.opponentName}
              </Text>
            )}
          </View>
        </View>
        <Text style={{ fontSize: 20, color: colors.text }}>
          Code: {gameInfo != null && gameInfo.code}
        </Text>
        {gameInfo != null && userName == gameInfo.ownerName && (
          <TouchableOpacity
            style={[styles.button, { opacity: gameInfo.opponentName == '' && 0.25 }]}
            onPress={() => gameInfo.opponentName != '' && startGame()}
          >
            <Text style={styles.buttonText}>Start Game</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

export default PVPLobby

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
  players: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: 20,
    borderWidth: 1,
    paddingTop: 10,
    paddingBottom: 10,
    minWidth: 300,
    width: '95%',
    maxWidth: 400,
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
    fontSize: 20,
    fontWeight: 'bold',
    textShadowColor: 'black',
    textShadowRadius: 1,
    textShadowOffset: {
      width: 1,
      height: 1,
    },
  },
})
