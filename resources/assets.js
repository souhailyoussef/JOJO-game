function loadCharacterAssets(characters, callback) {
    const assets = {};
    let totalCharacters = characters.length;
    let loadedCharacters = 0;

    characters.forEach(character => {
        fetch(`./resources/${character}/manifest.json`)
            .then(response => response.json())
            .then(manifest => {
                assets[character] = {};

                let frameLoads = 0;
                let totalFrames = 0;

                // Count total frames to wait for
                Object.entries(manifest).forEach(([action, value]) => {
                    if (typeof value === 'number') {
                        totalFrames += value;
                    } else {
                        totalFrames += 1;
                    }
                });

                Object.entries(manifest).forEach(([action, value]) => {
                    if (typeof value === 'number') {
                        assets[character][action] = [];
                        for (let i = 0; i < value; i++) {
                            const img = new Image();
                            img.src = `./resources/${character}/${action}/${i}.png`;
                            img.onload = () => {
                                frameLoads++;
                                if (frameLoads === totalFrames) {
                                    loadedCharacters++;
                                    if (loadedCharacters === totalCharacters) {
                                        callback(assets);
                                    }
                                }
                            };
                            img.onerror = () => {
                                console.error(`Failed to load ${character}/${action}/${i}.png`);
                            };
                            assets[character][action][i] = img;
                        }
                    } else {
                        const img = new Image();
                        img.src = `./resources/${character}/${value}`;
                        img.onload = () => {
                            frameLoads++;
                            if (frameLoads === totalFrames) {
                                loadedCharacters++;
                                if (loadedCharacters === totalCharacters) {
                                    callback(assets);
                                }
                            }
                        };
                        img.onerror = () => {
                            console.error(`Failed to load ${character}/${value}`);
                        };
                        assets[character][action] = img;
                    }
                });
            })
            .catch(err => {
                console.error(`Failed to load manifest for ${character}:`, err);
            });
    });
}
