import { Appearance } from 'react-native'

export const squareColors = [
  [
    'hsl(0, 100%, 40%)',
    'hsl(22, 100%, 50%)',
    'hsl(60, 100%, 50%)',
    'hsl(130, 100%, 15%)',
    'hsl(242, 69%, 49%)',
    'rgb(255,255,255)',
    'rgb(30,30,30)',
  ],
  [
    'hsl(33, 90.8%, 12.7%)',
    'hsl(33, 89.8%, 26.9%)',
    'hsl(25, 95.4%, 42.7%)',
    'hsl(221, 69.2%, 43.3%)',
    'hsl(213, 68.6%, 90%)',
    'rgb(133, 7, 7)',
    'rgb(8, 68, 17)',
  ],
  [
    'hsl(358,83%,35%)',
    'hsl(2,72%,51%)',
    'hsl(211,88%,32%)',
    'hsl(0,0%,39%)',
    'hsl(0,0%,14%)',
    'rgb(143, 4, 156)',
    'rgb(255, 235, 15)',
  ],
  [
    'hsl(164,95%,43%)',
    'hsl(240,100%,98%)',
    'hsl(43,100%,70%)',
    'hsl(197,19%,36%)',
    'hsl(200,43%,7%)',
    'rgb(5, 73, 157)',
    'rgb(197, 42, 11)',
  ],
  [
    'hsl(7,55%,30%)',
    'hsl(6,56%,49%)',
    'hsl(24,38%,87%)',
    'hsl(183,66%,28%)',
    'hsl(180,20%,20%)',
    'rgb(228, 174, 13)',
    'rgb(110, 13, 228)',
  ],
  [
    'hsl(83, 45%, 18%)',
    'hsl(59,70%,30%)',
    'hsl(55, 47%, 78%)',
    'hsl(48,99%,59%)',
    'hsl(27, 55%, 33%)',
    'rgb(31, 194, 215)',
    'rgb(204, 72, 16)',
  ],
]

export const lightModeColors = {
  text: 'black',
  background: 'rgb(245,245,245)',
  game: 'lightblue',
  tableRow: 'rgb(220,220,220)',
  tableTop: 'rgb(180,180,180)',
  button: 'rgb(230,230,230)',
  radioSelected: 'black',
  outline: 'black',
}

export const darkModeColors = {
  text: 'rgb(230,230,230)',
  outline: 'white',
  background: 'rgb(50,50,50)',
  button: 'rgb(30,30,30)',
  tableRow: 'rgb(30,30,30)',
  tableTop: 'rgb(20,20,20)',
  game: 'rgb(6,37,105)',
  radioSelected: 'white',
}

// const isDark = Appearance.getColorScheme() == 'dark'
// export const colors = isDark ? darkModeColors : lightModeColors
