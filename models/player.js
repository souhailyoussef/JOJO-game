class Player extends Movable(Minion) {
    constructor(x, y, width, height, velocityX) {
        super(x,y,width,height);
        this.velocityX = velocityX;
        this.action = 'MOVE_RIGHT';
        this.attacks = [];
        this.hp = 100;
    }
    
    attack() {
        const previousAction = this.action;
        this.action = 'ATTACK';
        const attack = new Attack(this.x, this.y, this.width, this.height, this.velocityX/2);
        attack.isFacingRight = this.isFacingRight;
        this.attacks.push(attack);
        this.action = previousAction;
    }

    block() {
        this.action = 'BLOCK';
    }


    draw(ctx, moveImg, blockImg) {
        switch(this.action) {
            case "MOVE_LEFT": 
                ctx.save();
                ctx.scale(-1,1);
                ctx.drawImage(moveImg, -this.x - this.width, this.y, this.width, this.height);
                ctx.restore();
                return;
            case "MOVE_RIGHT": 
                ctx.drawImage(moveImg, this.x, this.y, this.width, this.height);
                return;
            case "BLOCK":
                if (this.isFacingRight) {
                    ctx.drawImage(blockImg, this.x, this.y, this.width, this.height);
                } else {
                    ctx.save();
                    ctx.scale(-1,1);
                    ctx.drawImage(blockImg, -this.x - this.width, this.y, this.width, this.height);
                    ctx.restore();
                }
                return;
            default: 
                ctx.drawImage(moveImg, this.x, this.y, this.width, this.height);
                return;
        }
    }

   

    drawAttacks(ctx, img) {
        player.attacks.forEach(a => a.draw(ctx, img));
    }

    takeHit(attack) {
        if (this.action === 'BLOCK') return;
        this.hp -= attack.dmg;
    }


    
}