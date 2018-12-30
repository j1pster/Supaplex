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