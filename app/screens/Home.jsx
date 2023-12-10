import { View, Text, Button, Image, StyleSheet, Pressable } from 'react-native'
import React from 'react'

let x = true

const Home = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.top}>
          <Image style={styles.colorImage} source={require('./../../assets/ColorFill.png')} resizeMode="contain"></Image>
      </View>
      <View style={styles.bottom}>
        <Pressable style={styles.button} onPress={() => navigation.navigate('PlayMenu')}>
          <Text style={styles.buttonText}>Play Game</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.buttonText}>Login</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={() => navigation.navigate('Leaderboard')}>
          <Text style={styles.buttonText}>Leaderboard</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    top: {
        height: '50%'
    },
    colorImage: {
        maxWidth: '100%',
        height: '100%'
    },
    bottom: {
      height: '50%',
      justifyContent: 'center',
      alignItems: 'center'
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
        backgroundColor: 'lightblue',
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
    }
})

export default Home