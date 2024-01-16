import {
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import React, { useState, useEffect } from 'react'
import { useNavigation, CommonActions } from '@react-navigation/native'
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../firebaseConfig'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { query, collection, doc, addDoc, where, getDocs } from 'firebase/firestore'

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
    try {
      // const q = query(collection(db, 'Users'), where("username", "==", displayName))
      const q = query(collection(db, 'Users'))
      const querySnapshot = await getDocs(q)
      let cancel = false
      querySnapshot.forEach((doc) => {
        console.log(doc.data().username)
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
        currentWinStreak: 0,
        bestWinStreak: 0,
      })
      console.log('new user created with name ' + newUser.username)
    } catch (error) {
      alert(error)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      contentContainerStyle={{ alignItems: 'center' }}
    >
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={(text) => setEmail(text)}
          style={styles.input}
        />
        <TextInput
          placeholder="Username"
          value={displayName}
          onChangeText={(text) => setDisplayName(text)}
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
        <TouchableOpacity
          onPress={handleSignUp}
          style={[styles.button, styles.buttonOutline]}
        >
          <Text style={styles.buttonOutlineText}>Register</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

export default Register

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
