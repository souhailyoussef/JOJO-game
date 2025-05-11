function loadCharacterAssets(characters, callback) {    
    const actions = ['idle', 'block', 'throw0', 'throw1', 'throw2', 'punch0', 'punch1', 'punch2', 'punch3', 'kick', 'kick0', 'kick1', 'jump', 'jump0', 'jump1', 'crouch', 'projectile'];
    const assets = {};
    const uniqueChracters = new Set(characters);
    let totalAssets = uniqueChracters.size * actions.length;
    let loadedAssets = 0;

    characters.forEach(character => {
        assets[character] = {};
        actions.forEach(action => {
            const img = new Image();
            const path = `./resources/${character}/${action}.png`;
            img.src = path;
            img.onload = () => { 
                loadedAssets++;
                if (loadedAssets === totalAssets) {
                    callback(assets);
                }
            };
            img.onerror = () => {
                console.error(`Failed to load ${character}/${action}`);
            };

            assets[character][action] = img;
        });
    });
}
