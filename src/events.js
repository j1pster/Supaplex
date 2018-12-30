
Supaplex.PauseTheGame = function () {
    cancelAnimationFrame(Supaplex.AnimationFrameID);
    //Supaplex.Murphy.$elem.style.webkitAnimationPlayState = "paused";
    Supaplex.gamePaused = true;
}

Supaplex.UnPauseTheGame = function () {
    requestAnimationFrame(Supaplex.loop);
    //Supaplex.Murphy.$elem.style.webkitAnimationPlayState = "running";
    Supaplex.gamePaused = false;
}

// Get's called upon switching to and from this tab.
Supaplex.handleVisibilityChange = function () {
    if(document.hidden) {
        Supaplex.PauseTheGame();
    } else {
        Supaplex.UnPauseTheGame();
    }
}

Supaplex.resetLevel = function () {
    Supaplex.levelElem.innerHTML = "";
    Supaplex.init();
}