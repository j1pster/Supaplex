/*****************************************-- SPECIAL MURPHY SUPERPOWERS -- *******************************************/
/*********************************************************************************************************************/
Supaplex.giveMurphySuperpowers = function() {
    Supaplex.Murphy.eat = function(tile) {
        tile.sprite = Supaplex.SPRITES["Eat" + tile.type + "Animation"];
    };

    Supaplex.Murphy.direction = "Left";

    Supaplex.Murphy.pushing = function(neighbour, direction) {
        console.log("pushing");
        neighbour.direction = direction;
        neighbour.beingPushed = true;
        neighbour.animationTiming = Supaplex.ANIMATION_TIMINGS.pushing;
        neighbour.animationClass = "Zonk";
        neighbour.sprite = Supaplex.SPRITES.Zonk;
        Supaplex.Murphy.sprite = Supaplex.SPRITES["MurphyPush" + direction];
        Supaplex.Murphy.move(Supaplex.ANIMATION_TIMINGS.pushing, Supaplex.Murphy.direction, "MurphyPush" + Supaplex.Murphy.directionFacing, "pushChangelocation");
        neighbour.move(Supaplex.ANIMATION_TIMINGS.pushing, neighbour.direction, "ZonkPushed" + direction, "fallingEnd");
        //Supaplex.Murphy.wait(Supaplex.ANIMATION_TIMINGS.waitBeforePush, Supaplex.Murphy.move, [Supaplex.ANIMATION_TIMINGS.pushing, Supaplex.Murphy.direction, "MurphyPush" + Supaplex.Murphy.directionFacing, "pushChangelocation"]);
        //neighbour.wait(Supaplex.ANIMATION_TIMINGS.waitBeforePush, neighbour.move, [Supaplex.ANIMATION_TIMINGS.pushing, neighbour.direction, "ZonkPushed" + direction, "fallingEnd"]);
    };

    Supaplex.Murphy.MurphyMoveEnd = function() {

    }

    Supaplex.Murphy.MurphyEnd = function() {
        Supaplex.Murphy.sprite = Supaplex.SPRITES.Empty;
        console.log("you won the game!");
    };

    Supaplex.Murphy.nextDirection = "";
};