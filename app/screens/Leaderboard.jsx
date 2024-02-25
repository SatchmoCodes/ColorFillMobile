import React, { useState, useEffect, useRef } from 'react'
import { useNavigation, useRoute } from '@react-navigation/native'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Animated,
  Easing,
  Dimensions,
  ActivityIndicator,
} from 'react-native'
import { Dropdown } from 'react-native-element-dropdown'
import {
  query,
  collection,
  doc,
  addDoc,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  startAfter,
  limit,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore'
import { FIRESTORE_DB, FIREBASE_AUTH } from '../../firebaseConfig'
import { useColorSchemeContext } from '../../App'
import uuid from 'react-native-uuid'

const sizeOptions = [
  { label: 'Small', value: 'Small' },
  { label: 'Medium', value: 'Medium' },
  { label: 'Large', value: 'Large' },
]

const gamemodeOptions = [
  { label: 'Free Play', value: 'FreePlay' },
  { label: 'Progressive', value: 'Progressive' },
  { label: 'PVP', value: 'PVP' },
]

const queryOptions = [
  { label: 'Win Rate', value: 'Win Rate' },
  { label: 'Wins-Losses', value: 'Wins-Losses' },
  { label: 'Current Winstreak', value: 'Current Winstreak' },
  { label: 'Best Winstreak', value: 'Best Winstreak' },
]

const animationDelay = 25
const animationDuration = 500
let animatedValues = []
let newAnimatedValues = []

let lowestScoresMap = new Map()
let prevLowestScores = null
let lastScore = null
let updatedIndexArr = []

let newValue = false
const limitValue = 25
let lastStartIndex = 0
let prevLoadLength = 0
let y //value for equating offset of old leaderboard values against new leaderboard values
let pageLoadVar = false

let snapshotQuery = null

const db = FIRESTORE_DB
const auth = FIREBASE_AUTH

let screenWidth = Dimensions.get('window').width
let unknownUser = '???'

// async function createScores() {
//   let boardId
//   let score
//   let size = 'Small'
//   let boardData = ''
//   let createdBy = 'Satchmo'
//   let uid = 'sRev1ct3vEM9dXoaBfrPTOhBY9V2'
//   for (let i = 0; i < 50; i++) {
//     score = Math.floor(Math.random() * 20) + 10
//     boardId = uuid.v4()
//     for (let x = 0; x < 144; x++) {
//       let int = Math.floor(Math.random() * 5)
//       boardData += int.toString()
//     }
//     const newScore = await addDoc(collection(db, 'Scores'), {
//       boardId: boardId,
//       score: score,
//       size: size,
//       boardData: boardData,
//       createdBy: createdBy,
//       uid: uid,
//       gamemode: 'FreePlay',
//       createdAt: serverTimestamp(),
//     })
//   }
// }

// await createScores()

// async function createUsers() {
//   let winValue = Math.floor(Math.random() * 100) + 10
//   let lossValue = Math.floor(Math.random() * 100)
//   const newUser = await addDoc(collection(db, 'Users'), {
//     uid: uuid.v4(),
//     username: uuid.v4().toString(),
//     wins: winValue,
//     losses: lossValue,
//     totalGames: winValue + lossValue,
//     currentWinStreak: Math.floor(Math.random() * 10),
//     bestWinStreak: Math.floor(Math.random() * 10),
//     createdAt: serverTimestamp(),
//   })
// }

// let incrementor

// for (let i = 0; i < 50; i++) {
//   incrementor = setTimeout(() => {
//     createUsers()
//   }, 1000)
// }

const Leaderboard = () => {
  const { useColors, userColorScheme } = useColorSchemeContext()
  const colors = useColors()

  const navigation = useNavigation()
  const route = useRoute()

  const [uid, setUid] = useState(null)
  const [userName, setUserName] = useState(null)

  const [size, setSize] = useState('Medium')
  const [gamemode, setGamemode] = useState('FreePlay')
  const [userSearch, setUserSearch] = useState('')
  const [queryOptionState, setQueryOptionState] = useState('Win Rate')
  const [scores, setScores] = useState([])
  const [pvpResults, setPVPResults] = useState([])

  const [sizeFocus, setSizeFocus] = useState(false)
  const [gamemodeFocus, setGamemodeFocus] = useState(false)
  const [queryFocus, setQueryFocus] = useState(false)
  const [update, setUpdate] = useState(false)
  const [queryUpdate, setQueryUpdate] = useState(false)

  const [dataChange, setDataChange] = useState(false)
  const [pagingLoad, setPagingLoad] = useState(false)
  const [endReached, setEndReached] = useState(false)

  const [block, setBlock] = useState(false)

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

  useEffect(() => {
    if (scores) {
      setDataChange(false)
      scores.forEach((_, index) => {
        // console.log(animatedValues[index]._value)
        Animated.timing(animatedValues[index], {
          toValue: 1,
          duration: animationDuration,
          delay: !newValue ? (index - prevLoadLength) * animationDelay : 200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }).start()
      })
    }
  }, [scores])

  useEffect(() => {
    // lowestScoresMap = new Map()
    prevLowestScores = null
    newValue = false
    lastScore = null
    prevLoadLength = 0
    snapshotQuery = null
    lastStartIndex = 0
    setEndReached(false)
    setUpdate(true)
    setDataChange(true)
  }, [size, gamemode, queryOptionState])

  const EmptyRow = () => {
    return (
      <View
        style={[
          styles.tableRow,
          {
            padding: 10,
            justifyContent: 'center',
            backgroundColor: colors.tableRow,
          },
        ]}
      >
        <Text style={{ color: colors.text }}>No Scores Found</Text>
      </View>
    )
  }

  const TopRow = () => {
    return (
      <>
        {gamemode != 'PVP' ? (
          <View style={[styles.tableRow, { backgroundColor: colors.tableTop }]}>
            <View style={[styles.tableCol, { width: '15%', maxWidth: '15%' }]}>
              <Text
                style={{
                  textAlign: 'center',
                  paddingTop: 10,
                  paddingBottom: 10,
                  color: colors.text,
                }}
              >
                Rank
              </Text>
            </View>
            <View style={[styles.tableCol, { width: '45%', maxWidth: '45%' }]}>
              <Text
                style={{
                  textAlign: 'center',
                  paddingTop: 10,
                  paddingBottom: 10,
                  color: colors.text,
                }}
              >
                User
              </Text>
            </View>
            <View style={[styles.tableCol, { width: '20%', maxWidth: '20%' }]}>
              <Text
                style={{
                  textAlign: 'center',
                  paddingTop: 10,
                  paddingBottom: 10,
                  color: colors.text,
                }}
              >
                Score
              </Text>
            </View>

            <View style={[styles.tableCol, { width: '20%', maxWidth: '20%' }]}>
              <Text
                style={{
                  textAlign: 'center',
                  paddingTop: 10,
                  paddingBottom: 10,
                  color: colors.text,
                }}
              >
                Stats
              </Text>
            </View>
          </View>
        ) : (
          <View style={[styles.tableRow, { backgroundColor: colors.tableTop }]}>
            <View style={[styles.tableCol, { width: '15%', maxWidth: '15%' }]}>
              <Text
                style={{
                  textAlign: 'center',
                  paddingTop: 10,
                  paddingBottom: 10,
                  color: colors.text,
                }}
              >
                Rank
              </Text>
            </View>
            <View style={[styles.tableCol, { width: '42.5%', maxWidth: '42.5%' }]}>
              <Text
                style={{
                  textAlign: 'center',
                  paddingTop: 10,
                  paddingBottom: 10,
                  color: colors.text,
                }}
              >
                Username
              </Text>
            </View>
            <View style={[styles.tableCol, { width: '42.5%', maxWidth: '42.5%' }]}>
              <Text
                style={{
                  textAlign: 'center',
                  paddingTop: 10,
                  paddingBottom: 10,
                  color: colors.text,
                }}
              >
                {queryOptionState}
              </Text>
            </View>
          </View>
        )}
      </>
    )
  }

  const db = FIRESTORE_DB

  useEffect(() => {
    if (gamemode == 'Progressive') {
      setSize('Default')
    } else if (gamemode == 'FreePlay') {
      setSize('Medium')
    }
  }, [gamemode])

  useEffect(() => {
    if (gamemode != 'PVP') {
      // let q
      // console.log('lastscore?', lastScore)
      // console.log('i am running')
      // if (lastScore === null) {
      //   q = query(
      //     collection(db, 'Scores'),
      //     where('gamemode', '==', gamemode),
      //     where('size', '==', size),
      //     orderBy('score', 'asc'),
      //     orderBy('createdAt', 'asc'),
      //     limit(limitValue),
      //   )
      // } else {
      //   q = query(
      //     collection(db, 'Scores'),
      //     where('gamemode', '==', gamemode),
      //     where('size', '==', size),
      //     orderBy('score', 'asc'),
      //     orderBy('createdAt', 'asc'),
      //     startAfter(lastScore.score, lastScore.createdAt),
      //     limit(limitValue),
      //   )
      // }

      if (snapshotQuery === null) {
        snapshotQuery = query(
          collection(db, 'Scores'),
          where('gamemode', '==', gamemode),
          where('size', '==', size),
          where('highScore', '==', true),
          orderBy('score', 'asc'),
          orderBy('createdAt', 'asc'),
          limit(limitValue),
        )
      }
      let localQuery = snapshotQuery
      if (queryUpdate) {
        console.log('haha balls')
        setQueryUpdate(false)
        return
      }

      const unsubscribe = onSnapshot(localQuery, (querySnapshot) => {
        lowestScoresMap = new Map()
        // console.log('scorelist?', scores)
        // if (scores.length > 0) {
        //   let mapArrCopy = Array.from(lowestScoresMap.values())
        //   console.log('maparrCopy', mapArrCopy)
        //   let slicedMapCopy = mapArrCopy.slice(scores.length)
        //   console.log('slicedMapCopy', slicedMapCopy)
        //   lowestScoresMap = new Map(slicedMapCopy.map((obj) => [obj.id, obj]))
        //   console.log('lowestMap', lowestScoresMap)
        // } else {
        //   lowestScoresMap = new Map()
        // }

        updatedIndexArr = []
        querySnapshot.forEach((doc) => {
          console.log(doc.data())
          const boardId = doc.data().boardId
          const score = doc.data().score

          // If boardId is not in the map or the current score is lower than the stored one, update the map
          if (
            !lowestScoresMap.has(boardId) ||
            score < lowestScoresMap.get(boardId).score
          ) {
            if (gamemode == 'Progressive') {
              lowestScoresMap.set(boardId, {
                id: doc.id,
                ...doc.data(),
                score:
                  doc.data().score > 0 ? `+${doc.data().score}` : doc.data().score,
              })
            } else {
              lowestScoresMap.set(boardId, {
                id: doc.id,
                ...doc.data(),
              })
            }
          }
        })
        const scoreList = Array.from(lowestScoresMap.values())
        if (scoreList.length < limitValue) {
          setEndReached(true)
        } else {
          setEndReached(false)
        }
        newAnimatedValues = []
        let prevScoreList

        console.log('is prevscore true', prevLowestScores)
        if (prevLowestScores != null) {
          console.log('prevLowest Scores (map) before check', prevLowestScores)
          prevScoreList = Array.from(prevLowestScores.values())
          console.log('prevScoreList after creating array', prevScoreList)
          // lastStartIndex = Math.max(prevScoreList.length - limitValue, 0)
          // lastStartIndex = prevScoreList.length - limitValue
          if (prevScoreList.length < limitValue) {
            lastStartIndex = 0
          }
          // else {
          //   console.log(
          //     'ballsvalue',
          //     Math.floor(prevScoreList.length / limitValue) - 1,
          //   )
          //   lastStartIndex =
          //     Math.floor(prevScoreList.length / limitValue) * limitValue
          // }
          console.log('last25start', lastStartIndex)
          // const slicedPrevList = prevScoreList.slice(
          //   //if you scroll to the end, its consistently off by 1 so this accounts for that
          //   scoreList.length < limitValue
          //     ? -(scoreList.length - 1)
          //     : -scoreList.length,
          // )
          const slicedPrevList = prevScoreList.slice(lastStartIndex)
          console.log('scoreList', scoreList)
          console.log('slicedPrevList', slicedPrevList)
          y = 0 //number to add to previous scores to offset index in case new score came in
          for (let x = 0; x < scoreList.length; x++) {
            // console.log(`scorelist[${x}]`,scoreList[x])
            // console.log(`prevscoreList${x}`,prevScoreList[x])
            if (
              slicedPrevList[x - y] &&
              scoreList[x].boardId != slicedPrevList[x - y].boardId
            ) {
              // console.log('boardId not equal here',x)
              updatedIndexArr.push(0)
              if (!queryUpdate) {
                console.log('query update false')
                newValue = true
              }
              if (y > 1) {
                newValue = false
              }
              y++

              // } else if (
              //   prevScoreList[x + y] &&
              //   scoreList[x].score != prevScoreList[x - y].score
              // ) {
              //   // console.log('score not equal here',x)
              //   updatedIndexArr.push(0)
              //   y++
            } else if (slicedPrevList[x - y] === undefined && y == 0) {
              updatedIndexArr.push(0)
              y++
            } else {
              updatedIndexArr.push(1)
            }
          }
          updatedIndexArr.forEach((val) => {
            newAnimatedValues.push(new Animated.Value(val))
          })
          let prevAnimatedValues = new Array(prevScoreList.length).fill(
            new Animated.Value(1),
          )
          console.log('y', y)
          console.log('is paging load true?', pagingLoad)
          console.log('is queryUpdate true?', queryUpdate)
          console.log('pageloadvar', pageLoadVar)
          if (pageLoadVar) {
            console.log('new load section')
            prevLoadLength = prevScoreList.length //value for animation timing offset
            // let joinedArr = [...prevScoreList, ...scoreList]
            // joinedArr = joinedArr.sort((a, b) => a.score < b.score)
            // setScores([...prevScoreList, ...scoreList])
            // console.log('joinedArr', joinedArr)

            animatedValues = [...prevAnimatedValues, ...newAnimatedValues]
            setScores([...prevScoreList, ...scoreList])
            prevLowestScores = new Map([...prevLowestScores, ...lowestScoresMap])
            lastStartIndex =
              Math.floor(prevScoreList.length / limitValue) * limitValue
            console.log('last25 after new load: ', lastStartIndex)
            console.log('prevLowestScores after new load', prevLowestScores)
            setPagingLoad(false)
            pageLoadVar = false
          } else {
            console.log('block section')
            setBlock(true)

            //if theres more than 25 scores, set previous values
            if (prevScoreList.length >= limitValue) {
              console.log('idk how this section is running but it is')
              let prevAnimatedValues = new Array(lastStartIndex).fill(
                new Animated.Value(1),
              )
              console.log('prevanimatedlength', prevAnimatedValues.length)
              console.log('newanimatedlength', newAnimatedValues.length)
              animatedValues = [...prevAnimatedValues, ...newAnimatedValues]
              let allPreviousValues = prevScoreList.slice(0, lastStartIndex)
              console.log('lastStartIndex', lastStartIndex)
              console.log('allprevvalues', allPreviousValues)
              let allPreviousMap = new Map(
                allPreviousValues.map((obj) => [obj.id, obj]),
              )
              setScores([...allPreviousValues, ...scoreList])
              prevLowestScores = new Map([...allPreviousMap, ...lowestScoresMap])
              console.log('prevlowestscores', prevLowestScores)
            }
            // if theres less than 25 scores, no previous values exist
            else {
              console.log('this section running')
              animatedValues = [...newAnimatedValues]
              prevLowestScores = new Map([...lowestScoresMap])
              setScores([...scoreList])
            }
          }
        } else {
          console.log('else block running')
          scoreList.forEach((val) => {
            newAnimatedValues.push(new Animated.Value(0))
          })
          animatedValues = [...newAnimatedValues]
          console.log(scoreList)
          setScores(scoreList)
          prevLowestScores = new Map([...lowestScoresMap])
        }
        updatedIndexArr = []
        pagingLoad && setPagingLoad(false)
      })
      setPagingLoad(false)
      setUpdate(false)
      setQueryUpdate(false)
      return unsubscribe
    } else {
      let q = query(
        collection(db, 'Users'),
        orderBy('totalGames', 'desc'),
        limit(50),
      )

      // if (lastScore === null) {
      //   q = query(collection(db, 'Users'))
      // } else {
      //   let q = query(
      //     collection(db, 'Users'),
      //     orderBy('totalGames', 'desc'),
      //     limit(50)
      //     // orderBy('createdAt', 'asc'),
      //     // startAfter(lastScore.totalGames, lastScore.createdAt),
      //     // limit(limitValue),
      //   )
      // }

      const unsubscribe = onSnapshot(q, async (querySnapshot) => {
        let userStats
        try {
          const userQuery = query(
            collection(db, 'Users'),
            where('username', '==', userName),
          )
          let docSnap = await getDocs(userQuery)
          console.log(docSnap.docs[0].data())
          userStats = docSnap.docs[0]
        } catch (error) {
          return error
        }
        console.log('userstats', userStats)
        const queryArr = []
        let userInfo = []
        querySnapshot.forEach((doc) => {
          if (queryOptionState == 'Win Rate') {
            queryArr.push({
              id: doc.id,
              ...doc.data(),
              queryData:
                Math.floor(
                  (doc.data().wins / (doc.data().wins + doc.data().losses) +
                    Number.EPSILON) *
                    100,
                ) + '%',
            })
            if (userInfo.length === 0) {
              userInfo.push({
                id: userStats.id,
                ...userStats.data(),
                queryData:
                  Math.floor(
                    (userStats.data().wins /
                      (userStats.data().wins + userStats.data().losses) +
                      Number.EPSILON) *
                      100,
                  ) + '%',
              })
            }
          } else if (queryOptionState == 'Wins-Losses') {
            queryArr.push({
              id: doc.id,
              ...doc.data(),
              queryData: doc.data().wins + ' - ' + doc.data().losses,
            })
            if (userInfo.length === 0) {
              userInfo.push({
                id: userStats.id,
                ...userStats.data(),
                queryData: userStats.data().wins + ' - ' + userStats.data().losses,
              })
            }
          } else if (queryOptionState == 'Current Winstreak') {
            queryArr.push({
              id: doc.id,
              ...doc.data(),
              queryData: doc.data().currentWinStreak,
            })
            if (userInfo.length === 0) {
              userInfo.push({
                id: userStats.id,
                ...userStats.data(),
                queryData: userStats.data().currentWinStreak,
              })
            }
          } else if (queryOptionState == 'Best Winstreak') {
            queryArr.push({
              id: doc.id,
              ...doc.data(),
              queryData: doc.data().bestWinStreak,
            })
            if (userInfo.length === 0) {
              userInfo.push({
                id: userStats.id,
                ...userStats.data(),
                queryData: userStats.data().bestWinStreak,
              })
            }
          }
        })
        let topScores = queryArr.filter((a) => a.wins + a.losses > 9)
        let bottomScores = queryArr.filter((a) => a.wins + a.losses <= 9)
        bottomScores.sort((a, b) => a.wins + a.losses > b.wins + b.losses)
        topScores.sort((a, b) => parseInt(a.queryData) - parseInt(b.queryData))
        topScores.reverse()
        bottomScores.reverse()
        let fullArr = topScores.concat(bottomScores)
        fullArr.forEach((val, index) => {
          if (val.wins + val.losses > 9) {
            val.rank = index + 1
          } else {
            val.rank = 'n/a'
          }

          if (val.username == userName) {
            if (userInfo[0].wins + userInfo[0].losses > 9) {
              userInfo[0].rank = index + 1
            } else {
              userInfo[0].rank = 'n/a'
            }
          }
        })
        if (userInfo[0].rank == undefined) {
          if (userInfo[0].wins + userInfo[0].losses > 9) {
            userInfo[0].rank = '<50'
          } else {
            userInfo[0].rank = 'n/a'
          }
        }
        console.log(userInfo)
        fullArr.unshift(userInfo[0])
        console.log('fullArr', fullArr)
        newAnimatedValues = []
        let comparisonId = null
        if (prevLowestScores != null) {
          console.log('prevscores', prevLowestScores)
          y = 0
          for (let i = 0; i < fullArr.length; i++) {
            if (comparisonId == prevLowestScores[i - y].id) {
              updatedIndexArr[i - 1] = 0
              y--
            }
            if (
              prevLowestScores[i - y] &&
              fullArr[i].id != prevLowestScores[i - y].id
            ) {
              comparisonId = fullArr[i].id
              updatedIndexArr.push(0)
              y++
            } else if (prevLowestScores[i - y] === undefined && y === 0) {
              updatedIndexArr.push(0)
              y++
            } else {
              updatedIndexArr.push(1)
            }
          }
          console.log('y', y)
          updatedIndexArr.forEach((val) => {
            newAnimatedValues.push(new Animated.Value(val))
          })
        } else {
          fullArr.forEach((val) => {
            newAnimatedValues.push(new Animated.Value(0))
          })
        }
        animatedValues = []
        animatedValues = [...newAnimatedValues]
        // fullArr.reverse()
        setScores(fullArr)
        prevLowestScores = [...fullArr]
        updatedIndexArr = []
      })
      setUpdate(false)
      return unsubscribe
    }
  }, [update, queryUpdate])

  // const loadMore = async () => {
  //   console.log('loading more')
  //   newValue = false
  //   if (scores.length === 0) {
  //     return
  //   }
  //   setPagingLoad(true)
  //   console.log(scores)
  //   lastScore = scores[scores.length - 1]
  //   if (gamemode != 'PVP') {
  //     let q = query(
  //       collection(db, 'Scores'),
  //       where('gamemode', '==', gamemode),
  //       where('size', '==', size),
  //       orderBy('score', 'asc'),
  //       orderBy('createdAt', 'asc'),
  //       startAfter(lastScore.score, lastScore.createdAt),
  //       limit(limitValue),
  //     )
  //     const querySnapshot = await getDocs(q)
  //     console.log('snap', querySnapshot)

  //     if (!querySnapshot.empty) {
  //       console.log('not empty')
  //       lowestScoresMap = new Map()
  //       updatedIndexArr = []
  //       querySnapshot.forEach((doc) => {
  //         console.log('doc', doc)
  //         const boardId = doc.data().boardId
  //         const score = doc.data().score

  //         // If boardId is not in the map or the current score is lower than the stored one, update the map
  //         if (
  //           !lowestScoresMap.has(boardId) ||
  //           score < lowestScoresMap.get(boardId).score
  //         ) {
  //           if (gamemode == 'Progressive') {
  //             lowestScoresMap.set(boardId, {
  //               id: doc.id,
  //               ...doc.data(),
  //               score:
  //                 doc.data().score > 0 ? `+${doc.data().score}` : doc.data().score,
  //             })
  //           } else {
  //             lowestScoresMap.set(boardId, {
  //               id: doc.id,
  //               ...doc.data(),
  //             })
  //           }
  //         }
  //       })
  //       const scoreList = Array.from(lowestScoresMap.values())
  //       newAnimatedValues = []
  //       let prevScoreList
  //       if (prevLowestScores != null) {
  //         prevScoreList = Array.from(prevLowestScores.values())
  //         console.log(scoreList)
  //         console.log(prevScoreList)
  //         let y = 0 //number to add to previous scores to offset index in case new score came in
  //         for (let x = 0; x < scoreList.length; x++) {
  //           // console.log(`scorelist[${x}]`,scoreList[x])
  //           // console.log(`prevscoreList${x}`,prevScoreList[x])
  //           if (
  //             prevScoreList[x - y] &&
  //             scoreList[x].boardId != prevScoreList[x - y].boardId
  //           ) {
  //             // console.log('boardId not equal here',x)
  //             updatedIndexArr.push(0)
  //             y++
  //           } else {
  //             updatedIndexArr.push(1)
  //           }
  //         }
  //         updatedIndexArr.forEach((val) => {
  //           newAnimatedValues.push(new Animated.Value(val))
  //         })
  //       } else {
  //         scoreList.forEach((val) => {
  //           newAnimatedValues.push(new Animated.Value(0))
  //         })
  //       }
  //       let prevAnimatedValues = new Array(prevScoreList.length).fill(
  //         new Animated.Value(1),
  //       )
  //       let conjoinedAnimatedArr = [...prevAnimatedValues, ...newAnimatedValues]
  //       console.log('anim length', conjoinedAnimatedArr.length)
  //       let conjoinedScoreArr = [...prevScoreList, ...scoreList]
  //       console.log('score length', conjoinedScoreArr.length)
  //       animatedValues = []
  //       animatedValues = [...prevAnimatedValues, ...newAnimatedValues]
  //       prevLoadLength = prevScoreList.length
  //       console.log('prevlengthasdf', prevLoadLength)
  //       console.log(scoreList)
  //       setScores([...prevScoreList, ...scoreList])
  //       // setAnimatedValues(newAnimatedValues)
  //       prevLowestScores = new Map([...prevLowestScores, ...lowestScoresMap])
  //       console.log('prevLowestScores after', prevLowestScores)
  //       // console.log(scoreList)
  //       updatedIndexArr = []
  //     }
  //     snapshotQuery = query(
  //       collection(db, 'Scores'),
  //       where('gamemode', '==', gamemode),
  //       where('size', '==', size),
  //       orderBy('score', 'asc'),
  //       orderBy('createdAt', 'asc'),
  //       limitValue + prevLoadLength < 251
  //         ? limit(limitValue + prevLoadLength)
  //         : limit(limitValue),
  //     )
  //     console.log(snapshotQuery)
  //     setPagingLoad(false)
  //     setQueryUpdate(true)
  //     setUpdate(false)
  //     snapshotQuery = query(
  //       collection(db, 'Scores'),
  //       where('gamemode', '==', gamemode),
  //       where('size', '==', size),
  //       orderBy('score', 'asc'),
  //       orderBy('createdAt', 'asc'),
  //       startAfter(lastScore.score, lastScore.createdAt),
  //       limit(limitValue),
  //     )

  //     // } else {
  //     //   let q = query(
  //     //     collection(db, 'Users'),
  //     //     orderBy('totalGames', 'desc'),
  //     //     orderBy('createdAt', 'asc'),
  //     //     startAfter(lastScore.totalGames, lastScore.createdAt),
  //     //     limit(limitValue),
  //     //   )

  //     //   const querySnapshot = await getDocs(q)
  //     //   if (!querySnapshot.empty) {
  //     //     const queryArr = []
  //     //     let userInfo = []
  //     //     querySnapshot.forEach((doc) => {
  //     //       if (queryOptionState == 'Win Rate') {
  //     //         queryArr.push({
  //     //           id: doc.id,
  //     //           ...doc.data(),
  //     //           queryData:
  //     //             Math.round(
  //     //               (doc.data().wins / (doc.data().wins + doc.data().losses) +
  //     //                 Number.EPSILON) *
  //     //                 100,
  //     //             ) + '%',
  //     //         })
  //     //         if (doc.data().username == userName) {
  //     //           userInfo.push({
  //     //             id: doc.id,
  //     //             ...doc.data(),
  //     //             queryData:
  //     //               Math.round(
  //     //                 (doc.data().wins / (doc.data().wins + doc.data().losses) +
  //     //                   Number.EPSILON) *
  //     //                   100,
  //     //               ) + '%',
  //     //           })
  //     //         }
  //     //       } else if (queryOptionState == 'Wins-Losses') {
  //     //         queryArr.push({
  //     //           id: doc.id,
  //     //           ...doc.data(),
  //     //           queryData: doc.data().wins + ' - ' + doc.data().losses,
  //     //         })
  //     //         if (doc.data().username == userName) {
  //     //           userInfo.push({
  //     //             id: doc.id,
  //     //             ...doc.data(),
  //     //             queryData: doc.data().wins + ' - ' + doc.data().losses,
  //     //           })
  //     //         }
  //     //       } else if (queryOptionState == 'Current Winstreak') {
  //     //         queryArr.push({
  //     //           id: doc.id,
  //     //           ...doc.data(),
  //     //           queryData: doc.data().currentWinStreak,
  //     //         })
  //     //         if (doc.data().username == userName) {
  //     //           userInfo.push({
  //     //             id: doc.id,
  //     //             ...doc.data(),
  //     //             queryData: doc.data().currentWinStreak,
  //     //           })
  //     //         }
  //     //       } else if (queryOptionState == 'Best Winstreak') {
  //     //         queryArr.push({
  //     //           id: doc.id,
  //     //           ...doc.data(),
  //     //           queryData: doc.data().bestWinStreak,
  //     //         })
  //     //         if (doc.data().username == userName) {
  //     //           userInfo.push({
  //     //             id: doc.id,
  //     //             ...doc.data(),
  //     //             queryData: doc.data().bestWinStreak,
  //     //           })
  //     //         }
  //     //       }
  //     //     })
  //     //     let topScores = queryArr.filter((a) => a.wins + a.losses > 9)
  //     //     let bottomScores = queryArr.filter((a) => a.wins + a.losses <= 9)
  //     //     bottomScores.sort((a, b) => a.wins + a.losses > b.wins + b.losses)
  //     //     topScores.sort((a, b) => parseInt(a.queryData) - parseInt(b.queryData))
  //     //     topScores.reverse()
  //     //     bottomScores.reverse()
  //     //     let fullArr = topScores.concat(bottomScores)
  //     //     fullArr.forEach((val, index) => {
  //     //       if (val.wins + val.losses > 9) {
  //     //         val.rank = index + 1
  //     //       } else {
  //     //         val.rank = 'n/a'
  //     //       }

  //     //       if (val.username == userName) {
  //     //         if (userInfo[0].wins + userInfo[0].losses > 9) {
  //     //           userInfo[0].rank = index + 1
  //     //         } else {
  //     //           userInfo[0].rank = 'n/a'
  //     //         }
  //     //       }
  //     //     })
  //     //     console.log(userInfo)
  //     //     fullArr.unshift(userInfo[0])
  //     //     console.log(fullArr)
  //     //     newAnimatedValues = []
  //     //     if (prevLowestScores != null) {
  //     //       console.log('prevscores', prevLowestScores)
  //     //       let y = 0
  //     //       for (let i = 0; i < fullArr.length; i++) {
  //     //         if (
  //     //           prevLowestScores[i - y] &&
  //     //           fullArr[i].id != prevLowestScores[i - y].id
  //     //         ) {
  //     //           updatedIndexArr.push(0)
  //     //           y++
  //     //         } else {
  //     //           updatedIndexArr.push(1)
  //     //         }
  //     //       }
  //     //       updatedIndexArr.forEach((val) => {
  //     //         newAnimatedValues.push(new Animated.Value(val))
  //     //       })
  //     //     } else {
  //     //       fullArr.forEach((val) => {
  //     //         newAnimatedValues.push(new Animated.Value(0))
  //     //       })
  //     //     }
  //     //     animatedValues = []
  //     //     animatedValues = [...newAnimatedValues]
  //     //     // fullArr.reverse()
  //     //     setScores([...prevLowestScores, ...fullArr])
  //     //     prevLowestScores = [...prevLowestScores, ...fullArr]
  //     //     updatedIndexArr = []

  //     //     setUpdate(false)
  //     //   }
  //   }
  // }

  const loadMore = () => {
    console.log('start load more')
    if (scores.length === 0 || scores.length < limitValue || block || endReached) {
      setBlock(false)
      return
    }
    console.log('load more running')
    newValue = false

    console.log(scores)
    lastScore = scores[scores.length - 1]
    snapshotQuery = query(
      collection(db, 'Scores'),
      where('gamemode', '==', gamemode),
      where('size', '==', size),
      where('highScore', '==', true),
      orderBy('score', 'asc'),
      orderBy('createdAt', 'asc'),
      startAfter(lastScore.score, lastScore.createdAt),
      limit(limitValue),
    )
    setPagingLoad(true)
    pageLoadVar = true
    setQueryUpdate(true)
  }

  async function handleLink(id) {
    navigation.navigate('BoardInfo', { id })
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={{ marginTop: 50, fontSize: 30, color: colors.text }}>
        Leaderboard
      </Text>
      <Text
        style={{ marginTop: 25, marginBottom: 10, fontSize: 20, color: colors.text }}
      >
        Search Options
      </Text>
      <View style={styles.searchOptions}>
        {/* { sizeLabel() } */}
        <View style={styles.optionCol}>
          <Text style={{ fontSize: 15, textAlign: 'center', color: colors.text }}>
            Gamemode
          </Text>
          <Dropdown
            style={[
              styles.dropdown,
              gamemodeFocus && { borderColor: 'blue' },
              { backgroundColor: 'white' },
            ]}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            inputSearchStyle={styles.inputSearchStyle}
            iconStyle={styles.iconStyle}
            data={gamemodeOptions}
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder={!gamemodeFocus ? 'Select item' : '...'}
            value={gamemode}
            onFocus={() => setGamemodeFocus(true)}
            onBlur={() => setGamemodeFocus(false)}
            onChange={(item) => {
              setGamemode(item.value)
              setGamemodeFocus(false)
            }}
          />
        </View>
        {gamemode == 'FreePlay' && (
          <View style={styles.optionCol}>
            <Text style={{ fontSize: 15, textAlign: 'center', color: colors.text }}>
              Board Size
            </Text>
            <Dropdown
              style={[
                styles.dropdown,
                sizeFocus && { borderColor: 'blue' },
                { backgroundColor: 'white' },
              ]}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              inputSearchStyle={styles.inputSearchStyle}
              iconStyle={styles.iconStyle}
              data={sizeOptions}
              maxHeight={300}
              labelField="label"
              valueField="value"
              placeholder={!sizeFocus ? 'Select item' : '...'}
              value={size}
              onFocus={() => setSizeFocus(true)}
              onBlur={() => setSizeFocus(false)}
              onChange={(item) => {
                setSize(item.value)
                setSizeFocus(false)
              }}
            />
          </View>
        )}
        {gamemode == 'PVP' && (
          <View style={styles.optionCol}>
            <Text style={{ fontSize: 15, textAlign: 'center', color: colors.text }}>
              Query Options
            </Text>
            <Dropdown
              style={[
                styles.dropdown,
                queryOptions && { borderColor: 'blue' },
                { backgroundColor: 'white' },
              ]}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              inputSearchStyle={styles.inputSearchStyle}
              iconStyle={styles.iconStyle}
              data={queryOptions}
              maxHeight={300}
              labelField="label"
              valueField="value"
              placeholder={!gamemodeFocus ? 'Select item' : '...'}
              value={queryOptionState}
              onFocus={() => setQueryFocus(true)}
              onBlur={() => setQueryFocus(false)}
              onChange={(item) => {
                setQueryOptionState(item.value)
                setQueryFocus(false)
              }}
            />
          </View>
        )}
      </View>
      {/* <View style={[styles.bottomOptions]}>
        <Text>Username: </Text>
        <TextInput style={styles.userInput} onChangeText={(e) => setUserSearch(e)}></TextInput>
      </View> */}
      {gamemode != 'PVP' ? (
        <>
          {dataChange ? (
            <ActivityIndicator
              style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
              color="darkgreen"
              size="large"
            />
          ) : (
            <View style={styles.table}>
              {scores.length == 0 ? (
                <EmptyRow />
              ) : (
                <>
                  <TopRow />
                  <FlatList
                    data={scores}
                    keyExtractor={(item, index) => index.toString()}
                    showsVerticalScrollIndicator={false}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.1}
                    renderItem={({ item, index }) => (
                      <Animated.View
                        style={[
                          styles.tableRow,
                          {
                            opacity: animatedValues[index],
                            backgroundColor: colors.tableRow,
                            transform: [
                              {
                                translateX: animatedValues[index].interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [-50, 0],
                                }),
                              },
                            ],
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.tableCol,
                            {
                              width: '15%',
                              maxWidth: '15%',
                              alignItems: 'center',
                              justifyContent: 'center',
                              paddingTop: 15,
                              paddingBottom: 15,
                            },
                          ]}
                        >
                          <Text
                            style={{
                              textAlign: 'center',

                              color: colors.text,
                            }}
                          >
                            {index + 1}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.tableCol,
                            {
                              width: '25%',
                              maxWidth: '50%',
                              alignItems: 'center',
                              justifyContent: 'center',
                              paddingTop: 15,
                              paddingBottom: 15,
                            },
                          ]}
                        >
                          <Text
                            style={{
                              textAlign: 'center',

                              color: colors.text,
                            }}
                          >
                            {item.createdBy == null ? unknownUser : item.createdBy}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.tableCol,
                            {
                              width: '20%',
                              maxWidth: '20%',
                              alignItems: 'center',
                              justifyContent: 'center',
                              paddingTop: 15,
                              paddingBottom: 15,
                            },
                          ]}
                        >
                          <Text
                            style={{
                              textAlign: 'center',

                              color:
                                gamemode == 'Progressive' && item.score < 0
                                  ? 'green'
                                  : gamemode == 'Progressive' && item.score > 0
                                    ? 'red'
                                    : colors.text,
                            }}
                          >
                            {item.score}
                          </Text>
                        </View>
                        {/* <View style={[styles.tableCol]}>
                <Text style={{textAlign: 'center', padding: 5}}>Medium</Text>
              </View> */}
                        <View
                          style={[
                            styles.tableCol,
                            {
                              width: '20%',
                              maxWidth: '20%',
                              justifyContent: 'center',
                            },
                          ]}
                        >
                          {/* <TouchableOpacity style={{padding: 5}} onPress={() => handleLink(item.id, item.data.size)}> */}
                          <TouchableOpacity
                            style={styles.button}
                            onPress={() => handleLink(item.boardId)}
                          >
                            <Text
                              style={[styles.buttonText, { textAlign: 'center' }]}
                            >
                              View
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </Animated.View>
                    )}
                  />
                  {pagingLoad && (
                    <ActivityIndicator
                      style={{
                        flex: 1,
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                      color="darkgreen"
                      size="large"
                    />
                  )}
                </>
              )}
            </View>
          )}
        </>
      ) : (
        <>
          {dataChange ? (
            <ActivityIndicator
              style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
              color="darkgreen"
              size="large"
            />
          ) : (
            <View style={styles.table}>
              {scores.length == 0 ? (
                <EmptyRow />
              ) : (
                <>
                  <TopRow />
                  <FlatList
                    data={scores}
                    showsVerticalScrollIndicator={false}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item, index }) => (
                      <Animated.View
                        style={[
                          styles.tableRow,
                          {
                            opacity: animatedValues[index],
                            backgroundColor: colors.tableRow,
                            transform: [
                              {
                                translateX: animatedValues[index].interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [-50, 0],
                                }),
                              },
                            ],
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.tableCol,
                            {
                              width: '15%',
                              maxWidth: '15%',
                              alignItems: 'center',
                              justifyContent: 'center',
                              paddingTop: 15,
                              paddingBottom: 15,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              userColorScheme == 'light' &&
                                index == 0 && {
                                  textShadowColor: 'black',
                                  textShadowRadius: 1,
                                  textShadowOffset: {
                                    width: 1,
                                    height: 1,
                                  },
                                },
                              {
                                textAlign: 'center',

                                color: index == 0 ? colors.username : colors.text,
                              },
                            ]}
                          >
                            {item.rank}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.tableCol,
                            {
                              width: '42.5%',
                              maxWidth: '42.5%',
                              alignItems: 'center',
                              justifyContent: 'center',
                              paddingTop: 15,
                              paddingBottom: 15,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              userColorScheme == 'light' &&
                                index == 0 && {
                                  textShadowColor: 'black',
                                  textShadowRadius: 1,
                                  textShadowOffset: {
                                    width: 1,
                                    height: 1,
                                  },
                                },
                              {
                                textAlign: 'center',

                                color: index == 0 ? colors.username : colors.text,
                              },
                            ]}
                          >
                            {item.username}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.tableCol,
                            {
                              width: '42.5%',
                              maxWidth: '42.5%',
                              alignItems: 'center',
                              justifyContent: 'center',
                              paddingTop: 15,
                              paddingBottom: 15,
                            },
                          ]}
                        >
                          <Text
                            style={{
                              textAlign: 'center',

                              color:
                                queryOptionState == 'Win Rate' &&
                                parseInt(item.queryData) > 50 &&
                                item.wins + item.losses > 9
                                  ? 'green'
                                  : queryOptionState == 'Win Rate' &&
                                      parseInt(item.queryData) < 50 &&
                                      item.wins + item.losses > 9
                                    ? 'red'
                                    : colors.text,
                            }}
                          >
                            {item.wins + item.losses < 10
                              ? `${item.wins + item.losses}/10 Games Played`
                              : item.queryData}
                          </Text>
                        </View>
                      </Animated.View>
                    )}
                  />
                </>
              )}
            </View>
          )}
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // justifyContent: 'center',
    alignItems: 'center',
  },
  searchOptions: {
    flexDirection: 'row',
    gap: 20,
  },
  bottomOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  userInput: {
    minWidth: 150,
    borderWidth: 1,
    padding: 10,
  },
  table: {
    width: '95%',
    borderWidth: 1,
    marginTop: 50,
    maxHeight: '50%',
  },
  tableRow: {
    display: 'flex',
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tableCol: {
    flexGrow: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  dropdown: {
    height: 60,
    borderColor: 'gray',
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 10,
    minWidth: 150,
  },
  //dropdown styles
  label: {
    position: 'absolute',
    backgroundColor: 'white',
    left: 22,
    top: 8,
    zIndex: 999,
    paddingHorizontal: 8,
    fontSize: 14,
  },
  placeholderStyle: {
    fontSize: 16,
  },
  selectedTextStyle: {
    fontSize: 15,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
  button: {
    padding: 7.5,
    fontSize: 5,
    borderRadius: 50,
    width: screenWidth > 350 ? 60 : '50%',
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

export default Leaderboard
