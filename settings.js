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

    // Game animations
    this.BOUNCING_HEIGHT = 0.7 * this.PLATFORM_SPACING;

    // Canvas dimensions
    this.CANVAS_WIDTH = 400; // Original game width
    this.CANVAS_HEIGHT = 600; // Original game height
    this.ASPECT_RATIO = this.CANVAS_WIDTH / this.CANVAS_HEIGHT; // 0.6667

    // Dynamic canvas size
    this.WIDTH = this.CANVAS_WIDTH;
    this.HEIGHT = this.CANVAS_HEIGHT;

    // Initialize canvas size
    this.resizeCanvas();

    // Bind the resizeCanvas method to maintain 'this' context
    this.resizeCanvas = this.resizeCanvas.bind(this);

    // Add event listener for window resize
    window.addEventListener("resize", this.resizeCanvas);
  }

  resizeCanvas() {
    const aspectRatio = this.ASPECT_RATIO;

    // Get the available width and height
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Calculate the maximum canvas size that fits in the window while maintaining aspect ratio
    let newHeight = windowHeight;
    let newWidth = newHeight * aspectRatio;

    if (newWidth > windowWidth) {
      // Adjust width and height to fit within window height
      newHeight = windowHeight;
      newWidth = windowHeight * aspectRatio;
    }

    // Adjust for device pixel ratio
    const scale = window.devicePixelRatio || 1;

    // Set the canvas's internal dimensions to match the displayed size multiplied by the scale
    this.canvas.width = newWidth * scale;
    this.canvas.height = newHeight * scale;

    // Set the canvas's CSS size to the new width and height
    this.canvas.style.width = `${newWidth}px`;
    this.canvas.style.height = `${newHeight}px`;

    // Update the drawing context scale
    this.ctx.setTransform(scale, 0, 0, scale, 0, 0);

    // Update WIDTH and HEIGHT properties
    this.WIDTH = this.canvas.width / scale;
    this.HEIGHT = this.canvas.height / scale;
  }
}

// Canvas setup
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const settings = new Settings(canvas, ctx);

export { settings, canvas, ctx };
