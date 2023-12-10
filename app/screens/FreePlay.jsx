import { View, Text, StyleSheet, FlatList, Dimensions, Pressable, Modal, Animated, Easing } from 'react-native'
import React from 'react'
import { useState, useEffect, useRef } from 'react'
import generateBoard from './squareGenerator.js'
import AsyncStorage from '@react-native-async-storage/async-storage';

let red = 'hsl(0, 100%, 40%)'
let orange = 'hsl(22, 100%, 50%)'
let yellow = 'hsl(60, 100%, 50%)'
let green = 'hsl(130, 100%, 15%)'
let blue = 'hsl(242, 69%, 49%)'

let colors = [red, orange, yellow, green, blue]

const colorArr = [
  ['hsl(0, 100%, 40%)','hsl(22, 100%, 50%)','hsl(60, 100%, 50%)','hsl(130, 100%, 15%)','hsl(242, 69%, 49%)'],
  ['hsl(33, 90.8%, 12.7%)','hsl(33, 89.8%, 26.9%)','hsl(25, 95.4%, 42.7%)','hsl(221, 69.2%, 43.3%)','hsl(213, 68.6%, 90%)'],
  ['hsl(358,83%,35%)','hsl(2,72%,51%)','hsl(211,88%,32%)','hsl(0,0%,39%)','hsl(0,0%,14%)'],
  ['hsl(164,95%,43%)','hsl(240,100%,98%)','hsl(43,100%,70%)','hsl(197,19%,36%)','hsl(200,43%,7%)'],
  ['hsl(7,55%,30%)','hsl(6,56%,49%)','hsl(24,38%,87%)','hsl(183,66%,28%)','hsl(180,20%,20%)'],
  ['hsl(83, 45%, 18%)','hsl(59,70%,30%)','hsl(55, 47%, 78%)','hsl(48,99%,59%)','hsl(27, 55%, 33%)']
]


let boardSize = 12
let screenWidth = (Dimensions.get('window').width) * .95;
let gridItemSize = screenWidth / boardSize;
if (screenWidth >= 1000) {
  screenWidth = (Dimensions.get('window').width) * .25
  console.log(screenWidth)
  gridItemSize = screenWidth / boardSize;
}



//temporary stuff to generate random squares
let randomArr = []

for (let i = 0; i < (boardSize * boardSize); i++) {
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
      count: 0
    },
    {
      id: 1,
      color: colors[1],
      count: 0
    },
    {
      id: 2,
      color: colors[2],
      count: 0
    },
    {
      id: 3,
      color: colors[3],
      count: 0
    },
    {
      id: 4,
      color: colors[4],
      count: 0
    }
  ]

  let hasRun = false
  let countNumber = 0
  let totalCaptured = 1

  

const FreePlay = () => {

    const [colorState, setColorState] = useState(tempSquareArr)
    const [selectedColor, setSelectedColor] = useState(tempSquareArr[0].color)
    const [colorOption, setSelectedColorOption] = useState(colors)
    const [counter, setCounter] = useState(0)
    const [squareCounter, setSquareCounter] = useState(squareCounterArr)
    const [squareAnim, setSquareAnim] = useState(squareAnimArr)
    const [change, setChange] = useState(false)
    const [complete, setComplete] = useState(false)

    const [modalVisible, setModalVisible] = useState(false)

    async function initialLoad() {
      let originalSize = boardSize
      await getColor()
      let size = await getSize()
      size != originalSize && handleReset()
    }

  
    useEffect(() => {
        if (!hasRun) {
            tempSquareArr.forEach((sq, index) => {
                if (sq.captured) {
                  captureCheck(sq.color, index);
                }
              });
            tempSquareArr.forEach(sq => {
                squareCounterArr.forEach(counter => {
                    if (sq.color == counter.color && !sq.index == 0) {
                      counter.count++
                    }
                  })
              })
            // setSquareCounter(squareCounterArr)
            initialLoad()
            setChange(true)
            hasRun = true
        }
    }, [])

    const getSize = async () => {
      try {
        const value = await AsyncStorage.getItem('size');
        if (value !== null) {
          switch(value) {
            case '1':
              boardSize = 8
              break
            case '2':
              boardSize = 12
              break
            case '3':
              boardSize = 16
              break
          }
          gridItemSize = screenWidth / boardSize;
          return boardSize
        }
      } catch (e) {
        // error reading value
        console.log('nasdf')
      }
    };

    const getColor = async () => {
      try {
        const value = await AsyncStorage.getItem('color')
        if (value !== null) {
          let x = parseInt(value)
          colors = []
          for (let y = 0; y < 5; y++) {
            colors.push(colorArr[x][y])
          }
          console.log(colors)
          setSelectedColorOption(colors)
        }
      } catch (e) {
        console.log(e)
      }
    }

    function colorChange(color) {
      console.log(color)
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
            setCounter(countNumber++)
            setSelectedColor(tempSquareArr[0].color)
            setSquareAnim(squareAnimArr)
            setSelectedColorOption(colors)
            if (totalCaptured == (boardSize * boardSize)) {
                setComplete(true)
                setModalVisible(true)
            }
            setChange(false)
        }
    }, [change])
    
    function captureCheck(color, index) {
        tempSquareArr[index].color = color
        //right
        if (tempSquareArr[index + 1] && tempSquareArr[index + 1].captured == false) {
            if (tempSquareArr[index].color == tempSquareArr[index + 1].color && tempSquareArr[index].rowIndex == tempSquareArr[index + 1].rowIndex) {
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
              });
              const reverseAnimation = Animated.timing(squareAnimArr[index + 1], {
                toValue: 0, 
                duration: 250, 
                easing: Easing.linear,
                useNativeDriver: true, 
              });
              Animated.sequence([growAnimation, reverseAnimation]).start()
              tempSquareArr[index + 1].colIndex <= boardSize && captureCheck(color, index + 1)
            }
          }
          //left
          if (tempSquareArr[index - 1] && tempSquareArr[index - 1].captured == false) {
            if (tempSquareArr[index].color == tempSquareArr[index - 1].color && tempSquareArr[index].rowIndex == tempSquareArr[index - 1].rowIndex) {
              tempSquareArr[index - 1].color = color
              tempSquareArr[index - 1].captured = true
              updateSquareCounter(color)
              totalCaptured++
              const growAnimation = Animated.timing(squareAnimArr[index - 1], {
                toValue: 1, 
                duration: 250, 
                easing: Easing.linear,
                useNativeDriver: true, 
              });
              const reverseAnimation = Animated.timing(squareAnimArr[index - 1], {
                toValue: 0, 
                duration: 250, 
                easing: Easing.linear,
                useNativeDriver: true, 
              });
              Animated.sequence([growAnimation, reverseAnimation]).start()
              tempSquareArr[index - 1].colIndex <= boardSize && captureCheck(color, index - 1)
            }
          }
          //down
          if (tempSquareArr[index + boardSize] && tempSquareArr[index + boardSize].captured == false) {
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
              });
              const reverseAnimation = Animated.timing(squareAnimArr[index + boardSize], {
                toValue: 0, 
                duration: 250, 
                easing: Easing.linear,
                useNativeDriver: true, 
              });
              Animated.sequence([growAnimation, reverseAnimation]).start()
              tempSquareArr[index + boardSize].rowIndex <= boardSize && captureCheck(color, index + boardSize)
            }
          }
          //up
          if (tempSquareArr[index - boardSize] && tempSquareArr[index - boardSize].captured == false) {
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
              });
              const reverseAnimation = Animated.timing(squareAnimArr[index - boardSize], {
                toValue: 0, 
                duration: 250, 
                easing: Easing.linear,
                useNativeDriver: true, 
              });
              Animated.sequence([growAnimation, reverseAnimation]).start()
              tempSquareArr[index - boardSize].rowIndex <= boardSize && captureCheck(color, index - boardSize)
            }
          }
    }

    function updateSquareCounter(color) {
        squareCounterArr.forEach(sq => {
            if (sq.color == color) {
              sq.count--
            }
          })
        }

    async function handleReset() {
        randomArr = []
        squareAnimArr = []
        console.log('before board size')
        console.log(boardSize)
        let x = await getSize()
        await getColor()
        console.log(x)
        console.log('reset board size')
        console.log(boardSize)
        for (let i = 0; i < (boardSize * boardSize); i++) {
            randomArr.push(Math.floor(Math.random() * 5))
        }
        squares = generateBoard(randomArr).flat()
        tempSquareArr = JSON.parse(JSON.stringify(squares))
        //ensure colors match current color set
        tempSquareArr.forEach((sq) => {
          sq.color = colors[sq.colorIndex]
        })
        squareAnimArr = tempSquareArr.map(() => new Animated.Value(0))
        console.log(squareAnimArr.length)
        squareCounterArr.forEach(counter => {
            counter.count = 0
          })
        totalCaptured = 1
        tempSquareArr.forEach((sq, index) => {
            if (sq.captured) {
                captureCheck(sq.color, index);
            }
        });
        tempSquareArr.forEach(sq => {
            squareCounterArr.forEach(counter => {
                if (sq.color == counter.color && !sq.index == 0) {
                  counter.count++
                }
              })
          })
        countNumber = 0
        modalVisible && setModalVisible(!modalVisible)
        setChange(true)
    }

    function handleRetry() {
        tempSquareArr.forEach((sq) => {
            sq.color = colors[sq.colorIndex]
            if (sq.index != 0) {
                sq.captured = false
            }
        })
        squareCounterArr.forEach(counter => {
            counter.count = 0
        })
        totalCaptured = 1
        tempSquareArr.forEach((sq, index) => {
            if (sq.captured) {
              captureCheck(sq.color, index);
            }
          });
        tempSquareArr.forEach(sq => {
            squareCounterArr.forEach(counter => {
                if (sq.color == counter.color && !sq.index == 0) {
                    counter.count++
                }
            })
        })
        countNumber = 0
        modalVisible && setModalVisible(!modalVisible)
        setChange(true)
    }

  return (
    <View style={styles.container}>
        <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          Alert.alert('Modal has been closed.');
          setModalVisible(!modalVisible);
        }}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>You completed the board in {counter} turns!</Text>
            <Pressable
              style={[styles.button, styles.buttonClose]}
              onPress={() => handleReset()}>
              <Text style={styles.textStyle}>New Board</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.buttonClose]}
              onPress={() => handleRetry()}>
              <Text style={styles.textStyle}>Retry Board</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
        <View style={styles.top}>
            <Text style={[styles.topText, styles.highScore]}>High Score</Text>
            <Text style={[styles.topText, styles.remainText]}>Squares Remaining</Text>
            <View style={styles.squareCounter}>
                <View style={[styles.fakeSquare, {backgroundColor: colorOption[0]}]}>
                    <Text style={styles.fakeText}>{squareCounter[0].count}</Text>
                </View>
                <View style={[styles.fakeSquare, {backgroundColor: colorOption[1]}]}>
                    <Text style={styles.fakeText}>{squareCounter[1].count}</Text>
                </View>
                <View style={[styles.fakeSquare, {backgroundColor: colorOption[2]}]}>
                    <Text style={styles.fakeText}>{squareCounter[2].count}</Text>
                </View>
                <View style={[styles.fakeSquare, {backgroundColor: colorOption[3]}]}>
                    <Text style={styles.fakeText}>{squareCounter[3].count}</Text>
                </View>
                <View style={[styles.fakeSquare, {backgroundColor: colorOption[4]}]}>
                    <Text style={styles.fakeText}>{squareCounter[4].count}</Text>
                </View>
            </View>
        </View>
        <Text style={styles.counter}>{counter}</Text>
        <View style={styles.board}>
            {colorState.map((sq, index) => {
                return (
                    // <View key={index} style={[styles.square, {backgroundColor: sq.color}]}></View>
                    <Animated.View key={index} style={[styles.square, sq.captured && {zIndex: 2}, {backgroundColor: sq.color, width: gridItemSize, height: gridItemSize}]}></Animated.View>
                )
            })}
            {/* <FlatList
            data={squares}
            keyExtractor={(item) => item.toString()}
            numColumns={boardSize}
            renderItem={({item}) => <Square/>}
            ></FlatList> */}
        </View>
        
        <View style={styles.extraRow}>
            <Pressable style={styles.resetButton} onPress={() => handleReset()}>
                <Text style={{textAlign: 'center'}}>New Board</Text>
            </Pressable>
            <Pressable style={styles.resetButton} onPress={() => handleRetry()}>
                <Text>Retry</Text>
            </Pressable>
        </View>
        <View style={styles.colorRow}>
            <Pressable style={[styles.color, {backgroundColor: selectedColor == colors[0] ? 'gray' : colorOption[0]}, {opacity: selectedColor == colors[0] ? 0.25 : 1}]} onPress={() => colorChange(colorOption[0])}></Pressable>
            <Pressable style={[styles.color, {backgroundColor: selectedColor == colors[1] ? 'gray' : colorOption[1]}, {opacity: selectedColor == colors[1] ? 0.25 : 1}]} onPress={() => colorChange(colorOption[1])}></Pressable>
            <Pressable style={[styles.color, {backgroundColor: selectedColor == colors[2] ? 'gray' : colorOption[2]}, {opacity: selectedColor == colors[2] ? 0.25 : 1}]} onPress={() => colorChange(colorOption[2])}></Pressable>
            <Pressable style={[styles.color, {backgroundColor: selectedColor == colors[3] ? 'gray' : colorOption[3]}, {opacity: selectedColor == colors[3] ? 0.25 : 1}]} onPress={() => colorChange(colorOption[3])}></Pressable>
            <Pressable style={[styles.color, {backgroundColor: selectedColor == colors[4] ? 'gray' : colorOption[4]}, {opacity: selectedColor == colors[4] ? 0.25 : 1}]} onPress={() => colorChange(colorOption[4])}></Pressable>
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
        justifyContent: 'center'
    },
    topText: {
        textAlign: 'center',
        fontSize: 20
    },
    remainText: {
        marginBottom: 5
    },
    highScore: {
        fontSize: 30,
        marginBottom: 5
    },
    squareCounter: {
        display: 'flex',
        gap: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 10
    },
    fakeSquare: {
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        borderWidth: 1,
        width: 50,
        height: 50
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
        fontSize: 30
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
        width: '90%',
        gap: 5,
        marginBottom: 5,
        justifyContent: 'center'
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
        justifyContent: 'center'
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
        padding: 10,
        elevation: 2,
        marginBottom: 5
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

export default FreePlay