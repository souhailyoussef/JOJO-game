class Minion {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.alive = true;
        this.velocityY = 0;
        this.gravity = 1;
        this.jumpPower = -30;
        this.isOnGround = false;
        this.isFacingRight = true;
        this.originalHeight = this.height;
    }
}