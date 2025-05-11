const drawHelper = {
    drawCharacter: function(ctx, entity, imgs) {
        ctx.save();

        let drawX = entity.x;
        let drawWidth = entity.width;

        if (entity.action === 'PUNCH') {
            drawWidth = entity.punchRange;
            if (!entity.isFacingRight) {
                drawX -= (drawWidth - entity.width);
            }
        }

        if (entity.action === 'KICK') {
            drawWidth = entity.kickRange;
            if (!entity.isFacingRight) {
                drawX -= (drawWidth - entity.width);
            }
        }

        if (!entity.isFacingRight) {
            ctx.scale(-1, 1);
            ctx.translate(-drawX - drawWidth, entity.y);
        } else {
            ctx.translate(drawX, entity.y);
        }

        const action = entity.action || 'IDLE';
        const frameIndex = entity.frameIndex;
        const image = drawHelper.getImageForAction(action, imgs, frameIndex);

        ctx.drawImage(image, 0, 0, drawWidth, entity.height);
        ctx.beginPath();
        ctx.rect(0, 0, drawWidth, entity.height);
        ctx.stroke();

        ctx.restore();
    },
    drawProjectile: function(ctx, entity, imgs) {
        ctx.save();
         if (!entity.isFacingRight) {
            ctx.scale(-1, 1);
            ctx.translate(-entity.x - entity.width, entity.y);
        } else {
            ctx.translate(entity.x, entity.y);
        }
        const image = drawHelper.getImageForAction('PROJECTILE', imgs);
        ctx.drawImage(image, 0, 0, entity.width, entity.height);
        ctx.restore();
    },
    getImageForAction: function(action, images, frameIndex = 0) {
        switch (action) {
            case 'MOVE_LEFT':
            case 'MOVE_RIGHT':
                return images.idle;
            case 'BLOCK':
                return images.block;
            case 'CROUCH':
                return images.crouch;
            case 'KICK':
                return images[`kick${frameIndex}`];
            case 'PUNCH': 
                return images[`punch${frameIndex}`];
            case 'JUMP':
                return images[`jump${frameIndex}`];     
            case 'THROW': 
                return images[`throw${frameIndex}`];  
            case 'PROJECTILE':
                return images.projectile;         
            default:
                return images.idle;
        }
    }
}