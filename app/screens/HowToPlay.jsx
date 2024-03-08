import {
  View,
  Text,
  Button,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native'
import React, { useState, useEffect } from 'react'
import { FIREBASE_AUTH } from '../../firebaseConfig'
import { useColorSchemeContext } from '../../App'
import { useNavigation, CommonActions } from '@react-navigation/native'

const HowToPlay = () => {
  const { useColors } = useColorSchemeContext()
  const colorTheme = useColors()
  const navigation = useNavigation()

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
      <ScrollView>
        <View style={styles.bottom}>
          <Text style={[styles.headerText, { color: colorTheme.text }]}>
            How To Play
          </Text>
          <Text style={[styles.paragraph, { color: colorTheme.text }]}>
            Welcome to ColorFill Online! The goal of the game is to fill the board
            with one solid color in as few turns as possible.
          </Text>
          <Image
            style={{ width: '100%', height: 500, marginTop: 20, marginBottom: 20 }}
            source={require('./../../assets/Playing.gif')}
            resizeMode="contain"
          ></Image>
          <Text style={[styles.paragraph, { color: colorTheme.text }]}>
            Each board will always start with the top left square captured. Press any
            of the 5 colored circles at the bottom to capture squares of that color
            adjacent to previously captured squares.
          </Text>
          <Text style={[styles.headerText, { color: colorTheme.text }]}>
            Gamemodes
          </Text>

          <Text
            style={[
              styles.paragraph,
              { marginTop: 10, marginBottom: 10, color: colorTheme.text },
            ]}
          >
            Free Play - Play to get the lowest score possible on a single board. You
            can change the size of the board from the options button at the top.
          </Text>

          <Text
            style={[
              styles.paragraph,
              { marginTop: 10, marginBottom: 10, color: colorTheme.text },
            ]}
          >
            Progressive - Play on a progressively growing board to try to get below
            par each round. There are 10 rounds total.
          </Text>
          <Text
            style={[
              styles.paragraph,
              { marginTop: 10, marginBottom: 10, color: colorTheme.text },
            ]}
          >
            Player vs Player - Face off against other players on the same board to
            see who can claim half the board first. Create or join a game to play.
          </Text>
          <Text style={[styles.headerText, { color: colorTheme.text }]}>
            Leaderboard
          </Text>
          <Image
            style={{ width: '100%', height: 500, marginTop: 20, marginBottom: 20 }}
            source={require('./../../assets/Leaderboard.png')}
            resizeMode="contain"
          ></Image>
          <Text
            style={[
              styles.paragraph,
              { marginTop: 10, marginBottom: 10, color: colorTheme.text },
            ]}
          >
            The leaderboard displays the top score for each unique board. When you
            first create a board, your score will show up on the leaderboard. You and
            other players can view your board and try to beat your score. Only the
            player with the highest score for each board shows up on the leaderboard!
          </Text>
          <Text
            style={[
              styles.paragraph,
              { marginTop: 10, marginBottom: 10, color: colorTheme.text },
            ]}
          >
            Stats for Player vs Player are also visible on the leaderboard. You can
            view yours and other players win rates, wins and losses, and win streaks.
            Only the top 50 players are visible so play to win!
          </Text>
          <Text style={[styles.headerText, { color: colorTheme.text }]}>
            Options
          </Text>
          <Image
            style={{ width: '100%', height: 500, marginTop: 20, marginBottom: 20 }}
            source={require('./../../assets/Options.png')}
            resizeMode="contain"
          ></Image>
          <Text
            style={[
              styles.paragraph,
              { marginTop: 10, marginBottom: 10, color: colorTheme.text },
            ]}
          >
            The options menu allows you to customize the size of the board for Free
            Play, change the colors of the squares, and allows you to switch between
            light and dark mode.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('HomePage')}
          >
            <Text style={styles.buttonText}>Let's Play!</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}

export default HowToPlay

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  top: {
    height: '20%',
  },
  colorImage: {
    maxWidth: '100%',
    height: '100%',
  },
  bottom: {
    height: '80%',
    // justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 30,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  paragraph: {
    fontSize: 20,
    maxWidth: 500,
    marginTop: 10,
    marginBottom: 10,
    paddingLeft: 10,
    paddingRight: 10,
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
