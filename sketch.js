// This version adds connections and evolution.
// Clicking empty space creates a new circle.
// Clicking an existing circle selects it (it animates).
// Clicking a second circle creates a "road" between it and the first,
// and both circles "evolve" by revealing their middle pattern.
//
// ToDoList: 
// 1.Click to select [✔] 
// 2.Selected Circle will breath. [✔]
// 3.Click two circles to connect them with a line. [✔]
// 4.Connected circles will evolve and show a middle pattern. [✔]
// 5. Connected twice to show the outer pattern. []
// 6. Two circles breath. [] 

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
    let linkColor = color(240, 230, 200, 180); // Creamy color
    push(); 
    stroke(linkColor);
    strokeWeight(10); 
    strokeCap(ROUND); 

    for (let conn of connections) {
        line(conn.from.x, conn.from.y, conn.to.x, conn.to.y); 
    }
    pop();
}

// =========================================================================
// ======================= Interaction Logic ===============================
// =========================================================================

function mouseClicked() {
    let clickedCircle = null; // Stores the circle clicked in *this* frame

    // 1. Check if we clicked an EXISTING circle
    for (let c of circles) { // iterate through each circle to check if it is clicked.
        if (c.isClicked(mouseX, mouseY)) {
            clickedCircle = c; // Store the circle that was clicked
            break; // Found it
        }
    }

    // Deselect all circles first (for animation state)
    for (let c of circles) {
        c.isSelected = false;
    }

    if (clickedCircle) {
        // --- LOGIC A: WE CLICKED AN EXISTING CIRCLE ---
        
        if (selectedCircle) {
            // We ALREADY have a circle selected (it's the 'from')
            
            if (clickedCircle === selectedCircle) {
                // User clicked the same circle again: Deselect it
                selectedCircle.isSelected = false;
                selectedCircle = null;
            } else {
                // User clicked a DIFFERENT circle: Create connection!
                connections.push({ from: selectedCircle, to: clickedCircle });
                
                // --- EVOLUTION LOGIC ---
                // Set both circles to show their middle pattern
                selectedCircle.showMiddle = true;
                clickedCircle.showMiddle = true;
                
                // Set their middle colors once to prevent flicker
                selectedCircle.middleBaseColor = random(circleBasePalette);
                selectedCircle.middlePatternColor = random(patternPalette);
                clickedCircle.middleBaseColor = random(circleBasePalette);
                clickedCircle.middlePatternColor = random(patternPalette);
                // --- END EVOLUTION LOGIC ---
                
                // Make the new circle the active one (for chaining)
                clickedCircle.isSelected = true;
                selectedCircle = clickedCircle;
            }
        } else {
            // This is the FIRST circle being selected
            clickedCircle.isSelected = true;
            selectedCircle = clickedCircle;
        }

    } else {
        // --- LOGIC B: WE CLICKED ON EMPTY SPACE ---
        
        // 1. Create the new circle
        let r = width / 8; // Base radius unit
        let newCircle = new Circle(mouseX, mouseY, r); // create circle at the mouse position.

        // 2. Activate it and set its properties
        newCircle.showInner = true; 
        newCircle.innerPatternType = floor(random(2));
        newCircle.innerBaseColor = random(circleBasePalette);
        newCircle.innerPatternColor = random(patternPalette);
        newCircle.isSelected = false; 
        selectedCircle = newCircle; // It is now the source
        
        // 3. Add it to the array
        circles.push(newCircle);
    }
}


// ======================================================================
// ======================== CIRCLE CLASS ================================
// ======================================================================

class Circle {
    constructor(x, y, r) {
        this.x = x;
        this.y = y;
        this.r = r; 
        
        // --- State Variables ---
        this.showInner = false; // if show the inner pattern
        this.showMiddle = false; // New state for evolution
        this.isSelected = false; // for breathing animation
        
        // --- Inner Pattern Properties (for flicker-free draw) ---
        this.innerPatternType = 0;
        this.innerBaseColor = color(0);
        this.innerPatternColor = color(255);
        
        // --- Middle Pattern Properties (for flicker-free draw) ---
        this.middlePatternType = floor(random(4)); // Pre-select type
        this.middleBaseColor = color(0);
        this.middlePatternColor = color(255);
        
        // --- Outer Pattern Properties (for future use) ---
        this.outerPatternType = floor(random(4)); 
        
        // use the seed to generate the same pattern to avoid flickering.
        this.seed = random(1000000);
    }

    // check if the mouse is clicked on the circle using the distance
    isClicked(mx, my) {
        let d = dist(mx, my, this.x, this.y);
        return (d < this.r); 
    }

    // --- Main Display Method ---
    display() {
        if (!this.showInner) {
            return; // Do not draw if inactive
        }
        
        // from the official p5.js reference: https://p5js.org/reference/p5/randomSeed/
        randomSeed(this.seed); // This makes all random() calls stable
        
        push(); 
        translate(this.x, this.y); 
        
        // If the circle is selected, apply a "breathing" scale animation
        if (this.isSelected) {
            // from the official p5.js reference: https://p5js.org/reference/p5/millis/
            let pulse = sin(millis() * 0.005); // Oscillates smoothly over time.
            let scaleFactor = map(pulse, -1, 1, 1.0, 1.15); // Map sine wave to scale range
            scale(scaleFactor); // Apply scaling transformation
        }
        
        // --- New Layering Logic ---
        // Draw middle layer first (if active)
        if (this.showMiddle) {
            this.displayMiddlePattern();
        }
        // Draw inner layer on top
        this.displayInnerPattern();  
        
        pop(); // only scale the selected circle, because of push and pop.
    }

    // --- Drawing Utilities (Helpers) ---
    drawIrregularBlob(rOffset, angle, size, col) { //no random rotation now to avoid flickering.
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
    // (drawHandDrawnEllipse is unused)
    drawHandDrawnEllipse(rOffset, angle, w, h, rotation, col) { /* ... */ }

    // ================= (Outer Pattern functions, currently unused) =================
    displayOuterPattern() { /* ... */ }
    // ...
    
    // ================= MIDDLE PATTERNS (Restored) =================
    
    // This function is now flicker-free, using stored colors
    displayMiddlePattern() {
        // Use stored colors
        this.drawHandDrawnCircle(this.r * 0.55, this.middleBaseColor, null, 0);
        let patCol = this.middlePatternColor;

        // randomSeed() in display() ensures these patterns are stable
        switch (this.middlePatternType) {
            case 0: this.drawMiddleConcentricDotsPattern(patCol); break;
            case 1: this.drawMiddleUshapePattern(patCol); break;
            case 2: this.drawMiddleSolidRings(patCol); break;
            case 3: this.drawMiddleConcentricRings(patCol); break; 
        }
    }

  // Pattern 0: Concentric Dots
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

    // Pattern 1: U-Shape Symbols
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

    // Pattern 2: Solid Rings
    drawMiddleSolidRings(col) {
        // Note: this.middlePatternColor is passed as 'col'
        this.drawHandDrawnCircle(this.r * 0.45, col, null, 0);
        // We use random() but it's stable due to randomSeed()
        let col2 = random(patternPalette); 
        this.drawHandDrawnCircle(this.r * 0.3, col2, null, 0);
    }

  // Pattern 3: Concentric Rings
    drawMiddleConcentricRings(col) {
        noFill();
        stroke(col);
        let baseStrokeWeight = this.r * 0.01; 
        let numRings = 5;  
        for (let j = 0; j < numRings; j++) {
            let currentRadius = map(j, 0, numRings - 1, this.r * 0.3, this.r * 0.5);
            strokeWeight(baseStrokeWeight * random(0.8, 1.2)); 
            // We can just use the simple draw function here
            // as randomSeed() makes its internal random() stable
           this.drawHandDrawnCircle(currentRadius, null, col, null);
        }
    }

    // ================= INNER PATTERNS =================
    displayInnerPattern() {
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
        color(255, 255, 255), // (Ceremony White)
        color(255, 240, 200), // (Cream)
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
    //    (Drawn before circles so they appear underneath)
    drawRoads(); 

    // 3. Main Circle Layer
    for (let c of circles) {
        c.display();
    }
}