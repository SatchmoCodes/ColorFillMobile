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
  ActivityIndicator,
  Alert,
} from 'react-native'
import React from 'react'
import { useState, useEffect, useRef } from 'react'
import generateBoard from './squareGenerator.js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useIsFocused, useNavigation } from '@react-navigation/native'
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
  onSnapshot,
  increment,
  updateDoc,
} from 'firebase/firestore'
import { FIRESTORE_DB, FIREBASE_AUTH } from '../../firebaseConfig.js'
import uuid from 'react-native-uuid'
import { useColorSchemeContext } from '../../App'
import { squareColors } from './colors.js'
// import { AdEventType, InterstitialAd, TestIds } from 'react-native-google-mobile-ads'

let red = 'hsl(0, 100%, 40%)'
let orange = 'hsl(22, 100%, 50%)'
let yellow = 'hsl(60, 100%, 50%)'
let green = 'hsl(130, 100%, 15%)'
let blue = 'hsl(242, 69%, 49%)'
let playerOne = 'rgb(255,255,255)'
let playerTwo = 'rgb(30,30,30)'

let colors = [red, orange, yellow, green, blue, playerOne, playerTwo]

const colorArr = squareColors

let boardSize = 19
let sizeName = 'Medium'
let screenWidth = Dimensions.get('window').width * 0.98
let screenHeight = Dimensions.get('window').height
let gridItemSize = Math.floor(screenWidth / boardSize)
// // console.log(gridItemSize)
if (screenWidth >= 500) {
  screenWidth = Dimensions.get('window').height * 0.55
  // // console.log(screenWidth)
  gridItemSize = Math.floor(screenWidth / boardSize)
}

//temporary stuff to generate random squares
let randomArr = []

for (let i = 0; i < boardSize * boardSize; i++) {
  randomArr.push(Math.floor(Math.random() * 5))
}

let squares = generateBoard(randomArr).flat()
let tempSquareArr = JSON.parse(JSON.stringify(squares))
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

let countNumber = 0
let totalCaptured = 1
let turnCaptured = 0
let fakeCaptured = 0
let fakeTurn

let username
let boardId = uuid.v4()
let docId = null
let originalSize
let currentTurn
let ownerColorIndex
let opponentColorIndex
let tempArrCopy
let remainingSquares
let ownerNameVar
let opponentNameVar
let winner
let animationIndex = []
let randomColor

const totalTime = 10

// const interstitial = InterstitialAd.createForAdRequest(TestIds.INTERSTITIAL, {
//   requestNonPersonalizedAdsOnly: true,
// })

const PVPGame = () => {
  const { useColors } = useColorSchemeContext()
  const colorTheme = useColors()
  const navigation = useNavigation()

  const db = FIRESTORE_DB
  const auth = FIREBASE_AUTH
  const route = useRoute()
  const isFocused = useIsFocused()

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
      screenWidth = Dimensions.get('window').width * 0.98
      screenHeight = Dimensions.get('window').height
      gridItemSize = Math.floor(screenWidth / boardSize)
      if (screenWidth >= 500) {
        screenWidth = Dimensions.get('window').height * 0.55
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
  const [selectedColor, setSelectedColor] = useState(tempSquareArr[0].color)
  const [colorOption, setSelectedColorOption] = useState(colors)
  const [counter, setCounter] = useState(0)
  const [highScore, setHighScore] = useState('')
  const [squareCounter, setSquareCounter] = useState(squareCounterArr)
  const [squareAnim, setSquareAnim] = useState(squareAnimArr)
  const [change, setChange] = useState(false)
  const [complete, setComplete] = useState(false)
  const [hasRun, setHasRun] = useState(false)

  const [modalVisible, setModalVisible] = useState(false)

  //pvp specific state
  const [ownerScore, setOwnerScore] = useState(1)
  const [opponentScore, setOpponentScore] = useState(1)
  const [ownerName, setOwnerName] = useState('Owner')
  const [opponentName, setOpponentName] = useState('Opponent')
  const [ownerColor, setOwnerColor] = useState('white')
  const [opponentColor, setOpponentColor] = useState('black')
  const [ownerSelectedColor, setOwnerSelectedColor] = useState(null)
  const [opponentSelectedColor, setOpponentSelectedColor] = useState(null)
  const [turn, setTurn] = useState(null)

  const [radar, setRadar] = useState(false)
  const [loading, setLoading] = useState(true)

  const [uid, setUid] = useState(null)
  const [userName, setUserName] = useState(null)
  const [boardLoaded, setBoardLoaded] = useState(false)
  const userNameRef = useRef(null)
  const completeRef = useRef(null)
  const leaveRef = useState(null)

  //timer stuff
  const [timer, setTimer] = useState(11)
  const [intervalId, setIntervalId] = useState(null)
  const [resetTimer, setResetTimer] = useState(null)

  useEffect(() => {
    const newIntervalId = setInterval(() => {
      setTimer((prevTimer) => prevTimer - 1)
    }, 1000)

    // Save the interval ID for cleanup
    if (resetTimer) {
      setIntervalId(newIntervalId)
      setResetTimer(false)
    }

    // Clear the interval on component unmount
    return () => {
      clearInterval(newIntervalId)
    }
  }, [resetTimer])

  useEffect(() => {
    if (!resetTimer) {
      if (timer == 0) {
        if (turn == 'Owner' && userNameRef.current == ownerName) {
          // console.log('owner ran out of time')
          randomColor = Math.floor(Math.random() * 5)
          while (randomColor == colors.indexOf(ownerSelectedColor)) {
            randomColor = Math.floor(Math.random() * 5)
          }
          colorChange(colors[randomColor])
        } else if (turn == 'Opponent' && userNameRef.current == opponentName) {
          // console.log('opponent ran out of time')
          randomColor = Math.floor(Math.random() * 5)
          while (randomColor == colors.indexOf(opponentSelectedColor)) {
            randomColor = Math.floor(Math.random() * 5)
          }
          colorChange(colors[randomColor])
        }
        // console.log('no time')
      }
      if (timer == -5) {
        if (turn === 'Owner' && userNameRef.current === opponentName) {
          console.log('owner left by closing app')
          handleLeave('Owner')
        } else if (turn === 'Opponent' && userNameRef.current === ownerName) {
          console.log('opponent left by closing app')
          handleLeave('Opponent')
        }
      }
    }
  }, [timer])

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
        setUserName(doc.data().username)
        userNameRef.current = doc.data().username
      })
    }
    getUserData()
  }, [uid])

  //handle user leaving game
  useEffect(() => {
    const unsubscribeBlur = navigation.addListener('blur', () => {
      if (completeRef.current != true && leaveRef.current != true) {
        // console.log(userNameRef.current)
        // console.log(ownerNameVar)
        if (userNameRef.current === ownerNameVar) {
          leaveRef.current = true
        } else if (userNameRef.current == opponentNameVar) {
          leaveRef.current = true
        }
      }
    })
    return unsubscribeBlur
  }, [navigation])

  async function handleLeave(leaver) {
    // console.log(leaver)
    const docRef = doc(db, 'Games', docId)
    if (leaver === 'Owner') {
      try {
        const update = await updateDoc(docRef, {
          ownerLeaver: true,
        })
      } catch (error) {
        // console.log(error)
      }
    } else if (leaver === 'Opponent') {
      try {
        const update = await updateDoc(docRef, {
          opponentLeaver: true,
        })
      } catch (error) {
        // console.log(error)
      }
    }
  }

  async function initialLoad() {
    await getColor()
    if (docId != undefined && !boardLoaded) {
      const docRef = doc(db, 'Games', docId)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        setBoardLoaded(true)
        console.log(
          'initial board state: ',
          JSON.parse(docSnap.data().boardState).flat(),
        )
        let boardState = JSON.parse(docSnap.data().boardState).flat()
        tempSquareArr = JSON.parse(JSON.stringify(boardState))
        squareAnimArr = tempSquareArr.map(() => new Animated.Value(0))
        boardSize = Math.sqrt(boardState.length)
        gridItemSize = Math.floor(screenWidth / boardSize)
        setColorState(tempSquareArr)
        setSquareAnim(squareAnimArr)
        setOwnerColor(colors[docSnap.data().ownerColor])
        setOpponentColor(colors[docSnap.data().opponentColor])
        ownerColorIndex = docSnap.data().ownerColor
        opponentColorIndex = docSnap.data().opponentColor
        setOwnerSelectedColor(colors[tempSquareArr[0].colorIndex])
        setOpponentSelectedColor(
          colors[tempSquareArr[tempSquareArr.length - 1].colorIndex],
        )
        setOwnerName(docSnap.data().ownerName)
        setOpponentName(docSnap.data().opponentName)
        ownerNameVar = docSnap.data().ownerName
        opponentNameVar = docSnap.data().opponentName
        setTurn(docSnap.data().turn)
        resetColors()
        return
      }
    }
    resetColors()
  }

  useEffect(() => {
    if (route && !hasRun) {
      setHasRun(true)
      docId = route.params?.id
      boardSize = route.params?.boardSize
      console.log(boardSize)
      squareAnimArr = new Array(boardSize * boardSize).fill(0)
      // setSquareAnim(squareAnimArr)
    }
  }, [route])

  //listener for updates to board
  useEffect(() => {
    const docRef = doc(db, 'Games', docId)
    if (leaveRef.current != true) {
      const unsubscribe = onSnapshot(docRef, async (doc) => {
        if (doc.exists() && completeRef.current === null) {
          // console.log('ownerLeaver', doc.data().ownerLeaver)
          // console.log('oppleave', doc.data().opponentLeaver)
          if (doc.data().ownerLeaver === true) {
            winner = 'Opponent'
            // console.log(winner)
            completeRef.current = true
            setTimer(0)
            setResetTimer(false)
            setComplete(true)
            handleComplete()
            return
          } else if (doc.data().opponentLeaver === true) {
            winner = 'Owner'
            // console.log(winner)
            completeRef.current = true
            setTimer(0)
            setComplete(true)
            handleComplete()
            return
          }
          // // console.log(doc.data())
          let boardState = []
          boardState = JSON.parse(doc.data().boardState).flat()
          console.log('boardState', boardState)
          // // console.log('board 0', boardState[0].colorIndex)
          // // console.log('board end', boardState[boardState.length - 1].colorIndex)
          // // console.log(boardState)
          tempSquareArr = []
          tempSquareArr = [...boardState]
          if (doc.data().turn == 'Owner') {
            setTurn('Owner')
            console.log(doc.data().ownerSelectedColor)
            setOpponentSelectedColor(colors[doc.data().opponentSelectedColor])
          } else {
            setTurn('Opponent')
            setOwnerSelectedColor(colors[doc.data().ownerSelectedColor])
          }
          //timer testing
          setTimer(11)
          setResetTimer(true)

          boardState.forEach((sq) => {
            sq.color = colors[sq.colorIndex]
          })
          tempSquareArr.forEach((sq) => {
            sq.color = colors[sq.colorIndex]
          })
          //animate squares for opposite player
          if (
            doc.data().turn == 'Owner' &&
            userNameRef.current == doc.data().ownerName
          ) {
            let animatedValues = JSON.parse(doc.data().animationIndex)
            animatedValues.forEach((val) => {
              const growAnimation = Animated.timing(squareAnimArr[val], {
                toValue: 1,
                duration: 250,
                easing: Easing.linear,
                useNativeDriver: true,
              })
              const reverseAnimation = Animated.timing(squareAnimArr[val], {
                toValue: 0,
                duration: 250,
                easing: Easing.linear,
                useNativeDriver: true,
              })
              Animated.sequence([growAnimation, reverseAnimation]).start()
            })
            setSquareAnim(squareAnimArr)
          } else if (
            doc.data().turn == 'Opponent' &&
            userNameRef.current == doc.data().opponentName
          ) {
            let animatedValues = JSON.parse(doc.data().animationIndex)
            animatedValues.forEach((val) => {
              const growAnimation = Animated.timing(squareAnimArr[val], {
                toValue: 1,
                duration: 250,
                easing: Easing.linear,
                useNativeDriver: true,
              })
              const reverseAnimation = Animated.timing(squareAnimArr[val], {
                toValue: 0,
                duration: 250,
                easing: Easing.linear,
                useNativeDriver: true,
              })
              Animated.sequence([growAnimation, reverseAnimation]).start()
            })
            setSquareAnim(squareAnimArr)
          }
          squareAnimArr = tempSquareArr.map(() => new Animated.Value(0))
          setColorState(boardState)
          setOwnerScore(doc.data().ownerScore)
          setOpponentScore(doc.data().opponentScore)
          if (doc.data().ownerScore > Math.floor(tempSquareArr.length / 2)) {
            winner = 'Owner'
            // console.log(winner)
            completeRef.current = true
            setTimer(0)
            setResetTimer(false)
            setComplete(true)
            handleComplete()
            return
          } else if (
            doc.data().opponentScore > Math.floor(tempSquareArr.length / 2)
          ) {
            winner = 'Opponent'
            // console.log(winner)
            completeRef.current = true
            setTimer(0)
            setComplete(true)
            handleComplete()
            return
          } else {
            remainingSquares =
              boardState.length - (doc.data().ownerScore + doc.data().opponentScore)
            if (
              doc.data().turn == 'Owner' &&
              userNameRef.current == doc.data().opponentName
            ) {
              setRadar(true)
              // console.log('checking radar')
            } else if (
              doc.data().turn == 'Opponent' &&
              userNameRef.current == doc.data().ownerName
            ) {
              setRadar(true)
              // console.log('checking radar')
            }
          }
        }
      })
      return unsubscribe
    }
  }, [])

  useEffect(() => {
    if (radar) {
      tempArrCopy = [...tempSquareArr]
      if (turn == 'Owner') {
        fakeTurn = 'Opponent'
        for (let i = 0; i < 5; i++) {
          colorChange(colors[i])
        }
        if (fakeCaptured < 1) {
          // console.log('no squares can be captured for opponent')
          // console.log('opponentScore', opponentScore)
          // console.log('remainingsquares', remainingSquares)
          if (opponentScore <= Math.floor(tempSquareArr.length / 2)) {
            turnCaptured = remainingSquares
            noCaptureUpdate()
          }
        } else {
          // // console.log('squares can still be captured')
        }
      } else {
        fakeTurn = 'Owner'
        for (let i = 0; i < 5; i++) {
          colorChange(colors[i])
        }
        if (fakeCaptured < 1) {
          // console.log('no squares can be captured for owner')
          // console.log('ownerScore', ownerScore)
          // console.log('remainingsquares', remainingSquares)
          if (ownerScore <= Math.floor(tempSquareArr.length / 2)) {
            turnCaptured = remainingSquares
            noCaptureUpdate()
          }
        } else {
          // // console.log('squares can still be captured')
        }
      }
      tempSquareArr = [...tempArrCopy]
      setColorState(tempSquareArr)
      setRadar(false)
      fakeCaptured = 0
    }
  }, [radar])

  const noCaptureUpdate = async () => {
    // console.log('i am running')
    const docRef = doc(db, 'Games', docId)
    let ownerCaptured
    let opponentCaptured
    if (turn == 'Owner') {
      ownerCaptured = turnCaptured
      opponentCaptured = 0
    } else if (turn == 'Opponent') {
      opponentCaptured = turnCaptured
      ownerCaptured = 0
    }
    const newTempArr = JSON.parse(JSON.stringify(tempSquareArr))
    // // console.log(newTempArr)
    const newData = {
      boardState: JSON.stringify(newTempArr),
      // squareAnimArr: squareAnim,
      turn: turn,
      updatedAt: serverTimestamp(),
    }
    try {
      const update = await updateDoc(docRef, {
        ...newData,
        ownerScore: increment(ownerCaptured),
        opponentScore: increment(opponentCaptured),
      })
    } catch (error) {
      // // console.log(error)
    }
  }

  //check to see if user returned from options page
  useEffect(() => {
    const coolFunction = async () => {
      await initialLoad()
    }
    if (isFocused) {
      coolFunction()
    }
  }, [isFocused])

  // useEffect(() => {
  //     if (!hasRun) {
  //         tempSquareArr.forEach((sq, index) => {
  //             if (sq.captured) {
  //               captureCheck(sq.color, index);
  //             }
  //           });
  //         tempSquareArr.forEach(sq => {
  //             squareCounterArr.forEach(counter => {
  //                 if (sq.color == counter.color && !sq.index == 0) {
  //                   counter.count++
  //                 }
  //               })
  //           })
  //         // setSquareCounter(squareCounterArr)
  //         initialLoad()
  //         setChange(true)
  //         hasRun = true
  //         // // console.log('testing to seesasdfasdf')
  //     }
  // }, [])

  const getColor = async () => {
    let ownerSelectedIndex = colors.indexOf(ownerSelectedColor)
    let opponentSelectedIndex = colors.indexOf(opponentSelectedColor)
    try {
      const value = await AsyncStorage.getItem('color')
      if (value !== null) {
        let x = parseInt(value)
        colors = []
        for (let y = 0; y < 7; y++) {
          colors.push(colorArr[x][y])
        }
        console.log('ownerselectedindex', ownerSelectedIndex)
        console.log('opponentselectedindex', opponentSelectedIndex)
        setSelectedColorOption(colors)
        // // console.log('colros',colors)
        if (ownerColorIndex != null) {
          setOwnerColor(colors[ownerColorIndex])
          setOpponentColor(colors[opponentColorIndex])
          setOwnerSelectedColor(colors[ownerSelectedIndex])
          setOpponentSelectedColor(colors[opponentSelectedIndex])
        }
      }
    } catch (e) {
      // // console.log(e)
    }
  }

  function colorChange(color) {
    if (!radar) {
      tempSquareArr.forEach((sq, index) => {
        if (sq.captured && sq.owner == turn) {
          captureCheck(color, index)
        }
      })
      setColorState(tempSquareArr)
      animationIndex.forEach((val) => {
        const growAnimation = Animated.timing(squareAnimArr[val], {
          toValue: 1,
          duration: 250,
          easing: Easing.linear,
          useNativeDriver: true,
        })
        const reverseAnimation = Animated.timing(squareAnimArr[val], {
          toValue: 0,
          duration: 250,
          easing: Easing.linear,
          useNativeDriver: true,
        })
        Animated.sequence([growAnimation, reverseAnimation]).start()
      })
      setSquareAnim(squareAnimArr)
      if (turn == 'Owner') {
        console.log('local color set for owner', colors.indexOf(color))
        setOwnerSelectedColor(colors.indexOf(color))
      } else {
        console.log('local color set for opp', colors.indexOf(color))
        setOpponentSelectedColor(colors.indexOf(color))
      }
      updateBoard(color)
    } else {
      // // console.log('fake turn at initial:',fakeTurn)
      tempSquareArr.forEach((sq, index) => {
        if (sq.captured && sq.owner == fakeTurn) {
          captureCheck(color, index)
        }
      })
    }
    // setChange(true)
  }

  useEffect(() => {
    if (change) {
      setColorState(tempSquareArr)
      // setOwnerSelectedColor(tempSquareArr[0].color)
      // setOpponentSelectedColor(tempSquareArr[tempSquareArr.length - 1].color)
      // setSquareCounter(squareCounterArr)
      // setCounter(countNumber)
      // setSelectedColor(tempSquareArr[0].color)
      setSquareAnim(squareAnimArr)
      // setSelectedColorOption(colors)
      setChange(false)
      // updateBoard()
    }
  }, [change])

  async function updateBoard(color) {
    const docRef = doc(db, 'Games', docId)
    let nextTurn
    let ownerCaptured
    let opponentCaptured
    let newData
    const newTempArr = JSON.parse(JSON.stringify(tempSquareArr))
    if (turn == 'Owner') {
      nextTurn = 'Opponent'
      ownerCaptured = turnCaptured
      opponentCaptured = 0
      newData = {
        boardState: JSON.stringify(newTempArr),
        ownerSelectedColor: colors.indexOf(color),
        turn: nextTurn,
        updatedAt: serverTimestamp(),
        animationIndex: JSON.stringify(animationIndex),
      }
      setTurn('Opponent')
    } else if (turn == 'Opponent') {
      nextTurn = 'Owner'
      opponentCaptured = turnCaptured
      ownerCaptured = 0
      newData = {
        boardState: JSON.stringify(newTempArr),
        opponentSelectedColor: colors.indexOf(color),
        turn: nextTurn,
        updatedAt: serverTimestamp(),
        animationIndex: JSON.stringify(animationIndex),
      }
      setTurn('Owner')
    }

    console.log('newtemparr', newTempArr)
    try {
      const update = await updateDoc(docRef, {
        ...newData,
        ownerScore: increment(ownerCaptured),
        opponentScore: increment(opponentCaptured),
      })
    } catch (error) {
      // // console.log(error)
    }
    turnCaptured = 0
    animationIndex = []
  }

  async function handleComplete() {
    const docRef = doc(db, 'Games', docId)
    // console.log(ownerName)
    const ownerQuery = query(
      collection(db, 'Users'),
      where('username', '==', ownerNameVar),
    )
    const opponentQuery = query(
      collection(db, 'Users'),
      where('username', '==', opponentNameVar),
    )
    const ownerSnapshot = await getDocs(ownerQuery)
    const opponentSnapshot = await getDocs(opponentQuery)
    let ownerRef
    let opponentRef
    if (!ownerSnapshot.empty) {
      const ownerId = ownerSnapshot.docs[0].id
      ownerRef = doc(db, 'Users', ownerId)
    }
    if (!opponentSnapshot.empty) {
      const opponentId = opponentSnapshot.docs[0].id
      opponentRef = doc(db, 'Users', opponentId)
    }
    let newWinStreak
    if (userNameRef.current == ownerNameVar) {
      if (winner == 'Owner') {
        // console.log('owner win')
        if (
          ownerSnapshot.docs[0].data().currentWinStreak + 1 >
          ownerSnapshot.docs[0].data().bestWinStreak
        ) {
          newWinStreak = ownerSnapshot.docs[0].data().currentWinStreak + 1
        } else {
          newWinStreak = ownerSnapshot.docs[0].data().bestWinStreak
        }
        try {
          await updateDoc(ownerRef, {
            wins: increment(1),
            currentWinStreak: increment(1),
            bestWinStreak: newWinStreak,
          })
        } catch (error) {
          // console.log(error)
        }
        try {
          await updateDoc(opponentRef, {
            losses: increment(1),
            currentWinStreak: 0,
          })
        } catch (error) {
          // console.log(error)
        }
      }
    } else if (userNameRef.current == opponentNameVar) {
      if (winner == 'Opponent') {
        // console.log('opponent win')
        if (
          opponentSnapshot.docs[0].data().currentWinStreak + 1 >
          opponentSnapshot.docs[0].data().bestWinStreak
        ) {
          newWinStreak = opponentSnapshot.docs[0].data().currentWinStreak + 1
        } else {
          newWinStreak = opponentSnapshot.docs[0].data().bestWinStreak
        }
        try {
          await updateDoc(opponentRef, {
            wins: increment(1),
            currentWinStreak: increment(1),
            bestWinStreak: newWinStreak,
          })
        } catch (error) {
          // console.log(error)
        }
        try {
          await updateDoc(ownerRef, {
            losses: increment(1),
            currentWinStreak: 0,
          })
        } catch (error) {
          // console.log(error)
        }
      }
    }
  }

  function captureCheck(color, index) {
    // tempSquareArr[index].color = color
    //right
    if (tempSquareArr[index + 1] && tempSquareArr[index + 1].captured == false) {
      if (
        color == tempSquareArr[index + 1].color &&
        tempSquareArr[index].rowIndex == tempSquareArr[index + 1].rowIndex
      ) {
        if (radar) {
          // // console.log('fake captured right')
          // // console.log(tempSquareArr[index])
          // // console.log(tempSquareArr[index + 1])
          fakeCaptured++
          return
        }
        // tempSquareArr[index + 1].color = color
        tempSquareArr[index + 1].captured = true
        tempSquareArr[index + 1].owner = turn
        animationIndex.push(index + 1)
        //   !radar && updateSquareCount(color)
        updateSquareCounter(color)
        totalCaptured++
        turnCaptured++
        //   !radar && totalCaptured++
        //   !radar ? data.squareGrowth[index + 1] = 'captured' : data.squareGrowth[index + 1] = 'predicted'
        //   setGrowth(data.squareGrowth)
        tempSquareArr[index + 1].colIndex <= boardSize &&
          captureCheck(color, index + 1)
      }
    }
    //left
    if (tempSquareArr[index - 1] && tempSquareArr[index - 1].captured == false) {
      if (
        color == tempSquareArr[index - 1].color &&
        tempSquareArr[index].rowIndex == tempSquareArr[index - 1].rowIndex
      ) {
        if (radar) {
          // // console.log('fake captured left')
          // // console.log(tempSquareArr[index])
          // // console.log(tempSquareArr[index - 1])
          fakeCaptured++
          return
        }
        // tempSquareArr[index - 1].color = color
        tempSquareArr[index - 1].captured = true
        tempSquareArr[index - 1].owner = turn
        animationIndex.push(index - 1)
        updateSquareCounter(color)
        totalCaptured++
        turnCaptured++
        tempSquareArr[index - 1].colIndex <= boardSize &&
          captureCheck(color, index - 1)
      }
    }
    //down
    if (
      tempSquareArr[index + boardSize] &&
      tempSquareArr[index + boardSize].captured == false
    ) {
      if (color == tempSquareArr[index + boardSize].color) {
        if (radar) {
          // // console.log('fake captured down')
          // // console.log(tempSquareArr[index])
          // // console.log(tempSquareArr[index + boardSize])
          fakeCaptured++
          return
        }
        // tempSquareArr[index + boardSize].color = color
        tempSquareArr[index + boardSize].captured = true
        tempSquareArr[index + boardSize].owner = turn
        animationIndex.push(index + boardSize)
        updateSquareCounter(color)
        totalCaptured++
        turnCaptured++
        tempSquareArr[index + boardSize].rowIndex <= boardSize &&
          captureCheck(color, index + boardSize)
      }
    }
    //up
    if (
      tempSquareArr[index - boardSize] &&
      tempSquareArr[index - boardSize].captured == false
    ) {
      if (color == tempSquareArr[index - boardSize].color) {
        if (radar) {
          // // console.log('fake captured up')
          // // console.log(tempSquareArr[index])
          // // console.log(tempSquareArr[index - boardSize])
          fakeCaptured++
          return
        }
        // tempSquareArr[index - boardSize].color = color
        tempSquareArr[index - boardSize].captured = true
        tempSquareArr[index - boardSize].owner = turn
        animationIndex.push(index - boardSize)
        updateSquareCounter(color)
        totalCaptured++
        turnCaptured++
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
    setLoading(false)
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

  const OwnerView = () => {
    return (
      <View
        style={[
          styles.playerView,
          {
            opacity: turn == 'Owner' ? 1 : 0.5,
          },
        ]}
      >
        <Text style={{ fontSize: 20, textAlign: 'center', color: colorTheme.text }}>
          {ownerName}
        </Text>
        <View
          style={[
            styles.fakeSquare,
            {
              backgroundColor: ownerColor,
            },
          ]}
        >
          <Text style={styles.fakeText}>{ownerScore}</Text>
        </View>
      </View>
    )
  }

  const OpponentView = () => {
    return (
      <View
        style={[
          styles.playerView,
          {
            opacity: turn == 'Owner' ? 0.5 : 1,
          },
        ]}
      >
        <Text style={{ fontSize: 20, textAlign: 'center', color: colorTheme.text }}>
          {opponentName}
        </Text>
        <View
          style={[
            styles.fakeSquare,
            {
              backgroundColor: opponentColor,
            },
          ]}
        >
          <Text style={styles.fakeText}>{opponentScore}</Text>
        </View>
      </View>
    )
  }

  function handleEnd() {
    // interstitial.show()
    navigation.navigate('PVPMenu')
  }

  return (
    <View style={[styles.container, { backgroundColor: colorTheme.background }]}>
      <Modal animationType="fade" transparent={true} visible={complete}>
        <View style={styles.centeredView}>
          <View
            style={[
              styles.modalView,
              {
                borderWidth: 1,
                borderColor:
                  winner === 'Owner' && userName == ownerName
                    ? 'green'
                    : winner === 'Opponent' && userName == opponentName
                      ? 'green'
                      : winner === 'Opponent' && userName == ownerName
                        ? 'red'
                        : winner === 'Owner' && userName == opponentName
                          ? 'red'
                          : '',
                backgroundColor: colorTheme.button,
              },
            ]}
          >
            <Text
              style={{
                fontSize: 30,
                color:
                  winner === 'Owner' && userName == ownerName
                    ? 'green'
                    : winner === 'Opponent' && userName == opponentName
                      ? 'green'
                      : winner === 'Opponent' && userName == ownerName
                        ? 'red'
                        : winner === 'Owner' && userName == opponentName
                          ? 'red'
                          : '',
              }}
            >
              {winner === 'Owner' && userName == ownerName
                ? 'Victory'
                : winner === 'Opponent' && userName == opponentName
                  ? 'Victory'
                  : winner === 'Opponent' && userName == ownerName
                    ? 'Defeat'
                    : winner === 'Owner' && userName == opponentName
                      ? 'Defeat'
                      : ''}
            </Text>
            <Text
              style={[styles.modalText, { fontSize: 20, color: colorTheme.text }]}
            >
              {winner === 'Owner'
                ? `${ownerName} wins the game!`
                : `${opponentName} wins the game!`}
            </Text>
            <Text
              style={[styles.modalText, { fontSize: 20, color: colorTheme.text }]}
            >
              Score:{' '}
              {userName != opponentName
                ? `${ownerScore} - ${opponentScore}`
                : `${opponentScore} - ${ownerScore}`}
            </Text>
            <TouchableOpacity
              style={[styles.button, styles.buttonClose]}
              onPress={() => handleEnd()}
            >
              <Text>Return to Menu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <View style={styles.top}>
        <View style={[styles.playerNames, { width: gridItemSize * boardSize }]}>
          {userName != opponentName ? <OwnerView /> : <OpponentView />}
          <View style={{ justifyContent: 'center', alignItems: 'center' }}>
            {screenHeight > 700 ? (
              <Text style={{ fontSize: 15, color: colorTheme.text }}>VS</Text>
            ) : (
              <Text
                style={{
                  fontSize: 25,
                  width: 50,
                  textAlign: 'center',
                  color: colorTheme.text,
                }}
              >
                {timer < 1 ? 0 : timer - 1}
              </Text>
            )}
          </View>
          {userName != opponentName ? <OpponentView /> : <OwnerView />}
        </View>
        <View>
          {screenHeight > 700 && (
            <Text
              style={{ fontSize: 25, textAlign: 'center', color: colorTheme.text }}
            >
              {timer < 1 ? 0 : timer - 1}
            </Text>
          )}
        </View>
        {screenHeight > 790 && (
          <>
            {userName != opponentName ? (
              <View style={[styles.colorRow, turn == 'Owner' && { opacity: 0.1 }]}>
                <TouchableOpacity
                  style={[
                    styles.color,
                    {
                      backgroundColor:
                        opponentSelectedColor == colors[0] ? 'gray' : colorOption[0],
                    },
                    { opacity: opponentSelectedColor == colors[0] ? 0.1 : 1 },
                  ]}
                ></TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.color,
                    {
                      backgroundColor:
                        opponentSelectedColor == colors[1] ? 'gray' : colorOption[1],
                    },
                    { opacity: opponentSelectedColor == colors[1] ? 0.1 : 1 },
                  ]}
                ></TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.color,
                    {
                      backgroundColor:
                        opponentSelectedColor == colors[2] ? 'gray' : colorOption[2],
                    },
                    { opacity: opponentSelectedColor == colors[2] ? 0.1 : 1 },
                  ]}
                ></TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.color,
                    {
                      backgroundColor:
                        opponentSelectedColor == colors[3] ? 'gray' : colorOption[3],
                    },
                    { opacity: opponentSelectedColor == colors[3] ? 0.1 : 1 },
                  ]}
                ></TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.color,
                    {
                      backgroundColor:
                        opponentSelectedColor == colors[4] ? 'gray' : colorOption[4],
                    },
                    { opacity: opponentSelectedColor == colors[4] ? 0.1 : 1 },
                  ]}
                ></TouchableOpacity>
              </View>
            ) : (
              <View
                style={[styles.colorRow, turn == 'Opponent' && { opacity: 0.1 }]}
              >
                <TouchableOpacity
                  style={[
                    styles.color,
                    {
                      backgroundColor:
                        ownerSelectedColor == colors[0] ? 'gray' : colorOption[0],
                    },
                    { opacity: ownerSelectedColor == colors[0] ? 0.1 : 1 },
                  ]}
                ></TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.color,
                    {
                      backgroundColor:
                        ownerSelectedColor == colors[1] ? 'gray' : colorOption[1],
                    },
                    { opacity: ownerSelectedColor == colors[1] ? 0.1 : 1 },
                  ]}
                ></TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.color,
                    {
                      backgroundColor:
                        ownerSelectedColor == colors[2] ? 'gray' : colorOption[2],
                    },
                    { opacity: ownerSelectedColor == colors[2] ? 0.1 : 1 },
                  ]}
                ></TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.color,
                    {
                      backgroundColor:
                        ownerSelectedColor == colors[3] ? 'gray' : colorOption[3],
                    },
                    { opacity: ownerSelectedColor == colors[3] ? 0.1 : 1 },
                  ]}
                ></TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.color,
                    {
                      backgroundColor:
                        ownerSelectedColor == colors[4] ? 'gray' : colorOption[4],
                    },
                    { opacity: ownerSelectedColor == colors[4] ? 0.1 : 1 },
                  ]}
                ></TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>
      {loading ? (
        <View
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: screenWidth,
            height: screenWidth,
          }}
        >
          <ActivityIndicator style={{}} size="large" color="darkgreen" />
        </View>
      ) : (
        <>
          {userName != opponentName ? (
            <View
              style={[styles.board, screenWidth > 500 && { maxWidth: screenWidth }]}
            >
              {colorState.map((sq, index) => {
                return (
                  // <View key={index} style={[styles.square, {backgroundColor: sq.color}]}></View>
                  //
                  <Animated.View
                    key={index}
                    style={[
                      styles.square,
                      sq.captured && { zIndex: 2 },
                      {
                        backgroundColor:
                          sq.captured && sq.owner == 'Owner'
                            ? ownerColor
                            : sq.captured && sq.owner == 'Opponent'
                              ? opponentColor
                              : colorState[index].color,
                        width: gridItemSize,
                        height: gridItemSize,
                        transform: [
                          {
                            scale:
                              squareAnim[index] == undefined
                                ? 1
                                : squareAnim[index].interpolate({
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
          ) : (
            <View
              style={[styles.board, screenWidth > 500 && { maxWidth: screenWidth }]}
            >
              {colorState
                .slice()
                .reverse()
                .map((sq, index) => {
                  return (
                    // <View key={index} style={[styles.square, {backgroundColor: sq.color}]}></View>
                    //
                    <Animated.View
                      key={index}
                      style={[
                        styles.square,
                        sq.captured && { zIndex: 2 },
                        {
                          backgroundColor:
                            sq.captured && sq.owner == 'Owner'
                              ? ownerColor
                              : sq.captured && sq.owner == 'Opponent'
                                ? opponentColor
                                : colorState[colorState.length - 1 - index].color,
                          width: gridItemSize,
                          height: gridItemSize,
                          transform: [
                            {
                              scale:
                                squareAnim[squareAnim.length - 1 - index] ==
                                undefined
                                  ? 1
                                  : squareAnim[
                                      squareAnim.length - 1 - index
                                    ].interpolate({
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
          )}
        </>
      )}
      {userName != opponentName ? (
        <View style={[styles.colorRow, turn == 'Opponent' && { opacity: 0.1 }]}>
          <TouchableOpacity
            style={[
              styles.color,
              {
                backgroundColor:
                  ownerSelectedColor == colors[0] ? 'gray' : colorOption[0],
              },
              { opacity: ownerSelectedColor == colors[0] ? 0.1 : 1 },
            ]}
            onPress={() =>
              turn == 'Owner' &&
              userName == ownerName &&
              ownerSelectedColor != colors[0] &&
              colorChange(colorOption[0])
            }
          ></TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.color,
              {
                backgroundColor:
                  ownerSelectedColor == colors[1] ? 'gray' : colorOption[1],
              },
              { opacity: ownerSelectedColor == colors[1] ? 0.1 : 1 },
            ]}
            onPress={() =>
              turn == 'Owner' &&
              userName == ownerName &&
              ownerSelectedColor != colors[1] &&
              colorChange(colorOption[1])
            }
          ></TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.color,
              {
                backgroundColor:
                  ownerSelectedColor == colors[2] ? 'gray' : colorOption[2],
              },
              { opacity: ownerSelectedColor == colors[2] ? 0.1 : 1 },
            ]}
            onPress={() =>
              turn == 'Owner' &&
              userName == ownerName &&
              ownerSelectedColor != colors[2] &&
              colorChange(colorOption[2])
            }
          ></TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.color,
              {
                backgroundColor:
                  ownerSelectedColor == colors[3] ? 'gray' : colorOption[3],
              },
              { opacity: ownerSelectedColor == colors[3] ? 0.1 : 1 },
            ]}
            onPress={() =>
              turn == 'Owner' &&
              userName == ownerName &&
              ownerSelectedColor != colors[3] &&
              colorChange(colorOption[3])
            }
          ></TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.color,
              {
                backgroundColor:
                  ownerSelectedColor == colors[4] ? 'gray' : colorOption[4],
              },
              { opacity: ownerSelectedColor == colors[4] ? 0.1 : 1 },
            ]}
            onPress={() =>
              turn == 'Owner' &&
              userName == ownerName &&
              ownerSelectedColor != colors[4] &&
              colorChange(colorOption[4])
            }
          ></TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.colorRow, turn == 'Owner' && { opacity: 0.1 }]}>
          <TouchableOpacity
            style={[
              styles.color,
              {
                backgroundColor:
                  opponentSelectedColor == colors[0] ? 'gray' : colorOption[0],
              },
              { opacity: opponentSelectedColor == colors[0] ? 0.1 : 1 },
            ]}
            onPress={() =>
              turn == 'Opponent' &&
              userName == opponentName &&
              opponentSelectedColor != colors[0] &&
              colorChange(colorOption[0])
            }
          ></TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.color,
              {
                backgroundColor:
                  opponentSelectedColor == colors[1] ? 'gray' : colorOption[1],
              },
              { opacity: opponentSelectedColor == colors[1] ? 0.1 : 1 },
            ]}
            onPress={() =>
              turn == 'Opponent' &&
              userName == opponentName &&
              opponentSelectedColor != colors[1] &&
              colorChange(colorOption[1])
            }
          ></TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.color,
              {
                backgroundColor:
                  opponentSelectedColor == colors[2] ? 'gray' : colorOption[2],
              },
              { opacity: opponentSelectedColor == colors[2] ? 0.1 : 1 },
            ]}
            onPress={() =>
              turn == 'Opponent' &&
              userName == opponentName &&
              opponentSelectedColor != colors[2] &&
              colorChange(colorOption[2])
            }
          ></TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.color,
              {
                backgroundColor:
                  opponentSelectedColor == colors[3] ? 'gray' : colorOption[3],
              },
              { opacity: opponentSelectedColor == colors[3] ? 0.1 : 1 },
            ]}
            onPress={() =>
              turn == 'Opponent' &&
              userName == opponentName &&
              opponentSelectedColor != colors[3] &&
              colorChange(colorOption[3])
            }
          ></TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.color,
              {
                backgroundColor:
                  opponentSelectedColor == colors[4] ? 'gray' : colorOption[4],
              },
              { opacity: opponentSelectedColor == colors[4] ? 0.1 : 1 },
            ]}
            onPress={() =>
              turn == 'Opponent' &&
              userName == opponentName &&
              opponentSelectedColor != colors[4] &&
              colorChange(colorOption[4])
            }
          ></TouchableOpacity>
        </View>
      )}
    </View>
  )
}

export default PVPGame

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
  playerNames: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 5,
    marginBottom: 5,
    fontSize: 20,
  },
  playerView: {
    marginBottom: 10,
  },
  fakeSquare: {
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    marginLeft: 'auto',
    marginRight: 'auto',
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
    // backgroundColor: 'blue',
    width: gridItemSize,
    height: gridItemSize,
  },
  //bottom buttons
  extraRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: 5,
    marginBottom: 5,
    justifyContent: 'center',
  },
  resetButton: {
    marginTop: 10,
    width: screenWidth <= 320 ? screenWidth * 0.18 : 65,
    height: screenWidth <= 320 ? screenWidth * 0.18 : 65,
    borderWidth: 1,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorRow: {
    // flex: 1,
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 10,
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
    padding: 10,
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
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
  },
})
