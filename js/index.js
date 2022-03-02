const canvas = document.getElementById('canvas')
const context = canvas.getContext('2d');

const scoreEl = document.getElementById('scoreEl')

canvas.width = 500
canvas.height = 550
let gameFrame = 0
let playerFrame = 0
let playerDirection = 'right'
let playerState = 'idle'

class Maze {
    static width = 40 // using static property so i dont have to created new object and make the values easier to read in the future or by someone else
    static height = 40
    constructor({position, image}){
    this.position = position
    this.width = 40
    this.height = 40
    this.image = image
    }
    
    draw() {
        // context.fillStyle = 'blue'
        // context.fillRect(this.position.x, this.position.y, this.width, this.height)
        context.drawImage(this.image,this.position.x, this.position.y)
    }
}

class Player {
    constructor({position, speed}){
        this.position = position
        this.speed = speed
        //this.image = image
        this.radius = 15 //size of player
        this.radians = 0.75 //the size of the mouth animation
        this.openRate = 0.06 // how fast his mouth moves
        this.rotation = 0
    }

    draw(){
        context.save()
        context.translate(this.position.x, this.position.y) // movement within the center
        context.rotate(this.rotation)
        context.translate(-this.position.x, -this.position.y)
        context.beginPath()
        context.arc(this.position.x, 
            this.position.y,
            this.radius, 
            this.radians, 
            Math.PI * 2 - this.radians)
        context.lineTo(this.position.x, this.position.y)  
        context.fillStyle = 'yellow'
        context.fill()
        context.closePath()
        context.restore()
    }
    update(){
        this.draw()
        this.position.x += this.speed.x
        this.position.y += this.speed.y

        if (this.radians < 0 || this.radians > 0.75) this.openRate = -this.openRate // animation going back and forth

        this.radians += this.openRate // keep it open in between 0 and 0.75
    }
}

class Ghost {
    static velocity = 2
    constructor({position, speed, color = 'red'}){
        this.position = position
        this.speed = speed 
        this.radius = 15
        this.color = color
        this.prevCollisions = []
        this.velocity = 2
        this.scared = false
    }

    draw(){
        context.beginPath()
        context.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2)  
        context.fillStyle = this.scared ? 'blue' : this.color
        context.fill()
        context.closePath()
    }
    update(){
        this.draw()
        this.position.x += this.speed.x
        this.position.y += this.speed.y
    }
}

class Candy {
    constructor({position, image}){
        this.position = position
        this.radius = 3 
        this.image = image
        
    }

    draw(){
        context.beginPath()
        context.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2)  
        context.fillStyle = 'white'
        context.fill()
        context.closePath()
        //context.drawImage(this.image,this.position.x, this.position.y, 20, 20)
    }
}

class PowerUp {
    constructor({position, image}) {
        this.position = position
        this.radius = 10
        this.image = image
    }

    draw(){
        context.beginPath()
        context.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2)  
        context.fillStyle = 'white'
        context.fill()
        context.closePath()
        //context.drawImage(this.image,this.position.x, this.position.y, 40, 65)
    }
}

const candies = []
const mazeBoundaries = []
const powerUps = []
// ghost location, speed, look
const ghosts = [
    new Ghost ({
        position: {
            x: Maze.width * 6 + Maze.width / 2, // width is where ghost starts
            y: Maze.height + Maze.height / 2
        },
        speed: {
            x: Ghost.velocity,
            y: 0
        }
    }),
    new Ghost ({
        position: {
            x: Maze.width * 8 + Maze.width / 2, // width is where ghost starts
            y: Maze.height * 3 + Maze.height / 2
        },
        speed: {
            x: Ghost.velocity,
            y: 0
        },
        color: 'pink'
    }),
    new Ghost ({
        position: {
            x: Maze.width * 4 + Maze.width / 2, // width is where ghost starts
            y: Maze.height * 8 + Maze.height / 2
        },
        speed: {
            x: Ghost.velocity,
            y: 0
        },
        color: 'green'
    })
]
const player = new Player({
    position: {
        x: Maze.width + Maze.width / 2,
        y: Maze.height + Maze.height / 2
    },
    speed: {
        x: 0,
        y: 0
    }
})

// which property is being pressed
const code = {
    ArrowUp: {
        pressed: false
    },
    ArrowDown: {
        pressed: false
    },
    ArrowRight: {
        pressed: false
    },
    ArrowLeft: {
        pressed: false
    }
}
let lastKey = ''
let score = 0

// 1, 2, 3, 4 = corner of map
// p = power up
// b = block
// . = candies


const map = [
    ['1', '-', '-', '-', '-', '-', '-', '-', '-', '-', '2'],
    ['|', '.', '.', '.', '.', '.', '.', '.', '.', '.', '|'],
    ['|', '.', 'b', '.', '[', '7', ']', '.', 'b', '.', '|'],
    ['|', '.', '.', '.', '.', '_', '.', '.', '.', '.', '|'],
    ['|', '.', '[', ']', '.', '.', '.', '[', ']', '.', '|'],
    ['|', '.', '.', '.', '.', '^', '.', '.', '.', '.', '|'],
    ['|', '.', 'b', '.', '[', '+', ']', '.', 'b', '.', '|'],
    ['|', '.', '.', '.', '.', '_', '.', '.', '.', '.', '|'],
    ['|', '.', '[', ']', '.', '.', '.', '[', ']', '.', '|'],
    ['|', '.', '.', '.', '.', '^', '.', '.', '.', '.', '|'],
    ['|', '.', 'b', '.', '[', '5', ']', '.', 'b', '.', '|'],
    ['|', '.', '.', '.', '.', '.', '.', '.', '.', 'p', '|'],
    ['4', '-', '-', '-', '-', '-', '-', '-', '-', '-', '3']
  ]

function createImage(src){
    const image = new Image()
    image.src = src
    return image  
}

// map images and sizing

map.forEach((row, i) => {
    row.forEach((symbol, j) => {
        switch (symbol) {
            case '-':
                mazeBoundaries.push(
                    new Maze({
                        position: {
                        x: Maze.width * j,
                        y: Maze.height * i
                        },
                        image: createImage('../images/pipeHorizontal.png')
                    })
                )
                break
                case '|':
                mazeBoundaries.push(
                    new Maze({
                        position: {
                        x: Maze.width * j,
                        y: Maze.height * i
                        },
                        image: createImage('../images/pipeVertical.png')
                    })
                )
                break
                case '1':
                mazeBoundaries.push(
                    new Maze({
                        position: {
                        x: Maze.width * j,
                        y: Maze.height * i
                        },
                        image: createImage('../images/pipeCorner1.png')
                    })
                )
                break
                case '2':
                mazeBoundaries.push(
                    new Maze({
                        position: {
                        x: Maze.width * j,
                        y: Maze.height * i
                        },
                        image: createImage('../images/pipeCorner2.png')
                    })
                )
                break
                case '3':
                mazeBoundaries.push(
                    new Maze({
                        position: {
                        x: Maze.width * j,
                        y: Maze.height * i
                        },
                        image: createImage('../images/pipeCorner3.png')
                    })
                )
                break
                case '4':
                mazeBoundaries.push(
                    new Maze({
                        position: {
                        x: Maze.width * j,
                        y: Maze.height * i
                        },
                        image: createImage('../images/pipeCorner4.png')
                    })
                )
                break
                case 'b':
                mazeBoundaries.push(
                    new Maze({
                        position: {
                        x: Maze.width * j,
                        y: Maze.height * i
                        },
                        image: createImage('../images/block.png')
                    })
                )
                break
                case '[':
                mazeBoundaries.push(
                    new Maze({
                        position: {
                        x: Maze.width * j,
                        y: Maze.height * i
                        },
                        image: createImage('../images/capLeft.png')
                    })
                )
                break
                case ']':
                mazeBoundaries.push(
                    new Maze({
                        position: {
                        x: Maze.width * j,
                        y: Maze.height * i
                        },
                        image: createImage('../images/capRight.png')
                    })
                )
                break
                case '_':
                mazeBoundaries.push(
                    new Maze({
                        position: {
                        x: Maze.width * j,
                        y: Maze.height * i
                        },
                        image: createImage('../images/capBottom.png')
                    })
                )
                break
                case '^':
                mazeBoundaries.push(
                    new Maze({
                        position: {
                        x: Maze.width * j,
                        y: Maze.height * i
                        },
                        image: createImage('../images/capTop.png')
                    })
                )
                break
                case '+':
                mazeBoundaries.push(
                    new Maze({
                        position: {
                        x: Maze.width * j,
                        y: Maze.height * i
                        },
                        image: createImage('../images/pipeCross.png')
                    })
                )
                break
                case '5':
                mazeBoundaries.push(
                    new Maze({
                        position: {
                        x: Maze.width * j,
                        y: Maze.height * i
                        },
                        image: createImage('../images/pipeConnectorTop.png')
                    })
                )
                break
                case '6':
                mazeBoundaries.push(
                    new Maze({
                        position: {
                        x: Maze.width * j,
                        y: Maze.height * i
                        },
                        image: createImage('../images/pipeConnectorRight.png')
                    })
                )
                break
                case '7':
                mazeBoundaries.push(
                    new Maze({
                        position: {
                        x: Maze.width * j,
                        y: Maze.height * i
                        },
                        image: createImage('../images/pipeConnectorBottom.png')
                    })
                )
                break
                case '8':
                mazeBoundaries.push(
                    new Maze({
                        position: {
                        x: Maze.width * j,
                        y: Maze.height * i
                        },
                        image: createImage('../images/pipeConnectorLeft.png')
                    })
                )
                break    
                case '.':
                    candies.push(
                        new Candy({
                            position: {
                            x: Maze.width * j + Maze.width/2,
                            y: Maze.height * i + Maze.height/2
                            },
                            image: createImage('../images/candy.png')
                        })
                    )
                    break 
                case 'p':
                    powerUps.push(
                        new PowerUp({
                            position: {
                            x: Maze.width * j + Maze.width/ 2,
                            y: Maze.width * i + Maze.height/ 2
                            },
                            //image: createImage('../images/pokeball.png')
                        })
                    )
        }
    })
})

function collision({circle,rectangle}) {
    const padding = Maze.width / 2 - circle.radius - 1 // padding so player doesn't leave inner map
    return (circle.position.y - circle.radius + circle.speed.y <= rectangle.position.y + rectangle.height + padding && // top side of player 
        circle.position.x + circle.radius + circle.speed.x >= rectangle.position.x - padding  && // right side of player
        circle.position.y + circle.radius + circle.speed.y >= rectangle.position.y - padding && // bottom of player
        circle.position.x - circle.radius + circle.speed.x <= rectangle.position.x + rectangle.width + padding) // left side of player (had a typo here that drove me nuts)
}

let animationId 

function animate(){
    animationId = requestAnimationFrame(animate)
    context.clearRect(0,0, canvas.width, canvas.height)

    if (gameFrame % 10 === 0 && playerState !== 'idle') {
        playerFrame++
        sx = playerFrame % 4 //4 represents how many sprite images in a row
        //sy = Math.floor((playerFrame / 4) % 1) //16 represents total image in a sprite and 4 represnts num of images in a column
    }
    gameFrame++
    // need to track & update the last key pressed and keep movement consistent
    if (code.ArrowUp.pressed && lastKey === 'ArrowUp') {
       for(let i = 0; i < mazeBoundaries.length; i++){ 
           const maze = mazeBoundaries[i]
        if(collision({
            circle: {...player, speed:{
                x: 0,
                y: -5
            }},
            rectangle: maze
        })
        ) {
            player.speed.y = 0
            break
        } else {
            player.speed.y = -5
        }
    }
    } else if (code.ArrowLeft.pressed && lastKey === 'ArrowLeft'){
        for(let i = 0; i < mazeBoundaries.length; i++){ 
            const maze = mazeBoundaries[i]
         if(collision({
             circle: {...player, speed:{
                 x: -5,
                 y: 0
             }},
             rectangle: maze
         })
         ) {
             player.speed.x = 0
             break
         } else {
             player.speed.x = -5
         }
     }
    } else if (code.ArrowDown.pressed && lastKey === 'ArrowDown'){
        for(let i = 0; i < mazeBoundaries.length; i++){ 
            const maze = mazeBoundaries[i]
         if(collision({
             circle: {...player, speed:{
                 x: 0,
                 y: 5
             }},
             rectangle: maze
         })
         ) {
             player.speed.y = 0
             break
         } else {
             player.speed.y = 5
         }
     }
    }
    else if (code.ArrowRight.pressed && lastKey === 'ArrowRight'){
        for(let i = 0; i < mazeBoundaries.length; i++){ 
            const maze = mazeBoundaries[i]
         if(collision({
             circle: {...player, speed:{
                 x: 5,
                 y: 0
             }
            },
             rectangle: maze
         })
         ) {
             player.speed.x = 0
             break
         } else {
             player.speed.x = 5
         }
     }
    }
    //detect collision between ghost and player
    for (let i = ghosts.length - 1; 0 <= i; i--){
        const ghost = ghosts[i]
    
    
        // lose condition(ghost touches player)
    if (
        Math.hypot(
        ghost.position.x - player.position.x,
        ghost.position.y - player.position.y
        ) < 
        ghost.radius + player.radius) {
            if(ghost.scared){
                ghosts.splice(i, 1)
            } else {

            
            cancelAnimationFrame(animationId)
        }}
    }
    
    // win condition
    if (candies.length === 0){
        cancelAnimationFrame(animationId)
    }

    // powerUps location
    for (let i = powerUps.length - 1; 0 <= i; i--){
        const powerUp = powerUps[i]
        powerUp.draw()

        //player collides with power up
        if (
            Math.hypot(
            powerUp.position.x - player.position.x,
            powerUp.position.y - player.position.y
            ) < 
            powerUp.radius + player.radius){
                powerUps.splice(i,1)
                // make ghost scared (edible)
                ghosts.forEach(ghost => {
                    ghost.scared = true
                    setTimeout(()=>{
                        ghost.scared = false
                    }, 5000)
                })
            }
    }

    // eating candies and adding score
    for (let i = candies.length - 1; 0 <= i; i--){
        const candy = candies[i]
        candy.draw()

        if (
            Math.hypot(
            candy.position.x - player.position.x,
            candy.position.y - player.position.y
            ) < 
            candy.radius + player.radius) {
                candies.splice(i, 1)
                score += 10
                scoreEl.innerHTML = score
            }
    }
    
        
    

    mazeBoundaries.forEach((maze) => {
    maze.draw()
    if (collision({
        circle: player,
        rectangle: maze
    })
    ){
        //console.log('colliding')
        player.speed.y = 0
        player.speed.x = 0
    }
})
    player.update()
    
    ghosts.forEach((ghost) => {
        ghost.update()
        

        const collisions = []
        mazeBoundaries.forEach(maze => {
            if(
                !collisions.includes('right') &&
                collision({
                circle: {...ghost, 
                    speed:{
                    x: ghost.velocity,
                    y: 0
                }},
                rectangle: maze
            })
            ) {
                collisions.push('right')
            }

            if(
                !collisions.includes('left') &&
                collision({
                circle: {...ghost, speed:{
                    x: -ghost.velocity,
                    y: 0
                }},
                rectangle: maze
            })
            ) {
                collisions.push('left')
            }

            if(
                !collisions.includes('up') &&
                collision({
                circle: {...ghost, speed:{
                    x: 0,
                    y: -ghost.velocity
                }},
                rectangle: maze
            })
            ) {
                collisions.push('up')
            }

            if(
                !collisions.includes('down') &&
                collision({
                circle: {...ghost, speed:{
                    x: 0,
                    y: ghost.velocity
                }},
                rectangle: maze
            })
            ) {
                collisions.push('down')
            }
        })

        if(collisions.length > ghost.prevCollisions.length)
        ghost.prevCollisions = collisions

        if (JSON.stringify(collisions) !== JSON.stringify(ghost.prevCollisions)){ // used JSON.stringify because I needed it to retun a string for the directions
            

            if (ghost.speed.x > 0) ghost.prevCollisions.push('right')
            else if (ghost.speed.x < 0) ghost.prevCollisions.push('left')
            else if (ghost.speed.y < 0) ghost.prevCollisions.push('up')
            else if (ghost.speed.y > 0) ghost.prevCollisions.push('down')
            
            //console.log(collisions)
            //console.log(ghost.prevCollisions)
            
            const pathways = ghost.prevCollisions.filter(collision => {
                return !collisions.includes(collision)
            })
            //console.log({pathways})

            const direction = pathways[Math.floor(Math.random() * pathways.length)]
            //console.log({direction})
            switch (direction) {
                case 'down':
                    ghost.speed.y = ghost.velocity
                    ghost.speed.x = 0
                    break
                case 'up':
                    ghost.speed.y = -ghost.velocity
                    ghost.speed.x = 0
                    break
                case 'right':
                    ghost.speed.y = 0
                    ghost.speed.x = ghost.velocity
                    break
                case 'left':
                    ghost.speed.y = 0
                    ghost.speed.x = -ghost.velocity
                    break
            }
            ghost.prevCollisions = []
        }
    })
    if (player.speed.x > 0) player.rotation = 0 // facing direction is right because the x axis is increasing
    else if (player.speed.x < 0) player.rotation = Math.PI //facing left
    else if (player.speed.y > 0) player.rotation = Math.PI / 2 //facing down
    else if (player.speed.y < 0) player.rotation = Math.PI * 1.5 // facing up
}

animate()


document.addEventListener('keydown', (event) => {
    event.preventDefault() // controls page from moving up and down which is the browser default
    switch (event.code){
        case 'ArrowUp':
            code.ArrowUp.pressed = true
            playerState = 'walk'
            lastKey = 'ArrowUp'
            playerDirection = 'up'
            break
        case 'ArrowLeft':
            code.ArrowLeft.pressed = true
            playerState = 'walk'
            playerDirection = 'left'
            lastKey = 'ArrowLeft'
            break
        case 'ArrowDown':
            code.ArrowDown.pressed = true
            playerState = 'walk'
            lastKey = 'ArrowDown'
            playerDirection = 'down'
            break
        case 'ArrowRight':
            code.ArrowRight.pressed = true
            playerState = 'walk'
            playerDirection = 'right'
            lastKey = 'ArrowRight'
    }
})

document.addEventListener('keyup', (event) => {
    playerState = 'idle'
    switch (event.code){
        case 'ArrowUp':
            code.ArrowUp.pressed = false
            break
        case 'ArrowLeft':
            code.ArrowLeft.pressed = false
            break
        case 'ArrowDown':
            code.ArrowDown.pressed = false
            break
        case 'ArrowRight':
            code.ArrowRight.pressed = false
    }
})

