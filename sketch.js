// This is the final version.
// It adds multi-stage evolution.

// ToDoList: 
// 1.Click to select [✔] 
// 2.Selected Circle will breath. [✔]
// 3.Click two circles to connect them with a line. [✔]
// 4.Connected circles will evolve and show a middle pattern. [✔]
// 5.Connected twice to show the outer pattern. [✔]


// =======================================================================
// ======================== Global Variables =============================
// =======================================================================

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

function windowResized() {
    let size = min(windowWidth, windowHeight);
    resizeCanvas(size, size);
    // Regenerate dots to fit new canvas size
    backgroundDots = [];
    generateBackgroundDots();
    draw(); 
}

// --- Background texture: dense random scattered white dots ---

// Generates dot data once and stores it in the backgroundDots array.
function generateBackgroundDots() {
    let density = 0.004; 
    let numDots = floor(width * height * density); 
    for (let i = 0; i < numDots; i++) {
        let x = random(width);
        let y = random(height);
        let dotSize = random(width * 0.002, width * 0.005);
        let alpha = random(100, 200);  
        backgroundDots.push({ x: x, y: y, dotSize: dotSize, alpha: alpha });
        // once it is randomized, it will be stored to avoid flicker.
    }
}

// Draws the pre-calculated dots from the array.
function drawBackgroundDots() {
    push();
    noStroke();
    for (let dot of backgroundDots) { // iterate through each dot to draw it.
        fill(255, 255, 255, dot.alpha); 
        ellipse(dot.x, dot.y, dot.dotSize);
    }
    pop();
}

// --- New function to draw connections ---
function drawRoads() {
    let linkColor = color(240, 230, 200, 180); 
    push(); 
    stroke(linkColor);
    strokeWeight(10); 
    strokeCap(ROUND); 

    // Iterate over all stored connections
    for (let conn of connections) {
        line(conn.from.x, conn.from.y, conn.to.x, conn.to.y); 
    }
    pop();
}

// =========================================================================
// ======================= Interaction Logic ===============================
// =========================================================================
// isSelected (attribute of Circle class) and selectedCircle will update according to variable selectedCircle.
// clickedCircle will always update first.

// 1. Click empty space -> Create a new, unselected circle.
// 2. Click an unselected circle -> Select it as 'source' (it breathes).
// 3. Click a second circle -> Create a connection, evolve both,
//    and make the new circle breathe. The second circle becomes the new 'source'.
// 4. Click the same circle twice -> Deselect it.

function mouseClicked() {
    let clickedCircle = null; // Stores the circle clicked in *this* frame

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
// I add addConnection() to update the connection count and show pattern accordingly.
// I add connectionCount to track the number of connections.

class Circle {
    constructor(x, y, r) {
        this.x = x;
        this.y = y;
        this.r = r; 
        
        // --- State Variables ---
        this.showInner = false; // if show the inner pattern
        this.showMiddle = false; 
        this.showOuter = false; // New state for max evolution
        this.isSelected = false; // for breathing animation
        this.connectionCount = 0; // for evolution
        
        // --- Inner Pattern Properties (for flicker-free draw) ---
        this.innerPatternType = 0;
        this.innerBaseColor = color(0);
        this.innerPatternColor = color(255);
        
        // --- Middle Pattern Properties (for flicker-free draw) ---
        this.middlePatternType = floor(random(4));
        this.middleBaseColor = color(0);
        this.middlePatternColor = color(255);
        
        // --- Outer Pattern Properties (for flicker-free draw) ---
        this.outerPatternType = floor(random(4)); 
        this.outerBaseColor = color(0);
        this.outerPatternColor = color(255);
        
        // use the seed to generate the same pattern to avoid flickering.
        this.seed = random(1000000);
    }

    // check if the mouse is clicked on the circle using the distance
    // if the clicked distance is smaller than the radius, then it is clicked.
    isClicked(mx, my) {
        let d = dist(mx, my, this.x, this.y);
        return (d < this.r); 
    }

    // Called when a connection is made
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
        if (!this.showInner) return;
        
        // from the official p5.js reference: https://p5js.org/reference/p5/randomSeed/
        randomSeed(this.seed); // This makes all random() calls stable
        
        push(); 
        translate(this.x, this.y); 
        
        // If the circle is selected, apply a "breathing" scale animation
        if (this.isSelected) { 
            // from the official p5.js reference: https://p5js.org/reference/p5/millis/
            let pulse = sin(millis() * 0.005); // Oscillates smoothly
            let scaleFactor = map(pulse, -1, 1, 1.0, 1.15); // Map to scale range
            scale(scaleFactor); // Apply scaling
        }
        
        // --- New Layering Logic (Outer -> Middle -> Inner) ---
        if (this.showOuter) {
            this.displayOuterPattern();
        }
        if (this.showMiddle) {
            this.displayMiddlePattern();
        }
        this.displayInnerPattern();  
        
        pop(); // only scale the selected circle
    }

    // --- Drawing Utilities ---
    drawIrregularBlob(rOffset, angle, size, col) { //no random rotation now
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
            let r = size * 0.5 * random(0.85, 1.15); // This random() is stable
            curveVertex(cos(a) * r, sin(a) * r); 
        }
        endShape(CLOSE);
        pop();
    }
    drawHandDrawnCircle(r, fillCol, strokeCol, strokeW) {
        if (fillCol) fill(fillCol); else noFill();
        if (strokeCol) stroke(strokeCol); else noStroke();
        if (strokeW) strokeWeight(strokeW);
        beginShape();
        let points = 50;  
        for (let i = 0; i <= points; i++) {
            let angle = (TWO_PI / points) * i;
            let jitter = random(-r * 0.01, r * 0.01); // This random() is stable
            let radius = r + jitter;
            curveVertex(cos(angle) * radius, sin(angle) * radius);
        }
        endShape(CLOSE);
    }
    // ================= OUTER PATTERNS =================
    
    // Use stored colors
    displayOuterPattern() {
        this.drawHandDrawnCircle(this.r, this.outerBaseColor, color(0, 50), 2);
        let patCol = this.outerPatternColor;

        switch (this.outerPatternType) {
            case 0: this.drawOuterDotsPattern(patCol); break;
            case 1: this.drawOuterRadiatingLinesPattern(patCol); break;
            case 2: this.drawOuterStripedRingPattern(patCol); break;
            case 3: this.drawOuterRadialDashPattern(patCol); break; 
        }
    }

    drawOuterDotsPattern(col) {
        let dotSize = this.r * 0.07;  
        let dotSpacing = this.r * 0.09; 
        for (let radius = this.r * 0.65; radius < this.r * 0.95; radius += dotSpacing) { 
            let count = floor((TWO_PI * radius) / dotSpacing); 
            for (let i = 0; i < count; i++) {  
                let angle = (TWO_PI / count) * i;
                this.drawIrregularBlob(radius, angle, dotSize, col);
            }
        }
    }
    drawOuterRadiatingLinesPattern(col) {
        let numLines = 40;
        stroke(col);
        strokeWeight(this.r * 0.015);
        strokeCap(ROUND);
        
        for (let i = 0; i < numLines; i++) {
            let angle = (TWO_PI / numLines) * i + random(-0.05, 0.05); 
            push(); 
            rotate(angle); 
            line(this.r * 0.6, 0, this.r * 0.95, 0);
            this.drawIrregularBlob(this.r * 0.95, 0, this.r * 0.03, col); 
            pop(); 
        }
    }
    drawOuterStripedRingPattern(col) {
        noFill();
        stroke(col);
        let baseStrokeWeight = this.r * 0.025; 
        let numRings = 2;  
        for (let i = 0; i < numRings; i++) {
            let radius = map(i, 0, numRings - 1, this.r * 0.65, this.r * 0.9);
            strokeWeight(baseStrokeWeight * random(0.8, 1.2)); 
            this.drawHandDrawnCircle(radius, null, col, null);
   }
    }
    drawOuterRadialDashPattern(col) {
        noFill(); 
        stroke(col); 
        strokeWeight(this.r * 0.025);
        let baseRadius = this.r * 0.73;
        let waveHeight = baseRadius * 0.30;
        let waveFrequency = 60;
        let totalPoints = 240;   
        
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
    
    // ================= MIDDLE PATTERNS  =================
    
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
    drawMiddleUshapePattern(col) {
        noFill();
        stroke(col);
        strokeWeight(this.r * 0.02);
        let count = 8; 
        let r = this.r * 0.35; 
    
        for (let i = 0; i < count; i++) {
            let angle = (TWO_PI / count) * i;
            push();
            rotate(angle); 
            translate(r, 0); 
            rotate(PI/2); 
            arc(0, 0, this.r*0.15, this.r*0.15, 0, PI); 
            pop();
        }
    }
    drawMiddleSolidRings(col) {
        this.drawHandDrawnCircle(this.r * 0.45, col, null, 0);
        let col2 = random(patternPalette); // This random() is stable
        this.drawHandDrawnCircle(this.r * 0.3, col2, null, 0);
    }
    drawMiddleConcentricRings(col) {
        noFill();
        stroke(col);
        let baseStrokeWeight = this.r * 0.01; 
        let numRings = 5;  
        for (let j = 0; j < numRings; j++) {
            let currentRadius = map(j, 0, numRings - 1, this.r * 0.3, this.r * 0.5);
            strokeWeight(baseStrokeWeight * random(0.8, 1.2)); // This random() is stable
            this.drawHandDrawnCircle(currentRadius, null, col, null);
        }
    }

    // ================= INNER PATTERNS =================
    displayInnerPattern() {
        // Use stored colors (set on click)
        this.drawHandDrawnCircle(this.r * 0.25, this.innerBaseColor, null, 0);
        let patCol = this.innerPatternColor;
        
        if (this.innerPatternType === 0) {
       // Simple large blob (Center Eye)
            this.drawIrregularBlob(0, 0, this.r * 0.15, patCol); 
        } else {
            // Spiral Line
            noFill();
            stroke(patCol);
            strokeWeight(this.r * 0.015);
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
    let size = min(windowWidth, windowHeight);
    createCanvas(size, size);
    pixelDensity(2); // For high-DPI/Retina screens

    // --- 1. Colour palette system ---
    globalBgColor = color(30, 20, 15);
    circleBasePalette = [
        color(90, 40, 20),   // (Red Ochre)
        color(60, 30, 15),   // (Deep Earth)
        color(40, 45, 35),   // (Bush Green)
        color(110, 60, 30),  // (Burnt Orange)
        color(20, 20, 20)    // (Charcoal)
    ];
    patternPalette = [
        color(255, 255, 255), // (Ceremony White)         color(255, 240, 200), // (Cream)
        color(255, 215, 0),   // (Sun Yellow)
        color(255, 140, 80),  // (Bright Ochre)
        color(160, 180, 140), // (Sage)
        color(200, 200, 210)  // (Ash)
   ];
    
    // --- 2. Generate static background dots ---
    generateBackgroundDots();
}

function draw() {
    background(globalBgColor); 
    
     // 1. Background Texture (flicker-free)
    drawBackgroundDots();
    
    // 2. Connection Layer (Roads)
    // (Drawn before circles so they appear underneath)
    drawRoads(); 

    // 3. Main Circle Layer
    for (let c of circles) {
        c.display();
    }
}