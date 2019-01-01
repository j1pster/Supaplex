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
Supaplex.explode = function(elem) {
    elem.sprite = Supaplex.SPRITES.Explosion;
    elem.type = "Explosion";
    elem.currentSpriteTile = 0;
    elem.bomb = false;
    var neighbours = elem.getAllNeighbours();
    for(var key in neighbours) {
        var currentElement = neighbours[key];
        if (currentElement.exploding) {
            currentElement.sprite = Supaplex.SPRITES.Explosion;
            currentElement.type = "Explosion";
            currentElement.currentSpriteTile = 0;
            if(currentElement.bomb) {
                currentElement.bomb = false;
                currentElement.wait(250, Supaplex.explode, [currentElement]);
            }
        }
    }
};
