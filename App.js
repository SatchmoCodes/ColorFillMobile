import { StatusBar } from 'expo-status-bar'
import { useCallback } from 'react'
import {
  StyleSheet,
  Text,
  View,
  Image,
  Button,
  ActivityIndicator,
  useColorScheme,
  TouchableOpacity,
  Platform,
} from 'react-native'
import { lightModeColors, darkModeColors } from './app/screens/colors.js'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Home from './app/screens/Home.jsx'
import Login from './app/screens/Login.jsx'
import Leaderboard from './app/screens/Leaderboard.jsx'
import PlayMenu from './app/screens/PlayMenu.jsx'
import FreePlay from './app/screens/FreePlay.jsx'
import Options from './app/screens/Options.jsx'
import FakeHome from './app/screens/FakeHome.jsx'
import React, { useEffect, useState, useContext, createContext } from 'react'
import Progressive from './app/screens/Progressive.jsx'
import { User, onAuthStateChanged } from 'firebase/auth'
import { FIREBASE_AUTH } from './firebaseConfig.js'
import LeaderboardOptions from './app/LeaderboardOptions.jsx'
import AsyncStorage from '@react-native-async-storage/async-storage'

import PVPMenu from './app/screens/PVPMenu.jsx'
import PVPCreate from './app/screens/PVPCreate.jsx'
import PVPLobby from './app/screens/PVPLobby.jsx'
import PVPGame from './app/screens/PVPGame.jsx'

import BoardInfo from './app/screens/BoardInfo.jsx'

import { FIREBASE_API_KEY } from '@env'
import Register from './app/screens/Register.jsx'
console.log(FIREBASE_API_KEY)

const Stack = createNativeStackNavigator()
const AuthenticatedUserContext = createContext({})

const AuthenticatedUserProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  return (
    <AuthenticatedUserContext.Provider value={{ user, setUser }}>
      {children}
    </AuthenticatedUserContext.Provider>
  )
}

const ColorSchemeContext = createContext()

export const useColorSchemeContext = () => {
  return useContext(ColorSchemeContext)
}

export const ColorSchemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme()
  const [userColorScheme, setUserColorScheme] = useState(systemColorScheme)

  useEffect(() => {
    // Load user's color scheme preference from storage
    const loadColorScheme = async () => {
      try {
        const storedColorScheme = await AsyncStorage.getItem('userColorScheme')
        if (storedColorScheme) {
          console.log(storedColorScheme)
          setUserColorScheme(storedColorScheme)
        }
      } catch (error) {
        console.error('Error loading color scheme:', error)
      }
    }

    loadColorScheme()
  }, [])

  const toggleColorScheme = useCallback(() => {
    const newColorScheme = userColorScheme === 'light' ? 'dark' : 'light'
    AsyncStorage.setItem('userColorScheme', newColorScheme)
    setUserColorScheme(newColorScheme)
  }, [userColorScheme])

  // TODO: definitely rename this to just `getColors()` so that
  // tooling doesn't get confused about this being a hook, when its just
  // a function
  const useColors = useCallback(() => {
    return userColorScheme === 'light' ? lightModeColors : darkModeColors
  }, [userColorScheme])

  return (
    <ColorSchemeContext.Provider
      value={{ userColorScheme, useColors, getColors: useColors, toggleColorScheme }}
    >
      {children}
    </ColorSchemeContext.Provider>
  )
}

function AuthView() {
  const { useColors } = useColorSchemeContext()
  const colors = useColors()
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.tableRow,
          borderColor: 'black',
          borderBottomWidth: 0,
        },
        headerTintColor: colors.text,
      }}
    >
      <Stack.Screen
        name="HomePage"
        component={Home}
        options={({ navigation, route }) => ({
          // Add a placeholder button without the `onPress` to avoid flicker
          headerRight: () => (
            <TouchableOpacity
              style={[
                {
                  marginRight: Platform.OS === 'web' && 20,
                  backgroundColor: 'blue',
                  padding: 8,
                },
              ]}
              onPress={() => navigation.navigate('Options')}
            >
              <Text style={{ color: 'white' }}>Options</Text>
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen
        name="PlayMenu"
        component={PlayMenu}
        options={({ navigation, route }) => ({
          // Add a placeholder button without the `onPress` to avoid flicker
          headerRight: () => (
            <TouchableOpacity
              style={[
                {
                  marginRight: Platform.OS === 'web' && 20,
                  backgroundColor: 'blue',
                  padding: 8,
                },
              ]}
              onPress={() => navigation.navigate('Options')}
            >
              <Text style={{ color: 'white' }}>Options</Text>
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="Leaderboard"
        component={Leaderboard}
        options={({ navigation, route }) => ({
          // Add a placeholder button without the `onPress` to avoid flicker
          headerRight: () => (
            <TouchableOpacity
              style={[
                {
                  marginRight: Platform.OS === 'web' && 20,
                  backgroundColor: 'blue',
                  padding: 8,
                },
              ]}
              onPress={() => navigation.navigate('Options')}
            >
              <Text style={{ color: 'white' }}>Options</Text>
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="BoardInfo"
        component={BoardInfo}
        options={({ navigation, route }) => ({
          // Add a placeholder button without the `onPress` to avoid flicker
          headerRight: () => (
            <TouchableOpacity
              style={[
                {
                  marginRight: Platform.OS === 'web' && 20,
                  backgroundColor: 'blue',
                  padding: 8,
                },
              ]}
              onPress={() => navigation.navigate('Options')}
            >
              <Text style={{ color: 'white' }}>Options</Text>
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen name="Options" component={Options} />
      <Stack.Screen name="LeaderboardOptions" component={LeaderboardOptions} />
      <Stack.Screen
        name="FreePlay"
        component={FreePlay}
        options={({ navigation, route }) => ({
          // Add a placeholder button without the `onPress` to avoid flicker
          headerRight: () => (
            <TouchableOpacity
              style={[
                {
                  marginRight: Platform.OS === 'web' && 20,
                  backgroundColor: 'blue',
                  padding: 8,
                },
              ]}
              onPress={() => navigation.navigate('Options')}
            >
              <Text style={{ color: 'white' }}>Options</Text>
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="Progressive"
        component={Progressive}
        options={({ navigation, route }) => ({
          // Add a placeholder button without the `onPress` to avoid flicker
          headerRight: () => (
            <TouchableOpacity
              style={[
                {
                  marginRight: Platform.OS === 'web' && 20,
                  backgroundColor: 'blue',
                  padding: 8,
                },
              ]}
              onPress={() => navigation.navigate('Options')}
            >
              <Text style={{ color: 'white' }}>Options</Text>
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="PVPMenu"
        component={PVPMenu}
        options={({ navigation, route }) => ({
          // Add a placeholder button without the `onPress` to avoid flicker
          headerRight: () => (
            <TouchableOpacity
              style={[
                {
                  marginRight: Platform.OS === 'web' && 20,
                  backgroundColor: 'blue',
                  padding: 8,
                },
              ]}
              onPress={() => navigation.navigate('Options')}
            >
              <Text style={{ color: 'white' }}>Options</Text>
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="PVPCreate"
        component={PVPCreate}
        options={({ navigation, route }) => ({
          // Add a placeholder button without the `onPress` to avoid flicker
          headerRight: () => (
            <TouchableOpacity
              style={[
                {
                  marginRight: Platform.OS === 'web' && 20,
                  backgroundColor: 'blue',
                  padding: 8,
                },
              ]}
              onPress={() => navigation.navigate('Options')}
            >
              <Text style={{ color: 'white' }}>Options</Text>
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="PVPLobby"
        component={PVPLobby}
        options={({ navigation, route }) => ({
          // Add a placeholder button without the `onPress` to avoid flicker
          headerRight: () => (
            <TouchableOpacity
              style={[
                {
                  marginRight: Platform.OS === 'web' && 20,
                  backgroundColor: 'blue',
                  padding: 8,
                },
              ]}
              onPress={() => navigation.navigate('Options')}
            >
              <Text style={{ color: 'white' }}>Options</Text>
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="PVPGame"
        component={PVPGame}
        options={({ navigation, route }) => ({
          // Add a placeholder button without the `onPress` to avoid flicker
        })}
      />
    </Stack.Navigator>
  )
}

function NonAuthView() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Register" component={Register} />
    </Stack.Navigator>
  )
}

function RootNavigator() {
  const { user, setUser } = useContext(AuthenticatedUserContext)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      FIREBASE_AUTH,
      async (authenticatedUser) => {
        authenticatedUser ? setUser(authenticatedUser) : setUser(null)
        setLoading(false)
      },
    )
    return () => unsubscribe()
  }, [user])
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    )
  }
  return (
    <NavigationContainer>
      {user ? <AuthView /> : <NonAuthView />}
    </NavigationContainer>
  )
}

export default function App() {
  return (
    <AuthenticatedUserProvider>
      <ColorSchemeProvider>
        <RootNavigator />
      </ColorSchemeProvider>
    </AuthenticatedUserProvider>
  )
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
    width: '100%',
  },
})
