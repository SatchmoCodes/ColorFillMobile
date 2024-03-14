import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native'
import React, { useMemo, useState, useEffect } from 'react'
import RadioGroup, { RadioButton } from 'react-native-radio-buttons-group'
import {
  query,
  collection,
  doc,
  addDoc,
  where,
  getDocs,
  getDoc,
  orderBy,
  serverTimestamp,
  limit,
} from 'firebase/firestore'
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../firebaseConfig.js'
import uuid from 'react-native-uuid'
import generateBoard from './pvpGenerator.js'
import { useColorSchemeContext } from '../../App'
import { squareColors } from './colors.js'

const PVPCreate = ({ navigation }) => {
  const { useColors } = useColorSchemeContext()
  const colors = useColors()

  const auth = FIREBASE_AUTH
  const db = FIRESTORE_DB

  const [size, setSize] = useState('Medium')
  const [boardType, setBoardType] = useState('Random')
  const [lobbyType, setLobbyType] = useState('Public')
  const [fog, setFog] = useState('Off')
  const [squareOption, setSquareOption] = useState('Static')

  const [sizeVisible, setSizeVisilbe] = useState(false)
  const [boardTypeVisible, setBoardTypeVisible] = useState(false)
  const [fogVisible, setFogVisible] = useState(false)
  const [squareOptionVisible, setSquareOptionVisible] = useState(false)
  const [lobbyTypeVisible, setLobbyTypeVisible] = useState(false)

  const [uid, setUid] = useState(null)
  const [userName, setUserName] = useState(null)

  const [block, setBlock] = useState(false)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUid(user.uid)
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    const getUserData = async () => {
      const q = query(collection(db, 'Users'), where('uid', '==', uid))
      const querySnapshot = await getDocs(q)
      querySnapshot.forEach((doc) => {
        setUserName(doc.data().username)
      })
    }
    getUserData()
  }, [uid])

  const sizeOptions = useMemo(
    () => [
      {
        id: 'Small',
        label: 'Small',
        value: '11',
      },
      {
        id: 'Medium',
        label: 'Medium',
        value: '13',
      },
      {
        id: 'Large',
        label: 'Large',
        value: '15',
      },
    ],
    [],
  )

  const boardOptions = useMemo(
    () => [
      {
        id: 'Mirrored',
        label: 'Mirrored',
        value: 'Mirrored',
      },
      {
        id: 'Random',
        label: 'Random',
        value: 'Random',
      },
      {
        id: 'Partial Mirror',
        label: 'Partial Mirror',
        value: 'Partial Mirror',
      },
    ],
    [],
  )

  const lobbyOptions = useMemo(
    () => [
      {
        id: 'Public',
        label: 'Public',
        value: 'Public',
      },
      {
        id: 'Private',
        label: 'Private',
        value: 'Private',
      },
    ],
    [],
  )

  const fogOptions = useMemo(() => [
    {
      id: 'On',
      label: 'On',
      value: 'On',
    },
    {
      id: 'Off',
      label: 'Off',
      value: 'Off',
    },
  ])

  const squareOptions = useMemo(() => [
    {
      id: 'Static',
      label: 'Static',
      value: 'Static',
    },
    {
      id: 'Dynamic',
      label: 'Dynamic',
      value: 'Dynamic',
    },
  ])

  const MyRadioButton = (props) => {
    return (
      <View style={styles.radioButtonContainer}>
        <RadioButton {...props} color={{ color: 'colors.text' }} />
        <Text style={styles.radioButtonLabel}>{props.label}</Text>
      </View>
    )
  }

  async function createBoard() {
    const q = query(
      collection(db, 'Games'),
      where('gameState', '==', 'Waiting'),
      where('ownerName', '==', userName),
      orderBy('createdAt', 'desc'),
      limit(1),
    )
    const querySnapshot = await getDocs(q)
    if (!querySnapshot.empty) {
      let dateObj = querySnapshot.docs[0].data().createdAt.toDate()
      let timeCreated = dateObj.getTime() / 1000
      let currentTime = Math.floor(new Date().getTime() / 1000)
      console.log(currentTime - timeCreated)
      if (currentTime - timeCreated <= 180) {
        alert(
          `You already created a game! Rejoin your lobby or wait ${Math.round(
            300 - (currentTime - timeCreated),
          )} seconds to create another game.`,
        )
        return
      }
    }
    setBlock(true)
    let dimensions
    let boardData = []

    switch (size) {
      case 'Small':
        dimensions = 11
        break
      case 'Medium':
        dimensions = 13
        break
      case 'Large':
        dimensions = 15
        break
    }

    if (boardType == 'Mirrored') {
      let halfDim
      let boardHalf = []
      halfDim = Math.ceil((dimensions * dimensions) / 2 - 1)
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
      let centerPiece = Math.floor(Math.random() * 5)
      boardHalf.push(centerPiece)
      boardData = boardHalf.concat(reverseHalf)
    } else if (boardType == 'Random') {
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
      while (
        boardData[boardData.length - 1 - dimensions] ==
        boardData[boardData.length - 1]
      ) {
        boardData.splice(
          boardData.length - 1 - dimensions,
          1,
          Math.floor(Math.random() * 5),
        )
      }
    } else if (boardType == 'Partial Mirror') {
      let halfDim
      let boardHalf = []
      halfDim = Math.ceil((dimensions * dimensions) / 2 - 1)

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
      let centerPiece = Math.floor(Math.random() * 5)
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
        while (
          boardData[boardData.length - 1 - dimensions] ==
          boardData[boardData.length - 1]
        ) {
          boardData.splice(
            boardData.length - 1 - dimensions,
            1,
            Math.floor(Math.random() * 5),
          )
        }
      }
    }
    const letters = [
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
      'G',
      'H',
      'I',
      'J',
      'K',
      'L',
      'M',
      'N',
      'O',
      'P',
      'Q',
      'R',
      'S',
      'T',
      'U',
      'V',
      'W',
      'X',
      'Y',
      'Z',
    ]
    const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
    boardData = boardData.join('')
    let code = ''
    for (let i = 0; i < 7; i++) {
      if (i < 3) {
        code += letters[Math.floor(Math.random() * 26)]
      } else if (i > 3) {
        code += numbers[Math.floor(Math.random() * 10)]
      }
    }
    let firstMove = Math.floor(Math.random() * 2)
    let turn
    firstMove == 0 ? (turn = 'Owner') : (turn = 'Opponent')
    let colorOptionsArr = [5, 6]
    let ownerColor
    let opponentColor
    if (firstMove == 0) {
      ownerColor = colorOptionsArr[0]
      opponentColor = colorOptionsArr[1]
    } else {
      ownerColor = colorOptionsArr[1]
      opponentColor = colorOptionsArr[0]
    }
    const boardState = JSON.stringify(generateBoard(boardData))
    let parsedBoardState = JSON.parse(boardState).flat()
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
      ownerUid: uid,
      ownerSelectedColor: squareColors[0].indexOf(parsedBoardState[0].color),
      opponentName: '',
      opponentUid: '',
      opponentSelectedColor: squareColors[0].indexOf(
        parsedBoardState[parsedBoardState.length - 1].color,
      ),
      ownerScore: 1,
      opponentScore: 1,
      ownerLeaver: false,
      opponentLeaver: false,
      turn: turn,
      ownerColor: ownerColor,
      opponentColor: opponentColor,
      fog: fog === 'On' ? true : false,
      dynamic: squareOption === 'Dynamic' ? true : false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    let id = newPVPSession.id
    navigation.navigate('PVPLobby', { id })
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
        <Modal animationType="fade" transparent={true} visible={sizeVisible}>
          <View style={[styles.centeredView]}>
            <View style={[styles.modalView, { backgroundColor: colors.button }]}>
              <Text
                style={[
                  styles.modalText,
                  { fontSize: 25, fontWeight: 'bold', color: colors.text },
                ]}
              >
                Board Size Options
              </Text>
              <Text style={[styles.modalText, { color: colors.text }]}>
                Small: 11x11 board size. First to 61 wins!
              </Text>
              <Text style={[styles.modalText, { color: colors.text }]}>
                Medium: 13x13 board size. First to 85 wins!
              </Text>
              <Text style={[styles.modalText, { color: colors.text }]}>
                Large: 15x15 board size. First to 113 wins!
              </Text>
              <TouchableOpacity
                style={[styles.modalButton]}
                onPress={() => setSizeVisilbe(false)}
              >
                <Text style={[styles.textStyle]}>Ok</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <Modal animationType="fade" transparent={true} visible={boardTypeVisible}>
          <View style={[styles.centeredView]}>
            <View style={[styles.modalView, { backgroundColor: colors.button }]}>
              <Text
                style={[
                  styles.modalText,
                  { fontSize: 25, fontWeight: 'bold', color: colors.text },
                ]}
              >
                Board Types
              </Text>
              <Text style={[styles.modalText, { color: colors.text }]}>
                Mirrored: Board is exactly the same on both sides for both players.
              </Text>
              <Text style={[styles.modalText, { color: colors.text }]}>
                Random: Board is completely randomized on both sides.
              </Text>
              <Text style={[styles.modalText, { color: colors.text }]}>
                Partial Mirror: Board is partially mirrored and partially random.
              </Text>
              <TouchableOpacity
                style={[styles.modalButton]}
                onPress={() => setBoardTypeVisible(false)}
              >
                <Text style={[styles.textStyle]}>Ok</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <Modal animationType="fade" transparent={true} visible={squareOptionVisible}>
          <View style={[styles.centeredView]}>
            <View style={[styles.modalView, { backgroundColor: colors.button }]}>
              <Text
                style={[
                  styles.modalText,
                  { fontSize: 25, fontWeight: 'bold', color: colors.text },
                ]}
              >
                Square Color Options
              </Text>
              <Text style={[styles.modalText, { color: colors.text }]}>
                Static: Squares will stay the same color unless captured.
              </Text>
              <Text style={[styles.modalText, { color: colors.text }]}>
                Dynamic: Squares have a small chance to change colors after each
                turn.
              </Text>
              <TouchableOpacity
                style={[styles.modalButton]}
                onPress={() => setSquareOptionVisible(false)}
              >
                <Text style={[styles.textStyle]}>Ok</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <Modal animationType="fade" transparent={true} visible={fogVisible}>
          <View style={[styles.centeredView]}>
            <View style={[styles.modalView, { backgroundColor: colors.button }]}>
              <Text
                style={[
                  styles.modalText,
                  { fontSize: 25, fontWeight: 'bold', color: colors.text },
                ]}
              >
                Fog of War Options
              </Text>
              <Text style={[styles.modalText, { color: colors.text }]}>
                On: Only squares that can currently be captured are visible.
              </Text>
              <Text style={[styles.modalText, { color: colors.text }]}>
                Off: All squares are visible to all players.
              </Text>
              <TouchableOpacity
                style={[styles.modalButton]}
                onPress={() => setFogVisible(false)}
              >
                <Text style={[styles.textStyle]}>Ok</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <Modal animationType="fade" transparent={true} visible={lobbyTypeVisible}>
          <View style={[styles.centeredView]}>
            <View style={[styles.modalView, { backgroundColor: colors.button }]}>
              <Text
                style={[
                  styles.modalText,
                  { fontSize: 25, fontWeight: 'bold', color: colors.text },
                ]}
              >
                Lobby Type Options
              </Text>
              <Text style={[styles.modalText, { color: colors.text }]}>
                Public: Anyone can view your game in the menu and join it.
              </Text>
              <Text style={[styles.modalText, { color: colors.text }]}>
                Private: Game is not visible in the menu. Share the code generated
                after creation with a friend to let them join.
              </Text>
              <TouchableOpacity
                style={[styles.modalButton]}
                onPress={() => setLobbyTypeVisible(false)}
              >
                <Text style={[styles.textStyle]}>Ok</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <Text
          style={[
            {
              textAlign: 'center',
              fontSize: 30,
              color: colors.text,
            },
          ]}
        >
          Game Options
        </Text>
        <ScrollView>
          <View style={styles.optionsContainer}>
            <View style={[styles.sizeOptions, styles.optionBlock]}>
              <View
                style={{ flexDirection: 'row', justifyContent: 'center', gap: 5 }}
              >
                <Text
                  style={{
                    textAlign: 'center',
                    fontSize: 20,
                    marginBottom: 10,
                    color: colors.text,
                  }}
                >
                  Board Size
                </Text>
                <TouchableOpacity
                  style={[
                    styles.tooltip,
                    { marginTop: 3, backgroundColor: colors.button },
                  ]}
                  onPress={() => setSizeVisilbe(true)}
                >
                  <Text style={[styles.tooltipText, { color: colors.text }]}>?</Text>
                </TouchableOpacity>
              </View>
              <RadioGroup
                containerStyle={{ justifyContent: 'center' }}
                radioButtons={sizeOptions.map((option) => ({
                  ...option,
                  labelStyle: { fontSize: 15, color: colors.text },
                  borderColor: option.id === size && colors.radioSelected,
                }))}
                onPress={(e) => setSize(e)}
                selectedId={size}
                layout="row"
                renderRadioButton={MyRadioButton}
              />
            </View>
            <View style={[styles.boardOptions, styles.optionBlock]}>
              <View
                style={{ flexDirection: 'row', justifyContent: 'center', gap: 5 }}
              >
                <Text
                  style={{
                    textAlign: 'center',
                    fontSize: 20,
                    marginBottom: 10,
                    color: colors.text,
                  }}
                >
                  Board Type
                </Text>
                <TouchableOpacity
                  style={[
                    styles.tooltip,
                    { marginTop: 3, backgroundColor: colors.button },
                  ]}
                  onPress={() => setBoardTypeVisible(true)}
                >
                  <Text style={[styles.tooltipText, { color: colors.text }]}>?</Text>
                </TouchableOpacity>
              </View>
              <RadioGroup
                containerStyle={{ flexWrap: 'wrap', justifyContent: 'center' }}
                radioButtons={boardOptions.map((option) => ({
                  ...option,
                  labelStyle: { fontSize: 15, color: colors.text },
                  borderColor: option.id === boardType && colors.radioSelected,
                }))}
                onPress={(e) => setBoardType(e)}
                selectedId={boardType}
                layout="row"
              />
            </View>
            <View style={[styles.lobbyOptions, styles.optionBlock]}>
              <View
                style={{ flexDirection: 'row', justifyContent: 'center', gap: 5 }}
              >
                <Text
                  style={{
                    textAlign: 'center',
                    fontSize: 20,
                    marginBottom: 10,
                    color: colors.text,
                  }}
                >
                  Square Colors
                </Text>
                <TouchableOpacity
                  style={[
                    styles.tooltip,
                    { marginTop: 3, backgroundColor: colors.button },
                  ]}
                  onPress={() => setSquareOptionVisible(true)}
                >
                  <Text style={[styles.tooltipText, { color: colors.text }]}>?</Text>
                </TouchableOpacity>
              </View>
              <RadioGroup
                containerStyle={{ justifyContent: 'center' }}
                radioButtons={squareOptions.map((option) => ({
                  ...option,
                  labelStyle: { fontSize: 15, color: colors.text },
                  borderColor: option.id === squareOption && colors.radioSelected,
                }))}
                onPress={(e) => setSquareOption(e)}
                selectedId={squareOption}
                layout="row"
              />
            </View>
            <View style={[styles.lobbyOptions, styles.optionBlock]}>
              <View
                style={{ flexDirection: 'row', justifyContent: 'center', gap: 5 }}
              >
                <Text
                  style={{
                    textAlign: 'center',
                    fontSize: 20,
                    marginBottom: 10,
                    color: colors.text,
                  }}
                >
                  Fog of War
                </Text>
                <TouchableOpacity
                  style={[
                    styles.tooltip,
                    { marginTop: 3, backgroundColor: colors.button },
                  ]}
                  onPress={() => setFogVisible(true)}
                >
                  <Text style={[styles.tooltipText, { color: colors.text }]}>?</Text>
                </TouchableOpacity>
              </View>
              <RadioGroup
                containerStyle={{ justifyContent: 'center' }}
                radioButtons={fogOptions.map((option) => ({
                  ...option,
                  labelStyle: { fontSize: 15, color: colors.text },
                  borderColor: option.id === fog && colors.radioSelected,
                }))}
                onPress={(e) => setFog(e)}
                selectedId={fog}
                layout="row"
              />
            </View>
            <View style={[styles.lobbyOptions, styles.optionBlock]}>
              <View
                style={{ flexDirection: 'row', justifyContent: 'center', gap: 5 }}
              >
                <Text
                  style={{
                    textAlign: 'center',
                    fontSize: 20,
                    marginBottom: 10,
                    color: colors.text,
                  }}
                >
                  Lobby Type
                </Text>
                <TouchableOpacity
                  style={[
                    styles.tooltip,
                    { marginTop: 3, backgroundColor: colors.button },
                  ]}
                  onPress={() => setLobbyTypeVisible(true)}
                >
                  <Text style={[styles.tooltipText, { color: colors.text }]}>?</Text>
                </TouchableOpacity>
              </View>
              <RadioGroup
                containerStyle={{ justifyContent: 'center' }}
                radioButtons={lobbyOptions.map((option) => ({
                  ...option,
                  labelStyle: { fontSize: 15, color: colors.text },
                  borderColor: option.id === lobbyType && colors.radioSelected,
                }))}
                onPress={(e) => setLobbyType(e)}
                selectedId={lobbyType}
                layout="row"
              />
            </View>
          </View>
          <View>
            <TouchableOpacity
              style={[styles.button, { opacity: userName == null && 0.5 }]}
              onPress={() => !block && userName && createBoard()}
            >
              <Text style={[styles.buttonText]}>Create Game</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  optionBlock: {
    marginTop: 10,
    marginBottom: 10,
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
  tooltip: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 50,
    width: 25,
    height: 25,
  },
  tooltipText: {
    textAlign: 'center',
    fontSize: 15,
  },
  //modal garbage
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
  buttonOpen: {
    backgroundColor: '#F194FF',
  },
  buttonClose: {
    backgroundColor: '#2196F3',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: 'bold',
    textShadowColor: 'black',
    textShadowRadius: 1,
    textShadowOffset: {
      width: 1,
      height: 1,
    },
  },
  modalButton: {
    borderRadius: 20,
    padding: 15,
    elevation: 2,
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    borderColor: 'white',
    borderWidth: 1,
    backgroundColor: '#2196F3',
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 20,
  },
})
