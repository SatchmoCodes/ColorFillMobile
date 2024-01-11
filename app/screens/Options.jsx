import { Pressable, StyleSheet, Text, View } from 'react-native'
import React, { useMemo, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import RadioGroup from 'react-native-radio-buttons-group'
import { useColorSchemeContext } from '../../App'

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

const Options = () => {
  const { userColorScheme, useColors, toggleColorScheme } = useColorSchemeContext()

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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text
        style={{ fontSize: 30, marginBottom: 20, marginTop: 20, color: colors.text }}
      >
        Board Size
      </Text>
      <RadioGroup
        radioButtons={radioButtons.map(option => ({...option, labelStyle: {fontSize: 20, color: colors.text}, borderColor: option.id === selectedId && colors.radioSelected}))}
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
        <Pressable
          style={[
            styles.colorOption,
            selectedColor == '0' && { borderWidth: 1, borderColor: colors.outline },
          ]}
          onPress={() => setColor('0')}
        >
          <View style={styles.inner}>
            <View
              style={[styles.square, { backgroundColor: 'hsl(0, 100%, 40%)' }]}
            ></View>
            <View
              style={[styles.square, { backgroundColor: 'hsl(22, 100%, 50%)' }]}
            ></View>
            <View
              style={[styles.square, { backgroundColor: 'hsl(60, 100%, 50%)' }]}
            ></View>
            <View
              style={[styles.square, { backgroundColor: 'hsl(130, 100%, 15%)' }]}
            ></View>
            <View
              style={[styles.square, { backgroundColor: 'hsl(242, 69%, 49%)' }]}
            ></View>
            <View
              style={[styles.hide, { backgroundColor: 'rgb(255,255,255)' }]}
            ></View>
            <View style={[styles.hide, { backgroundColor: 'rgb(30,30,30)' }]}></View>
          </View>
        </Pressable>
        <Pressable
          style={[
            styles.colorOption,
            selectedColor == '1' && { borderWidth: 1, borderColor: colors.outline },
          ]}
          onPress={() => setColor('1')}
        >
          <View style={styles.inner}>
            <View
              style={[styles.square, { backgroundColor: 'hsl(33, 90.8%, 12.7%)' }]}
            ></View>
            <View
              style={[styles.square, { backgroundColor: 'hsl(33, 89.8%, 26.9%)' }]}
            ></View>
            <View
              style={[styles.square, { backgroundColor: 'hsl(25, 95.4%, 42.7%)' }]}
            ></View>
            <View
              style={[styles.square, { backgroundColor: 'hsl(221, 69.2%, 43.3%)' }]}
            ></View>
            <View
              style={[styles.square, { backgroundColor: 'hsl(213, 68.6%, 90%)' }]}
            ></View>
            <View
              style={[styles.hide, { backgroundColor: 'rgb(133, 7, 7)' }]}
            ></View>
            <View
              style={[styles.hide, { backgroundColor: 'rgb(8, 68, 17)' }]}
            ></View>
          </View>
        </Pressable>
        <Pressable
          style={[
            styles.colorOption,
            selectedColor == '2' && { borderWidth: 1, borderColor: colors.outline },
          ]}
          onPress={() => setColor('2')}
        >
          <View style={styles.inner}>
            <View
              style={[styles.square, { backgroundColor: 'hsl(358,83%,35%)' }]}
            ></View>
            <View
              style={[styles.square, { backgroundColor: 'hsl(2,72%,51%)' }]}
            ></View>
            <View
              style={[styles.square, { backgroundColor: 'hsl(211,88%,32%)' }]}
            ></View>
            <View
              style={[styles.square, { backgroundColor: 'hsl(0,0%,39%)' }]}
            ></View>
            <View
              style={[styles.square, { backgroundColor: 'hsl(0,0%,14%)' }]}
            ></View>
            <View
              style={[styles.hide, { backgroundColor: 'rgb(143, 4, 156)' }]}
            ></View>
            <View
              style={[styles.hide, { backgroundColor: 'rgb(255, 235, 15)' }]}
            ></View>
          </View>
        </Pressable>
        <Pressable
          style={[
            styles.colorOption,
            selectedColor == '3' && { borderWidth: 1, borderColor: colors.outline },
          ]}
          onPress={() => setColor('3')}
        >
          <View style={styles.inner}>
            <View
              style={[styles.square, { backgroundColor: 'hsl(164,95%,43%)' }]}
            ></View>
            <View
              style={[styles.square, { backgroundColor: 'hsl(240,100%,98%)' }]}
            ></View>
            <View
              style={[styles.square, { backgroundColor: 'hsl(43,100%,70%)' }]}
            ></View>
            <View
              style={[styles.square, { backgroundColor: 'hsl(197,19%,36%)' }]}
            ></View>
            <View
              style={[styles.square, { backgroundColor: 'hsl(200,43%,7%)' }]}
            ></View>
            <View
              style={[styles.hide, { backgroundColor: 'rgb(5, 73, 157)' }]}
            ></View>
            <View
              style={[styles.hide, { backgroundColor: 'rgb(197, 42, 11)' }]}
            ></View>
          </View>
        </Pressable>
        <Pressable
          style={[
            styles.colorOption,
            selectedColor == '4' && { borderWidth: 1, borderColor: colors.outline },
          ]}
          onPress={() => setColor('4')}
        >
          <View style={styles.inner}>
            <View
              style={[styles.square, { backgroundColor: 'hsl(7,55%,30%)' }]}
            ></View>
            <View
              style={[styles.square, { backgroundColor: 'hsl(6,56%,49%)' }]}
            ></View>
            <View
              style={[styles.square, { backgroundColor: 'hsl(24,38%,87%)' }]}
            ></View>
            <View
              style={[styles.square, { backgroundColor: 'hsl(183,66%,28%)' }]}
            ></View>
            <View
              style={[styles.square, { backgroundColor: 'hsl(180,20%,20%)' }]}
            ></View>
            <View
              style={[styles.hide, { backgroundColor: 'rgb(228, 174, 13)' }]}
            ></View>
            <View
              style={[styles.hide, { backgroundColor: 'rgb(110, 13, 228)' }]}
            ></View>
          </View>
        </Pressable>
        <Pressable
          style={[
            styles.colorOption,
            selectedColor == '5' && { borderWidth: 1, borderColor: colors.outline },
          ]}
          onPress={() => setColor('5')}
        >
          <View style={styles.inner}>
            <View
              style={[styles.square, { backgroundColor: 'hsl(83, 45%, 18%)' }]}
            ></View>
            <View
              style={[styles.square, { backgroundColor: 'hsl(59,70%,30%)' }]}
            ></View>
            <View
              style={[styles.square, { backgroundColor: 'hsl(55, 47%, 78%)' }]}
            ></View>
            <View
              style={[styles.square, { backgroundColor: 'hsl(48,99%,59%)' }]}
            ></View>
            <View
              style={[styles.square, { backgroundColor: 'hsl(27, 55%, 33%)' }]}
            ></View>
            <View
              style={[styles.hide, { backgroundColor: 'rgb(31, 194, 215)' }]}
            ></View>
            <View
              style={[styles.hide, { backgroundColor: 'rgb(204, 72, 16)' }]}
            ></View>
          </View>
        </Pressable>
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
      </View>
    </View>
  )
}

export default Options

const styles = StyleSheet.create({ 
  poop: {
    backgroundColor: 'blue',
    borderColor: 'white'
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
  },
  hide: {
    display: 'none',
  },
})
