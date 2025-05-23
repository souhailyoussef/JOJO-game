class Player extends Movable(Minion) {
    static MAX_MANA = 100;
    constructor(x, y, width, height, velocityX, id, punchRange, punchDmg, kickRange, kickDmg, ammo, projectileDmg, reloadTime) {
        super(x,y,width,height);
        this.velocityX = velocityX;
        this.action = 'IDLE';
        this.attacks = [];
        this.hp = 200;
        this.kickRange = kickRange;
        this.kickDmg = kickDmg;
        this.punchRange = punchRange;
        this.punchDmg = punchDmg;
        this.mana = 100;
        this.ammo = ammo;
        this.projectileDmg = projectileDmg;
        this.ammoReload = reloadTime;
        this.id = id;
        this.actionVariation=1; 
        this.actionTimer= 0;
        this.frameIndex = 0;
        this.frameTimer = 0;
        this.frameDelay = 5;
        this.frameCount = {};
    }

    setFrameCount(frameCount) {
        this.frameCount = frameCount;
        this.punchVariations = 0;
        this.kickVariations = 0;
        this.throwVariations = 0;
        for (const action in frameCount) {
            if (action.includes('PUNCH')) {
                this.punchVariations++
            } else if (action.includes('KICK')) {
                this.kickVariations++;
            } else if (action.includes('THROW')) {
                this.throwVariations++;
            }
        }
    }

    setIdle() {
        this.action = 'IDLE';
        this.height = this.originalHeight;
        this.actionVariation = 1;
        this.frameIndex = 0;
    }

    active() {
        return this.actionTimer > 0;
    }
    
    attack() {
        if (this.actionTimer > 0) return;
        if (this.ammo === 0) return;
        
        this.action = 'THROW';
        this.actionVariation = Math.floor(Math.random()*this.kickVariations) + 1;
        const frameName = this.action + this.throwVariations;
        this.actionTimer = 10;
        this.frameIndex = 0;
        this.frameDelay = this.actionTimer / this.frameCount[frameName];
        this.frameTimer = this.frameDelay;
        const attack = new Projectile(this.x, this.y, this.width*2/3, this.height/2, this.velocityX*2, this.projectileDmg);
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
        this.actionVariation = 1;
        this.frameIndex = 0;
        this.frameDelay = 20 / this.frameCount[this.action];
        this.frameTimer = this.frameDelay;
    }

    kick(enemy, playSound) {
        if (!this.isOnGround) return;
        if (this.actionTimer > 0) return;

        this.action = 'KICK';
        const frameName = this.action + this.kickVariations;
        this.actionTimer = 20;
        this.frameIndex = 0;
        this.frameDelay = this.actionTimer / this.frameCount[frameName];
        this.frameTimer = this.frameDelay;
        const attack = new Attack(this.x, this.y/2, this.width, this.height / 2, 0, 'kick', this.kickDmg);
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
       this.actionVariation = Math.floor(Math.random()*this.punchVariations) + 1;
       const frameName = this.action + this.punchVariations;
       this.actionTimer = 30;
       this.frameIndex = 0;
       this.frameDelay = this.actionTimer / this.frameCount[frameName];
       this.frameTimer = this.frameDelay;
       const attack = new Attack(this.x, this.y, this.punchRange, this.height, 0, 'punch', this.punchDmg);
       if (this.isPunchLanded(enemy)) {
            console.log('Punch landed!');
            enemy.takeHit(attack);
            this.incrementMana(5);
        }
       callback();
    }

    incrementMana(amount) {
        this.mana += amount;
        this.mana = Math.max(Math.min(this.mana, Player.MAX_MANA),0);
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
        this.action = 'HURT';
        this.actionTimer = 20;
        this.actionVariation = 1;
        const frameName = this.action + this.actionVariation;
        this.frameIndex = 0;
        this.frameDelay = this.actionTimer / this.frameCount[frameName];
        this.hp -= attack.dmg;
        const dmgTakenEvent = new CustomEvent('dmgTakenEvent', {
            detail: { target: this.id, hp: this.hp, dmg: attack.dmg}
        });
        document.dispatchEvent(dmgTakenEvent);

    }

     jump() {
        this.action = "JUMP";
        this.actionVariation = 1;
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

    useStand() {
        if (this.mana < Player.MAX_MANA) return;
        this.incrementMana(-Player.MAX_MANA);
    }


    
}