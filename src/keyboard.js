Supaplex.keyBoard = {
    Down: {down: false, direction: "Down"},
    Left: {down: false, direction: "Left", directionFacing: "Left"},
    Right: {down: false, direction: "Right", directionFacing: "Right"},
    Up: {down: false, direction: "Up"},
    space: {down: false}
};

//Simple function to map keycodes to strings so I don't have to remember keycodes
//key: string, name of the key.
Supaplex.keyBoard.getValue = function(key)
{
    switch(key) {
        case "escape":  return 27;
        case "Left":    return 37;
        case "Up":      return 38;
        case "Right":   return 39;
        case "Down":    return 40;
        case "space":   return 32;
        case "p":       return 80;
    }
};

Supaplex.keyBoard.getKey = function(keycode) {
    switch(keycode) {
        case 27: return "escape";
        case 37: return "Left";
        case 38: return "Up";
        case 39: return "Right";
        case 40: return "Down";
        case 32: return "space";
        case 80: return "p";
    }
}

// Values for the old movement system.
// TODO: Delete this
Supaplex.keyBoard.moveLeft = false;
Supaplex.keyBoard.moveUp = false;
Supaplex.keyBoard.moveRight = false;
Supaplex.keyBoard.moveDown = false;

Supaplex.keyBoard.spaceDown = false;

Supaplex.keyBoard.anyKeyDown = function() {
    return !(!Supaplex.keyBoard.Left.down && !Supaplex.keyBoard.Up.down && !Supaplex.keyBoard.Right.down && !Supaplex.keyBoard.Down.down);
}

// key event for onKeyDown
// event: The event which was broadcast.
Supaplex.onKeyDown = function(event) {
    // console.log("Key down: " + event.keyCode);
    var value = Supaplex.keyBoard.getKey(event.keyCode);
    var key = Supaplex.keyBoard[value];
    if(key) {
        if(!key.down) {
            key.down = true;
            if(key.direction) {
                Supaplex.Murphy.nextDirection = key.direction;
            }
            if(key.directionFacing) {
                Supaplex.Murphy.directionFacing = key.directionFacing;
            }
        }
        if(value === "Left" || value === "Right" || value === "Up" || value === "Down") {
            Supaplex.keyBoard.moving = true;
        }
    }
    switch(event.keyCode) {
        case Supaplex.keyBoard.getValue("escape"):
            Supaplex.explode(Supaplex.Murphy);
            Supaplex.resetLevel();
            // document.removeEventListener('keydown', Supaplex.onKeyDown);
            break;

        case Supaplex.keyBoard.getValue("p"):
            if(Supaplex.gamePaused) {
                Supaplex.UnPauseTheGame();
            } else {
                Supaplex.PauseTheGame();
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
    // console.log("Key up: " + event.keyCode);
    var value = Supaplex.keyBoard.getKey(event.keyCode);
    var key = Supaplex.keyBoard[value];
    if(key) {
        key.down = false;
    }
    if(!Supaplex.keyBoard.anyKeyDown()) {
        Supaplex.keyBoard.moving = false;
    }
}