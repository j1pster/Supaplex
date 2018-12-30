'use strict'
/*********************************************************************************************************************/
/********************************************* -- INIT -- ************************************************************/
/*********************************************************************************************************************/

var Supaplex = {};

/*********************************************************************************************************************/
/************************************************** -- CONSTANTS -- **************************************************/
/*********************************************************************************************************************/

Supaplex.LEVELURL = "open.php"; //php script to read in the original Supaplex level file (levels.dat)
Supaplex.TILESIZE = 64; // As for now, all tiles are 64 x 64 pixels.

// Object used for movement calculations.
// The x and y values are used to determine whether to increase or decrease the onscreen positions.
Supaplex.DIRECTIONS = {
    Left: { x: -1, y: 0 },
    Up: { x: 0, y: -1 },
    Right: { x: 1, y: 0 },
    Down: { x: 0, y: 1 }
};

// Object containing the timings for different animations.
// These timings are based on timings in the original Supaplex game but may be a bit off.
Supaplex.ANIMATION_TIMINGS = {
    regularMove: 150,
    eating: 200,
    falling: 200,
    explosion: 500,
    pushing: 150,
    waitBeforePush: 100,
    terminalGreen: 8000,
    terminalGreenFast: 2000,
    terminalRed: 4000
};

Supaplex.HE = 24;
Supaplex.WI = 60;

Supaplex.init = function () {
    Supaplex.level = []; //Contains every tile in a 2-dimensional array

    Supaplex.tilesToUpdate = [];
    Supaplex.Scissors = []; // Dunno if i'm going to use this yet
    Supaplex.Murphy = {}; // Our hero!
    Supaplex.Murphy.eating = false;
    Supaplex.MurphyLocationX;
    Supaplex.MurphyLocationY;
    Supaplex.Explosions = []; // Because there should always be explosions, just ask michael bay
    Supaplex.ExplosionCount = 0; // What was this for again?
    Supaplex.lastLogicUpdate = 0;
    Supaplex.fpsCounter = 0;
    Supaplex.fpsTimer = 0;
    Supaplex.FPS = 60;
    Supaplex.ElapsedTime = 0; // Allright, maybe I'm using the times for something else.
    Supaplex.levelInfo = {};
    Supaplex.Zonks = []; // Same as scissors, dunno if i'm going to use it yet.
    Supaplex.YellowFloppies = [];
    Supaplex.infotronsCollected = 0;
    Supaplex.MainLoop;
    Supaplex.gamePaused = false; //Set to true if the game is paused.
    Supaplex.justUnPaused = false; //debuggin stuff....
    Supaplex.moveCounter = 0; // Also debug shit
    Supaplex.levelElem = document.getElementById("level");
    // Supaplex.levelCopy = document.getElementById("copy");
    Supaplex.levelCtx = Supaplex.levelElem.getContext("2d");
    // Supaplex.copyCtx = Supaplex.levelCopy.getContext("2d");
    Supaplex.levelWidth = window.innerWidth;
    Supaplex.levelHeight = window.innerHeight;
    Supaplex.levelElem.width = Supaplex.levelWidth;
    Supaplex.levelElem.height = Supaplex.levelHeight;
    Supaplex.totalWidth = 3776;
    Supaplex.totalHeight = 1472;
    Supaplex.offsetLeft = 0;
    Supaplex.offsetTop = 0;
    Supaplex.SPRITES = {
        Base: {source: document.getElementById("Base"), tiles: 1},
        EatInfotronAnimation: {source: document.getElementById("EatInfotronAnimation"), duration: 250, tiles: 8, callBack: "eatingEnd"},
        EatBaseAnimation: {source: document.getElementById("EatTileAnimation"), tiles: 7, duration: 250, callBack: "eatingEnd"},
        Empty: {source: document.getElementById("Empty"), tiles: 1},
        Exit: {source: document.getElementById("Exit"), tiles: 1},
        Explosion: {source: document.getElementById("Explosion"), tiles: 7, duration: Supaplex.ANIMATION_TIMINGS.explosion, callBack: "explosionEnd"},
        FloppyOrange: {source: document.getElementById("FloppyOrange"), tiles: 1},
        FloppyRed: {source: document.getElementById("FloppyRed"), tiles: 1},
        FloppyYellow: {source: document.getElementById("FloppyYellow"), tiles: 1},
        Infotron: {source: document.getElementById("Infotron"), tiles: 1},
        InfotronFallingLeft: {source: document.getElementById("InfotronFallingLeft"), duration: Supaplex.ANIMATION_TIMINGS.falling, tiles: 8, callBack: "fallingEnd"},
        InfotronFallingRight: {source: document.getElementById("InfotronFallingRight"), duration: Supaplex.ANIMATION_TIMINGS.falling, tiles: 8, callBack: "fallingEnd"},
        MurphyEatDown: {source: document.getElementById("MurphyEatDown"), tiles: 1},
        MurphyEatLeft: {source: document.getElementById("MurphyEatLeft"), tiles: 1},
        MurphyEatRight: {source: document.getElementById("MurphyEatRight"), tiles: 1},
        MurphyEatUp: {source: document.getElementById("MurphyEatUp"), tiles: 1},
        MurphyEnd: {source: document.getElementById("MurphyEnd"), duration: 500, tiles: 7, callBack: "MurphyEnd"},
        MurphyMovingLeft: {source: document.getElementById("MurphyMovingLeft"), duration: Supaplex.ANIMATION_TIMINGS.regularMove * 3, tiles: 3, callBack: "MurphyMoveEnd"},
        MurphyMovingRight: {source: document.getElementById("MurphyMovingRight"), duration: Supaplex.ANIMATION_TIMINGS.regularMove * 3, tiles: 3, callBack: "MurphyMoveEnd"},
        MurphyPushLeft: {source: document.getElementById("MurphyPushLeft"), tiles: 1},
        MurphyPushRight: {source: document.getElementById("MurphyPushRight"), tiles: 1},
        MurphyRegular: {source: document.getElementById("MurphyRegular"), tiles: 1},
        MurphySadFace: {source: document.getElementById("MurphySadFace"), tiles: 1},
        MurphySleepLeft: {source: document.getElementById("MurphySleepLeft"), duration: 200, tiles: 3, callBack: "MurphySleepEnd"},
        MurphySleepRight: {source: document.getElementById("MurphySleepRight"), duration: 200, tiles: 3, callBack: "MurphySleepEnd"},
        MurphyYawn: {source: document.getElementById("MurphyYawn"), duration: 1000, tiles: 12, callBack: "YawnEnd"},
        PortDown: {source: document.getElementById("PortDown"), tiles: 1},
        PortLeft: {source: document.getElementById("PortLeft"), tiles: 1},
        PortRight: {source: document.getElementById("PortRight"), tiles: 1},
        PortUp: {source: document.getElementById("PortUp"), tiles: 1},
        RAMBottom: {source: document.getElementById("RAMBottom"), tiles: 1},
        RAMLeft: {source: document.getElementById("RAMLeft"), tiles: 1},
        RAMRegular: {source: document.getElementById("RAMRegular"), tiles: 1},
        RAMRight: {source: document.getElementById("RAMRight"), tiles: 1},
        RAMTop: {source: document.getElementById("RAMTop"), tiles: 1},
        Wall: {source: document.getElementById("Wall"), tiles: 1},
        TerminalAnimationGreen: {source: document.getElementById("TerminalAnimationGreen"), duration: Supaplex.ANIMATION_TIMINGS.terminalGreen, tiles: 8},
        TerminalAnimationRed: {source: document.getElementById("TerminalAnimationRed"), duration: Supaplex.ANIMATION_TIMINGS.terminalRed, tiles: 8},
        WallBottomLeft: {source: document.getElementById("WallBottomLeft"), tiles: 1},
        WallBottomRight: {source: document.getElementById("WallBottomRight"), tiles: 1},
        WallSides: {source: document.getElementById("WallSides"), tiles: 1},
        WallTopBottom: {source: document.getElementById("WallTopBottom"), tiles: 1},
        WallTopLeft: {source: document.getElementById("WallTopLeft"), tiles: 1},
        WallTopRight: {source: document.getElementById("WallTopRight"), tiles: 1},
        Zonk: {source: document.getElementById("Zonk"), tiles: 1},
        ZonkFallingRight: {source: document.getElementById("ZonkFallingLeft"), duration: Supaplex.ANIMATION_TIMINGS.falling, tiles: 4, callBack: "fallingEnd"},
        ZonkFallingLeft: {source: document.getElementById("ZonkFallingRight"), duration: Supaplex.ANIMATION_TIMINGS.falling, tiles: 4, callBack: "fallingEnd"},
        ZonkPushedRight: {source: document.getElementById("ZonkFallingLeft"), duration: Supaplex.ANIMATION_TIMINGS.pushing, tiles: 4, callBack: "fallingEnd"},
        ZonkPushedLeft: {source: document.getElementById("ZonkFallingRight"), duration: Supaplex.ANIMATION_TIMINGS.pushing, tiles: 4, callBack: "fallingEnd"}
    };

    Supaplex.loadLevel(Supaplex.LEVELURL, 1);
}

// let's start this thing.
window.onload = function(){
    Supaplex.init();
    Supaplex.STARTTIME = new Date().getTime(); // I moved this here because otherwise I would get weird speed bugs at the start
    document.addEventListener("keydown", Supaplex.onKeyDown);
    document.addEventListener("keyup", Supaplex.onKeyUp);
    document.addEventListener("visibilitychange", Supaplex.handleVisibilityChange, false);
};
Supaplex.updateViewport = function () {
    Supaplex.offsetLeft = Supaplex.Murphy.position.x - (Supaplex.levelWidth / 2) + (Supaplex.TILESIZE / 2);
    Supaplex.offsetTop = Supaplex.Murphy.position.y - (Supaplex.levelHeight / 2) + (Supaplex.TILESIZE / 2);
    if (Supaplex.offsetLeft > Supaplex.totalWidth - Supaplex.levelWidth) {
        Supaplex.offsetLeft = Supaplex.totalWidth - Supaplex.levelWidth;
    }
    else if(Supaplex.offsetLeft < 0) {
        Supaplex.offsetLeft = 0;
    }
    if (Supaplex.offsetTop > Supaplex.totalHeight - Supaplex.levelHeight) {
        Supaplex.offsetTop = Supaplex.totalHeight - Supaplex.levelHeight;
    }
    else if (Supaplex.offsetTop < 0) {
        Supaplex.offsetTop = 0;
    }
};


Supaplex.draw = function() {
    // for(var i = Supaplex.tilesToUpdate.length - 1; i >= 0; i--) {
    //     Supaplex.tilesToUpdate[i].measure();
    // }
    Supaplex.updateViewport();
    // Supaplex.copyCtx.drawImage(Supaplex.SPRITES.Empty.source, 0, 0, Supaplex.TILESIZE, Supaplex.TILESIZE, 0, 0, Supaplex.levelCopy.width)
    Supaplex.levelCtx.clearRect(0, 0, Supaplex.levelElem.width, Supaplex.levelElem.height);
    //Supaplex.copyCtx.clearRect(0, 0, Supaplex.levelCopy.width, Supaplex.levelCopy.height);
    var xLength = Supaplex.level.length;
    //first draw all elements that aren't moving.
    for(var x = 0; x < xLength; x++) {
        var yLength = Supaplex.level[x].length;
        for(var y = 0; y < yLength; y++) {
            var element = Supaplex.level[x][y];
            if(!element.moving && element.type != "Empty") {
                element.draw();
            }
        }
    }
    for(var x2 = 0; x2 < xLength; x2++) {
        var yLength = Supaplex.level[x2].length;
        for(var y2 = 0; y2 < yLength; y2++) {
            var element2 = Supaplex.level[x2][y2];
            if(element2.moving && element2.type != "Empty") {
                element2.draw();
            }
        }
    }
    // Supaplex.levelCtx.drawImage(Supaplex.levelCopy, 0, 0);
    return;
}

Supaplex.PauseTheGame = function () {
    cancelAnimationFrame(Supaplex.AnimationFrameID);
    //Supaplex.Murphy.$elem.style.webkitAnimationPlayState = "paused";
    Supaplex.gamePaused = true;
}

Supaplex.UnPauseTheGame = function () {
    requestAnimationFrame(Supaplex.loop);
    //Supaplex.Murphy.$elem.style.webkitAnimationPlayState = "running";
    Supaplex.gamePaused = false;
}

// Get's called upon switching to and from this tab.
Supaplex.handleVisibilityChange = function () {
    if(document.hidden) {
        Supaplex.PauseTheGame();
    } else {
        Supaplex.UnPauseTheGame();
    }
}

Supaplex.resetLevel = function () {
    Supaplex.levelElem.innerHTML = "";
    Supaplex.init();
}
// Check if an array already contains an object.
// obj: object.
Array.prototype.contains = function(obj){
    for (var i = this.length - 1; i > -1; i--) {
        Supaplex.ExplosionCount += 1;
        if (this[i] === obj) {
            return true;
        }
    }
    return false;
};

// get the next tile in the direction an object wants to move.
// posX: int denoting the X postion in the Supaplex.level Grid
// posY: int denoting the Y position in the Supaplex.Level Grid
// direction: string corresponding to the direction the object wants to move in.
Supaplex.getNeighbour = function (posY, posX, direction){
    return Supaplex.level[posY + Supaplex.DIRECTIONS[direction].y * 1][posX + Supaplex.DIRECTIONS[direction].x * 1];
};

//elem - object: The tile that should explode
//currentExplosions - array: An array of objects that have already exploded
Supaplex.explode = function(elem, currentExplosions) {
    currentExplosions = currentExplosions || [];
    elem.sprite = Supaplex.SPRITES.Explosion;
    elem.type = "Explosion";
    elem.currentSpriteTile = 0;
    elem.bomb = false;
    var neighbours = elem.getAllNeighbours();
    for(var key in neighbours) {
        var currentElement = neighbours[key];
        if (currentElement.exploding) {
            currentExplosions.push(currentElement);
            currentElement.sprite = Supaplex.SPRITES.Explosion;
            currentElement.type = "Explosion";
            currentElement.currentSpriteTile = 0;
            if(currentElement.bomb) {
                currentElement.bomb = false;
                setTimeout(Supaplex.explode, 250, currentElement, currentExplosions);
            }
        }
    }
};

Supaplex.keyBoard = {
    Down: {down: false, direction: "Down"},
    Left: {down: false, direction: "Left", directionFacing: "Left"},
    Right: {down: false, direction: "Right", directionFacing: "Right"},
    Up: {down: false, direction: "Up"},
    space: {down: false}
};

//Simple function to map keycodes to strings so I don't have to remember keycodes
//key: string, name of the key.
Supaplex.keyBoard.getValue = function(key)
{
    switch(key) {
        case "escape":  return 27;
        case "Left":    return 37;
        case "Up":      return 38;
        case "Right":   return 39;
        case "Down":    return 40;
        case "space":   return 32;
        case "p":       return 80;
    }
};

Supaplex.keyBoard.getKey = function(keycode) {
    switch(keycode) {
        case 27: return "escape";
        case 37: return "Left";
        case 38: return "Up";
        case 39: return "Right";
        case 40: return "Down";
        case 32: return "space";
        case 80: return "p";
    }
}

// Values for the old movement system.
// TODO: Delete this
Supaplex.keyBoard.moveLeft = false;
Supaplex.keyBoard.moveUp = false;
Supaplex.keyBoard.moveRight = false;
Supaplex.keyBoard.moveDown = false;

Supaplex.keyBoard.spaceDown = false;

Supaplex.keyBoard.anyKeyDown = function() {
    return !(!Supaplex.keyBoard.Left.down && !Supaplex.keyBoard.Up.down && !Supaplex.keyBoard.Right.down && !Supaplex.keyBoard.Down.down);
}

// key event for onKeyDown
// event: The event which was broadcast.
Supaplex.onKeyDown = function(event) {
    // console.log("Key down: " + event.keyCode);
    var value = Supaplex.keyBoard.getKey(event.keyCode);
    var key = Supaplex.keyBoard[value];
    if(key) {
        if(!key.down) {
            key.down = true;
            if(key.direction) {
                Supaplex.Murphy.nextDirection = key.direction;
            }
            if(key.directionFacing) {
                Supaplex.Murphy.directionFacing = key.directionFacing;
            }
        }
        if(value === "Left" || value === "Right" || value === "Up" || value === "Down") {
            Supaplex.keyBoard.moving = true;
        }
    }
    switch(event.keyCode) {
        case Supaplex.keyBoard.getValue("escape"):
            Supaplex.explode(Supaplex.Murphy);
            Supaplex.resetLevel();
            // document.removeEventListener('keydown', Supaplex.onKeyDown);
            break;

        case Supaplex.keyBoard.getValue("p"):
            if(Supaplex.gamePaused) {
                Supaplex.UnPauseTheGame();
            } else {
                Supaplex.PauseTheGame();
            }
            break;
    }
};

// Since I remove the regular onKeyDown eventlistener on pausing the game, I need a temporary new one.
// event: The event that was broadcast.
Supaplex.pausedKeyDown = function(event) {
    switch(event.keyCode) {
        case Supaplex.keyBoard.getValue("p"):
            Supaplex.UnPauseTheGame();
            break;
    }
}

// key event for on key up
// event: The event that was broadcast
Supaplex.onKeyUp = function(event) {
    // console.log("Key up: " + event.keyCode);
    var value = Supaplex.keyBoard.getKey(event.keyCode);
    var key = Supaplex.keyBoard[value];
    if(key) {
        key.down = false;
    }
    if(!Supaplex.keyBoard.anyKeyDown()) {
        Supaplex.keyBoard.moving = false;
    }
}
/*********************************************************************************************************************/
/*************************************** -- LOAD LEVEL -- ************************************************************/
/*********************************************************************************************************************/

// data: json containing 2 objects, grid and info. The grid contains hexadecimal values corresponding to the tiles
Supaplex.loadLevel = function (url, lvl) {
    Supaplex.getJson(url, lvl, Supaplex.buildLevel);
};

// Perform a request to my open.php script, which will extract level data from the original levels.dat file
// url: string, the url where the open.php script is located.
// lvl: int, the number of the level which you want to load.
Supaplex.getJson = function(url, lvl, callback) {
    var xobj = new XMLHttpRequest();
    xobj.open('GET', "files/LEVELS.DAT", true)
    xobj.responseType = "arraybuffer";

    xobj.onload = function(e) {
        var responseArray = new Uint8Array(this.response);
        var data = Supaplex.getLevelData(responseArray, lvl);
        console.log(data);
        callback(data);
    };
    xobj.send(null);
};

Supaplex.getLevelData = function(data, lvl) {
    var levelData = {
        grid: [],
        info: []
    };
    var maxI = i + 1536;
    for(var i = 0; i < Supaplex.HE; i++) {
        var row = [];
        for(var j = 0; j < Supaplex.WI; j++) {
            var currentIndex = ((lvl - 1) * 1536) + (i * Supaplex.WI) + j;
            row.push(data[currentIndex]);
        }
        levelData.grid.push(row);
    }
    for(var k = 0; k < 96; k++) {
        var currentIndex2 = ((lvl - 1) * 1536) + 1440 + k;
        levelData.info.push(data[currentIndex2]);
    }

    return levelData;
}

Supaplex.buildLevel = function (data) {
    var grid = data.grid; //["grid"]; //Only use the Grid object in data. there's more info in the Info object that I'll use later.
    for (var i = 0; i < grid.length; i++) {
        var row = [],
            obj = grid[i];
        for (var j = 0; j < obj.length; j++) {
            var currentTile = Supaplex.getTile(obj[j], i, j)
            currentTile.draw();
            row.push(currentTile);
        }
        Supaplex.level.push(row);
    }
    var info = data.info;
    Supaplex.levelInfo.InfotronsNeeded = info[30];
    Supaplex.Murphy = Supaplex.level[Supaplex.MurphyLocationX][Supaplex.MurphyLocationY];
    Supaplex.giveMurphySuperpowers();
    Supaplex.Murphy.directionFacing = "Left";
    Supaplex.Murphy.isPushing = false;
    Supaplex.loop();
    Supaplex.logic();
}

// Returns a Tile object based on the level data for that tile.
// data: string, corresponds to a hexadecimal number
// i: int, the Y position of the current tile
// j: int, the X position of the current tile
Supaplex.getTile = function(data, i, j){
    var tile = Object.create(Tile)
    //Tile (ID, locationX, locationY, type, exploding, bomb, movable, active, position.x, position.y);
    switch (data.toString(16)) {
        case "0":
            tile.init(j, i, "Empty", true, false, false, true, "Empty");
            break;
        case "1": //Zonk
            tile.init(j, i, "Zonk", true, false, true, true, "Zonk");
            break;
        case "2": //Base hardware
            tile.init(j, i, "Base", true, false, false, true, "Base");
            break;
        case "3": //Murphy
            tile.init(j, i, "Murphy", true, true, false, true, "Murphy");
            Supaplex.MurphyLocationX = i;
            Supaplex.MurphyLocationY = j;
            tile.sprite = Supaplex.SPRITES["MurphyMovingLeft"];
            break;
        case "4": //Infotron
            tile.init(j, i, "Infotron", true, false, true, true, "Infotron");
            break;
        case "5": //RAM-regular, pins on 4 sides
            tile.init(j, i, "RAMRegular", true, false, false, true, "RAMRegular");
            break;

        case "6": //Walls
            var wallType = "";
            if (i === 0 && j === 0) { //Top-left corner wall
                wallType = "WallTopLeft";
            } else if (i === 0 && j === 59) { //Top-right corner wall
                wallType = "WallTopRight";
            } else if (i === 23 && j === 0) { //Bottom-left corner wall
                wallType = "WallBottomLeft";
            } else if (i === 23 && j === 59) { //Bottom-right corner wall
                wallType = "WallBottomRight";
            } else if ((i === 0 && j > 0 && j < 59) || (i === 23 && j > 0 && j < 59)) { //Walls on top and bottom.
                wallType = "WallTopBottom";
            } else if ((j === 0 || j === 59) && (i > 0 && i < 23)) { //Walls on the sides
                wallType = "WallSides";
            } else { //Regular walls inside the grid.
                wallType = "Wall";
            }
            tile.init(j, i, wallType, false, false, false, true, wallType);
            break;

        case "7":
            tile.init(j, i, "Exit", true, false, false, true, "Exit");
            break;

        case "8":
            tile.init(j, i, "FloppyOrange", true, true, true, true, "FloppyOrange");
            break;

        case "9":
            tile.init(j, i, "PortRight", true, false, false, true, "PortRight");
            break;

        case "0A":
            tile.init(j, i, "PortDown", true, false, false, true, "PortDown");
            break;

        case "0B":
            tile.init(j, i, "PortLeft", true, false, false, true, "PortLeft");
            break;

        case "0C":
            tile.init(j, i, "PortUp", true, false, false, true, "PortUp");
            break;

        // case "11":
        //     tile.init(i + "." + j, j, i, "SnikSnak", true, false, false, true, positionX, positionY);
        //     break;

        case "12":
            tile.init(j, i, "FloppyYellow", true, true, false, true, "FloppyYellow");
            Supaplex.YellowFloppies.push(tile);
            break;

        case "13":
            tile.init(j, i, "Terminal", true, false, false, true, "TerminalAnimationGreen");
            break;

        case "14":
            tile.init(j, i, "FloppyRed", true, false, false, true, "FloppyRed");
            break;

        case "1a": //RAM horizontal, left part
            tile.init(j, i, "RAMLeft", true, false, false, true, "RAMLeft");
            break;
        case "1b": //RAM horizontal, right part
            tile.init(j, i, "RAMRight", true, false, false, true, "RAMRight");
            break;

        case "26": //RAM vertical, top part
            tile.init(j, i, "RAMTop", true, false, false, true, "RAMTop");
            break;
        case "27": //RAM vertical, bottom part
            tile.init(j, i, "RAMBottom", true, false, false, true, "RAMBottom");
            break;
        default: //I haven't yet included all of the sprites, so for now I'll default if there's anything else than the above mentioned case.
            tile.init(j, i, "Empty", true, false, false, true, "Empty");
            break;
    }
    return tile;
};
//The main logic function. For now this gets called by requestAnimationFrame.
//Since I'm still building the main structure, I'll rework this into seperate functions later on.
Supaplex.logic = function() {
    Supaplex.processMurphy();

    //We'll iterate over evey Tile in the level, and process it accordingly. Most tiles will just get ignored.
    //I should really move this into seperate functions.
    for (var i = 0; i < Supaplex.HE; i++) {
        for (var j = 0; j < Supaplex.WI; j++) {
            var currentTile = Supaplex.level[i][j];
            switch(currentTile.type) {
                case "Zonk": case "Infotron":
                    Supaplex.processZonkOrInfotron(currentTile);
                    break;
            }
        }
    }
    Supaplex.lastLogicUpdate = performance.now();
    return;
    //Supaplex.draw();
}

Supaplex.processMurphy = function() {
    if(!Supaplex.Murphy.moving && !Supaplex.Murphy.waiting) {
        Supaplex.Murphy.direction = Supaplex.Murphy.nextDirection;
    }
    if(neighbour = Supaplex.checkIfMurphyShouldEat()) {
        Supaplex.MurphyEatNeighbour(neighbour);
        return;
    }

    if(Supaplex.checkIfMurphyShouldMove()) {
        if(!Supaplex.Murphy.moving) {
            var neighbour = Supaplex.getNeighbour(Supaplex.Murphy.locationY, Supaplex.Murphy.locationX, Supaplex.Murphy.direction);
            switch(neighbour.type) {
                case "Empty": case "Base": case "Infotron":
                    if(neighbour.reserved) break;
                    Supaplex.processRegularMove(neighbour);
                    break;
                case "Exit":
                    if(Supaplex.infotronsCollected >= Supaplex.levelInfo.InfotronsNeeded) {
                        Supaplex.Murphy.sprite = Supaplex.SPRITES.MurphyEnd;
                        console.log("Good going, you won!");
                    }
                    break;
                case "Terminal":
                    if(Supaplex.YellowFloppies.length != 0) {
                        neighbour.sprite.duration = Supaplex.ANIMATION_TIMINGS.terminalGreenFast;
                        for(var i = Supaplex.YellowFloppies.length - 1; i >= 0; i--) {
                            Supaplex.explode(Supaplex.YellowFloppies[i]);
                            Supaplex.YellowFloppies.pop();
                        }
                    }
                    break;
                case "Zonk":
                    if(Supaplex.Murphy.direction !== "Left" && Supaplex.Murphy.direction !== "Right") break;
                    var nextNeighbour = neighbour.getNeighbour(Supaplex.Murphy.direction);
                    if(nextNeighbour.type == "Empty" && !neighbour.falling && !nextNeighbour.reserved) {
                        Supaplex.processPush(neighbour, nextNeighbour);
                    }
                    break;
            }
        } else {
            Supaplex.Murphy.move(Supaplex.Murphy.animationTiming, Supaplex.Murphy.direction, Supaplex.Murphy.animationClass, Supaplex.Murphy.moveEndCallback, Supaplex.Murphy.moveAmount);
            Supaplex.Murphy.checkForLastMove(Supaplex.Murphy.direction, Supaplex.Murphy);
        }
    } else if(Supaplex.Murphy.waiting) {
        Supaplex.Murphy.wait(Supaplex.Murphy.waitingTime, Supaplex.Murphy.waitingCallback, Supaplex.Murphy.waitingArgs);
    }
}

Supaplex.checkIfMurphyShouldEat = function() {
    if(Supaplex.keyBoard.space.down && !Supaplex.Murphy.moving && Supaplex.keyBoard.moving ) {
        var neighbour = Supaplex.Murphy.getNeighbour(Supaplex.Murphy.direction);
        if(neighbour.type == "Base" || neighbour.type == "Infotron") {
            return neighbour;
        }
    }
    return false;
}

Supaplex.MurphyEatNeighbour = function(neighbour) {
    Supaplex.Murphy.eating = true;
    Supaplex.Murphy.eat(neighbour);
    Supaplex.Murphy.currentSpriteTile = 0;
    Supaplex.Murphy.sprite = Supaplex.SPRITES["MurphyEat" + Supaplex.Murphy.direction];
    if(neighbour.type == "Infotron") {
        Supaplex.infotronsCollected += 1;
    }
    return;
}

Supaplex.checkIfMurphyShouldMove = function() {
    if(!Supaplex.keyBoard.moving && !Supaplex.Murphy.moving) {
        return false;
    }
    if(!Supaplex.Murphy.moving && Supaplex.keyBoard.space.down) {
        return false;
    }
    if(Supaplex.Murphy.waiting) {
        return false;
    }
    return true;
}

Supaplex.processRegularMove = function(neighbour) {
    Supaplex.Murphy.animationClass = "MurphyMoving" + Supaplex.Murphy.directionFacing;
    Supaplex.Murphy.animationTiming = Supaplex.ANIMATION_TIMINGS.regularMove;
    Supaplex.Murphy.move(Supaplex.Murphy.animationTiming, Supaplex.Murphy.direction, Supaplex.Murphy.animationClass, "changeLocation", Supaplex.TILESIZE);
    neighbour.reserved = true;
    neighbour.reservedBy = Supaplex.Murphy;
    if(neighbour.type == "Infotron") Supaplex.infotronsCollected += 1;
}

Supaplex.processPush = function(neighbour, nextNeighbour) {
    neighbour.reserved = true;
    nextNeighbour.reserved = true;
    nextNeighbour.reservedBy = neighbour;
    neighbour.animationTiming = Supaplex.ANIMATION_TIMINGS.pushing;
    Supaplex.Murphy.sprite = Supaplex.SPRITES["MurphyPush" + Supaplex.Murphy.direction];
    Supaplex.Murphy.animationClass = "MurphyPush" + Supaplex.Murphy.direction;
    Supaplex.Murphy.animationTiming = Supaplex.ANIMATION_TIMINGS.pushing;
    Supaplex.Murphy.isPushing = true;
    Supaplex.Murphy.wait(Supaplex.ANIMATION_TIMINGS.waitBeforePush, Supaplex.Murphy.pushing, [neighbour, Supaplex.Murphy.direction]);
}

Supaplex.processZonkOrInfotron = function(tile) {
    if (!tile.moving && !tile.waiting) {
        var allNeighbours = tile.getAllNeighbours();
        if (Supaplex.canFallDown(tile, allNeighbours.bottom)) {
            Supaplex.makeTileFall(tile, allNeighbours.bottom);
            return;
        }
        var direction;
        if(direction = Supaplex.canMoveSideways(tile, allNeighbours)) {
            if(direction == "Left") {
                var bottom = allNeighbours.bottomLeft,
                side = allNeighbours.left;
            } else {
                var bottom = allNeighbours.bottomRight,
                side = allNeighbours.right;
            }
            Supaplex.moveTileSideways(tile, direction, side, bottom);
        } else {
            tile.falling = false;
        }
    } else {
        tile.move(tile.animationTiming, tile.direction, tile.animationClass, tile.moveEndCallback, tile.moveAmount);
        if(tile.checkForLastMove(tile.direction, tile)) {
            Supaplex.checkIfTileIsFallingOnSomething(tile);
        }
    }
}

Supaplex.canFallDown = function(tile, neighbour) {
    if(neighbour.type !== "Empty") {
        return false;
    }
    if(neighbour.reserved && neighbour.reservedBy !== tile) {
        return false;
    }
    return true;
}

Supaplex.makeTileFall = function(tile, neighbour) {
    tile.move(Supaplex.ANIMATION_TIMINGS.regularMove, "Down", tile.type, "changeLocation");
    tile.animationTiming = Supaplex.ANIMATION_TIMINGS.regularMove;
    tile.direction = "Down";
    tile.falling = true;
    neighbour.reservedBy = tile;
    neighbour.reserved = true;
}

Supaplex.canMoveSideways = function(tile, neighbours) {
    var bottom = neighbours.bottom;
    if(bottom.moving) {
        return false;
    }
    var names = "ZonkInfotronRAMTopRAMLeftRAMRightRAMBottomRAMRegular";
    if(names.indexOf(bottom.type) == -1) {
        return false;
    }
    if(Supaplex.checkDirection(neighbours.bottomLeft, neighbours.left, neighbours.topLeft)) {
        return "Left";
    }
    if(Supaplex.checkDirection(neighbours.bottomRight, neighbours.right, neighbours.topRight)) {
        return "Right";
    }
    return false;
}

Supaplex.checkDirection = function(bottom, side, top) {
    if(side.type !== "Empty") {
        return false;
    }
    if(bottom.type !== "Empty") {
        return false;
    }
    if(bottom.reserved || side.reserved) {
        return false;
    }
    if(top.type == "Zonk") {
        return false;
    }
    if(top.reserved && top.reservedBy.type == "Zonk") {
        return false;
    }
    return true;
}

Supaplex.moveTileSideways = function(tile, direction, side, bottom) {
    tile.move(Supaplex.ANIMATION_TIMINGS.falling, direction, tile.type + "Falling" + direction, "changeLocation");
    bottom.reserved = true;
    bottom.reservedBy = tile;
    side.reserved = true;
    side.reservedBy = tile;
    tile.direction = direction;
    tile.animationTiming = Supaplex.ANIMATION_TIMINGS.falling;
    tile.animationClass = "ZonkFalling" + direction;
    tile.falling = true;
}

Supaplex.checkIfTileIsFallingOnSomething = function(tile) {
    if(tile.direction !== "Down") {
        return;
    }
    if(Supaplex.MurphyGetsHit(tile)) {
        Supaplex.explode(Supaplex.Murphy);
    }
}

Supaplex.MurphyGetsHit = function(tile) {
    var neighbour = tile.getNeighbour("Down");
    if(neighbour == Supaplex.Murphy) {
        if(!Supaplex.Murphy.moving) {
            return true;
        }
    }
    if(neighbour.reserved && neighbour.reservedBy == Supaplex.Murphy) {
        return true;
    }
    return false;
}
Supaplex.loop = function() {
    Supaplex.fpsCounter += 1;
    Supaplex.fpsTimer = (performance.now() - Supaplex.lastLogicUpdate);
    Supaplex.FPS = 1000 / Supaplex.fpsTimer;
    // if(Supaplex.fpsTimer > 1000) {
    //     Supaplex.FPS = Supaplex.fpsCounter;
    //     if(Supaplex.FPS < 60) {
    //         Supaplex.FPS = 60;
    //     }
    //     Supaplex.fpsCounter = 0;
    //     Supaplex.fpsTimer = 0;
    // }
    Supaplex.logic();
    Supaplex.draw();
    Supaplex.lastLogicUpdate = performance.now();
    Supaplex.AnimationFrameID = requestAnimationFrame(Supaplex.loop);
};
/*****************************************-- SPECIAL MURPHY SUPERPOWERS -- *******************************************/
/*********************************************************************************************************************/
Supaplex.giveMurphySuperpowers = function() {
    Supaplex.Murphy.eat = function(tile) {
        tile.sprite = Supaplex.SPRITES["Eat" + tile.type + "Animation"];
    };

    Supaplex.Murphy.direction = "Left";

    Supaplex.Murphy.pushing = function(neighbour, direction) {
        console.log("pushing");
        neighbour.direction = direction;
        neighbour.beingPushed = true;
        neighbour.animationTiming = Supaplex.ANIMATION_TIMINGS.pushing;
        neighbour.animationClass = "Zonk";
        neighbour.sprite = Supaplex.SPRITES.Zonk;
        Supaplex.Murphy.sprite = Supaplex.SPRITES["MurphyPush" + direction];
        Supaplex.Murphy.move(Supaplex.ANIMATION_TIMINGS.pushing, Supaplex.Murphy.direction, "MurphyPush" + Supaplex.Murphy.directionFacing, "pushChangelocation");
        neighbour.move(Supaplex.ANIMATION_TIMINGS.pushing, neighbour.direction, "ZonkPushed" + direction, "fallingEnd");
        //Supaplex.Murphy.wait(Supaplex.ANIMATION_TIMINGS.waitBeforePush, Supaplex.Murphy.move, [Supaplex.ANIMATION_TIMINGS.pushing, Supaplex.Murphy.direction, "MurphyPush" + Supaplex.Murphy.directionFacing, "pushChangelocation"]);
        //neighbour.wait(Supaplex.ANIMATION_TIMINGS.waitBeforePush, neighbour.move, [Supaplex.ANIMATION_TIMINGS.pushing, neighbour.direction, "ZonkPushed" + direction, "fallingEnd"]);
    };

    Supaplex.Murphy.MurphyMoveEnd = function() {

    }

    Supaplex.Murphy.MurphyEnd = function() {
        Supaplex.Murphy.sprite = Supaplex.SPRITES.Empty;
        console.log("you won the game!");
    };

    Supaplex.Murphy.nextDirection = "";
};
/*********************************************************************************************************************/
/************************************************ -- TILE OBJECT -- **************************************************/
/*********************************************************************************************************************/

// The basic building block of our game. we have a total of 1440 tiles.
var Tile = {
    // initializes a newly created tile and adds it to the DOM.
    // locationX - Number: the horizontal location of a tile within the level array.
    // locationY - Number: the vertical location of a tile within the level array.
    // type - String: The type of a tile.
    // exploding - Boolean: Can the tile explode (only affects this tile).
    // bomb - Boolean: is the tile a bomb (and can it blow up all the surrounding elements that are explodable).
    // movable - Boolean: Can the tile be moved.
    // active - Boolean: Can we still interact with it?
    // positionX - Number: The horizontal position in pixels.
    // positionY - Number: the vertical position in pixels.
    init: function(locationX, locationY, type, exploding, bomb, movable, active, sprite) {
        var positionY = locationY * Supaplex.TILESIZE, positionX = locationX * Supaplex.TILESIZE;
        if(locationY > 0) {
            positionY -= 32;
        }
        if(locationX > 0) {
            positionX -= 32;
        }
        // What's the current location in the level matrix?
        this.locationY = locationY; // the Y location, corresponds to one of 24 arrays in the supaplex.level array.
        this.locationX = locationX;// the X location, correponds to one of 60 tiles in Supaplex.level[locationY].
        this.type = type; // What the fuck are we dealing with here?
        this.exploding = exploding; // Can the element be blown up
        this.bomb = bomb; // Can the object explode note: if set to true every active tile will explode.
        this.movable = movable; // Can we push this thing?
        this.moving = false;
        this.direction = "";
        this.active = active; // Can we actually do something with it?
        this.position = {
            x: positionX,
            y: positionY
        }; // Nothing to see here, move on.
        this.amountMoved = 0; // How many frames/pixels has it moved (probably a horrible idea to do it like this)
        this.firstmove = false; // Since I updated the draw function I could probably deprecate this.
        this.reserved = false;
        this.reservedBy = undefined;
        this.beingPushed = false;
        this.sprite = Supaplex.SPRITES[sprite];
        this.currentSpriteTile = 0;
        this.framesMissing = 0;
        this.visible = true;
        this.framesDone = 0;
        this.moveEndCallback = "";
        this.startTime = 0;
        this.falling = false;
        this.waiting = false;
        this.waitingTime = 0;
        this.waitingCallback;
        this.waitingArgs = [];
    },
    measure: function() {
        //this.lastClasses = this.$elem.className;
    },
    draw: function() {
        if(this.sprite.tiles > 1) {
            this.framesDone += 1;
            var framesPerSpriteMin = Math.floor(this.sprite.duration / 1000 * Supaplex.FPS / this.sprite.tiles);
            this.framesMissing = Math.floor(this.sprite.duration / 1000 * Supaplex.FPS) - framesPerSpriteMin * this.sprite.tiles;
            var framesPerSprite = this.currentSpriteTile < this.framesMissing ? framesPerSpriteMin + 1: framesPerSpriteMin;
            if(this.framesDone >= framesPerSprite) {
                this.framesDone = 0;
                this.currentSpriteTile += 1;
                if(this.currentSpriteTile >= this.sprite.tiles) {
                    this.currentSpriteTile = 0;
                    if(this.sprite.callBack) {
                        this[this.sprite.callBack]();
                    }
                }
            }
        } else {
            this.currentSpriteTile = 0;
        }
        if(this.position.x + Supaplex.TILESIZE >= Supaplex.offsetLeft && this.position.y + Supaplex.TILESIZE >= Supaplex.offsetTop &&
        this.position.x <= Supaplex.offsetLeft + Supaplex.levelWidth && this.position.y <= Supaplex.offsetLeft + Supaplex.levelWidth) {
            this.visible = true;
            //Supaplex.copyCtx.save();
            Supaplex.levelCtx.drawImage(this.sprite.source, this.currentSpriteTile * Supaplex.TILESIZE, 0,
            Supaplex.TILESIZE, Supaplex.TILESIZE, Math.floor(this.position.x - Supaplex.offsetLeft), Math.floor(this.position.y - Supaplex.offsetTop), Supaplex.TILESIZE, Supaplex.TILESIZE);
            //Supaplex.copyCtx.restore();
        } else {
            this.visible = false;
        }
    },
    // moves a tile
    // time - Number: the time a complete movement should take in milliseconds
    // direction - String: Up, down, left or right. corresponds to Supaplex.DIRECTIONS
    // spriteClass - String: CSS class
    move: function(time, direction, spriteClass, moveEndCallback) {
        if(this.firstmove == false) {
            this.moving = true;
            this.firstmove = true;
            this.sprite = Supaplex.SPRITES[spriteClass];
            this.amountMoved = 0;
            // this.startTime = performance.now();
        }
        this.moveEndCallback = moveEndCallback;
        var amountToMove = Math.floor(Supaplex.TILESIZE / (time / 1000 * Supaplex.FPS)) //(time / (performance.now() - Supaplex.lastLogicUpdate)));
        if(amountToMove >= Supaplex.TILESIZE - this.amountMoved) {
            amountToMove = Supaplex.TILESIZE - this.amountMoved;
        }
        this.position.x += amountToMove * Supaplex.DIRECTIONS[direction].x;
        this.position.y += amountToMove * Supaplex.DIRECTIONS[direction].y;
        this.amountMoved += amountToMove;
        return;
    },
    // Checks whether the current move should be the last.
    // direction - String: Up, down, left or right. corresponds to Supaplex.DIRECTIONS
    // callback - Function: which function should be used to handle what should happen after the last move.
    checkForLastMove: function(direction, deze) {
        if(Math.round(deze.amountMoved) >= Supaplex.TILESIZE) {
            var neighbour = Supaplex.getNeighbour(deze.locationY, deze.locationX, direction);
            deze[deze.moveEndCallback](neighbour, direction);
            //deze.position.x = (Supaplex.TILESIZE / 2) + (deze.locationX - 1) * Supaplex.TILESIZE;
            //deze.position.y = (Supaplex.TILESIZE / 2) + (deze.locationY - 1) * Supaplex.TILESIZE;
            deze.firstmove = false;
            deze.amountMoved = 0;
            deze.moving = false;
            neighbour.reserved = false;
            return true;
        }
        return false;
    },
    changeLocation: function (neighbour) {
        var originalX = this.locationX,
            originalY = this.locationY;
        Supaplex.level[neighbour.locationY][neighbour.locationX] = this;
        this.locationX = neighbour.locationX;
        this.locationY = neighbour.locationY;
        Supaplex.level[originalY][originalX] = neighbour;
        neighbour.type = "Empty";
        neighbour.classes = "empty tile";
        neighbour.sprite = Supaplex.SPRITES["Empty"];
        neighbour.locationX = originalX;
        neighbour.locationY = originalY;
        neighbour.position.x = 32 + ((neighbour.locationX - 1) * Supaplex.TILESIZE);
        neighbour.position.y = 32 + ((neighbour.locationY - 1) * Supaplex.TILESIZE);
        this.position.x = 32 + ((this.locationX - 1) * Supaplex.TILESIZE);
        this.position.y = 32 + ((this.locationY - 1) * Supaplex.TILESIZE);
        neighbour.reserved = false;
    },
    pushChangelocation: function(neighbour, direction) {
        var nextNeighbour = neighbour.getNeighbour(direction),
            originalX1 = this.locationX,
            originalY1 = this.locationY,
            originalX2 = nextNeighbour.locationX,
            originalY2 = nextNeighbour.locationY;
        Supaplex.level[neighbour.locationY][neighbour.locationX] = this;
        Supaplex.level[nextNeighbour.locationY][nextNeighbour.locationX] = neighbour;
        Supaplex.level[this.locationY][this.locationX] = nextNeighbour;
        this.locationX = neighbour.locationX;
        this.locationY = neighbour.locationY;
        nextNeighbour.locationX = originalX1;
        nextNeighbour.locationY = originalY1;
        nextNeighbour.position.x = 32 + ((nextNeighbour.locationX - 1) * Supaplex.TILESIZE);
        nextNeighbour.position.y = 32 + ((nextNeighbour.locationY - 1) * Supaplex.TILESIZE);
        neighbour.locationX = originalX2;
        neighbour.locationY = originalY2;
        neighbour.position.x = 32 + ((neighbour.locationX - 1) * Supaplex.TILESIZE);
        neighbour.position.y = 32 + ((neighbour.locationY - 1) * Supaplex.TILESIZE);
        neighbour.reserved = false;
        neighbour.beingPushed = false;
        nextNeighbour.reserved = false;
        this.isPushing = false;
        if(!Supaplex.keyBoard.moving) {
            this.sprite = Supaplex.SPRITES.MurphyRegular;
        }
    },
    // Returns one neighbour Tile in the specified direction
    // direction - String: Up, down, left or right. Corresponds to Supaplex.DIRECTIONS
    getNeighbour: function(direction) {
        return Supaplex.level[this.locationY + Supaplex.DIRECTIONS[direction].y * 1][this.locationX + Supaplex.DIRECTIONS[direction].x * 1];
    },
    // Returns the neighbouring Tiles in all directions, including diagonally
    getAllNeighbours: function() {
        return {
            "topLeft": Supaplex.level[this.locationY - 1][this.locationX - 1],
            "top": Supaplex.level[this.locationY-1][this.locationX],
            "topRight": Supaplex.level[this.locationY-1][this.locationX + 1],
            "left": Supaplex.level[this.locationY][this.locationX - 1],
            "right": Supaplex.level[this.locationY][this.locationX + 1],
            "bottomLeft": Supaplex.level[this.locationY + 1][this.locationX - 1],
            "bottom": Supaplex.level[this.locationY + 1][this.locationX],
            "bottomRight": Supaplex.level[this.locationY + 1][this.locationX + 1]
        };
    },
    eatingEnd: function() {
        Supaplex.Murphy.eating = false;
        this.type = "Empty";
        this.sprite = Supaplex.SPRITES.Empty;
    },
    fallingEnd: function() {
        this.sprite = Supaplex.SPRITES[this.type];
        this.currentSpriteTile = 0;
    },
    explosionEnd: function() {
        this.sprite = Supaplex.SPRITES.Empty;
        this.type = "Empty";
        if(this.bomb) {
            this.bomb = false;
        }
    },
    wait: function(time, callback, args) {
        if(this.startTime == 0) {
            this.waiting = true;
            this.waitingTime = time;
            this.waitingCallback = callback;
            this.waitingArgs = args;
            this.startTime = performance.now();
        } else if (performance.now() - this.startTime > time) {
            console.log("wait is over");
            this.startTime = 0;
            this.waiting = false;
            callback.apply(this, args);
        }
    },
    waitBeforePushEnd: function() {
        var callBack = "pushChangelocation";
        if(this.type == "zonk") {
            this.animationClass = "ZonkPushed" + this.direction
            this.sprite = Supaplex.SPRITES[this.animationClass];
            callBack = "fallingEnd";
        }
        this.move(Supaplex.ANIMATION_TIMINGS.pushing, this.direction, this.animationClass, callBack);
    }
};