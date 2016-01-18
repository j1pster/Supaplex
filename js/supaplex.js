/*********************************************************************************************************************/
/********************************************* -- INIT -- ************************************************************/
/*********************************************************************************************************************/

var Supaplex = {};

Supaplex.level = []; //

Supaplex.levelUrl = "../Supaplex/open.php"; //php script to read in the original Supaplex level file (levels.dat)

Supaplex.Scissors = []; // Dunno if i'm going to use this yet

Supaplex.TilesToUpdate = [];

Supaplex.Murphy = {}; // Our hero!
Supaplex.MurphyLocationX;
Supaplex.MurphyLocationY;

Supaplex.Explosions = []; // Because there should always be explosions, just ask michael bay

Supaplex.ExplosionCount = 0; // What was this for again?

Supaplex.FPS = 60.0; // Usefull if people with crappy pc's can't handle it?

Supaplex.StartTime = new Date().getTime(); // Used to see how aaddicted you are.
Supaplex.ElapsedTime = 0; // Allright, maybe I'm using the times for something else.

Supaplex.TILESIZE = 64.0; // As for now, all tiles are 64 x 64 pixels.

Supaplex.Zonks = []; // Same as scissors, dunno if i'm going to use it yet.

Supaplex.loopCounter = 0; // Debug shit.
Supaplex.moveCounter = 0; // Also debug shit

// let's start this thing.
window.onload = function(){
    Supaplex.getJson(Supaplex.levelUrl, 1);
    Supaplex.loop();
    document.addEventListener("keydown", Supaplex.onKeyDown);
    document.addEventListener("keyup", Supaplex.onKeyUp);
};

/*********************************************************************************************************************/
/******************************************* -- HELPER FUNCTIONS -- **************************************************/
/*********************************************************************************************************************/

function Tile(ID, locationX, locationY, type, exploding, bomb, movable, active, positionX, positionY) {
    this.ID = ID;

    // What's the current location in the level matrix?
    this.locationX = locationX; // the Y location
    this.locationY = locationY;// the X location (I should probably reverse these, but it's so much work :O)

    this.type = type; // What the fuck are we dealing with here?
    this.exploding = exploding; // Can the element be blown up
    this.bomb = true; // Can the object explode
    this.movable = movable; // Can we push this thing?
    this.moving = false;
    this.direction = "";
    this.active = active; // Can we do something with it?

    //Used to save the current left and top positions
    this.position = {}; // Nothing to see here, move on.
    this.position.x = positionX;
    this.position.y = positionY;

    //Stuff for moving
    this.amountMoved = 0; // How many frames/pixels has it moved (probably a horrible idea to do it like this)
    this.firstmove = false;
    this.move = function(time, direction, spriteClass){
        /* TODO: use this function to increment the x and y values of the moving characters
        Since movement is tilebased, the character shouldn't stop immediately when the directional key is released,
        the character should stop when it reaches the end of a tile.
        */
        Supaplex.TilesToUpdate.push(this);
        if(this.firstmove == false) {
            this.moving = true;
            this.firstmove = true;
            element = document.getElementById(this.ID);
            //element.className = "tile " + spriteClass;
        }
        amountToMove = Supaplex.TILESIZE / (time / (1000 / Supaplex.FPS));
        if(amountToMove >= Supaplex.TILESIZE - this.amountMoved) {
            console.log(amountToMove);
            console.log(this.amountMoved);
            //amountToMove = Supaplex.TILESIZE - this.amountMoved;
        }
        this.position.y += amountToMove * Supaplex.directions[direction].x;
        this.position.x += amountToMove * Supaplex.directions[direction].y;
        this.amountMoved += amountToMove;
        return;
    }
}

Array.prototype.contains = function(obj){
    for (var i = this.length - 1; i > -1; i--) {
        Supaplex.ExplosionCount += 1;
        if (this[i] === obj) {
            return true;
        }
    }
    return false;
};

Supaplex.get8Squares = function(elem) {
    var list = [];
    for (var i = elem.locationY - 1; i < elem.locationY + 2; i++) {
        for (var j = elem.locationX - 1; j < elem.locationX + 2; j++) {
            list.push(Supaplex.level[i][j]);
        }
    }
    return list;
};

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

Supaplex.getTile = function(data, i, j){
    var tile, positionX = i * 64, positionY = j * 64;
    if(i > 0) {
        positionX -= 32;
    }
    if(j > 0) {
        positionY -= 32;
    }
    //Tile (ID, locationX, locationY, type, exploding, bomb, movable, active, position.x, position.y);
    switch (data) {
        case "1": //Zonk
            //Supaplex.Zonks.push({ZonkID: index2 + "." + index1, locationX: index2, locationY: index1});
            tile = new Tile(i + "." + j, j, i, "zonk", true, false, true, true, positionX, positionY);
            break;
        case "2": //Base hardware
            tile = new Tile(i + "." + j, j, i, "base", true, true, false, true, positionX, positionY);
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

/*********************************************************************************************************************/
/*************************************** -- LOAD LEVEL -- ************************************************************/
/*********************************************************************************************************************/

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
    console.log(Supaplex.Murphy);
    Supaplex.Murphy = Supaplex.level[Supaplex.MurphyLocationX][Supaplex.MurphyLocationY];
    Supaplex.Murphy.directionFacing = "";
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
                tiles += "<div class=\"" + tileType + " edge\" id=" + currentTile.ID + " style=\" top: " + currentTile.position.x + "px; left: " + currentTile.position.y + "px;\"></div>";
            } else {
                tiles += "<div class=\"" + tileType + " tile\" id=" + currentTile.ID + " style=\" top: " + currentTile.position.x + "px; left: " + currentTile.position.y + "px;\"></div>";
            }
        }
    }
    return tiles;
};

/*********************************************************************************************************************/
/********************************************* -- KEY EVENTS -- ******************************************************/
/*********************************************************************************************************************/

Supaplex.keyBoard = {};

Supaplex.keyBoard.getValue = function(key)
{
    switch(key) {
        case "escape":  return 27;
        case "left":    return 37;
        case "up":      return 38;
        case "right":   return 39;
        case "down":    return 40;
        case "space":   return 32;
    }
};

// Object used for movement calculations.
// The x and y values are used to determine whether to increase or decrease the onscreen positions.
Supaplex.directions = {
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

// Values for the old movement system.
// TODO: Delete this
Supaplex.keyBoard.moveLeft = false;
Supaplex.keyBoard.moveUp = false;
Supaplex.keyBoard.moveRight = false;
Supaplex.keyBoard.moveDown = false;

Supaplex.Murphy.moving = false;

Supaplex.onKeyDown = function(event) {
    switch(event.keyCode) {
        case Supaplex.keyBoard.getValue("escape"):
            Supaplex.ExplodeSetup(Supaplex.level[Supaplex.Murphy.locationY][Supaplex.Murphy.locationX], 0);
            break;

        case Supaplex.keyBoard.getValue("space"):


        case Supaplex.keyBoard.getValue("left"):
            if(Supaplex.Murphy.moving == false) {
                Supaplex.keyBoard.moveLeft = true;
                Supaplex.keyBoard.moving = true;
                Supaplex.Murphy.direction = "left";
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

/*********************************************************************************************************************/
/*************************************** -- EXPLOSIONS -- ************************************************************/
/*********************************************************************************************************************/


Supaplex.ExplodeSetup = function(elem, delay){
    var test = function () {
        Supaplex.Explosions.push(elem);
        element = document.getElementById(elem.ID);
        element.className = "Explosion";
        element.addEventListener("animationend", Supaplex.removeExplosions, false);
        var Explosions = Supaplex.get8Squares(elem);
        for (var i = 0; i < Explosions.length; i++) {
            Supaplex.ExplosionCount += 1;
            console.log(Supaplex.ExplosionCount);
            if(Explosions[i].exploding) {
                if (!Supaplex.Explosions.contains(Explosions[i])){
                    Supaplex.Explosions.push(Explosions[i]);
                    element = document.getElementById(Explosions[i].ID);
                    element.className = "Explosion";
                    element.addEventListener("animationend", Supaplex.removeExplosions, false);
                    if (Explosions[i].bomb && Explosions[i] !== elem) {
                        Supaplex.ExplodeSetup(Explosions[i], 200);
                    }
                }
            }
        }
    };
    setTimeout(test, delay);
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
            Supaplex.Murphy.move(250, Supaplex.Murphy.direction, "MurphyMoving" + Supaplex.Murphy.direction);
        }
    }
    if(Supaplex.Murphy.moving == true) {
        Supaplex.Murphy.move(250, Supaplex.Murphy.direction, "MurphyMoving" + Supaplex.Murphy.direction)
        if(Math.round(Supaplex.Murphy.amountMoved) >= Supaplex.TILESIZE) {
            Supaplex.Murphy.firstmove = false;
            Supaplex.Murphy.amountMoved = 0;
            Supaplex.Murphy.moving = false;
        }
    }
    /*if(Supaplex.keyBoard.moveLeft) {
        Supaplex.level[Supaplex.Murphy.locationX][Supaplex.Murphy.locationY].position.y -= Supaplex.TILESIZE / Supaplex.FPS * 4;
        murph = document.getElementById(Supaplex.level[Supaplex.Murphy.locationX][Supaplex.Murphy.locationY].ID);
        murph.style.left = Supaplex.level[Supaplex.Murphy.locationX][Supaplex.Murphy.locationY].position.y + "px";
        murph.className = "tile MurphyMovingLeft";
        murph.addEventListener("animationiteration", Supaplex.MovementStep, false);
        console.log(murph.style.left);
    }*/
    Supaplex.draw();
}

Supaplex.MovementStep = function(e) {
    if(Supaplex.keyBoard.moving === false) {
        Supaplex.keyBoard.moveLeft = false;
        e.srcElement.className = "tile Murphy";
    }
};

/*********************************************************************************************************************/
/********************************************** -- Draw -- ************************************************************/
/*********************************************************************************************************************/

Supaplex.draw = function() {
    for(var i = Supaplex.TilesToUpdate.length - 1; i > 0; i--) {
        element = Supaplex.TilesToUpdate[i];
        DOMelement = document.getElementById(element.ID);
        DOMelement.style.left = element.position.y + "px";
        DOMelement.style.top = element.position.x + "px";
        Supaplex.TilesToUpdate.pop();
    }
}

/*********************************************************************************************************************/
/**************************************** -- Main Loop -- ************************************************************/
/*********************************************************************************************************************/

Supaplex.loop = function() {
  Supaplex.ElapsedTime += 1000 / Supaplex.FPS;
  Supaplex.loopCounter += 1;
  Supaplex.TimeDifference = (new Date().getTime() - Supaplex.StartTime) - Supaplex.ElapsedTime;
  Supaplex.logic();

  setTimeout(Supaplex.loop, 1000 / Supaplex.FPS - Supaplex.TimeDifference);
};
