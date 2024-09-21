import { settings } from "./settings.js";

class Camera {
  constructor() {
    this.y = 0;
    this.targetY = 0;
  }

  update(maxLevel) {
    this.targetY = Math.max(this.targetY, maxLevel * settings.PLATFORM_SPACING);
    this.y += (this.targetY - this.y) * settings.CAMERA_SPEED;
  }
}

const camera = new Camera();

function t(y) {
  return y - camera.y + settings.HEIGHT * (2 / 5);
}

export { camera, t };
