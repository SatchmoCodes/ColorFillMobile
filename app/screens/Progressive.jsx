import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Modal,
  Animated,
  Easing,
  Alert,
  ActivityIndicator,
} from 'react-native'
import React from 'react'
import { useState, useEffect, useRef } from 'react'
import generateBoard from './progGenerator.js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useIsFocused } from '@react-navigation/native'
import { useRoute } from '@react-navigation/native'
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
} from 'firebase/firestore'
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../firebaseConfig.js'
import uuid from 'react-native-uuid'
import { useColorSchemeContext } from '../../App'
import { squareColors } from './colors.js'
// import { AdEventType, InterstitialAd, TestIds } from 'react-native-google-mobile-ads'

let red = 'hsl(0, 100%, 40%)'
let orange = 'hsl(22, 100%, 50%)'
let yellow = 'hsl(60, 100%, 50%)'
let green = 'hsl(130, 100%, 15%)'
let blue = 'hsl(242, 69%, 49%)'

let colors = [red, orange, yellow, green, blue]

const colorArr = squareColors

let boardSize = 5
let screenWidth = Dimensions.get('window').width * 0.98
let screenHeight = Dimensions.get('window').height
let gridItemSize = Math.floor(screenWidth / boardSize)
if (screenWidth >= 750) {
  screenWidth = Dimensions.get('window').height * 0.55
  // console.log(screenWidth)
  gridItemSize = Math.floor(screenWidth / boardSize)
}

//temporary stuff to generate random squares
let randomArr = []

for (let i = 0; i < 1210; i++) {
  randomArr.push(Math.floor(Math.random() * 5))
}

let squares = generateBoard(randomArr)
let hole = 0
let round = 1
let parValue = 10
let roundScore
let totalScoreValue = 0
let tempSquareArr = JSON.parse(JSON.stringify(squares[hole]))
let squareAnimArr = tempSquareArr.map(() => new Animated.Value(0))
let squareCounterArr = [
  {
    id: 0,
    color: colors[0],
    count: 0,
  },
  {
    id: 1,
    color: colors[1],
    count: 0,
  },
  {
    id: 2,
    color: colors[2],
    count: 0,
  },
  {
    id: 3,
    color: colors[3],
    count: 0,
  },
  {
    id: 4,
    color: colors[4],
    count: 0,
  },
]

let hasRun = false
let countNumber = 0
let totalCaptured = 1

let boardId = uuid.v4()
let docId = null
let originalScore //score before challenge/reset

const db = FIRESTORE_DB
const auth = FIREBASE_AUTH

// const interstitial = InterstitialAd.createForAdRequest(TestIds.INTERSTITIAL, {
//   requestNonPersonalizedAdsOnly: true,
// })

const Progressive = () => {
  const { useColors } = useColorSchemeContext()
  const colorTheme = useColors()

  const route = useRoute()

  // const [interstitialLoaded, setInterstitialLoaded] = useState(false)

  // const loadInterstitial = () => {
  //   const unsubscribeLoaded = interstitial.addAdEventListener(
  //     AdEventType.LOADED,
  //     () => {
  //       setInterstitialLoaded(true)
  //     },
  //   )

  //   interstitial.load()

  //   const unsubscribeClosed = interstitial.addAdEventListener(
  //     AdEventType.CLOSED,
  //     () => {
  //       setInterstitialLoaded(false)
  //       interstitial.load()
  //     },
  //   )
  //   return () => {
  //     unsubscribeClosed()
  //     unsubscribeLoaded()
  //   }
  // }

  // useEffect(() => {
  //   const unsubscribe = loadInterstitial()
  //   return unsubscribe
  // }, [])

  const [colorState, setColorState] = useState(tempSquareArr)
  const [selectedColor, setSelectedColor] = useState(tempSquareArr[0].color)
  const [colorOption, setSelectedColorOption] = useState(colors)
  const [counter, setCounter] = useState(0)
  const [highScore, setHighScore] = useState('')
  const [totalScore, setTotalScore] = useState(0)
  const [squareCounter, setSquareCounter] = useState(squareCounterArr)
  const [squareAnim, setSquareAnim] = useState(squareAnimArr)
  const [change, setChange] = useState(false)
  const [complete, setComplete] = useState(false)
  const [scoreToBeat, setScoreToBeat] = useState(null)
  // const [previousScore, setPreviousScore] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)

  const isFocused = useIsFocused()

  const [uid, setUid] = useState(null)
  const [userName, setUserName] = useState(null)

  const [boardLoaded, setBoardLoaded] = useState(false)
  const [loading, setLoading] = useState(false)

  const [block, setBlock] = useState(false)

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
      querySnapshot.forEach((doc) => {
        setUserName(doc.data().username)
      })
    }
    getUserData()
  }, [uid])

  useEffect(() => {
    const getHighScore = async () => {
      const q = query(
        collection(db, 'Scores'),
        where('gamemode', '==', 'Progressive'),
        where('size', '==', 'Default'),
        where('createdBy', '==', userName),
        orderBy('score', 'asc'),
        orderBy('createdAt', 'asc'),
      )
      const querySnapshot = await getDocs(q)
      !querySnapshot.empty
        ? setHighScore(querySnapshot.docs[0].data().score)
        : setHighScore('')
    }
    if (userName) {
      getHighScore()
    }
  }, [userName])

  async function initialLoad() {
    await getColor()
    if (docId != undefined && !boardLoaded) {
      const docRef = doc(db, 'Scores', docId)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        console.log(docSnap.data().score)
        setScoreToBeat(docSnap.data().score)
        // setPreviousScore(docSnap.data().score)
        originalScore = docSnap.data().score
        setBoardLoaded(true)
        randomArr = docSnap.data().boardData.replace(/,/g, '')
        squares = generateBoard(randomArr)
        tempSquareArr = JSON.parse(JSON.stringify(squares[0]))
        boardId = docSnap.data().boardId
        squareAnimArr = tempSquareArr.map(() => new Animated.Value(0))
        resetColors()
        handleReset()
        return
      }
    }
    resetColors()
  }
  //check to see if user returned from options page

  useEffect(() => {
    if (route) {
      docId = route.params?.id
    }
  }, [route])

  useEffect(() => {
    const coolFunction = async () => {
      await initialLoad()
    }
    if (isFocused) {
      coolFunction()
    }
  }, [isFocused])

  useEffect(() => {
    if (!hasRun) {
      tempSquareArr.forEach((sq, index) => {
        if (sq.captured) {
          captureCheck(sq.color, index)
        }
      })
      tempSquareArr.forEach((sq) => {
        squareCounterArr.forEach((counter) => {
          if (sq.color == counter.color && !sq.index == 0) {
            counter.count++
          }
        })
      })
      initialLoad()
      setChange(true)
      hasRun = true
    }
  }, [])

  const getSize = () => {
    // console.log(gridItemSize)
    // console.log(hole)
    gridItemSize = Math.floor(screenWidth / boardSize)
    // console.log(gridItemSize)
  }

  const getColor = async () => {
    try {
      const value = await AsyncStorage.getItem('color')
      if (value !== null) {
        let x = parseInt(value)
        colors = []
        for (let y = 0; y < 5; y++) {
          colors.push(colorArr[x][y])
        }
        // console.log(colors)
        setSelectedColorOption(colors)
      }
    } catch (e) {
      // console.log(e)
    }
  }

  function colorChange(color) {
    countNumber++
    tempSquareArr.forEach((sq, index) => {
      if (sq.captured) {
        captureCheck(color, index)
      }
    })
    setChange(true)
  }

  useEffect(() => {
    if (change) {
      setColorState(tempSquareArr)
      setSquareCounter(squareCounterArr)
      setCounter(countNumber)
      setSelectedColor(tempSquareArr[0].color)
      setSquareAnim(squareAnimArr)
      setSelectedColorOption(colors)
      setTotalScore(totalScoreValue)
      if (totalCaptured == squares[hole].length) {
        setBlock(true)
        if (hole == 9) {
          setLoading(true)
          handleHoleChange()
          handleComplete()
        } else {
          tempSquareArr = JSON.parse(JSON.stringify(squares[hole]))
          // setColorState(tempSquareArr)
          setModalVisible(true)
        }
      }
      setChange(false)
    }
  }, [change])

  function captureCheck(color, index) {
    tempSquareArr[index].color = color
    //right
    if (tempSquareArr[index + 1] && tempSquareArr[index + 1].captured == false) {
      if (
        tempSquareArr[index].color == tempSquareArr[index + 1].color &&
        tempSquareArr[index].rowIndex == tempSquareArr[index + 1].rowIndex
      ) {
        tempSquareArr[index + 1].color = color
        tempSquareArr[index + 1].captured = true
        //   !radarActive && updateSquareCount(color)
        updateSquareCounter(color)
        totalCaptured++
        //   !radarActive && totalCaptured++
        //   !radarActive ? data.squareGrowth[index + 1] = 'captured' : data.squareGrowth[index + 1] = 'predicted'
        //   setGrowth(data.squareGrowth)
        const growAnimation = Animated.timing(squareAnimArr[index + 1], {
          toValue: 1,
          duration: 250,
          easing: Easing.linear,
          useNativeDriver: true,
        })
        const reverseAnimation = Animated.timing(squareAnimArr[index + 1], {
          toValue: 0,
          duration: 250,
          easing: Easing.linear,
          useNativeDriver: true,
        })
        Animated.sequence([growAnimation, reverseAnimation]).start()
        tempSquareArr[index + 1].colIndex <= boardSize &&
          captureCheck(color, index + 1)
      }
    }
    //left
    if (tempSquareArr[index - 1] && tempSquareArr[index - 1].captured == false) {
      if (
        tempSquareArr[index].color == tempSquareArr[index - 1].color &&
        tempSquareArr[index].rowIndex == tempSquareArr[index - 1].rowIndex
      ) {
        tempSquareArr[index - 1].color = color
        tempSquareArr[index - 1].captured = true
        updateSquareCounter(color)
        totalCaptured++
        const growAnimation = Animated.timing(squareAnimArr[index - 1], {
          toValue: 1,
          duration: 250,
          easing: Easing.linear,
          useNativeDriver: true,
        })
        const reverseAnimation = Animated.timing(squareAnimArr[index - 1], {
          toValue: 0,
          duration: 250,
          easing: Easing.linear,
          useNativeDriver: true,
        })
        Animated.sequence([growAnimation, reverseAnimation]).start()
        tempSquareArr[index - 1].colIndex <= boardSize &&
          captureCheck(color, index - 1)
      }
    }
    //down
    if (
      tempSquareArr[index + boardSize] &&
      tempSquareArr[index + boardSize].captured == false
    ) {
      if (tempSquareArr[index].color == tempSquareArr[index + boardSize].color) {
        tempSquareArr[index + boardSize].color = color
        tempSquareArr[index + boardSize].captured = true
        updateSquareCounter(color)
        totalCaptured++
        const growAnimation = Animated.timing(squareAnimArr[index + boardSize], {
          toValue: 1,
          duration: 250,
          easing: Easing.linear,
          useNativeDriver: true,
        })
        const reverseAnimation = Animated.timing(squareAnimArr[index + boardSize], {
          toValue: 0,
          duration: 250,
          easing: Easing.linear,
          useNativeDriver: true,
        })
        Animated.sequence([growAnimation, reverseAnimation]).start()
        tempSquareArr[index + boardSize].rowIndex <= boardSize &&
          captureCheck(color, index + boardSize)
      }
    }
    //up
    if (
      tempSquareArr[index - boardSize] &&
      tempSquareArr[index - boardSize].captured == false
    ) {
      if (tempSquareArr[index].color == tempSquareArr[index - boardSize].color) {
        tempSquareArr[index - boardSize].color = color
        tempSquareArr[index - boardSize].captured = true
        updateSquareCounter(color)
        totalCaptured++
        const growAnimation = Animated.timing(squareAnimArr[index - boardSize], {
          toValue: 1,
          duration: 250,
          easing: Easing.linear,
          useNativeDriver: true,
        })
        const reverseAnimation = Animated.timing(squareAnimArr[index - boardSize], {
          toValue: 0,
          duration: 250,
          easing: Easing.linear,
          useNativeDriver: true,
        })
        Animated.sequence([growAnimation, reverseAnimation]).start()
        tempSquareArr[index - boardSize].rowIndex <= boardSize &&
          captureCheck(color, index - boardSize)
      }
    }
  }

  function updateSquareCounter(color) {
    squareCounterArr.forEach((sq) => {
      if (sq.color == color) {
        sq.count--
      }
    })
  }

  function handleHoleChange() {
    squareAnimArr = []
    hole++
    roundScore = countNumber - parValue
    totalScoreValue += roundScore
    parValue += 2
    round < 10 && round++
    if (hole >= 10) {
      return
    }
    console.log('i aM running')
    boardSize++
    getSize()
    tempSquareArr = JSON.parse(JSON.stringify(squares[hole]))
    squareAnimArr = tempSquareArr.map(() => new Animated.Value(0))
    squareCounterArr.forEach((counter, index) => {
      counter.count = 0
    })
    totalCaptured = 1
    tempSquareArr.forEach((sq, index) => {
      if (sq.captured) {
        captureCheck(sq.color, index)
      }
    })
    tempSquareArr.forEach((sq) => {
      squareCounterArr.forEach((counter) => {
        if (sq.color == counter.color && !sq.index == 0) {
          counter.count++
        }
      })
    })
    countNumber = 0
    modalVisible && setModalVisible(!modalVisible)
    setBlock(false)
    setChange(true)
  }

  async function handleComplete() {
    if (!complete) {
      setComplete(true)
      const newScore = await addDoc(collection(db, 'Scores'), {
        boardId: boardId,
        score: totalScoreValue,
        size: 'Default',
        boardData: randomArr.toString(),
        createdBy: userName,
        gamemode: 'Progressive',
        createdAt: serverTimestamp(),
      })
      console.log(totalScoreValue)
      originalScore = scoreToBeat
      console.log('totalscore', totalScoreValue)
      console.log('originalscore', originalScore)
      if (totalScoreValue < highScore || highScore === '') {
        setHighScore(totalScoreValue)
      }
      if (totalScoreValue < scoreToBeat || scoreToBeat == null) {
        // setPreviousScore(scoreToBeat)
        setScoreToBeat(totalScoreValue)
      }
      setLoading(false)
    }
  }

  function generateNewBoard(showAd) {
    randomArr = []
    for (let i = 0; i < 1210; i++) {
      randomArr.push(Math.floor(Math.random() * 5))
    }
    squares = generateBoard(randomArr)
    tempSquareArr = JSON.parse(JSON.stringify(squares[hole]))
    squareAnimArr = tempSquareArr.map(() => new Animated.Value(0))
    boardId = uuid.v4()
    docId = null
    // setPreviousScore(null)
    originalScore = null
    setScoreToBeat(null)
    resetColors()
    handleReset()
    // if (showAd) {
    //   interstitial.show()
    // }
  }

  function resetColors() {
    // console.log(squares)
    squares.forEach((arr) => {
      arr.forEach((sq) => {
        sq.color = colors[sq.colorIndex]
      })
    })
    tempSquareArr.forEach((sq) => {
      sq.color = colors[sq.colorIndex]
      if (sq.captured) {
        sq.color = tempSquareArr[0].color
      }
    })
    squareCounterArr.forEach((counter, index) => {
      counter.color = colors[index]
    })
    gridItemSize = Math.floor(screenWidth / boardSize)
    setChange(true)
  }

  // function handleReset() {
  //     squareCounterArr.forEach(counter => {
  //         counter.count = 0
  //     })
  //     totalCaptured = 1
  //     tempSquareArr.forEach((sq, index) => {
  //         if (sq.captured) {
  //           captureCheck(sq.color, index);
  //         }
  //       });
  //     tempSquareArr.forEach(sq => {
  //         squareCounterArr.forEach(counter => {
  //             if (sq.color == counter.color && !sq.index == 0) {
  //                 counter.count++
  //             }
  //         })
  //     })
  //     countNumber = 0
  //     modalVisible && setModalVisible(!modalVisible)
  //     gridItemSize = Math.floor(screenWidth / 5)
  //     setTotalScore(0)
  //     parValue = 10
  //     roundScore = 0
  //     setChange(true)
  // }

  function handleReset(showAd) {
    console.log('hasdf')
    boardSize = 5
    gridItemSize = Math.floor(screenWidth / 5)
    setTotalScore(0)
    parValue = 10
    roundScore = 0
    hole = 0
    round = 1
    countNumber = 0
    squares.forEach((arr) => {
      arr.forEach((sq) => {
        // console.log(sq)
        sq.color = colors[sq.colorIndex]
        if (sq.index != 0) {
          sq.captured = false
        }
      })
    })
    squareCounterArr.forEach((counter) => {
      counter.count = 0
    })
    totalCaptured = 1
    tempSquareArr = JSON.parse(JSON.stringify(squares[0]))
    squareAnimArr = tempSquareArr.map(() => new Animated.Value(0))
    tempSquareArr.forEach((sq, index) => {
      if (sq.captured) {
        captureCheck(sq.color, index)
      }
    })
    tempSquareArr.forEach((sq) => {
      squareCounterArr.forEach((counter) => {
        if (sq.color == counter.color && !sq.index == 0) {
          counter.count++
        }
      })
    })
    const growAnimation = Animated.timing(squareAnimArr[0], {
      toValue: 1,
      duration: 250,
      easing: Easing.linear,
      useNativeDriver: true,
    })
    const reverseAnimation = Animated.timing(squareAnimArr[0], {
      toValue: 0,
      duration: 250,
      easing: Easing.linear,
      useNativeDriver: true,
    })
    Animated.sequence([growAnimation, reverseAnimation]).start()
    if (totalScoreValue < scoreToBeat || scoreToBeat == null) {
      originalScore = scoreToBeat
      complete && setScoreToBeat(totalScoreValue)
    }
    totalScoreValue = 0
    modalVisible && setModalVisible(!modalVisible)
    setComplete(false)
    // if (showAd) {
    //   interstitial.show()
    // }
    setBlock(false)
    setChange(true)
  }

  return (
    <View style={[styles.container, { backgroundColor: colorTheme.background }]}>
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.centeredView}>
          <View style={[styles.modalView, { backgroundColor: colorTheme.button }]}>
            <Text style={[styles.modalText, { color: colorTheme.text }]}>
              You completed this round{' '}
              {counter > parValue
                ? `+${counter - parValue} over`
                : `${counter - parValue} under`}{' '}
              par!
            </Text>
            <TouchableOpacity
              style={[styles.button, styles.buttonClose, { marginBottom: 10 }]}
              onPress={() => handleHoleChange()}
            >
              <Text style={[styles.textStyle, { color: colorTheme.text }]}>
                Next Round
              </Text>
            </TouchableOpacity>
            {/* <TouchableOpacity
              style={[styles.button, styles.buttonClose]}
              onPress={() => handleRetry()}>
              <Text style={styles.textStyle}>Retry Board</Text>
            </TouchableOpacity> */}
          </View>
        </View>
      </Modal>
      <Modal animationType="slide" transparent={true} visible={complete}>
        <View style={styles.centeredView}>
          <View style={[styles.modalView, { backgroundColor: colorTheme.button }]}>
            {loading ? (
              <ActivityIndicator color="darkgreen"></ActivityIndicator>
            ) : (
              <Text style={[styles.modalText, { color: colorTheme.text }]}>
                {originalScore == null
                  ? `You completed the game ${
                      totalScoreValue < 0
                        ? totalScoreValue + ' under '
                        : totalScoreValue + ' over'
                    } par!`
                  : totalScoreValue >= originalScore
                    ? `You did not beat the previous score!`
                    : `You beat the previous record (${
                        originalScore > 0 ? `+${originalScore}` : originalScore
                      }) with a score of ${
                        totalScoreValue > 0 ? `+${totalScoreValue}` : totalScoreValue
                      }!`}
              </Text>
            )}

            <TouchableOpacity
              style={[styles.button, styles.buttonClose]}
              onPress={() => generateNewBoard(true)}
            >
              <Text style={[styles.textStyle, { color: colorTheme.text }]}>
                New Game
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonClose]}
              onPress={() => handleReset(true)}
            >
              <Text style={[styles.textStyle, { color: colorTheme.text }]}>
                Retry Game
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <View style={styles.top}>
        {screenHeight > 715 && (
          <Text
            style={[styles.topText, styles.highScore, { color: colorTheme.text }]}
          >
            {scoreToBeat == null
              ? `High Score: ${highScore > 0 ? `+${highScore}` : highScore}`
              : `Score to beat: ${
                  scoreToBeat > 0 ? `+${scoreToBeat}` : scoreToBeat
                }`}
          </Text>
        )}
        {/* <Text
          style={[styles.topText, styles.remainText, { color: colorTheme.text }]}
        >
          Squares Remaining
        </Text> */}
        {screenHeight > 790 && (
          <View style={styles.squareCounter}>
            <View style={[styles.fakeSquare, { backgroundColor: colorOption[0] }]}>
              <Text style={styles.fakeText}>{squareCounter[0].count}</Text>
            </View>
            <View style={[styles.fakeSquare, { backgroundColor: colorOption[1] }]}>
              <Text style={styles.fakeText}>{squareCounter[1].count}</Text>
            </View>
            <View style={[styles.fakeSquare, { backgroundColor: colorOption[2] }]}>
              <Text style={styles.fakeText}>{squareCounter[2].count}</Text>
            </View>
            <View style={[styles.fakeSquare, { backgroundColor: colorOption[3] }]}>
              <Text style={styles.fakeText}>{squareCounter[3].count}</Text>
            </View>
            <View style={[styles.fakeSquare, { backgroundColor: colorOption[4] }]}>
              <Text style={styles.fakeText}>{squareCounter[4].count}</Text>
            </View>
          </View>
        )}
      </View>
      <View style={styles.scoreInfo}>
        <Text
          style={[
            {
              fontSize: 20,
              display: 'flex',
              width: '25%',
              justifyContent: 'flex-start',
              textAlign: 'left',
              color: colorTheme.text,
            },
          ]}
        >
          Round {round}
        </Text>
        <Text
          style={[
            {
              fontSize: 20,
              display: 'flex',
              width: '50%',
              justifyContent: 'center',
              textAlign: 'center',
              color: colorTheme.text,
            },
          ]}
        >
          {counter} / {parValue}
        </Text>
        <Text
          style={[
            {
              fontSize: 20,
              display: 'flex',
              width: '25%',
              justifyContent: 'flex-end',
              textAlign: 'right',
              color: colorTheme.text,
            },
          ]}
        >
          Score:
          <Text
            style={{
              marginLeft: 5,
              color:
                totalScore < 0 ? 'green' : totalScore > 0 ? 'red' : colorTheme.text,
            }}
          >
            {totalScore > 0 ? `+${totalScore}` : totalScore}
          </Text>
        </Text>
      </View>
      <View style={[styles.board, screenWidth > 500 && { maxWidth: screenWidth }]}>
        {colorState.map((sq, index) => {
          return (
            // <View key={index} style={[styles.square, {backgroundColor: sq.color}]}></View>
            <Animated.View
              key={index}
              style={[
                styles.square,
                colorState[index].captured && { zIndex: 2 },
                {
                  backgroundColor: sq.color,
                  width: gridItemSize,
                  height: gridItemSize,
                  transform: [
                    {
                      scale: squareAnim[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.2], // grow by 20%
                      }),
                    },
                  ],
                },
              ]}
            ></Animated.View>
          )
        })}
      </View>

      <View style={styles.extraRow}>
        <TouchableOpacity
          style={[styles.resetButton, { backgroundColor: colorTheme.button }]}
          onPress={() => generateNewBoard()}
        >
          <Text
            style={[
              { textAlign: 'center', userSelect: 'none', color: colorTheme.text },
            ]}
          >
            New Board
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.resetButton, { backgroundColor: colorTheme.button }]}
          onPress={() => handleReset()}
        >
          <Text
            style={[
              { textAlign: 'center', userSelect: 'none', color: colorTheme.text },
            ]}
          >
            Retry
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.colorRow}>
        <TouchableOpacity
          style={[
            styles.color,
            {
              backgroundColor: selectedColor == colors[0] ? 'gray' : colorOption[0],
            },
            { opacity: selectedColor == colors[0] ? 0.1 : 1 },
          ]}
          onPress={() =>
            selectedColor != colors[0] && !block && colorChange(colorOption[0])
          }
        ></TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.color,
            {
              backgroundColor: selectedColor == colors[1] ? 'gray' : colorOption[1],
            },
            { opacity: selectedColor == colors[1] ? 0.1 : 1 },
          ]}
          onPress={() =>
            selectedColor != colors[1] && !block && colorChange(colorOption[1])
          }
        ></TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.color,
            {
              backgroundColor: selectedColor == colors[2] ? 'gray' : colorOption[2],
            },
            { opacity: selectedColor == colors[2] ? 0.1 : 1 },
          ]}
          onPress={() =>
            selectedColor != colors[2] && !block && colorChange(colorOption[2])
          }
        ></TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.color,
            {
              backgroundColor: selectedColor == colors[3] ? 'gray' : colorOption[3],
            },
            { opacity: selectedColor == colors[3] ? 0.1 : 1 },
          ]}
          onPress={() =>
            selectedColor != colors[3] && !block && colorChange(colorOption[3])
          }
        ></TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.color,
            {
              backgroundColor: selectedColor == colors[4] ? 'gray' : colorOption[4],
            },
            { opacity: selectedColor == colors[4] ? 0.1 : 1 },
          ]}
          onPress={() =>
            selectedColor != colors[4] && !block && colorChange(colorOption[4])
          }
        ></TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  top: {
    justifyContent: 'center',
  },
  topText: {
    textAlign: 'center',
    fontSize: 20,
  },
  scoreInfo: {
    width: screenWidth,
    flexDirection: 'row',
    marginTop: 3,
    marginBottom: 3,
    // justifyContent: 'space-between'
  },
  remainText: {
    marginBottom: 5,
  },
  highScore: {
    fontSize: 25,
    marginBottom: 5,
  },
  squareCounter: {
    display: 'flex',
    gap: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 5,
  },
  fakeSquare: {
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    borderWidth: 1,
    width: 45,
    height: 45,
  },
  fakeText: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: 'white',
    fontSize: 20,
    textShadowColor: 'black',
    textShadowRadius: 2,
    textShadowOffset: {
      width: 1,
      height: 1,
    },
  },
  counter: {
    fontSize: 30,
  },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    // maxWidth: screenWidth
  },
  square: {
    borderWidth: 1,
    backgroundColor: 'blue',
    width: gridItemSize,
    height: gridItemSize,
  },
  //bottom buttons
  extraRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: 5,
    marginTop: 5,
    justifyContent: 'center',
  },
  resetButton: {
    width: screenWidth <= 320 ? screenWidth * 0.18 : 65,
    height: screenWidth <= 320 ? screenWidth * 0.18 : 65,
    borderWidth: 1,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
  },
  color: {
    width: screenWidth <= 320 ? screenWidth * 0.18 : 65,
    height: screenWidth <= 320 ? screenWidth * 0.18 : 65,
    borderWidth: 1,
    borderRadius: 50,
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
  button: {
    borderRadius: 20,
    padding: 15,
    elevation: 2,
    marginBottom: 5,
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
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 20,
  },
})

export default Progressive
