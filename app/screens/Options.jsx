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

const colorArr = [
  [
    'hsl(0, 100%, 40%)',
    'hsl(22, 100%, 50%)',
    'hsl(60, 100%, 50%)',
    'hsl(130, 100%, 15%)',
    'hsl(242, 69%, 49%)',
  ],
  [
    'hsl(33, 90.8%, 12.7%)',
    'hsl(33, 89.8%, 26.9%)',
    'hsl(25, 95.4%, 42.7%)',
    'hsl(221, 69.2%, 43.3%)',
    'hsl(213, 68.6%, 90%)',
  ],
]

const db = FIRESTORE_DB
const auth = FIREBASE_AUTH

const Options = () => {
  const navigation = useNavigation()
  const { userColorScheme, useColors, toggleColorScheme } = useColorSchemeContext()

  const [uid, setUid] = useState(null)
  const [userName, setUserName] = useState(null)

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
  console.log(colors)

  const getSize = async () => {
    try {
      const value = await AsyncStorage.getItem('size')
      if (value !== null) {
        console.log(value)
        return value.toString()
      }
    } catch (e) {
      // error reading value
      console.log('nasdf')
    }
  }

  const getColor = async () => {
    try {
      const value = await AsyncStorage.getItem('color')
      if (value !== null) {
        return value.toString()
      }
    } catch (e) {
      // error reading value
      console.log('nasdf')
    }
  }

  async function initialLoad() {
    let boardSize = await getSize()
    let color = await getColor()
    boardSize != null && setSelectedId(boardSize)
    color != null && setSelectedColor(color)
  }

  useEffect(() => {
    initialLoad()
  }, [])

  const radioButtons = useMemo(
    () => [
      {
        id: '1', // acts as primary key, should be unique and non-empty string
        label: 'Small',
        value: '8',
      },
      {
        id: '2',
        label: 'Medium',
        value: '12',
      },
      {
        id: '3',
        label: 'Large',
        value: '16',
      },
    ],
    [],
  )

  const [selectedId, setSelectedId] = useState('2')
  const [selectedColor, setSelectedColor] = useState('0')
  const [modalVisible, setModalVisible] = useState(false)
  const [deleting, setDeleting] = useState(false)

  function setSize(e) {
    setSelectedId(e)
    storeSize(e)
  }

  function setColor(e) {
    setSelectedColor(e)
    storeColor(e)
  }

  const storeSize = async (value) => {
    try {
      await AsyncStorage.setItem('size', value)
    } catch (e) {
      // saving error
    }
  }

  const storeColor = async (value) => {
    try {
      await AsyncStorage.setItem('color', value)
    } catch (e) {
      // saving error
    }
  }

  function showDelete() {
    setModalVisible(true)
  }

  async function handleDelete() {
    setDeleting(true)
    const q = query(collection(db, 'Users'), where('uid', '==', uid))
    const querySnapshot = await getDocs(q)
    const user = auth.currentUser
    console.log('user', user)
    if (!querySnapshot.empty) {
      const userDocRef = querySnapshot.docs[0].ref
      const scoreQuery = query(
        collection(db, 'Scores'),
        where('createdBy', '==', userName),
      )
      const scoreSnapshot = await getDocs(scoreQuery)

      try {
        // Delete all score documents
        await Promise.all(scoreSnapshot.docs.map((doc) => deleteDoc(doc.ref)))
        console.log('Score documents deleted successfully')

        // Delete user document
        await deleteDoc(userDocRef)
        console.log('User document deleted successfully')

        // Delete user account
        await user.delete()
        console.log('User account deleted successfully')
      } catch (error) {
        console.error('Error deleting documents:', error)
      } finally {
        // Redirect after deletion is complete
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          }),
        )
      }
    } else {
      console.log('User not found')
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Modal animationType="fade" transparent={true} visible={modalVisible}>
        <View style={styles.centeredView}>
          <View style={[styles.modalView, { backgroundColor: colors.button }]}>
            <Text style={[styles.modalText, { color: colors.text }]}>
              Are you sure you want to delete your account?
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                style={[styles.button, { backgroundColor: 'green' }]}
                onPress={() => handleDelete()}
              >
                <Text style={[styles.buttonText, { color: 'white' }]}>CONFIRM</Text>
              </Pressable>
              <Pressable
                style={[styles.button, { backgroundColor: 'red' }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.buttonText, { color: 'white' }]}>CANCEL</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <Text
        style={{ fontSize: 30, marginBottom: 20, marginTop: 20, color: colors.text }}
      >
        Board Size
      </Text>
      <RadioGroup
        radioButtons={radioButtons.map((option) => ({
          ...option,
          labelStyle: { fontSize: 20, color: colors.text },
          borderColor: option.id === selectedId && colors.radioSelected,
        }))}
        onPress={(e) => setSize(e)}
        selectedId={selectedId}
        layout="row"
      />
      <Text
        style={{ fontSize: 30, marginTop: 20, marginBottom: 20, color: colors.text }}
      >
        Color Options
      </Text>
      <View style={styles.colorContainer}>
        {squareColors.map((row, rowIndex) => (
          <Pressable
            key={rowIndex}
            style={[
              styles.row,
              styles.colorOption,
              { borderWidth: 1 },
              selectedColor === `${rowIndex}`
                ? { borderColor: colors.outline }
                : { borderColor: colors.background },
            ]}
            onPress={() => {
              setColor(`${rowIndex}`)
            }}
          >
            <View style={styles.inner}>
              {row.map((color, colIndex) => (
                <View
                  key={colIndex}
                  style={[
                    colIndex > 4 ? styles.hide : styles.square,
                    { backgroundColor: color },
                  ]}
                ></View>
              ))}
            </View>
          </Pressable>
        ))}
      </View>
      <View style={styles.colorMode}>
        <Text
          style={{
            fontSize: 30,
            marginBottom: 20,
            textAlign: 'center',
            color: colors.text,
          }}
        >
          Theme
        </Text>
        <Pressable
          style={[
            styles.button,
            {
              userSelect: 'none',
              backgroundColor:
                userColorScheme == 'light' ? 'rgb(50,50,50)' : 'white',
            },
          ]}
          onPress={toggleColorScheme}
        >
          <Text
            style={[
              styles.buttonText,
              { color: userColorScheme == 'light' ? 'white' : 'rgb(50,50,50)' },
            ]}
          >
            {userColorScheme == 'light' ? 'Dark' : 'Light'} Mode
          </Text>
        </Pressable>
        <Pressable
          style={[styles.button, { marginTop: 20, backgroundColor: 'red' }]}
          onPress={() => showDelete()}
        >
          <Text style={[styles.buttonText, { color: 'white' }]}>Delete Account</Text>
        </Pressable>
      </View>
    </View>
  )
}

export default Options

const styles = StyleSheet.create({
  poop: {
    backgroundColor: 'blue',
    borderColor: 'white',
  },
  container: {
    flex: 1,
    // justifyContent: 'center',
    alignItems: 'center',
  },
  colorContainer: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  colorOption: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 90,
    alignItems: 'center',
    justifyContent: 'center',
    transform: 'rotateX(180deg)',
    marginLeft: 10,
    marginRight: 10,
    padding: 10,
  },
  inner: {
    maxWidth: 75,
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 75,
    alignItems: 'center',
    justifyContent: 'center',
  },
  square: {
    width: 25,
    height: 25,
    maxWidth: 25,
    maxHeight: 25,
    borderWidth: 1,
  },
  button: {
    borderWidth: 1,
    borderRadius: 50,
    padding: 10,
    maxWidth: 120,
  },
  buttonText: {
    textAlign: 'center',
  },
  //modal stuff
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
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 20,
  },
  hide: {
    display: 'none',
  },
})
