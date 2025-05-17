class Projectile extends Movable(Minion) {
     constructor(x, y, width, height, velocityX, dmg) {
        super(x,y,width,height);
        this.active = true;
        this.dmg = dmg;
        this.velocityX = velocityX;
        this.velocityY = 0;
        this.isFacingRight = true;
    }

}