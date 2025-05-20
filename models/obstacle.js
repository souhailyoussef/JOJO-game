class Obstacle extends Movable(Minion) {
    constructor(x, y, width, height, velocityX, type) {
        super(x,y,width,height);
        this.velocityX = velocityX;
        this.type = type;
    }
}