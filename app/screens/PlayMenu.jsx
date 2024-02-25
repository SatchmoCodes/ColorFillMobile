import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native'
import React from 'react'
import { useColorSchemeContext } from '../../App'

const PlayMenu = ({ navigation }) => {
  const { useColors } = useColorSchemeContext()
  const colors = useColors()

  async function generateBoard(mode) {
    if (mode == 'FreePlay') {
      navigation.navigate('FreePlay')
    } else if (mode == 'Progressive') {
      navigation.navigate('Progressive')
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
          onPress={() => generateBoard('FreePlay')}
        >
          <Text style={styles.buttonText}>Free Play</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => generateBoard('Progressive')}
        >
          <Text style={styles.buttonText}>Progressive</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('PVPMenu')}
        >
          <Text style={styles.buttonText}>Player vs Player</Text>
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
    textShadowRadius: 1,
    textShadowOffset: {
      width: 1,
      height: 1,
    },
  },
})

export default PlayMenu
