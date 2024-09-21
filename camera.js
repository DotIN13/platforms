import { settings } from "./settings.js";

class Camera {
  constructor() {
    this.y = 0;
    this.targetY = 0;
  }

  update() {
    this.y += (this.targetY - this.y) * settings.CAMERA_SPEED;
  }
}

const camera = new Camera();

function t(y) {
  return y - camera.y + settings.HEIGHT / 2;
}

export { camera, t };
