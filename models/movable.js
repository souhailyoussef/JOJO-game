const Movable = Base => class extends Base {
    move(dx, dy) {
        this.x += dx;
        this.y -= dy;
        if (dx > 0) {
            if (this.isOnGround) this.action = "MOVE_RIGHT";
            this.isFacingRight = true;
        }
        if (dx < 0) {
            if (this.isOnGround) this.action = "MOVE_LEFT";
            this.isFacingRight = false;
        }
    }

    isIdle() {
        return ['IDLE','MOVE_RIGHT', 'MOVE_LEFT'].includes(this.action) && this.isOnGround;
    }


    uncrouch() {
        if (!this.isOnGround) return;
        if (this.action === "CROUCH" || this.action === "JUMP") {
            this.action = "IDLE";
        }
        this.height = this.originalHeight;
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