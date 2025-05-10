class Attack extends Minion {
    constructor(x, y, width, height, velocityX, type) {
        super(x,y,width,height);
        this.active = true;
        this.dmg = 10;
        this.velocityX = velocityX;
        this.isFacingRight = true;
        this.type = type;
    }
}