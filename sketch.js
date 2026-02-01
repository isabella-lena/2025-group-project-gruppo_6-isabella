// 1. DATI DEL TEAM 
const team = [
  { name: "Federica", role: "Illustratrice Programmatrice", 
    description:"Fate, boschi, animaletti, musica folk... questo sito è per lei.", image: "fede.png", color: "#c19e7f" },
  
  { name: "Emily", role: "Content writer Organizzazione dati", 
    description:"Fa sempre 200 mila cose ma in qualche modo è sempre sul pezzo, slay", image: "emily.png", color: "#7f9cb0" },

  { name: "Alessandro", role: "Organizzazione contenuti Programmatore", 
    description:"Creatore di meme del gruppo, ride sempre e a caso. È impossibile arrabbiarsi con lui.", image: "ale.png", color: "#b7ab5a" },

  { name: "Rebecca", role: "Ricerca database Programmatrice", 
    description:"'Ma come ti permetti?!?!' core. Super cute ma ha il cuore da dark princess.", image: "rebbi.png", color: "#b87e8f" },
  
  { name: "Isabella", role: "Programmatrice", 
    description:"Un po' biscotti alla cannella, un po' trap. La + swag.", image: "isi.png", color: "#71a568" },
  
  { name: "Aroa", role: "Prototipi Figma", 
    description:"La nostra componente spagnola. Non si sa come ma capisce sempre tutto quello che diciamo.", image: "aroa.png", color: "#a182a8" },
  
  { name: "Ludovica", role: "Ricerca idee grafiche Programmatrice", 
    description:"da inserire", image: "ludo.png", color: "#6889b1" }
];

//  2. CREAZIONE CARD 

function createCard(member, index) {
  const card = document.createElement("article");
  card.className = "card"; // Classe unica per il CSS
  card.setAttribute("role", "listitem");
  card.setAttribute("aria-label", `${member.name}, ${member.role}`);
  
  card.id = `card-${index}`;

  // Meta (Testo)
  const meta = document.createElement("div");
  meta.className = "meta";

  const name = document.createElement("div");
  name.className = "name";
  name.textContent = member.name;

  const role = document.createElement("div");
  role.className = "role";
  role.textContent = member.role;

  const description = document.createElement("div");
  description.className = "description";
  description.textContent = member.description;

  meta.appendChild(name);
  meta.appendChild(role);
  meta.appendChild(description);

  // Media (Immagine)
  const media = document.createElement("div");
  media.className = "media";

  const img = document.createElement("img");
  img.src = member.image; 
  // Placeholder di sicurezza se l'immagine manca
  img.onerror = function() { this.src = 'https://placehold.co/300x400/png?text=' + member.name; };
  img.alt = `Ritratto di ${member.name}`;
  
  media.appendChild(img);

  // Assemblaggio
  card.appendChild(meta);
  card.appendChild(media);

  return card;
}

// Inizializzazione al caricamento della pagina
document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("team-container");

    if(container) {
        // Puliamo il container per sicurezza
        container.innerHTML = "";
        
        // Criamo e appendiamo tutte le card in un unico ciclo
        team.forEach((member, index) => {
            const card = createCard(member, index);
            container.appendChild(card);
        });
    } else {
        console.error("ERRORE: Elemento #team-container non trovato nell'HTML!");
    }
});


//  3. P5.JS & P5.BRUSH (Generazione Texture Sfondi) 

function setup() {
  // Usiamo il renderer 2D di default 
  let cnv = createCanvas(350, 400); 
  cnv.id('p5canvas');
  cnv.style('display', 'none'); 

  noLoop();

  setTimeout(generateAllBackgrounds, 500);
}

async function generateAllBackgrounds() {
  for (let i = 0; i < team.length; i++) {
    // Aspettiamo un attimo tra una card e l'altra per non bloccare il browser
    await new Promise(r => setTimeout(r, 100)); 
    generateSingleBackground(i);
  }
}

function generateSingleBackground(index) {
  let member = team[index];
  let card = document.getElementById(`card-${index}`);
  
  if (!card) return;

  clear();

  const vertices = [];
  const numPoints = 16; // Numero di punti che formano il perimetro 
  
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Definiamo quanto deve essere grande la macchia
  const radiusX = (width / 2); 
  const radiusY = (height / 2);

  for (let i = 0; i < numPoints; i++) {
    // Calcoliamo l'angolo per questo punto (da 0 a 360 gradi)
    let angle = map(i, 0, numPoints, 0, TWO_PI);
    
    // Aggiungiamo un po' di irregolarità al raggio per non fare un cerchio perfetto
    // Il raggio varierà tra il 90% e il 100% della dimensione prevista
    let rRandom = random(0.9, 1.0);
    
    // Matematica per trovare il punto sul perimetro (Coordinate Polari -> Cartesiane)
    let x = centerX + cos(angle) * radiusX * rRandom;
    let y = centerY + sin(angle) * radiusY * rRandom;
    
    vertices.push(createVector(x, y));
  }
  
  // Creiamo l'oggetto base con questi vertici circolari
  let polyBase = new Poly(vertices);

  let accentColor = color(member.color);
  waterColour(polyBase.dup(), accentColor);

  let canvasDOM = document.getElementById('p5canvas');
  if(canvasDOM) {
      let dataURL = canvasDOM.toDataURL('image/png'); 
      card.style.backgroundImage = `url(${dataURL})`;
  }
}

class Poly {
  constructor(vertices, modifiers) {
    this.vertices = vertices;
    if(!modifiers) {
      modifiers = [];
      for(let i = 0; i < vertices.length; i ++) {
        modifiers.push(random(0.1, 0.8));
      }
    }
    this.modifiers = modifiers;
  }
  
  grow() {
    const grownVerts = [];
    const grownMods = [];
    for(let i = 0; i < this.vertices.length; i ++) {
      const j = (i + 1) % this.vertices.length;
      const v1 = this.vertices[i];
      const v2 = this.vertices[j];
      
      const mod = this.modifiers[i];
      
      const chmod = m => {
        return m + (rand() - 0.5) * 0.1;
      }
      
      grownVerts.push(v1);
      grownMods.push(chmod(mod));
      
      const segment = v2.copy().sub(v1);
      const len = segment.mag();
      segment.mult(rand());
      
      const v = p5.Vector.add(segment, v1);
      
      segment.rotate(-PI/2 + (rand()-0.5) * PI/4);
      segment.setMag(rand() * len/2 * mod);
      v.add(segment);
      
      grownVerts.push(v);
      grownMods.push(chmod(mod));
    }
    return new Poly(grownVerts, grownMods);
  }
  
  dup() {
    // Helper per non modificare l'originale quando disegniamo due livelli
    return new Poly([...this.vertices], [...this.modifiers]);
  }
  
  draw() {
    beginShape();
    for(let v of this.vertices) {
      vertex(v.x, v.y);
    }
    endShape(CLOSE);
  }
}

function waterColour(poly, colour) {
  const numLayers = 30; 
  fill(red(colour), green(colour), blue(colour), 255/(2 * numLayers));
  noStroke();
  
  poly = poly.grow().grow();
  
  for(let i = 0; i < numLayers; i ++) {
    if(i == int(numLayers/3) || i == int(2 * numLayers/3)) {
      poly = poly.grow().grow();
    }
    
    poly.grow().draw();
  }  
}

function rand() {
  return distribute(random(1));
}

function distribute(x) {
  return pow((x - 0.5) * 1.58740105, 3) + 0.5;
}