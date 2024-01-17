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
} from 'firebase/firestore'
import { FIRESTORE_DB } from '../../firebaseConfig'
import { useColorSchemeContext } from '../../App'

const sizeOptions = [
  { label: 'Small', value: 'Small' },
  { label: 'Medium', value: 'Medium' },
  { label: 'Large', value: 'Large' },
]

const gamemodeOptions = [
  { label: 'Free Play', value: 'FreePlay' },
  { label: 'Progressive', value: 'Progressive' },
  { label: 'Player vs Player', value: 'PVP' },
]

const queryOptions = [
  { label: 'Win Rate', value: 'Win Rate' },
  { label: 'Wins-Losses', value: 'Wins-Losses' },
  { label: 'Current Winstreak', value: 'Current Winstreak' },
  { label: 'Best Winstreak', value: 'Best Winstreak' },
]

const animationDelay = 50
const animationDuration = 500
let animatedValues = []
let newAnimatedValues = []

let lowestScoresMap = new Map()
let prevLowestScores = null
let updatedIndexArr = []

let screenWidth = Dimensions.get('window').width

const Leaderboard = () => {
  const { useColors } = useColorSchemeContext()
  const colors = useColors()

  const navigation = useNavigation()
  const route = useRoute()

  const [size, setSize] = useState('Medium')
  const [gamemode, setGamemode] = useState('FreePlay')
  const [userSearch, setUserSearch] = useState('')
  const [queryOptionState, setQueryOptionState] = useState('Win Rate')
  const [scores, setScores] = useState([])
  const [pvpResults, setPVPResults] = useState([])

  const [sizeFocus, setSizeFocus] = useState(false)
  const [gamemodeFocus, setGamemodeFocus] = useState(false)
  const [queryFocus, setQueryFocus] = useState(false)

  // const [animatedValues, setAnimatedValues] = useState(null)
  const [update, setUpdate] = useState(false)

  // const animatedValues = useRef(scores.map(() => new Animated.Value(0)))

  useEffect(() => {
    if (scores) {
      scores.forEach((_, index) => {
        // console.log(animatedValues[index]._value)
        Animated.timing(animatedValues[index], {
          toValue: 1,
          duration: animationDuration,
          delay: index * animationDelay,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }).start()
      })
    }
  }, [scores])

  useEffect(() => {
    // lowestScoresMap = new Map()
    prevLowestScores = null
    console.log('hi')
    setUpdate(true)
  }, [size, gamemode, queryOptionState])

  // const sizeLabel = () => {
  //   if (size || sizeFocus) {
  //     return (
  //       <Text style={[styles.label, sizeFocus && { color: 'blue' }]}>
  //         Dropdown label
  //       </Text>
  //     );
  //   }
  //   return null;
  // };

  // const gamemodeLabel = () => {
  //   if (gamemode || gamemodeFocus) {
  //     return (
  //       <Text style={[styles.label, gamemodeFocus && { color: 'blue' }]}>
  //         Dropdown label
  //       </Text>
  //     );
  //   }
  //   return null;
  // };

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
    console.log(gamemode)
    if (gamemode != 'PVP') {
      const q = query(
        collection(db, 'Scores'),
        where('gamemode', '==', gamemode),
        where('size', '==', size),
        orderBy('score', 'asc'),
        orderBy('createdAt', 'asc'),
      )
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        lowestScoresMap = new Map()
        updatedIndexArr = []
        querySnapshot.forEach((doc) => {
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
        newAnimatedValues = []
        if (prevLowestScores != null) {
          const prevScoreList = Array.from(prevLowestScores.values())
          console.log(scoreList)
          console.log(prevScoreList)
          let y = 0 //number to add to previous scores to offset index in case new score came in
          for (let x = 0; x < scoreList.length; x++) {
            // console.log(`scorelist[${x}]`,scoreList[x])
            // console.log(`prevscoreList${x}`,prevScoreList[x])
            if (
              prevScoreList[x + y] &&
              scoreList[x].boardId != prevScoreList[x - y].boardId
            ) {
              // console.log('boardId not equal here',x)
              updatedIndexArr.push(0)
              y++

              // } else if (
              //   prevScoreList[x + y] &&
              //   scoreList[x].score != prevScoreList[x - y].score
              // ) {
              //   // console.log('score not equal here',x)
              //   updatedIndexArr.push(0)
              //   y++
            } else {
              updatedIndexArr.push(1)
            }
          }
          updatedIndexArr.forEach((val) => {
            newAnimatedValues.push(new Animated.Value(val))
          })
        } else {
          scoreList.forEach((val) => {
            newAnimatedValues.push(new Animated.Value(0))
          })
        }
        animatedValues = []
        animatedValues = [...newAnimatedValues]
        setScores(scoreList)
        // setAnimatedValues(newAnimatedValues)
        prevLowestScores = new Map([...lowestScoresMap])
        // console.log(scoreList)
        updatedIndexArr = []
      })
      setUpdate(false)
      return unsubscribe
    } else {
      const q = query(collection(db, 'Users'))
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const queryArr = []
        querySnapshot.forEach((doc) => {
          if (queryOptionState == 'Win Rate') {
            queryArr.push({
              id: doc.id,
              ...doc.data(),
              queryData:
                Math.round(
                  (doc.data().wins / (doc.data().wins + doc.data().losses) +
                    Number.EPSILON) *
                    100,
                ) + '%',
            })
          } else if (queryOptionState == 'Wins-Losses') {
            queryArr.push({
              id: doc.id,
              ...doc.data(),
              queryData: doc.data().wins + ' - ' + doc.data().losses,
            })
          } else if (queryOptionState == 'Current Winstreak') {
            queryArr.push({
              id: doc.id,
              ...doc.data(),
              queryData: doc.data().currentWinStreak,
            })
          } else if (queryOptionState == 'Best Winstreak') {
            queryArr.push({
              id: doc.id,
              ...doc.data(),
              queryData: doc.data().bestWinStreak,
            })
          }
        })
        // console.log(queryArr)
        let topScores = queryArr.filter((a) => a.wins + a.losses > 9)
        let bottomScores = queryArr.filter((a) => a.wins + a.losses <= 9)
        bottomScores.sort((a, b) => a.wins + a.losses > b.wins + b.losses)
        topScores.sort((a, b) => parseInt(a.queryData) - parseInt(b.queryData))
        // if (queryOptionState == 'Win Rate') {
        //   queryArr = queryArr.filter((a) => a.wins + a.losses > 9)
        // }
        topScores.reverse()
        bottomScores.reverse()
        let fullArr = topScores.concat(bottomScores)
        newAnimatedValues = []
        if (prevLowestScores != null) {
          console.log('prevscores', prevLowestScores)
          let y = 0
          for (let i = 0; i < fullArr.length; i++) {
            if (
              prevLowestScores[i - y] &&
              fullArr[i].id != prevLowestScores[i - y].id
            ) {
              updatedIndexArr.push(0)
              y++
            } else {
              updatedIndexArr.push(1)
            }
          }
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
  }, [update])

  async function handleLink(id) {
    navigation.navigate('BoardInfo', { id })
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={{ marginTop: 50, fontSize: 30, color: colors.text }}>
        Leaderboard
      </Text>
      <Text style={{ marginTop: 25, fontSize: 15, color: colors.text }}>
        Search Options
      </Text>
      <View style={styles.searchOptions}>
        {/* { sizeLabel() } */}
        <View style={styles.optionCol}>
          <Text style={{ textAlign: 'center', color: colors.text }}>Gamemode</Text>
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
            <Text style={{ textAlign: 'center', color: colors.text }}>
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
            <Text style={{ textAlign: 'center', color: colors.text }}>
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
        <View style={styles.table}>
          {scores.length == 0 ? (
            <EmptyRow />
          ) : (
            <>
              <TopRow />
              <FlatList
                data={scores}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
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
                        {item.createdBy}
                      </Text>
                    </View>
                    {/* <View style={[styles.tableCol, {width: '25%', maxWidth: '25%', alignItems: 'center', padding: 15}]}>
                <Text style={{textAlign: 'center', padding: 5}}>{item.data.gamemode}</Text>
              </View> */}
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
                        { width: '20%', maxWidth: '20%', justifyContent: 'center' },
                      ]}
                    >
                      {/* <TouchableOpacity style={{padding: 5}} onPress={() => handleLink(item.id, item.data.size)}> */}
                      <TouchableOpacity
                        style={styles.button}
                        onPress={() => handleLink(item.boardId)}
                      >
                        <Text
                          style={[
                            styles.buttonText,
                            { textAlign: 'center', color: colors.text },
                          ]}
                        >
                          Info
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </Animated.View>
                )}
              />
            </>
          )}
        </View>
      ) : (
        <View style={styles.table}>
          {scores.length == 0 ? (
            <EmptyRow />
          ) : (
            <>
              <TopRow />
              <FlatList
                data={scores}
                keyExtractor={(item) => item.id}
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

                          color: colors.text,
                        }}
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
    height: 50,
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
    fontSize: 16,
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
