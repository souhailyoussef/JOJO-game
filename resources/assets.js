function loadCharacterAssets(characters, callback) {    
    const actions = ['idle', 'block', 'throw', 'punch', 'kick', 'jump', 'crouch', 'projectile'];
    const assets = {};
    let totalAssets = characters.length * actions.length;
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
