class Attack extends Minion {
    constructor(x, y, width, height, velocityX, type, dmg) {
        super(x,y,width,height);
        this.active = true;
        this.dmg = dmg;
        this.velocityX = velocityX;
        this.isFacingRight = true;
        this.type = type;
    }
}