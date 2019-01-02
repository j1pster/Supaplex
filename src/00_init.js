'use strict'
/*********************************************************************************************************************/
/********************************************* -- INIT -- ************************************************************/
/*********************************************************************************************************************/

var Supaplex = {};

/*********************************************************************************************************************/
/************************************************** -- CONSTANTS -- **************************************************/
/*********************************************************************************************************************/

Supaplex.LEVELURL = "open.php"; //php script to read in the original Supaplex level file (levels.dat)
Supaplex.TILESIZE = 64; // As for now, all tiles are 64 x 64 pixels.

// Object used for movement calculations.
// The x and y values are used to determine whether to increase or decrease the onscreen positions.
Supaplex.DIRECTIONS = {
    Left: { x: -1, y: 0 },
    Up: { x: 0, y: -1 },
    Right: { x: 1, y: 0 },
    Down: { x: 0, y: 1 }
};

// Object containing the timings for different animations.
// These timings are based on timings in the original Supaplex game but may be a bit off.
Supaplex.ANIMATION_TIMINGS = {
    regularMove: 150,
    port: 50,
    eating: 200,
    falling: 200,
    explosion: 500,
    pushing: 150,
    waitBeforePush: 100,
    terminalGreen: 8000,
    terminalGreenFast: 2000,
    terminalRed: 4000
};

Supaplex.HE = 24;
Supaplex.WI = 60;

Supaplex.init = function () {
    Supaplex.level = []; //Contains every tile in a 2-dimensional array

    Supaplex.tilesToUpdate = [];
    Supaplex.Scissors = []; // Dunno if i'm going to use this yet
    Supaplex.Murphy = {}; // Our hero!
    Supaplex.Murphy.eating = false;
    Supaplex.MurphyLocationX;
    Supaplex.MurphyLocationY;
    Supaplex.Explosions = []; // Because there should always be explosions, just ask michael bay
    Supaplex.ExplosionCount = 0; // What was this for again?
    Supaplex.lastLogicUpdate = 0;
    Supaplex.fpsCounter = 0;
    Supaplex.fpsTimer = 0;
    Supaplex.FPS = 60;
    Supaplex.fpsTimerElem = document.getElementById("fpsTimer");
    Supaplex.ElapsedTime = 0; // Allright, maybe I'm using the times for something else.
    Supaplex.levelInfo = {};
    Supaplex.Zonks = []; // Same as scissors, dunno if i'm going to use it yet.
    Supaplex.YellowFloppies = [];
    Supaplex.infotronsCollected = 0;
    Supaplex.MainLoop;
    Supaplex.gamePaused = false; //Set to true if the game is paused.
    Supaplex.justUnPaused = false; //debuggin stuff....
    Supaplex.moveCounter = 0; // Also debug shit
    Supaplex.levelElem = document.getElementById("level");
    Supaplex.levelCtx = Supaplex.levelElem.getContext("2d");
    // Supaplex.copyCtx = Supaplex.levelCopy.getContext("2d");
    Supaplex.levelWidth = window.innerWidth;
    Supaplex.levelHeight = window.innerHeight;
    Supaplex.levelElem.width = Supaplex.levelWidth;
    Supaplex.levelElem.height = Supaplex.levelHeight;
    Supaplex.totalWidth = 3776;
    Supaplex.totalHeight = 1472;
    Supaplex.offsetLeft = 0;
    Supaplex.offsetTop = 0;
    Supaplex.SPRITES = {
        Base: {source: document.getElementById("Base"), tiles: 1},
        BugAnimation: {source: document.getElementById("BugAnimation"), tiles: 5, duration: 500, callBack: "finishBug"},
        EatInfotronAnimation: {source: document.getElementById("EatInfotronAnimation"), duration: 250, tiles: 8, callBack: "eatingEnd"},
        EatBaseAnimation: {source: document.getElementById("EatTileAnimation"), tiles: 7, duration: 250, callBack: "eatingEnd"},
        Empty: {source: document.getElementById("Empty"), tiles: 1},
        Exit: {source: document.getElementById("Exit"), tiles: 1},
        Explosion: {source: document.getElementById("Explosion"), tiles: 7, duration: Supaplex.ANIMATION_TIMINGS.explosion, callBack: "explosionEnd"},
        FloppyOrange: {source: document.getElementById("FloppyOrange"), tiles: 1},
        FloppyRed: {source: document.getElementById("FloppyRed"), tiles: 1},
        FloppyYellow: {source: document.getElementById("FloppyYellow"), tiles: 1, duration: Supaplex.ANIMATION_TIMINGS.pushing, tiles: 1, callBack: "fallingEnd"},
        Hardware3: {source: document.getElementById("Hardware3"), tiles: 1},
        Hardware4: {source: document.getElementById("Hardware4"), tiles: 1},
        Hardware5: {source: document.getElementById("Hardware5"), tiles: 1},
        Hardware6: {source: document.getElementById("Hardware6"), tiles: 1},
        Infotron: {source: document.getElementById("Infotron"), tiles: 1},
        InfotronFallingLeft: {source: document.getElementById("InfotronFallingLeft"), duration: Supaplex.ANIMATION_TIMINGS.falling, tiles: 8, callBack: "fallingEnd"},
        InfotronFallingRight: {source: document.getElementById("InfotronFallingRight"), duration: Supaplex.ANIMATION_TIMINGS.falling, tiles: 8, callBack: "fallingEnd"},
        MurphyEatDown: {source: document.getElementById("MurphyEatDown"), tiles: 1},
        MurphyEatLeft: {source: document.getElementById("MurphyEatLeft"), tiles: 1},
        MurphyEatRight: {source: document.getElementById("MurphyEatRight"), tiles: 1},
        MurphyEatUp: {source: document.getElementById("MurphyEatUp"), tiles: 1},
        MurphyEnd: {source: document.getElementById("MurphyEnd"), duration: 500, tiles: 7, callBack: "MurphyEnd"},
        MurphyMovingLeft: {source: document.getElementById("MurphyMovingLeft"), duration: Supaplex.ANIMATION_TIMINGS.regularMove * 3, tiles: 3, callBack: "MurphyMoveEnd"},
        MurphyMovingRight: {source: document.getElementById("MurphyMovingRight"), duration: Supaplex.ANIMATION_TIMINGS.regularMove * 3, tiles: 3, callBack: "MurphyMoveEnd"},
        MurphyPushLeft: {source: document.getElementById("MurphyPushLeft"), tiles: 1},
        MurphyPushRight: {source: document.getElementById("MurphyPushRight"), tiles: 1},
        MurphyRegular: {source: document.getElementById("MurphyRegular"), tiles: 1},
        MurphySadFace: {source: document.getElementById("MurphySadFace"), tiles: 1},
        MurphySleepLeft: {source: document.getElementById("MurphySleepLeft"), duration: 200, tiles: 3, callBack: "MurphySleepEnd"},
        MurphySleepRight: {source: document.getElementById("MurphySleepRight"), duration: 200, tiles: 3, callBack: "MurphySleepEnd"},
        MurphyYawn: {source: document.getElementById("MurphyYawn"), duration: 1000, tiles: 12, callBack: "YawnEnd"},
        PortDown: {source: document.getElementById("PortDown"), tiles: 1},
        PortLeft: {source: document.getElementById("PortLeft"), tiles: 1},
        PortRight: {source: document.getElementById("PortRight"), tiles: 1},
        PortUp: {source: document.getElementById("PortUp"), tiles: 1},
        RAMBottom: {source: document.getElementById("RAMBottom"), tiles: 1},
        RAMLeft: {source: document.getElementById("RAMLeft"), tiles: 1},
        RAMRegular: {source: document.getElementById("RAMRegular"), tiles: 1},
        RAMRight: {source: document.getElementById("RAMRight"), tiles: 1},
        RAMTop: {source: document.getElementById("RAMTop"), tiles: 1},
        Wall: {source: document.getElementById("Wall"), tiles: 1},
        TerminalAnimationGreen: {source: document.getElementById("TerminalAnimationGreen"), duration: Supaplex.ANIMATION_TIMINGS.terminalGreen, tiles: 8},
        TerminalAnimationRed: {source: document.getElementById("TerminalAnimationRed"), duration: Supaplex.ANIMATION_TIMINGS.terminalRed, tiles: 8},
        WallBottomLeft: {source: document.getElementById("WallBottomLeft"), tiles: 1},
        WallBottomRight: {source: document.getElementById("WallBottomRight"), tiles: 1},
        WallSides: {source: document.getElementById("WallSides"), tiles: 1},
        WallTopBottom: {source: document.getElementById("WallTopBottom"), tiles: 1},
        WallTopLeft: {source: document.getElementById("WallTopLeft"), tiles: 1},
        WallTopRight: {source: document.getElementById("WallTopRight"), tiles: 1},
        Zonk: {source: document.getElementById("Zonk"), tiles: 1},
        ZonkFallingRight: {source: document.getElementById("ZonkFallingLeft"), duration: Supaplex.ANIMATION_TIMINGS.falling, tiles: 4, callBack: "fallingEnd"},
        ZonkFallingLeft: {source: document.getElementById("ZonkFallingRight"), duration: Supaplex.ANIMATION_TIMINGS.falling, tiles: 4, callBack: "fallingEnd"},
        ZonkPushedRight: {source: document.getElementById("ZonkFallingLeft"), duration: Supaplex.ANIMATION_TIMINGS.pushing, tiles: 4, callBack: "fallingEnd"},
        ZonkPushedLeft: {source: document.getElementById("ZonkFallingRight"), duration: Supaplex.ANIMATION_TIMINGS.pushing, tiles: 4, callBack: "fallingEnd"}
    };

    Supaplex.loadLevel(Supaplex.LEVELURL, 1);
}

// let's start this thing.
window.onload = function(){
    Supaplex.init();
    Supaplex.STARTTIME = new Date().getTime(); // I moved this here because otherwise I would get weird speed bugs at the start
    document.addEventListener("keydown", Supaplex.onKeyDown);
    document.addEventListener("keyup", Supaplex.onKeyUp);
    document.addEventListener("visibilitychange", Supaplex.handleVisibilityChange, false);
};