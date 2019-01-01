Supaplex.updateViewport = function () {
    Supaplex.offsetLeft = Supaplex.Murphy.position.x - (Supaplex.levelWidth / 2) + (Supaplex.TILESIZE / 2);
    Supaplex.offsetTop = Supaplex.Murphy.position.y - (Supaplex.levelHeight / 2) + (Supaplex.TILESIZE / 2);
    if (Supaplex.offsetLeft > Supaplex.totalWidth - Supaplex.levelWidth) {
        Supaplex.offsetLeft = Supaplex.totalWidth - Supaplex.levelWidth;
    }
    else if(Supaplex.offsetLeft < 0) {
        Supaplex.offsetLeft = 0;
    }
    if (Supaplex.offsetTop > Supaplex.totalHeight - Supaplex.levelHeight) {
        Supaplex.offsetTop = Supaplex.totalHeight - Supaplex.levelHeight;
    }
    else if (Supaplex.offsetTop < 0) {
        Supaplex.offsetTop = 0;
    }
};


Supaplex.draw = function() {
    // for(var i = Supaplex.tilesToUpdate.length - 1; i >= 0; i--) {
    //     Supaplex.tilesToUpdate[i].measure();
    // }
    Supaplex.updateViewport();
    // Supaplex.copyCtx.drawImage(Supaplex.SPRITES.Empty.source, 0, 0, Supaplex.TILESIZE, Supaplex.TILESIZE, 0, 0, Supaplex.levelCopy.width)
    Supaplex.levelCtx.clearRect(0, 0, Supaplex.levelElem.width, Supaplex.levelElem.height);
    //Supaplex.copyCtx.clearRect(0, 0, Supaplex.levelCopy.width, Supaplex.levelCopy.height);
    var xLength = Supaplex.level.length;
    if(Supaplex.Murphy.drawFirst) Supaplex.Murphy.draw();
    //first draw all elements that aren't moving.
    for(var x = 0; x < xLength; x++) {
        var yLength = Supaplex.level[x].length;
        for(var y = 0; y < yLength; y++) {
            var element = Supaplex.level[x][y];
            if(!element.moving && element.type != "Empty") {
                element.draw();
            }
        }
    }
    for(var x2 = 0; x2 < xLength; x2++) {
        var yLength = Supaplex.level[x2].length;
        for(var y2 = 0; y2 < yLength; y2++) {
            var element2 = Supaplex.level[x2][y2];
            if(element2.moving && element2.type != "Empty") {
                if(element2.type == "Murphy" && Supaplex.Murphy.drawFirst) continue;
                element2.draw();
            }
        }
    }
    // Supaplex.levelCtx.drawImage(Supaplex.levelCopy, 0, 0);
    return;
}