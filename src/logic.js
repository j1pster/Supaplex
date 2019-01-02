//The main logic function. For now this gets called by requestAnimationFrame.
//Since I'm still building the main structure, I'll rework this into seperate functions later on.
Supaplex.logic = function() {
    Supaplex.processMurphy();

    //We'll iterate over evey Tile in the level, and process it accordingly. Most tiles will just get ignored.
    //I should really move this into seperate functions.
    var l1 = Supaplex.level.length;
    for (var i = 0; i < l1; i++) {
        var l2 = Supaplex.level[i].length;
        for (var j = 0; j < l2; j++) {
            var currentTile = Supaplex.level[i][j];
            if(currentTile.waiting) {
                currentTile.wait(currentTile.waitingTime, currentTile.waitingCallback, currentTile.waitingArgs);
                continue;
            }
            switch(currentTile.type) {
                case "Zonk": case "Infotron":
                    Supaplex.processZonkOrInfotron(currentTile);
                    break;
                case "FloppyOrange":
                    Supaplex.processOrangeFloppy(currentTile);
                    break;
                case "FloppyYellow":
                    Supaplex.processYellowFloppy(currentTile);
                    break;
                case "Bug":
                    Supaplex.processBug(currentTile);
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
    if(Supaplex.levelInfo.gravity && !Supaplex.Murphy.moving) {
        if(Supaplex.checkIfMurphyShouldFall()) {
            Supaplex.makeTileFall(Supaplex.Murphy, Supaplex.Murphy.getNeighbour("Down"));
        }
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
                case "Bug":
                    if(!neighbour.bugActive) {
                        Supaplex.processRegularMove(neighbour);
                    } else {
                        Supaplex.explode(neighbour);
                    }
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
                case "FloppyYellow":
                    var nextNeighbour = neighbour.getNeighbour(Supaplex.Murphy.direction);
                    if(nextNeighbour.type == "Empty" && !neighbour.falling && !nextNeighbour.reserved) {
                        Supaplex.processPush(neighbour, nextNeighbour);
                    }
                    break;
                case "PortUp": case "PortRight": case "PortDown": case "PortLeft":
                    Supaplex.processPort(neighbour);
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
        if(neighbour.type == "Infotron" && neighbour.moving) {
            return false;
        }
        if(neighbour.type == "Base" || neighbour.type == "Infotron" || neighbour.type == "Bug") {
            return neighbour;
        }
    }
    return false;
}

Supaplex.MurphyEatNeighbour = function(neighbour) {
    if(neighbour.type == "Bug" && neighbour.bugActive) {
        Supaplex.explode(neighbour);
        return;
    }
    Supaplex.Murphy.eating = true;
    Supaplex.Murphy.eat(neighbour);
    Supaplex.Murphy.currentSpriteTile = 0;
    Supaplex.Murphy.sprite = Supaplex.SPRITES["MurphyEat" + Supaplex.Murphy.direction];
    if(neighbour.type == "Infotron") {
        Supaplex.infotronsCollected += 1;
    }
    return;
}

Supaplex.checkIfMurphyShouldFall = function() {
    var neighbours = Supaplex.Murphy.getAllNeighbours();
    var direction = Supaplex.Murphy.direction;
    if(direction === "Down") direction = "Bottom";
    if(direction === "Up") direction = "Top";
    console.log(Supaplex.keyBoard[Supaplex.Murphy.direction], neighbours[direction].type);
    if(Supaplex.keyBoard[Supaplex.Murphy.direction].down && (neighbours[direction].type == "Base"
        || neighbours[direction].type == "Infotron")) {
            return false;
    }
    if(neighbours.Bottom.type == "Empty") {
        return true;
    }
    return false;
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

Supaplex.processPort = function(neighbour) {
    if(neighbour.type.indexOf(Supaplex.Murphy.direction) == -1) {
        return;
    }
    var nextNeighbour = neighbour.getNeighbour(Supaplex.Murphy.direction);
    if(nextNeighbour.type == "Empty") {
        Supaplex.moveThroughPort(neighbour, nextNeighbour);
    }
    return;
}

Supaplex.processBug = function(tile) {
    if(!tile.bugActive) {
        tile.timeSinceLastBug += Supaplex.fpsTimer;
        if(tile.timeSinceLastBug >= tile.bugTimer) {
            tile.bugActive = true;
            tile.sprite = Supaplex.SPRITES["BugAnimation"];
        }
    }
}

Supaplex.moveThroughPort = function(neighbour, nextNeighbour) {
    nextNeighbour.reserved = true;
    nextNeighbour.reservedBy = Supaplex.Murphy;
    Supaplex.Murphy.drawFirst = true;
    Supaplex.Murphy.move(Supaplex.ANIMATION_TIMINGS.port, Supaplex.Murphy.direction, Supaplex.Murphy.animationClass, "exitPort");
}

Supaplex.processZonkOrInfotron = function(tile) {
    if (!tile.moving && !tile.waiting) {
        var allNeighbours = tile.getAllNeighbours();
        if (Supaplex.canFallDown(tile, allNeighbours.Bottom)) {
            Supaplex.makeTileFall(tile, allNeighbours.Bottom);
            return;
        }
        var direction;
        if(direction = Supaplex.canMoveSideways(tile, allNeighbours)) {
            if(direction == "Left") {
                var bottom = allNeighbours.BottomLeft,
                side = allNeighbours.Left;
            } else {
                var bottom = allNeighbours.BottomRight,
                side = allNeighbours.Right;
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

Supaplex.processOrangeFloppy = function(tile) {
    if(!tile.moving) {
        var neighbour = tile.getNeighbour("Down");
        if(Supaplex.canFallDown(tile, neighbour)) {
            Supaplex.makeTileFall(tile, neighbour);
        }
    } else {
        tile.move(tile.animationTiming, tile.direction, tile.animationClass, tile.moveEndCallback, tile.moveAmount);
        if(tile.checkForLastMove(tile.direction, tile)) {
            Supaplex.checkIfTileIsFallingOnSomething(tile);
        }
    }
}

Supaplex.processYellowFloppy = function(tile) {
    if(tile.moving) {
        tile.move(tile.animationTiming, tile.direction, tile.animationClass, tile.moveEndCallback, tile.moveAmount);
        tile.checkForLastMove(tile.direction, tile);
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
    var animClass = tile.type;
    if(tile.type == "Murphy") animClass = tile.animationClass;
    tile.move(Supaplex.ANIMATION_TIMINGS.regularMove, "Down", animClass, "changeLocation");
    tile.animationTiming = Supaplex.ANIMATION_TIMINGS.regularMove;
    tile.direction = "Down";
    tile.falling = true;
    neighbour.reservedBy = tile;
    neighbour.reserved = true;
}

Supaplex.canMoveSideways = function(tile, neighbours) {
    var bottom = neighbours.Bottom;
    if(bottom.moving) {
        return false;
    }
    var names = "ZonkInfotronRAMTopRAMLeftRAMRightRAMBottomRAMRegular";
    if(names.indexOf(bottom.type) == -1) {
        return false;
    }
    if(Supaplex.checkDirection(neighbours.BottomLeft, neighbours.Left, neighbours.TopLeft)) {
        return "Left";
    }
    if(Supaplex.checkDirection(neighbours.BottomRight, neighbours.Right, neighbours.TopRight)) {
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
    var neighbour = tile.getNeighbour("Down");
    if(Supaplex.MurphyGetsHit(tile, neighbour)) {
        Supaplex.explode(Supaplex.Murphy);
    }
    if(neighbour.type == "FloppyOrange") {
        Supaplex.explode(neighbour);
    }
}

Supaplex.MurphyGetsHit = function(tile, neighbour) {
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