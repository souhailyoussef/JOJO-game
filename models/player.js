class Player extends Movable(Minion) {
    constructor(x, y, width, height, velocityX, id) {
        super(x,y,width,height);
        this.velocityX = velocityX;
        this.action = 'IDLE';
        this.attacks = [];
        this.hp = 100;
        this.kickRange = 200;
        this.punchRange = 150;
        this.id = id;
        this.actionTimer= 0;
    }

    active() {
        return this.actionTimer > 0;
    }
    
    attack() {
        if (this.actionTimer > 0) return;
        this.action = 'THROW';
        this.actionTimer = 25;
        const attack = new Projectile(this.x, this.y, this.width*2/3, this.height, this.velocityX*2);
        attack.isFacingRight = this.isFacingRight;
        this.attacks.push(attack);
    }

    block() {
        if (!this.isIdle()) return;
        this.action = 'BLOCK';
    }

    kick(enemy, playSound) {
        if (!this.isOnGround) return;
        if (this.actionTimer > 0) return;
        this.action = 'KICK';
        this.actionTimer = 40;
        const attack = new Attack(this.x, this.y/2, this.width, this.height / 2, 0, 'kick');
        if (this.isKickLanded(enemy)) {
            console.log('Kick landed!');
            enemy.takeHit(attack);
        }
        playSound();
    }

    punch(enemy, callback) {
       if (!this.isOnGround) return;
       if (this.actionTimer > 0) return;
       this.action = 'PUNCH';
       this.actionTimer = 20;
       const attack = new Attack(this.x, this.y, this.punchRange, this.height, 0, 'punch');
       if (this.isPunchLanded(enemy)) {
            console.log('Punch landed!');
            enemy.takeHit(attack);
        }
       callback();
    }

    isKickLanded(enemy) {
        const distance = Math.abs(enemy.x - this.x);
        const overlap = distance <= this.kickRange;
        return overlap;
    }

    isPunchLanded(enemy) {
        const distance = Math.abs((enemy.x - this.x));
        const overlap = distance <= this.punchRange;
        return overlap;
    }

    takeHit(attack) {
        if (this.action === 'BLOCK') return;
        this.hp -= attack.dmg;
        const dmgTakenEvent = new CustomEvent('dmgTakenEvent', {
            detail: { target: this.id, hp: this.hp, dmg: attack.dmg}
        });
        document.dispatchEvent(dmgTakenEvent);

    }


    
}