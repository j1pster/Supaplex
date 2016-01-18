/*********************************************************************************************************************/
/********************************************* -- INIT -- ************************************************************/
/*********************************************************************************************************************/

var Supaplex = {};

Supaplex.level = []; //Contains every tile in a 2-dimensional array.
Supaplex.Scissors = []; // Dunno if i'm going to use this yet
Supaplex.TilesToUpdate = [];
Supaplex.Murphy = {}; // Our hero!
Supaplex.MurphyLocationX;
Supaplex.MurphyLocationY;
Supaplex.Explosions = []; // Because there should always be explosions, just ask michael bay
Supaplex.ExplosionCount = 0; // What was this for again?
Supaplex.FPS = 32.0; // Usefull if people with crappy pc's can't handle it?
Supaplex.ElapsedTime = 0; // Allright, maybe I'm using the times for something else.
Supaplex.Zonks = []; // Same as scissors, dunno if i'm going to use it yet.
Supaplex.MainLoop;
Supaplex.GamePaused = false; //Set to true if the game is paused.
Supaplex.moveCounter = 0; // Also debug shit

// let's start this thing.
window.onload = function(){
    Supaplex.getJson(Supaplex.LEVELURL, 1);
    Supaplex.loop();
    document.addEventListener("keydown", Supaplex.onKeyDown);
    document.addEventListener("keyup", Supaplex.onKeyUp);
    document.addEventListener("visibilitychange", Supaplex.handleVisibilityChange, false);
};

/*********************************************************************************************************************/
/************************************************** -- CONSTANTS -- **************************************************/
/*********************************************************************************************************************/

Supaplex.LEVELURL = "../Supaplex/open.php"; //php script to read in the original Supaplex level file (levels.dat)
Supaplex.TILESIZE = 64.0; // As for now, all tiles are 64 x 64 pixels.
Supaplex.STARTTIME = new Date().getTime(); // Used to see how aaddicted you are.

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
    zonkSideFall: 125,
    explosion: 200,
    pushing: 333
}

/*********************************************************************************************************************/
/************************************************ -- TILE OBJECT -- **************************************************/
/*********************************************************************************************************************/

function Tile(ID, locationX, locationY, type, exploding, bomb, movable, active, positionX, positionY) {
    this.ID = ID;

    // What's the current location in the level matrix?
    this.locationY = locationY; // the Y location, corresponds to one of 24 arrays in the supaplex.level array.
    this.locationX = locationX;// the X location, correponds to one of 60 tiles in Supaplex.level[locationY].
    this.type = type; // What the fuck are we dealing with here?
    this.classes = this.type + " tile"; // used for drawing purposes
    this.exploding = exploding; // Can the element be blown up
    this.bomb = bomb; // Can the object explode note: if set to true every active tile will explode.
    this.movable = movable; // Can we push this thing?
    this.moving = false;
    this.direction = "";
    this.active = active; // Can we actually do something with it?
    //Used to save the current left and top positions
    this.position = {}; // Nothing to see here, move on.
    this.position.x = positionX;
    this.position.y = positionY;
    //Stuff for moving
    this.amountMoved = 0; // How many frames/pixels has it moved (probably a horrible idea to do it like this)
    this.firstmove = false; // Since I updated the draw function I could probably deprecate this.
    // Move this Tile
    // time: int, how long should the movement take in milliseconds
    // direction: string, corresponds to one of the directions in Supaplex.DIRECTIONS
    // spriteClass: Which sprite do we want to use for this movement?
    this.move = function(time, direction, spriteClass){
        Supaplex.TilesToUpdate.push(this);
        if(this.firstmove == false) {
            this.moving = true;
            this.firstmove = true;
            this.classes = "tile " + spriteClass;
        }
        amountToMove = Supaplex.TILESIZE / (time / (1000 / Supaplex.FPS));
        if(amountToMove >= Supaplex.TILESIZE - this.amountMoved) {
            //amountToMove = Supaplex.TILESIZE - this.amountMoved;
        }
        this.position.x += amountToMove * Supaplex.DIRECTIONS[direction].x;
        this.position.y += amountToMove * Supaplex.DIRECTIONS[direction].y;
        this.amountMoved += amountToMove;
        return;
    }
    this.checkForLastMove = function() {
        // TODO
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

// Get all 8 surrounding Tiles
// elem: Tile,
Supaplex.get8Squares = function(elem) {
    var list = [];
    for (var i = elem.locationY - 1; i < elem.locationY + 2; i++) {
        for (var j = elem.locationX - 1; j < elem.locationX + 2; j++) {
            list.push(Supaplex.level[i][j]);
        }
    }
    return list;
};

// Perform a request to my open.php script, which will extract level data from the original levels.dat file
// url: string, the url where the open.php script is located.
// lvl: int, the number of the level which you want to load.
Supaplex.getJson = function(url, lvl) {
    var xobj = new XMLHttpRequest();
    var params = "?level=" + lvl;
    xobj.open('GET', url + params, true);

    xobj.onreadystatechange = function(){
        if(xobj.readyState == 4 && xobj.status == "200") {
            data = JSON.parse(xobj.responseText);
            Supaplex.loadLevel(data);
        }
    };
    xobj.send();
};

// Returns a Tile object based on the level data for that tile.
// data: string, corresponds to a hexadecimal number
// i: int, the Y position of the current tile
// j: int, the X position of the current tile
Supaplex.getTile = function(data, i, j){
    var tile, positionY = i * 64, positionX = j * 64;
    if(i > 0) {
        positionY -= 32;
    }
    if(j > 0) {
        positionX -= 32;
    }
    //Tile (ID, locationX, locationY, type, exploding, bomb, movable, active, position.x, position.y);
    switch (data) {
        case "0":
            tile = new Tile(i + "." + j, j, i, "empty", true, false, false, true, positionX, positionY);
            break;
        case "1": //Zonk
            //Supaplex.Zonks.push({ZonkID: index2 + "." + index1, locationX: index2, locationY: index1});
            tile = new Tile(i + "." + j, j, i, "zonk", true, false, true, true, positionX, positionY);
            break;
        case "2": //Base hardware
            tile = new Tile(i + "." + j, j, i, "base", true, false, false, true, positionX, positionY);
            break;
        case "3": //Murphy
            tile = new Tile(i + "." + j, j, i, "Murphy", true, true, false, true, positionX, positionY);
            Supaplex.MurphyLocationX = i;
            Supaplex.MurphyLocationY = j;
            break;
        case "4": //Infotron
            tile = new Tile(i + "." + j, j, i, "infotron", true, false, true, true, positionX, positionY);
            break;
        case "5": //RAM-regular, pins on 4 sides
            tile = new Tile(i + "." + j, j, i, "RAM-regular", true, false, false, true, positionX, positionY);
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
            tile = new Tile(i + "." + j, j, i, wallType, false, false, false, true, positionX, positionY);
            break;

        case "1a": //RAM horizontal, left part
            tile = new Tile(i + "." + j, j, i, "RAM-left", true, false, false, true, positionX, positionY);
            break;
        case "1b": //RAM horizontal, right part
            tile = new Tile(i + "." + j, j, i, "RAM-right", true, false, false, true, positionX, positionY);
            break;

        case "26": //RAM vertical, top part
            tile = new Tile(i + "." + j, j, i, "RAM-top", true, false, false, true, positionX, positionY);
            break;
        case "27": //RAM vertical, bottom part
            tile = new Tile(i + "." + j, j, i, "RAM-bottom", true, false, false, true, positionX, positionY);
            break;
        default: //I haven't yet included all of the sprites, so for now I'll default if there's anything else then the above mentioned case.
            tile = new Tile(i + "." + j, j, i, "empty", true, false, false, true, positionX, positionY);
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
    Supaplex.TilesToUpdate.push(neighbour)
}

/*********************************************************************************************************************/
/*************************************** -- LOAD LEVEL -- ************************************************************/
/*********************************************************************************************************************/

// data: json containing 2 objects, grid and info. The grid contains hexadecimal values corresponding to the tiles
Supaplex.loadLevel = function (data) {
    Supaplex.level = [];
    grid = data.grid; //["grid"]; //Only use the Grid object in data. there's more info in the Info object that I'll use later.
    for (var i = 0; i < grid.length; i++) {
        var row = [],
            obj = grid[i];
        for (var j = 0; j < obj.length; j++) {
            row.push(Supaplex.getTile(obj[j], i, j));
        }
        Supaplex.level.push(row);
    }
    Supaplex.Murphy = Supaplex.level[Supaplex.MurphyLocationX][Supaplex.MurphyLocationY];
    Supaplex.Murphy.directionFacing = "MurphyMovingLeft";
    var myHtml = Supaplex.drawLevel();
    document.getElementById("level").innerHTML = myHtml;
};

Supaplex.drawLevel = function () {
    var tiles = "";
    for (var i = 0; i < Supaplex.level.length; i++) {
        var currentRow = Supaplex.level[i];
        for (var j = 0; j < currentRow.length; j++) {
            currentTile = Supaplex.level[i][j];
            var tileType = currentTile.type;
            if(tileType === "sides" || tileType === "topBottom" || tileType === "topRight" || tileType === "topLeft" || tileType === "bottomRight" || tileType === "bottomLeft") {
                tiles += "<div class=\"" + tileType + " edge\" id=" + currentTile.ID + " style=\" top: " + currentTile.position.y + "px; left: " + currentTile.position.x + "px;\"></div>";
            } else {
                tiles += "<div class=\"" + tileType + " tile\" id=" + currentTile.ID + " style=\" top: " + currentTile.position.y + "px; left: " + currentTile.position.x + "px;\"></div>";
            }
        }
    }
    return tiles;
};

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

// key event for onKeyDown
// event: The event which was broadcast.
Supaplex.onKeyDown = function(event) {
    switch(event.keyCode) {
        case Supaplex.keyBoard.getValue("escape"):
            Supaplex.Explode(Supaplex.level[Supaplex.Murphy.locationY][Supaplex.Murphy.locationX], 0);
            break;
        //
        case Supaplex.keyBoard.getValue("space"):
            //TODO: build in the space command.
            break;

        case Supaplex.keyBoard.getValue("p"):
            if(Supaplex.GamePaused) {
                Supaplex.UnPauseTheGame();
            } else {
                Supaplex.PauseTheGame();
            }

        case Supaplex.keyBoard.getValue("left"):
            if(Supaplex.Murphy.moving == false) {
                Supaplex.keyBoard.moveLeft = true;
                Supaplex.keyBoard.moving = true;
                Supaplex.Murphy.direction = "left";
                Supaplex.Murphy.directionFacing = "MurphyMovingLeft";
            }
            break;


        case Supaplex.keyBoard.getValue("up"):
            if(Supaplex.Murphy.moving == false) {
                Supaplex.keyBoard.moveUp = true;
                Supaplex.keyBoard.moving = true;
                Supaplex.Murphy.direction = "up";
            }
            break;

        case Supaplex.keyBoard.getValue("right"):
            if(Supaplex.Murphy.moving == false) {
                Supaplex.keyBoard.moveRight = true;
                Supaplex.keyBoard.moving = true;
                Supaplex.Murphy.direction = "right";
                Supaplex.Murphy.directionFacing = "MurphyMovingRight";
            }
            break;

        case Supaplex.keyBoard.getValue("down"):
            if(Supaplex.Murphy.moving == false) {
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
          Supaplex.keyBoard.moving = false;
          break;

      case Supaplex.keyBoard.getValue("up"):
          Supaplex.keyBoard.moving = false;
          break;

      case Supaplex.keyBoard.getValue("right"):
          Supaplex.keyBoard.moving = false;
          break;

      case Supaplex.keyBoard.getValue("down"):
          Supaplex.keyBoard.moving = false;
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
/*************************************** -- EXPLOSIONS -- ************************************************************/
/*********************************************************************************************************************/

// Make an element explode.
// elem: Tile, the element that needs to explode
// delay: int, the delay in milliseconds.
Supaplex.Explode = function(elem, delay){
    var Exploding = function () {
        Supaplex.Explosions.push(elem);
        element = document.getElementById(elem.ID);
        element.className = "Explosion";
        element.addEventListener("animationend", Supaplex.removeExplosions, false);
        var Explosions = Supaplex.get8Squares(elem);
        for (var i = 0; i < Explosions.length; i++) {
            Supaplex.ExplosionCount += 1;
            if(Explosions[i].exploding) {
                if (!Supaplex.Explosions.contains(Explosions[i])){
                    Supaplex.Explosions.push(Explosions[i]);
                    element = document.getElementById(Explosions[i].ID);
                    element.className = "Explosion";
                    element.addEventListener("animationend", Supaplex.removeExplosions, false);
                    if (Explosions[i].bomb && Explosions[i] !== elem) {
                        Supaplex.Explode(Explosions[i], Supaplex.ANIMATION_TIMINGS.explosion);
                    }
                }
            }
        }
    };
    setTimeout(Exploding, delay);
}

Supaplex.removeExplosions = function (e) {
    e.srcElement.className = "empty tile";
}

/*********************************************************************************************************************/
/******************************************** -- Logic -- ************************************************************/
/*********************************************************************************************************************/

Supaplex.logic = function() {
    if(Supaplex.keyBoard.moving == true) {
        if(Supaplex.Murphy.moving == false) {
            var neighbour = Supaplex.getNeighbour(Supaplex.Murphy.locationY, Supaplex.Murphy.locationX, Supaplex.Murphy.direction);
            if(neighbour.type == "empty" || neighbour.type == "base" || neighbour.type == "infotron") {
                Supaplex.Murphy.move(Supaplex.ANIMATION_TIMINGS.regularMove, Supaplex.Murphy.direction, Supaplex.Murphy.directionFacing);
            }
        }
    }
    if(Supaplex.Murphy.moving == true) {
        Supaplex.Murphy.move(Supaplex.ANIMATION_TIMINGS.regularMove, Supaplex.Murphy.direction, + Supaplex.Murphy.directionFacing)
        if(Math.round(Supaplex.Murphy.amountMoved) >= Supaplex.TILESIZE) {
            var neighbour = Supaplex.getNeighbour(Supaplex.Murphy.locationY, Supaplex.Murphy.locationX, Supaplex.Murphy.direction);
            Supaplex.changeLocation(Supaplex.Murphy, neighbour);
            Supaplex.Murphy.firstmove = false;
            Supaplex.Murphy.amountMoved = 0;
            Supaplex.Murphy.moving = false;
        }
    }
    for (var i = 0; i < Supaplex.level.length; i++) {
        for (var j = 0; j < Supaplex.level[i].length; j++) {
            currentTile = Supaplex.level[i][j];
            if (currentTile.type == "zonk") {
                underneathZonk = Supaplex.getNeighbour(currentTile.locationY, currentTile.locationX, "down");
                if (currentTile.moving == false) {
                    if (underneathZonk.type == "empty") {
                        currentTile.move(Supaplex.ANIMATION_TIMINGS.regularMove, "down", "zonk")
                    }
                }
                else {
                    currentTile.move(Supaplex.ANIMATION_TIMINGS.regularMove, "down", "zonk")
                    if(Math.round(currentTile.amountMoved) >= Supaplex.TILESIZE) {
                        var neighbour = Supaplex.getNeighbour(currentTile.locationY, currentTile.locationX, "down");
                        Supaplex.changeLocation(currentTile, neighbour);
                        currentTile.firstmove = false;
                        currentTile.amountMoved = 0;
                        currentTile.moving = false;
                    }
                }
            }
        }
    }
    Supaplex.draw();
}

Supaplex.PauseTheGame = function () {
    console.log("Game Paused");
    clearTimeout(Supaplex.MainLoop);
    Supaplex.GamePaused = true;
    document.addEventlistener("pausedkeydown", Supaplex.pausedKeyDown);
    document.removeEventListener("keydown", Supaplex.onKeyDown);
    document.removeEventListener("keyup", Supaplex.onKeyUp);
}

Supaplex.UnPauseTheGame = function () {
    console.log("Game Resumed");
    Supaplex.FPS = 60;
    Supaplex.loop();
    Supaplex.GamePaused = false;
    document.removeEventListener("pausedkeydown", Supaplex.pausedKeyDown);
    document.addEventListener("keydown", Supaplex.onKeyDown);
    document.addEventListener("keyup", Supaplex.onKeyUp);
}

/*********************************************************************************************************************/
/********************************************** -- Draw -- ************************************************************/
/*********************************************************************************************************************/

Supaplex.draw = function() {
    for(var i = Supaplex.TilesToUpdate.length - 1; i > 0; i--) {
        element = Supaplex.TilesToUpdate[i];
        DOMelement = document.getElementById(element.ID);
        DOMelement.style.left = element.position.x + "px";
        DOMelement.style.top = element.position.y + "px";
        if (DOMelement.className != element.classes) {
            DOMelement.className = element.classes;
        }
        Supaplex.TilesToUpdate.pop();
    }
}

/*********************************************************************************************************************/
/**************************************** -- Main Loop -- ************************************************************/
/*********************************************************************************************************************/

Supaplex.loop = function() {
  Supaplex.ElapsedTime += 1000 / Supaplex.FPS;
  Supaplex.loopCounter += 1;
  Supaplex.TimeDifference = (new Date().getTime() - Supaplex.STARTTIME) - Supaplex.ElapsedTime;
  Supaplex.logic();

  Supaplex.MainLoop = setTimeout(Supaplex.loop, 1000 / Supaplex.FPS - Supaplex.TimeDifference);
};
