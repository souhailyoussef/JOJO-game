class Zombie extends Movable(Minion) {
    constructor(x, y, width, height, velocityX, velocityY) {
        super(x,y,width,height);
        this.velocityX = velocityX;
        this.velocityY = velocityY;
    }
    
    update(input) {
        if (input.left) this.move(-this.speed, 0);
        if (input.right) this.move(this.speed, 0);
    }

    draw(ctx, img) {
        ctx.drawImage(img, player.x, player.y, player.width, player.height);
    }
    
}