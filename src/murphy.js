/*****************************************-- SPECIAL MURPHY SUPERPOWERS -- *******************************************/
/*********************************************************************************************************************/
Supaplex.giveMurphySuperpowers = function() {
    Supaplex.Murphy.eat = function(tile) {
        tile.sprite = Supaplex.SPRITES["Eat" + tile.type + "Animation"];
        Supaplex.Murphy.wait(150, Supaplex.Murphy.measure, []);
    };

    Supaplex.Murphy.direction = "Left";
    Supaplex.Murphy.drawFirst = false;

    Supaplex.Murphy.pushing = function(neighbour, direction) {
        neighbour.direction = direction;
        neighbour.beingPushed = true;
        neighbour.animationTiming = Supaplex.ANIMATION_TIMINGS.pushing;
        switch(neighbour.type) {
            case "Zonk":
                neighbour.animationClass = "Zonk";
                neighbour.sprite = Supaplex.SPRITES.Zonk;
                neighbour.move(Supaplex.ANIMATION_TIMINGS.pushing, neighbour.direction, "ZonkPushed" + direction, "fallingEnd");
                break;
            case "FloppyYellow":
                neighbour.move(Supaplex.ANIMATION_TIMINGS.pushing, neighbour.direction, neighbour.type, "fallingEnd");
                break;
        }
        Supaplex.Murphy.sprite = Supaplex.SPRITES["MurphyPush" + direction];
        Supaplex.Murphy.move(Supaplex.ANIMATION_TIMINGS.pushing, Supaplex.Murphy.direction, "MurphyPush" + Supaplex.Murphy.directionFacing, "pushChangelocation");
    };

    Supaplex.Murphy.MurphyMoveEnd = function() {

    }

    Supaplex.Murphy.MurphyEnd = function() {
        Supaplex.Murphy.sprite = Supaplex.SPRITES.Empty;
        console.log("you won the game!");
    };

    Supaplex.Murphy.exitPort = function(neighbour, direction) {
        Supaplex.Murphy.amountMoved = 0;
        Supaplex.Murphy.moveEndCallback = "portChangeLocation";
        Supaplex.Murphy.moving = false;
        debugger;
        Supaplex.Murphy.move(Supaplex.ANIMATION_TIMINGS.port, direction, Supaplex.Murphy.animationClass, "portChangeLocation");
        return;
    }

    Supaplex.Murphy.portChangeLocation = function(neighbour, direction) {
        var originalX = Supaplex.Murphy.locationX,
            originalY = Supaplex.Murphy.locationY,
            nextNeighbour = neighbour.getNeighbour(direction);
        debugger;
        Supaplex.level[nextNeighbour.locationY][nextNeighbour.locationX] = Supaplex.Murphy;
        Supaplex.Murphy.drawFirst = false;
        Supaplex.Murphy.locationX = nextNeighbour.locationX;
        Supaplex.Murphy.locationY = nextNeighbour.locationY;
        Supaplex.level[originalY][originalX] = nextNeighbour;
        nextNeighbour.type = "Empty";
        nextNeighbour.classes = "empty tile";
        nextNeighbour.sprite = Supaplex.SPRITES["Empty"];
        nextNeighbour.locationX = originalX;
        nextNeighbour.locationY = originalY;
        nextNeighbour.position.x = 32 + ((nextNeighbour.locationX - 1) * Supaplex.TILESIZE);
        nextNeighbour.position.y = 32 + ((nextNeighbour.locationY - 1) * Supaplex.TILESIZE);
        Supaplex.Murphy.position.x = 32 + ((Supaplex.Murphy.locationX - 1) * Supaplex.TILESIZE);
        Supaplex.Murphy.position.y = 32 + ((Supaplex.Murphy.locationY - 1) * Supaplex.TILESIZE);
        nextNeighbour.reserved = false;
    }

    Supaplex.Murphy.nextDirection = "Left";
};