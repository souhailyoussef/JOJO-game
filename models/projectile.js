class Projectile extends Movable(Minion) {
     constructor(x, y, width, height, velocityX) {
        super(x,y,width,height);
        this.active = true;
        this.dmg = 10;
        this.velocityX = velocityX;
        this.velocityY = 0;
        this.isFacingRight = true;
    }

}