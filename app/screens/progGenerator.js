class Square {
    constructor(rowIndex, colIndex, color, defaultColor, fakeColor, index, colorIndex) {
        this.rowIndex = rowIndex
        this.colIndex = colIndex
        this.color = color
        this.defaultColor = defaultColor
        this.fakeColor = fakeColor
        this.index = index
        this.captured = false
        this.colorIndex = colorIndex
    }
}

let red = 'hsl(0, 100%, 40%)'
let orange = 'hsl(22, 100%, 50%)'
let yellow = 'hsl(60, 100%, 50%)'
let green = 'hsl(130, 100%, 15%)'
let blue = 'hsl(242, 69%, 49%)'

const colors = [red, orange, yellow, green, blue]

function generateBoard(colorString) {
    let i = 0
    let fullArr = []
    let colorArr = []
    for (let x = 0; x < colorString.length; x++) {
        colorArr.push(colors[colorString[x]])
    }
    let j = 0
    for (let y = 5; y < 23; y++) {
        let dimensions = y
        i = 0
        let squareArr = new Array(dimensions).fill(0).map((_, rowIndex) => new Array(dimensions).fill(0).map((_, colIndex) => ({ value: 0, rowIndex, colIndex })))
        squareArr.forEach(row => {
            row.forEach(({sq, rowIndex, colIndex}) => {
                let square = new Square(rowIndex, colIndex, colorArr[j], colorArr[j], colorArr[j], i, colors.indexOf(colorArr[j]))
                row.splice(colIndex, 1, square)
                i++
                j++
            })
        })
        squareArr[0][0].captured = true
        fullArr.push(squareArr.flat())
    }
    return fullArr
}

export default generateBoard