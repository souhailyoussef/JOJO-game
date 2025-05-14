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
        const image = drawHelper.getImageForAction(action, imgs, frameIndex, entity.actionVariation);

        ctx.drawImage(image, 0, 0, drawWidth, entity.height);
        ctx.beginPath();
        ctx.rect(0, 0, entity.width, entity.height);
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
        const image = drawHelper.getImageForAction('PROJECTILE', imgs, 0, 1);
        ctx.drawImage(image, 0, 0, entity.width, entity.height);
        ctx.restore();
    },
    getImageForAction: function(action, images, frameIndex = 0, actionVariation = 1) {
        switch (action) {
            case 'MOVE_LEFT':
            case 'MOVE_RIGHT':
                return images[`idle${actionVariation}`][frameIndex];
            case 'BLOCK':
                return images[`block${actionVariation}`][frameIndex];
            case 'CROUCH':
                return images[`crouch${actionVariation}`][frameIndex];
            case 'KICK':
                return images[`kick${actionVariation}`][frameIndex];
            case 'PUNCH': 
                return images[`punch${actionVariation}`][frameIndex];
            case 'JUMP':
                return images[`jump${actionVariation}`][frameIndex];
            case 'THROW': 
                return images[`throw${actionVariation}`][frameIndex];
            case 'PROJECTILE':
                return images.projectile[frameIndex];   
            case 'SPECIAL_ATTACK':
                return images.specialAttack;          
            default:
                return images[`idle${actionVariation}`][frameIndex];
        }
    }
}