/*********************************************************************************************************************/
/********************************************* -- INIT -- ************************************************************/
/*********************************************************************************************************************/

var Supaplex = {};

Supaplex.level = [];

Supaplex.Zonks = [];

Supaplex.Scissors = [];

Supaplex.Murphy = {};

Supaplex.levelUrl = "../open.php";

Supaplex.Explosions = [];

Supaplex.ExplosionCount = 0;

window.onload = function(){
    Supaplex.getJson(Supaplex.levelUrl, 1);
    document.addEventListener("keydown", Supaplex.onKeyDown);
    document.addEventListener("keyup", Supaplex.onKeyUp);
}

/*********************************************************************************************************************/
/******************************************* -- HELPER FUNCTIONS -- **************************************************/
/*********************************************************************************************************************/

function Tile(ID, locationX, locationY, type, exploding, bomb, movable, active) {
    this.ID = ID;
    this.locationX = locationX;
    this.locationY = locationY;
    this.type = type;
    this.exploding = exploding; // Can the element be blown up
    this.bomb = bomb; // Can the object explode
    this.movable = movable;
    this.active = active
}

Array.prototype.contains = function(obj){
    for (var i = this.length - 1; i > -1; i--) {
        Supaplex.ExplosionCount += 1;
        if (this[i] === obj) {
            return true;   
        }
    }
    return false;
}

Supaplex.get8Squares = function(elem) {
    var list = [];
    for (var i = elem.locationY - 1; i < elem.locationY + 2; i++) {
        for (var j = elem.locationX - 1; j < elem.locationX + 2; j++) {
            list.push(Supaplex.level[i][j]);
        }
    }
    return list
};

Supaplex.getJson = function(url, lvl) { 
    var xobj = new XMLHttpRequest();
    var params = "?level=" + lvl;
    xobj.open('GET', url + params, true);
    
    xobj.onreadystatechange = function(){
        if(xobj.readyState == 4 && xobj.status == "200") {
            data = JSON.parse(xobj.responseText);
            Supaplex.loadLevel(data)
        }
    }
    xobj.send();
}

Supaplex.getTile = function(data, i, j){
    var tile;
    switch (data) {
        case "1": //Zonk
            //Supaplex.Zonks.push({ZonkID: index2 + "." + index1, locationX: index2, locationY: index1});
            tile = new Tile(i + "." + j, j, i, "zonk", true, false, true, true);
            break;
        case "2": //Base hardware
            tile = new Tile(i + "." + j, j, i, "base", true, true, false, true);
            break;
        case "3": //Murphy
            tile = new Tile(i + "." + j, j, i, "Murphy", true, true, false, true);
            Supaplex.Murphy.locationX = i;
            Supaplex.Murphy.locationY = j;
            Supaplex.Murphy.direction = "";
            break;
        case "4": //Infotron
            tile = new Tile(i + "." + j, j, i, "infotron", true, false, true, true);
            break;
        case "5": //RAM-regular, pins on 4 sides
            tile = new Tile(i + "." + j, j, i, "RAM-regular", true, false, false, true);
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
            tile = new Tile(i + "." + j, j, i, wallType, false, false, false, true);
            break;        

        case "1a": //RAM horizontal, left part
            tile = new Tile(i + "." + j, j, i, "RAM-left", true, false, false, true);
            break;
        case "1b": //RAM horizontal, right part
            tile = new Tile(i + "." + j, j, i, "RAM-right", true, false, false, true);
            break;

        case "26": //RAM vertical, top part
            tile = new Tile(i + "." + j, j, i, "RAM-top", true, false, false, true);
            break;
        case "27": //RAM vertical, bottom part
            tile = new Tile(i + "." + j, j, i, "RAM-bottom", true, false, false, true);
            break;
        default: //I haven't yet included all of the sprites, so for now I'll default if there's anything else then the above mentioned case.
            tile = new Tile(i + "." + j, j, i, "empty", true, false, false, true);
            break;
    }
    return tile;
}

/*********************************************************************************************************************/
/*************************************** -- LOAD LEVEL -- ************************************************************/
/*********************************************************************************************************************/

Supaplex.loadLevel = function (data) {
    Supaplex.level = [];
    grid = data["grid"]; //Only use the Grid object in data. there's more info in the Info object that I'll use later. 
    for (var i = 0; i < grid.length; i++) {
        var row = [],
            obj = grid[i];
        for (var j = 0; j < obj.length; j++) {
            row.push(Supaplex.getTile(obj[j], i, j));
        }
        Supaplex.level.push(row);
    }
    var myHtml = Supaplex.drawLevel();
    document.getElementById("level").innerHTML = myHtml;
}

Supaplex.drawLevel = function () {
    var tiles = "",
        padding1 = 0;
    for (var i = 0; i < Supaplex.level.length; i++) {
        if(i > 0) {
            padding1 = 32;
        }
        var currentRow = Supaplex.level[i],
            padding2 = 0,
            topPx = i * 64 - padding1;
        for (var j = 0; j < currentRow.length; j++) {
            if(j > 0){
                padding2 = 32;
            }
            var leftPx = j * 64 - padding2;
            var tileType = Supaplex.level[i][j].type;
            if(tileType === "sides" || tileType === "topBottom" || tileType === "topRight" || tileType === "topLeft" || tileType === "bottomRight" || tileType === "bottomLeft") {
                tiles += "<div class=\"" + Supaplex.level[i][j].type + " edge\" id=" + Supaplex.level[i][j].ID + " style=\" top: " + topPx + "px; left: " + leftPx + "px;\"></div>";
            } else {
                tiles += "<div class=\"" + Supaplex.level[i][j].type + " tile\" id=" + Supaplex.level[i][j].ID + " style=\" top: " + topPx + "px; left: " + leftPx + "px;\"></div>";
            }
        }
    }
    return tiles;
};

/*********************************************************************************************************************/
/********************************************* -- KEY EVENTS -- ******************************************************/
/*********************************************************************************************************************/

Supaplex.onKeyDown = function(event) {
    var k = event.keyCode;
    if(k == 27) {
        Supaplex.ExplodeSetup(Supaplex.level[Supaplex.Murphy.locationX][Supaplex.Murphy.locationY], 0);
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
    }
    setTimeout(test, delay);
}

Supaplex.removeExplosions = function (e) {
    e.srcElement.className = "empty tile"; 
}