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

let board, context;
let player = new Player(boardWidth/2 - TILE_SIZE, boardHeight - TILE_SIZE*8, TILE_SIZE*4, TILE_SIZE*8, playerVelocityX, 1);
let enemy = new Player(boardWidth/2 - TILE_SIZE*6, boardHeight- TILE_SIZE*8, TILE_SIZE*4, TILE_SIZE*8, enemyVelocityX, 2);

let selectedCharacters = [];
const keys = {};

let lastMoveTime = 0;
const moveInterval = 30;
let lastActionTime = 0;
const actionInterval = 100;

const soundManager = new SoundManager();

// Load sounds
soundManager.load('attack', './resources/soundeffects/ora.mp3');
soundManager.load('kick', './resources/soundeffects/muda.mp3');
soundManager.load('theme', './resources/soundEffects/background_theme.mp3');

const fighters = document.querySelectorAll('.fighter');

fighters.forEach(fighter => {

    fighter.addEventListener('click', function() {
        const fighterName = this.getAttribute('fighter');
        soundManager.play('theme');
        selectedCharacters  = [fighterName, 'jotaro'];
        loadCharacterAssets(selectedCharacters, function(assets) {
            init(assets);
        })
    })
})
document.getElementById('startBtn').addEventListener('click', () => {
    document.getElementById('startBtn').style.display = 'none';

    selectedCharacters = ['jotaro', 'dio'];

    loadCharacterAssets(selectedCharacters, function(assets) {
        init(assets);
    });

});




function init(assets) {
    setupCanvas();
    playerAssets = assets[selectedCharacters[0]];
    enemyAssets = assets[selectedCharacters[1]];
    document.addEventListener('keydown', (e) => keys[e.code] = true);
    document.addEventListener('keyup', (e) => keys[e.code] = false);
    document.addEventListener('dmgTakenEvent', updateHP);
    requestAnimationFrame(update);

}

function setupCanvas() {
    board = document.getElementById('board');
    board.hidden = false;
    board.width = boardWidth;
    board.height = boardHeight;
    context = board.getContext('2d');
}


/** GAME LOOP */
function update() {
    requestAnimationFrame(update);

    context.clearRect(0,0, boardWidth, boardHeight);
    handleMovement();
    updateEntity(player);
    updateEntity(enemy);
    updateAttacks();
    player.applyPhysics(boardHeight);
    enemy.applyPhysics(boardHeight);

    drawHelper.drawCharacter(context, player, playerAssets);
    drawHelper.drawCharacter(context, enemy, enemyAssets);
    player.attacks.forEach(p => drawHelper.drawProjectile(context, p, playerAssets));
    enemy.attacks.forEach(p => drawHelper.drawProjectile(context, p, playerAssets));

    handleAction();
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

    for (let i = 0; i < enemy.attacks.length; i++) {
        let attack = enemy.attacks[i];
        attack = moveAttack(attack);

        if (!attack) {
            enemy.attacks.splice(i, 1);
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
    if (!keys['ArrowDown'] && !player.active()) player.uncrouch();
    if (keys['KeyW']) {player.block(); return;};
    if (keys['ArrowDown']) {player.crouch(); return};

    if (keys['ArrowLeft'] && isInBounds(player, false)) {
        if (isColliding(player, enemy) && player.x >= enemy.x) return;
        if (player.actionTimer > 0) return;
        player.move(-playerVelocityX,0);
    } 
    if (keys['ArrowRight'] && isInBounds(player, true)) {
        if (isColliding(player, enemy) && player.x <= enemy.x) return;
        if (player.actionTimer > 0) return;
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
        player.kick(enemy, () => soundManager.play('kick'));
    }
    else if (keys['KeyQ']) {
        keys['KeyW'] = false;
        player.punch(enemy, () => soundManager.play('attack'));
    }
    if (keys['KeyE']) {
        keys['KeyW'] = false;
        player.attack();
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

function updateEntity(entity) {
    if (entity.actionTimer > 0) {
        entity.actionTimer--;
        if (!entity.active()) {
            entity.action = 'CROUCH';
        }
    }
    entity.frameTimer--;
    if (entity.frameTimer <= 0) {
        entity.frameIndex = (entity.frameIndex + 1) % entity.frameCount[entity.action];
        entity.frameTimer = entity.frameDelay;
    }
}



function updateHP(e) {
    const target = e.detail.target;
    const dmg = e.detail.dmg;
    const hp = e.detail.hp;
    if (target == 1) {
        document.getElementById('player-health').innerText = hp;
    } else document.getElementById('enemy-health').innerText = hp;
}