class Player extends Movable(Minion) {
    constructor(x, y, width, height, velocityX, id) {
        super(x,y,width,height);
        this.velocityX = velocityX;
        this.action = 'MOVE_RIGHT';
        this.attacks = [];
        this.hp = 100;
        this.kickRange = 20;
        this.id = id;
    }
    
    attack() {
        const previousAction = this.action;
        this.action = 'ATTACK';
        const attack = new Attack(this.x, this.y, this.width, this.height, this.velocityX/2, 'punch');
        attack.isFacingRight = this.isFacingRight;
        this.attacks.push(attack);
        this.action = previousAction;
    }

    block() {
        if (!this.isIdle()) return;
        this.action = 'BLOCK';
    }

    kick(enemy, timeout) {
        if (!this.isOnGround) return;
        const previousAction = this.action;
        this.action = 'KICK';
        const attack = new Attack(this.x, this.y/2, this.width, this.height / 2, this.velocityX / 2, 'kick');
        if (this.isKickLanded(enemy)) {
            console.log('Kick landed!');
            enemy.takeHit(attack);
        }
        setTimeout(() => {
            this.action = previousAction;
            this.kickInProgress = false;
        }, timeout);
    }


    draw(ctx, moveImg, blockImg, kickImg) {
        ctx.save();
        if (!this.isFacingRight) {
            ctx.scale(-1, 1);
            ctx.translate(-this.x - this.width, this.y);
        } else {
            ctx.translate(this.x, this.y);
        }
    
        switch(this.action) {
            case "MOVE_LEFT":
            case "MOVE_RIGHT":
                ctx.drawImage(moveImg, 0, 0, this.width, this.height);
                break;
            case "BLOCK":
                ctx.drawImage(blockImg, 0, 0, this.width, this.height);
                break;
            case "CROUCH":
                ctx.drawImage(crouchImg, 0, 0, this.width, this.height);
                break;
            case "KICK":
                ctx.drawImage(kickImg, 0, 0, this.width, this.height);
                break;
            default:
                ctx.drawImage(moveImg, 0, 0, this.width, this.height);
        }
        ctx.restore(); 
    }

    isKickLanded(enemy) {
        let kickRangeX = this.isFacingRight ? this.x + this.kickRange : this.x - this.kickRange;
        return (
            this.x + kickRangeX > enemy.x &&
            this.x < enemy.x + enemy.width &&
            this.y < enemy.y + enemy.height &&
            this.y + this.height > enemy.y
        );
    }

   

    drawAttacks(ctx, imgs) {
        player.attacks.forEach(a => a.draw(ctx, imgs[a.type]));
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