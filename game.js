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
    setupCanvas();
    playerAssets = assets[selectedCharacters[0]];
    enemyAssets = assets[selectedCharacters[1]];
    document.addEventListener('keydown', (e) => {
        if (e.repeat && e.code === 'KeyQ') return;
        keys[e.code] = true;
    });
    document.addEventListener('keyup', (e) => keys[e.code] = false);
    document.addEventListener('dmgTakenEvent', updateHP);
    document.addEventListener('manaRechargeEvent', updateMana);
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
    updateAttacks(player, enemy);
    player.applyPhysics(boardHeight);
    enemy.applyPhysics(boardHeight);

    drawHelper.drawCharacter(context, player, playerAssets);
    drawHelper.drawCharacter(context, enemy, enemyAssets);
    player.attacks.forEach(p => drawHelper.drawProjectile(context, p, playerAssets));
    enemy.attacks.forEach(p => drawHelper.drawProjectile(context, p, playerAssets));

    handleAction();
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
    if (!keys['ArrowDown'] && !player.active()) player.uncrouch();
    if (keys['KeyW']) {
        player.block(); 
    };
    if (!keys['KeyW'] && !player.active() && player.isOnGround) {
        player.setIdle();
    }
    if (keys['ArrowDown']) {
        player.crouch(); 
    }
    if (keys['Numpad5']) {
        enemy.crouch(); 
    }
    if (!keys['Numpad5'] && !enemy.active()) enemy.uncrouch();
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
    if (keys['Numpad8']) enemy.jump();
}

function handleAction() {

    if (keys['KeyN']) {
        keys['KeyW'] = false;
        player.speicalAttack(enemy);
    }
    if (keys['KeyQ'] && keys['ArrowDown'] && player.isOnGround && player.action === 'CROUCH') {
        player.kick(enemy, () => soundManager.play('kick'));
    }
    else if (keys['KeyQ']) {
        keys['KeyW'] = false;
        player.punch(enemy, () => soundManager.play('attack'));
    }
    if (keys['KeyP'] && keys['Numpad5'] && enemy.isOnGround && enemy.action === 'CROUCH') {
        enemy.kick(player, () => soundManager.play('kick'));
    }
    else if (keys['KeyQ']) {
        keys['KeyW'] = false;
        player.punch(enemy, () => soundManager.play('attack'));
    }
    if (keys['KeyE']) {
        keys['KeyW'] = false;
        player.attack();
    }
    if (keys['KeyO']) {
        keys['Keyl'] = false;
        enemy.attack();
    }
    
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
        entity.frameIndex = (entity.frameIndex + 1) % entity.frameCount[entity.action];
        entity.frameTimer = entity.frameDelay;
    }
}

function drawSpecialAttack() {
    console.log('drawing');
}


function updateHP(e) {
    const target = e.detail.target;
    const dmg = e.detail.dmg;
    const hp = e.detail.hp;
    if (target == 1) {
        document.getElementById('player-health').innerText = hp;
    } else document.getElementById('enemy-health').innerText = hp;
}

function updateMana(e) {
    const target = e.detail.target;
    const amount = e.detail.amount;
    const mana = e.detail.mana;
    if (target == 1) {
        document.getElementById('player-mana').innerText = mana;
    } else document.getElementById('enemy-mana').innerText = mana;
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