// --- Constant for cell size ---
const CELL_SIZE = 30;
const GRID_COUNT = 20;

// --- Matrix character scores in binary ---
const matrixCharacters = [
    { name: "The Architect", score: 128 }, // 10000000
    { name: "Morpheus", score: 93 },      // 101110
    { name: "Trinity", score: 63 },        // 111111 
    { name: "Agent Smith", score: 31 },    // 11111 
    { name: "Cypher", score: 15 },         // 1111 
    { name: "Oracle", score: 7 },          // 111 
    { name: "Spoon Boy", score: 3 },       // 11 
];

// --- Initialize variables from localStorage ---
let topScore = parseInt(localStorage.getItem('TopScore')) || 0;
let isBinary = localStorage.getItem('isBinary') === 'false' ? false : true;
let multiplier = parseInt(localStorage.getItem('multiplier')) || 1;
let delay = parseInt(localStorage.getItem('delay')) || 100;

document.getElementById('topScore').textContent = `Top Score: ${isBinary ? topScore.toString(2) : topScore}`;

// --- Initialize leaderboard ---
function updateLeaderboard() {
    const leaderboardBody = document.getElementById('leaderboardBody');
    leaderboardBody.innerHTML = '';

// Create a copy of the matrix characters
let leaderboardData = [...matrixCharacters];

// Add the player's score
const playerEntry = { name: "The Chosen One", score: topScore, isPlayer: true };
leaderboardData.push(playerEntry);

// Sort by score in descending order
leaderboardData.sort((a, b) => b.score - a.score);

// Populate the leaderboard
leaderboardData.forEach((character, index) => {
    const row = document.createElement('tr');
    if (character.isPlayer) {
        row.className = 'player-row';
    }
    
    const rankCell = document.createElement('td');
    rankCell.textContent = index + 1;
    
    const nameCell = document.createElement('td');
    nameCell.textContent = character.name;
    
    const scoreCell = document.createElement('td');
    scoreCell.textContent = isBinary ? character.score.toString(2) : character.score;
    
    row.appendChild(rankCell);
    row.appendChild(nameCell);
    row.appendChild(scoreCell);
    
    leaderboardBody.appendChild(row);
});
}

// Call updateLeaderboard initially
updateLeaderboard();


// Buttnons
function Restart() {
location.reload(); // Reloads the page to restart the game
}

function resetScore(){
localStorage.clear();
location.reload();
}

function bluePill(){
isBinary = false;
localStorage.setItem('isBinary', 'false');
// Update displays
document.getElementById('topScore').textContent = `Top Score: ${isBinary ? topScore.toString(2) : topScore}`;
document.getElementById('currentScore').textContent = `Score: ${isBinary ? totalScore.toString(2) : totalScore}`;
updateLeaderboard();
}

function redPill(){
isBinary = true;
localStorage.setItem('isBinary', 'true');
// Update displays
document.getElementById('topScore').textContent = `Top Score: ${isBinary ? topScore.toString(2) : topScore}`;
document.getElementById('currentScore').textContent = `Score: ${isBinary ? totalScore.toString(2) : totalScore}`;
updateLeaderboard();
}

function diff1(){
multiplier = 1
delay = 100
localStorage.setItem('multiplier', 1);
localStorage.setItem('delay', 100);

}

function diff2(){
multiplier = 2
delay = 75
localStorage.setItem('multiplier', 2);
localStorage.setItem('delay', 75);
}

function diff3(){
multiplier = 3
delay = 50
localStorage.setItem('multiplier', 3);
localStorage.setItem('delay', 50);
}


// Event Listeners
document.getElementById('restartButton').addEventListener('click', Restart);
document.getElementById('resetScoreButton').addEventListener('click', resetScore);

document.getElementById('bluePillButton').addEventListener('click', bluePill);
document.getElementById('redPillButton').addEventListener('click', redPill);

document.getElementById('diff1Button').addEventListener('click', diff1);
document.getElementById('diff2Button').addEventListener('click', diff2);
document.getElementById('diff3Button').addEventListener('click', diff3);


// --- CanvasMonad ---
const CanvasMonad = canvas => ({
isJust: canvas !== null && canvas !== undefined,
map: f => (canvas != null ? CanvasMonad(f(canvas)) : CanvasMonad(null)),
chain: f => (canvas != null ? f(canvas) : CanvasMonad(null)),
getOrElse: def => (canvas != null ? canvas : def),
getContext: type => (canvas != null ? canvas.getContext(type) : null)
});

// --- Entity Creation Helper ---
const createEntity = components => ({ ...components });

// --- NEW: Position Checking System ---
// Check if any entity exists at the given coordinates
const isPositionOccupied = (x, y, entities) => {
return entities.some(entity => {
    // Check snake body
    if (entity.type === "snake") {
        return entity.body.some(segment => segment.x === x && segment.y === y);
    }
    // Check food and badFood
    else if (entity.type === "food" || entity.type === "badFood") {
        return entity.position.x === x && entity.position.y === y;
    }
    return false;
});
};

// --- Systems ---
// Input System: Updates snake direction from buffered input
const inputSystem = (entities, directionBuffer) => {
if (!directionBuffer) return entities;

return entities.map(entity => {
    if (entity.type === "snake" && entity.alive) {
    return { ...entity, direction: directionBuffer };
    }
    return entity;
});
};

// Collision System
const collisionSystem = entities => {
const snake = entities.find(e => e.type === "snake");

const head = snake.body[0];
const food = entities.find(e => e.type === "food");
const badFood = entities.find(e => e.type === "badFood");

let newEntities = [...entities];
let snakeAteFood = false;

// Food collision
if (food && head.x === food.position.x && head.y === food.position.y) {
    foodEaten++;
    totalScore = totalScore + 1 * multiplier;
    snakeAteFood = true;
    
    // Update score display
    document.getElementById('currentScore').textContent = `Score: ${isBinary ? totalScore.toString(2) : totalScore}`;
    
    // Remove the eaten food
    newEntities = newEntities.filter(e => e.type !== "food");
    
    // Add a new food (pass entities to avoid collisions)
    newEntities.push(spawnFood(newEntities));
    
    // Potentially spawn bad food
    if (foodEaten >= Math.floor(Math.random() * 3) + 2) {
        newEntities.push(spawnBadFood(newEntities));
        foodEaten = 0;
    }
}

// Bad food collision
if (badFood) {
    const badX = badFood.position.x;
    const badY = badFood.position.y;
    if (
        head.x >= badX - 1 && head.x <= badX + 1 &&
        head.y >= badY - 2 && head.y <= badY + 2
    ) {
        newEntities = newEntities.map(e => {
            if (e.type === "snake") {
                return { ...e, alive: false };
            }
            return e;
        });
    }
}

// Update the snake to show if it ate food
return newEntities.map(e => {
    if (e.type === "snake") {
        return { ...e, ateFood: snakeAteFood };
    }
    return e;
});
};

// Movement System
const movementSystem = entities => {
return entities.map(entity => {
    if (entity.type === "snake" && entity.alive) {
        const newBody = [...entity.body];
        const head = { 
            x: newBody[0].x + entity.direction.x, 
            y: newBody[0].y + entity.direction.y 
        };

        // Wrap around the canvas
        if (head.x < 0) head.x = 19;
        if (head.x >= 20) head.x = 0;
        if (head.y < 0) head.y = 19;
        if (head.y >= 20) head.y = 0;

        newBody.unshift(head);
        
        // Only remove the tail if the snake didn't eat food
        if (!entity.ateFood) {
            newBody.pop();
        }
        
        return { ...entity, body: newBody, ateFood: false };
    }
    return entity;
});
};

// Self-Collision System
const selfCollisionSystem = entities => {
return entities.map(entity => {
    if (entity.type === "snake" && entity.alive) {
        const head = entity.body[0];
        for (let i = 1; i < entity.body.length; i++) {
            if (head.x === entity.body[i].x && head.y === entity.body[i].y) {
                return { ...entity, alive: false };
            }
        }
    }
    return entity;
});
};

// Bad Food System: Removes bad food after 10 seconds
const badFoodSystem = entities => {
const now = Date.now();
return entities.filter(entity => {
    if (entity.type === "badFood" && now - entity.spawnTime >= 10000) {
        return false;
    }
    return true;
});
};

// Render System
const renderSystem = (entities, canvasMonad) => {
canvasMonad.chain(canvas => {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    entities.forEach(entity => {
        if (entity.type === "snake" && entity.alive) {
            ctx.fillStyle = "lime";
            ctx.strokeStyle = "darkgreen";
            ctx.lineWidth = 3; // Increased from 2 to 3 for larger size
            entity.body.forEach(segment => {
                ctx.fillRect(segment.x * CELL_SIZE, segment.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                ctx.strokeRect(segment.x * CELL_SIZE, segment.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            });

            // Draw Neo's glasses
            const head = entity.body[0];
            const eyeWidth = 7.5;  // 5 to 7.5
            const eyeHeight = 4.5; // 3 to 4.5
            const eyeOffsetX = 7.5; // 5 to 7.5
            const eyeOffsetY = 9;   // 6 to 9
            
            ctx.fillStyle = "black";
            ctx.beginPath();
            ctx.ellipse(head.x * CELL_SIZE + eyeOffsetX, head.y * CELL_SIZE + eyeOffsetY, eyeWidth, eyeHeight, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.ellipse(head.x * CELL_SIZE + (CELL_SIZE - eyeOffsetX), head.y * CELL_SIZE + eyeOffsetY, eyeWidth, eyeHeight, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = "black";
            ctx.lineWidth = 1.5; // Increased from 1 to 1.5
            ctx.beginPath();
            ctx.moveTo(head.x * CELL_SIZE + eyeOffsetX + eyeWidth, head.y * CELL_SIZE + eyeOffsetY);
            ctx.lineTo(head.x * CELL_SIZE + (CELL_SIZE - eyeOffsetX) - eyeWidth, head.y * CELL_SIZE + eyeOffsetY);
            ctx.stroke();
        } else if (entity.type === "food") {
            ctx.fillStyle = "lime";
            ctx.font = "30px Courier"; // Increased from 20px to 30px
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("1", entity.position.x * CELL_SIZE + CELL_SIZE/2, entity.position.y * CELL_SIZE + CELL_SIZE/2);
        } else if (entity.type === "badFood") {
            ctx.fillStyle = "lime";
            ctx.font = "150px Courier"; // Increased from 90px to 150px
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("0", entity.position.x * CELL_SIZE + CELL_SIZE/2, entity.position.y * CELL_SIZE + CELL_SIZE/2); 
        }
    });
});

return entities;
};

// --- Helper Functions ---
const spawnFood = (entities) => {
let x, y;
// Keep generating random positions until we find an unoccupied one
do {
    x = Math.floor(Math.random() * GRID_COUNT);
    y = Math.floor(Math.random() * GRID_COUNT);
} while (entities && isPositionOccupied(x, y, entities));

return {
    id: "food",
    type: "food",
    position: { x, y }
};
};

const spawnBadFood = (entities) => {
let x, y;
// Keep generating random positions until we find a free one
do {
    x = Math.floor(Math.random() * GRID_COUNT);
    y = Math.floor(Math.random() * GRID_COUNT);
} while (entities && isPositionOccupied(x, y, entities));

return {
    id: "badFood",
    type: "badFood",
    position: { x, y },
    spawnTime: Date.now()
};
};

const isOppositeDirection = (current, newDir) =>
current.x === -newDir.x && current.y === -newDir.y;

// --- Initial Game State ---
let entities = [
createEntity({
    id: "snake",
    type: "snake",
    body: [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }],
    direction: { x: 1, y: 0 },
    alive: true,
    ateFood: false
})
];

//Add food after snake is created to avoid collisions
entities.push(spawnFood(entities));

let foodEaten = 0;
let totalScore = 0;
let directionBuffer = null;

// --- Canvas Setup ---
const canvasEl = document.getElementById("gameCanvas");
const canvasMonad = CanvasMonad(canvasEl);

// --- Input Handling ---
document.addEventListener("keydown", e => {
const snake = entities.find(entity => entity.type === "snake");
if (e.key === "Enter" && (!snake || !snake.alive)){
    Restart();
    return
}

const currentDirection = snake.direction;
let newDirection = null;

if ((e.key === "ArrowUp" || e.key === "w") && currentDirection.y === 0) {
    newDirection = { x: 0, y: -1 };
} else if ((e.key === "ArrowDown" || e.key === "s") && currentDirection.y === 0) {
    newDirection = { x: 0, y: 1 };
} else if ((e.key === "ArrowLeft" || e.key === "a") && currentDirection.x === 0) {
    newDirection = { x: -1, y: 0 };
} else if ((e.key === "ArrowRight" || e.key === "d") && currentDirection.x === 0) {
    newDirection = { x: 1, y: 0 };
}

if (newDirection && !isOppositeDirection(currentDirection, newDirection)) {
    directionBuffer = newDirection;
}
});

// --- Game Loop ---
function gameLoop() {
const snake = entities.find(entity => entity.type === "snake");

if (snake && snake.alive) {
    // Define all systems in array
    const systems = [
    // Apply input (with directionBuffer)
    entities => inputSystem(entities, directionBuffer),
    // Clear buffer after applying input
    entities => { directionBuffer = null; return entities; },
    movementSystem,
    collisionSystem,
    selfCollisionSystem,
    badFoodSystem,
    entities => renderSystem(entities, canvasMonad)
    ];

    // Pass all systems to reduce
    entities = systems.reduce((currentEntities, system) => system(currentEntities), entities);


    // Check and update top score
    if (totalScore > topScore) {
        topScore = totalScore;
        localStorage.setItem('TopScore', topScore);
        // Update the top score display
        document.getElementById('topScore').textContent = `Top Score: ${isBinary ? topScore.toString(2) : topScore}`;
    }
    // Update the leaderboard with the new top score
    updateLeaderboard();
    setTimeout(gameLoop, delay); // Speed control
} else {
    

}
}

gameLoop();