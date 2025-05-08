/** CONSTANTS */
const COLUMNS = 40;
const ROWS = 20;
const TILE_SIZE = 32;
const boardWidth = COLUMNS*TILE_SIZE;
const boardHeight = ROWS*TILE_SIZE;
const playerVelocityX = TILE_SIZE/2;
const enemyVelocityX = TILE_SIZE/2;
const enemyVelocityY = TILE_SIZE;
const attackVelocityX = TILE_SIZE;


/** GAME VARIABLES */

let board, context;
let player = new Player(boardWidth/2 - TILE_SIZE, boardHeight - TILE_SIZE*8, TILE_SIZE*4, TILE_SIZE*8, playerVelocityX);
let enemy = new Player(boardWidth/2 - TILE_SIZE*4, boardHeight- TILE_SIZE*8, TILE_SIZE*4, TILE_SIZE*8, enemyVelocityX);

let playerImg = Assets.player;
let enemyImg = Assets.boss;
let attackImg = Assets.playerAttack;
let playerBlockImg = Assets.playerBlock;

const soundManager = new SoundManager();

// Load sounds
soundManager.load('attack', './resources/soundeffects/ora.mp3');

init();


function init() {
    setupCanvas();
    loadAssets();
    requestAnimationFrame(update);
    document.addEventListener("keydown", movePlayer);
    document.addEventListener("keyup", attack);
}

function setupCanvas() {
    board = document.getElementById('board');
    board.width = boardWidth;
    board.height = boardHeight;
    context = board.getContext('2d');
}

function loadAssets() {
    playerImg.onload = () => player.draw(context, playerImg);
    player.onload = () => enemy.draw(context, enemyImg);
}

/** GAME LOOP */
function update() {
    requestAnimationFrame(update);

    context.clearRect(0,0, boardWidth, boardHeight);

    player.applyPhysics(boardHeight);
    player.draw(context, playerImg, playerBlockImg);
    enemy.applyPhysics(boardHeight);
    enemy.draw(context, enemyImg);
    updateAttacks();
    player.drawAttacks(context, attackImg);
}

function updateAttacks() {
    for (let i = 0; i < player.attacks.length; i++) {
        let attack = player.attacks[i];
        attack = moveAttack(attack);

        if (!attack) {
            player.attacks.splice(i, 1);
            i--;
        }
    }
}


function movePlayer(e) {

    if (e.code === 'ArrowLeft' && player.x - playerVelocityX >=0) {
        if (isColliding(player, enemy) && player.x >= enemy.x) return;
        player.move(-playerVelocityX,0);
        return;
    } 
    if (e.code === 'ArrowRight' && player.x + playerVelocityX <= boardWidth - player.width) {
        if (isColliding(player, enemy) && player.x <= enemy.x) return;
        player.move(playerVelocityX, 0);
        return;
    }
    if (e.code === 'Space') {
        player.jump(enemyVelocityY);
        return;
    } 
    if (e.key.toLowerCase() === 'z') {
        player.block();
        return;
    }
    if (e.key === '4' && enemy.x - enemyVelocityX >=0) {
        if (isColliding(player, enemy) && enemy.x >= player.x) return;
        enemy.move(-enemyVelocityX,0);
        return;
    } 
    if (e.key === '6' && enemy.x + enemyVelocityX <= boardWidth - enemy.width) {
        if (isColliding(player, enemy) && enemy.x <= player.x) return;
        enemy.move(enemyVelocityX,0);
        return;
    } 
    if (e.key === '8') {
        enemy.jump(enemyVelocityY);
        return;
    } 
    
}

function moveAttack(attack) {
    const velocity = attack.isFacingRight ? attack.velocityX : -attack.velocityX;
    let newX = attack.x + velocity;

    if (newX >= 0 && newX <= boardWidth - attack.width) {
        if (isColliding(attack, enemy) && enemy.action !== 'BLOCK') {
            console.log('attack landed');
            enemy.takeHit(attack);
            updateHP();
            return null;
        } 
        if (isColliding(attack, enemy) && enemy.action === 'BLOCK') {
            console.log('attack blocked');
            return null;
        }
        attack.move(velocity, 0);
        return attack;
    }
    return null;

}

function isColliding(player, enemy){
    let ox = Math.abs(player.x - enemy.x) < (player.x < enemy.x ? enemy.width : player.width);
    let oy = Math.abs(player.y - enemy.y) < (player.y < enemy.y ? enemy.height : player.height);
    return ox && oy;
}

function attackLanded(player, enemy) {
    return isColliding(player, enemy) && enemy.action !== 'BLOCK';
}

function attack(e) {
    let isBlockActive = false;
    if (e.key.toLowerCase() === 'z') {
        isBlockActive = true;
        player.action = 'IDLE';
        return;
    }
        // Prevent other keys while Z(block) is held
     if (isBlockActive && e.key.toLowerCase() !== "z") {
        e.preventDefault();
        return;
    }
    if (e.key.toLowerCase() === 'a') {
        player.attack();
        soundManager.play('attack');
        return;
    }
}


function updateHP() {
    document.getElementById('player-health').innerText = player.hp;
    document.getElementById('enemy-health').innerText = enemy.hp;
}