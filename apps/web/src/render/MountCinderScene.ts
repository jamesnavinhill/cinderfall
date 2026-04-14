import {
  AmbientLight,
  BoxGeometry,
  Camera,
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
  Raycaster,
  Scene,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
  WireframeGeometry,
} from 'three';

import type { BoardGraph, BoardNodeDefinition, NodeId } from '@/board/boardTypes';
import type { DebugStore } from '@/debug/DebugStore';
import type { GameState, PlayerState } from '@/game/gameTypes';

const BOARD_SURFACE_LIFT = 0.8;
const CONNECTOR_SURFACE_LIFT = 0.42;

const nodeStoneGeometry = new CylinderGeometry(1.15, 1.4, 0.65, 12);
const playerTokenGeometry = new CylinderGeometry(0.55, 0.75, 2.4, 16);
const playerTokenCapGeometry = new CylinderGeometry(0.4, 0.55, 0.45, 16);
const heartstoneGeometry = new DodecahedronGeometry(0.65, 0);

interface NodeMaterialPreset {
  color: string;
  emissive: string;
  emissiveIntensity: number;
}

export interface NavigationPresentationState {
  activeNodeId: NodeId;
  hoveredNodeId: NodeId | null;
  reachableNodeIds: readonly NodeId[];
  previewPath: readonly NodeId[];
}

export class MountCinderScene {
  readonly scene: Scene;

  private readonly debugGroup = new Group();
  private readonly tokenGroup = new Group();
  private readonly playerTokens = new Map<string, Group>();
  private readonly playerMaterials = new Map<string, MeshStandardMaterial>();
  private readonly nodeMeshes = new Map<NodeId, Mesh>();
  private readonly nodeMaterials = new Map<NodeId, MeshStandardMaterial>();
  private readonly nodeMaterialPresets = new Map<NodeId, NodeMaterialPreset>();
  private readonly connectorMaterials = new Map<string, MeshStandardMaterial>();
  private readonly heartstoneMesh: Mesh;
  private readonly raycaster = new Raycaster();
  private readonly pointer = new Vector2();

  private boardState: GameState;
  private navigationState: NavigationPresentationState;
  private elapsedSeconds = 0;
  private readonly unsubscribeDebug: () => void;

  constructor(
    private readonly boardGraph: BoardGraph,
    initialState: GameState,
    debugStore: DebugStore,
  ) {
    this.boardState = initialState;
    this.navigationState = {
      activeNodeId: initialState.players[initialState.activePlayerIndex]?.nodeId ?? initialState.heartstone.nodeId,
      hoveredNodeId: null,
      reachableNodeIds: [],
      previewPath: [],
    };

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

    this.applyNavigationState();
  }

  update(elapsedSeconds: number): void {
    this.elapsedSeconds = elapsedSeconds;
    this.updatePlayerTokens();
    this.updateHeartstone();
    this.animateEnvironment();
  }

  setGameState(state: GameState): void {
    this.boardState = state;
  }

  setNavigationState(state: NavigationPresentationState): void {
    this.navigationState = state;
    this.applyNavigationState();
  }

  pickNode(clientX: number, clientY: number, camera: Camera, domElement: HTMLElement): NodeId | null {
    const rect = domElement.getBoundingClientRect();

    this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, camera);
    const intersections = this.raycaster.intersectObjects([...this.nodeMeshes.values()], false);
    const firstHit = intersections[0];

    return (firstHit?.object.userData.nodeId as NodeId | undefined) ?? null;
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

      if (connector instanceof Mesh && connector.material instanceof MeshStandardMaterial) {
        this.connectorMaterials.set(buildEdgeKey(fromNode.id, toNode.id), connector.material);
      }
    }

    for (const node of this.boardGraph.definition.nodes) {
      const preset = getNodeMaterialPreset(node);
      const material = new MeshStandardMaterial({
        color: preset.color,
        roughness: 0.82,
        metalness: 0.04,
        emissive: preset.emissive,
        emissiveIntensity: preset.emissiveIntensity,
      });

      const stone = new Mesh(nodeStoneGeometry, material);
      const [x, y, z] = getLiftedNodePosition(node);
      stone.position.set(x, y, z);
      stone.castShadow = true;
      stone.receiveShadow = true;
      stone.userData.nodeId = node.id;

      this.nodeMeshes.set(node.id, stone);
      this.nodeMaterials.set(node.id, material);
      this.nodeMaterialPresets.set(node.id, preset);
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
      const [x, y, z] = getLiftedNodePosition(node, 0.15);
      nodeMarker.position.set(x, y, z);
      this.debugGroup.add(nodeMarker);
    }

    for (const lane of this.boardGraph.definition.hazardLanes) {
      const lanePoints = lane.nodeIds
        .map((nodeId) => this.boardGraph.nodeById.get(nodeId))
        .filter((node): node is BoardNodeDefinition => Boolean(node))
        .map((node) => {
          const [x, y, z] = getLiftedNodePosition(node, 0.7);

          return new Vector3(x, y, z);
        });

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
        const [x, y, z] = getLiftedNodePosition(node, Math.sin(this.elapsedSeconds * 2.2 + index) * 0.08);
        token.position.set(
          x + Math.cos(angle) * radius,
          y,
          z + Math.sin(angle) * radius,
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

      const [x, y, z] = getLiftedNodePosition(node, 1.35 + Math.sin(this.elapsedSeconds * 2.4) * 0.18);
      this.heartstoneMesh.position.set(
        x,
        y,
        z,
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

  private applyNavigationState(): void {
    for (const [nodeId, material] of this.nodeMaterials) {
      const preset = this.nodeMaterialPresets.get(nodeId);
      const mesh = this.nodeMeshes.get(nodeId);

      if (!preset || !mesh) {
        continue;
      }

      material.color.set(preset.color);
      material.emissive.set(preset.emissive);
      material.emissiveIntensity = preset.emissiveIntensity;
      mesh.scale.setScalar(1);
    }

    for (const material of this.connectorMaterials.values()) {
      material.color.set('#88715b');
      material.emissive.set('#000000');
      material.emissiveIntensity = 0;
    }

    const reachableIds = new Set(this.navigationState.reachableNodeIds);
    const previewIds = new Set(this.navigationState.previewPath);

    for (const nodeId of reachableIds) {
      const material = this.nodeMaterials.get(nodeId);

      if (!material) {
        continue;
      }

      material.emissive.set('#4f7ca3');
      material.emissiveIntensity = 0.62;
    }

    for (const nodeId of previewIds) {
      const material = this.nodeMaterials.get(nodeId);
      const mesh = this.nodeMeshes.get(nodeId);

      if (!material || !mesh) {
        continue;
      }

      material.emissive.set('#ffb14d');
      material.emissiveIntensity = 1.3;
      mesh.scale.setScalar(1.08);
    }

    const activeMaterial = this.nodeMaterials.get(this.navigationState.activeNodeId);
    const activeMesh = this.nodeMeshes.get(this.navigationState.activeNodeId);

    if (activeMaterial && activeMesh) {
      activeMaterial.emissive.set('#ffe4af');
      activeMaterial.emissiveIntensity = 0.95;
      activeMesh.scale.setScalar(1.14);
    }

    if (this.navigationState.hoveredNodeId) {
      const hoveredMaterial = this.nodeMaterials.get(this.navigationState.hoveredNodeId);
      const hoveredMesh = this.nodeMeshes.get(this.navigationState.hoveredNodeId);

      if (hoveredMaterial && hoveredMesh) {
        const isReachable = reachableIds.has(this.navigationState.hoveredNodeId);
        hoveredMaterial.emissive.set(isReachable ? '#fff5d6' : '#d35e3f');
        hoveredMaterial.emissiveIntensity = isReachable ? 1.6 : 1.1;
        hoveredMesh.scale.setScalar(isReachable ? 1.13 : 1.06);
      }
    }

    for (let index = 0; index < this.navigationState.previewPath.length - 1; index += 1) {
      const fromNodeId = this.navigationState.previewPath[index];
      const toNodeId = this.navigationState.previewPath[index + 1];
      const material = this.connectorMaterials.get(buildEdgeKey(fromNodeId, toNodeId));

      if (!material) {
        continue;
      }

      material.color.set('#e3ad62');
      material.emissive.set('#9a6326');
      material.emissiveIntensity = 0.55;
    }
  }
}

function createConnector(
  fromNode: BoardNodeDefinition,
  toNode: BoardNodeDefinition,
  material: MeshStandardMaterial,
): Object3D {
  const [fromX, fromY, fromZ] = getLiftedNodePosition(fromNode, CONNECTOR_SURFACE_LIFT - BOARD_SURFACE_LIFT);
  const [toX, toY, toZ] = getLiftedNodePosition(toNode, CONNECTOR_SURFACE_LIFT - BOARD_SURFACE_LIFT);
  const from = new Vector3(fromX, fromY, fromZ);
  const to = new Vector3(toX, toY, toZ);
  const direction = new Vector3().subVectors(to, from);
  const length = direction.length();

  const connector = new Mesh(new CylinderGeometry(0.5, 0.5, length, 10), material.clone());
  connector.position.copy(from).lerp(to, 0.5);
  connector.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize());

  return connector;
}

function getNodeMaterialPreset(node: BoardNodeDefinition): NodeMaterialPreset {
  if (node.tags.includes('objective')) {
    return {
      color: '#c76f2e',
      emissive: '#8f3b16',
      emissiveIntensity: 0.9,
    };
  }

  if (node.tags.includes('dock')) {
    return {
      color: '#567479',
      emissive: '#000000',
      emissiveIntensity: 0,
    };
  }

  if (node.tags.includes('danger')) {
    return {
      color: '#9e5b35',
      emissive: '#2e1208',
      emissiveIntensity: 0.15,
    };
  }

  if (node.tags.includes('shortcut')) {
    return {
      color: '#7f6f5b',
      emissive: '#000000',
      emissiveIntensity: 0,
    };
  }

  if (node.tags.includes('summit')) {
    return {
      color: '#b48b62',
      emissive: '#000000',
      emissiveIntensity: 0,
    };
  }

  return {
    color: '#8f7a63',
    emissive: '#000000',
    emissiveIntensity: 0,
  };
}

function buildEdgeKey(fromNodeId: NodeId, toNodeId: NodeId): string {
  return [fromNodeId, toNodeId].sort().join(':');
}

function buildRingOffset(index: number, total: number): number {
  if (total <= 1) {
    return 0;
  }

  return (index / total) * Math.PI * 2;
}

function getLiftedNodePosition(node: BoardNodeDefinition, yOffset = 0): [number, number, number] {
  return [node.position[0], node.position[1] + BOARD_SURFACE_LIFT + yOffset, node.position[2]];
}
