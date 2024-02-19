import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Platform,
  ImageBackground,
  KeyboardAvoidingView,
  Text,
  Modal,
} from 'react-native'
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../firebaseConfig'
import { sendPasswordResetEmail } from 'firebase/auth'
import { useNavigation } from '@react-navigation/native'

const auth = FIREBASE_AUTH
const db = FIRESTORE_DB

const PasswordReset = () => {
  const [email, setEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)

  const navigation = useNavigation()

  const handleReset = async () => {
    try {
      await sendPasswordResetEmail(auth, email)
      setResetSent(true)
    } catch (error) {
      alert(error)
      console.error('Password reset failed', error.message)
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
        <Modal animationType="slide" transparent={true} visible={resetSent}>
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text style={{ textAlign: 'center' }}>
                An email has been sent to {email}
              </Text>
              <TouchableOpacity
                style={[styles.modalButton, { marginTop: 10 }]}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={{ color: 'white' }}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
            />
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={handleReset}
              style={[styles.button, styles.buttonOutline]}
            >
              <Text style={styles.buttonOutlineText}>Send Email</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  )
}

export default PasswordReset

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
  //modal
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalButton: {
    borderWidth: 1,
    borderRadius: 50,
    padding: 10,
    maxWidth: 120,
    backgroundColor: 'green',
  },
})
