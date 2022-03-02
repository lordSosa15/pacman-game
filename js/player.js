const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 500;

let gameFrame = 0
let playerFrame = 0
let playerDirection = 'right'
let playerState = 'idle'

const playerWalkDown = new Image();
playerWalkDown.src = '../images/ash_sprite_down.png';
const playerWalkUp = new Image();
playerWalkUp.src = '../images/ash_sprite_up.png';
const playerWalkLeft = new Image();
playerWalkLeft.src = '../images/ash_sprite_left.png';
const playerWalkRight = new Image();
playerWalkRight.src = '../images/ash_sprite_right.png';
const playerIdleRight = new Image();
playerIdleRight.src = '../images/ash_idle_right.png';
const playerIdleLeft = new Image();
playerIdleLeft.src = '../images/ash_idle_left.png';
const playerIdleUp = new Image();
playerIdleUp.src = '../images/ash_idle_up.png';
const playerIdleDown = new Image();
playerIdleDown.src = '../images/ash_idle_down.png'

let playerX = 0;
let playerY = canvas.height- 220;

let sx = 0
let sy = 0
let sWidth = 450
let sHeight = 590
//void ctx.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);

const drawPlayer = () => {
    let selectedImage = playerWalkRight;
    if (playerDirection === 'up' && playerState === 'walk') selectedImage = playerWalkUp
    else if (playerDirection === 'down' && playerState === 'walk') selectedImage = playerWalkDown
    else if (playerDirection === 'left' && playerState === 'walk') selectedImage = playerWalkLeft
    else if (playerDirection === 'right' && playerState === 'walk') selectedImage = playerWalkRight
    else if (playerDirection === 'up' && playerState === 'idle') selectedImage = playerIdleUp
    else if (playerDirection === 'down' && playerState === 'idle') selectedImage = playerIdleDown
    else if (playerDirection === 'left' && playerState === 'idle') selectedImage = playerIdleLeft
    else if (playerDirection === 'right' && playerState === 'idle') selectedImage = playerIdleRight


  ctx.drawImage(selectedImage,sx * sWidth, sy * sHeight, sWidth, sHeight, playerX, playerY, canvas.width/5, canvas.height/5);
};

const animation = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPlayer();


    //We used 10 to control our animation frame rate
    if (gameFrame % 10 === 0 && playerState !== 'idle') {
        playerFrame++
        sx = playerFrame % 4 //4 represents how many sprite images in a row
        //sy = Math.floor((playerFrame / 4) % 1) //16 represents total image in a sprite and 4 represnts num of images in a column
    }

    gameFrame++
  requestAnimationFrame(animation);
};

animation();

document.addEventListener('keydown', (event) => {
    event.preventDefault()
    if (event.code === 'ArrowLeft') {
        playerX -= 10 
        playerState = 'walk'
        playerDirection = 'left';
    }
    if (event.code === 'ArrowRight') {
        playerX += 10 
        playerState = 'walk'
        playerDirection = 'right';
    }
    if (event.code === 'ArrowUp') {
        playerY -= 10 
        playerState = 'walk'
        playerDirection = 'up';
    }
    if (event.code === 'ArrowDown') {
        playerY += 10 
        playerState = 'walk'
        playerDirection = 'down';
    }
});
document.addEventListener('keyup', (event) => {
    playerState = 'idle'
})