class Enemy extends Movable(Minion) {
    constructor(x, y, width, height, velocityX, velocityY) {
        super(x,y,width,height);
        this.velocityX = velocityX;
        this.velocityY = velocityY;
    }
    
    

    draw(ctx, img) {
        ctx.drawImage(img, this.x, this.y, this.width, this.height);
    }
    
}