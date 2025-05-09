class Attack extends Movable(Minion) {
    constructor(x, y, width, height, velocityX, type) {
        super(x,y,width,height);
        this.active = true;
        this.dmg = 10;
        this.velocityX = velocityX;
        this.isFacingRight = true;
        this.type = type;
    }

    draw(ctx, img) {
        ctx.drawImage(img, this.x, this.y, this.width, this.height)
    }
}