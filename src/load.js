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
    Supaplex.levelInfo.gravity = Boolean(info[4]);
    Supaplex.levelInfo.title = Supaplex.getTitle(info);
    Supaplex.Murphy = Supaplex.level[Supaplex.MurphyLocationX][Supaplex.MurphyLocationY];
    Supaplex.giveMurphySuperpowers();
    Supaplex.Murphy.direction = "Left";
    Supaplex.Murphy.directionFacing = "Left";
    Supaplex.Murphy.isPushing = false;
    Supaplex.loop();
    Supaplex.logic();
}

Supaplex.getTitle = function (data) {
    var title = "";
    for(var i = 5; i < 28; i++) {
        title += String.fromCharCode(data[i]);
    }
    return title;
}

// Returns a Tile object based on the level data for that tile.
// data: string, corresponds to a hexadecimal number
// i: int, the Y position of the current tile
// j: int, the X position of the current tile
Supaplex.getTile = function(data, i, j){
    var tile = Object.create(Tile)
    //Tile (ID, locationX, locationY, type, exploding, bomb, movable, active, position.x, position.y);
    if(i == 21 && j == 3) console.log(data.toString(16));
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

        case "a":
            tile.init(j, i, "PortDown", true, false, false, true, "PortDown");
            break;

        case "b":
            tile.init(j, i, "PortLeft", true, false, false, true, "PortLeft");
            break;

        case "c":
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

        case "19":
            tile.init(j, i, "Bug", true, false, false, true, "BugAnimation");
            tile.bugActive = true;
            tile.bugTimer = 0;
            tile.timeSinceLastBug = 0;
            break;

        case "1a": //RAM horizontal, left part
            tile.init(j, i, "RAMLeft", true, false, false, true, "RAMLeft");
            break;
        case "1b": //RAM horizontal, right part
            tile.init(j, i, "RAMRight", true, false, false, true, "RAMRight");
            break;
        case "1f":
            tile.init(j, i, "Hardware", false, false, false, true, "Hardware4");
            break;
        case "20":
            tile.init(j, i, "Hardware", false, false, false, true, "Hardware5");
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