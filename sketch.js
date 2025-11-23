let table;
let zones = [];

// CONFIGURAZIONE COLORI
let colors = {
  "animalia": "#B96A82",  
  "plantae": "#A6C3A0",   
  "fungi": "#A59382",     
  "chromista": "#8096AD"  
};

// Moltiplicatore grandezza
let scaleFactor = 0.8; 

let kingdomVisibility = {
  "animalia": true,
  "plantae": true,
  "fungi": true,
  "chromista": true
};

function preload() {
  // Assicurati che il percorso sia giusto!
  table = loadTable('data/dataset_biodiversità - regni x aree.csv', 'csv', 'header');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  noLoop(); 
  
  // Non serve più randomSeed perché non useremo funzioni random!

  let validZoneIndex = 0; // Contatore per posizionare le zone in spirale

  // 1. CREAZIONE ZONE
  for (let r = 0; r < table.getRowCount(); r++) {
    let zoneName = table.getString(r, 0); 
    
    // Ignora la riga TOTAL
    if (zoneName === 'TOTAL') continue; 

    let total = table.getNum(r, "TOTAL");
    let counts = {
      "animalia": table.getNum(r, "animalia"),
      "plantae": table.getNum(r, "plantae"),
      "fungi": table.getNum(r, "fungi"),
      "chromista": table.getNum(r, "chromista")
    };

    if (total > 0) {
      // Passiamo 'validZoneIndex' per calcolare la posizione fissa
      zones.push(new Zone(zoneName, total, counts, validZoneIndex));
      validZoneIndex++;
    }
  }

  // 2. SIMULAZIONE FISICA ZONE
  // Ora che partono tutte ordinate, la simulazione darà sempre lo stesso risultato
  print("Calcolo layout...");
  let zoneSimSteps = 2000;
  for (let i = 0; i < zoneSimSteps; i++) {
    for (let z of zones) {
      z.move(); 
      z.collide(zones);
    }
  }

  // 3. SIMULAZIONE FISICA REGNI
  for (let z of zones) {
    let innerSimSteps = 1000;
    for (let i = 0; i < innerSimSteps; i++) {
      for (let k of z.kingdoms) {
        k.move(z.r);
        k.collide(z.kingdoms);
      }
    }
  }

  createFilters();
}

// Funzione per creare l'interfaccia
function createFilters() {
  let startY = 20; // Posizione verticale iniziale
  let startX = 20; // Posizione orizzontale
  
  // Titolo della legenda
  let title = createDiv("FILTRA REGNI:");
  title.position(startX, startY);
  title.style('color', '#000000');
  title.style('font-family', 'Arial');
  title.style('font-size', '12px');
  title.style('font-weight', 'bold');
  
  startY += 25;

  // Ciclo per creare una checkbox per ogni colore
  for (let key in colors) {
    // Crea la checkbox (label, valore iniziale)
    let cb = createCheckbox(' ' + key.toUpperCase(), true);
    
    cb.position(startX, startY);
    
    // Stile CSS per renderle belle
    cb.style('color', colors[key]); // Colore del testo uguale al cerchio
    cb.style('font-family', 'Arial');
    cb.style('font-size', '12px');
    
    // Quando clicchi, aggiorna la variabile e ridisegna
    cb.changed(() => {
      kingdomVisibility[key] = cb.checked();
      redraw(); 
    });

    startY += 20; // Spazio per la prossima riga
  }
}

function draw() {
  background("#E1DDD3");
  translate(width / 2, height / 2);

  for (let z of zones) {
    z.show();
  }
}

// --- CLASSE ZONA ---
class Zone {
  constructor(name, total, counts, index) {
    this.name = name;
    
    // --- MODIFICA DETERMINISTICA ---
    // Invece di random, usiamo una Spirale di Archimede basata sull'indice
    // Ogni zona avrà una posizione di partenza FISSA unica
    let angle = index * 2.0; // Angolo aumenta progressivamente
    let distance = 50 + (index * 15); // Distanza aumenta progressivamente
    this.pos = createVector(cos(angle) * distance, sin(angle) * distance);
    // -------------------------------
    
    this.r = sqrt(total) * scaleFactor * 1.75; 
    this.kingdoms = [];
    
    // Creazione sottogruppi
    for (let key in counts) {
      let val = counts[key];
      if (val > 0) {
        this.kingdoms.push(new Kingdom(key, val));
      }
    }
  }

  move() {
    let center = createVector(0, 0);
    let attraction = p5.Vector.sub(center, this.pos);
    attraction.setMag(0.5); 
    this.pos.add(attraction);
  }

  collide(others) {
    for (let other of others) {
      if (other !== this) {
        let d = this.pos ? this.pos.dist(other.pos) : this.relPos.dist(other.relPos); 
        let minDist = this.r + other.r + 35; 
        
        if (d < minDist) {
          // Calcolo l'ESATTA sovrapposizione
          let overlap = minDist - d;
          
          // Trovo la direzione per scappare via dall'altro cerchio
          let vec;
          if (this.pos) {
             vec = p5.Vector.sub(this.pos, other.pos); 
          } else {
             vec = p5.Vector.sub(this.relPos, other.relPos); 
          }
          if (vec.mag() === 0) vec = p5.Vector.random2D();
          
          // Mi sposto esattamente della metà della sovrapposizione
          vec.setMag(overlap * 0.5); 
          
          if (this.pos) this.pos.add(vec);
          else this.relPos.add(vec);
        }
      }
    }
  }

show() {
    // 1. Disegno cerchio esterno (Zona)
    noStroke(); 
    fill("#F2F0E5"); 
    circle(this.pos.x, this.pos.y, this.r * 2);

    // 2. Disegno testo curvo
    noStroke();
    fill("#000000");
    textAlign(CENTER, CENTER);
    textSize(12);
    textStyle(BOLD);

    let label = this.name.toUpperCase();
    let textRadius = this.r + 18; 
    
    let totalAngle = textWidth(label) / textRadius;
    
    // Parto da Sinistra per andare a Destra 
    let currentAngle = HALF_PI + (totalAngle / 2);

    for (let i = 0; i < label.length; i++) {
      let char = label.charAt(i);
      let w = textWidth(char);
      
      let charAngle = w / textRadius;
      
      // Sottraggo metà dell'angolo per trovare il centro della lettera
      let theta = currentAngle - charAngle / 2;
      
      let x = this.pos.x + cos(theta) * textRadius;
      let y = this.pos.y + sin(theta) * textRadius;

      push();
      translate(x, y);
      rotate(theta - HALF_PI); 
      text(char, 0, 0);
      pop();

      // Mi sposto indietro (verso destra) per la prossima lettera
      currentAngle -= charAngle;
    }

    // 3. Disegno i cerchi interni (Regni) 
    for (let k of this.kingdoms) {
      let absX = this.pos.x + k.relPos.x;
      let absY = this.pos.y + k.relPos.y;
      k.show(absX, absY);
    }
  }
}

// --- CLASSE REGNO ---
class Kingdom {
  constructor(type, value) {
    this.type = type;
    this.value = value;
    this.r = sqrt(value) * scaleFactor;
    
    // --- MODIFICA DETERMINISTICA ---
    // Posizione iniziale fissa in base al tipo (Nord, Sud, Est, Ovest)
    // Così non usiamo random nemmeno qui
    let offset = 10;
    if (type === 'animalia') this.relPos = createVector(-offset, -offset); // Nord-Ovest
    else if (type === 'plantae') this.relPos = createVector(offset, -offset); // Nord-Est
    else if (type === 'fungi') this.relPos = createVector(-offset, offset);   // Sud-Ovest
    else this.relPos = createVector(offset, offset);                          // Sud-Est (chromista)
    // -------------------------------
  }

  move(zoneRadius) {
    let centerPush = this.relPos.copy().setMag(0.1);
    this.relPos.add(centerPush);

    let d = this.relPos.mag();
    let maxDist = zoneRadius - this.r - 2; 
    
    if (d > maxDist && maxDist > 0) {
      this.relPos.setMag(maxDist); 
    }
  }

  collide(others) {
    for (let other of others) {
      if (other !== this) {
        let d = this.pos ? this.pos.dist(other.pos) : this.relPos.dist(other.relPos); 
        let minDist = this.r + other.r + 3; 
        
        if (d < minDist) {
          // Calcolo l'ESATTA sovrapposizione
          let overlap = minDist - d;
          
          // Trovo la direzione per scappare via dall'altro cerchio
          let vec;
          if (this.pos) {
             vec = p5.Vector.sub(this.pos, other.pos); 
          } else {
             vec = p5.Vector.sub(this.relPos, other.relPos); 
          }
          if (vec.mag() === 0) vec = p5.Vector.random2D();
          
          // Mi sposto esattamente della metà della sovrapposizione
          vec.setMag(overlap * 0.5); 
          
          if (this.pos) this.pos.add(vec);
          else this.relPos.add(vec);
        }
      }
    }
  }

  show(x, y) {
    if (kingdomVisibility[this.type] === false) return;
    fill(colors[this.type]);
    noStroke();
    circle(x, y, this.r * 2);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // Nota: se ridimensioni ora ridisegnerà la spirale iniziale,
  // ma manterrà la stessa logica coerente.
}