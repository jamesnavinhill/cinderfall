import { PerspectiveCamera, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class CameraRig {
  readonly camera: PerspectiveCamera;
  readonly controls: OrbitControls;

  private readonly defaultPosition = new Vector3(24, 24, 28);
  private readonly defaultTarget = new Vector3(0, 8.5, 0);

  constructor(domElement: HTMLElement) {
    this.camera = new PerspectiveCamera(50, 1, 0.1, 200);
    this.controls = new OrbitControls(this.camera, domElement);

    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = true;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 58;
    this.controls.maxPolarAngle = Math.PI / 2.05;
    this.controls.target.copy(this.defaultTarget);

    this.reset();
  }

  reset(): void {
    this.camera.position.copy(this.defaultPosition);
    this.controls.target.copy(this.defaultTarget);
    this.controls.update();
  }

  resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  update(): void {
    this.controls.update();
  }

  dispose(): void {
    this.controls.dispose();
  }
}
