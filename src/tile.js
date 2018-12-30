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