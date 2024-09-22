// settings.js

class Settings {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;

    // Physics and game mechanics
    this.GRAVITY = 0.7;
    this.PLATFORM_SPACING = 150;
    this.MIN_HOLE_WIDTH = 50;
    this.MAX_HOLE_WIDTH = 100;
    this.PLATFORM_HEIGHT = 20;
    this.BALL_RADIUS = 10;
    this.MOVE_SPEED = 10; // Movement speed per tick
    this.CAMERA_SPEED = 0.1; // Camera speed
    this.BOUNCING_HEIGHT = 0.7 * this.PLATFORM_SPACING;
    this.MAX_BALL_SPEED = 15; // Maximum ball speed

    // Canvas dimensions
    this.WIDTH = 500; // Game coordinate width
    this.HEIGHT = 800; // Game coordinate height
    this.ASPECT_RATIO = this.WIDTH / this.HEIGHT; // Default aspect ratio
    this.SCALE_FACTOR = 1; // Scale factor for canvas

    // Combo
    this.COMBO_DURATION = 30; // Combo duration in ticks

    // Initialize canvas size
    this.resizeCanvas();

    // Bind the resizeCanvas method to maintain 'this' context
    this.resizeCanvas = this.resizeCanvas.bind(this);

    // Add event listener for window resize
    window.addEventListener("resize", this.resizeCanvas);
  }

  resizeCanvas() {
    // Get the available width and height
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Calculate the maximum canvas size that fits in the window while maintaining aspect ratio
    let canvasHeight = windowHeight;
    let canvasWidth = canvasHeight * this.ASPECT_RATIO;

    // If the screen is narrow
    if (canvasWidth > windowWidth) {
      canvasWidth = windowWidth;
      canvasHeight = windowHeight;
      this.ASPECT_RATIO = canvasWidth / canvasHeight;
      this.HEIGHT = this.WIDTH / this.ASPECT_RATIO; // Adjust the game coordinate height
    }

    // Adjust for device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    canvasWidth *= dpr;
    canvasHeight *= dpr;

    // Set the canvas's internal dimensions to match the displayed size multiplied by the dpr
    this.canvas.width = canvasWidth;
    this.canvas.height = canvasHeight;

    // Set the canvas's CSS size to the new width and height
    this.canvas.style.width = `${canvasWidth}px`;
    this.canvas.style.height = `${canvasHeight}px`;

    // Update the drawing context dpr
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Update the scale factor
    this.SCALE_FACTOR = canvasWidth / this.WIDTH;
    this.ctx.scale(this.SCALE_FACTOR, this.SCALE_FACTOR);
  }
}

// Canvas setup
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const settings = new Settings(canvas, ctx);

export { settings, canvas, ctx };
