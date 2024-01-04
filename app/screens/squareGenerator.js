class Square {
  constructor(
    rowIndex,
    colIndex,
    color,
    defaultColor,
    fakeColor,
    index,
    colorIndex,
  ) {
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
  let dimensions = Math.sqrt(colorString.length)
  let squareArr = new Array(dimensions)
    .fill(0)
    .map((_, rowIndex) =>
      new Array(dimensions)
        .fill(0)
        .map((_, colIndex) => ({ value: 0, rowIndex, colIndex })),
    )
  let colorArr = []
  for (let x = 0; x < colorString.length; x++) {
    colorArr.push(colors[colorString[x]])
  }
  let i = 0
  squareArr.forEach((row) => {
    row.forEach(({ sq, rowIndex, colIndex }) => {
      let square = new Square(
        rowIndex,
        colIndex,
        colorArr[i],
        colorArr[i],
        colorArr[i],
        i,
        colors.indexOf(colorArr[i]),
      )
      row.splice(colIndex, 1, square)
      i++
    })
  })
  squareArr[0][0].captured = true
  return squareArr
}

export default generateBoard
