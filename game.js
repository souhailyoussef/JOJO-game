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

let playerAssets, enemyAssets;

let context;
let player; new Player(boardWidth/2 - TILE_SIZE, boardHeight - TILE_SIZE*8, TILE_SIZE*4, TILE_SIZE*8, playerVelocityX, 1);
let enemy; new Player(boardWidth/2 - TILE_SIZE*6, boardHeight- TILE_SIZE*8, TILE_SIZE*4, TILE_SIZE*8, enemyVelocityX, 2);
let menu = document.getElementById('menu');
let board = document.getElementById('board');


let selectedCharacters = [];
const keys = {};
let gameEnded = false;

const KEY_BINDINGS = {
    PLAYER_1 : {
        ATTACK: 'KeyQ',
        BLOCK: 'KeyW',
        THROW: 'KeyE',
        UP: 'Space',
        DOWN: 'ArrowDown',
        LEFT: 'ArrowLeft',
        RIGHT: 'ArrowRight'
    },
    PLAYER_2: {
        ATTACK: 'KeyO',
        BLOCK: 'KeyP',
        THROW: 'KeyI',
        UP: 'Numpad8',
        DOWN: 'Numpad5',
        LEFT: 'Numpad4',
        RIGHT: 'Numpad6'
    }

}

const soundManager = new SoundManager();

// Load sounds
soundManager.load('attack', './resources/soundeffects/ora.mp3');
soundManager.load('kick', './resources/soundeffects/muda.mp3');
soundManager.load('theme', './resources/soundeffects/background_theme.mp3');
soundManager.load('theme2', './resources/soundeffects/background_theme_2.mp3');

let characters = new Map();
fetch('./characters.json')
  .then(res => res.json())
  .then(data => {
    data.forEach(char => {
      characters.set(char.name.toLowerCase(), char);
    });
  });

const fighters = document.querySelectorAll('.fighter');
const player1Container = document.querySelector('.player1');
const player2Container = document.querySelector('.player2');
const startBtn = document.getElementById('start');


let selectedFighter1 = document.querySelector('.fighter[hover1]');
let selectedFighter2 = document.querySelector('.fighter[hover2]');
let currentSelectingPlayer = 1;

fighters.forEach(fighter => {
    fighter.addEventListener('click', function() {
        handlePlayerSelection(currentSelectingPlayer, fighter);
        currentSelectingPlayer++;
    })
})

startBtn.addEventListener('click', (e) => {
    startBtn.disabled = true;
    soundManager.play('theme2');
    loadCharacterAssets(selectedCharacters, function(assets) {
        init(assets);
    });
});




function init(assets) {
    player = new Player(boardWidth/2 - TILE_SIZE, boardHeight - TILE_SIZE*8, TILE_SIZE*4, TILE_SIZE*8, playerVelocityX, 1);
    enemy= new Player(boardWidth/2 - TILE_SIZE*6, boardHeight- TILE_SIZE*8, TILE_SIZE*4, TILE_SIZE*8, enemyVelocityX, 2);
    menu.style.display = 'none';
    board.style.display = 'block';
    gameEnded = false;
    setupCanvas();
    playerAssets = assets[selectedCharacters[0]];
    enemyAssets = assets[selectedCharacters[1]];
    setFrameCounts(assets);
    document.addEventListener('keydown', (e) => {
        if (e.repeat && e.code === 'KeyQ') return;
        keys[e.code] = true;
    });
    document.addEventListener('keyup', (e) => keys[e.code] = false);
    requestAnimationFrame(update);

}

function setupCanvas() {
    board.hidden = false;
    board.width = boardWidth;
    board.height = boardHeight;
    context = board.getContext('2d');
}


/** GAME LOOP */
function update() {
    if (gameEnded) {
        menu.style.display = 'block';
        board.style.display = 'none';
        return;
    }
    detectEndGame();
    requestAnimationFrame(update);

    context.clearRect(0,0, boardWidth, boardHeight);
    handleMovement();
    updateEntity(player);
    updateEntity(enemy);
    updateAttacks(player, enemy);
    player.applyPhysics(boardHeight);
    enemy.applyPhysics(boardHeight);

    drawHelper.drawCharacter(context, player, playerAssets);
    drawHelper.drawCharacter(context, enemy, enemyAssets);
    player.attacks.forEach(p => drawHelper.drawProjectile(context, p, playerAssets));
    enemy.attacks.forEach(p => drawHelper.drawProjectile(context, p, playerAssets));

    handleAction();
    drawHelper.drawStats(context, player, {width: boardWidth, height: boardHeight}, true, playerAssets.portrait[0]);
    drawHelper.drawStats(context, enemy, {width: boardWidth, height: boardHeight}, false, enemyAssets.portrait[0]);

}

function updateAttacks(player, enemy) {
    for (let i = 0; i < player.attacks.length; i++) {
        let attack = player.attacks[i];
        attack = moveAttack(attack, enemy);

        if (!attack) {
            player.attacks.splice(i, 1);
            i--;
        }
    }

    for (let i = 0; i < enemy.attacks.length; i++) {
        let attack = enemy.attacks[i];
        attack = moveAttack(attack, player);

        if (!attack) {
            enemy.attacks.splice(i, 1);
            i--;
        }
    }
}

function handleMovement() {
    if (released(KEY_BINDINGS.PLAYER_1.BLOCK) && !player.active() && player.isOnGround) {
        player.setIdle();
    }
    if (released(KEY_BINDINGS.PLAYER_2.BLOCK) && !enemy.active() && enemy.isOnGround) {
        enemy.setIdle();
    }
    handleBlockLogic(player, KEY_BINDINGS.PLAYER_1.BLOCK);
    handleBlockLogic(enemy, KEY_BINDINGS.PLAYER_2.BLOCK);

    handleCrouchLogic(player, KEY_BINDINGS.PLAYER_1.DOWN);
    handleCrouchLogic(enemy, KEY_BINDINGS.PLAYER_2.DOWN);
    handleMoveHoriz(player, KEY_BINDINGS.PLAYER_1.LEFT, enemy, true);
    handleMoveHoriz(player, KEY_BINDINGS.PLAYER_1.RIGHT, enemy, false);
    handleMoveHoriz(enemy, KEY_BINDINGS.PLAYER_2.LEFT, player, true);
    handleMoveHoriz(enemy, KEY_BINDINGS.PLAYER_2.RIGHT, player, false);
    handleJump(player, KEY_BINDINGS.PLAYER_1.UP);
    handleJump(enemy, KEY_BINDINGS.PLAYER_2.UP);
}

function handleAction() {

    if (keys['KeyN']) {
        keys['KeyW'] = false;
        player.specialAttack(enemy);
    }
    handleAttack(player, KEY_BINDINGS.PLAYER_1.ATTACK, KEY_BINDINGS.PLAYER_1.DOWN, KEY_BINDINGS.PLAYER_1.BLOCK, enemy);
    handleAttack(enemy, KEY_BINDINGS.PLAYER_2.ATTACK, KEY_BINDINGS.PLAYER_2.DOWN, KEY_BINDINGS.PLAYER_2.BLOCK, player);
    handleThrow(player, KEY_BINDINGS.PLAYER_1.THROW, KEY_BINDINGS.PLAYER_1.BLOCK);
    handleThrow(enemy, KEY_BINDINGS.PLAYER_2.THROW, KEY_BINDINGS.PLAYER_2.BLOCK);
    
}

function moveAttack(attack, target) {
    const velocity = attack.isFacingRight ? attack.velocityX : -attack.velocityX;
    let newX = attack.x + velocity;

    if (newX >= 0 && newX <= boardWidth - attack.width) {
        if (isAttackLanded(attack, target) && target.action !== 'BLOCK') {
            console.log('attack landed');
            target.takeHit(attack);
            return null;
        } 
        if (isAttackLanded(attack, target) && target.action === 'BLOCK') {
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

function isAttackLanded(attack, enemy) {
    const overlapX = attack.x >= enemy.x && attack.x <= enemy.x + enemy.width;
    const overlapY = attack.y >= enemy.y && attack.y <= enemy.y + enemy.height;
    return overlapX && overlapY;
}

function isInBounds(player, right) {
    if (right) return player.x + playerVelocityX <= boardWidth - player.width;
    return player.x - playerVelocityX >=0;
}

function updateEntity(entity) {
    if (entity.actionTimer > 0) {
        entity.actionTimer--;
    }
    if (entity.actionTimer == 0 && entity.action !== 'CROUCH' && entity.action !== 'BLOCK' && entity.isOnGround) entity.setIdle();
    entity.frameTimer--;
    if (entity.frameTimer <= 0) {

        const frameName = entity.action + entity.actionVariation;
        entity.frameIndex = (entity.frameIndex + 1) % entity.frameCount[frameName];
        entity.frameTimer = entity.frameDelay;
    }
}

function drawSpecialAttack() {
    console.log('drawing');
}

function setStars(element, value) {  
    element.textContent = '';
  for (let i = 0; i < value; i++) {
    const star = document.createElement('img');
    star.src ='./resources/star.webp';
    star.alt = '★';
    star.style.width = '35px';
    star.style.height = '35px';
    element.appendChild(star);
  }
}

function handlePlayerSelection(currentPlayer, fighter) {
    if (currentPlayer === 1) {
        if (selectedFighter1) selectedFighter1.removeAttribute('hover1');
        selectedFighter1 = fighter;
        const fighterName = fighter.getAttribute('fighter');
        fighter.setAttribute('hover1', true);
        const fighter1State = characters.get(fighterName);
        player1Container.querySelector('img').setAttribute('src', `./resources/${fighterName}/full_portrait.webp`);
        player1Container.querySelector('.name').textContent = fighterName;
        setStars(player1Container.querySelector('.power'), fighter1State.power);
        setStars(player1Container.querySelector('.speed'), fighter1State.speed);
        setStars(player1Container.querySelector('.range'), fighter1State.range);
        selectedCharacters[0] = fighterName;
    } else {
        if (selectedFighter2) selectedFighter2.removeAttribute('hover2');
        selectedFighter2 = fighter;
        const fighterName = fighter.getAttribute('fighter');
        fighter.setAttribute('hover2', true);
        const fighter2State = characters.get(fighterName)
        player2Container.querySelector('img').setAttribute('src', `./resources/${fighterName}/full_portrait.webp`);
        player2Container.querySelector('.name').textContent = fighterName;
        setStars(player2Container.querySelector('.power'), fighter2State.power);
        setStars(player2Container.querySelector('.speed'), fighter2State.speed);
        setStars(player2Container.querySelector('.range'), fighter2State.range);
        selectedCharacters[1] = fighterName;
        startBtn.removeAttribute('disabled');
    }

}

function setFrameCounts(assets) {

    const player1 = selectedCharacters[0];
    const player2 = selectedCharacters[1];
    let frameCount = {};
    for (const [key, value] of Object.entries(assets[player1])) {
        frameCount[key.toUpperCase()] = value.length;
    }
    player.setFrameCount(frameCount);
    frameCount = {}
     for (const [key, value] of Object.entries(assets[player2])) {
        frameCount[key.toUpperCase()] = value.length;
    }
    enemy.setFrameCount(frameCount);
}

function detectEndGame() {
    if (player.hp <= 0 || enemy.hp <=0) gameEnded = true;
}

/** HELPER **/

const pressed   = code => keys[code];
const released  = code => !keys[code];
const release = code => keys[code] = false;

function handleCrouchLogic(actor, keyBinding) {
    if (released(keyBinding) && !actor.active()) actor.uncrouch();
    if (pressed(keyBinding)) actor.crouch();
}

function handleBlockLogic(actor, keyBinding) {
    if (pressed(keyBinding)) actor.block();
}

function handleMoveHoriz(actor, keyBinding, target, left) {
    if (left && pressed(keyBinding) && isInBounds(actor, false)) {
        if (isColliding(actor, target) && actor.x >= target.x) return;
        if (actor.actionTimer > 0) return;
        actor.move(-playerVelocityX, 0);
    }
    else if (pressed(keyBinding) && isInBounds(actor, true)) {
        if (isColliding(actor, target) && actor.x <= target.x) return;
        if (actor.actionTimer > 0) return;
        actor.move(playerVelocityX, 0);
    }
    
}

function handleJump(actor, keyBinding) {
    if (pressed(keyBinding)) actor.jump();
}

function cancelBlock(keyBinding) {
    keys[keyBinding] = false;
}

function handleAttack(actor, keyBinding1, keyBinding2, keyBinding3, target) {
    if (pressed(keyBinding1) && pressed(keyBinding2) && actor.isOnGround && actor.action === 'CROUCH') {
        actor.kick(target, () => soundManager.play('kick'));
        return;
    }
    if (pressed(keyBinding1)) {
        cancelBlock(keyBinding3);
        actor.punch(target, () => soundManager.play('attack'));
        return;
    }
}

function handleThrow(actor, keyBinding1, keyBinding2) {
    if (pressed(keyBinding1)) {
        release(keyBinding2);
        actor.attack();
    }
}