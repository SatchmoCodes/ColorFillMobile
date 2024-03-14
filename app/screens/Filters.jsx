import {
  Pressable,
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
} from 'react-native'
import React, { useMemo, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import RadioGroup from 'react-native-radio-buttons-group'
import { useColorSchemeContext } from '../../App'
import { squareColors } from './colors.js'
import { FIRESTORE_DB, FIREBASE_AUTH } from '../../firebaseConfig.js'
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
  deleteDoc,
} from 'firebase/firestore'
import { useNavigation, CommonActions } from '@react-navigation/core'

const db = FIRESTORE_DB
const auth = FIREBASE_AUTH

const Filters = () => {
  const { userColorScheme, useColors, toggleColorScheme } = useColorSchemeContext()

  const [uid, setUid] = useState(null)
  const [userName, setUserName] = useState(null)

  const [showSettings, setShowSettings] = useState('openGames')

  const [showSettingsVisible, setShowSettingsVisible] = useState(false)

  useEffect(() => {
    const intitialLoad = async () => {
      let gamesShown = await getGamesShown()
      gamesShown != null && setShowSettings(gamesShown)
    }
    intitialLoad()
  }, [])

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      // The user object will be null if not logged in or a user object if logged in
      if (user) {
        setUid(user.uid)
      }
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
        setUserName(doc.data().username)
      })
    }
    getUserData()
  }, [uid])

  const colors = useColors()

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

  const setGamesShown = async (value) => {
    try {
      await AsyncStorage.setItem('gamesShown', value)
    } catch (e) {
      console.log(e)
    }
  }

  const gamesShown = useMemo(() => [
    {
      id: 'openGames',
      label: 'Open Games',
      value: 'openGames',
    },
    {
      id: 'allGames',
      label: 'All Games',
      value: 'allGames',
    },
  ])

  function handleGamesShown(e) {
    setShowSettings(e)
    setGamesShown(e)
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Modal animationType="fade" transparent={true} visible={showSettingsVisible}>
        <View style={[styles.centeredView]}>
          <View style={[styles.modalView, { backgroundColor: colors.button }]}>
            <Text
              style={[
                styles.modalText,
                { fontSize: 25, fontWeight: 'bold', color: colors.text },
              ]}
            >
              Game Status Options
            </Text>
            <Text style={[styles.modalText, { color: colors.text }]}>
              Open Games: Only games that require another player will be shown.
            </Text>
            <Text style={[styles.modalText, { color: colors.text }]}>
              All Games: Games in progress will be shown. You can specate and see
              scores of games.
            </Text>
            <TouchableOpacity
              style={[styles.modalButton]}
              onPress={() => setShowSettingsVisible(false)}
            >
              <Text style={[styles.textStyle]}>Ok</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          marginTop: 10,
          gap: 5,
        }}
      >
        <Text style={{ fontSize: 25, color: colors.text }}>Game Status</Text>
        <TouchableOpacity
          style={[styles.tooltip, { marginTop: 3, backgroundColor: colors.button }]}
          onPress={() => setShowSettingsVisible(true)}
        >
          <Text style={[styles.tooltipText, { color: colors.text }]}>?</Text>
        </TouchableOpacity>
      </View>

      <RadioGroup
        radioButtons={gamesShown.map((option) => ({
          ...option,
          labelStyle: { fontSize: 20, color: colors.text },
          borderColor: option.id === showSettings && colors.radioSelected,
        }))}
        onPress={(e) => handleGamesShown(e)}
        selectedId={showSettings}
        layout="row"
      />
    </View>
  )
}

export default Filters

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  tooltip: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 50,
    width: 25,
    height: 25,
  },
  tooltipText: {
    textAlign: 'center',
    fontSize: 15,
  },
  //modal garbage
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonOpen: {
    backgroundColor: '#F194FF',
  },
  buttonClose: {
    backgroundColor: '#2196F3',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: 'bold',
    textShadowColor: 'black',
    textShadowRadius: 1,
    textShadowOffset: {
      width: 1,
      height: 1,
    },
  },
  modalButton: {
    borderRadius: 20,
    padding: 15,
    elevation: 2,
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    borderColor: 'white',
    borderWidth: 1,
    backgroundColor: '#2196F3',
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 20,
  },
})
