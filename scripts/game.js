const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let gameStarted = false; // Flag to check if the game has started
let timer = 60; // 60 seconds timer
let gameOver = false; // Flag to track game over state
let countdownInterval;

// Donut array
const donuts = [];
const colors = ["pink", "orange", "red", "cyan", "yellow"]; // Array of colors for donuts
let score = 0; // Initialize score

// Animation frames
const idleFrames = [];
const swimFrames = [];
const totalFrames = 6; // Total number of frames for animations
let currentFrame = 0;
const frameInterval = 100; // Time in milliseconds between frames
let isMoving = false; // Flag to check if swimmer is moving
let isFacingLeft = false; // Flag to check if swimmer is facing left
let frameTimer = 0; // Timer to control frame changes

// Load idle frames
for (let i = 0; i < totalFrames; i++) {
  const frameImage = new Image();
  frameImage.src = `images/idle${i.toString().padStart(3, "0")}.png`;
  idleFrames.push(frameImage);
}

// Load swimming frames
for (let i = 0; i < totalFrames; i++) {
  const frameImage = new Image();
  frameImage.src = `images/swim${i.toString().padStart(3, "0")}.png`;
  swimFrames.push(frameImage);
}

// Donut constructor
// Donut constructor
function Donut(x, y, outerRadius, innerRadius, speed) {
  this.x = x;
  this.y = y;
  this.outerRadius = outerRadius;
  this.innerRadius = innerRadius;
  this.speed = speed;
  this.color = colors[Math.floor(Math.random() * colors.length)]; // Random color

  this.isFloating = false; // Tracks if the donut is floating to the surface
  this.hasCollided = false; // Tracks if the donut has collided and stopped moving
  this.hitBottom = false; // Tracks if the donut has hit the bottom

  // Draw method for donuts
  this.draw = function () {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.outerRadius, 0, Math.PI * 2);
    ctx.fill();

    // Inner circle (hole)
    ctx.beginPath();
    ctx.fillStyle = "rgba(173, 216, 230, 1)"; // Color for the donut hole
    ctx.arc(this.x, this.y, this.innerRadius, 0, Math.PI * 2);
    ctx.fill();
  };

  // Update method for donut movement
  this.update = function () {
    if (this.hitBottom && !this.isFloating) {
      // If it hit the bottom but not floating yet, stay stationary
      return;
    }

    // If the donut is floating, move upwards
    if (this.isFloating) {
      this.y -= this.speed; // Move upwards
      if (this.y < -this.outerRadius) {
        // If it floats off the screen
        const index = donuts.indexOf(this);
        if (index > -1) {
          donuts.splice(index, 1); // Remove the donut from the array
          createDonut(); // Create a new donut
        }
      }
    } else if (this.y < canvas.height + this.outerRadius) {
      // If it's still moving downward, update its position
      this.y += this.speed;
    } else if (!this.hitBottom) {
      // If it hits the bottom for the first time
      this.hitBottom = true; // Mark it as hit the bottom
      setTimeout(() => {
        this.isFloating = true; // After 3 seconds, start floating back up
      }, 3000); // 3000 milliseconds = 3 seconds
    }
  };

  // Stops the donut and makes it float to the surface after 3 seconds
  this.stop = function () {
    this.hasCollided = true; // Stop downward movement on collision
    setTimeout(() => {
      this.isFloating = true; // Start floating after 3 seconds
    }, 3000); // 3000 milliseconds = 3 seconds
  };
}

// Swimmer constructor
function Swimmer(x, y, speed) {
  this.x = x;
  this.y = y;
  this.speed = speed;
  this.radius = 25; // Approximate radius for collision detection

  // Update the swimmer's position based on user input
  this.update = function () {
    // Check movement direction
    if (keys.w && this.y > 0) this.y -= this.speed; // Move up
    if (keys.s && this.y < canvas.height - 50) this.y += this.speed; // Move down

    // Handle left movement
    if (keys.a && this.x > 0) {
      this.x -= this.speed; // Move left
      isFacingLeft = true; // Set facing left
    } else if (keys.d && this.x < canvas.width - 100) {
      this.x += this.speed; // Move right
      isFacingLeft = false; // Reset facing left
    }

    // Check if the swimmer is moving
    isMoving = keys.w || keys.a || keys.s || keys.d;
  };

  // Draw the swimmer based on movement state and facing direction
  this.draw = function () {
    const frames = isMoving ? swimFrames : idleFrames;
    if (isFacingLeft) {
      ctx.save(); // Save the current state
      ctx.scale(-1, 1); // Flip the context horizontally
      ctx.drawImage(frames[currentFrame], -this.x - 100, this.y, 100, 50); // Draw current frame of swimmer flipped
      ctx.restore(); // Restore the state
    } else {
      ctx.drawImage(frames[currentFrame], this.x, this.y, 100, 50); // Draw current frame of swimmer
    }
  };
}

// Key state tracking
// Object to track key states
const keys = {
  w: false,
  a: false,
  s: false,
  d: false,
  space: false, // Add a key state for space
};

window.addEventListener("keydown", (e) => {
  if (e.key === "w") keys.w = true;
  if (e.key === "a") keys.a = true;
  if (e.key === "s") keys.s = true;
  if (e.key === "d") keys.d = true;
  if (e.key === " ") keys.space = true; // Set space to true when pressed
});

window.addEventListener("keyup", (e) => {
  if (e.key === "w") keys.w = false;
  if (e.key === "a") keys.a = false;
  if (e.key === "s") keys.s = false;
  if (e.key === "d") keys.d = false;
  if (e.key === " ") keys.space = false; // Reset space when released
});

// Function to generate donuts
function createDonut() {
  const outerRadius = Math.random() * 20 + 20;
  const innerRadius = outerRadius / 1.3;
  const x = Math.random() * (canvas.width - outerRadius * 2) + outerRadius;
  const y = Math.random() * -canvas.height;
  const speed = Math.random() + 1;
  donuts.push(new Donut(x, y, outerRadius, innerRadius, speed));
}

// Create donuts
for (let i = 0; i < 10; i++) {
  createDonut();
}

// Create a swimmer instance
const swimmer = new Swimmer(200, canvas.height / 2, 5); // Start at (200, canvas middle) with speed 5

// Function to check collision between swimmer and donuts
function checkCollision(swimmer, donut) {
  const distX = swimmer.x + 50 - donut.x; // Adjust for swimmer image width
  const distY = swimmer.y + 25 - donut.y; // Adjust for swimmer image height
  const distance = Math.sqrt(distX * distX + distY * distY);

  return distance < swimmer.radius + donut.outerRadius; // Check if distance is less than the combined radii
}

// Draw title screen with a play button
function drawTitleScreen() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
  ctx.fillStyle = "rgba(173, 216, 230, 1)"; // Light blue background
  ctx.fillRect(0, 0, canvas.width, canvas.height); // Draw background

  ctx.fillStyle = "black";
  ctx.font = "50px Arial";
  ctx.fillText("Tide of Toys", canvas.width / 2 - 150, canvas.height / 2 - 50);

  ctx.fillStyle = "green";
  ctx.fillRect(canvas.width / 2 - 75, canvas.height / 2, 150, 50); // Draw "Play" button

  ctx.fillStyle = "white";
  ctx.font = "30px Arial";
  ctx.fillText("Play", canvas.width / 2 - 30, canvas.height / 2 + 35);
}

// Function to start the game
function startGame() {
  gameStarted = true;
  countdownInterval = setInterval(() => {
    timer--;
    if (timer <= 0) {
      clearInterval(countdownInterval);
      gameOver = true; // End the game when timer reaches 0
    }
  }, 1000); // Decrease timer every second

  animate(); // Start the game loop
}

// Add a flag to check if the game can restart
let canRestart = false;

// Function to reset the game state
function resetGame() {
  // Reset all game variables
  gameStarted = false;
  timer = 60;
  gameOver = false;
  score = 0;
  donuts.length = 0; // Clear the donuts array
  currentFrame = 0; // Reset the current frame
  frameTimer = 0; // Reset the frame timer
  canRestart = false; // Reset the restart flag

  // Create new donuts
  for (let i = 0; i < 10; i++) {
    createDonut();
  }

  // Start the title screen
  drawTitleScreen();
}

// Update the animate function to show the Play Again button
function animate() {
  if (!gameStarted) {
    drawTitleScreen(); // Show the title screen until the game starts
    return;
  }

  // Clear the entire canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(173, 216, 230, 1)"; // Light blue background
  ctx.fillRect(0, 0, canvas.width, canvas.height); // Draw the background

  if (gameOver) {
    // Show the "Game Over" screen with the final score
    ctx.fillStyle = "black";
    ctx.font = "40px Arial";
    ctx.fillText(
      `Game Over! Final Score: ${score}`,
      canvas.width / 2 - 180,
      canvas.height / 2
    );

    // Draw the "Play Again" button
    ctx.fillStyle = "green";
    ctx.fillRect(canvas.width / 2 - 120, canvas.height / 2, 240, 90); // Draw "Play Again" button
    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    ctx.fillText("Play Again", canvas.width / 2 - 70, canvas.height / 2 + 40);
    canRestart = true; // Allow restart
    return;
  }

  // Animate donuts and check for collisions
  for (let i = donuts.length - 1; i >= 0; i--) {
    const donut = donuts[i];
    donut.update();
    donut.draw();

    // Check if the swimmer collides with the donut
    if (checkCollision(swimmer, donut) && !donut.hasCollided && keys.space) {
      donuts.splice(i, 1); // Remove the donut from the array
      score += 1; // Increase the score immediately on collision
    }
  }

  // Animate swimmer
  swimmer.update();

  // Update the frame timer and change frames based on the interval
  frameTimer += 1; // Increment frame timer
  if (frameTimer >= frameInterval / 16.67) {
    // Convert milliseconds to frames
    currentFrame = (currentFrame + 1) % totalFrames; // Cycle through frames
    frameTimer = 0; // Reset the timer
  }

  swimmer.draw();

  // Display score
  ctx.fillStyle = "black";
  ctx.font = "20px Arial";
  ctx.fillText(`Score: ${score}`, 10, 30);

  // Display timer
  ctx.fillText(`Time Left: ${timer}`, canvas.width - 150, 30);

  // Continue the animation
  requestAnimationFrame(animate);
}

// Handle mouse click to restart the game
canvas.addEventListener("click", function (event) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  // Check if "Play" button is clicked
  if (
    !gameStarted &&
    mouseX >= canvas.width / 2 - 75 &&
    mouseX <= canvas.width / 2 + 75 &&
    mouseY >= canvas.height / 2 &&
    mouseY <= canvas.height / 2 + 50
  ) {
    startGame();
  }

  // Check if "Play Again" button is clicked
  if (
    gameOver &&
    canRestart &&
    mouseX >= canvas.width / 2 - 75 &&
    mouseX <= canvas.width / 2 + 75 &&
    mouseY >= canvas.height / 2 + 50 &&
    mouseY <= canvas.height / 2 + 100
  ) {
    resetGame(); // Reset the game
  }
});

// Start by drawing the title screen
drawTitleScreen();
