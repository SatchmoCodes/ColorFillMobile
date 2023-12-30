import { Appearance } from "react-native";

export const lightModeColors = {
    text: 'black',
    background: 'white',
    game: 'lightblue'
}

export const darkModeColors = {
    text: 'rgb(230,230,230)',
    outline: 'white',
    background: 'rgb(50,50,50)',
    button: 'rgb(30,30,30)',
    tableRow: 'rgb(30,30,30)',
    game: 'rgb(6,37,105)'
}

const isDark = Appearance.getColorScheme() == 'dark'
export const colors = isDark ? darkModeColors : lightModeColors