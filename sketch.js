//ToDoList: 
  // 1.Click to select [✔] 
  // 2.Selected Circle will breath. [✔]
  // 3.Click two circles to connect them with a line.
  // 4.Connected circles will evolve and show a outer pattern. 
 
// This is stage 2, I add following interaction.
// Clicking an existing circle selects it, causing it to animate, like breathing.

// =======================================================================
// ======================== Global Variables =============================
// =======================================================================

let globalBgColor;       //bgColor
let circleBasePalette;   // Base colours for the circles (Deep Earth tones)
let patternPalette;       // Colours for patterns/details (High contrast/Bright)
let circles = [];        // Stores all Circle objects, added dynamically on click
let backgroundDots = []; // Stores background dot data to prevent flicker
// if I don't do this, the dots will flicker all the time due to draw() will call 
// generateBackgroundDots() every frame.



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

function generateBackgroundDots() {
    let density = 0.004; 
    let numDots = floor(width * height * density); 
    for (let i = 0; i < numDots; i++) {
        let x = random(width);
        let y = random(height);
        let dotSize = random(width * 0.002, width * 0.005);
        let alpha = random(100, 200);  
        backgroundDots.push({ x: x, y: y, dotSize: dotSize, alpha: alpha }); 
        //once it is randomrized , it will be stored to avoid flicker.
    }
}

function drawBackgroundDots() {
    push();
    noStroke();
    for (let dot of backgroundDots) { // iterate through each dot to draw it.
        fill(255, 255, 255, dot.alpha); 
        ellipse(dot.x, dot.y, dot.dotSize);
    }
    pop();
}

// =========================================================================
// ======================= Interaction Logic ===============================
// =========================================================================
//The logic here is a little bit difficult.
// I create a new variable "clickedCircle" to store the clicked circle.
// The clickedCircle variable will update first, then the isSelected attribute of each circle will be updated.
//// So that I can deselect other circles when click a new circle.

function mouseClicked() {
    let clickedCircle = null;  // I create a new variable to store the clicked circle. ^_^

    for (let c of circles) {  // iterate through each circle to check if it is clicked.
        if (c.isClicked(mouseX, mouseY)) {
            clickedCircle = c;  // I also add a new function isClicked to judge if the circle is clicked.
            break; // if the circle is clicked, the clickedCircle variable will store the circle.
        }
    }

    if (clickedCircle) {   // if click a circle, select it, and deselect all other circles.
        for (let c of circles) { 
            c.isSelected = (c === clickedCircle); // The clickedCircle variable will change first
            // then the isSelected attribute of each circle will be updated according to the variable "clickedCircle".
        }
    } else {      // if click on empty area, deselect all circles, and create a new circle.
        for (let c of circles) {
            c.isSelected = false;
        }

        let r = width / 8;
        let newCircle = new Circle(mouseX, mouseY, r); // create circle at the mouse position.

        newCircle.showInner = true; 
        newCircle.innerPatternType = floor(random(2));
        newCircle.innerBaseColor = random(circleBasePalette);
        newCircle.innerPatternColor = random(patternPalette);

        newCircle.isSelected = false; 
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
        
        this.showInner = false; //if  show the inner pattern
        this.isSelected = false;
        
        this.innerPatternType = 0;
        this.innerBaseColor = color(0);
        this.innerPatternColor = color(255);

        this.outerPatternType = floor(random(4)); 
        this.middlePatternType = floor(random(4)); 
        
        this.seed = random(1000000); // use the seed to generate the same pattern to avoid flickering.
    }
// check if the mouse is clicked on the circle using the distance between the mouse and the circle center.
    isClicked(mx, my) {
        let d = dist(mx, my, this.x, this.y);
        return (d < this.r); 
    }

    display() {
        if (!this.showInner) return;
        
        randomSeed(this.seed); //from the official p5.js reference:https://p5js.org/reference/p5/randomSeed/
        
        push(); 
        translate(this.x, this.y); 
        // If the circle is selected, apply a "breathing" scale animation
        if (this.isSelected) { 
            let pulse = sin(millis() * 0.005); //from the official p5.js reference:https://p5js.org/reference/p5/millis/
            // Oscillates smoothly over time.
            let scaleFactor = map(pulse, -1, 1, 1.0, 1.15); 
            // Map sine wave to scale range
            scale(scaleFactor); //// Apply scaling transformation
        }
        
        this.displayInnerPattern();  
        pop();  // only scale the selected circle, because push and pop.
    }

    drawIrregularBlob(rOffset, angle, size, col) {
        let x = cos(angle) * rOffset;
        let y = sin(angle) * rOffset;
        fill(col);
        noStroke();
        push();
        translate(x, y); 
        beginShape();
        let points = 8;  
        for (let i = 0; i <= points; i++) {
            let a = TWO_PI / points * i;
            let r = size * 0.5 * random(0.85, 1.15); 
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
            let jitter = random(-r * 0.01, r * 0.01); 
            let radius = r + jitter;
            curveVertex(cos(angle) * radius, sin(angle) * radius);
        }
        endShape(CLOSE);
    }

    displayInnerPattern() {
        this.drawHandDrawnCircle(this.r * 0.25, this.innerBaseColor, null, 0);
        let patCol = this.innerPatternColor;
        
        if (this.innerPatternType === 0) {
            this.drawIrregularBlob(0, 0, this.r * 0.15, patCol); 
        } else {
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
    pixelDensity(2); 

    globalBgColor = color(30, 20, 15);
    circleBasePalette = [
        color(90, 40, 20),   // (Red Ochre)
        color(60, 30, 15),   // (Deep Earth)
        color(40, 45, 35),   // (Bush Green)
        color(110, 60, 30),  // (Burnt Orange)
        color(20, 20, 20)    // (Charcoal)
    ];
    patternPalette = [
        color(255, 255, 255), // (Ceremony White)
        color(255, 240, 200), // (Cream)
        color(255, 215, 0),   // (Sun Yellow)
        color(255, 140, 80),  // (Bright Ochre)
        color(160, 180, 140), // (Sage)
        color(200, 200, 210)  // (Ash)
    ];
    
    generateBackgroundDots();
}

function draw() {
    background(globalBgColor); 
    drawBackgroundDots();

    for (let c of circles) {
        c.display();
    }
}
