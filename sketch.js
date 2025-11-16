// This is the Last version.
// It adds multi-stage evolution and shining effect to background dots.

// ToDoList: 
// 1.Click to select [✔] 
// 2.Selected Circle will breath. [✔]
// 3.Click two circles to connect them with a line. [✔]
// 4.Connected circles will evolve and show a middle pattern. [✔]
// 5.Connected twice to show the outer pattern. [✔]
// 6.Dots are shining. [✔]


// =======================================================================
// ======================== Global Variables =============================
// =======================================================================
// This section defines all shared state used across the sketch, including
// the global background colour, colour palettes for circles and patterns,
// and the arrays that store Circle objects. These variables are 
// initialised in setup() and then read by the drawing functions.

let globalBgColor;       // bgColor
let circleBasePalette;   // Base colours for the circles (Deep Earth tones)
let patternPalette;       // Colours for patterns/details (High contrast/Bright)
let circles = [];        // Stores all Circle objects, added dynamically on click
let backgroundDots = []; // Stores background dot data to prevent flicker

// --- New variables for Connections ---
let connections = [];     // Stores all {from, to} connection objects
let selectedCircle = null; // Stores the first selected circle (the connection source)

// =========================================================================
// ======================= Layout & Background =============================
// =========================================================================

// --- Responsiveness ---
function windowResized() {
    let size = min(windowWidth, windowHeight);
    resizeCanvas(size, size);
    // Regenerate dots to fit new canvas size
    backgroundDots = [];
    generateBackgroundDots();
    draw(); 
}

// --- Background texture: dense random scattered white dots ---
/*
    This background texture uses probabilistic dot density to distribute thousands of 
    semi-transparent white dots across the canvas. 
*/

// Generates dot data once and stores it in the backgroundDots array.
function generateBackgroundDots() {
    let density = 0.004;  // Controls how many dots per pixel area.
    let numDots = floor(width * height * density);  // Calculate the total number of dots.
    for (let i = 0; i < numDots; i++) {
        let x = random(width); // Random x position
        let y = random(height); // Random y position
        let dotSize = random(width * 0.002, width * 0.005); // Set dot size relative to canvas width
        let alpha = random(100, 200);   // We want the dots have different opacity, so they look like shining stars!
        let speed = random(0.0005, 0.002); // each dot shining individually, because it has different pulse speed.
        backgroundDots.push({ x: x, y: y, dotSize: dotSize, alpha: alpha , speed: speed});
        // once it is randomized, it will be stored to avoid flicker.
    }
}

// Draws the pre-calculated dots from the array.
// I also use millis combined with sin and map to make the dots look like twinkling.
function drawBackgroundDots() {
    push();
    noStroke();
    let pulse; // change the alpha value of the dot to make it look like shining.
    
    for (let dot of backgroundDots) { // iterate through each dot to draw it.
        pulse = sin(millis() * dot.speed); // shining smoothly
        pulse = map(pulse, -1, 1, 0.2, 1);
        fill(255, 255, 255, dot.alpha*pulse);  // Pure white, varying opacity
        ellipse(dot.x, dot.y, dot.dotSize);
    }
    pop();
}

// --- New function to draw connections (Individual Work) ---
// This function draws the lines based on the user-created 'connections' array.
// (Individual Work) I change the line color to white and make it thinner.
function drawRoads() {
    let linkColor = color(255,255,255); 
    // Use push/pop to isolate style settings for lines
    push(); 
    stroke(linkColor);
    strokeWeight(4);  // Fixed wide width
    strokeCap(ROUND); 
    // strokeCap(ROUND) sets rounded line endings for smoother, organic-looking connectors.
    // From the p5.js reference: https://p5js.org/reference/p5/strokeCap/
    // Iterate over all stored connections
    for (let conn of connections) {
        line(conn.from.x, conn.from.y, conn.to.x, conn.to.y); 
    }
    pop();
}

// =========================================================================
// ======================= Interaction Logic (Individual Work) =============
// =========================================================================
// isSelected (attribute of Circle class) and selectedCircle will update according to variable selectedCircle.
// clickedCircle will always update first.

// 1. Click empty space -> Create a new, unselected circle.
// 2. Click an unselected circle -> Select it as 'source' (it breathes).
// 3. Click a second circle -> Create a connection, evolve both,
//    and make the new circle breathe. The second circle becomes the new 'source'.
// 4. Click the same circle twice -> Deselect it.

function mouseClicked() {
    let clickedCircle = null; // Stores the circle clicked in this frame

    // Check if we clicked an existing circle
    for (let c of circles) { // iterate through each circle
        if (c.isClicked(mouseX, mouseY)) {
            clickedCircle = c; // store the clicked circle
            break; // Found it
        }
    }

    if (clickedCircle) {
        // --- If we click an existing circle ---
        
        if (selectedCircle) {
            // We already have a circle selected (it's the 'from')
            if (clickedCircle === selectedCircle) {
                // User clicked the same circle again: Deselect it
                clickedCircle.isSelected = false;
                selectedCircle = null;
            } else {
                // User clicked a different circle: Create connection!
                connections.push({ from: selectedCircle, to: clickedCircle });
                
                // Evolve both circles involved in the connection
                selectedCircle.addConnection();
                clickedCircle.addConnection();
                
                // Deselect all circles except the newly clicked one
                for(let c of circles) {
                    c.isSelected = (c === clickedCircle);
                }
                
                // Make the new circle the active source for the next connection
                selectedCircle = clickedCircle;
            }
        } else {
            // This is the first circle being selected in a chain
           for(let c of circles) {
                c.isSelected = (c === clickedCircle); // Select only this one
            }
            selectedCircle = clickedCircle;
        }

    } else {
        // --- If we click on empty space ---
        
        // Deselect all circles
        for (let c of circles) {
            c.isSelected = false;
        }
        selectedCircle = null; // Clear the connection source

        // Create the new circle
        let r = width / 8; 
        let newCircle = new Circle(mouseX, mouseY, r); // create at mouse position

        newCircle.showInner = true; // Activate it
        // Set random properties once
        newCircle.innerPatternType = floor(random(2));
        newCircle.innerBaseColor = random(circleBasePalette);
        newCircle.innerPatternColor = random(patternPalette);
        circles.push(newCircle);
    }
}

// ======================================================================
// ======================== CIRCLE CLASS ================================
// ======================================================================
// The Circle class encapsulates all logic for drawing a single circular
// motif. Each Circle instance stores its position, radius, and randomly
// chosen pattern types for the outer, middle, and inner layers. The class
// provides a display() method that renders the circle as a three-layer
// structure (buffer, outer, middle, inner) using a variety of generative
// pattern functions.

// (Individual Work Comments):
// I add addConnection() to update the connection count and show pattern accordingly.
// I add connectionCount to track the number of connections.

class Circle {
/*
    Each Circle object randomly selects pattern types for its outer, middle,
    and inner layers. This modular structure expands on OOP techniques,
    enabling controlled variation through generative rules.
*/
    constructor(x, y, r) {
        this.x = x;
        this.y = y;
        this.r = r; 
        
    // --- State Variables (Individual Work) ---
        this.showMiddle = false;  // if show the middle pattern
        this.showOuter = false; // New state for max evolution
        this.isSelected = false; // for breathing animation
        this.connectionCount = 0; // for evolution
        
        // --- Inner Pattern Properties (for flicker-free draw) ---
        this.innerPatternType = 0;
        this.innerBaseColor = color(0);
        this.innerPatternColor = color(255);
        
        // --- Middle Pattern Properties ---
        this.middlePatternType = floor(random(4));
        this.middleBaseColor = color(0);
        this.middlePatternColor = color(255);
        
        // --- Outer Pattern Properties ---
        this.outerPatternType = floor(random(4)); 
        this.outerBaseColor = color(0);
        this.outerPatternColor = color(255);
        
        // use the seed to generate the same pattern to avoid flickering.
        this.seed = random(1000000); // ref:https://p5js.org/reference/p5/randomSeed/
    }

    // (Individual Work)
    // check if the mouse is clicked on the circle using the distance
    // if the clicked distance is smaller than the radius, then it is clicked.
    isClicked(mx, my) {
        let d = dist(mx, my, this.x, this.y);
        return (d < this.r * 0.7); 
    }

    // (Individual Work)
    // Called when a connection is made to this circle
    addConnection() {
        this.connectionCount++; // Increment
        
        if (this.connectionCount === 1) {
            // First connection: activate middle layer
            this.showMiddle = true;
            // Set colors once
            this.middleBaseColor = random(circleBasePalette);
            this.middlePatternColor = random(patternPalette);
            
        } else if (this.connectionCount === 2) {
            // Second connection: activate outer layer
            this.showOuter = true;
            // Set colors once
            this.outerBaseColor = random(circleBasePalette);
            this.outerPatternColor = random(patternPalette);
        
        } else if (this.connectionCount > 2) {
            // Subsequent connections: refresh all patterns
            this.refreshPatterns();
        }
    }
    // randomize all properties
        refreshPatterns() {
        // Re-randomize seed for new shapes
        this.seed = random(1000000); 
        
        // Re-randomize types
        this.outerPatternType = floor(random(4));
        this.middlePatternType = floor(random(4));
        this.innerPatternType = floor(random(2));
        
        // Re-randomize all colors
        this.outerBaseColor = random(circleBasePalette);
        this.outerPatternColor = random(patternPalette);
        this.middleBaseColor = random(circleBasePalette);
        this.middlePatternColor = random(patternPalette);
        this.innerBaseColor = random(circleBasePalette);
        this.innerPatternColor = random(patternPalette);
    }

    // --- Main Display Method ---
    display() {

        // from the official p5.js reference: https://p5js.org/reference/p5/randomSeed/
        randomSeed(this.seed); // This makes all random() calls stable
       
        // Uses push/pop/translate to simplify drawing coordinates (relative to center 0,0)
        push(); 
        // 1. Move origin to the circle's center
        translate(this.x, this.y); 
        // Rotate animation
        // the rotation speed is related to the connection count
        // the more connection count, the faster the rotation speed
        rotate(frameCount * 0.01 * (this.connectionCount+ 1)); 

        //The glow effect code are generated by AI
        // It adds a glow effect, so the circles looks like celestial bodies.
        // Use the brightest pattern color for the glow
         
        drawingContext.shadowBlur = 60;
        drawingContext.shadowColor = this.innerBaseColor;

        // I want scale the circle, so It won't overlap with other circles
        if(this.connectionCount <=2){
          if(this.connectionCount == 0) { //do nothing
          }
          else if(this.connectionCount == 1 ){
            scale(0.75);
          }
          else if(this.connectionCount == 2) {
            scale(0.6);
          }
        }
        else{
          scale(0.6);
        } 
        // (Individual) If the circle is selected, apply a "breathing" scale animation
        if (this.isSelected) { 
            // from the official p5.js reference: https://p5js.org/reference/p5/millis/
            let pulse = sin(millis() * 0.005); // Oscillates smoothly
            let scaleFactor = map(pulse, -1, 1, 1.0, 1.15); // The range of sin is -1 to 1, map it to scale range
            scale(scaleFactor); // Apply scaling
        }
        // 2. Draw Patterns
        if (this.showOuter) {
            this.displayOuterPattern();
        }
        if (this.showMiddle) {
            this.displayMiddlePattern();
        }
        this.displayInnerPattern();  

        drawingContext.shadowBlur = 0;
        
        pop(); // only scale the selected circle
    }
// --- Drawing Utilities (Helpers) ---
    /*
        Many of the custom shapes in this sketch use beginShape() together with
        curveVertex() to build smooth, organic outlines instead of perfect geometric primitives. 
        This technique was not fully covered in class and is adapted from the official p5.js reference:
            - beginShape(): https://p5js.org/reference/p5/beginShape/
            - curveVertex(): https://p5js.org/reference/p5/curveVertex/
        By adding small random jitter to the radii of points before calling
        curveVertex(), we simulate hand-drawn contours and irregular blobs.
    */

    //  beginShape() + curveVertex()： draw a small, irregular dot shape at a given radial offset and angle.
    //  rotate(random(TWO_PI));is removed to avoid flicker
    drawIrregularBlob(rOffset, angle, size, col) { //no random rotation now
    //  Calculate position based on polar coordinates
        let x = cos(angle) * rOffset;
        let y = sin(angle) * rOffset;
        fill(col);
        noStroke();
        push();
        translate(x, y); 
        beginShape();
        let points = 8;  
        for (let i = 0; i <= points; i++) { // Use <= to close curve
            let a = TWO_PI / points * i;
        // Jitter the radius of the dot itself
            let r = size * 0.5 * random(0.85, 1.15); // This random() is stable
            curveVertex(cos(a) * r, sin(a) * r); 
        }
        endShape(CLOSE);
        pop();
    }
    // larger version of drawIrregularBlob() used to draw big circular motifs
    drawHandDrawnCircle(r, fillCol, strokeCol, strokeW) {
    //  draws a large base circle with a slightly jittered radius, 
    //  beginShape() + curveVertex(): described above to create an organic, hand-drawn outline.
    // This function can be used to draw circles both with fill and without fill.
        if (fillCol) fill(fillCol); else noFill();
        if (strokeCol) stroke(strokeCol); else noStroke();
        if (strokeW) strokeWeight(strokeW);
        beginShape();
        let points = 50;  
        //  if the number of points is too small, the circle will look like a polygon.
        //  if the number of points is too big, the circle will look too perfect!
        for (let i = 0; i <= points; i++) {
            let angle = (TWO_PI / points) * i;
            let jitter = random(-r * 0.02, r * 0.02); // This random() is stable
            let radius = r + jitter;
            curveVertex(cos(angle) * radius, sin(angle) * radius);
        }
        endShape(CLOSE);
    }
  // ================= OUTER PATTERNS =================
    
    //  Use stored colors
    displayOuterPattern() {
        //  we want random color to increase the diversity... (Individual: color is stored)
        this.drawHandDrawnCircle(this.r, this.outerBaseColor, color(0, 50), 2);
        let patCol = this.outerPatternColor;

        //  draw the outer pattern based on the pattern type
        switch (this.outerPatternType) {
            case 0: this.drawOuterDotsPattern(patCol); break;
            case 1: this.drawOuterRadiatingLinesPattern(patCol); break;
            case 2: this.drawOuterStripedRingPattern(patCol); break;
            case 3: this.drawOuterRadialDashPattern(patCol); break; 
        }
    }

    //  Pattern 0: Irregular Dots Ring
    drawOuterDotsPattern(col) {
        let dotSize = this.r * 0.07;  
        let dotSpacing = this.r * 0.09; 
        //  the dots ring starts from a radius of 0.65 times the radius of the circle
        //  and will end at 0.95 times the radius of the circle
        for (let radius = this.r * 0.65; radius < this.r * 0.95; radius += dotSpacing) { 
            let count = floor((TWO_PI * radius) / dotSpacing); //  calculate the number of dots
            //  so the density of dots on each circle is identical
            for (let i = 0; i < count; i++) {  // (Group) draw dots ring
                let angle = (TWO_PI / count) * i;
                this.drawIrregularBlob(radius, angle, dotSize, col);
            }
        }
    }
    
    //  Pattern 1: Radiating Lines (Sunburst)
    //  Uses rotate() to simplify drawing lines radiating from center
    drawOuterRadiatingLinesPattern(col) {
        let numLines = 40;
        stroke(col);
        strokeWeight(this.r * 0.015);
        strokeCap(ROUND);
        
        for (let i = 0; i < numLines; i++) {
            let angle = (TWO_PI / numLines) * i + random(-0.05, 0.05); //  add random jitter
            push(); 
            rotate(angle); //  Rotate context
            //  Draw line along the X-axis
            line(this.r * 0.6, 0, this.r * 0.95, 0);
            //  Draw dot at the tip
            this.drawIrregularBlob(this.r * 0.95, 0, this.r * 0.03, col); 
            pop(); 
        }
    }
    
    //  Pattern 2: Striped Ring
    drawOuterStripedRingPattern(col) {
        noFill();
        stroke(col);
        let baseStrokeWeight = this.r * 0.025; 
        let numRings = 2;  //  we only want 2 rings to make the pattern look more brief
        for (let i = 0; i < numRings; i++) {
            let radius = map(i, 0, numRings - 1, this.r * 0.65, this.r * 0.9);
            //  The map() function scales a value from one range to another.
            //  Here, it takes the loop counter 'i' (which goes from 0 to numRings - 1)
            //  and converts it to a corresponding radius value.
            strokeWeight(baseStrokeWeight * random(0.8, 1.2)); 
            this.drawHandDrawnCircle(radius, null, col, null);
            //  Because we don't want a circle with fill, we pass 'null' for fillCol.
        }
    }
    
    //  Pattern 3: Radial Dash (Sine Wave Spring)
    //  Uses sin() to create a continuous wavy circumference
    //  This pattern also relies on beginShape() + curveVertex()
    drawOuterRadialDashPattern(col) {
        noFill(); 
        stroke(col); 
        strokeWeight(this.r * 0.025);
        let baseRadius = this.r * 0.73;
        let waveHeight = baseRadius * 0.30;
        //  waveHeight is the amplitude
        let waveFrequency = 60;
        //  waveFrequency controls how many full oscillations
        let totalPoints = 240;   
        //  totalPoints determines the smoothness (resolution)
        
        beginShape();
        for (let j = 0; j <= totalPoints; j++) {
            let angle = (TWO_PI / totalPoints) * j;
            let offset = sin(angle * waveFrequency) * waveHeight;
            let finalRadius = baseRadius + offset;
            finalRadius += random(-this.r * 0.005, this.r * 0.005);
            curveVertex(cos(angle) * finalRadius, sin(angle) * finalRadius);
        }
        endShape(CLOSE); 
    }
    
    // ================= MIDDLE PATTERNS  =================
    
    // (Individual) Use stored colors
    displayMiddlePattern() {
        this.drawHandDrawnCircle(this.r * 0.55, this.middleBaseColor, null, 0);
        let patCol = this.middlePatternColor;

        switch (this.middlePatternType) {
            case 0: this.drawMiddleConcentricDotsPattern(patCol); break;
            case 1: this.drawMiddleUshapePattern(patCol); break;
            case 2: this.drawMiddleSolidRings(patCol); break;
            case 3: this.drawMiddleConcentricRings(patCol); break; 
        }
    }

    //  Pattern 0: Concentric Dots
    drawMiddleConcentricDotsPattern(col) {
        let dotSize = this.r * 0.04;
        for (let r = this.r * 0.2; r < this.r * 0.5; r += dotSize * 1.5) {
            let count = floor((TWO_PI * r) / (dotSize * 1.5));
            for (let i = 0; i < count; i++) {
                let angle = (TWO_PI / count) * i;
                this.drawIrregularBlob(r, angle, dotSize, col);
            }
        }
    }
    
    //  Pattern 1: U-Shape Symbols
    //  Represents a person sitting in Indigenous art
    drawMiddleUshapePattern(col) {
        noFill();
        stroke(col);
        strokeWeight(this.r * 0.02);
        let count = 8; //  The total number of U-shapes to draw.
        let r = this.r * 0.35; //  The radius of the orbit
    
        for (let i = 0; i < count; i++) {
            let angle = (TWO_PI / count) * i;
            //  Calculate the angle for this specific shape's position
            push();
            rotate(angle); 
            translate(r, 0); 
            rotate(PI/2); 
            //  arc() draws a semicircle from angle 0 to PI (180 degrees)
            arc(0, 0, this.r*0.15, this.r*0.15, 0, PI); 
            pop();
        }
    }
    
    //  Pattern 2: Solid Rings
    drawMiddleSolidRings(col) {
        this.drawHandDrawnCircle(this.r * 0.45, col, null, 0);
        let col2 = random(patternPalette); // This random() is stable
        this.drawHandDrawnCircle(this.r * 0.3, col2, null, 0);
    }
    
    //  Pattern 3: Concentric Rings
    drawMiddleConcentricRings(col) {
        noFill();
        stroke(col);
        let baseStrokeWeight = this.r * 0.01; 
        let numRings = 5;  //  The total number of concentric rings
        for (let j = 0; j < numRings; j++) {
            let currentRadius = map(j, 0, numRings - 1, this.r * 0.3, this.r * 0.5);
            strokeWeight(baseStrokeWeight * random(0.8, 1.2)); // This random() is stable
            //  Use drawHandDrawnCircle for consistency
            this.drawHandDrawnCircle(currentRadius, null, col, null);
        }
    }

    // ================= INNER PATTERNS =================
    displayInnerPattern() {
   
        this.drawHandDrawnCircle(this.r * 0.25, this.innerBaseColor, null, 0);
        let patCol = this.innerPatternColor;
        
        if (this.innerPatternType === 0) {
            //  Simple large blob (Center Eye)
            this.drawIrregularBlob(0, 0, this.r * 0.15, patCol); //  0,0 is center
        } else {
            //  Spiral Line
            noFill();
            stroke(patCol);
            strokeWeight(this.r * 0.015);
            //  Here we again use beginShape() + curveVertex() to build a spiral-like
            //  path, applying the same hand-drawn curve technique.
            beginShape();
            for (let i = 0; i < 50; i++) {
                let r = map(i, 0, 50, 0, this.r * 0.2);
                let angle = i * 0.4;
                curveVertex(cos(angle)*r, sin(angle)*r);
            }
            endShape();
        }
    }
} 
// ======================================================================
// ======================== SETUP & DRAW ================================
// ======================================================================

function setup() {
    //  Use min dimension to ensure square aspect ratio fits screen
    let size = min(windowWidth, windowHeight);
    createCanvas(size, size);
    
    //  pixelDensity() was not covered in class. 
    //  It comes from the p5.js reference: https://p5js.org/reference/p5/pixelDensity/
    //  It increases the device pixel ratio so the artwork renders more sharply on high-DPI/Retina screens.
    pixelDensity(2); // For high-DPI/Retina screens

    // --- 1. Colour palette system (Aboriginal-inspired style) ---
    globalBgColor = color(30, 20, 15); // (Group) Deep, dark earth background
    
    circleBasePalette = [
        color(90, 40, 20),   // (Red Ochre)
        color(60, 30, 15),   // (Deep Earth)
        color(40, 45, 35),   // (Bush Green)
        color(110, 60, 30),  // (Burnt Orange)
        color(20, 20, 20)    // (Charcoal)
    ];
    
    patternPalette = [
        color(255, 255, 255), // (Ceremony White) 
        color(255, 240, 200), // (Cream)
        color(255, 215, 0),   // (Sun Yellow)
        color(255, 140, 80),  // (Bright Ochre)
        color(160, 180, 140), // (Sage)
        color(200, 200, 210)  // (Ash)
   ];
    
    // --- 2. Generate static background dots (Individual Work) ---
    generateBackgroundDots();
}

function draw() {
    background(globalBgColor); 
    
     // 1. Background Texture (flicker-free)
    //  Draw random white dots that fill the canvas
    drawBackgroundDots();
    
    // 2. Connection Layer (Roads)
    //  Draw wide network lines between selected circle centres
    //  Rendered BEFORE circles so lines appear to go *under* them
    drawRoads(); 

    // 3. Main Circle Layer
    //  Iterate through all circle objects and call their display method
    for (let c of circles) {
        c.display();
    }
    
    // (Individual Work) noLoop() is removed to allow for
    // animation (breathing) and interaction.
}