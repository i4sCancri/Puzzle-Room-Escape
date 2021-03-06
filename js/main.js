// main.js

"use strict";

var app = app || {};

app.main = {
    
	//  properties
    WIDTH : 660, 
    HEIGHT: 480,
    canvas: undefined,
    ctx: undefined,
   	//lastTime: 0, 
    debug: true,
    
    paused: false,
    animationID: 0,
    debug: true,
    
    gameState: undefined,
    GAME_STATE: {
        BEGIN: 0,
        PLAYING: 1,
        PAUSE: 2,
        ROUND_OVER: 3,
        END: 4
    },
    
    // SOUND
    sound: undefined, // requires - loaded by main.js
    
    player: Object.seal({
        position: { x: undefined, y: undefined }
    }),
    
    // Map Properties
    currentMap: [],         // loaded in from txt file
    CELL_WIDTH: 30,         // grid cell size in px    
    ROWS: 16,
    COLUMNS: 22,
    
    // image loading and drawing
    imagePaths: undefined,
    playerImage: undefined,
    MAP_IMAGES: [
        { floorImage: undefined },  // 0
        { panelImage: undefined },  // 1
        { wallImage: undefined },   // 2
        { doorImage: undefined }    // 3
    ],
    
    // Level Properties
    currentLevel: -1,        // begin at negative state, will increment when level is loaded
    mapPaths: [
        'maps/map_0.txt',
        'maps/map_1.txt',
        'maps/map_2.txt',
        'maps/map_3.txt'
    ],
    currentPanels: [],          // array of panel locations for current level, initiated in loadMap() function
    currentPanelsStates: [],    // array of booleans in correspondance so 
    panelPressToggle: false, // false - off, true - on
    lastPressedPanel: [],       // psuedo vector
    previousNonCollidingPos: { x: undefined, y: undefined },
    

    // methods
	init : function() {
		console.log("app.main.init() called");
        
		// initialize properties
		this.canvas = document.querySelector('canvas');
		this.canvas.width = this.WIDTH;
		this.canvas.height = this.HEIGHT;
		this.ctx = this.canvas.getContext('2d');    
        this.gameState = this.GAME_STATE.BEGIN;
        
        
        ///////////////////////////////////////////////IMAGELOADING
        var image = new Image();
        for (var i=0; i<this.imagePaths.length;i++) {
            image = new Image();
            image.onload = function() {
              console.log("asset loaded");  
            };
            image.src = this.imagePaths[i];
            if (i == 4) {       // player sprite
                this.playerImage = image;
                continue;
            }
            this.MAP_IMAGES[i] = image;
            
        }
        
        
        // load sprites
        this.loadSprites();
        //this.createPlayerSprite(this.WIDTH/2, this.HEIGHT/2);// animatedsprite loading
        
        // hook up events
        this.canvas.onmousedown = this.doMousedown.bind(this);
        
        // load level
        this.loadLevel();
        
		// start the game loop
		this.update();
	},
    
    loadLevel: function(){
        // LOAD CURRENT LEVEL
        this.currentLevel++; 
        this.panelPressToggle = false;
        // read in map
        this.loadMap(this.mapPaths[this.currentLevel]);    
    },
	
	update: function () {
	 	this.animationID = requestAnimationFrame(this.update.bind(this));
	 	
	 	// PAUSE SCREEN - TO DO
 	 
	 	// UPDATE
        
        // CHECK FOR COLLISIONS
        this.checkCollisions();

		//////DRAWING GOES UNDER HERE//////
		// Redraw background
		this.ctx.fillStyle = "#6495ED";
        this.ctx.fillRect(0,0,this.WIDTH, this.HEIGHT);
        
        if(this.paused){
                this.drawPauseScreen(this.ctx);
                return;
            }
        
        // TITLE SCREEN
        if (this.gameState == this.GAME_STATE.BEGIN)  {
            this.panelPressToggle = false;
            this.drawStartScreen(this.ctx);
        }
        
     
        
        // DURING GAME
        if (this.gameState == this.GAME_STATE.PLAYING){
            if (!this.panelPressToggle) {
                this.drawMap(this.currentMap);
            }            
            if (this.panelPressToggle) {
                this.lightsOff();
            }

            // Draw Grid lines
            this.drawGrid(); // does not draw unless called after wall draw call

            // INSTRUCTIONS: only on lv0
            if (this.currentLevel == 0) {
                this.ctx.save();
                this.ctx.globalAlpha = .7;
                this.ctx.font = "20px Arial";
                this.ctx.textAlign='center';
                this.ctx.fillStyle = "white";
                this.ctx.fillText("Escape the dungeon!", this.WIDTH/2, 80);
                this.ctx.fillText("Move with WASD or Arrow Keys.", this.WIDTH/2, 110);
                this.ctx.fillText("White blocks - switch panel.", this.WIDTH/2, 145);
                this.ctx.fillText("E - exit.", this.WIDTH/2, 170);
                this.ctx.fillText("You can only exit once you hit all the switches.", this.WIDTH/2, 265);
                this.ctx.fillText("But once you hit a switch you'll have to traverse in the dark", this.WIDTH/2, 295);
                this.ctx.fillText("until you find a different switch to turn it back on", this.WIDTH/2, 325);
                this.ctx.fillText("so try to remember the path.", this.WIDTH/2, 355);

                this.ctx.restore();
            }
            
            // Draw sprites
            this.drawSprites();
            //this.drawPlayerSprite();                                      // animatedsprite loading
            
            // DRAW HUD
            this.drawHUD(this.ctx);
        }      
        
        // ROUND OVER
        if (this.gameState == this.GAME_STATE.ROUND_OVER) {
            this.drawRoundOverScreen(this.ctx);
        }
        

	},
    
    ///////////////////////////////////////////////////////
    ///             PLAYER SPRITE FUNCTIONS             ///
    ///////////////////////////////////////////////////////
    loadSprites: function() {   // mock-up blocks
        // call function constructors here    
        this.player.position.x = Math.floor(this.WIDTH / 2);
        this.player.position.y = Math.floor(this.HEIGHT / 2);
    },
    
    drawSprites: function(){     // mock-up blocks   
        // drawing square as player for now
        //this.ctx.fillStyle = this.player.color;
        this.ctx.drawImage(this.playerImage, this.player.position.x,this.player.position.y,this.CELL_WIDTH, this.CELL_WIDTH);     
    },
    
    createPlayerSprite: function(x, y) { // loading sprites from spritesheets
        // AnimatedSprite(image, width, height, frameWidth, frameHeight, frameDelay)
        var spr = new app.AnimatedSprite(this.playerImage,128,192,32,48,1/3);
        spr.x = x;
        spr.y = y;
    },
    
    drawPlayerSprite: function() { // loading sprites from spritesheets
        spr.draw(this.ctx);
        
    },
    
     
    ///////////////////////////////////////////////////////
    ///          END PLAYER SPRITE FUNCTIONS            ///
    ///////////////////////////////////////////////////////
    
    ///////////////////////////////////////////////////////
    /// MAP LOADING & DRAWING(transfer to utlities?)    ///
    ///////////////////////////////////////////////////////
    
    // Reads external txt files as maps
    // call once every new level load
    loadMap: function(path){        
        var xhr = new XMLHttpRequest();
        
        xhr.onload = function(){
            var response = xhr.responseText;
            var gridArray = response.split('\n');
            for(var i=0;i<gridArray.length;i++){
                var line = gridArray[i];
                gridArray[i]= line.split(',');
            }
            
            app.main.currentMap = gridArray;
            //console.log(app.main.currentMap);
            
            //app.main.update();
            app.main.loadPanelData(app.main.currentMap);
        }
       
        xhr.open('GET',path,true);
        
        // try to prevent browser caching by sending a header to the server
        xhr.setRequestHeader("If-Modified-Since", "Sat, 1 Jan 2010 00:00:00 GMT");
        xhr.send();
    },
    
    // Load in Panel information
    loadPanelData: function(map) {  // call once every new level load
        // if arrays not empty, empty them
        if (this.currentPanels.length > 0) {
            this.currentPanels.length = 0;
            this.currentPanelsStates.length = 0;
        }
        
        // load in panels
        for (var i=0; i<this.ROWS; i++) { // hardcoded number of rows canvas HEIGHT / CELL_WIDTH
            var inner = map[i];
            for (var j=0; j<this.COLUMNS; j++) {
                var value = inner[j];
                
                // if panel push onto current panels array
                // also create a false (not yet pressed) bool in panelState array
                if (value == 2){
                    this.currentPanels.push([j * this.CELL_WIDTH, i * this.CELL_WIDTH]);
                    this.currentPanelsStates.push(false);
                }
            }   // end j
        }   // end i
        console.log("currentPanels (locations) array:" + this.currentPanels);  
        console.log("currentPanelsStates array:" + this.currentPanelsStates);  
    },
    
    // Draws map assets in correspondence to loaded in map file
    drawMap: function(map) {
        //debugger;
        for (var i=0; i<this.ROWS; i++) {
            var inner = map[i];
            for (var j=0; j<this.COLUMNS; j++) {
                var value = inner[j];
                
                this.ctx.drawImage(this.MAP_IMAGES[value],j * this.CELL_WIDTH, i * this.CELL_WIDTH, this.CELL_WIDTH, this.CELL_WIDTH);
            } // end j for
        } // end i for
    },
    
    // Draws grid lines
    drawGrid: function() {
      this.ctx.strokeStyle = "#888";
        this.ctx.lineWidth="1";
        for (var i=0;i<this.HEIGHT;i++) { // horizantal
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * (this.CELL_WIDTH));
            this.ctx.lineTo(this.WIDTH, i * (this.CELL_WIDTH));
            this.ctx.closePath();
            this.ctx.stroke();
        }
        for (var i=0;i<this.WIDTH;i++) { // vertical
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.CELL_WIDTH, 0);
            this.ctx.lineTo(i * this.CELL_WIDTH, this.HEIGHT);
            this.ctx.closePath();
            this.ctx.stroke();
        }  
    },
    ///////////////////////////////////////////////////////
    ///              END MAP LOADING                    ///
    ///////////////////////////////////////////////////////
    
    // Handle all collisions with player
    checkCollisions: function() {
        for (var i=0; i<this.currentMap.length;i++) {
            for (var j=0; j<this.currentMap[i].length; j++){

                var blockXPos = (j)*this.CELL_WIDTH;
                var blockYPos = (i)*this.CELL_WIDTH;

                // WALL CHECK
                if (this.currentMap[i][j] == 1) {
                    // otherwise go on to check
                    // (1) if x or y  is within CELL_WIDTH (30px) of the wall at i, disable that direction in keys.js
                    // (2) check:
                    //      LEFT-RIGHT: Y's must be the same
                    //      UP-DOWN: X's must be the same

                    if (this.player.position.x + this.CELL_WIDTH == blockXPos && this.player.position.y == blockYPos) { // checks RIGHT
                        console.log("Cannot go RIGHT!");
                        // save this current position in case tries to go on wall
                        //this.previousNonCollidingPos.x = this.player.position.x;
                        //this.previousNonCollidingPos.y = this.player.position.y;
                    }
                    else if (this.player.position.x - this.CELL_WIDTH == blockXPos && this.player.position.y == blockYPos) { // checks LEFT
                        // disable right 'A' 
                        console.log("Cannot go LEFT!");
                    }
                    else if (this.player.position.y + this.CELL_WIDTH == blockYPos && this.player.position.x == blockXPos) { // checks DOWN
                        // disable down 'S'   
                        console.log("Cannot go DOWN!");
                    }
                    else if (this.player.position.y - this.CELL_WIDTH == blockYPos && this.player.position.x == blockXPos) { // checks UP
                        // disable down 'W'   
                        console.log("Cannot go UP!");
                    }

                    // if player tries to move onto wall, go to previous position
                    //if (this.player.position.x == blockXPos || this.player.position.x == blockYPos) {
                    //    this.player.position.x = this.previousNonCollidingPos.x;
                    //    this.player.position.x = this.previousNonCollidingPos.x;
                    //}
                } // END WALL CHECK

                // DOOR CHECK
                if (this.currentMap[i][j] == 3){ 
                    // when player position equals this panel
                    if (this.player.position.x == blockXPos && this.player.position.y == blockYPos) {
                        // If DOOR & all panels are pressed (all true in the array)
                        if (this.areAllPanelsPressed()) {
                            this.gameState = this.GAME_STATE.ROUND_OVER;
                            // reset last panels and player pos 
                            // THIS WILL BE CHANGED LATER, different start locations for different levels
                            this.lastPressedPanel.x = undefined;
                            this.lastPressedPanel.y = undefined;
                            this.player.position.x = Math.floor(this.WIDTH/2);
                            this.player.position.y = Math.floor(this.HEIGHT/2);
                        }
                    } // end inner if
                } // end if   
            } // end inner for
        } // end for 
        
        // PANEL CHECK (separate from doors and walls)
        // search through panel array locations
        for (var k=0; k<this.currentPanels.length;k++){
            // player location "vector"
            var playerLoc = [this.player.position.x, this.player.position.y];
            //console.log("PlayerLoc=" + playerLoc[0] + "," + playerLoc[1]);
            //console.log("this.currentPanels[0,1]=" + this.currentPanels[0][0] + "," + this.currentPanels[0][1]);
            
            // If the player is ON a panel
            if (playerLoc[0] == this.currentPanels[k][0] && playerLoc[1] == this.currentPanels[k][1]) {  
                //console.log("on a panel");
                
                // first check the last panel
                // if it is undefined or the current players location (current panel) is not the same panel previously pressed
                if (this.lastPressedPanel == undefined || (playerLoc[0] != this.lastPressedPanel[0] && playerLoc[1] != this.lastPressedPanel[1])) {
                    // only toggle on enter
                    this.panelPressToggle = !this.panelPressToggle;
                    // it is now safe to set this as last pressed panel
                    this.lastPressedPanel = this.currentPanels[k];
                    console.log("Last pressed: " + this.lastPressedPanel);
                }
                
                // however as long the player steps on a panel it will be set to TRUE (pressed) for the rest of the level
                this.currentPanelsStates[k] = true;
                
                // otherwise if it is the same panel, nothing will happen  
            }
        } // end for
    },
    
    // Loop through currentPanelStates to check if pressed
    areAllPanelsPressed: function(){    // ONLY check upon entering a door
        for (var i=0;i<this.currentPanelsStates.length;i++) {
            if (this.currentPanelsStates[i] == false) { return false; }    // as soon as a not touched panel is found, exit and return false
        }
        return true;    
    },
    
    // Makes the map black and unviewable besdies the player
    lightsOff: function() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0,0,this.WIDTH,this.HEIGHT);
    },
    
    ///////////////////////////////////////////////////////
    ///                 SCREEN DRAWING                  ///
    ///////////////////////////////////////////////////////
    
    drawStartScreen: function(ctx) {
        ctx.save();
        ctx.font = "40px Creepster";
        ctx.textAlign='center';
        ctx.fillStyle = "white";
        ctx.fillText("PANEL PUSHER", this.WIDTH/2, this.HEIGHT/2);
        ctx.font = "20px Arial";
        ctx.fillText("Click to start.", this.WIDTH/2, this.HEIGHT/2 + 50);
        ctx.fillText("Made by Isis Melendez.", this.WIDTH/2, this.HEIGHT/2 + 80);
        ctx.restore();
    },
    
    drawRoundOverScreen: function() {
        ctx.save();
        ctx.globalAlpha = .5;
        ctx.fillStyle = "#6495ED";
        ctx.fillRect(0,0,this.WIDTH,this.HEIGHT);
        
        ctx.globalAlpha = 1;
        ctx.font = "20px Arial";
        ctx.textAlign='center';
        ctx.fillStyle = "white";
        ctx.fillText("You've escaped!", this.WIDTH/2, 80);
        ctx.fillText("Click to continue to level: " + (this.currentLevel+1), this.WIDTH/2, 110);
        ctx.restore();
    },
    
    drawEndGameScreen: function(ctx) {
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#6495ED";
        ctx.fillRect(0,0,this.WIDTH,this.HEIGHT);
        
        ctx.globalAlpha = 1;
        ctx.font = "20px Arial";
        ctx.textAlign='center';
        ctx.fillStyle = "white";
        ctx.fillText("You've escaped forever!", this.WIDTH/2, 80);
        ctx.font = "16px";
        ctx.fillText("Click to replay.", this.WIDTH/2, 110);
        ctx.restore();
    },
    
    drawHUD: function(ctx) {
        ctx.save();
        ctx.font = "20px Creepster";
        ctx.textAlign='left';
        ctx.fillStyle = "white";
        ctx.fillText("Level: " + this.currentLevel, 10, 20);
        ctx.restore();
    },
    
     drawPauseScreen: function(ctx){
        ctx.save();
        ctx.fillStyle = "#777";
        ctx.fillRect(0,0,this.WIDTH,this.HEIGHT);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#fff";
        ctx.fillText("PAUSED", this.WIDTH/2, this.HEIGHT/2, "40pt courier");
        ctx.restore();
    },
    
    
    ///////////////////////////////////////////////////////
    ///              END SCREENS DRAWING                ///
    ///////////////////////////////////////////////////////
   
    pauseGame: function() {
        this.paused = true;
        cancelAnimationFrame(this.animationID);
        this.update();
    },
    
    resumeGame: function() {
        cancelAnimationFrame(this.animationID);
        this.paused = false;
        this.update();  // restart loop
    },
    
    // Handle mouse click events in game states
    doMousedown: function(e) {
        if (this.paused){
          this.paused = false;
          this.update();
          return;
        }
        
        if (this.gameState == this.GAME_STATE.BEGIN) {
            this.gameState = this.GAME_STATE.PLAYING;
            return;
        }
        
        if (this.gameState == this.GAME_STATE.ROUND_OVER) {
            this.loadLevel();
            this.gameState = this.GAME_STATE.PLAYING;
            return;
        }
        if (this.gameState == this.GAME_STATE.PLAYING){
            // Debug - 
            //console.log("this.areAllPanelsPressed()=" + this.areAllPanelsPressed());
            return;
        }
    }
    
    
}; // end app.main
