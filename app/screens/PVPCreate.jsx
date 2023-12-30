import { StyleSheet, Text, View, Image, Pressable } from 'react-native'
import React, { useMemo, useState, useEffect } from 'react'
import RadioGroup, { RadioButton } from 'react-native-radio-buttons-group';
import { query, collection, doc, addDoc, where, getDocs, getDoc, orderBy, serverTimestamp } from 'firebase/firestore'
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../firebaseConfig.js';
import uuid from 'react-native-uuid'
import generateBoard from './pvpGenerator.js';
import { useColorSchemeContext } from '../../App';

const PVPCreate = ({ navigation }) => {

    const { useColors } = useColorSchemeContext()
    const colors = useColors()

    const auth = FIREBASE_AUTH
    const db = FIRESTORE_DB

    const [size, setSize] = useState('Medium')
    const [boardType, setBoardType] = useState('Random')
    const [lobbyType, setLobbyType] = useState('Public')

    const [uid, setUid] = useState(null);
    const [userName, setUserName] = useState(null)

    useEffect(() => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        setUid(user.uid);
      });
  
      return unsubscribe;
    }, []);

    useEffect(() => {
        const getUserData = async () => {
          const q = query(collection(db, 'Users'), where("uid", "==", uid))
          const querySnapshot = await getDocs(q)
          querySnapshot.forEach((doc) => {
            setUserName(doc.data().username)
          })
        };
        getUserData();
      }, [uid]);

    const sizeOptions = useMemo(() => ([
        {
            id: 'Small',
            label: 'Small',
            value: '11'
        },
        {
            id: 'Medium',
            label: 'Medium',
            value: '15'
        },
        {
            id: 'Large',
            label: 'Large',
            value: '19'
        }
    ]), [])

    const boardOptions = useMemo(() => ([
        {
            id: 'Mirrored',
            label: 'Mirrored',
            value: 'Mirrored'
        },
        {
            id: 'Random',
            label: 'Random',
            value: 'Random'
        },
        {
            id: 'Partial Mirror',
            label: 'Partial Mirror',
            value: 'Partial Mirror'
        }
    ]), [])

    const lobbyOptions = useMemo(() => ([
        {
            id: 'Public',
            label: 'Public',
            value: 'Public'
        },
        {
            id: 'Private',
            label: 'Private',
            value: 'Private'
        },
    ]), [])

    const MyRadioButton = (props) => {
        return (
          <View style={styles.radioButtonContainer}>
            <RadioButton
              {...props}
              color={{color: 'colors.text'}}
            />
            <Text style={styles.radioButtonLabel}>{props.label}</Text>
          </View>
        );
      };

    async function createBoard() {
        let dimensions
        let boardData = []
        
        switch(size) {
            case 'Small':
              dimensions = 11
              break
            case 'Medium':
              dimensions = 15
              break
            case 'Large':
              dimensions = 19
              break
          }

        if (boardType == 'Mirrored') {
            let halfDim
            let boardHalf = []
            halfDim = Math.ceil(((dimensions * dimensions) / 2) - 1)
            console.log(halfDim)
          
            for (let i = 0; i < halfDim; i++) {
              boardHalf.push(Math.floor(Math.random() * 5)) 
            }
            while (boardHalf[1] == boardHalf[0]) {
              boardHalf.splice(1, 1, Math.floor(Math.random() * 5))
            }
            while (boardHalf[dimensions] == boardHalf[0]) {
              boardHalf.splice(dimensions, 1, Math.floor(Math.random() * 5))
            }
            let reverseHalf = JSON.parse(JSON.stringify(boardHalf))
            reverseHalf = reverseHalf.reverse()
            let centerPiece = (Math.floor(Math.random() * 5))
            boardHalf.push(centerPiece)
            boardData = boardHalf.concat(reverseHalf)
          }
          else if (boardType == 'Random') {
            for (let i = 0; i < dimensions * dimensions; i++) {
              boardData.push(Math.floor(Math.random() * 5))
            }
            while (boardData[1] == boardData[0]) {
              boardData.splice(1, 1, Math.floor(Math.random() * 5))
            }
            while (boardData[dimensions] == boardData[0]) {
              boardData.splice(dimensions, 1, Math.floor(Math.random() * 5))
            }
            while (boardData[boardData.length - 2] == boardData[boardData.length - 1]) {
              boardData.splice(boardData.length - 2, 1, Math.floor(Math.random() * 5))
            }
            while (boardData[(boardData.length - 1) - dimensions] == boardData[boardData.length - 1]) {
              boardData.splice((boardData.length - 1) - dimensions, 1, Math.floor(Math.random() * 5))
            }
          }
          else if (boardType == 'Partial Mirror') {
            let halfDim
            let boardHalf = []
            halfDim = Math.ceil(((dimensions * dimensions) / 2) - 1)
          
            for (let i = 0; i < halfDim; i++) {
              boardHalf.push(Math.floor(Math.random() * 5)) 
            }
            while (boardHalf[1] == boardHalf[0]) {
              boardHalf.splice(1, 1, Math.floor(Math.random() * 5))
            }
            while (boardHalf[dimensions] == boardHalf[0]) {
              boardHalf.splice(dimensions, 1, Math.floor(Math.random() * 5))
            }
            let reverseHalf = JSON.parse(JSON.stringify(boardHalf))
            reverseHalf = reverseHalf.reverse()
            let centerPiece = (Math.floor(Math.random() * 5))
            boardHalf.push(centerPiece)
            boardData = boardHalf.concat(reverseHalf)
            for (let x = 0; x < boardData.length; x++) {
              if (x % 2 != 0) {
                let newValue = Math.floor(Math.random() * 5) //every other square has a 20% chance of being randomized
                if (newValue == 0) {
                  boardData[x] = Math.floor(Math.random() * 5)
                }
              }
              while (boardData[1] == boardData[0]) {
                boardData.splice(1, 1, Math.floor(Math.random() * 5))
              }
              while (boardData[dimensions] == boardData[0]) {
                boardData.splice(dimensions, 1, Math.floor(Math.random() * 5))
              }
              while (boardData[boardData.length - 2] == boardData[boardData.length - 1]) {
                boardData.splice(boardData.length - 2, 1, Math.floor(Math.random() * 5))
              }
              while (boardData[(boardData.length - 1) - dimensions] == boardData[boardData.length - 1]) {
                boardData.splice((boardData.length - 1) - dimensions, 1, Math.floor(Math.random() * 5))
              }
            }
          }
         const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']
         const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
         boardData = boardData.join("")
         let code = ''
         for (let i = 0; i < 7; i++) {
          if (i < 3) {
            code += letters[Math.floor(Math.random() * 26)]
          }
          else if (i > 3) {
            code += numbers[Math.floor(Math.random() * 10)]
          }
         }
          let firstMove = Math.floor(Math.random() * 2)
          let turn
          firstMove == 0 ? turn = 'Owner' : turn = 'Opponent'
          let colorOptionsArr = [5, 6]
          let ownerColor
          let opponentColor
          if (firstMove == 0) {
            ownerColor = colorOptionsArr[0]
            opponentColor = colorOptionsArr[1]
          }
          else {
            ownerColor = colorOptionsArr[1]
            opponentColor = colorOptionsArr[0]
          }
          const boardState = JSON.stringify(generateBoard(boardData))
          const squareGrowthArr = new Array(dimensions * dimensions).fill(0)
          squareGrowthArr[0] = 1
          squareGrowthArr[squareGrowthArr.length - 1] = 1
          let squareGrowth = JSON.stringify(squareGrowthArr)
          const newPVPSession = await addDoc(collection(db, 'Games'), {
            boardState: boardState,
            boardData: boardData,
            gameState: 'Waiting',
            animationIndex: '',
            size: size,
            boardType: boardType,
            lobbyType: lobbyType,
            code: code,
            ownerName: userName,
            opponentName: '',
            ownerScore: 1,
            opponentScore: 1,
            turn: turn,
            ownerColor: ownerColor,
            opponentColor: opponentColor,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          })
          let id = newPVPSession.id
          navigation.navigate('PVPLobby', {id})
    }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <View style={styles.top}>
          <Image style={styles.colorImage} source={require('./../../assets/ColorFill.png')} resizeMode="contain"></Image>
      </View>
      <View style={styles.bottom}>
        <View style={styles.optionsContainer}>
          <Text style={{textAlign: 'center', fontSize: 30, color: colors.text}}>Game Options</Text>
          <View style={[styles.sizeOptions, styles.optionBlock]}>
            <Text style={{textAlign: 'center', fontSize: 20, marginBottom: 10, color: colors.text}}>Board Size</Text>
            <RadioGroup
            containerStyle={{justifyContent: 'center'}}
            radioButtons={sizeOptions}
            onPress={(e) => setSize(e)}
            selectedId={size}
            layout='row'
            renderRadioButton={MyRadioButton}
            />
          </View>
          <View style={[styles.boardOptions, styles.optionBlock]}>
            <Text style={{textAlign: 'center', fontSize: 20, marginBottom: 10, color: colors.text}}>Board Type</Text>
            <RadioGroup
            radioButtons={boardOptions}
            onPress={(e) => setBoardType(e)}
            selectedId={boardType}
            layout='row'
            />
          </View>
          <View style={[styles.lobbyOptions, styles.optionBlock]}>
            <Text style={{textAlign: 'center', fontSize: 20, marginBottom: 10, color: colors.text}}>Lobby Type</Text>
            <RadioGroup
            containerStyle={{justifyContent: 'center'}}
            radioButtons={lobbyOptions}
            onPress={(e) => setLobbyType(e)}
            selectedId={lobbyType}
            layout='row'
            />
          </View>
        </View>
        <View>
            <Pressable style={styles.button} onPress={() => createBoard()}>
                <Text style={[styles.buttonText]}>Create Game</Text>
            </Pressable>
        </View>
      </View>
    </View>
  )
}

export default PVPCreate

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    top: {
        height: '30%'
    },
    colorImage: {
        maxWidth: '100%',
        height: '100%'
    },
    bottom: {
        height: '70%',
        // justifyContent: 'center',
        alignItems: 'center'
    },
    optionBlock: {
        marginTop: 20,
        marginBottom: 20
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
        textShadowColor: 'black',
        textShadowRadius: 1,
        textShadowOffset: { 
          width: 1,
          height: 1,
        },
    }
})