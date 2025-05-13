class Player extends Movable(Minion) {
    constructor(x, y, width, height, velocityX, id) {
        super(x,y,width,height);
        this.velocityX = velocityX;
        this.action = 'IDLE';
        this.attacks = [];
        this.hp = 100;
        this.kickRange = 400;
        this.punchRange = 250;
        this.mana = 40;
        this.ammo = 5;
        this.ammoReload = 10000;
        this.id = id;
        this.actionTimer= 0;
        this.frameIndex = 0;
        this.frameTimer = 0;
        this.frameDelay = 5;
        this.frameCount = {
            'IDLE': 1,
            'CROUCH': 2,
            'BLOCK': 3,
            'PUNCH': 4,
            'KICK': 2,
            'THROW': 2,
            'JUMP': 5,
        };
    }

    setIdle() {
        this.action = 'IDLE';
        this.height = this.originalHeight;
    }

    active() {
        return this.actionTimer > 0;
    }
    
    attack() {
        if (this.actionTimer > 0) return;
        if (this.ammo === 0) return;
        this.action = 'THROW';
        this.actionTimer = 10;
        this.frameIndex = 0;
        this.frameDelay = this.actionTimer / this.frameCount[this.action];
        this.frameTimer = this.frameDelay;
        const attack = new Projectile(this.x, this.y, this.width*2/3, this.height/2, this.velocityX*2);
        attack.isFacingRight = this.isFacingRight;
        this.attacks.push(attack);
        this.ammo--;
        this.reloadAmmo();
    }

    reloadAmmo() {
        setTimeout(() => {
            this.ammo++;
        }, this.ammoReload);
    }

    block() {
        if (!this.isIdle()) return;
        this.action = 'BLOCK';
        this.frameIndex = 0;
        this.frameDelay = 20 / this.frameCount[this.action];
        this.frameTimer = this.frameDelay;
    }

    kick(enemy, playSound) {
        if (!this.isOnGround) return;
        if (this.actionTimer > 0) return;
        this.action = 'KICK';
        this.actionTimer = 20;
        this.frameIndex = 0;
        this.frameDelay = this.actionTimer / this.frameCount[this.action];
        this.frameTimer = this.frameDelay;
        const attack = new Attack(this.x, this.y/2, this.width, this.height / 2, 0, 'kick');
        if (this.isKickLanded(enemy)) {
            console.log('Kick landed!');
            enemy.takeHit(attack);
            this.incrementMana(5);
        }
        playSound();
    }

    punch(enemy, callback) {
       if (!this.isOnGround) return;
       if (this.actionTimer > 0) return;
       this.action = 'PUNCH';
       this.actionTimer = 20;
       this.frameIndex = 0;
       this.frameDelay = this.actionTimer / this.frameCount[this.action];
       this.frameTimer = this.frameDelay;
       const attack = new Attack(this.x, this.y, this.punchRange, this.height, 0, 'punch');
       if (this.isPunchLanded(enemy)) {
            console.log('Punch landed!');
            enemy.takeHit(attack);
            this.incrementMana(5);
        }
       callback();
    }

    incrementMana(amount) {
        this.mana += amount;
        this.mana = Math.max(Math.min(this.mana, 100),0);
        const manaRechargeEvent = new CustomEvent('manaRechargeEvent', {
            detail: { target: this.id, mana: this.mana, amount}
        });
        document.dispatchEvent(manaRechargeEvent);
    }

    isKickLanded(enemy) {
        const distance = Math.abs(enemy.x - this.x);
        const overlap = distance <= this.kickRange;
        return overlap;
    }

    isPunchLanded(enemy) {
        const distance = Math.abs((enemy.x - this.x));
        const overlap = distance <= this.punchRange;
        const distanceY = Math.abs((enemy.y - this.y));
        const overlapY = distanceY <= this.height/3;
        return overlap && overlapY;
    }

    takeHit(attack) {
        if (this.action === 'BLOCK') return;
        this.hp -= attack.dmg;
        const dmgTakenEvent = new CustomEvent('dmgTakenEvent', {
            detail: { target: this.id, hp: this.hp, dmg: attack.dmg}
        });
        document.dispatchEvent(dmgTakenEvent);

    }

     jump() {
        this.action = "JUMP";
        this.frameIndex = 0;
        this.frameDelay = 30 / this.frameCount[this.action];
        this.frameTimer = this.frameDelay;
        if (this.isOnGround) {
            this.velocityY = this.jumpPower;
            this.isOnGround = false;
        }
    }

     crouch() {
        if (!this.isIdle()) return;
        if (this.action === 'CROUCH') return;
        this.action = "CROUCH";
        this.y += this.height / 2;
        this.height = this.height/2;

    }


    uncrouch() {
        if (!this.isOnGround) return;
        if (this.action === "CROUCH" || this.action === "JUMP") {
            this.action = "IDLE";
        }
        this.height = this.originalHeight;
    }
    
}