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
let player = new Player(boardWidth/2 - TILE_SIZE, boardHeight - TILE_SIZE*8, TILE_SIZE*4, TILE_SIZE*8, playerVelocityX, 1);
let enemy = new Player(boardWidth/2 - TILE_SIZE*6, boardHeight- TILE_SIZE*8, TILE_SIZE*4, TILE_SIZE*8, enemyVelocityX, 2);


let playerImg = Assets.player;
let moveImg = Assets.player;
let enemyImg = Assets.boss;
let attackImg = Assets.playerAttack;
let blockImg = Assets.playerBlock;
let crouchImg = Assets.crouch;
let kickImg = Assets.kick;
const keys = {};

let lastMoveTime = 0;
const moveInterval = 30;
let lastActionTime = 0;
const actionInterval = 100;

const soundManager = new SoundManager();

// Load sounds
soundManager.load('attack', './resources/soundeffects/ora.mp3');
soundManager.load('kick', './resources/soundeffects/muda.mp3')



function init() {
    setupCanvas();
    document.addEventListener('keydown', (e) => keys[e.code] = true);
    document.addEventListener('keyup', (e) => keys[e.code] = false);
    document.addEventListener('dmgTakenEvent', updateHP)
    requestAnimationFrame(update);

}

function setupCanvas() {
    board = document.getElementById('board');
    board.width = boardWidth;
    board.height = boardHeight;
    context = board.getContext('2d');
}

function loadAssets(onComplete) {
    let loaded = 0;
    const totalAssets = Object.keys(Assets).length;

    for (let key in Assets) {
        Assets[key].onload = () => {
            loaded++;
            // Once all assets are loaded, start the game
            if (loaded === totalAssets) {
                onComplete();
            }
        };
    }

}

loadAssets(init);

/** GAME LOOP */
function update() {
    requestAnimationFrame(update);
    console.log('Updating game frame'); // Log to ensure this is called

    context.clearRect(0,0, boardWidth, boardHeight);
    handleMovement();
    const playerImages = {
        move: playerImg,
        block: blockImg,
        crouch: crouchImg,
        kick: kickImg
    }
    const enemyImages = {
        move: moveImg,
        block: blockImg,
        crouch: crouchImg,
        kick: kickImg
    };
    player.applyPhysics(boardHeight);
    drawHelper.drawCharacter(context, player, playerImages);
    drawHelper.drawCharacter(context, enemy, enemyImages);
    enemy.applyPhysics(boardHeight);
    handleAction();
    updateAttacks();
    player.drawAttacks(context, {'punch': attackImg, 'kick': kickImg});
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

function handleMovement() {
    const currentTime = Date.now();

    if (currentTime - lastMoveTime < moveInterval) {
        return;
    }

    lastMoveTime = currentTime;
    if (!keys['ArrowDown']) player.uncrouch();
    if (keys['KeyW']) {player.block(); return;};
    if (keys['ArrowDown']) {player.crouch(); return};

    if (keys['ArrowLeft'] && isInBounds(player, false)) {
        if (isColliding(player, enemy) && player.x >= enemy.x) return;
        player.move(-playerVelocityX,0);
    } 
    if (keys['ArrowRight'] && isInBounds(player, true)) {
        if (isColliding(player, enemy) && player.x <= enemy.x) return;
        player.move(playerVelocityX, 0);
    } 
    if (keys['Space']) player.jump();
}

function handleAction() {
    const currentTime = Date.now();

    if (currentTime - lastActionTime < actionInterval) {
        return;
    }

    lastActionTime = currentTime;
    if (keys['KeyQ'] && keys['ArrowDown'] && player.isOnGround) {
        player.kick(enemy,200);
        soundManager.play('kick'); 

    }
    else if (keys['KeyQ']) {
        keys['KeyW'] = false;  // disable block key
        player.attack();
    }
}


function movePlayer(e) {
    const code = e.code;
    keys[code] = true; // Mark key as pressed
    if (code === 'ArrowLeft' && player.x - playerVelocityX >=0) {
        if (isColliding(player, enemy) && player.x >= enemy.x) return;
        player.move(-playerVelocityX,0);
        return;
    } 
    if (code === 'ArrowRight' && player.x + playerVelocityX <= boardWidth - player.width) {
        if (isColliding(player, enemy) && player.x <= enemy.x) return;
        player.move(playerVelocityX, 0);
        return;
    }
    if (code === 'ArrowDown') {
        player.crouch();
        return;
    }
    if (code === 'Space') {
        player.jump(enemyVelocityY);
        return;
    } 
    if (code === 'KeyW') {
        player.block();
        return;
    }
    if (code === 'Numpad4' && enemy.x - enemyVelocityX >=0) {
        if (isColliding(player, enemy) && enemy.x >= player.x) return;
        enemy.move(-enemyVelocityX,0);
        return;
    } 
    if (code === 'Numpad6' && enemy.x + enemyVelocityX <= boardWidth - enemy.width) {
        if (isColliding(player, enemy) && enemy.x <= player.x) return;
        enemy.move(enemyVelocityX,0);
        return;
    } 
    if (code === 'Numpad8') {
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

function isInBounds(player, right) {
    if (right) return player.x + playerVelocityX <= boardWidth - player.width;
    return player.x - playerVelocityX >=0;
}



function updateHP(e) {
    const target = e.detail.target;
    const dmg = e.detail.dmg;
    const hp = e.detail.hp;
    if (target == 1) {
        document.getElementById('player-health').innerText = hp;
    } else document.getElementById('enemy-health').innerText = hp;
}