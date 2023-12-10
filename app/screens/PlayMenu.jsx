import { View, Text, StyleSheet, Image, Pressable } from 'react-native'
import React from 'react'

const PlayMenu = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.top}>
         <Image style={styles.colorImage} source={require('./../../assets/ColorFill.png')} resizeMode="contain"></Image>
      </View>
      <View style={styles.bottom}>
        <Pressable style={styles.button} onPress={() => navigation.navigate('FreePlay')}>
            <Text style={styles.buttonText}>Free Play</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={() => navigation.navigate('Progressive')}>
            <Text style={styles.buttonText}>Progressive</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={() => navigation.navigate('PVPMenu')}>
            <Text style={styles.buttonText}>Player vs Player</Text>
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
        backgroundColor: 'lightblue'
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

export default PlayMenu