// EcoPacMan - Un jeu écologique inspiré de PacMan
// Utilise PixiJS pour le rendu

// Configuration du jeu
const config = {
  width: 800,
  height: 600,
  gridSize: 40, // Taille d'une cellule de la grille
  playerSpeed: 2,
  pollutionSpeed: 1,
  playerSize: 30, // Taille explicite du joueur
  wallPadding: 5  // Espace supplémentaire autour des murs pour faciliter les déplacements
};

// Types de déchets et leurs zones de tri correspondantes
const wasteTypes = {
  PLASTIC: { id: 'plastic', color: 0x3498db, binColor: 0x3498db },
  PAPER: { id: 'paper', color: 0xf1c40f, binColor: 0xf1c40f },
  GLASS: { id: 'glass', color: 0x2ecc71, binColor: 0x2ecc71 },
  METAL: { id: 'metal', color: 0xe74c3c, binColor: 0xe74c3c }
};

// Classe principale du jeu
class EcoPacMan {
  constructor() {
    // Initialisation du jeu
    this.app = new PIXI.Application({
      width: config.width,
      height: config.height,
      backgroundColor: config.backgroundColor,
      resolution: window.devicePixelRatio || 1
    });
    document.body.appendChild(this.app.view);

    this.backgroundMusic = new Audio('assets/sound.mp3');
    this.backgroundMusic.volume = 1;
    this.backgroundMusic.loop = true;

    // États du jeu
    this.gameState = {
      score: 0,
      level: 1,
      lives: 3,
      collectedWaste: null, // Type de déchet actuellement porté
      gameOver: false,
      paused: false
    };

    // Conteneurs principaux
    this.gameContainer = new PIXI.Container();
    this.uiContainer = new PIXI.Container();

    this.app.stage.addChild(this.gameContainer);
    this.app.stage.addChild(this.uiContainer);

    // Chargement des ressources
    this.loadAssets().then(() => {
      this.setupGame();
      this.setupEventListeners();
      this.startGameLoop();
    });

    // Créer d'abord un écran de démarrage
    this.showStartScreen();
  }

  // Ajouter cette nouvelle méthode
  showStartScreen() {
    // Créer un conteneur pour l'écran de démarrage
    this.startScreen = new PIXI.Container();
    this.app.stage.addChild(this.startScreen);

    // Fond de l'écran de démarrage
    const background = new PIXI.Graphics();
    background.beginFill(0xf8e6a4);
    background.drawRect(0, 0, config.width, config.height);
    background.endFill();
    this.startScreen.addChild(background);

    // Titre du jeu
    const titleStyle = new PIXI.TextStyle({
      fontFamily: 'Arial',
      fontSize: 60,
      fontWeight: 'bold',
      fill: ['#e98017'],
    });

    const title = new PIXI.Text('ECO PAC', titleStyle);
    title.anchor.set(0.5);
    title.x = config.width / 2;
    title.y = config.height / 3;
    this.startScreen.addChild(title);

    // Sous-titre
    const subtitleStyle = new PIXI.TextStyle({
      fontFamily: 'Arial',
      fontSize: 24,
      fontStyle: 'italic',
      fill: ['#e98017'],
    });

    const subtitle = new PIXI.Text('Recyclez les déchets et sauvez l\'environnement!', subtitleStyle);
    subtitle.anchor.set(0.5);
    subtitle.x = config.width / 2;
    subtitle.y = title.y + 80;
    this.startScreen.addChild(subtitle);

    // Bouton de démarrage
    const buttonStyle = new PIXI.TextStyle({
      fontFamily: 'Arial',
      fontSize: 36,
      fontWeight: 'bold',
      fill: ['#FFFFFF'],
    });

    const button = new PIXI.Graphics();
    button.beginFill(0x4CAF50);
    button.drawRoundedRect(0, 0, 200, 80, 15);
    button.endFill();
    button.x = config.width / 2 - 100;
    button.y = config.height / 2 + 50;
    this.startScreen.addChild(button);

    const buttonText = new PIXI.Text('JOUER', buttonStyle);
    buttonText.anchor.set(0.5);
    buttonText.x = button.x + 100;
    buttonText.y = button.y + 40;
    this.startScreen.addChild(buttonText);

    // Rendre le bouton interactif
    button.interactive = true;
    button.buttonMode = true;

    // Démarrer le jeu au clic sur le bouton
    button.on('pointerdown', () => {
      // Masquer l'écran de démarrage
      this.startScreen.visible = false;

      // Initialiser les éléments du jeu
      this.loadAssets().then(() => {
        this.setupGame();
        this.setupEventListeners();
        this.startGameLoop();

        // Maintenant on peut jouer la musique après l'interaction utilisateur
        this.playBackgroundMusic();
      });
    });
  }

  playBackgroundMusic() {
    const playPromise = this.backgroundMusic.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        // La musique a commencé à jouer
      }).catch(error => {
        console.error('Erreur lors de la lecture de la musique:', error);
      });
    }
  }

  async loadAssets() {
    // Définir le chemin vers vos assets
    const assetsPath = 'assets/';

    // Liste des assets à charger avec leurs noms spécifiques
    const assetsList = {
      player: 'player1.png',

      sandTexture: 'sable.jpg',

      plasticWaste: 'plastic.png',
      paperWaste: 'paper.png',
      glassWaste: 'glass.png',
      metalWaste: 'metal.png',

      plasticBin: 'bin_yellow.png',
      paperBin: 'bin_blue.png',
      glassBin: 'bin_green.png',
      metalBin: 'bin_red.png',

      pollution1: 'monster.png',
      pollution2: 'monster.png',
      pollution3: 'monster.png',
      pollution4: 'monster.png',

      wall: 'wall.png'
    };

    try {
      // Utilisation de PIXI.Assets (API moderne de PixiJS v7)
      this.textures = {};

      // Enregistrer les assets
      for (const assetName in assetsList) {
        PIXI.Assets.add(assetName, assetsPath + assetsList[assetName]);
      }

      // Chargement parallèle de tous les assets
      try {
        const loadedTextures = await PIXI.Assets.load(Object.keys(assetsList));

        // Stocker les textures chargées
        for (const assetName in assetsList) {
          if (loadedTextures[assetName]) {
            this.textures[assetName] = loadedTextures[assetName];
          } else {
            console.warn("Asset non trouvé: " + assetName);
            this.textures[assetName] = this.createFallbackTexture(assetName);
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement des assets:", error);
        this.loadFallbackTextures();
      }
    } catch (error) {
      console.error('Erreur lors du chargement des assets:', error);
      this.loadFallbackTextures();
    }
  }

  // Fonction de secours pour les textures
  createFallbackTexture(assetName) {
    let width = 30;
    let height = 30;
    let color = 0xcccccc;
    let isCircle = false;

    // Déterminer les propriétés selon le type d'asset
    if (assetName === 'player') {
      color = 0xffff00;
      isCircle = true;
    } else if (assetName.includes('Waste')) {
      width = height = 20;
      if (assetName.includes('plastic')) {
        color = wasteTypes.PLASTIC.color;
      } else if (assetName.includes('paper')) {
        color = wasteTypes.PAPER.color;
      } else if (assetName.includes('glass')) {
        color = wasteTypes.GLASS.color;
      } else if (assetName.includes('metal')) {
        color = wasteTypes.METAL.color;
      }
    } else if (assetName.includes('pollution')) {
      width = height = 25;
      const colors = [0x7f8c8d, 0x95a5a6, 0x2c3e50, 0x34495e];
      let index = 0;
      if (assetName === 'pollution1') index = 0;
      else if (assetName === 'pollution2') index = 1;
      else if (assetName === 'pollution3') index = 2;
      else if (assetName === 'pollution4') index = 3;
      color = colors[index];
      isCircle = true;
    } else if (assetName === 'wall') {
      return this.createWallTexture(config.gridSize, config.gridSize);
    } else if (assetName.includes('Bin')) {
      width = height = 60;
      if (assetName.includes('plastic')) {
        color = wasteTypes.PLASTIC.binColor;
      } else if (assetName.includes('paper')) {
        color = wasteTypes.PAPER.binColor;
      } else if (assetName.includes('glass')) {
        color = wasteTypes.GLASS.binColor;
      } else if (assetName.includes('metal')) {
        color = wasteTypes.METAL.binColor;
      }
    }

    return this.createPlaceholderTexture(width, height, color, isCircle);
  }

  // Charger toutes les textures de secours
  loadFallbackTextures() {
    console.log('Utilisation de textures temporaires');
    this.textures = {
      player: this.createPlaceholderTexture(30, 30, 0xffff00, true),
      plasticWaste: this.createPlaceholderTexture(20, 20, wasteTypes.PLASTIC.color),
      paperWaste: this.createPlaceholderTexture(20, 20, wasteTypes.PAPER.color),
      glassWaste: this.createPlaceholderTexture(20, 20, wasteTypes.GLASS.color),
      metalWaste: this.createPlaceholderTexture(20, 20, wasteTypes.METAL.color),
      pollution1: this.createPlaceholderTexture(25, 25, 0x7f8c8d, true),
      pollution2: this.createPlaceholderTexture(25, 25, 0x95a5a6, true),
      pollution3: this.createPlaceholderTexture(25, 25, 0x2c3e50, true),
      pollution4: this.createPlaceholderTexture(25, 25, 0x34495e, true),
      wall: this.createWallTexture(config.gridSize, config.gridSize),
      plasticBin: this.createPlaceholderTexture(60, 60, wasteTypes.PLASTIC.binColor),
      paperBin: this.createPlaceholderTexture(60, 60, wasteTypes.PAPER.binColor),
      glassBin: this.createPlaceholderTexture(60, 60, wasteTypes.GLASS.binColor),
      metalBin: this.createPlaceholderTexture(60, 60, wasteTypes.METAL.binColor)
    };
  }

  createPlaceholderTexture(width, height, color, isCircle = false) {
    // Création d'une texture temporaire
    const graphics = new PIXI.Graphics();
    graphics.beginFill(color);

    if (isCircle) {
      graphics.drawCircle(width / 2, height / 2, width / 2);
    } else {
      graphics.drawRect(0, 0, width, height);
    }

    graphics.endFill();
    return this.app.renderer.generateTexture(graphics);
  }

  createWallTexture(width, height) {
    // Création d'une texture plus élaborée pour les murs
    const graphics = new PIXI.Graphics();

    // Couleur de base
    graphics.beginFill(0x2c3e50);
    graphics.drawRect(0, 0, width, height);
    graphics.endFill();

    // Bordure plus claire
    graphics.beginFill(0x3498db);
    graphics.drawRect(0, 0, width, 2); // Bordure supérieure
    graphics.drawRect(0, 0, 2, height); // Bordure gauche
    graphics.endFill();

    // Bordure plus foncée
    graphics.beginFill(0x1a2632);
    graphics.drawRect(0, height - 2, width, 2); // Bordure inférieure
    graphics.drawRect(width - 2, 0, 2, height); // Bordure droite
    graphics.endFill();

    return this.app.renderer.generateTexture(graphics);
  }

  createBackground() {
    // Créer un sprite avec la texture de sable
    const background = new PIXI.Sprite(this.textures.sandTexture);

    // Couvrir tout l'écran de jeu
    background.width = config.width;
    background.height = config.height;

    // Ajouter au conteneur de jeu (en premier pour qu'il soit derrière tout le reste)
    this.gameContainer.addChildAt(background, 0);
  }

  setupGame() {
    // Création du labyrinthe
    this.createMaze();

    this.createBackground();
    // Création des zones de tri (bins)
    this.createRecyclingBins();

    // Ajout des déchets à collecter
    this.wastes = [];
    this.addWastes();

    // Création du joueur
    this.createPlayer();

    // Création des polluants (ennemis)
    this.pollutions = [];
    this.createPollutions();

    // Configuration de l'interface utilisateur
    this.setupUI();
  }

  createMaze() {
    // Nettoyage des murs existants
    if (this.walls) {
      this.gameContainer.removeChild(this.walls);
    }

    this.walls = new PIXI.Container();
    this.gameContainer.addChild(this.walls);

    // Création du labyrinthe avec un système de matrice
    // 0 = chemin, 1 = mur
    this.maze = [];
    const rows = Math.floor(config.height / config.gridSize);
    const cols = Math.floor(config.width / config.gridSize);

    // Initialiser tout comme chemins
    for (let i = 0; i < rows; i++) {
      this.maze[i] = [];
      for (let j = 0; j < cols; j++) {
        this.maze[i][j] = 0;
      }
    }

    // 1. Créer les murs extérieurs
    for (let i = 0; i < rows; i++) {
      this.maze[i][0] = 1;
      this.maze[i][cols-1] = 1;
    }

    for (let j = 0; j < cols; j++) {
      this.maze[0][j] = 1;
      this.maze[rows-1][j] = 1;
    }

    // 2. Créer un labyrinthe simple de style PacMan avec des couloirs plus larges

    // a. Créer des blocs/obstacles répartis uniformément
    for (let i = 2; i < rows-2; i += 3) {
      for (let j = 2; j < cols-2; j += 3) {
        // Ne pas mettre d'obstacles près des coins (pour les poubelles)
        const isCornerArea =
          (i < 4 && j < 4) || // coin supérieur gauche
          (i < 4 && j > cols-5) || // coin supérieur droit
          (i > rows-5 && j < 4) || // coin inférieur gauche
          (i > rows-5 && j > cols-5); // coin inférieur droit

        // Ne pas mettre d'obstacles au centre (position initiale du joueur)
        const isCenterArea =
          i >= Math.floor(rows/2) - 1 &&
          i <= Math.floor(rows/2) + 1 &&
          j >= Math.floor(cols/2) - 1 &&
          j <= Math.floor(cols/2) + 1;

        if (!isCornerArea && !isCenterArea) {
          // Créer un obstacle (bloc 2x2)
          this.maze[i][j] = 1;
          if (j+1 < cols-1) this.maze[i][j+1] = 1;
          if (i+1 < rows-1) this.maze[i+1][j] = 1;
          if (i+1 < rows-1 && j+1 < cols-1) this.maze[i+1][j+1] = 1;
        }
      }
    }

    // 3. S'assurer que les quatre coins sont dégagés pour les poubelles
    // Coin supérieur gauche
    for (let i = 1; i < 4; i++) {
      for (let j = 1; j < 4; j++) {
        this.maze[i][j] = 0;
      }
    }

    // Coin supérieur droit
    for (let i = 1; i < 4; i++) {
      for (let j = cols-4; j < cols-1; j++) {
        this.maze[i][j] = 0;
      }
    }

    // Coin inférieur gauche
    for (let i = rows-4; i < rows-1; i++) {
      for (let j = 1; j < 4; j++) {
        this.maze[i][j] = 0;
      }
    }

    // Coin inférieur droit
    for (let i = rows-4; i < rows-1; i++) {
      for (let j = cols-4; j < cols-1; j++) {
        this.maze[i][j] = 0;
      }
    }

    // 4. S'assurer que les chemins horizontaux et verticaux principaux sont dégagés
    // Chemin horizontal du milieu
    const midRow = Math.floor(rows/2);
    for (let j = 1; j < cols-1; j++) {
      this.maze[midRow][j] = 0;
    }

    // Chemin vertical du milieu
    const midCol = Math.floor(cols/2);
    for (let i = 1; i < rows-1; i++) {
      this.maze[i][midCol] = 0;
    }

    // 5. Ajouter quelques chemins supplémentaires pour une meilleure connectivité
    for (let i = 3; i < rows-3; i += 3) {
      for (let j = 1; j < cols-1; j++) {
        this.maze[i][j] = 0;
      }
    }

    for (let j = 3; j < cols-3; j += 3) {
      for (let i = 1; i < rows-1; i++) {
        this.maze[i][j] = 0;
      }
    }

    // 6. Création des sprites de mur avec un padding pour faciliter les déplacements
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (this.maze[i][j] === 1) {
          const wall = new PIXI.Sprite(this.textures.wall);
          wall.x = j * config.gridSize + config.wallPadding/2;
          wall.y = i * config.gridSize + config.wallPadding/2;
          wall.width = config.gridSize - config.wallPadding;
          wall.height = config.gridSize - config.wallPadding;
          this.walls.addChild(wall);
        }
      }
    }

    // 7. Bordure décorative (optionnelle)
    const borderThickness = 4;
    const border = new PIXI.Graphics();
    border.beginFill(0x4a6fa5); // Couleur bleue pour les bordures

    // Bordure supérieure
    border.drawRect(0, 0, config.width, borderThickness);
    // Bordure inférieure
    border.drawRect(0, config.height - borderThickness, config.width, borderThickness);
    // Bordure gauche
    border.drawRect(0, 0, borderThickness, config.height);
    // Bordure droite
    border.drawRect(config.width - borderThickness, 0, borderThickness, config.height);

    border.endFill();
    this.walls.addChild(border);
  }

  createRecyclingBins() {
    // Création des bacs de recyclage aux quatre coins
    this.bins = {};
    const padding = config.gridSize * 1.5;

    // Coin supérieur gauche - Bac plastique
    this.bins.plastic = new PIXI.Sprite(this.textures.plasticBin);
    this.bins.plastic.width = 60;
    this.bins.plastic.height = 60;
    this.bins.plastic.position.set(padding, padding);
    this.bins.plastic.wasteType = wasteTypes.PLASTIC.id;

    // Coin supérieur droit - Bac papier
    this.bins.paper = new PIXI.Sprite(this.textures.paperBin);
    this.bins.paper.width = 60;
    this.bins.paper.height = 60;
    this.bins.paper.position.set(config.width - padding - this.bins.paper.width, padding);
    this.bins.paper.wasteType = wasteTypes.PAPER.id;

    // Coin inférieur gauche - Bac verre
    this.bins.glass = new PIXI.Sprite(this.textures.glassBin);
    this.bins.glass.width = 60;
    this.bins.glass.height = 60;
    this.bins.glass.position.set(padding, config.height - padding - this.bins.glass.height);
    this.bins.glass.wasteType = wasteTypes.GLASS.id;

    // Coin inférieur droit - Bac métal (même texture que le verre, mais légèrement modifiée)
    this.bins.metal = new PIXI.Sprite(this.textures.metalBin);
    this.bins.metal.width = 60;
    this.bins.metal.height = 60;
    this.bins.metal.position.set(
      config.width - padding - this.bins.metal.width,
      config.height - padding - this.bins.metal.height
    );
    this.bins.metal.wasteType = wasteTypes.METAL.id;

    // Appliquer une légère rotation à la poubelle métal pour la différencier
    this.bins.metal.rotation = 0.1; // Légère rotation
    // Ou appliquer une légère teinte
    this.bins.metal.tint = 0xDDFFDD; // Teinte légèrement différente

    // Ajout des bacs au conteneur de jeu
    for (const bin in this.bins) {
      this.gameContainer.addChild(this.bins[bin]);
    }
  }

  addWastes() {
    // Ajout des déchets à collecter
    const rows = Math.floor(config.height / config.gridSize);
    const cols = Math.floor(config.width / config.gridSize);

    // Nettoyage des déchets existants
    if (this.wastes.length > 0) {
      for (const waste of this.wastes) {
        this.gameContainer.removeChild(waste);
      }
      this.wastes = [];
    }

    // Distribution plus uniforme - un déchet dans chaque couloir
    const wasteTypes = ['plastic', 'paper', 'glass', 'metal'];

    for (let i = 1; i < rows - 1; i++) {
      for (let j = 1; j < cols - 1; j++) {
        // Placer des déchets uniquement dans les couloirs, avec une certaine probabilité
        if (this.maze[i][j] === 0 && Math.random() < 0.4) {
          // Ne pas placer de déchets près des bacs ou au centre
          const distanceFromCenter = Math.sqrt(
            Math.pow(i - Math.floor(rows / 2), 2) +
            Math.pow(j - Math.floor(cols / 2), 2)
          );

          const isNearBin =
            (i < 4 && j < 4) || // coin supérieur gauche
            (i < 4 && j > cols - 5) || // coin supérieur droit
            (i > rows - 5 && j < 4) || // coin inférieur gauche
            (i > rows - 5 && j > cols - 5); // coin inférieur droit

          if (distanceFromCenter > 2 && !isNearBin) {
            const wasteType = wasteTypes[Math.floor(Math.random() * wasteTypes.length)];
            const waste = new PIXI.Sprite(this.textures[`${wasteType}Waste`]);
            waste.wasteType = wasteType;
            waste.anchor.set(0.5);

            // Définir une taille fixe pour ce déchet
            waste.width = 20;  // Taille fixe pour tous les déchets
            waste.height = 20;

            // Position au centre de la cellule
            waste.position.set(
              j * config.gridSize + config.gridSize / 2,
              i * config.gridSize + config.gridSize / 2
            );

            this.wastes.push(waste);
            this.gameContainer.addChild(waste);
          }
        }
      }
    }

    // S'assurer qu'il y a un minimum de déchets
    const minWasteCount = 15 + (this.gameState.level * 2);

    if (this.wastes.length < minWasteCount) {
      const additionalWastes = minWasteCount - this.wastes.length;

      for (let i = 0; i < additionalWastes; i++) {
        // Trouver une position valide
        let validPosition = false;
        let x, y, gridX, gridY;

        while (!validPosition) {
          x = Math.floor(Math.random() * (config.width - config.gridSize * 4)) + config.gridSize * 2;
          y = Math.floor(Math.random() * (config.height - config.gridSize * 4)) + config.gridSize * 2;

          gridX = Math.floor(x / config.gridSize);
          gridY = Math.floor(y / config.gridSize);

          if (gridY < rows && gridX < cols && this.maze[gridY][gridX] === 0) {
            // Vérifier qu'il n'y a pas déjà un déchet à cet endroit
            let collision = false;
            for (const existingWaste of this.wastes) {
              const distance = Math.sqrt(
                Math.pow(existingWaste.x - x, 2) +
                Math.pow(existingWaste.y - y, 2)
              );
              if (distance < config.gridSize) {
                collision = true;
                break;
              }
            }

            // Vérifier si ce n'est pas trop près d'un bac ou du centre
            const distanceFromCenter = Math.sqrt(
              Math.pow(gridY - Math.floor(rows / 2), 2) +
              Math.pow(gridX - Math.floor(cols / 2), 2)
            );

            const isNearBin =
              (gridY < 4 && gridX < 4) || // coin supérieur gauche
              (gridY < 4 && gridX > cols - 5) || // coin supérieur droit
              (gridY > rows - 5 && gridX < 4) || // coin inférieur gauche
              (gridY > rows - 5 && gridX > cols - 5); // coin inférieur droit

            if (!collision && distanceFromCenter > 2 && !isNearBin) {
              validPosition = true;
            }
          }
        }

        const wasteType = wasteTypes[Math.floor(Math.random() * wasteTypes.length)];
        const waste = new PIXI.Sprite(this.textures[`${wasteType}Waste`]);
        waste.wasteType = wasteType;
        waste.anchor.set(0.5);

        // Définir une taille fixe pour ce déchet
        waste.width = 25;  // Taille fixe pour tous les déchets - utilisez la même taille que ci-dessus
        waste.height = 25;

        waste.position.set(x, y);

        this.wastes.push(waste);
        this.gameContainer.addChild(waste);
      }
    }
  }

  createPlayer() {
    // Création du personnage joueur
    this.player = new PIXI.Sprite(this.textures.player);
    this.player.width = 30;
    this.player.height = 30;
    this.player.anchor.set(0.5);

    // Position initiale au centre
    this.player.position.set(config.width / 2, config.height / 2);

    // Vitesse et direction
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.direction = { x: 0, y: 0 };
    this.player.nextDirection = { x: 0, y: 0 };

    // État d'invulnérabilité
    this.player.invulnerable = false;

    this.gameContainer.addChild(this.player);

    // Indicateur de déchet porté
    this.carriedWaste = new PIXI.Sprite();
    this.carriedWaste.anchor.set(0.5);
    this.carriedWaste.visible = false;
    this.gameContainer.addChild(this.carriedWaste);
  }

  createPollutions() {
    // Création des polluants (ennemis)
    const pollutionCount = 3 + Math.floor(this.gameState.level / 2);

    // Nettoyage des polluants existants
    if (this.pollutions.length > 0) {
      for (const pollution of this.pollutions) {
        this.gameContainer.removeChild(pollution);
      }
      this.pollutions = [];
    }

    const rows = Math.floor(config.height / config.gridSize);
    const cols = Math.floor(config.width / config.gridSize);
    const safeDistance = config.gridSize * 6;

    for (let i = 0; i < pollutionCount; i++) {
      // Utiliser le sprite 'monster.png' pour tous les polluants
      const pollution = new PIXI.Sprite(this.textures[`pollution${(i % 4) + 1}`]);
      pollution.width = 30;  // Taille fixe pour tous les monstres
      pollution.height = 30;
      pollution.anchor.set(0.5);

      // Trouver une position valide
      let validPosition = false;
      let x, y;

      while (!validPosition) {
        x = Math.floor(Math.random() * (config.width - config.gridSize * 4)) + config.gridSize * 2;
        y = Math.floor(Math.random() * (config.height - config.gridSize * 4)) + config.gridSize * 2;

        const gridX = Math.floor(x / config.gridSize);
        const gridY = Math.floor(y / config.gridSize);

        if (gridY < rows && gridX < cols && this.maze[gridY][gridX] === 0) {
          const distanceToPlayer = Math.sqrt(
            Math.pow(this.player.x - x, 2) +
            Math.pow(this.player.y - y, 2)
          );

          if (distanceToPlayer >= safeDistance) {
            validPosition = true;
          }
        }
      }

      pollution.position.set(x, y);

      // Appliquer une légère teinte différente pour chaque monstre
      const tints = [0xFFFFFF, 0xDDDDFF, 0xFFDDDD, 0xDDFFDD];
      pollution.tint = tints[i % 4];

      // Direction aléatoire
      const angle = Math.random() * Math.PI * 2;
      pollution.vx = Math.cos(angle) * config.pollutionSpeed;
      pollution.vy = Math.sin(angle) * config.pollutionSpeed;

      pollution.personality = i % 4;

      this.pollutions.push(pollution);
      this.gameContainer.addChild(pollution);
    }
  }

  setupUI() {
    // Configuration de l'interface utilisateur
    this.uiContainer.removeChildren();

    // Style de texte
    const textStyle = new PIXI.TextStyle({
      fontFamily: 'Arial',
      fontSize: 24,
      fontWeight: 'bold',
      fill: ['#ffffff']
    });

    // Affichage du score
    this.scoreText = new PIXI.Text(`Score: ${this.gameState.score}`, textStyle);
    this.scoreText.position.set(10, 10);
    this.uiContainer.addChild(this.scoreText);

    // Affichage du niveau
    this.levelText = new PIXI.Text(`Niveau: ${this.gameState.level}`, textStyle);
    this.levelText.position.set(config.width - 150, 10);
    this.uiContainer.addChild(this.levelText);

    // Affichage des vies
    this.livesText = new PIXI.Text(`Vies: ${this.gameState.lives}`, textStyle);
    this.livesText.position.set(10, config.height - 40);
    this.uiContainer.addChild(this.livesText);

    // Message d'état du jeu (Game Over, Niveau terminé, etc.)
    this.messageText = new PIXI.Text('', {
      fontFamily: 'Arial',
      fontSize: 48,
      fontWeight: 'bold',
      fill: ['#ffffff'],
      stroke: '#000000',
      strokeThickness: 5,
      align: 'center'
    });
    this.messageText.anchor.set(0.5);
    this.messageText.position.set(config.width / 2, config.height / 2);
    this.messageText.visible = false;
    this.uiContainer.addChild(this.messageText);
  }

  setupEventListeners() {
    // Configuration des écouteurs d'événements pour les contrôles
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
  }

  handleKeyDown(event) {
    // Gestion des touches de contrôle
    if (this.gameState.gameOver) {
      if (event.key === 'Enter' || event.key === ' ') {
        this.restartGame();
      }
      return;
    }

    if (this.gameState.paused) {
      if (event.key === 'p') {
        this.resumeGame();
      }
      return;
    }

    switch (event.key) {
      case 'ArrowUp':
      case 'w':
      case 'z': // Pour les claviers AZERTY
        this.player.nextDirection = { x: 0, y: -1 };
        break;
      case 'ArrowDown':
      case 's':
        this.player.nextDirection = { x: 0, y: 1 };
        break;
      case 'ArrowLeft':
      case 'a':
      case 'q': // Pour les claviers AZERTY
        this.player.nextDirection = { x: -1, y: 0 };
        break;
      case 'ArrowRight':
      case 'd':
        this.player.nextDirection = { x: 1, y: 0 };
        break;
      case 'p':
        this.pauseGame();
        break;
    }
  }

  handleKeyUp(event) {
    // Optionnel: gestion des touches relâchées
  }

  startGameLoop() {
    // Démarrage de la boucle de jeu principale
    this.app.ticker.add(this.gameLoop.bind(this));
  }

  gameLoop(delta) {
    // Boucle principale du jeu
    if (this.gameState.gameOver || this.gameState.paused) {
      return;
    }

    // Mise à jour de la position du joueur
    this.updatePlayerPosition(delta);

    // Mise à jour des polluants
    this.updatePollutions(delta);

    // Vérification des collisions
    this.checkCollisions();

    // Mise à jour du déchet porté
    if (this.gameState.collectedWaste) {
      this.carriedWaste.visible = true;
      this.carriedWaste.position.set(
        this.player.x + 15,
        this.player.y - 15
      );
    } else {
      this.carriedWaste.visible = false;
    }

    // Effet clignotant pendant l'invulnérabilité
    if (this.player.invulnerable) {
      this.player.alpha = 0.5 + Math.sin(Date.now() * 0.01) * 0.3;
    }

    // Vérification des conditions de victoire
    if (this.wastes.length === 0) {
      this.levelComplete();
    }
  }

  updatePlayerPosition(delta) {
    // Mise à jour de la position du joueur en fonction de sa direction
    // Vérification si la nouvelle direction est possible
    if (this.player.nextDirection.x !== 0 || this.player.nextDirection.y !== 0) {
      const nextX = this.player.x + this.player.nextDirection.x * config.playerSpeed;
      const nextY = this.player.y + this.player.nextDirection.y * config.playerSpeed;

      if (!this.checkWallCollision(nextX, nextY)) {
        this.player.direction = { ...this.player.nextDirection };
      }
    }

    // Si le joueur est dans un couloir, essayer d'aligner sa position avec le centre du couloir
    this.alignPlayerToPath();

    // Déplacement du joueur dans sa direction actuelle
    const moveX = this.player.direction.x * config.playerSpeed * delta;
    const moveY = this.player.direction.y * config.playerSpeed * delta;

    const nextX = this.player.x + moveX;
    const nextY = this.player.y + moveY;

    if (!this.checkWallCollision(nextX, nextY)) {
      this.player.x = nextX;
      this.player.y = nextY;
    } else {
      // Si collision, essayer de glisser le long du mur
      if (moveX !== 0 && !this.checkWallCollision(this.player.x, nextY)) {
        this.player.y = nextY;
      } else if (moveY !== 0 && !this.checkWallCollision(nextX, this.player.y)) {
        this.player.x = nextX;
      }
    }

    // Vérification des limites de l'écran
    this.player.x = Math.max(config.playerSize/2, Math.min(config.width - config.playerSize/2, this.player.x));
    this.player.y = Math.max(config.playerSize/2, Math.min(config.height - config.playerSize/2, this.player.y));
  }

  // Fonction pour aider le joueur à s'aligner avec les couloirs
  alignPlayerToPath() {
    // Ne faire l'alignement que si le joueur se déplace
    if (this.player.direction.x === 0 && this.player.direction.y === 0) {
      return;
    }

    // Si le joueur se déplace horizontalement, ajuster verticalement
    if (Math.abs(this.player.direction.x) > 0 && this.player.direction.y === 0) {
      const gridY = Math.floor(this.player.y / config.gridSize);
      const centerY = (gridY + 0.5) * config.gridSize;
      const diff = centerY - this.player.y;

      // Si le joueur est proche du centre du couloir, l'aligner parfaitement
      if (Math.abs(diff) < config.playerSpeed) {
        this.player.y = centerY;
      }
      // Sinon, déplacer légèrement vers le centre du couloir
      else if (Math.abs(diff) < config.gridSize/3) {
        this.player.y += Math.sign(diff) * 0.5;
      }
    }

    // Si le joueur se déplace verticalement, ajuster horizontalement
    if (Math.abs(this.player.direction.y) > 0 && this.player.direction.x === 0) {
      const gridX = Math.floor(this.player.x / config.gridSize);
      const centerX = (gridX + 0.5) * config.gridSize;
      const diff = centerX - this.player.x;

      // Si le joueur est proche du centre du couloir, l'aligner parfaitement
      if (Math.abs(diff) < config.playerSpeed) {
        this.player.x = centerX;
      }
      // Sinon, déplacer légèrement vers le centre du couloir
      else if (Math.abs(diff) < config.gridSize/3) {
        this.player.x += Math.sign(diff) * 0.5;
      }
    }
  }

  checkWallCollision(x, y) {
    // Vérification de collision avec les murs
    const playerRadius = config.playerSize / 2.5;

    // Vérifier la collision avec la grille du labyrinthe
    const gridX = Math.floor(x / config.gridSize);
    const gridY = Math.floor(y / config.gridSize);
    const rows = this.maze.length;
    const cols = this.maze[0].length;

    // Vérifier les cellules adjacentes
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const checkX = gridX + j;
        const checkY = gridY + i;

        // Vérifier si la cellule est dans les limites
        if (checkX >= 0 && checkX < cols && checkY >= 0 && checkY < rows) {
          if (this.maze[checkY][checkX] === 1) {
            // Calculer la distance entre le joueur et le mur avec le padding
            const wallX = checkX * config.gridSize + config.wallPadding/2;
            const wallY = checkY * config.gridSize + config.wallPadding/2;
            const wallWidth = config.gridSize - config.wallPadding;
            const wallHeight = config.gridSize - config.wallPadding;

            // Vérifier si le joueur est en collision avec ce mur
            if (
              x + playerRadius > wallX &&
              x - playerRadius < wallX + wallWidth &&
              y + playerRadius > wallY &&
              y - playerRadius < wallY + wallHeight
            ) {
              return true; // Collision détectée
            }
          }
        }
      }
    }

    return false; // Pas de collision
  }

  updatePollutions(delta) {
    // Mise à jour de la position des polluants
    for (const pollution of this.pollutions) {
      let targetX = pollution.x;
      let targetY = pollution.y;

      // Comportement basé sur la personnalité du polluant
      switch (pollution.personality) {
        case 0: // Aléatoire
          // Changer de direction occasionnellement
          if (Math.random() < 0.01) {
            const angle = Math.random() * Math.PI * 2;
            pollution.vx = Math.cos(angle) * config.pollutionSpeed;
            pollution.vy = Math.sin(angle) * config.pollutionSpeed;
          }
          break;

        case 1: // Chasseur - poursuit le joueur
          // Calculer la direction vers le joueur
          const distanceToPlayer = Math.sqrt(
            Math.pow(this.player.x - pollution.x, 2) +
            Math.pow(this.player.y - pollution.y, 2)
          );

          if (distanceToPlayer < config.gridSize * 8) {
            const dirX = (this.player.x - pollution.x) / distanceToPlayer;
            const dirY = (this.player.y - pollution.y) / distanceToPlayer;

            // Poursuite plus agressive quand le joueur porte un déchet
            const intensity = this.gameState.collectedWaste ? 0.8 : 0.4;

            pollution.vx = pollution.vx * (1 - intensity) + dirX * config.pollutionSpeed * intensity;
            pollution.vy = pollution.vy * (1 - intensity) + dirY * config.pollutionSpeed * intensity;
          }
          break;

        case 2: // Patrol - suit les couloirs
          // Continuer dans la même direction jusqu'à rencontrer un mur
          const testX = pollution.x + pollution.vx * 2 * delta;
          const testY = pollution.y + pollution.vy * 2 * delta;

          if (this.checkWallCollision(testX, testY)) {
            // Au mur, choisir une nouvelle direction
            // Essayer d'abord les directions perpendiculaires
            const possibleDirs = [];

            // Tester les 4 directions cardinales
            const dirs = [
              { x: 0, y: -1 }, // haut
              { x: 1, y: 0 },  // droite
              { x: 0, y: 1 },  // bas
              { x: -1, y: 0 }  // gauche
            ];

            for (const dir of dirs) {
              const checkX = pollution.x + dir.x * config.gridSize;
              const checkY = pollution.y + dir.y * config.gridSize;

              if (!this.checkWallCollision(checkX, checkY)) {
                possibleDirs.push(dir);
              }
            }

            if (possibleDirs.length > 0) {
              const newDir = possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
              pollution.vx = newDir.x * config.pollutionSpeed;
              pollution.vy = newDir.y * config.pollutionSpeed;
            } else {
              // Si aucune direction n'est valide, inverser
              pollution.vx *= -1;
              pollution.vy *= -1;
            }
          }
          break;

        case 3: // Timide - s'éloigne du joueur quand proche
          const dist = Math.sqrt(
            Math.pow(this.player.x - pollution.x, 2) +
            Math.pow(this.player.y - pollution.y, 2)
          );

          if (dist < config.gridSize * 5) {
            // S'éloigner du joueur
            const dirX = (pollution.x - this.player.x) / dist;
            const dirY = (pollution.y - this.player.y) / dist;

            pollution.vx = pollution.vx * 0.6 + dirX * config.pollutionSpeed * 0.4;
            pollution.vy = pollution.vy * 0.6 + dirY * config.pollutionSpeed * 0.4;
          } else if (Math.random() < 0.02) {
            // Mouvement aléatoire occasionnel
            const angle = Math.random() * Math.PI * 2;
            pollution.vx = Math.cos(angle) * config.pollutionSpeed * 0.7; // Plus lent
            pollution.vy = Math.sin(angle) * config.pollutionSpeed * 0.7;
          }
          break;
      }

      // Normaliser la vitesse pour éviter les mouvements trop rapides
      const speed = Math.sqrt(pollution.vx * pollution.vx + pollution.vy * pollution.vy);
      if (speed > config.pollutionSpeed) {
        pollution.vx = (pollution.vx / speed) * config.pollutionSpeed;
        pollution.vy = (pollution.vy / speed) * config.pollutionSpeed;
      }

      // Déplacement
      let nextX = pollution.x + pollution.vx * delta;
      let nextY = pollution.y + pollution.vy * delta;

      // Vérification des collisions avec les murs
      if (this.checkWallCollision(nextX, nextY)) {
        // Rebondir sur les murs
        if (this.checkWallCollision(nextX, pollution.y)) {
          pollution.vx *= -1;
          nextX = pollution.x + pollution.vx * delta;
        }

        if (this.checkWallCollision(pollution.x, nextY)) {
          pollution.vy *= -1;
          nextY = pollution.y + pollution.vy * delta;
        }

        // Si toujours en collision, essayer une direction aléatoire
        if (this.checkWallCollision(nextX, nextY)) {
          const angle = Math.random() * Math.PI * 2;
          pollution.vx = Math.cos(angle) * config.pollutionSpeed;
          pollution.vy = Math.sin(angle) * config.pollutionSpeed;
          nextX = pollution.x + pollution.vx * delta;
          nextY = pollution.y + pollution.vy * delta;
        }
      }

      // Appliquer le mouvement
      pollution.x = nextX;
      pollution.y = nextY;

      // Vérification des limites de l'écran
      pollution.x = Math.max(pollution.width / 2, Math.min(config.width - pollution.width / 2, pollution.x));
      pollution.y = Math.max(pollution.height / 2, Math.min(config.height - pollution.height / 2, pollution.y));
    }
  }

  checkCollisions() {
    // Vérification des collisions
    this.checkWasteCollisions();
    this.checkBinCollisions();
    this.checkPollutionCollisions();
  }

  checkWasteCollisions() {
    // Vérification des collisions avec les déchets
    if (this.gameState.collectedWaste) {
      return; // Déjà un déchet collecté
    }

    const playerBounds = {
      left: this.player.x - this.player.width / 2,
      right: this.player.x + this.player.width / 2,
      top: this.player.y - this.player.height / 2,
      bottom: this.player.y + this.player.height / 2
    };

    for (let i = this.wastes.length - 1; i >= 0; i--) {
      const waste = this.wastes[i];
      const wasteBounds = {
        left: waste.x - waste.width / 2,
        right: waste.x + waste.width / 2,
        top: waste.y - waste.height / 2,
        bottom: waste.y + waste.height / 2
      };

      if (this.checkCollision(playerBounds, wasteBounds)) {
        // Collecter le déchet
        this.gameState.collectedWaste = waste.wasteType;
        this.carriedWaste.texture = this.textures[`${waste.wasteType}Waste`];

        // Définir la même taille fixe pour le déchet porté
        this.carriedWaste.width = 20;
        this.carriedWaste.height = 20;

        // Retirer le déchet du jeu
        this.gameContainer.removeChild(waste);
        this.wastes.splice(i, 1);

        // Ajouter des points pour la collecte
        this.gameState.score += 10;
        this.updateUI();

        // Effet visuel pour la collecte de déchet
        this.createCollectEffect(waste.x, waste.y);

        break;
      }
    }
  }

  createCollectEffect(x, y) {
    // Créer un effet visuel pour la collecte de déchet
    const effect = new PIXI.Graphics();
    effect.beginFill(0xffffff, 0.7);
    effect.drawCircle(0, 0, 20);
    effect.endFill();
    effect.position.set(x, y);
    effect.alpha = 0.8;

    this.gameContainer.addChild(effect);

    // Animation de l'effet
    let scale = 1;
    const animate = () => {
      scale += 0.1;
      effect.scale.set(scale);
      effect.alpha -= 0.08;

      if (effect.alpha > 0) {
        requestAnimationFrame(animate);
      } else {
        this.gameContainer.removeChild(effect);
      }
    };

    animate();
  }

  checkBinCollisions() {
    // Vérification des collisions avec les bacs de recyclage
    if (!this.gameState.collectedWaste) {
      return; // Pas de déchet collecté
    }

    const playerBounds = {
      left: this.player.x - this.player.width / 2,
      right: this.player.x + this.player.width / 2,
      top: this.player.y - this.player.height / 2,
      bottom: this.player.y + this.player.height / 2
    };

    for (const binKey in this.bins) {
      const bin = this.bins[binKey];
      const binBounds = {
        left: bin.x,
        right: bin.x + bin.width,
        top: bin.y,
        bottom: bin.y + bin.height
      };

      if (this.checkCollision(playerBounds, binBounds)) {
        // Vérifier si le type de déchet correspond au bon bac
        if (bin.wasteType === this.gameState.collectedWaste) {
          // Tri correct - Points bonus
          this.gameState.score += 100;
          // Effet visuel de tri correct
          this.createTriEffect(bin.x + bin.width / 2, bin.y + bin.height / 2, true);
        } else {
          // Tri incorrect - Points diminués
          this.gameState.score = Math.max(0, this.gameState.score - 50);
          // Effet visuel de tri incorrect
          this.createTriEffect(bin.x + bin.width / 2, bin.y + bin.height / 2, false);
        }

        // Réinitialiser l'état de collecte
        this.gameState.collectedWaste = null;
        this.carriedWaste.visible = false;

        // Mettre à jour l'affichage du score
        this.updateUI();
        break;
      }
    }
  }

  createTriEffect(x, y, correct) {
    // Créer un effet visuel pour le tri des déchets
    const color = correct ? 0x2ecc71 : 0xe74c3c;
    const text = correct ? '+100' : '-50';

    // Effet de particules
    for (let i = 0; i < 10; i++) {
      const particle = new PIXI.Graphics();
      particle.beginFill(color);
      particle.drawCircle(0, 0, 3 + Math.random() * 3);
      particle.endFill();
      particle.position.set(x, y);

      // Direction aléatoire
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;

      this.gameContainer.addChild(particle);

      // Animation des particules
      const animate = () => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.alpha -= 0.02;

        if (particle.alpha > 0) {
          requestAnimationFrame(animate);
        } else {
          this.gameContainer.removeChild(particle);
        }
      };

      animate();
    }

    // Texte flottant avec le score
    const scoreText = new PIXI.Text(text, {
      fontFamily: 'Arial',
      fontSize: 24,
      fontWeight: 'bold',
      fill: [correct ? '#2ecc71' : '#e74c3c']
    });
    scoreText.anchor.set(0.5);
    scoreText.position.set(x, y - 20);

    this.gameContainer.addChild(scoreText);

    // Animation du texte
    let elapsed = 0;
    const animate = () => {
      elapsed += 1;
      scoreText.y -= 1;
      scoreText.alpha -= 0.02;

      if (scoreText.alpha > 0) {
        requestAnimationFrame(animate);
      } else {
        this.gameContainer.removeChild(scoreText);
      }
    };

    animate();
  }

  checkPollutionCollisions() {
    // Vérification des collisions avec les polluants
    if (this.player.invulnerable) {
      return; // Le joueur est invulnérable
    }

    const playerBounds = {
      left: this.player.x - this.player.width / 3, // Réduire légèrement la zone de collision
      right: this.player.x + this.player.width / 3,
      top: this.player.y - this.player.height / 3,
      bottom: this.player.y + this.player.height / 3
    };

    for (const pollution of this.pollutions) {
      const pollutionBounds = {
        left: pollution.x - pollution.width / 2,
        right: pollution.x + pollution.width / 2,
        top: pollution.y - pollution.height / 2,
        bottom: pollution.y + pollution.height / 2
      };

      if (this.checkCollision(playerBounds, pollutionBounds)) {
        // Collision avec un polluant - Perte d'une vie
        this.playerHit();
        break;
      }
    }
  }

  checkCollision(boundsA, boundsB) {
    // Vérification de collision entre deux rectangles
    return !(
      boundsA.right < boundsB.left ||
      boundsA.left > boundsB.right ||
      boundsA.bottom < boundsB.top ||
      boundsA.top > boundsB.bottom
    );
  }

  playerHit() {
    // Si le joueur est invulnérable, ignorer la collision
    if (this.player.invulnerable) {
      return;
    }

    // Gestion de la collision avec un polluant
    this.gameState.lives--;

    // Vérifier si le jeu est terminé
    if (this.gameState.lives <= 0) {
      this.gameOver();
      return;
    }

    // Effet visuel de dégât
    this.createDamageEffect();

    // Réinitialiser la position du joueur
    this.player.position.set(config.width / 2, config.height / 2);
    this.player.direction = { x: 0, y: 0 };
    this.player.nextDirection = { x: 0, y: 0 };

    // Réinitialiser l'état de collecte
    if (this.gameState.collectedWaste) {
      this.gameState.collectedWaste = null;
      this.carriedWaste.visible = false;
    }

    // Mettre à jour l'affichage des vies
    this.updateUI();

    // Rendre le joueur invulnérable pendant quelques secondes
    this.player.invulnerable = true;
    this.player.alpha = 0.5; // Effet visuel d'invulnérabilité

    // Éloigner les polluants du centre
    this.repositionPollutions();

    // Période d'invulnérabilité
    setTimeout(() => {
      this.player.invulnerable = false;
      this.player.alpha = 1;
    }, 3000); // 3 secondes d'invulnérabilité

    // Petit effet de pause
    this.pauseGame(1000);
  }

  repositionPollutions() {
    // Repositionner les polluants loin du joueur après une mort
    const safeDistance = config.gridSize * 6; // Distance minimale des polluants au joueur

    for (const pollution of this.pollutions) {
      // Calculer la distance actuelle au joueur
      const distanceToPlayer = Math.sqrt(
        Math.pow(this.player.x - pollution.x, 2) +
        Math.pow(this.player.y - pollution.y, 2)
      );

      // Si le polluant est trop proche, le repositionner
      if (distanceToPlayer < safeDistance) {
        // Trouver une nouvelle position valide et éloignée
        let validPosition = false;
        let newX, newY;

        while (!validPosition) {
          // Générer une position aléatoire dans le labyrinthe
          newX = Math.floor(Math.random() * (config.width - config.gridSize * 4)) + config.gridSize * 2;
          newY = Math.floor(Math.random() * (config.height - config.gridSize * 4)) + config.gridSize * 2;

          const gridX = Math.floor(newX / config.gridSize);
          const gridY = Math.floor(newY / config.gridSize);

          // Vérifier que la position est un couloir (pas un mur)
          if (gridY < this.maze.length && gridX < this.maze[0].length && this.maze[gridY][gridX] === 0) {
            // Calculer la distance au joueur
            const newDistance = Math.sqrt(
              Math.pow(this.player.x - newX, 2) +
              Math.pow(this.player.y - newY, 2)
            );

            // Vérifier que c'est assez loin du joueur
            if (newDistance >= safeDistance) {
              validPosition = true;
            }
          }
        }

        // Déplacer le polluant à la nouvelle position
        pollution.position.set(newX, newY);

        // Donner une direction aléatoire
        // Donner une direction aléatoire
        const angle = Math.random() * Math.PI * 2;
        pollution.vx = Math.cos(angle) * config.pollutionSpeed;
        pollution.vy = Math.sin(angle) * config.pollutionSpeed;
      }
    }
  }

  createDamageEffect() {
    // Créer un effet visuel pour les dégâts
    const overlay = new PIXI.Graphics();
    overlay.beginFill(0xe74c3c, 0.3);
    overlay.drawRect(0, 0, config.width, config.height);
    overlay.endFill();
    overlay.alpha = 0.7;

    this.gameContainer.addChild(overlay);

    // Animation de l'overlay
    const animate = () => {
      overlay.alpha -= 0.05;

      if (overlay.alpha > 0) {
        requestAnimationFrame(animate);
      } else {
        this.gameContainer.removeChild(overlay);
      }
    };

    animate();
  }

  updateUI() {
    // Mise à jour de l'interface utilisateur
    this.scoreText.text = `Score: ${this.gameState.score}`;
    this.levelText.text = `Niveau: ${this.gameState.level}`;
    this.livesText.text = `Vies: ${this.gameState.lives}`;
  }

  pauseGame(duration) {
    // Pause du jeu, avec une durée optionnelle
    this.gameState.paused = true;

    if (duration) {
      setTimeout(() => {
        this.gameState.paused = false;
      }, duration);
    } else {
      // Afficher un message de pause
      this.messageText.text = 'PAUSE';
      this.messageText.visible = true;
    }
  }

  resumeGame() {
    // Reprise du jeu
    this.gameState.paused = false;
    this.messageText.visible = false;
  }

  gameOver() {
    // Fin du jeu
    this.gameState.gameOver = true;

    // Afficher le message de fin
    this.messageText.text = `GAME OVER\nScore: ${this.gameState.score}\nAppuyez sur Entrée pour recommencer`;
    this.messageText.visible = true;
  }

  levelComplete() {
    // Niveau terminé
    this.gameState.level++;

    // Points bonus pour avoir terminé le niveau
    const levelBonus = 500 * this.gameState.level;
    this.gameState.score += levelBonus;

    // Mise à jour de l'interface
    this.updateUI();

    // Afficher le message de passage au niveau suivant
    this.messageText.text = `NIVEAU ${this.gameState.level - 1} TERMINÉ !\nBonus: ${levelBonus}\nPréparation du niveau suivant...`;
    this.messageText.visible = true;

    // Pause avant de commencer le niveau suivant
    this.pauseGame();

    setTimeout(() => {
      // Préparation du niveau suivant
      this.setupNextLevel();
      this.messageText.visible = false;
      this.resumeGame();
    }, 3000);
  }

  setupNextLevel() {
    // Configuration du niveau suivant
    // Réinitialiser le joueur
    this.player.position.set(config.width / 2, config.height / 2);
    this.player.direction = { x: 0, y: 0 };
    this.player.nextDirection = { x: 0, y: 0 };

    // Réinitialiser l'état de collecte
    this.gameState.collectedWaste = null;
    this.carriedWaste.visible = false;

    // Créer un nouveau labyrinthe
    this.createMaze();

    // Ajouter de nouveaux déchets
    this.addWastes();

    // Créer de nouveaux polluants
    this.createPollutions();

    // Mettre à jour l'interface
    this.updateUI();
  }

  restartGame() {
    // Redémarrage du jeu
    this.gameState = {
      score: 0,
      level: 1,
      lives: 3,
      collectedWaste: null,
      gameOver: false,
      paused: false
    };

    // Réinitialiser le joueur
    this.player.position.set(config.width / 2, config.height / 2);
    this.player.direction = { x: 0, y: 0 };
    this.player.nextDirection = { x: 0, y: 0 };
    this.player.invulnerable = false;
    this.player.alpha = 1;

    // Réinitialiser l'état de collecte
    this.carriedWaste.visible = false;

    // Créer un nouveau labyrinthe
    this.createMaze();

    // Ajouter de nouveaux déchets
    this.addWastes();

    // Créer de nouveaux polluants
    this.createPollutions();

    // Mettre à jour l'interface
    this.setupUI();
    this.messageText.visible = false;
  }
}

// Code d'initialisation pour démarrer le jeu
document.addEventListener('DOMContentLoaded', () => {
  // Attendre que PixiJS soit chargé
  if (typeof PIXI === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pixi.js/7.3.2/pixi.min.js';
    script.onload = () => {
      // Initialiser le jeu une fois PixiJS chargé
      const game = new EcoPacMan();
    };
    document.head.appendChild(script);
  } else {
    // PixiJS est déjà chargé, initialiser directement
    const game = new EcoPacMan();
  }
});

