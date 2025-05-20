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

let context;
let menu = document.getElementById('menu');
let board = document.getElementById('board');


let selectedCharacters = [];
const keys = {};
const gameState = {
    ended: false, 
    paused: false,
    player: null,
    playerId: 0,
    playerAssets: {},
    enemy: null,
    enemyId: 0,
    enemyAssets: {}
}

const KEY_BINDINGS = {
    PLAYER_1 : {
        ATTACK: 'KeyQ',
        BLOCK: 'KeyW',
        THROW: 'KeyE',
        STAND: 'KeyS',
        UP: 'Space',
        DOWN: 'ArrowDown',
        LEFT: 'ArrowLeft',
        RIGHT: 'ArrowRight'
    },
    PLAYER_2: {
        ATTACK: 'KeyO',
        BLOCK: 'KeyP',
        THROW: 'KeyI',
        STAND: 'KeyN',
        UP: 'Numpad8',
        DOWN: 'Numpad5',
        LEFT: 'Numpad4',
        RIGHT: 'Numpad6'
    }

}

const soundManager = new SoundManager();

let obstacle = new Obstacle();

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
    const character1 = characters.get(selectedCharacters[0]);
    const character2 = characters.get(selectedCharacters[1]);
    const player = new Player(boardWidth/2 - TILE_SIZE, boardHeight - TILE_SIZE*8, TILE_SIZE*4, TILE_SIZE*8, playerVelocityX, 1, character1.punchRange, character1.punchDmg, character1.kickRange, character1.kickDmg, character1.ammo, character1.projectileDmg, character1.reloadTime);
    const enemy= new Player(boardWidth/2 - TILE_SIZE*6, boardHeight- TILE_SIZE*8, TILE_SIZE*4, TILE_SIZE*8, enemyVelocityX, 2, character2.punchRange, character2.punchDmg, character2.kickRange, character2.kickDmg, character2.ammo, character2.projectileDmg, character2.reloadTime);
    
    gameState.player = player;
    gameState.playerId = 1;
    gameState.enemy = enemy;
    gameState.enemyId = 2;
    menu.style.display = 'none';
    board.style.display = 'block';
    gameState.gameEnded = false;
    setupCanvas();
    gameState.playerAssets = assets[selectedCharacters[0]];
    gameState.enemyAssets = assets[selectedCharacters[1]];
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
    context.clearRect(0,0, boardWidth, boardHeight);

    if (gameState.gameEnded) {
        menu.style.display = 'block';
        board.style.display = 'none';
        return;
    }
    if (gameState.paused) {
        drawStandAnimation(gameState.player, gameState.enemy, "ZA WARUDO");
        requestAnimationFrame(update);
    } else {
        object = null;
        detectEndGame();
        requestAnimationFrame(update);

        handleMovement();
        updateEntity(gameState.player);
        updateEntity(gameState.enemy);
        updateAttacks(gameState.player, gameState.enemy);
        gameState.player.applyPhysics(boardHeight);
        gameState.enemy.applyPhysics(boardHeight);
    
        drawHelper.drawCharacter(context, gameState.player, gameState.playerAssets);
        drawHelper.drawCharacter(context, gameState.enemy, gameState.enemyAssets);
        gameState.player.attacks.forEach(p => drawHelper.drawProjectile(context, p, gameState.playerAssets));
        gameState.enemy.attacks.forEach(p => drawHelper.drawProjectile(context, p, gameState.playerAssets));
    
        handleAction();
        drawHelper.drawStats(context, gameState.player, {width: boardWidth, height: boardHeight}, true, gameState.playerAssets.portrait[0]);
        drawHelper.drawStats(context, gameState.enemy, {width: boardWidth, height: boardHeight}, false, gameState.enemyAssets.portrait[0]);
    }


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
    if (released(KEY_BINDINGS.PLAYER_1.BLOCK) && !gameState.player.active() && gameState.player.isOnGround) {
        gameState.player.setIdle();
    }
    if (released(KEY_BINDINGS.PLAYER_2.BLOCK) && !gameState.enemy.active() && gameState.enemy.isOnGround) {
        gameState.enemy.setIdle();
    }
    handleBlockLogic(gameState.player, KEY_BINDINGS.PLAYER_1.BLOCK);
    handleBlockLogic(gameState.enemy, KEY_BINDINGS.PLAYER_2.BLOCK);

    handleCrouchLogic(gameState.player, KEY_BINDINGS.PLAYER_1.DOWN);
    handleCrouchLogic(gameState.enemy, KEY_BINDINGS.PLAYER_2.DOWN);
    handleMoveHoriz(gameState.player, KEY_BINDINGS.PLAYER_1.LEFT, gameState.enemy, true);
    handleMoveHoriz(gameState.player, KEY_BINDINGS.PLAYER_1.RIGHT, gameState.enemy, false);
    handleMoveHoriz(gameState.enemy, KEY_BINDINGS.PLAYER_2.LEFT, gameState.player, true);
    handleMoveHoriz(gameState.enemy, KEY_BINDINGS.PLAYER_2.RIGHT, gameState.player, false);
    handleJump(gameState.player, KEY_BINDINGS.PLAYER_1.UP);
    handleJump(gameState.enemy, KEY_BINDINGS.PLAYER_2.UP);
}

function handleAction() {

    handleStandAttack(gameState.player, KEY_BINDINGS.PLAYER_1.STAND, KEY_BINDINGS.PLAYER_1.BLOCK);
    handleStandAttack(gameState.enemy, KEY_BINDINGS.PLAYER_2.STAND, KEY_BINDINGS.PLAYER_2.BLOCK);
    handleAttack(gameState.player, KEY_BINDINGS.PLAYER_1.ATTACK, KEY_BINDINGS.PLAYER_1.DOWN, KEY_BINDINGS.PLAYER_1.BLOCK, gameState.enemy);
    handleAttack(gameState.enemy, KEY_BINDINGS.PLAYER_2.ATTACK, KEY_BINDINGS.PLAYER_2.DOWN, KEY_BINDINGS.PLAYER_2.BLOCK, gameState.player);
    handleThrow(gameState.player, KEY_BINDINGS.PLAYER_1.THROW, KEY_BINDINGS.PLAYER_1.BLOCK);
    handleThrow(gameState.enemy, KEY_BINDINGS.PLAYER_2.THROW, KEY_BINDINGS.PLAYER_2.BLOCK);
    
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
    gameState.player.setFrameCount(frameCount);
    frameCount = {}
     for (const [key, value] of Object.entries(assets[player2])) {
        frameCount[key.toUpperCase()] = value.length;
    }
    gameState.enemy.setFrameCount(frameCount);
}

function detectEndGame() {
    if (gameState.player.hp <= 0 || gameState.enemy.hp <=0) gameState.gameEnded = true;
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

function handleStandAttack(actor, keyBinding, keyBindingBlock) {
    if (pressed(keyBinding)) {
        release(keyBindingBlock);
        actor.useStand(gameState.enemy);
        console.log("stand used");
        gameState.paused = true;
        obstacle = new Obstacle(gameState.enemy.x, 0, TILE_SIZE*10, TILE_SIZE*10, actor.velocityX, "roadRoller");
        setTimeout(() => {
            gameState.paused = false
        }, 5000)
    }
}

function drawStandAnimation(actor, target, standType) {
    switch (standType) {
        case "ZA WARUDO":
            drawZaWarudo(actor, target, obstacle);
            break;
        default: 
        break;    
    }
}

function drawZaWarudo(actor, target, roadRoller) {
    context.filter = 'grayscale(0)';
    let imgAssets;
    if (actor.id === 1) {
        imgAssets = gameState.playerAssets; 
    } else {
        imgAssets = gameState.enemyAssets;
    }
    roadRoller.applyPhysics(boardHeight);
    drawHelper.drawStats(context, actor, {width: boardWidth, height: boardHeight}, true, gameState.playerAssets.portrait[0]);
    drawHelper.drawStats(context, target, {width: boardWidth, height: boardHeight}, false, gameState.enemyAssets.portrait[0]);
    drawHelper.drawCharacter(context, actor, imgAssets);
    drawHelper.drawObject(context, roadRoller, imgAssets);
    context.filter = 'grayscale(1)';
    drawHelper.drawCharacter(context, target, imgAssets);
    context.filter = 'grayscale(0)';
}

