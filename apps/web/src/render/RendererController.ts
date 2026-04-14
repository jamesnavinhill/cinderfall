import { ACESFilmicToneMapping, PCFSoftShadowMap, Scene, SRGBColorSpace, WebGLRenderer } from 'three';

import { CameraRig } from '@/render/CameraRig';

export class RendererController {
  readonly renderer: WebGLRenderer;
  readonly cameraRig: CameraRig;

  private readonly resizeObserver: ResizeObserver;

  constructor(private readonly host: HTMLElement) {
    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.domElement.className = 'render-canvas';

    this.host.append(this.renderer.domElement);

    this.cameraRig = new CameraRig(this.renderer.domElement);
    this.resizeObserver = new ResizeObserver(() => {
      this.resize();
    });
    this.resizeObserver.observe(this.host);

    this.resize();
  }

  update(_deltaSeconds: number): void {
    this.cameraRig.update();
  }

  render(scene: Scene): void {
    this.renderer.render(scene, this.cameraRig.camera);
  }

  dispose(): void {
    this.resizeObserver.disconnect();
    this.cameraRig.dispose();
    this.renderer.dispose();
  }

  private resize(): void {
    const width = Math.max(1, this.host.clientWidth);
    const height = Math.max(1, this.host.clientHeight);

    this.cameraRig.resize(width, height);
    this.renderer.setSize(width, height, false);
  }
}
