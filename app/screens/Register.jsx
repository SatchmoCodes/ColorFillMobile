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
import React, { useState, useEffect } from 'react'
import { useNavigation, CommonActions } from '@react-navigation/native'
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../firebaseConfig'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import {
  query,
  collection,
  doc,
  addDoc,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore'

const auth = FIREBASE_AUTH
const db = FIRESTORE_DB

const Register = () => {
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')

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

  const handleSignUp = async () => {
    let cancel = false
    if (displayName.includes(' ')) {
      cancel = true
      alert('username must not include spaces')
    }
    try {
      // const q = query(collection(db, 'Users'), where("username", "==", displayName))
      const q = query(collection(db, 'Users'))
      const querySnapshot = await getDocs(q)

      querySnapshot.forEach((doc) => {
        if (doc.data().username.toLowerCase() == displayName.toLowerCase()) {
          alert('username is taken')
          cancel = true
        }
      })
      if (cancel) {
        return
      }

      const response = await createUserWithEmailAndPassword(auth, email, password)

      const newUser = await addDoc(collection(db, 'Users'), {
        email: email,
        // password: password,
        uid: response.user.uid,
        username: displayName,
        wins: 0,
        losses: 0,
        totalGames: 0,
        winRate: 0,
        currentWinStreak: 0,
        bestWinStreak: 0,
        createdAt: serverTimestamp(),
      })
      console.log('new user created with name ' + newUser.username)
    } catch (error) {
      alert(error)
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
              placeholder="Email"
              placeholderTextColor="black"
              value={email}
              onChangeText={(text) => setEmail(text)}
              style={styles.input}
            />
            <TextInput
              placeholder="Username"
              placeholderTextColor="black"
              value={displayName}
              onChangeText={(text) => setDisplayName(text)}
              style={styles.input}
              maxLength={15}
            />
            <TextInput
              placeholder="Password"
              placeholderTextColor="black"
              value={password}
              onChangeText={(text) => setPassword(text)}
              style={styles.input}
              secureTextEntry
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={handleSignUp}
              style={[styles.button, styles.buttonOutline]}
            >
              <Text style={styles.buttonOutlineText}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  )
}

export default Register

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: 'contain',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
