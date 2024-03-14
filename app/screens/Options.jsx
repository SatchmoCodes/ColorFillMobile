import {
  Pressable,
  StyleSheet,
  Text,
  View,
  Modal,
  FlatList,
  ScrollView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
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
  limit,
} from 'firebase/firestore'
import { useNavigation, CommonActions } from '@react-navigation/core'
import { useIsFocused } from '@react-navigation/native'

let unlockedColorsArr = [
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  false,
]

const requirementsArray = [
  'Complete 10 boards to unlock this color scheme',
  'Complete 50 boards to unlock this color scheme',
  'Complete 100 boards to unlock this color scheme',
  'Score an 9 or lower on a Small board to unlock this color scheme',
  'Score a 13 or lower on a Medium board to unlock this color scheme',
  'Score a 17 or lower on a Large Board to unlock this color scheme',
  'Play 10 PVP Games to unlock this color scheme',
  'Play 20 PVP Games to unlock this color scheme',
  'Play 30 PVP Games to unlock this color scheme',
]

let progressArr

const db = FIRESTORE_DB
const auth = FIREBASE_AUTH

const Options = () => {
  const navigation = useNavigation()
  const isFocused = useIsFocused()
  const { userColorScheme, useColors, toggleColorScheme } = useColorSchemeContext()
  const colors = useColors()

  const [uid, setUid] = useState(null)
  const [userName, setUserName] = useState(null)

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

  useEffect(() => {
    if (isFocused && uid) {
      unlockedColorsArr = [
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
      ]
      // unlockedColorsArr = new Array(squareColors.length).fill(true)
      achievementCheck()
    }
  }, [isFocused, uid])

  const getSize = async () => {
    try {
      const value = await AsyncStorage.getItem('size')
      if (value !== null) {
        return value.toString()
      }
    } catch (e) {
      // error reading value
      console.log(e)
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
      console.log(e)
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
  const [colorModalVisible, setColorModalVisible] = useState(false)
  const [colorModalText, setColorModalText] = useState('')
  const [progressText, setProgressText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const [totalBoardsCompleted, setTotalBoardsCompleted] = useState(0)
  const [pvpWinRate, setPVPWinRate] = useState('n/a')
  const [pvpGames, setPVPGames] = useState(0)
  const [pvpLosses, setPVPLosses] = useState(0)
  const [pvpBestWinStreak, setPVPBestWinStreak] = useState(0)
  const [pvpCurrentWinStreak, setPVPCurrentWinStreak] = useState(0)
  const [bestSmallScore, setBestSmallScore] = useState('n/a')
  const [bestMediumScore, setBestMediumScore] = useState('n/a')
  const [bestLargeScore, setBestLargeScore] = useState('n/a')
  const [bestProgressiveScore, setBestProgressiveScore] = useState('n/a')
  const [checking, setChecking] = useState(true)

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

  function handleTooltip(index) {
    setColorModalText(requirementsArray[index - 9])
    setProgressText(progressArr[index - 9])
    setColorModalVisible(true)
  }

  async function achievementCheck() {
    const userQuery = query(collection(db, 'Users'), where('uid', '==', uid))
    const bestSmall = query(
      collection(db, 'Scores'),
      where('uid', '==', uid),
      where('size', '==', 'Small', orderBy('score', 'asc'), limit(1)),
    )
    const bestMedium = query(
      collection(db, 'Scores'),
      where('uid', '==', uid),
      where('size', '==', 'Medium', orderBy('score', 'asc'), limit(1)),
    )
    const bestLarge = query(
      collection(db, 'Scores'),
      where('uid', '==', uid),
      where('size', '==', 'Large', orderBy('score', 'asc'), limit(1)),
    )
    const bestProgressive = query(
      collection(db, 'Scores'),
      where('gamemode', '==', 'Progressive'),
      where('uid', '==', uid),
      orderBy('score', 'asc'),
      limit(1),
    )
    const userSnapshot = await getDocs(userQuery)
    const smallSnap = await getDocs(bestSmall)
    const mediumSnap = await getDocs(bestMedium)
    const largeSnap = await getDocs(bestLarge)
    const progressiveSnap = await getDocs(bestProgressive)

    if (!userSnapshot.empty) {
      userSnapshot.forEach((doc) => {
        doc.data().boardsCompleted != undefined &&
          setTotalBoardsCompleted(doc.data().boardsCompleted)
        setPVPWinRate(doc.data().winRate)
        setPVPGames(doc.data().totalGames)
        setPVPLosses(doc.data().losses)
        setPVPBestWinStreak(doc.data().bestWinStreak)
        setPVPCurrentWinStreak(doc.data().currentWinStreak)
        if (doc.data().boardsCompleted >= 10) {
          unlockedColorsArr[9] = true
        }
        if (doc.data().boardsCompleted >= 50) {
          unlockedColorsArr[10] = true
        }
        if (doc.data().boardsCompleted >= 100) {
          unlockedColorsArr[11] = true
        }
        if (doc.data().totalGames >= 10) {
          unlockedColorsArr[15] = true
        }
        if (doc.data().totalGames >= 20) {
          unlockedColorsArr[16] = true
        }
        if (doc.data().totalGames >= 30) {
          unlockedColorsArr[17] = true
        }
      })
      if (!smallSnap.empty) {
        smallSnap.forEach((doc) => {
          setBestSmallScore(doc.data().score)
          if (doc.data().score <= 9 && doc.data().createdBy != null) {
            unlockedColorsArr[12] = true
          }
        })
      }
      if (!mediumSnap.empty) {
        mediumSnap.forEach((doc) => {
          setBestMediumScore(doc.data().score)
          if (doc.data().score <= 13 && doc.data().createdBy != null) {
            unlockedColorsArr[13] = true
          }
        })
      }
      if (!largeSnap.empty) {
        largeSnap.forEach((doc) => {
          setBestLargeScore(doc.data().score)
          if (doc.data().score <= 17 && doc.data().createdBy != null) {
            unlockedColorsArr[14] = true
          }
        })
      }
      if (!progressiveSnap.empty) {
        progressiveSnap.forEach((doc) => {
          setBestProgressiveScore(doc.data().score)
        })
      }
    }
    // unlockedColorsArr = new Array(squareColors.length).fill(true)
    setChecking(false)
  }

  useEffect(() => {
    if (!checking) {
      progressArr = [
        `Progress: ${totalBoardsCompleted} / 10`,
        `Progress: ${totalBoardsCompleted} / 50`,
        `Progress: ${totalBoardsCompleted} / 100`,
        `Best Small Score: ${bestSmallScore}`,
        `Best Medium Score: ${bestMediumScore}`,
        `Best Large Score: ${bestLargeScore}`,
        `Current Games: ${pvpGames} / 10`,
        `Current Games: ${pvpGames} / 20`,
        `Current Games: ${pvpGames} / 30`,
      ]
    }
  }, [checking])

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ alignItems: 'center' }}>
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
                  <Text style={[styles.buttonText, { color: 'white' }]}>
                    CONFIRM
                  </Text>
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
        <Modal animationType="fade" transparent={true} visible={colorModalVisible}>
          <View style={styles.centeredView}>
            <View style={[styles.modalView, { backgroundColor: colors.button }]}>
              {userName ? (
                <>
                  <Text style={[styles.modalText, { color: colors.text }]}>
                    {colorModalText}
                  </Text>
                  <Text style={[styles.modalText, { color: colors.text }]}>
                    {progressText}
                  </Text>
                </>
              ) : (
                <Text style={[styles.modalText, { color: colors.text }]}>
                  Create an account to unlock!
                </Text>
              )}

              <TouchableOpacity
                style={[styles.modalButton]}
                onPress={() => setColorModalVisible(false)}
              >
                <Text style={[styles.textStyle]}>Ok</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <Text
          style={{
            fontSize: 30,
            marginBottom: 20,
            marginTop: 20,
            color: colors.text,
          }}
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
          style={{
            fontSize: 30,
            marginTop: 20,
            marginBottom: 20,
            color: colors.text,
          }}
        >
          Selected Color
        </Text>
        <View
          style={[styles.inner, { transform: 'rotateX(180deg)', marginBottom: 10 }]}
        >
          {squareColors[selectedColor].map((color, index) => (
            <View
              key={index}
              style={[
                index > 4 ? styles.hide : styles.square,
                { backgroundColor: color },
              ]}
            ></View>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 5 }}>
          {squareColors[selectedColor].map((color, index) => (
            <View
              key={index}
              style={[
                index > 4 ? styles.square : styles.hide,
                { backgroundColor: color },
              ]}
            ></View>
          ))}
        </View>
        <Text
          style={{
            fontSize: 30,
            marginTop: 20,
            marginBottom: 20,
            color: colors.text,
          }}
        >
          Color Options
        </Text>

        <>
          {Platform.OS !== 'web' ? (
            <ScrollView style={{}} horizontal>
              {squareColors.map((row, rowIndex) => (
                <>
                  {checking && rowIndex > 8 ? (
                    <View
                      style={{
                        justifyContent: 'center',
                        width: 90,
                        marginLeft: 10,
                        marginRight: 10,
                        padding: 10,
                      }}
                    >
                      <ActivityIndicator
                        size="large"
                        color="darkgreen"
                      ></ActivityIndicator>
                    </View>
                  ) : (
                    <>
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
                          unlockedColorsArr[rowIndex]
                            ? setColor(`${rowIndex}`)
                            : handleTooltip(rowIndex)
                        }}
                      >
                        <View style={styles.inner}>
                          {!unlockedColorsArr[rowIndex] && (
                            <View
                              style={{
                                position: 'absolute',
                                top: 10,
                                zIndex: 2,
                                transform: 'rotateX(180deg)',
                              }}
                            >
                              <Text style={{ fontSize: 20, color: 'white' }}>?</Text>
                            </View>
                          )}
                          {row.map((color, colIndex) => (
                            <View
                              key={colIndex}
                              style={[
                                colIndex > 4 ? styles.hide : styles.square,
                                {
                                  backgroundColor:
                                    unlockedColorsArr[rowIndex] === false
                                      ? 'black'
                                      : color,
                                },
                              ]}
                            ></View>
                          ))}
                        </View>
                      </Pressable>
                    </>
                  )}
                </>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.colorContainer}>
              {squareColors.map((row, rowIndex) => (
                <>
                  {checking && rowIndex > 8 ? (
                    <View
                      style={{
                        justifyContent: 'center',
                        width: 90,
                        marginLeft: 10,
                        marginRight: 10,
                        padding: 10,
                      }}
                    >
                      <ActivityIndicator
                        size="large"
                        color="darkgreen"
                      ></ActivityIndicator>
                    </View>
                  ) : (
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
                        unlockedColorsArr[rowIndex]
                          ? setColor(`${rowIndex}`)
                          : handleTooltip(rowIndex)
                      }}
                    >
                      <View style={styles.inner}>
                        {!unlockedColorsArr[rowIndex] && (
                          <View
                            style={{
                              position: 'absolute',
                              top: 10,
                              zIndex: 2,
                              transform: 'rotateX(180deg)',
                            }}
                          >
                            <Text style={{ fontSize: 20, color: 'white' }}>?</Text>
                          </View>
                        )}
                        {row.map((color, colIndex) => (
                          <View
                            key={colIndex}
                            style={[
                              colIndex > 4 ? styles.hide : styles.square,
                              {
                                backgroundColor:
                                  unlockedColorsArr[rowIndex] === false
                                    ? 'black'
                                    : color,
                              },
                            ]}
                          ></View>
                        ))}
                      </View>
                    </Pressable>
                  )}
                </>
              ))}
            </View>
          )}
        </>

        <View style={styles.colorMode}>
          <Text
            style={{
              fontSize: 30,
              marginBottom: 20,
              marginTop: 20,
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
        </View>
        <View>
          <Text
            style={{
              fontSize: 30,
              marginBottom: 20,
              marginTop: 20,
              textAlign: 'center',
              color: colors.text,
            }}
          >
            Personal Stats
          </Text>
          {checking ? (
            <ActivityIndicator size="large" color="darkgreen"></ActivityIndicator>
          ) : (
            <>
              <Text
                style={{
                  fontSize: 20,
                  marginBottom: 5,
                  textAlign: 'center',
                  color: colors.text,
                }}
              >
                Boards Played: {totalBoardsCompleted}
              </Text>
              <Text
                style={{
                  fontSize: 20,
                  marginBottom: 5,
                  textAlign: 'center',
                  color: colors.text,
                }}
              >
                Best Small Score: {bestSmallScore}
              </Text>
              <Text
                style={{
                  fontSize: 20,
                  marginBottom: 5,
                  textAlign: 'center',
                  color: colors.text,
                }}
              >
                Best Medium Score: {bestMediumScore}
              </Text>
              <Text
                style={{
                  fontSize: 20,
                  marginBottom: 5,
                  textAlign: 'center',
                  color: colors.text,
                }}
              >
                Best Large Score: {bestLargeScore}
              </Text>
              <Text
                style={{
                  fontSize: 20,
                  marginBottom: 5,
                  textAlign: 'center',
                  color: colors.text,
                }}
              >
                Best Progressive Score: {bestProgressiveScore}
              </Text>
              <Text
                style={{
                  fontSize: 20,
                  marginBottom: 5,
                  textAlign: 'center',
                  color: colors.text,
                }}
              >
                PVP Win Rate: {pvpWinRate != 'n/a' ? `${pvpWinRate}%` : pvpWinRate}
              </Text>
              <Text
                style={{
                  fontSize: 20,
                  marginBottom: 5,
                  textAlign: 'center',
                  color: colors.text,
                }}
              >
                PVP Wins: {pvpGames}
              </Text>
              <Text
                style={{
                  fontSize: 20,
                  marginBottom: 5,
                  textAlign: 'center',
                  color: colors.text,
                }}
              >
                PVP Losses: {pvpLosses}
              </Text>
              <Text
                style={{
                  fontSize: 20,
                  marginBottom: 5,
                  textAlign: 'center',
                  color: colors.text,
                }}
              >
                Best Win Streak: {pvpBestWinStreak}
              </Text>
              <Text
                style={{
                  fontSize: 20,
                  marginBottom: 5,
                  textAlign: 'center',
                  color: colors.text,
                }}
              >
                Current Win Streak: {pvpCurrentWinStreak}
              </Text>
            </>
          )}
        </View>
        <Pressable
          style={[
            styles.button,
            { marginTop: 20, marginBottom: 20, backgroundColor: 'red' },
          ]}
          onPress={() => showDelete()}
        >
          <Text style={[styles.buttonText, { color: 'white' }]}>Delete Account</Text>
        </Pressable>
      </ScrollView>
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
    // alignItems: 'center',
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
  hide: {
    display: 'none',
  },
})
