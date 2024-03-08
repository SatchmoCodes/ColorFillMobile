import {
  View,
  Text,
  Button,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'
import React, { useState, useEffect } from 'react'
import { FIREBASE_AUTH } from '../../firebaseConfig'
import { useColorSchemeContext } from '../../App'
import { useNavigation, CommonActions } from '@react-navigation/native'

const Home = () => {
  const { getColors } = useColorSchemeContext()
  const colors = getColors()
  const navigation = useNavigation()

  const [colorTheme, setColorTheme] = useState(colors)

  useEffect(() => {
    FIREBASE_AUTH.onAuthStateChanged((user) => {})
  }, [])

  function handleLogOut() {
    FIREBASE_AUTH.signOut().then(() => {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        }),
      )
    })
  }

  useEffect(() => {
    const newColorTheme = getColors()
    if (colors) {
      setColorTheme(newColorTheme)
    }
  }, [colors, getColors])

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colorTheme != null && colorTheme.background },
      ]}
    >
      <View style={styles.top}>
        <Image
          style={styles.colorImage}
          source={require('./../../assets/ColorFill.png')}
          resizeMode="contain"
        ></Image>
      </View>
      <View style={styles.bottom}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('PlayMenu')}
        >
          <Text style={styles.buttonText}>Play Game</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button]}
          onPress={() => navigation.navigate('HowToPlay')}
        >
          <Text style={styles.buttonText}>How to Play</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => handleLogOut()}>
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Leaderboard')}
        >
          <Text style={styles.buttonText}>Leaderboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  top: {
    height: '40%',
  },
  colorImage: {
    maxWidth: '100%',
    height: '100%',
  },
  bottom: {
    height: '60%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    padding: 20,
    fontSize: 5,
    borderRadius: 50,
    width: 200,
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
    fontSize: 20,
    fontWeight: 'bold',
    textShadowColor: 'black',
    textShadowRadius: 3,
    textShadowOffset: {
      width: 1,
      height: 1,
    },
  },
})

export default Home
