let table;
let bubbles = [];
let kingdomCenters = {}; 

// Colori per i 4 Regni
let colors = {
  "ANIMALIA": "#F7931E", // Arancione
  "PLANTAE": "#ED1C24",  // Rosso
  "FUNGI": "#29ABE2",    // Azzurro
  "CHROMISTA": "#39B54A" // Verde
};

function preload() {
  // Carico il dataset
  table = loadTable('data/data_main.csv', 'csv', 'header');
}

function setup() {
    print("Numero righe caricate: " + table.getRowCount());
  createCanvas(windowWidth, windowHeight);
  noLoop(); // Ferma il loop di disegno. Disegneremo solo una volta.

  let cx = width / 2;
  let cy = height / 2;
  let dist = min(width, height) / 4; 
  
  kingdomCenters = {
    "ANIMALIA": createVector(cx - dist, cy - dist),
    "PLANTAE": createVector(cx + dist, cy - dist),
    "FUNGI": createVector(cx - dist, cy + dist),
    "CHROMISTA": createVector(cx + dist, cy + dist)
  };

  for (let r = 0; r < table.getRowCount(); r++) {
    let kingdom = table.getString(r, 'Kingdom');
    let name = table.getString(r, 'Name');
    
    // Pulizia dei numeri (via i punti)
    let cr = cleanNumber(table.getString(r, 'CR'));
    let en = cleanNumber(table.getString(r, 'EN'));
    let vu = cleanNumber(table.getString(r, 'VU'));
    let totalVal = cr + en + vu;

    if (totalVal > 0 && kingdomCenters[kingdom]) {
      // Calcolo raggio basato sull'area
      let raggio = sqrt(totalVal) * 0.8; 
      raggio = constrain(raggio, 3, 60); // Limiti min/max

      // Posizione iniziale casuale (vicino al centro per iniziare)
      let startX = width/2 + random(-50, 50);
      let startY = height/2 + random(-50, 50);

      bubbles.push(new Bubble(startX, startY, raggio, kingdom, name));
    }
  }
  
  let simulazioni = 1500; 
  print("Calcolo posizioni in corso...");
  
  for (let i = 0; i < simulazioni; i++) {
    for (let b of bubbles) {
      b.move();
      b.collide(bubbles);
    }
  }
  print("Fatto!");
}

function draw() {
  background(0); // Sfondo nero

  // Disegno le etichette dei Regni sullo sfondo
  textAlign(CENTER, CENTER);
  textSize(20);
  textStyle(BOLD);
  noStroke();
  for (let k in kingdomCenters) {
    fill(colors[k]); 
    text(k, kingdomCenters[k].x, kingdomCenters[k].y - 100); // Un po' sopra il gruppo
  }

  // Disegna tutte le bolle 
  for (let b of bubbles) {
    b.show();
  }
}

class Bubble {
  constructor(x, y, r, kingdom, name) {
    this.pos = createVector(x, y);
    this.r = r;
    this.kingdom = kingdom;
    this.name = name;
    this.vel = createVector(0, 0);
    this.col = color(colors[kingdom] || "#999");
  }

  move() {
    // Attrazione verso il centro del proprio regno
    let center = kingdomCenters[this.kingdom];
    let attraction = p5.Vector.sub(center, this.pos);
    attraction.setMag(0.8); // Forza attrazione
    this.vel.add(attraction);
    
    this.vel.mult(0.5); // Alto attrito per fermarle subito
    this.pos.add(this.vel);
  }

  collide(others) {
    for (let other of others) {
      if (other !== this) {
        let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
        let minDist = this.r + other.r + 2; // Distanza minima (raggi + margine)

        if (d < minDist) {
          // Calcola repulsione
          let angle = atan2(this.pos.y - other.pos.y, this.pos.x - other.pos.x);
          let targetX = this.pos.x + cos(angle) * minDist;
          let targetY = this.pos.y + sin(angle) * minDist;
          
          let ax = (targetX - other.pos.x) * 0.05; // "Molla" rigida
          let ay = (targetY - other.pos.y) * 0.05;
          
          this.vel.x -= ax;
          this.vel.y -= ay;
        }
      }
    }
  }

  show() {
    // Disegno cerchio
    stroke(255);
    strokeWeight(0.5);
    this.col.setAlpha(200);
    fill(this.col);
    circle(this.pos.x, this.pos.y, this.r * 2);

    // Disegno testo se c'è spazio
    if (this.r > 12) {
      fill(255);
      noStroke();
      textSize(this.r / 2.2); // Testo proporzionale al cerchio
      textAlign(CENTER, CENTER);
      
      // Accorcia nome se troppo lungo
      let label = this.name;
      if (label.length > 9) label = label.substring(0, 8) + ".";
      
      text(label, this.pos.x, this.pos.y);
    }
  }
}

// Helper pulizia numeri
function cleanNumber(strVal) {
  if (!strVal) return 0;
  return float(strVal.toString().replace(/\./g, ""));
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}