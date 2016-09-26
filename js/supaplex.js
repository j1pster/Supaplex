'use strict'
/*********************************************************************************************************************/
/********************************************* -- INIT -- ************************************************************/
/*********************************************************************************************************************/

var Supaplex = {};

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
    Supaplex.FPS = 32.0; // Usefull if people with crappy pc's can't handle it?
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
    Supaplex.viewport = {
        init:function () {
            this.x = 0;
            this.y = 0;
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            this.levelWidth = Supaplex.levelElem.clientWidth;
            this.levelHeight = Supaplex.levelElem.clientHeight;
        },
        updateViewport: function () {
            this.x = Supaplex.Murphy.position.x - (this.width / 2) + (Supaplex.TILESIZE / 2);
            this.y = Supaplex.Murphy.position.y - (this.height / 2) + (Supaplex.TILESIZE / 2);
            if (this.x > this.levelWidth - this.width) {
                this.x = this.levelWidth - this.width;
            }
            else if(this.x < 0) {
                this.x = 0
            }
            if (this.y > this.levelHeight - this.height) {
                this.y = this.levelHeight - this.height;
            }
            else if (this.y < 0) {
                this.y = 0;
            }
            Supaplex.levelElem.style.top = "-" + this.y + "px";
            Supaplex.levelElem.style.left = "-" + this.x + "px";
        }
    };
    Supaplex.viewport.init();
}

// let's start this thing.
window.onload = function(){
    Supaplex.init();
    Supaplex.loadLevel(Supaplex.LEVELURL, 1);
    Supaplex.STARTTIME = new Date().getTime(); // I moved this here because otherwise I would get weird speed bugs at the start
    document.addEventListener("keydown", Supaplex.onKeyDown);
    document.addEventListener("keyup", Supaplex.onKeyUp);
    document.addEventListener("visibilitychange", Supaplex.handleVisibilityChange, false);
};

/*********************************************************************************************************************/
/************************************************** -- CONSTANTS -- **************************************************/
/*********************************************************************************************************************/

Supaplex.LEVELURL = "../Supaplex/open.php"; //php script to read in the original Supaplex level file (levels.dat)
Supaplex.TILESIZE = 64.0; // As for now, all tiles are 64 x 64 pixels.

// Object used for movement calculations.
// The x and y values are used to determine whether to increase or decrease the onscreen positions.
Supaplex.DIRECTIONS = {
    left: {
        x: -1,
        y: 0
    },
    up: {
        x: 0,
        y: -1
    },
    right: {
        x: 1,
        y: 0
    },
    down: {
        x: 0,
        y: 1
    }
}

// Object containing the timings for different animations.
// These timings are based on timings in the original Supaplex game but may be a bit off.
Supaplex.ANIMATION_TIMINGS = {
    regularMove: 250,
    falling: 200,
    explosion: 200,
    pushing: 333
}

/*********************************************************************************************************************/
/************************************************ -- TILE OBJECT -- **************************************************/
/*********************************************************************************************************************/

// The basic building block of our game. we have a total of 1440 tiles.
var Tile = {
    // initializes a newly created tile and adds it to the DOM.
    // ID - String: The ID the div has.
    // locationX - Number: the horizontal location of a tile within the level array.
    // locationY - Number: the vertical location of a tile within the level array.
    // type - String: The type of a tile.
    // exploding - Boolean: Can the tile explode (only affects this tile).
    // bomb - Boolean: is the tile a bomb (and can it blow up all the surrounding elements that are explodable).
    // movable - Boolean: Can the tile be moved.
    // active - Boolean: Can we still interact with it?
    // positionX - Number: The horizontal position in pixels.
    // positionY - Number: the vertical position in pixels.
    init: function(ID, locationX, locationY, type, exploding, bomb, movable, active, positionX, positionY) {
        this.ID = ID;
        // What's the current location in the level matrix?
        this.locationY = locationY; // the Y location, corresponds to one of 24 arrays in the supaplex.level array.
        this.locationX = locationX;// the X location, correponds to one of 60 tiles in Supaplex.level[locationY].
        this.type = type; // What the fuck are we dealing with here?
        if(this.type === "sides" || this.type === "topBottom" || this.type === "topRight" || this.type === "topLeft" || this.type === "bottomRight" || this.type === "bottomLeft") {
            this.classes = this.type + " edge";
        }
        else {
            this.classes = this.type + " tile";
        }
        this.lastClasses = "";
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
        this.reservedBy;
        this.$elem = document.createElement('div');
        this.$elemStyle = this.$elem.style;
        this.$elem.id = this.ID;
        Supaplex.levelElem.appendChild(this.$elem);
    },
    measure: function() {
        //this.lastClasses = this.$elem.className;
    },
    draw: function() {
        //if(this.lastClasses != this.classes) {
            this.$elem.className = this.classes;
        //}
        this.$elemStyle.left = this.position.x + "px";
        this.$elemStyle.top = this.position.y + "px";
        return;
    },
    // moves a tile
    // time - Number: the time a complete movement should take in milliseconds
    // direction - String: Up, down, left or right. corresponds to Supaplex.DIRECTIONS
    // spriteClass - String: CSS class
    move: function(time, direction, spriteClass) {
        if(this.firstmove == false) {
            this.moving = true;
            this.firstmove = true;
            this.classes = "tile " + spriteClass;
        }
        var amountToMove = Supaplex.TILESIZE / (time / (performance.now() - Supaplex.lastLogicUpdate));
        if(amountToMove >= Supaplex.TILESIZE - this.amountMoved) {
            amountToMove = Supaplex.TILESIZE - this.amountMoved;
        }
        this.position.x += amountToMove * Supaplex.DIRECTIONS[direction].x;
        this.position.y += amountToMove * Supaplex.DIRECTIONS[direction].y;
        this.amountMoved += amountToMove;
        Supaplex.tilesToUpdate.push(this);
        return;
    },
    // Checks whether the current move should be the last.
    // direction - String: Up, down, left or right. corresponds to Supaplex.DIRECTIONS
    // callback - Function: which function should be used to handle what should happen after the last move.
    checkForLastMove: function(direction, callback) {
        if(Math.round(this.amountMoved) >= Supaplex.TILESIZE) {
            var neighbour = Supaplex.getNeighbour(this.locationY, this.locationX, direction);
            Supaplex.changeLocation(this, neighbour);
            this.position.x = (Supaplex.TILESIZE / 2) + (this.locationX - 1) * Supaplex.TILESIZE;
            this.position.y = (Supaplex.TILESIZE / 2) + (this.locationY - 1) * Supaplex.TILESIZE;
            this.firstmove = false;
            this.amountMoved = 0;
            this.moving = false;
            neighbour.reserved = false;
        }
    },
    // Returns one neighbour Tile in the specified direction
    // direction - String: Up, down, left or right. Corresponds to Supaplex.DIRECTIONS
    getNeighbour: function(direction) {
        return Supaplex.level[this.locationY + Supaplex.DIRECTIONS[direction].y * 1][this.locationX + Supaplex.DIRECTIONS[direction].x * 1];
    },
    // Returns the neighbouring Tiles in all directions, including diagonally
    getAllNeighbours: function() {
        var allNeighbours = {
            "topLeft": Supaplex.level[this.locationY - 1][this.locationX - 1],
            "top": Supaplex.level[this.locationY-1][this.locationX],
            "topRight": Supaplex.level[this.locationY-1][this.locationX + 1],
            "left": Supaplex.level[this.locationY][this.locationX - 1],
            "right": Supaplex.level[this.locationY][this.locationX + 1],
            "bottomLeft": Supaplex.level[this.locationY + 1][this.locationX - 1],
            "bottom": Supaplex.level[this.locationY + 1][this.locationX],
            "bottomRight": Supaplex.level[this.locationY + 1][this.locationX + 1]
        }
        return allNeighbours;
    }
}

/*********************************************************************************************************************/
/*****************************************-- SPECIAL MURPHY SUPERPOWERS -- *******************************************/
/*********************************************************************************************************************/
Supaplex.giveMurphySuperpowers = function() {
    Supaplex.Murphy.eat = function(tile) {
        tile.classes = "Eat" + tile.type + " tile";
        tile.$elem.addEventListener("animationend", Supaplex.eatingEndCallback(tile), false);
        Supaplex.tilesToUpdate.push(tile);
    }

    Supaplex.Murphy.pushing = function(direction) {

    }
}

/*********************************************************************************************************************/
/******************************************* -- HELPER FUNCTIONS -- **************************************************/
/*********************************************************************************************************************/

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

// Perform a request to my open.php script, which will extract level data from the original levels.dat file
// url: string, the url where the open.php script is located.
// lvl: int, the number of the level which you want to load.
Supaplex.getJson = function(url, lvl, callback) {
    var xobj = new XMLHttpRequest();
    var params = "?level=" + lvl;
    var data;
    xobj.open('GET', url + params, true);

    xobj.onreadystatechange = function(){
        if(xobj.readyState == 4 && xobj.status == "200") {
            if (xobj.responseText != undefined) {
                data = JSON.parse(xobj.responseText);
                callback(data);
            }
        }
    };
    xobj.send();
};

// Returns a Tile object based on the level data for that tile.
// data: string, corresponds to a hexadecimal number
// i: int, the Y position of the current tile
// j: int, the X position of the current tile
Supaplex.getTile = function(data, i, j){
    var tile = Object.create(Tile), positionY = i * 64, positionX = j * 64;
    if(i > 0) {
        positionY -= 32;
    }
    if(j > 0) {
        positionX -= 32;
    }
    //Tile (ID, locationX, locationY, type, exploding, bomb, movable, active, position.x, position.y);
    switch (data) {
        case "0":
            tile.init(i + "." + j, j, i, "empty", true, false, false, true, positionX, positionY);
            break;
        case "1": //Zonk
            //Supaplex.Zonks.push({ZonkID: index2 + "." + index1, locationX: index2, locationY: index1});
            tile.init(i + "." + j, j, i, "zonk", true, false, true, true, positionX, positionY);
            break;
        case "2": //Base hardware
            tile.init(i + "." + j, j, i, "base", true, false, false, true, positionX, positionY);
            break;
        case "3": //Murphy
            tile.init(i + "." + j, j, i, "Murphy", true, true, false, true, positionX, positionY);
            Supaplex.MurphyLocationX = i;
            Supaplex.MurphyLocationY = j;
            break;
        case "4": //Infotron
            tile.init(i + "." + j, j, i, "infotron", true, false, true, true, positionX, positionY);
            break;
        case "5": //RAM-regular, pins on 4 sides
            tile.init(i + "." + j, j, i, "RAM-regular", true, false, false, true, positionX, positionY);
            break;

        case "6": //Walls
            var wallType = "";
            if (i === 0 && j === 0) { //Top-left corner wall
                wallType = "topLeft";
            } else if (i === 0 && j === 59) { //Top-right corner wall
                wallType = "topRight";
            } else if (i === 23 && j === 0) { //Bottom-left corner wall
                wallType = "bottomLeft";
            } else if (i === 23 && j === 59) { //Bottom-right corner wall
                wallType = "bottomRight";
            } else if ((i === 0 && j > 0 && j < 59) || (i === 23 && j > 0 && j < 59)) { //Walls on top and bottom.
                wallType = "topBottom";
            } else if ((j === 0 || j === 59) && (i > 0 && i < 23)) { //Walls on the sides
                wallType = "sides";
            } else { //Regular walls inside the grid.
                wallType = "wall";
            }
            tile.init(i + "." + j, j, i, wallType, false, false, false, true, positionX, positionY);
            break;

        case "7":
            tile.init(i + "." + j, j, i, "Exit", true, false, false, true, positionX, positionY);
            break;

        case "8":
            tile.init(i + "." + j, j, i, "FloppyOrange", true, true, true, true, positionX, positionY);
            break;

        case "9":
            tile.init(i + "." + j, j, i, "PortRight", true, false, false, true, positionX, positionY);
            break;

        case "0A":
            tile.init(i + "." + j, j, i, "PortDown", true, false, false, true, positionX, positionY);
            break;

        case "0B":
            tile.init(i + "." + j, j, i, "PortLeft", true, false, false, true, positionX, positionY);
            break;

        case "0C":
            tile.init(i + "." + j, j, i, "PortUp", true, false, false, true, positionX, positionY);
            break;

        case "11":
            tile.init(i + "." + j, j, i, "SnikSnak", true, false, false, true, positionX, positionY);
            break;

        case "12":
            tile.init(i + "." + j, j, i, "FloppyYellow", true, true, false, true, positionX, positionY);
            Supaplex.YellowFloppies.push(tile);
            break;

        case "13":
            tile.init(i + "." + j, j, i, "Terminal", true, false, false, true, positionX, positionY);
            break;

        case "14":
            tile.init(i + "." + j, j, i, "FloppyRed", true, false, false, true, positionX, positionY);
            break;

        case "1a": //RAM horizontal, left part
            tile.init(i + "." + j, j, i, "RAM-left", true, false, false, true, positionX, positionY);
            break;
        case "1b": //RAM horizontal, right part
            tile.init(i + "." + j, j, i, "RAM-right", true, false, false, true, positionX, positionY);
            break;

        case "26": //RAM vertical, top part
            tile.init(i + "." + j, j, i, "RAM-top", true, false, false, true, positionX, positionY);
            break;
        case "27": //RAM vertical, bottom part
            tile.init(i + "." + j, j, i, "RAM-bottom", true, false, false, true, positionX, positionY);
            break;
        default: //I haven't yet included all of the sprites, so for now I'll default if there's anything else than the above mentioned case.
            tile.init(i + "." + j, j, i, "empty", true, false, false, true, positionX, positionY);
            break;
    }
    return tile;
};

// get the next tile in the direction an object wants to move.
// posX: int denoting the X postion in the Supaplex.level Grid
// posY: int denoting the Y position in the Supaplex.Level Grid
// direction: string corresponding to the direction the object wants to move in.
Supaplex.getNeighbour = function (posY, posX, direction){
    return Supaplex.level[posY + Supaplex.DIRECTIONS[direction].y * 1][posX + Supaplex.DIRECTIONS[direction].x * 1];
}

// Change the location of a tile that has just moved (Murphy, scissors, etc.)
// neighbour: a tile object which is in the location that our moving object has just moved to.
Supaplex.changeLocation = function (movingObject, neighbour) {
    var originalX = movingObject.locationX,
        originalY = movingObject.locationY;
    Supaplex.level[neighbour.locationY][neighbour.locationX] = movingObject;
    movingObject.locationX = neighbour.locationX;
    movingObject.locationY = neighbour.locationY;
    Supaplex.level[originalY][originalX] = neighbour
    neighbour.type = "empty";
    neighbour.classes = "empty tile";
    neighbour.locationX = originalX;
    neighbour.locationY = originalY;
    neighbour.position.x = 32 + ((neighbour.locationX - 1) * Supaplex.TILESIZE);
    neighbour.position.y = 32 + ((neighbour.locationY - 1) * Supaplex.TILESIZE);
    Supaplex.tilesToUpdate.push(neighbour);
    neighbour.reserved = false;
}

//elem - object: The tile that should explode
//currentExplosions - array: An array of objects that have already exploded
Supaplex.explode = function(elem, currentExplosions) {
    var currentExplosions = currentExplosions || [];
    elem.classes = "Explosion tile";
    elem.bomb = false;
    Supaplex.tilesToUpdate.push(elem);
    elem.$elem.addEventListener("animationend", Supaplex.animationEndCallback(elem, "empty"), false);
    var neighbours = elem.getAllNeighbours();
    Object.keys(neighbours).forEach(function(key) {
        var currentElement = neighbours[key];
        if (currentElement.exploding) {
            if (!currentExplosions.contains(currentElement)){
                currentExplosions.push(currentElement);
                currentElement.classes = "Explosion tile";
                elem.bomb = false;
                Supaplex.tilesToUpdate.push(currentElement);
                currentElement.$elem.addEventListener("animationend", Supaplex.animationEndCallback(currentElement, "empty"), false);
                if(currentElement.bomb) {
                    setTimeout(Supaplex.explode, Supaplex.ANIMATION_TIMINGS.explosion, currentElement, currentExplosions);
                }
            }
        }
    });
},

//elem - object: the Tile that just had an animation which should end now.
//tileType - string: the type of the tile which determines it's new css class.
Supaplex.animationEndCallback = function(elem, tileType) {
    return function() {
        elem.classes = tileType + " tile";
        elem.type = tileType;
        Supaplex.tilesToUpdate.push(elem);
    }
}

Supaplex.eatingEndCallback = function(elem) {
    return function() {
        elem.classes = "empty tile";
        elem.type = "empty";
        Supaplex.Murphy.eating = false;
        Supaplex.tilesToUpdate.push(elem);
    }
}

/*********************************************************************************************************************/
/*************************************** -- LOAD LEVEL -- ************************************************************/
/*********************************************************************************************************************/

// data: json containing 2 objects, grid and info. The grid contains hexadecimal values corresponding to the tiles
Supaplex.loadLevel = function (url, lvl) {
    Supaplex.getJson(url, lvl, Supaplex.buildLevel);
};

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
    Supaplex.levelInfo.InfotronsNeeded = parseInt(info[30], 16);
    Supaplex.Murphy = Supaplex.level[Supaplex.MurphyLocationX][Supaplex.MurphyLocationY];
    Supaplex.giveMurphySuperpowers();
    Supaplex.Murphy.directionFacing = "MurphyMovingLeft";
    Supaplex.viewport.updateViewport();
    Supaplex.loop();
    Supaplex.logic();
}

Supaplex.resetLevel = function () {
    Supaplex.levelElem.innerHTML = "";
    Supaplex.init();
}

/*********************************************************************************************************************/
/************************************************* -- EVENTS -- ******************************************************/
/*********************************************************************************************************************/

Supaplex.keyBoard = {};

//Simple function to map keycodes to strings so I don't have to remember keycodes
//key: string, name of the key.
Supaplex.keyBoard.getValue = function(key)
{
    switch(key) {
        case "escape":  return 27;
        case "left":    return 37;
        case "up":      return 38;
        case "right":   return 39;
        case "down":    return 40;
        case "space":   return 32;
        case "p":       return 80;
    }
};

// Values for the old movement system.
// TODO: Delete this
Supaplex.keyBoard.moveLeft = false;
Supaplex.keyBoard.moveUp = false;
Supaplex.keyBoard.moveRight = false;
Supaplex.keyBoard.moveDown = false;

Supaplex.keyBoard.spaceDown = false;

// key event for onKeyDown
// event: The event which was broadcast.
Supaplex.onKeyDown = function(event) {
    switch(event.keyCode) {
        case Supaplex.keyBoard.getValue("escape"):
            Supaplex.explode(Supaplex.Murphy);
            break;
        //
        case Supaplex.keyBoard.getValue("space"):
            Supaplex.keyBoard.spaceDown = true;
            break;

        case Supaplex.keyBoard.getValue("p"):
            if(Supaplex.gamePaused) {
                Supaplex.UnPauseTheGame();
            } else {
                Supaplex.PauseTheGame();
            }
            break;

        case Supaplex.keyBoard.getValue("right"):
            if(Supaplex.Murphy.moving == false && !Supaplex.GamePaused) {
                Supaplex.keyBoard.moveLeft = true;
                Supaplex.keyBoard.moving = true;
                Supaplex.Murphy.direction = "right";
                Supaplex.Murphy.directionFacing = "MurphyMovingRight";
            }
            break;


        case Supaplex.keyBoard.getValue("up"):
            if(Supaplex.Murphy.moving == false && !Supaplex.GamePaused) {
                Supaplex.keyBoard.moveUp = true;
                Supaplex.keyBoard.moving = true;
                Supaplex.Murphy.direction = "up";
            }
            break;

        case Supaplex.keyBoard.getValue("left"):
            if(Supaplex.Murphy.moving == false && !Supaplex.GamePaused) {
                Supaplex.keyBoard.moveRight = true;
                Supaplex.keyBoard.moving = true;
                Supaplex.Murphy.direction = "left";
                Supaplex.Murphy.directionFacing = "MurphyMovingLeft";
            }
            break;

        case Supaplex.keyBoard.getValue("down"):
            if(Supaplex.Murphy.moving == false && !Supaplex.GamePaused) {
                Supaplex.keyBoard.moveDown = true;
                Supaplex.keyBoard.moving = true;
                Supaplex.Murphy.direction = "down";
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
    switch(event.keyCode) {
        case Supaplex.keyBoard.getValue("left"):
            if (!Supaplex.GamePaused) {
                Supaplex.keyBoard.moving = false;
            }
            break;

        case Supaplex.keyBoard.getValue("space"):
            Supaplex.keyBoard.spaceDown = false;
            break;

        case Supaplex.keyBoard.getValue("up"):
            if (!Supaplex.GamePaused) {
                Supaplex.keyBoard.moving = false;
            }
            break;

            case Supaplex.keyBoard.getValue("right"):
            if (!Supaplex.GamePaused) {
                Supaplex.keyBoard.moving = false;
            }
            break;

        case Supaplex.keyBoard.getValue("down"):
            if (!Supaplex.GamePaused) {
                Supaplex.keyBoard.moving = false;
            }
            break;
    }
}

// Get's called upon switching to and from this tab.
Supaplex.handleVisibilityChange = function () {
    if(document.hidden) {
        Supaplex.PauseTheGame();
    } else {
        Supaplex.UnPauseTheGame();
    }
}

/*********************************************************************************************************************/
/******************************************** -- Logic -- ************************************************************/
/*********************************************************************************************************************/

//The main logic function. For now this gets called by requestAnimationFrame.
//Since I'm still building the main structure, I'll rework this into seperate functions later on.
Supaplex.logic = function() {
    //This entire section just processes all of the movement our hero does.
    if(Supaplex.keyBoard.spaceDown && !Supaplex.Murphy.moving && Supaplex.keyBoard.moving && !Supaplex.Murphy.eating) {
        neighbour = Supaplex.Murphy.getNeighbour(Supaplex.Murphy.direction);
        if(neighbour.type == "base" || neighbour.type == "infotron") {
            Supaplex.Murphy.eating = true;
            console.log("I should eat now");
            Supaplex.Murphy.eat(neighbour);
            Supaplex.Murphy.classes = "MurphyEating" + Supaplex.Murphy.direction + " tile";
            Supaplex.tilesToUpdate.push(Supaplex.Murphy);
        }
    }
    if(Supaplex.keyBoard.moving && !Supaplex.Murphy.eating && !Supaplex.keyBoard.spaceDown) {
        if(!Supaplex.Murphy.moving) {
            var neighbour = Supaplex.getNeighbour(Supaplex.Murphy.locationY, Supaplex.Murphy.locationX, Supaplex.Murphy.direction);
            if((neighbour.type == "empty" || neighbour.type == "base" || neighbour.type == "infotron") && !neighbour.reserved) {
                Supaplex.Murphy.move(Supaplex.ANIMATION_TIMINGS.regularMove, Supaplex.Murphy.direction, Supaplex.Murphy.directionFacing);
                Supaplex.viewport.updateViewport();
                if(neighbour.type == "infotron") {
                    Supaplex.infotronsCollected++;
                }
            }
            else if (neighbour.type == "Exit") {
                if(Supaplex.infotronsCollected >= Supaplex.levelInfo.InfotronsNeeded) {
                    console.log("Good going, you won!");
                }
            }
            else if(neighbour.type == "Terminal") {
                if(Supaplex.YellowFloppies.length != 0) {
                    for(var i = Supaplex.YellowFloppies.length - 1; i >= 0; i--) {
                        Supaplex.explode(Supaplex.YellowFloppies[i]);
                        Supaplex.YellowFloppies.pop();
                    }
                }
            }

        }
    }
    if(Supaplex.Murphy.moving == true) {
        Supaplex.Murphy.move(Supaplex.ANIMATION_TIMINGS.regularMove, Supaplex.Murphy.direction, + Supaplex.Murphy.directionFacing)
        Supaplex.viewport.updateViewport()
        Supaplex.Murphy.checkForLastMove(Supaplex.Murphy.direction);
    }
    //We'll iterate over evey Tile in the level, and processes it accordingly. Most tiles will just get ignored.
    //I should really
    for (var i = 0; i < Supaplex.level.length; i++) {
        for (var j = 0; j < Supaplex.level[i].length; j++) {
            var currentTile = Supaplex.level[i][j];
            if (currentTile.type == "zonk" || currentTile.type == "infotron") {
                var aboveZonk = Supaplex.getNeighbour(currentTile.locationY, currentTile.locationX, "up");
                var allNeighbours = currentTile.getAllNeighbours();
                if (currentTile.moving == false) {
                    if (allNeighbours.bottom.type == "empty" && (!allNeighbours.bottom.reserved || allNeighbours.bottom.reservedBy == currentTile)) {
                        currentTile.move(Supaplex.ANIMATION_TIMINGS.regularMove, "down", currentTile.type);
                        currentTile.animationTiming = Supaplex.ANIMATION_TIMINGS.regularMove;
                        allNeighbours.bottom.reserved = true;
                        allNeighbours.bottom.reservedBy = currentTile;
                        currentTile.direction = "down";
                    }
                    else if ((allNeighbours.bottom.type == "zonk" || allNeighbours.bottom.type == "infotron" || allNeighbours.bottom.type == "RAM" ||
                    allNeighbours.bottom.type == "RAM-top" || allNeighbours.bottom.type == "RAM-left" || allNeighbours.bottom.type == "RAM-right" ||
                    allNeighbours.bottom.type == "RAM-bottom" || allNeighbours.bottom.type == "RAM-regular") && allNeighbours.bottom.moving == false) {
                        if (allNeighbours.bottomLeft.type == "empty" && allNeighbours.left.reserved == false && allNeighbours.left.type == "empty") {
                            currentTile.move(Supaplex.ANIMATION_TIMINGS.falling, "left", currentTile.type + "FallingLeft");
                            currentTile.$elem.addEventListener("animationend", Supaplex.animationEndCallback(currentTile, currentTile.type), false);
                            allNeighbours.bottomLeft.reserved = true;
                            allNeighbours.bottomLeft.reservedBy = currentTile;
                            allNeighbours.left.reserved = true;
                            currentTile.direction = "left";
                            currentTile.animationTiming = Supaplex.ANIMATION_TIMINGS.falling;
                            currentTile.animationClass = "ZonkFallingLeft";
                        }
                        else if (allNeighbours.bottomRight.type == "empty" && allNeighbours.right.reserved == false && allNeighbours.right.type == "empty") {
                            currentTile.move(Supaplex.ANIMATION_TIMINGS.falling, "right", currentTile.type + "FallingRight");
                            currentTile.$elem.addEventListener("animationend", Supaplex.animationEndCallback(currentTile, currentTile.type), false);
                            allNeighbours.bottomRight.reserved = true;
                            allNeighbours.bottomRight.reservedBy = currentTile;
                            allNeighbours.right.reserved = true;
                            currentTile.direction = "right";
                            currentTile.animationTiming = Supaplex.ANIMATION_TIMINGS.falling;
                            currentTile.animationClass = "ZonkFallingRight";
                        }

                    }
                }
                else {
                    currentTile.move(currentTile.animationTiming, currentTile.direction, currentTile.animationClass);
                    currentTile.checkForLastMove(currentTile.direction);
                }
            }
        }
    }
    Supaplex.lastLogicUpdate = performance.now();
    return;
    //Supaplex.draw();
}

Supaplex.PauseTheGame = function () {
    cancelAnimationFrame(Supaplex.AnimationFrameID);
    Supaplex.Murphy.$elem.style.webkitAnimationPlayState = "paused";
    Supaplex.gamePaused = true;
}

Supaplex.UnPauseTheGame = function () {
    requestAnimationFrame(Supaplex.loop);
    Supaplex.Murphy.$elem.style.webkitAnimationPlayState = "running";
    Supaplex.gamePaused = false;
}

/*********************************************************************************************************************/
/********************************************** -- Draw -- ************************************************************/
/*********************************************************************************************************************/

Supaplex.draw = function() {
    for(var i = Supaplex.tilesToUpdate.length - 1; i >= 0; i--) {
        Supaplex.tilesToUpdate[i].measure();
    }
    for(var i = Supaplex.tilesToUpdate.length - 1; i >= 0; i--) {
        var element = Supaplex.tilesToUpdate[i];
        element.draw();
        Supaplex.tilesToUpdate.pop();
    }
    //Supaplex.viewport.updateViewport();
    return;
}

/*********************************************************************************************************************/
/**************************************** -- Main Loop -- ************************************************************/
/*********************************************************************************************************************/

Supaplex.loop = function() {
    //Supaplex.TimeDifference = (new Date().getTime() - Supaplex.STARTTIME) - Supaplex.ElapsedTime;
    //Supaplex.ElapsedTime += 1000 / Supaplex.FPS;
    //Supaplex.loopCounter += 1;
    Supaplex.logic();
    Supaplex.draw();
    Supaplex.lastLogicUpdate = performance.now();
    Supaplex.AnimationFrameID = requestAnimationFrame(Supaplex.loop);
    //Supaplex.MainLoop = setTimeout(Supaplex.loop, 1000 / Supaplex.FPS - Supaplex.TimeDifference);
};
