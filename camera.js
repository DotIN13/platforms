import { settings } from "./settings.js";

class Camera {
  constructor() {
    this.y = 0;
    this.targetY = 0;
    this.transform = 0;

    this.update_transform();
  }

  /**
   * Update the transform value based on the camera's y position.
   * This value is used to translate the canvas so that the camera
   * can follow the player.
   */
  update_transform() {
    this.transform = settings.HEIGHT * (2 / 5) - this.y;
  }

  reset() {
    this.y = 0;
    this.targetY = 0;
    this.update_transform();
  }

  update(maxLevel) {
    this.targetY = Math.max(this.targetY, maxLevel * settings.PLATFORM_SPACING);
    this.y += (this.targetY - this.y) * settings.CAMERA_SPEED;
    this.update_transform();
  }
}

const camera = new Camera();

function t(y) {
  return y + camera.transform;
}

export { camera, t };
