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
  limit,
  updateDoc,
} from 'firebase/firestore'
import { FIRESTORE_DB, FIREBASE_AUTH } from '../../firebaseConfig.js'
import uuid from 'react-native-uuid'
import { useColorSchemeContext } from '../../App'
import { squareColors } from './colors.js'
// import { AdEventType, InterstitialAd, TestIds } from 'react-native-google-mobile-ads'

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
let screenWidth = Math.floor(Dimensions.get('window').width * 0.98)
let screenHeight = Math.floor(Dimensions.get('window').height)
let gridItemSize = Math.floor(screenWidth / boardSize)
console.log(gridItemSize)
if (screenWidth >= 500) {
  screenWidth = Math.floor(Dimensions.get('window').height * 0.55)
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
let originalScore //initial score of board when challenging/resetting

// const interstitial = InterstitialAd.createForAdRequest(TestIds.INTERSTITIAL, {
//   requestNonPersonalizedAdsOnly: true,
// })

const FreePlay = () => {
  const route = useRoute()
  const { useColors } = useColorSchemeContext()
  const colorTheme = useColors()

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

  const [viewportWidth, setViewportWidth] = useState(Dimensions.get('window').width)
  const [viewportHeight, setViewportHeight] = useState(
    Dimensions.get('window').height,
  )

  useEffect(() => {
    const handleDimensionsChange = ({ window }) => {
      screenWidth = Math.floor(Dimensions.get('window').width * 0.98)
      screenHeight = Math.floor(Dimensions.get('window').height)
      gridItemSize = Math.floor(screenWidth / boardSize)
      if (screenWidth >= 500) {
        screenWidth = Math.floor(Dimensions.get('window').height * 0.55)
        console.log(screenWidth)
        gridItemSize = Math.floor(screenWidth / boardSize)
      }
      setViewportWidth(screenWidth)
      setViewportHeight(screenHeight)
      // Handle viewport size changes here
    }

    // Subscribe to the event when the component mounts
    Dimensions.addEventListener('change', handleDimensionsChange)

    // Clean up the event listener when the component unmounts
    return () => {
      Dimensions.removeEventListener('change', handleDimensionsChange)
    }
  }, [])

  const [colorState, setColorState] = useState(tempSquareArr)
  const [selectedColor, setSelectedColor] = useState(
    colors.indexOf(tempSquareArr[0].color),
  )
  const [colorOption, setSelectedColorOption] = useState(colors)
  const [counter, setCounter] = useState(0)
  const [highScore, setHighScore] = useState('')
  const [squareCounter, setSquareCounter] = useState(squareCounterArr)
  const [squareAnim, setSquareAnim] = useState(squareAnimArr)
  const [change, setChange] = useState(false)
  const [complete, setComplete] = useState(false)
  const [scoreToBeat, setScoreToBeat] = useState(null)
  // const [previousScore, setPreviousScore] = useState(null) //set this state before updating scoreToBeat

  const [modalVisible, setModalVisible] = useState(false)

  const db = FIRESTORE_DB
  const auth = FIREBASE_AUTH

  const isFocused = useIsFocused()

  const [uid, setUid] = useState(null)
  const [userName, setUserName] = useState(null)

  const [boardLoaded, setBoardLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [prompt, setPrompt] = useState(false)

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
  }, [auth])

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
        limit(1),
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
        // setPreviousScore(docSnap.data().score)
        originalScore = docSnap.data().score
        console.log('loading board from leaderboard')
        randomArr = docSnap.data().boardData.replace(/,/g, '')
        boardSize = Math.sqrt(randomArr.length)
        originalSize = boardSize
        gridItemSize = Math.floor(screenWidth / boardSize)
        boardId = docSnap.data().boardId
        squares = generateBoard(randomArr).flat()
        tempSquareArr = JSON.parse(JSON.stringify(squares))
        squareAnimArr = tempSquareArr.map(() => new Animated.Value(0))
        console.log('running here')
        resetColors(true)
        handleReset()
        return
      }
    }
    if (originalSize != size.boardSize || size == undefined) {
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
    if (isFocused) {
      originalSize = boardSize
      initialLoad()
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
      } else {
        console.log('no size yet')
        boardSize = 12
        sizeName = 'Medium'
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
        // setSelectedColor(tempSquareArr[0].color)
      }
    } catch (e) {
      console.log(e)
    }
  }

  function colorChange(color) {
    setSelectedColor(colors.indexOf(color))
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
      setSelectedColor(colors.indexOf(tempSquareArr[0].color))
      setCounter(countNumber)
      setSquareAnim(squareAnimArr)
      // setSelectedColor(tempSquareArr[0].color)
      setSelectedColorOption(colors)
      gridItemSize = Math.floor(screenWidth / boardSize)
      if (totalCaptured == boardSize * boardSize) {
        setLoading(true)
        handleComplete()
      }
      setChange(false)
      setComplete(false)
    }
  }, [change])

  async function handleComplete() {
    if (!complete) {
      setComplete(true)
      setModalVisible(true)
      const boardScores = query(
        collection(db, 'Scores'),
        where('boardId', '==', boardId),
        orderBy('score', 'asc'),
        orderBy('createdAt', 'asc'),
      )
      const querySnapshot = await getDocs(boardScores)
      const updates = []
      let currentHighScore = null
      if (!querySnapshot.empty) {
        currentHighScore = querySnapshot.docs[0].data().score
        console.log('currentHighScore', currentHighScore)
        querySnapshot.forEach((doc) => {
          if (countNumber < doc.data().score) {
            let docRef = doc.ref
            updates.push(
              updateDoc(docRef, {
                highScore: false,
              }),
            )
          }
        })
      }
      await Promise.all(updates)
      const newScore = await addDoc(collection(db, 'Scores'), {
        boardId: boardId,
        score: countNumber,
        size: sizeName,
        boardData: randomArr.toString(),
        createdBy: userName,
        uid: uid,
        gamemode: 'FreePlay',
        highScore:
          countNumber < currentHighScore || currentHighScore === null ? true : false,
        createdAt: serverTimestamp(),
      })
      originalScore = scoreToBeat
      if (countNumber < highScore || highScore === '') {
        setHighScore(countNumber)
      }
      if (countNumber < scoreToBeat || scoreToBeat == null) {
        // setPreviousScore(scoreToBeat)
        setScoreToBeat(countNumber)
      }
    }
    setLoading(false)
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

  function generateNewBoard(showAd) {
    setPrompt(false)
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
    originalScore = null
    resetColors(true)
    handleReset()
    // if (showAd) {
    //   let rand = Math.floor(Math.random() * 4)
    //   if (rand === 0) {
    //     interstitial.show()0
    //   }
    // }
  }

  function resetColors(boardReset) {
    tempSquareArr.forEach((sq) => {
      sq.color = colors[sq.colorIndex]
      if (sq.captured) {
        if (boardReset) {
          sq.color = tempSquareArr[0].color
        } else {
          console.log('selectedColor', selectedColor)
          sq.color = colors[selectedColor]
        }
      }
    })
    squareCounterArr.forEach((counter, index) => {
      counter.color = colors[index]
    })

    setChange(true)
  }

  function handleReset(showAd) {
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
    // if (showAd) {
    //   let rand = Math.floor(Math.random() * 4)
    //   if (rand === 0) {
    //     interstitial.show()
    //   }
    // }
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

  function handleRetry(showAd) {
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
      originalScore = scoreToBeat
      console.log('originalscore', originalScore)
      complete && setScoreToBeat(countNumber)
    }
    countNumber = 0
    modalVisible && setModalVisible(!modalVisible)
    // if (showAd) {
    //   let rand = Math.floor(Math.random() * 4)
    //   if (rand === 0) {
    //     interstitial.show()
    //   }
    // }
    setChange(true)
  }

  return (
    <View style={[styles.container, { backgroundColor: colorTheme.background }]}>
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={[styles.centeredView]}>
          {loading ? (
            <View style={[styles.modalView, { backgroundColor: colorTheme.button }]}>
              <ActivityIndicator
                size={'large'}
                color="darkgreen"
              ></ActivityIndicator>
            </View>
          ) : (
            <View style={[styles.modalView, { backgroundColor: colorTheme.button }]}>
              <Text style={[styles.modalText, { color: colorTheme.text }]}>
                {originalScore == null
                  ? `You completed the board in ${counter} turns!`
                  : counter < originalScore
                    ? `You beat the previous record (${originalScore}) with ${counter} turns!`
                    : `You did not beat the previous record!`}
              </Text>
              <TouchableOpacity
                style={[styles.button, styles.buttonClose, { marginBottom: 10 }]}
                onPress={() => generateNewBoard(true)}
              >
                <Text style={[styles.textStyle]}>New Board</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonClose]}
                onPress={() => handleRetry(true)}
              >
                <Text style={[styles.textStyle]}>Retry Board</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
      <Modal animationType="fade" transparent={true} visible={prompt}>
        <View style={styles.centeredView}>
          <View style={[styles.modalView, { backgroundColor: colorTheme.button }]}>
            <Text style={[styles.modalText, { color: colorTheme.text }]}>
              Are you sure you want a new board?
            </Text>
            <View style={{ flexDirection: 'row', gap: 5 }}>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.buttonClose,
                  { backgroundColor: 'green', minWidth: 75 },
                ]}
                onPress={() => generateNewBoard()}
              >
                <Text style={[styles.textStyle]}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.buttonClose,
                  { backgroundColor: 'red', minWidth: 75 },
                ]}
                onPress={() => setPrompt(false)}
              >
                <Text style={[styles.textStyle]}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <View style={styles.top}>
        {screenHeight > 740 ? (
          <Text
            style={[styles.topText, styles.highScore, { color: colorTheme.text }]}
          >
            {scoreToBeat == null
              ? `High Score: ${highScore}`
              : `Score to beat: ${scoreToBeat}`}
          </Text>
        ) : (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: screenWidth * 0.95,
            }}
          >
            <Text style={[styles.counter, { color: colorTheme.text }]}>
              {scoreToBeat == null ? counter : `${counter} / ${scoreToBeat}`}
            </Text>
            <Text
              style={[{ fontSize: 20, textAlign: 'center', color: colorTheme.text }]}
            >
              {scoreToBeat == null
                ? `High Score: ${highScore}`
                : `Score to beat: ${scoreToBeat}`}
            </Text>
          </View>
        )}
        {/* <Text
          style={[styles.topText, styles.remainText, { color: colorTheme.text }]}
        >
          Squares Remaining
        </Text> */}
        {screenHeight > 790 && (
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
        )}
      </View>
      {screenHeight > 740 && (
        <Text style={[styles.counter, { color: colorTheme.text }]}>
          {scoreToBeat == null ? counter : `${counter} / ${scoreToBeat}`}
        </Text>
      )}
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
      <View style={styles.bottom}>
        <View style={styles.extraRow}>
          <TouchableOpacity
            style={[styles.resetButton, { backgroundColor: colorTheme.button }]}
            onPress={() => (countNumber > 0 ? setPrompt(true) : generateNewBoard())}
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
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.resetButton, { backgroundColor: colorTheme.button }]}
            onPress={() => handleRetry()}
          >
            <Text style={{ userSelect: 'none', color: colorTheme.text }}>Retry</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.colorRow}>
          <TouchableOpacity
            style={[
              styles.color,
              {
                backgroundColor: selectedColor == 0 ? 'gray' : colorOption[0],
              },
              { opacity: selectedColor == 0 ? 0.1 : 1 },
            ]}
            onPress={() => selectedColor != 0 && colorChange(colorOption[0])}
          ></TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.color,
              {
                backgroundColor: selectedColor == 1 ? 'gray' : colorOption[1],
              },
              { opacity: selectedColor == 1 ? 0.1 : 1 },
            ]}
            onPress={() => selectedColor != 1 && colorChange(colorOption[1])}
          ></TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.color,
              {
                backgroundColor: selectedColor == 2 ? 'gray' : colorOption[2],
              },
              { opacity: selectedColor == 2 ? 0.1 : 1 },
            ]}
            onPress={() => selectedColor != 2 && colorChange(colorOption[2])}
          ></TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.color,
              {
                backgroundColor: selectedColor == 3 ? 'gray' : colorOption[3],
              },
              { opacity: selectedColor == 3 ? 0.1 : 1 },
            ]}
            onPress={() => selectedColor != 3 && colorChange(colorOption[3])}
          ></TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.color,
              {
                backgroundColor: selectedColor == 4 ? 'gray' : colorOption[4],
              },
              { opacity: selectedColor == 4 ? 0.1 : 1 },
            ]}
            onPress={() => selectedColor != 4 && colorChange(colorOption[4])}
          ></TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
  },
  top: {
    position: 'absolute',
    top: 0,
    justifyContent: 'center',
    // maxHeight: '20%',
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
    marginTop: 2,
    marginBottom: 2,
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
  bottom: {
    display: 'flex',
    justifyContent: 'bottom',
  },
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

export default FreePlay
