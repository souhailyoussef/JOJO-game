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
    drawStats: function (ctx, player, {width, height}, left, img) {
        const LOGO_SIZE = 100;
        const HP_BAR_HEIGHT = 30;
        const MANA_BAR_HEIGHT = 20;

        const maxBarWidth = width/2 - 200;
        const hpBarOffset = 0;
        const manaBarOffset = 0;
        const currentHPWidth = Math.max(0, (player.hp * maxBarWidth) / 200 - hpBarOffset);
        const currentMANAWidth = Math.max(0, (player.mana * maxBarWidth) / 200 - manaBarOffset);
    
        let hpX, manaX, imgX;
        if (left) {
            hpX = width - currentHPWidth - LOGO_SIZE;
            manaX = width - currentMANAWidth - LOGO_SIZE;
            imgX = width - LOGO_SIZE;
        } else {
            hpX = LOGO_SIZE;
            manaX = LOGO_SIZE;
            imgX = 0;
        }

        // HP bar
        ctx.fillStyle = 'green';
        ctx.fillRect(hpX, 0, currentHPWidth, HP_BAR_HEIGHT);
        this.addBorder(ctx, hpX, 0, currentHPWidth, HP_BAR_HEIGHT, 'black', 2);

        // Mana bar
        ctx.fillStyle = 'royalblue';
        ctx.fillRect(manaX, HP_BAR_HEIGHT, currentMANAWidth, MANA_BAR_HEIGHT);
        this.addBorder(ctx, manaX, HP_BAR_HEIGHT, currentMANAWidth, MANA_BAR_HEIGHT, 'black', 2);

        // Draw logo and border
        ctx.drawImage(img, imgX, 0, LOGO_SIZE, LOGO_SIZE);
        this.addBorder(ctx, imgX, 0, LOGO_SIZE, LOGO_SIZE, 'gold', 3);

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
            case 'HURT': 
                return images[`hurt${actionVariation}`][frameIndex];       
            case 'SPECIAL_ATTACK':
                return images.specialAttack;          
            default:
                return images[`idle${actionVariation}`][frameIndex];
        }
    },
    addBorder: function (ctx, x,y, width, height, color, borderWidth) {
        ctx.strokeStyle = color;
        ctx.lineWidth = borderWidth;
        ctx.strokeRect(x, y, width, height);
    }
}