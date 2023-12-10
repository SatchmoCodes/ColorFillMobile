import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image, Button } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Home from './app/screens/Home.jsx'
import Login from './app/screens/Login.jsx';
import Leaderboard from './app/screens/Leaderboard.jsx'
import PlayMenu from './app/screens/PlayMenu.jsx';
import FreePlay from './app/screens/FreePlay.jsx';
import Options from './app/screens/Options.jsx';
import { initializeApp } from "firebase/app";
import React, {useEffect} from 'react';

export default function App() {
  const Stack = createNativeStackNavigator()

  const firebaseConfig = {
    apiKey: "AIzaSyCusZ-giht0y9F8SlGq03bb8hlIyje3Kfg",
    authDomain: "colorfill-6d541.firebaseapp.com",
    databaseURL: "https://colorfill-6d541-default-rtdb.firebaseio.com",
    projectId: "colorfill-6d541",
    storageBucket: "colorfill-6d541.appspot.com",
    messagingSenderId: "748210238503",
    appId: "1:748210238503:web:ce401caec82e4172ec4a02",
    measurementId: "G-6LSQJGV743"
  };

  useEffect(() => {
    initializeApp(firebaseConfig)
  })

  return (
    // <View style={styles.container}>
    //   <View style={styles.container}>
    //     <Image style={styles.colorImage} source={require('./assets/ColorFill.png')} resizeMode="contain"></Image>
    //     <StatusBar style="auto" />
    //   </View>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name='HomePage' component={Home} options={{headerRight: () => (
            <Button onPress={() => alert('This is a button!')}
            title="Options"
            color="lightblue"></Button>
          )}}/>
          <Stack.Screen name='Login' component={Login}/>
          <Stack.Screen name='PlayMenu' component={PlayMenu}/>
          <Stack.Screen name='Leaderboard' component={Leaderboard}/>
          <Stack.Screen name='Options' component={Options}/>
          <Stack.Screen name='FreePlay' component={FreePlay} options={({ navigation, route }) => ({
          // Add a placeholder button without the `onPress` to avoid flicker
          headerRight: () => (
            <Button title="Options" onPress={() => navigation.navigate('Options')} color='blue' />
          ),
        })}/>
        </Stack.Navigator>
      </NavigationContainer>
    // </View> 
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorImage: {
    flex: 1,
    width: '100%'
  }
});
