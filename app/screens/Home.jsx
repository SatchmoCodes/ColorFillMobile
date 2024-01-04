import { View, Text, Button, Image, StyleSheet, Pressable } from 'react-native'
import React, { useState, useEffect } from 'react'
import { FIREBASE_AUTH } from '../../firebaseConfig'
import { useColorSchemeContext } from '../../App'

const Home = ({ navigation }) => {
  const { getColors } = useColorSchemeContext()
  const colors = getColors()

  const [colorTheme, setColorTheme] = useState(null)

  useEffect(() => {
    FIREBASE_AUTH.onAuthStateChanged((user) => {
      console.log(user)
    })
  }, [])

  function handleLogOut() {
    FIREBASE_AUTH.signOut().then(() => {
      navigation.navigate('Login')
    })
  }

  useEffect(() => {
    const newColorTheme = getColors()
    if (colors && colors !== newColorTheme) {
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
        <Pressable
          style={styles.button}
          onPress={() => navigation.navigate('PlayMenu')}
        >
          <Text style={styles.buttonText}>Play Game</Text>
        </Pressable>
        <Pressable
          style={[styles.button, { opacity: 0.5 }]}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.buttonText}>Login</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={() => handleLogOut()}>
          <Text style={styles.buttonText}>Logout</Text>
        </Pressable>
        <Pressable
          style={styles.button}
          onPress={() => navigation.navigate('Leaderboard')}
        >
          <Text style={styles.buttonText}>Leaderboard</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  top: {
    height: '50%',
  },
  colorImage: {
    maxWidth: '100%',
    height: '100%',
  },
  bottom: {
    height: '50%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    padding: 20,
    fontSize: 5,
    borderRadius: 50,
    width: 150,
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

export default Home
