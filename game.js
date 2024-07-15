var game;
var gameOptions = {
    tileSize: 200,
    tileSpacing: 20,
    boardSize: {
        rows: 4,
        cols: 4
    },
    tweenSpeed: 50,
    swipeMaxTime: 1000,
    swipeMinDistance: 20,
    swipeMinNormal: 0.85,
    aspectRatio: 16/9,
    localStorageName: "topscore4096"
}
window.onload = function() {
    var tileAndSpacing = gameOptions.tileSize + gameOptions.tileSpacing;
    var width = gameOptions.boardSize.cols * tileAndSpacing;
    width += gameOptions.tileSpacing;
    var gameConfig = {
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            parent: "thegame",
            width: width,
            height: width * gameOptions.aspectRatio
        },
        backgroundColor: 0xecf0f1,
        scene: [bootGame, playGame]
    }
    game = new Phaser.Game(gameConfig);
    window.focus();
}
class bootGame extends Phaser.Scene{
    constructor(){
        super("BootGame");
    }
    preload(){
        this.load.atlas("atlas", "assets/sprites/sprites.png", "assets/sprites/sprites.json");
        this.load.audio("move", ["assets/sounds/move.ogg", "assets/sounds/move.mp3"]);
        this.load.audio("grow", ["assets/sounds/grow.ogg", "assets/sounds/grow.mp3"]);
        this.load.bitmapFont("font", "assets/fonts/font.png", "assets/fonts/font.fnt");
    }
    create(){
        this.textures.addSpriteSheetFromAtlas("tiles", {
            atlas: "atlas",
            frame: "tiles.png",
            frameWidth: gameOptions.tileSize,
            frameHeight: gameOptions.tileSize,
            endFrame: 11
        });
        this.scene.start("PlayGame");
    }
}
class playGame extends Phaser.Scene{
    constructor(){
        super("PlayGame");
    }
    create(){
        this.game2048 = new Game2048({
            rows: gameOptions.boardSize.rows,
            columns: gameOptions.boardSize.cols,
            maxValue: 12
        });
        this.score = 0;
        var restartXY = this.getTilePosition(-0.8, gameOptions.boardSize.cols - 1);
        var restartButton = this.add.sprite(restartXY.x, restartXY.y, "atlas", "restart.png");
        restartButton.setInteractive();
        restartButton.on("pointerdown", function(){
            this.scene.start("PlayGame");
        }, this);
        var fullScreenButton = this.add.sprite(restartButton.x, restartButton.y - 120, "atlas", "fullscreen.png");
        fullScreenButton.setInteractive();
        fullScreenButton.on("pointerup", function(){
            if(!this.scale.isFullscreen){
                this.scale.startFullscreen();
            }
            else{
                this.scale.stopFullscreen();
            }
        }, this);
        var scoreXY = this.getTilePosition(-0.8, 1);
        this.add.image(scoreXY.x, scoreXY.y, "atlas", "scorepanel.png");
        this.add.image(scoreXY.x, scoreXY.y - 70, "atlas", "scorelabels.png");
        var textXY = this.getTilePosition(-0.92, -0.4);
        this.scoreText = this.add.bitmapText(textXY.x, textXY.y, "font", "0");
        textXY = this.getTilePosition(-0.92, 1.1);
        this.bestScore = localStorage.getItem(gameOptions.localStorageName);
        if(this.bestScore == null){
            this.bestScore = 0;
        }
        this.bestScoreText = this.add.bitmapText(textXY.x, textXY.y, "font", this.bestScore.toString());
        var gameTitle = this.add.image(10, 5, "atlas", "gametitle.png");
        gameTitle.setOrigin(0, 0);
        var howTo = this.add.image(game.config.width, 5, "atlas", "howtoplay.png");
        howTo.setOrigin(1, 0);
        var logo = this.add.sprite(game.config.width / 2, game.config.height, "atlas", "logo.png");
        logo.setOrigin(0.5, 1);
        logo.setInteractive();
        logo.on("pointerdown", function(){
            window.location.href = "http://www.emanueleferonato.com/"
        });
        this.canMove = false;
        this.game2048.generateField();
        for(var i = 0; i < this.game2048.getRows(); i ++){
            for(var j = 0; j < this.game2048.getColumns(); j ++){
                var tilePosition = this.getTilePosition(i, j);
                this.add.image(tilePosition.x, tilePosition.y, "atlas", "emptytile.png");
                var tile = this.add.sprite(tilePosition.x, tilePosition.y, "tiles", 0);
                tile.visible = false;
                this.game2048.setCustomData(i, j, tile);
            }
        }
        this.addTile();
        this.addTile();
        this.input.keyboard.on("keydown", this.handleKey, this);
        this.input.on("pointerup", this.handleSwipe, this);
        this.moveSound = this.sound.add("move");
        this.growSound = this.sound.add("grow");
    }
    addTile(){
        var addedTile = this.game2048.addTile();
        var tileSprite = this.game2048.getCustomData(addedTile.row, addedTile.column);
        tileSprite.visible = true;
        tileSprite.setFrame(0);
        tileSprite.alpha = 0;
        this.tweens.add({
            targets: tileSprite,
            alpha: 1,
            duration: gameOptions.tweenSpeed,
            callbackScope: this,
            onComplete: function(){
                this.canMove = true;
            }
        });
    }
    getTilePosition(row, col){
        var posX = gameOptions.tileSpacing * (col + 1) + gameOptions.tileSize * (col + 0.5);
        var posY = gameOptions.tileSpacing * (row + 1) + gameOptions.tileSize * (row + 0.5);
        var boardHeight = this.game2048.getRows() * gameOptions.tileSize;
        boardHeight += (this.game2048.getRows() + 1) * gameOptions.tileSpacing;
        var offsetY = (game.config.height - boardHeight) / 2;
        posY += offsetY;
        return new Phaser.Geom.Point(posX, posY);
    }
    handleKey(e){
        if(this.canMove){
            switch(e.code){
                case "KeyA":
                case "ArrowLeft":
                    this.makeMove(this.game2048.LEFT);
                    break;
                case "KeyD":
                case "ArrowRight":
                    this.makeMove(this.game2048.RIGHT);
                    break;
                case "KeyW":
                case "ArrowUp":
                    this.makeMove(this.game2048.UP);
                    break;
                case "KeyS":
                case "ArrowDown":
                    this.makeMove(this.game2048.DOWN);
                    break;
            }
        }
    }
    handleSwipe(e){
        if(this.canMove){
            var swipeTime = e.upTime - e.downTime;
            var fastEnough = swipeTime < gameOptions.swipeMaxTime;
            var swipe = new Phaser.Geom.Point(e.upX - e.downX, e.upY - e.downY);
            var swipeMagnitude = Phaser.Geom.Point.GetMagnitude(swipe);
            var longEnough = swipeMagnitude > gameOptions.swipeMinDistance;
            if(longEnough && fastEnough){
                Phaser.Geom.Point.SetMagnitude(swipe, 1);
                if(swipe.x > gameOptions.swipeMinNormal){
                    this.makeMove(this.game2048.RIGHT);
                }
                if(swipe.x < -gameOptions.swipeMinNormal){
                    this.makeMove(this.game2048.LEFT);
                }
                if(swipe.y > gameOptions.swipeMinNormal){
                    this.makeMove(this.game2048.DOWN);
                }
                if(swipe.y < -gameOptions.swipeMinNormal){
                    this.makeMove(this.game2048.UP);
                }
            }
        }
    }
    makeMove(d){
        var movements = this.game2048.moveBoard(d);
        if(movements.length > 0){
            this.canMove = false;
            this.movingTiles = 0;
            this.moveSound.play();
            movements.forEach(function(movement){
                var newPos = this.getTilePosition(movement.to.row, movement.to.column);
                this.moveTile(this.game2048.getCustomData(movement.from.row, movement.from.column), newPos, movement.from.value != movement.to.value);
                if(movement.from.value != movement.to.value){
                    this.score += Math.pow(2, movement.to.value);
                }
            }.bind(this))
        }
    }
    moveTile(tile, point, upgrade){
        this.movingTiles ++;
        tile.depth = this.movingTiles;
        var distance = Math.abs(tile.x - point.x) + Math.abs(tile.y - point.y);
        this.tweens.add({
            targets: [tile],
            x: point.x,
            y: point.y,
            duration: gameOptions.tweenSpeed * distance / gameOptions.tileSize,
            callbackScope: this,
            onComplete: function(){
                if(upgrade){
                    this.upgradeTile(tile);
                }
                else{
                    this.endTween(tile);
                }
            }
        })
    }
    upgradeTile(tile){
        this.growSound.play();
        tile.setFrame(tile.frame.name + 1);
        this.tweens.add({
            targets: [tile],
            scaleX: 1.1,
            scaleY: 1.1,
            duration: gameOptions.tweenSpeed,
            yoyo: true,
            repeat: 1,
            callbackScope: this,
            onComplete: function(){
                this.endTween(tile);
            }
        })
    }
    endTween(tile){
        this.movingTiles --;
        tile.depth = 0;
        if(this.movingTiles == 0){
            this.refreshBoard();
        }
    }
    refreshBoard(){
        this.scoreText.text = this.score.toString();
        if(this.score > this.bestScore){
            this.bestScore = this.score;
            localStorage.setItem(gameOptions.localStorageName, this.bestScore);
            this.bestScoreText.text = this.bestScore.toString();
        }
        for(var i = 0; i < this.game2048.getRows(); i++){
            for(var j = 0; j < this.game2048.getColumns(); j++){
                var spritePosition = this.getTilePosition(i, j);
                this.game2048.getCustomData(i, j).x = spritePosition.x;
                this.game2048.getCustomData(i, j).y = spritePosition.y;
                var tileValue = this.game2048.getTileValue(i, j);
                if(tileValue > 0){
                    this.game2048.getCustomData(i, j).visible = true;
                    this.game2048.getCustomData(i, j).setFrame(tileValue - 1);
                }
                else{
                    this.game2048.getCustomData(i, j).visible = false;
                }
            }
        }
        this.addTile();
    }
}

class Game2048{
    constructor(obj){
        if(obj == undefined){
            obj = {}
        }
        this.rows = (obj.rows != undefined) ? obj.rows : 4;
        this.columns = (obj.columns != undefined) ? obj.columns : 4;
        this.maxValue = (obj.maxValue != undefined) ? obj.maxValue : 11;
        this.LEFT = {
            deltaRow: 0,
            deltaColumn: -1,
            firstRow: 0,
            lastRow: this.rows,
            firstColumn: 1,
            lastColumn: this.columns
        };
        this.RIGHT = {
            deltaRow: 0,
            deltaColumn: 1,
            firstRow: 0,
            lastRow: this.rows,
            firstColumn: 0,
            lastColumn: this.columns - 1
        }
        this.UP = {
            deltaRow: -1,
            deltaColumn: 0,
            firstRow: 1,
            lastRow: this.rows,
            firstColumn: 0,
            lastColumn: this.columns
        }
        this.DOWN = {
            deltaRow: 1,
            deltaColumn: 0,
            firstRow: 0,
            lastRow: this.rows - 1,
            firstColumn: 0,
            lastColumn: this.columns
        }
    }
    getRows(){
        return this.rows;
    }
    getColumns(){
        return this.columns;
    }
    getMaxValue(){
        return this.maxValue;
    }
    generateField(){
        this.gameArray = [];
        for(let i = 0; i < this.getRows(); i++){
            this.gameArray[i] = [];
            for(let j = 0; j < this.getColumns(); j++){
                this.gameArray[i][j] = {
                    tileValue: 0,
                    customData: null,
                    upgraded: false
                }
            }
        }
    }
    getTileValue(row, column){
        return this.gameArray[row][column].tileValue
    }
    setTileValue(row, column, value){
        this.gameArray[row][column].tileValue = value;
    }
    getCustomData(row, column){
        return this.gameArray[row][column].customData;
    }
    setCustomData(row, column, customData){
        this.gameArray[row][column].customData = customData;
    }
    setUpgradedTile(row, column, upgraded){
        this.gameArray[row][column].upgraded = upgraded
    }
    isEmptyTile(row, column){
        return this.getTileValue(row, column) == 0;
    }
    isUpgradedTile(row, column){
        return this.gameArray[row][column].upgraded;
    }
    isCappedTile(row, column){
        return this.getTileValue(row, column) == this.getMaxValue();
    }
    resetUpgradedTiles(){
        for(let i = 0; i < this.getRows(); i++){
            for(let j = 0; j < this.getColumns(); j++){
                this.setUpgradedTile(i, j, false);
            }
        }
    }
    upgradeTile(row, column){
        this.setTileValue(row, column, this.getTileValue(row, column) + 1);
        this.setUpgradedTile(row, column, true);
    }
    isInsideBoard(row, column){
        return row >= 0 && column >= 0 && row < this.getRows() && column < this.getColumns();
    }
    isLegalMove(row, column, value){
        return this.isInsideBoard(row, column) && !this.isCappedTile(row, column) && (this.isEmptyTile(row, column) || (this.getTileValue(row, column) == value) && !this.isUpgradedTile(row, column))
    }
    addTile(){
        let emptyTiles = [];
        for(let i = 0; i < this.getRows(); i++){
            for(let j = 0; j < this.getColumns(); j++){
                if(this.isEmptyTile(i, j)){
                    emptyTiles.push({
                        row: i,
                        column: j
                    })
                }
            }
        }
        if(emptyTiles.length > 0){
            let chosenTile = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
            this.setTileValue(chosenTile.row, chosenTile.column, 1);
            return chosenTile;
        }
    }
    moveBoard(direction){
        let movements = [];
        for(let i = direction.firstRow; i < direction.lastRow; i ++){
            for(let j = direction.firstColumn; j < direction.lastColumn; j ++){
                let currentRow = direction.deltaRow == 1 ? (direction.lastRow - 1) - i : i;
                let currentColumn = direction.deltaColumn == 1 ? (direction.lastColumn - 1) - j : j;
                if(!this.isEmptyTile(currentRow, currentColumn)){
                    let tileValue = this.getTileValue(currentRow, currentColumn);
                    let newRow = currentRow;
                    var newColumn = currentColumn;
                    while(this.isLegalMove(newRow + direction.deltaRow, newColumn + direction.deltaColumn, tileValue)){
                        newRow += direction.deltaRow;
                        newColumn += direction.deltaColumn;
                    }
                    if(newRow != currentRow || newColumn != currentColumn){
                        this.setTileValue(currentRow, currentColumn, 0);
                        if(this.getTileValue(newRow, newColumn) == tileValue){
                            this.upgradeTile(newRow, newColumn);
                        }
                        else{
                            this.setTileValue(newRow, newColumn, tileValue)
                        }
                        movements.push({
                            from: {
                                row: currentRow,
                                column: currentColumn,
                                value: tileValue
                            },
                            to: {
                                row: newRow,
                                column: newColumn,
                                value: this.getTileValue(newRow, newColumn)
                            }
                        })
                    }
                }
            }
        }
        this.resetUpgradedTiles();
        return movements;
    }
}
