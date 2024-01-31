import { useNavigation, CommonActions } from '@react-navigation/core'
import React, { useEffect, useState } from 'react'
import {
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  ImageBackground,
  Platform,
} from 'react-native'
// import firebase from '@react-native-firebase/app'
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../firebaseConfig'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { query, collection, doc, addDoc, where, getDocs } from 'firebase/firestore'
// import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'

const LoginScreen = ({}) => {
  const [emailOrUsername, setEmailOrUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')

  const auth = FIREBASE_AUTH
  const db = FIRESTORE_DB

  const navigation = useNavigation()

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'HomePage' }], // replace 'HomePage' with the actual route name
          }),
        )
      }
    })

    return unsubscribe
  }, [])

  const handleSignUp = () => {
    navigation.navigate('Register')
  }

  const handleLogin = async () => {
    let email
    if (emailOrUsername.includes('@')) {
      email = emailOrUsername
      try {
        const response = await signInWithEmailAndPassword(auth, email, password)
        console.log(response)
      } catch (error) {
        alert(error)
      }
    } else {
      const q = query(
        collection(db, 'Users'),
        where('username', '==', emailOrUsername),
      )
      const querySnapshot = await getDocs(q)
      let cancel = false
      if (!querySnapshot.empty) {
        email = querySnapshot.docs[0].data().email
        try {
          const response = await signInWithEmailAndPassword(auth, email, password)
          console.log(response)
        } catch (error) {
          alert(error)
        }
      } else {
        alert('no account registered with that username')
      }
    }
  }

  return (
    <ImageBackground
      source={require('./../../assets/ColorFill-Splash.png')}
      style={styles.backgroundImage}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        contentContainerStyle={{ alignItems: 'center' }}
      >
        <View style={styles.top}>
          <Image
            style={styles.colorImage}
            source={require('./../../assets/ColorFill.png')}
            resizeMode="contain"
          ></Image>
        </View>
        <View style={styles.bottom}>
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Email or Username"
              value={emailOrUsername}
              onChangeText={(text) => setEmailOrUsername(text)}
              style={styles.input}
            />
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={(text) => setPassword(text)}
              style={styles.input}
              secureTextEntry
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={handleLogin} style={styles.button}>
              <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSignUp}
              style={[styles.button, styles.buttonOutline]}
            >
              <Text style={styles.buttonOutlineText}>Register Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  )
}

export default LoginScreen

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  top: {
    height: '20%',
    width: '100%',
  },
  colorImage: {
    maxWidth: '100%',
    height: '100%',
  },
  bottom: {
    height: '80%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    width: '80%',
  },
  input: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 5,
    borderWidth: 1,
  },
  buttonContainer: {
    width: '60%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  button: {
    backgroundColor: '#0782F9',
    width: '100%',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonOutline: {
    backgroundColor: 'white',
    marginTop: 5,
    borderColor: '#0782F9',
    borderWidth: 2,
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  buttonOutlineText: {
    color: '#0782F9',
    fontWeight: '700',
    fontSize: 16,
  },
})
