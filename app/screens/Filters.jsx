import { Pressable, StyleSheet, Text, View, Modal } from 'react-native'
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

  useEffect(() => {
    const intitialLoad = async () => {
      let gamesShown = await getGamesShown()
      console.log('gamesShown', gamesShown)
      gamesShown != null && setShowSettings(gamesShown)
    }
    intitialLoad()
  }, [])

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      // The user object will be null if not logged in or a user object if logged in
      if (user) {
        setUid(user.uid)
        console.log('uid ', user.uid)
      }
    })

    // Clean up the subscription when the component unmounts
    return unsubscribe
  }, [])

  useEffect(() => {
    const getUserData = async () => {
      console.log('uid here', uid)
      const q = query(collection(db, 'Users'), where('uid', '==', uid))
      const querySnapshot = await getDocs(q)
      if (querySnapshot.empty) {
        console.log('tests')
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
      <Text style={{ fontSize: 25, marginTop: 10, color: colors.text }}>
        Game Status
      </Text>
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
})
