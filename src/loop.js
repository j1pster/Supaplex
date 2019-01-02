Supaplex.loop = function() {
    Supaplex.fpsCounter += 1;
    Supaplex.fpsTimer = (performance.now() - Supaplex.lastLogicUpdate);
    Supaplex.FPS = 1000 / Supaplex.fpsTimer;
    // Supaplex.fpsTimerElem.innerHTML = Math.round(Supaplex.FPS);
    // if(Supaplex.fpsTimer > 1000) {
    //     Supaplex.FPS = Supaplex.fpsCounter;
    //     if(Supaplex.FPS < 60) {
    //         Supaplex.FPS = 60;
    //     }
    //     Supaplex.fpsCounter = 0;
    //     Supaplex.fpsTimer = 0;
    // }
    Supaplex.logic();
    Supaplex.draw();
    Supaplex.lastLogicUpdate = performance.now();
    Supaplex.AnimationFrameID = requestAnimationFrame(Supaplex.loop);
};