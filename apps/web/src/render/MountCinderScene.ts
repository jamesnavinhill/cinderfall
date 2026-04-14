import {
  AmbientLight,
  BoxGeometry,
  CatmullRomCurve3,
  CircleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  DodecahedronGeometry,
  Fog,
  Group,
  HemisphereLight,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  Scene,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector3,
  WireframeGeometry,
} from 'three';

import type { BoardGraph, BoardNodeDefinition } from '@/board/boardTypes';
import type { DebugStore } from '@/debug/DebugStore';
import type { GameState, PlayerState } from '@/game/gameTypes';

const nodeStoneGeometry = new CylinderGeometry(1.15, 1.4, 0.4, 12);
const playerTokenGeometry = new CylinderGeometry(0.55, 0.75, 2.4, 16);
const playerTokenCapGeometry = new CylinderGeometry(0.4, 0.55, 0.45, 16);
const heartstoneGeometry = new DodecahedronGeometry(0.65, 0);

export class MountCinderScene {
  readonly scene: Scene;

  private readonly debugGroup = new Group();
  private readonly tokenGroup = new Group();
  private readonly playerTokens = new Map<string, Group>();
  private readonly playerMaterials = new Map<string, MeshStandardMaterial>();
  private readonly heartstoneMesh: Mesh;

  private elapsedSeconds = 0;
  private readonly unsubscribeDebug: () => void;

  constructor(
    private readonly boardGraph: BoardGraph,
    private readonly boardState: GameState,
    debugStore: DebugStore,
  ) {
    this.scene = new Scene();
    this.scene.background = new Color('#f1af69');
    this.scene.fog = new Fog('#f1af69', 32, 88);

    this.buildEnvironment();
    this.buildBoard();
    this.buildDebugHelpers();
    this.buildPlayers();

    this.heartstoneMesh = new Mesh(
      heartstoneGeometry,
      new MeshStandardMaterial({
        color: '#ffd875',
        emissive: '#ff8c30',
        emissiveIntensity: 1.2,
        roughness: 0.24,
        metalness: 0.1,
      }),
    );
    this.heartstoneMesh.castShadow = true;

    this.scene.add(this.tokenGroup, this.debugGroup, this.heartstoneMesh);

    this.unsubscribeDebug = debugStore.subscribe((state) => {
      this.debugGroup.visible = state.visible;
    });
  }

  update(elapsedSeconds: number): void {
    this.elapsedSeconds = elapsedSeconds;
    this.updatePlayerTokens();
    this.updateHeartstone();
    this.animateEnvironment();
  }

  dispose(): void {
    this.unsubscribeDebug();
  }

  private buildEnvironment(): void {
    const ocean = new Mesh(
      new CircleGeometry(76, 48),
      new MeshStandardMaterial({
        color: '#25424a',
        roughness: 0.9,
        metalness: 0.02,
      }),
    );
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.y = -0.9;
    ocean.receiveShadow = true;

    const islandBase = new Mesh(
      new CylinderGeometry(10, 24, 18, 12, 1),
      new MeshStandardMaterial({
        color: '#5a4032',
        roughness: 1,
      }),
    );
    islandBase.position.y = 8;
    islandBase.castShadow = true;
    islandBase.receiveShadow = true;

    const summit = new Mesh(
      new ConeGeometry(8, 8, 12),
      new MeshStandardMaterial({
        color: '#6b4a36',
        roughness: 1,
      }),
    );
    summit.position.set(0, 18, -11.5);
    summit.castShadow = true;

    const craterRing = new Mesh(
      new TorusGeometry(4.2, 1.1, 20, 48),
      new MeshStandardMaterial({
        color: '#3f2b20',
        roughness: 0.95,
      }),
    );
    craterRing.rotation.x = Math.PI / 2;
    craterRing.position.set(0, 18.25, -13.5);
    craterRing.castShadow = true;

    const lavaPool = new Mesh(
      new CircleGeometry(3.65, 24),
      new MeshStandardMaterial({
        color: '#ff9b3d',
        emissive: '#ff5f1a',
        emissiveIntensity: 1.2,
        roughness: 0.25,
      }),
    );
    lavaPool.rotation.x = -Math.PI / 2;
    lavaPool.position.set(0, 18.45, -13.5);
    lavaPool.name = 'lava-pool';

    const dock = new Mesh(
      new BoxGeometry(10, 0.7, 5),
      new MeshStandardMaterial({
        color: '#6b5843',
        roughness: 0.88,
      }),
    );
    dock.position.set(0, 0.35, 19.5);
    dock.castShadow = true;
    dock.receiveShadow = true;

    const ambientLight = new AmbientLight('#e6ccb2', 0.35);
    const hemisphereLight = new HemisphereLight('#fff1d1', '#3a2b25', 1.2);
    const sunLight = new DirectionalLight('#ffe0b0', 2.5);
    sunLight.position.set(18, 30, 14);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.setScalar(2048);
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 120;
    sunLight.shadow.camera.left = -45;
    sunLight.shadow.camera.right = 45;
    sunLight.shadow.camera.top = 45;
    sunLight.shadow.camera.bottom = -45;

    this.scene.add(ocean, islandBase, summit, craterRing, lavaPool, dock, ambientLight, hemisphereLight, sunLight);
  }

  private buildBoard(): void {
    const connectorMaterial = new MeshStandardMaterial({
      color: '#88715b',
      roughness: 0.96,
    });

    for (const edge of this.boardGraph.edges) {
      const fromNode = this.boardGraph.nodeById.get(edge.from);
      const toNode = this.boardGraph.nodeById.get(edge.to);

      if (!fromNode || !toNode) {
        continue;
      }

      const connector = createConnector(fromNode, toNode, connectorMaterial);
      connector.castShadow = true;
      connector.receiveShadow = true;
      this.scene.add(connector);
    }

    for (const node of this.boardGraph.definition.nodes) {
      const stone = new Mesh(
        nodeStoneGeometry,
        new MeshStandardMaterial({
          color: getNodeColor(node),
          roughness: 0.82,
          metalness: 0.04,
          emissive: node.tags.includes('objective') ? '#8f3b16' : '#000000',
          emissiveIntensity: node.tags.includes('objective') ? 0.9 : 0,
        }),
      );

      stone.position.set(node.position[0], node.position[1], node.position[2]);
      stone.castShadow = true;
      stone.receiveShadow = true;
      this.scene.add(stone);
    }
  }

  private buildDebugHelpers(): void {
    const nodeWireMaterial = new MeshBasicMaterial({
      color: '#aee2ff',
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });

    for (const node of this.boardGraph.definition.nodes) {
      const nodeMarker = new Mesh(new SphereGeometry(1.65, 10, 10), nodeWireMaterial);
      nodeMarker.position.set(node.position[0], node.position[1] + 0.15, node.position[2]);
      this.debugGroup.add(nodeMarker);
    }

    for (const lane of this.boardGraph.definition.hazardLanes) {
      const lanePoints = lane.nodeIds
        .map((nodeId) => this.boardGraph.nodeById.get(nodeId))
        .filter((node): node is BoardNodeDefinition => Boolean(node))
        .map((node) => new Vector3(node.position[0], node.position[1] + 0.7, node.position[2]));

      const curve = new CatmullRomCurve3(lanePoints);
      const tube = new Mesh(
        new TubeGeometry(curve, 64, 0.22, 10, false),
        new MeshStandardMaterial({
          color: '#ff8f45',
          emissive: '#ff621e',
          emissiveIntensity: 1.5,
          transparent: true,
          opacity: 0.88,
        }),
      );

      this.debugGroup.add(tube);
    }

    const islandWire = new LineSegments(
      new WireframeGeometry(new ConeGeometry(8.8, 9, 10)),
      new LineBasicMaterial({
        color: '#fbd59f',
        transparent: true,
        opacity: 0.24,
      }),
    );
    islandWire.position.set(0, 18, -11.5);
    this.debugGroup.add(islandWire);
  }

  private buildPlayers(): void {
    for (const player of this.boardState.players) {
      const tokenRoot = new Group();

      const bodyMaterial = new MeshStandardMaterial({
        color: player.colorHex,
        roughness: 0.48,
        metalness: 0.08,
      });

      const body = new Mesh(playerTokenGeometry, bodyMaterial);
      body.position.y = 1.2;
      body.castShadow = true;

      const cap = new Mesh(
        playerTokenCapGeometry,
        new MeshStandardMaterial({
          color: '#fff5d2',
          roughness: 0.24,
          metalness: 0.08,
        }),
      );
      cap.position.y = 2.42;
      cap.castShadow = true;

      tokenRoot.add(body, cap);
      this.playerTokens.set(player.id, tokenRoot);
      this.playerMaterials.set(player.id, bodyMaterial);
      this.tokenGroup.add(tokenRoot);
    }
  }

  private updatePlayerTokens(): void {
    const nodeOccupants = new Map<string, PlayerState[]>();

    for (const player of this.boardState.players) {
      const occupants = nodeOccupants.get(player.nodeId) ?? [];
      occupants.push(player);
      nodeOccupants.set(player.nodeId, occupants);
    }

    for (const [nodeId, occupants] of nodeOccupants) {
      occupants.forEach((player, index) => {
        const node = this.boardGraph.nodeById.get(nodeId);
        const token = this.playerTokens.get(player.id);
        const material = this.playerMaterials.get(player.id);

        if (!node || !token || !material) {
          return;
        }

        const angle = buildRingOffset(index, occupants.length);
        const radius = occupants.length === 1 ? 0 : 1.35;
        token.position.set(
          node.position[0] + Math.cos(angle) * radius,
          node.position[1] + Math.sin(this.elapsedSeconds * 2.2 + index) * 0.08,
          node.position[2] + Math.sin(angle) * radius,
        );

        const isActive = this.boardState.players[this.boardState.activePlayerIndex]?.id === player.id;
        token.scale.setScalar(isActive ? 1.08 : 1);
        material.emissive.set(isActive ? '#251208' : '#000000');
        material.emissiveIntensity = isActive ? 0.8 : 0;
      });
    }
  }

  private updateHeartstone(): void {
    const holder = this.boardState.heartstone.holderPlayerId
      ? this.boardState.players.find((player) => player.id === this.boardState.heartstone.holderPlayerId)
      : null;

    if (holder) {
      const token = this.playerTokens.get(holder.id);

      if (!token) {
        return;
      }

      this.heartstoneMesh.position.copy(token.position);
      this.heartstoneMesh.position.y += 3.55;
    } else {
      const node = this.boardGraph.nodeById.get(this.boardState.heartstone.nodeId);

      if (!node) {
        return;
      }

      this.heartstoneMesh.position.set(
        node.position[0],
        node.position[1] + 1.35 + Math.sin(this.elapsedSeconds * 2.4) * 0.18,
        node.position[2],
      );
    }

    this.heartstoneMesh.rotation.y += 0.02;
  }

  private animateEnvironment(): void {
    const lavaPool = this.scene.getObjectByName('lava-pool');

    if (!lavaPool || !(lavaPool instanceof Mesh) || !(lavaPool.material instanceof MeshStandardMaterial)) {
      return;
    }

    lavaPool.material.emissiveIntensity = 1.05 + Math.sin(this.elapsedSeconds * 2.6) * 0.18;
  }
}

function createConnector(
  fromNode: BoardNodeDefinition,
  toNode: BoardNodeDefinition,
  material: MeshStandardMaterial,
): Object3D {
  const from = new Vector3(fromNode.position[0], fromNode.position[1] - 0.15, fromNode.position[2]);
  const to = new Vector3(toNode.position[0], toNode.position[1] - 0.15, toNode.position[2]);
  const direction = new Vector3().subVectors(to, from);
  const length = direction.length();

  const connector = new Mesh(new CylinderGeometry(0.5, 0.5, length, 10), material.clone());
  connector.position.copy(from).lerp(to, 0.5);
  connector.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize());

  return connector;
}

function getNodeColor(node: BoardNodeDefinition): string {
  if (node.tags.includes('objective')) {
    return '#c76f2e';
  }

  if (node.tags.includes('dock')) {
    return '#567479';
  }

  if (node.tags.includes('danger')) {
    return '#9e5b35';
  }

  if (node.tags.includes('shortcut')) {
    return '#7f6f5b';
  }

  if (node.tags.includes('summit')) {
    return '#b48b62';
  }

  return '#8f7a63';
}

function buildRingOffset(index: number, total: number): number {
  if (total <= 1) {
    return 0;
  }

  return (index / total) * Math.PI * 2;
}
