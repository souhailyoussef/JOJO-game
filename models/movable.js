const Movable = Base => class extends Base {
    move(dx, dy) {
        this.x += dx;
        this.y -= dy;
        if (dx > 0) {
            this.action = "MOVE_RIGHT";
            this.isFacingRight = true;
        }
        if (dx < 0) {
            this.action = "MOVE_LEFT";
            this.isFacingRight = false;
        }
    }


    jump() {
        const previousActiopn = this.action;
        this.action = "JUMP";
        if (this.isOnGround) {
            this.velocityY = this.jumpPower;
            this.isOnGround = false;
        }
        this.action = previousActiopn;
    }

    applyPhysics(boardHeight) {
        this.velocityY += this.gravity;
        this.y += this.velocityY;

        //ground collision
        const groundLevel = boardHeight - this.height;
        if (this.y >= groundLevel) {
            this.y = groundLevel;
            this.velocityY = 0;
            this.isOnGround = true;
        }
    }
}