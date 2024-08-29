import { playMovementSound, playCrashSound, playGameOverSound, playRespawnSound, initAudio, playScoreSound, audioContext } from './gameAudio.js';
import { initBackgroundMusic, stopMusic } from './backgroundMusic.js';

let canvas, ctx, debugOutput;
let gamePlayer, obstacles, score, gameSpeed, gameTime;
let exerciseValue, currentExerciseValue, lastExerciseValue, noHandTimer;
const interpolationFactor = 0.1;
const noHandTimeout = 500;
let gameRunning = false;
let gameLoopId;
let createObstacleInterval;
let currentExercise = 'thumb_index_pinch'; // Default exercise

let movementRange = 1; // Defauly difficulty
let lastMessageTime = 0;
let frameCount = 0;
let frameRate = 0;

let audioInitialised = false;

const notes = [
  { name: 'C6', frequency: 1046.50, duration: 0.23316075, delay: 0 },
  { name: 'F6', frequency: 1396.91, duration: 0.38860125, delay: 0.07772025 }
];

const badNotes = [
  { name: 'F7', frequency: 2793.83, duration: 0.038860125, delay: 0 },
  { name: 'E7', frequency: 2637.02, duration: 0.038860125, delay: 0.038860125 },
  { name: 'D7', frequency: 2349.32, duration: 0.038860125, delay: 0.07772025 },
  { name: 'C#7', frequency: 2217.46, duration: 0.038860125, delay: 0.11658037500000001 },
  { name: 'B6', frequency: 1975.53, duration: 0.038860125, delay: 0.1554405 },
  { name: 'A#6', frequency: 1864.66, duration: 0.038860125, delay: 0.194300625 },
  { name: 'G6', frequency: 1567.98, duration: 0.038860125, delay: 0.23316075000000003 },
  { name: 'F#6', frequency: 1479.98, duration: 0.038860125, delay: 0.272020875 },
  { name: 'F6', frequency: 1396.91, duration: 0.07772025, delay: 0.310881 }
];

let gameMode = 'regular';
let maxHealth = 5;

function initGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    debugOutput = document.getElementById('debugOutput');

    function log(message) {
        console.log(message);
        debugOutput.innerHTML += message + '<br>';
    }

    gamePlayer = {
        x: 50,
        y: canvas.height / 2,  // Always start in the middle
        radius: 20,
        crashed: false,
        health: 5
    };

    obstacles = [];
    score = 0;
    gameSpeed = 3;
    gameTime = 0;

    exerciseValue = 70;
    currentExerciseValue = exerciseValue;
    lastExerciseValue = exerciseValue;

    // Range slider setup
    const rangeSlider = document.getElementById('rangeSlider');
    const rangeValue = document.getElementById('rangeValue');
    
    rangeSlider.addEventListener('input', function() {
        movementRange = this.value / 100;
        rangeValue.textContent = this.value;
        console.log("Movement Range set to:", movementRange);
    });

    // Initialise the range value display
    rangeValue.textContent = rangeSlider.value;
    movementRange = rangeSlider.value / 100;

    // Exercise selection setup
    document.getElementById('exerciseSelect').addEventListener('change', function() {
        currentExercise = this.value;
        console.log("Exercise changed to:", currentExercise);
    });

    // Game mode selection setup
    document.getElementById('gameMode').addEventListener('change', function() {
        gameMode = this.value;
        console.log("Game mode changed to:", gameMode);
    });

    // WebSocket setup (taking in JSON data from LeapTracker.cpp)
    const socket = new WebSocket('ws://localhost:8080');
    socket.onopen = () => console.log("WebSocket connection established");
    socket.onclose = (event) => console.log("WebSocket connection closed", event);
    socket.onmessage = event => {
        try {
            const data = JSON.parse(event.data);
            console.log("Received WebSocket data:", data);
        
            if (data.handPresent) {
                console.log("Hand present, current exercise:", currentExercise);
                switch (currentExercise) {
                    case 'thumb_index_pinch':
                        exerciseValue = data.distances?.thumbIndex ?? 70;
                        break;
                    case 'make_a_fist':
                        exerciseValue = data.metrics?.makeAFist ?? 0.5;
                        break;
                    case 'pronation_supination':
                        exerciseValue = data.metrics?.pronationSupination ?? 0.5;
                        break;
                    case 'wrist_arom':
                        exerciseValue = data.metrics?.wristAROM ?? 0.5;
                        break;
                    default:
                        console.warn("Unknown exercise type:", currentExercise);
                        exerciseValue = 0.5;
                }
                console.log(`${currentExercise} Value:`, exerciseValue);
            } else {
                console.log("Hand not present");
                exerciseValue = 0.5;
            }
        } catch (error) {
            console.error("Error parsing WebSocket data:", error);
        }

        const now = performance.now();
        frameCount++;

        if (now - lastMessageTime >= 1000) {
            frameRate = frameCount;
            frameCount = 0;
            lastMessageTime = now;
            console.log("WebSocket data frame rate:", frameRate);
        }
    };



    document.getElementById('startButton').addEventListener('click', startGame);
    document.getElementById('stopButton').addEventListener('click', stopGame);
}

async function startGame() {
    if (gameRunning) return;

    try {
        await initBackgroundMusic();
        await initAudio(); // This will now initialise Tone.js and the AudioContext
        
        // Resume the AudioContext here
        if (audioContext && audioContext.state !== 'running') {
            await audioContext.resume();
        }
        
        gameRunning = true;
        gameSpeed = 3;
        score = 0;
        obstacles = [];
        gamePlayer.health = maxHealth;
        gamePlayer.crashed = false;

        document.getElementById('startButton').disabled = true;
        document.getElementById('stopButton').disabled = false;

        createObstacleInterval = setInterval(createObstacle, 2000);
        updateGame();
    } catch (error) {
        console.error("Error initialising game:", error);
        // Handle the error appropriately
    }
}

function stopGame() {
    if (!gameRunning) return;

    gameRunning = false;
    clearInterval(createObstacleInterval);
    cancelAnimationFrame(gameLoopId);
    stopMusic();

    document.getElementById('startButton').disabled = false;
    document.getElementById('stopButton').disabled = true;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Display "Game Over" message
    ctx.fillStyle = 'black';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    ctx.font = '24px Arial';
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 40);
}


function updateGame() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updatePlayerPosition();
    manageObstacles();
    drawPlayer();
    drawObstacles();
    displayScore();
    displayHealth();
    gameTime++;

    gameLoopId = requestAnimationFrame(updateGame);
}

function createObstacle() {
    const isGood = Math.random() > 0.3; // 70% chance of good obstacle
    obstacles.push({
        x: canvas.width,
        y: Math.random() * canvas.height,
        width: 30,
        height: 60,
        isGood: isGood
    });
}

function drawPlayer() {
    ctx.beginPath();
    ctx.arc(gamePlayer.x, gamePlayer.y, gamePlayer.radius, 0, Math.PI * 2);
    ctx.fillStyle = gamePlayer.crashed ? 'red' : 'blue';
    ctx.fill();
    ctx.closePath();
}

function drawObstacles() {
    obstacles.forEach(obstacle => {
        ctx.fillStyle = obstacle.isGood ? 'green' : 'red';
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });
}

function manageObstacles() {
    obstacles.forEach((obstacle, index) => {
        obstacle.x -= gameSpeed;
        if (obstacle.x + obstacle.width < 0) {
            obstacles.splice(index, 1);
        }
        if (collisionDetected(obstacle)) {
            if (obstacle.isGood) {
                score++;
                obstacles.splice(index, 1);
                playScoreSound();  // Play the score sound when hitting a good obstacle
            } else {
                playCrashSound(); // This will now play both the crash sound and the bad block sound
                crash();
            }
        }
    });
}

function displayScore() {
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Score: ' + score, canvas.width / 2, 30);
    ctx.fillText(`${currentExercise}: ${currentExerciseValue.toFixed(2)}`, canvas.width / 2, 60);
    ctx.fillText(`Frame Rate: ${frameRate}`, canvas.width / 2, 90);  // Add this line
    ctx.textAlign = 'left';
}

function displayHealth() {
    ctx.fillStyle = 'red';
    ctx.fillRect(canvas.width - 110, 10, 100, 20);
    ctx.fillStyle = 'green';
    ctx.fillRect(canvas.width - 110, 10, (gamePlayer.health / maxHealth) * 100, 20);
    ctx.strokeStyle = 'black';
    ctx.strokeRect(canvas.width - 110, 10, 100, 20);
}

function collisionDetected(obstacle) {
    return gamePlayer.x + gamePlayer.radius > obstacle.x &&
        gamePlayer.x - gamePlayer.radius < obstacle.x + obstacle.width &&
        gamePlayer.y + gamePlayer.radius > obstacle.y &&
        gamePlayer.y - gamePlayer.radius < obstacle.y + obstacle.height &&
        !gamePlayer.crashed;
}

function crash() {
    if (gamePlayer.crashed) return; // Prevent multiple crashes in quick succession

    gamePlayer.crashed = true;
    gamePlayer.health--;
    playCrashSound();
    
    if (gamePlayer.health <= 0) {
        if (gameMode === 'endless') {
            respawn();
        } else {
            gameOver();
        }
    } else {
        setTimeout(() => {
            gamePlayer.crashed = false;
        }, 1000);
    }
}

function respawn() {
    score = Math.max(0, score - 10); // Deduct 10 points, but don't go below 0
    gamePlayer.health = maxHealth;
    playRespawnSound();
    gamePlayer.crashed = false;
    
    // Optional: Move player to a safe position
    gamePlayer.y = canvas.height / 2;
    
    // Clear nearby obstacles to give the player some space
    obstacles = obstacles.filter(obstacle => obstacle.x > gamePlayer.x + 100);
}

function gameOver() {
    playGameOverSound();
    stopGame();
}

function updatePlayerPosition() {
    currentExerciseValue += (exerciseValue - currentExerciseValue) * interpolationFactor;
    lastExerciseValue = exerciseValue;

    let normalisedValue = 0;

    switch (currentExercise) {
        case 'thumb_index_pinch':
            // Adjust these values based on observed range of movement
            const pinchMin = 37;
            const pinchMax = 60;
            
            // Normalise the value (smaller value = closed pinch, larger value = open pinch)
            normalisedValue = (currentExerciseValue - pinchMin) / (pinchMax - pinchMin);
            break;
        case 'make_a_fist':
            const fistMin = 0.95;  // Maximum value (open hand)
            const fistMax = 0.3;  // Minimum value (closed fist)

            // Normalise the value (larger value = open hand, smaller value = closed fist)
            normalisedValue = (currentExerciseValue - fistMin) / (fistMax - fistMin);
            break;
        case 'pronation_supination':
            normalisedValue = currentExerciseValue;
            break;
        case 'wrist_arom':
            normalisedValue = currentExerciseValue;
            break;
    }

    // Clamp the value between 0 and 1
    normalisedValue = Math.max(0, Math.min(1, normalisedValue));

    // Calculate the player's position with additional smoothing
    // Use the full height of the canvas
    const targetY = normalisedValue * canvas.height;
    
    // Add a buffer to keep the player within the visible area
    const buffer = gamePlayer.radius;
    const clampedTargetY = Math.max(buffer, Math.min(canvas.height - buffer, targetY));
    
    // Adjust the smoothing factor (0.2 for slightly slower movement)
    const smoothingFactor = 0.2;
    gamePlayer.y += (clampedTargetY - gamePlayer.y) * smoothingFactor;

    // Normalise the value for sound (0 to 1 range)
    const normalisedForSound = normalisedValue;
    
    playMovementSound(normalisedForSound);
    console.log(`${currentExercise} Value:`, exerciseValue, "Normalised:", normalisedValue, "Player Y:", gamePlayer.y);
}

// Initialise the game when the window loads
window.addEventListener('load', () => {
    initGame();
});