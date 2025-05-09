const drawHelper = {
    drawCharacter: function(ctx, entity, imgs) {
        ctx.save();

        if (!entity.isFacingRight) {
            ctx.scale(-1, 1);
            ctx.translate(-entity.x - entity.width, entity.y);
        } else {
            ctx.translate(entity.x, entity.y);
        }
        const action = entity.action || 'IDLE';
        const image = drawHelper.getImageForAction(action, imgs);
        ctx.drawImage(image, 0, 0, entity.width, entity.height);

        ctx.restore();
    },
    getImageForAction: function(action, images) {
        switch (action) {
            case 'MOVE_LEFT':
            case 'MOVE_RIGHT':
                return images.move;
            case 'BLOCK':
                return images.block;
            case 'CROUCH':
                return images.crouch;
            case 'KICK':
                return images.kick;
            default:
                return images.move;
        }
    }
}