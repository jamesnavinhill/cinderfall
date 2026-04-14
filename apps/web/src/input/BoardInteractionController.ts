import type { CameraRig } from '@/render/CameraRig';
import type { MountCinderScene } from '@/render/MountCinderScene';

export interface BoardInteractionDelegate {
  onHover(nodeId: string | null): void;
  onSelect(nodeId: string): void;
}

export class BoardInteractionController {
  private pointerDownPosition: { x: number; y: number } | null = null;

  private readonly onPointerMove = (event: PointerEvent): void => {
    this.delegate.onHover(this.scene.pickNode(event.clientX, event.clientY, this.cameraRig.camera, this.host));
  };

  private readonly onPointerLeave = (): void => {
    this.delegate.onHover(null);
  };

  private readonly onPointerDown = (event: PointerEvent): void => {
    this.pointerDownPosition = {
      x: event.clientX,
      y: event.clientY,
    };
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    if (!this.pointerDownPosition) {
      return;
    }

    const movedDistance = Math.hypot(
      event.clientX - this.pointerDownPosition.x,
      event.clientY - this.pointerDownPosition.y,
    );

    this.pointerDownPosition = null;

    if (movedDistance > 6) {
      return;
    }

    const selectedNodeId = this.scene.pickNode(event.clientX, event.clientY, this.cameraRig.camera, this.host);

    if (selectedNodeId) {
      this.delegate.onSelect(selectedNodeId);
    }
  };

  constructor(
    private readonly host: HTMLElement,
    private readonly cameraRig: CameraRig,
    private readonly scene: MountCinderScene,
    private readonly delegate: BoardInteractionDelegate,
  ) {
    this.host.addEventListener('pointermove', this.onPointerMove);
    this.host.addEventListener('pointerleave', this.onPointerLeave);
    this.host.addEventListener('pointerdown', this.onPointerDown);
    this.host.addEventListener('pointerup', this.onPointerUp);
  }

  dispose(): void {
    this.host.removeEventListener('pointermove', this.onPointerMove);
    this.host.removeEventListener('pointerleave', this.onPointerLeave);
    this.host.removeEventListener('pointerdown', this.onPointerDown);
    this.host.removeEventListener('pointerup', this.onPointerUp);
  }
}
