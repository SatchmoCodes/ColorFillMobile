import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  Pressable,
  Modal,
  Animated,
  Easing,
  Alert,
} from 'react-native'
import React from 'react'
import { useState, useEffect, useRef } from 'react'
import generateBoard from './squareGenerator.js'
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
import { FIRESTORE_DB, FIREBASE_AUTH } from '../../firebaseConfig.js'
import uuid from 'react-native-uuid'
import { useColorSchemeContext } from '../../App'
import { squareColors } from './colors.js'

console.log(squareColors)

let red = 'hsl(0, 100%, 40%)'
let orange = 'hsl(22, 100%, 50%)'
let yellow = 'hsl(60, 100%, 50%)'
let green = 'hsl(130, 100%, 15%)'
let blue = 'hsl(242, 69%, 49%)'

let colors = [red, orange, yellow, green, blue]

// const colorArr = [
//   ['hsl(0, 100%, 40%)','hsl(22, 100%, 50%)','hsl(60, 100%, 50%)','hsl(130, 100%, 15%)','hsl(242, 69%, 49%)', 'rgb(255,255,255)', 'rgb(30,30,30)'],
//   ['hsl(33, 90.8%, 12.7%)','hsl(33, 89.8%, 26.9%)','hsl(25, 95.4%, 42.7%)','hsl(221, 69.2%, 43.3%)','hsl(213, 68.6%, 90%)','rgb(133, 7, 7)','rgb(8, 68, 17)'],
//   ['hsl(358,83%,35%)','hsl(2,72%,51%)','hsl(211,88%,32%)','hsl(0,0%,39%)','hsl(0,0%,14%)','rgb(143, 4, 156)','rgb(255, 235, 15)'],
//   ['hsl(164,95%,43%)','hsl(240,100%,98%)','hsl(43,100%,70%)','hsl(197,19%,36%)','hsl(200,43%,7%)','rgb(5, 73, 157)','rgb(197, 42, 11)'],
//   ['hsl(7,55%,30%)','hsl(6,56%,49%)','hsl(24,38%,87%)','hsl(183,66%,28%)','hsl(180,20%,20%)','rgb(228, 174, 13)','rgb(110, 13, 228)'],
//   ['hsl(83, 45%, 18%)','hsl(59,70%,30%)','hsl(55, 47%, 78%)','hsl(48,99%,59%)','hsl(27, 55%, 33%)','rgb(31, 194, 215)','rgb(204, 72, 16)']
// ]

const colorArr = squareColors

let boardSize = 12
let sizeName = 'Medium'
let screenWidth = Dimensions.get('window').width * 0.95
let gridItemSize = Math.floor(screenWidth / boardSize)
console.log(gridItemSize)
if (screenWidth >= 1000) {
  screenWidth = Dimensions.get('window').height * 0.55
  console.log(screenWidth)
  gridItemSize = Math.floor(screenWidth / boardSize)
}

//temporary stuff to generate random squares
let randomArr = []

for (let i = 0; i < boardSize * boardSize; i++) {
  randomArr.push(Math.floor(Math.random() * 5))
}

let squares = generateBoard(randomArr).flat()
let tempSquareArr = JSON.parse(JSON.stringify(squares))
// let squareAnimArr = new Array(tempSquareArr.length).fill(new Animated.Value(0))
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

let username
let boardId = uuid.v4()
let docId = null
let originalSize

const FreePlay = () => {
  const route = useRoute()
  const { useColors } = useColorSchemeContext()
  const colorTheme = useColors()

  const [colorState, setColorState] = useState(tempSquareArr)
  const [selectedColor, setSelectedColor] = useState(tempSquareArr[0].color)
  const [colorOption, setSelectedColorOption] = useState(colors)
  const [counter, setCounter] = useState(0)
  const [highScore, setHighScore] = useState('')
  const [squareCounter, setSquareCounter] = useState(squareCounterArr)
  const [squareAnim, setSquareAnim] = useState(squareAnimArr)
  const [change, setChange] = useState(false)
  const [complete, setComplete] = useState(false)
  const [scoreToBeat, setScoreToBeat] = useState(null)
  const [previousScore, setPreviousScore] = useState(null) //set this state before updating scoreToBeat

  const [modalVisible, setModalVisible] = useState(false)

  const db = FIRESTORE_DB
  const auth = FIREBASE_AUTH

  const isFocused = useIsFocused()

  const [uid, setUid] = useState(null)
  const [userName, setUserName] = useState(null)

  const [boardLoaded, setBoardLoaded] = useState(false)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      // The user object will be null if not logged in or a user object if logged in
      setUid(user.uid)
      console.log('uid ', user.uid)
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

  // useEffect(() => {
  //   if (route) {
  //     docId = route.params?.id
  //   }
  // }, [route])

  useEffect(() => {
    const getHighScore = async () => {
      let size = await getSize()
      const q = query(
        collection(db, 'Scores'),
        where('gamemode', '==', 'FreePlay'),
        where('size', '==', size.sizeName),
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
  }, [userName, isFocused])

  async function initialLoad() {
    await getColor()
    let size = await getSize()
    if (docId != undefined && !boardLoaded) {
      const docRef = doc(db, 'Scores', docId)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        console.log(docSnap.data().size)
        console.log(size.sizeName)
        if (docSnap.data().size != size.sizeName) {
          console.log('docId found but size different')
          generateNewBoard()
          return
        }
        setBoardLoaded(true)
        setScoreToBeat(docSnap.data().score)
        console.log('loading board from leaderboard')
        randomArr = docSnap.data().boardData.replace(/,/g, '')
        boardSize = Math.sqrt(randomArr.length)
        originalSize = boardSize
        gridItemSize = Math.floor(screenWidth / boardSize)
        boardId = docSnap.data().boardId
        squares = generateBoard(randomArr).flat()
        tempSquareArr = JSON.parse(JSON.stringify(squares))
        squareAnimArr = tempSquareArr.map(() => new Animated.Value(0))
        resetColors()
        handleReset()
        return
      }
    }
    if (originalSize != size.boardSize) {
      console.log('original size not equal')
      generateNewBoard()
      return
    }
    console.log('resetting colors')
    resetColors()
  }

  useEffect(() => {
    if (route) {
      docId = route.params?.id
    }
  }, [route])

  //check to see if user returned from options page
  useEffect(() => {
    const coolFunction = async () => {
      originalSize = boardSize
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
      // setSquareCounter(squareCounterArr)
      initialLoad()
      setChange(true)
      hasRun = true
      console.log('testing to seesasdfasdf')
    }
  }, [])

  const getSize = async () => {
    try {
      const value = await AsyncStorage.getItem('size')
      if (value !== null) {
        switch (value) {
          case '1':
            boardSize = 8
            sizeName = 'Small'
            break
          case '2':
            boardSize = 12
            sizeName = 'Medium'
            break
          case '3':
            boardSize = 16
            sizeName = 'Large'
            break
        }
        // gridItemSize = Math.floor(screenWidth / boardSize);
        return { boardSize, sizeName }
      }
    } catch (e) {
      // error reading value
    }
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
        setSelectedColorOption(colors)
        setSelectedColor(tempSquareArr[0].color)
      }
    } catch (e) {
      console.log(e)
    }
  }

  function colorChange(color) {
    setSelectedColor(color)
    tempSquareArr.forEach((sq, index) => {
      if (sq.captured) {
        captureCheck(color, index)
      }
    })
    countNumber++
    setChange(true)
  }

  useEffect(() => {
    if (change) {
      setColorState(tempSquareArr)
      setSquareCounter(squareCounterArr)
      setCounter(countNumber)
      setSquareAnim(squareAnimArr)
      setSelectedColor(tempSquareArr[0].color)
      setSelectedColorOption(colors)
      if (totalCaptured == boardSize * boardSize) {
        handleComplete()
      }
      setChange(false)
      setComplete(false)
    }
  }, [change])

  async function handleComplete() {
    const newScore = await addDoc(collection(db, 'Scores'), {
      boardId: boardId,
      score: countNumber,
      size: sizeName,
      boardData: randomArr.toString(),
      createdBy: userName,
      gamemode: 'FreePlay',
      createdAt: serverTimestamp(),
    })
    if (countNumber < highScore || highScore == '') {
      setHighScore(countNumber)
    }
    if (countNumber < scoreToBeat) {
      setPreviousScore(scoreToBeat)
      setScoreToBeat(countNumber)
    }
    setComplete(true)
    setModalVisible(true)
  }

  function captureCheck(color, index) {
    setTimeout(() => {}, 50)
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

  function generateNewBoard() {
    randomArr = []
    squareAnimArr = []
    // getSize()
    for (let i = 0; i < boardSize * boardSize; i++) {
      randomArr.push(Math.floor(Math.random() * 5))
    }
    squares = generateBoard(randomArr).flat()
    tempSquareArr = JSON.parse(JSON.stringify(squares))
    squareAnimArr = tempSquareArr.map(() => new Animated.Value(0))
    boardId = uuid.v4()
    docId = null
    setScoreToBeat(null)
    setPreviousScore(null)
    resetColors()
    // handleReset()
    handleReset()
  }

  function resetColors() {
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

  function handleReset() {
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
        if (sq.colorIndex == counter.id && !sq.index == 0) {
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
    countNumber = 0
    modalVisible && setModalVisible(!modalVisible)
    setChange(true)
  }

  // async function handleReset() {
  //     randomArr = []
  //     squareAnimArr = []
  //     console.log('before board size')
  //     console.log(boardSize)
  //     let x = await getSize()
  //     await getColor()
  //     console.log(x)
  //     console.log('reset board size')
  //     console.log(boardSize)
  //     for (let i = 0; i < (boardSize * boardSize); i++) {
  //         randomArr.push(Math.floor(Math.random() * 5))
  //     }
  //     squares = generateBoard(randomArr).flat()
  //     tempSquareArr = JSON.parse(JSON.stringify(squares))
  //     squareAnimArr = tempSquareArr.map(() => new Animated.Value(0))
  //     //ensure colors match current color set
  //     tempSquareArr.forEach((sq) => {
  //       sq.color = colors[sq.colorIndex]
  //     })

  //     console.log(squareAnimArr.length)
  //     squareCounterArr.forEach((counter, index) => {
  //         counter.count = 0
  //         counter.color = colors[index]
  //       })
  //     totalCaptured = 1
  //     tempSquareArr.forEach((sq, index) => {
  //         if (sq.captured) {
  //             captureCheck(sq.color, index);
  //         }
  //     });
  //     tempSquareArr.forEach(sq => {
  //         squareCounterArr.forEach(counter => {
  //             if (sq.colorIndex == counter.id && !sq.index == 0) {
  //               counter.count++
  //             }
  //           })
  //       })
  //     countNumber = 0
  //     modalVisible && setModalVisible(!modalVisible)
  //     setChange(true)
  // }

  function handleRetry() {
    tempSquareArr.forEach((sq) => {
      sq.color = colors[sq.colorIndex]
      if (sq.index != 0) {
        sq.captured = false
      }
    })
    squareCounterArr.forEach((counter) => {
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
    console.log('complete', complete)
    console.log('countNumber', countNumber)
    if (countNumber < scoreToBeat || scoreToBeat == null) {
      complete && setScoreToBeat(countNumber)
    }
    countNumber = 0
    modalVisible && setModalVisible(!modalVisible)
    setChange(true)
  }

  return (
    <View style={[styles.container, { backgroundColor: colorTheme.background }]}>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          Alert.alert('Modal has been closed.')
          setModalVisible(!modalVisible)
        }}
      >
        <View style={[styles.centeredView]}>
          <View style={[styles.modalView, { backgroundColor: colorTheme.button }]}>
            <Text style={[styles.modalText, { color: colorTheme.text }]}>
              {previousScore == null
                ? `You completed the board in ${counter} turns!`
                : counter < previousScore
                  ? `You beat the previous record (${previousScore}) with ${counter} turns!`
                  : `You did not beat the previous record!`}
            </Text>
            <Pressable
              style={[styles.button, styles.buttonClose, { marginBottom: 10 }]}
              onPress={() => generateNewBoard()}
            >
              <Text style={[styles.textStyle]}>New Board</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.buttonClose]}
              onPress={() => handleRetry()}
            >
              <Text style={[styles.textStyle]}>Retry Board</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <View style={styles.top}>
        <Text style={[styles.topText, styles.highScore, { color: colorTheme.text }]}>
          {scoreToBeat == null
            ? `High Score: ${highScore}`
            : `Score to beat: ${scoreToBeat}`}
        </Text>
        <Text
          style={[styles.topText, styles.remainText, { color: colorTheme.text }]}
        >
          Squares Remaining
        </Text>
        <View style={styles.squareCounter}>
          <View style={[styles.fakeSquare, { backgroundColor: colorOption[0] }]}>
            <Text style={[styles.fakeText]}>{squareCounter[0].count}</Text>
          </View>
          <View style={[styles.fakeSquare, { backgroundColor: colorOption[1] }]}>
            <Text style={[styles.fakeText]}>{squareCounter[1].count}</Text>
          </View>
          <View style={[styles.fakeSquare, { backgroundColor: colorOption[2] }]}>
            <Text style={[styles.fakeText]}>{squareCounter[2].count}</Text>
          </View>
          <View style={[styles.fakeSquare, { backgroundColor: colorOption[3] }]}>
            <Text style={[styles.fakeText]}>{squareCounter[3].count}</Text>
          </View>
          <View style={[styles.fakeSquare, { backgroundColor: colorOption[4] }]}>
            <Text style={[styles.fakeText]}>{squareCounter[4].count}</Text>
          </View>
        </View>
      </View>
      <Text style={[styles.counter, { color: colorTheme.text }]}>
        {scoreToBeat == null ? counter : `${counter} / ${scoreToBeat}`}
      </Text>
      <View style={[styles.board, screenWidth > 500 && { maxWidth: screenWidth }]}>
        {colorState.map((sq, index) => {
          return (
            // <View key={index} style={[styles.square, {backgroundColor: sq.color}]}></View>
            <Animated.View
              key={index}
              style={[
                styles.square,
                sq.captured && { zIndex: 2 },
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
        <Pressable
          style={[styles.resetButton, { backgroundColor: colorTheme.button }]}
          onPress={() => generateNewBoard()}
        >
          <Text
            style={{
              textAlign: 'center',
              userSelect: 'none',
              color: colorTheme.text,
            }}
          >
            New Board
          </Text>
        </Pressable>
        <Pressable
          style={[styles.resetButton, { backgroundColor: colorTheme.button }]}
          onPress={() => handleRetry()}
        >
          <Text style={{ userSelect: 'none', color: colorTheme.text }}>Retry</Text>
        </Pressable>
      </View>
      <View style={styles.colorRow}>
        <Pressable
          style={[
            styles.color,
            {
              backgroundColor: selectedColor == colors[0] ? 'gray' : colorOption[0],
            },
            { opacity: selectedColor == colors[0] ? 0.25 : 1 },
          ]}
          onPress={() => colorChange(colorOption[0])}
        ></Pressable>
        <Pressable
          style={[
            styles.color,
            {
              backgroundColor: selectedColor == colors[1] ? 'gray' : colorOption[1],
            },
            { opacity: selectedColor == colors[1] ? 0.25 : 1 },
          ]}
          onPress={() => colorChange(colorOption[1])}
        ></Pressable>
        <Pressable
          style={[
            styles.color,
            {
              backgroundColor: selectedColor == colors[2] ? 'gray' : colorOption[2],
            },
            { opacity: selectedColor == colors[2] ? 0.25 : 1 },
          ]}
          onPress={() => colorChange(colorOption[2])}
        ></Pressable>
        <Pressable
          style={[
            styles.color,
            {
              backgroundColor: selectedColor == colors[3] ? 'gray' : colorOption[3],
            },
            { opacity: selectedColor == colors[3] ? 0.25 : 1 },
          ]}
          onPress={() => colorChange(colorOption[3])}
        ></Pressable>
        <Pressable
          style={[
            styles.color,
            {
              backgroundColor: selectedColor == colors[4] ? 'gray' : colorOption[4],
            },
            { opacity: selectedColor == colors[4] ? 0.25 : 1 },
          ]}
          onPress={() => colorChange(colorOption[4])}
        ></Pressable>
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
  remainText: {
    marginBottom: 5,
  },
  highScore: {
    fontSize: 30,
    marginBottom: 5,
  },
  squareCounter: {
    display: 'flex',
    gap: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  fakeSquare: {
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    borderWidth: 1,
    width: 50,
    height: 50,
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
    maxWidth: screenWidth,
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
    width: '90%',
    gap: 5,
    marginBottom: 5,
    justifyContent: 'center',
  },
  resetButton: {
    marginTop: 10,
    width: 70,
    height: 70,
    borderWidth: 1,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorRow: {
    flex: 1,
    flexDirection: 'row',
    width: '90%',
    gap: 5,
    justifyContent: 'center',
  },
  color: {
    width: 70,
    height: 70,
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

export default FreePlay
