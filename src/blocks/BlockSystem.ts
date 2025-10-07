import * as THREE from 'three';
import { PhysicsWorld } from '../physics/PhysicsWorld';

export enum BlockType {
  CUBE = 'cube',
  LONG_BLOCK = 'long',
  FLAT_BLOCK = 'flat',
  WEDGE = 'wedge',
  CYLINDER = 'cylinder',
  SPHERE = 'sphere'
}

export interface BlockDefinition {
  type: BlockType;
  size: THREE.Vector3;
  color: number;
  name: string;
}

export class BlockSystem {
  private scene: THREE.Scene;
  private physics: PhysicsWorld;
  private blocks: THREE.Mesh[] = [];

  // 积木预设
  public static readonly BLOCK_PRESETS: BlockDefinition[] = [
    {
      type: BlockType.CUBE,
      size: new THREE.Vector3(1, 1, 1),
      color: 0xff6b6b,
      name: '标准立方体'
    },
    {
      type: BlockType.LONG_BLOCK,
      size: new THREE.Vector3(2, 0.5, 0.5),
      color: 0x4ecdc4,
      name: '长条积木'
    },
    {
      type: BlockType.FLAT_BLOCK,
      size: new THREE.Vector3(2, 0.25, 1),
      color: 0xf9ca24,
      name: '平板积木'
    },
    {
      type: BlockType.WEDGE,
      size: new THREE.Vector3(1, 0.5, 1),
      color: 0x6c5ce7,
      name: '斜面积木'
    },
    {
      type: BlockType.CYLINDER,
      size: new THREE.Vector3(0.5, 1, 0.5), // x=radius, y=height
      color: 0x45b7d1,
      name: '圆柱积木'
    },
    {
      type: BlockType.SPHERE,
      size: new THREE.Vector3(0.5, 0.5, 0.5), // x=radius
      color: 0xff9ff3,
      name: '球体积木'
    }
  ];

  constructor(scene: THREE.Scene, physics: PhysicsWorld) {
    this.scene = scene;
    this.physics = physics;
  }

  /**
   * 创建积木
   */
  createBlock(
    definition: BlockDefinition,
    position: THREE.Vector3 = new THREE.Vector3(0, 5, 0)
  ): THREE.Mesh {
    let geometry: THREE.BufferGeometry;
    let mesh: THREE.Mesh;

    switch (definition.type) {
      case BlockType.CUBE:
        geometry = new THREE.BoxGeometry(
          definition.size.x,
          definition.size.y,
          definition.size.z
        );
        break;

      case BlockType.LONG_BLOCK:
        geometry = new THREE.BoxGeometry(
          definition.size.x,
          definition.size.y,
          definition.size.z
        );
        break;

      case BlockType.FLAT_BLOCK:
        geometry = new THREE.BoxGeometry(
          definition.size.x,
          definition.size.y,
          definition.size.z
        );
        break;

      case BlockType.WEDGE:
        // 创建楔形（三角柱）
        const wedgeShape = new THREE.Shape();
        wedgeShape.moveTo(0, 0);
        wedgeShape.lineTo(definition.size.x, 0);
        wedgeShape.lineTo(definition.size.x, definition.size.y);
        wedgeShape.lineTo(0, 0);

        const extrudeSettings = {
          steps: 1,
          depth: definition.size.z,
          bevelEnabled: false
        };
        geometry = new THREE.ExtrudeGeometry(wedgeShape, extrudeSettings);
        break;

      case BlockType.CYLINDER:
        geometry = new THREE.CylinderGeometry(
          definition.size.x,
          definition.size.x,
          definition.size.y,
          32
        );
        break;

      case BlockType.SPHERE:
        geometry = new THREE.SphereGeometry(definition.size.x, 32, 32);
        break;

      default:
        geometry = new THREE.BoxGeometry(1, 1, 1);
    }

    const material = new THREE.MeshStandardMaterial({
      color: definition.color,
      roughness: 0.7,
      metalness: 0.3
    });

    mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = {
      blockType: definition.type,
      blockName: definition.name,
      isDraggable: true
    };

    this.scene.add(mesh);
    this.blocks.push(mesh);

    // 添加物理体
    if (definition.type === BlockType.SPHERE) {
      this.physics.addSphere(mesh, 1);
    } else if (definition.type === BlockType.CYLINDER) {
      this.physics.addCylinder(mesh, 1);
    } else {
      this.physics.addBox(mesh, 1);
    }

    return mesh;
  }

  /**
   * 移除积木
   */
  removeBlock(mesh: THREE.Mesh): void {
    const index = this.blocks.indexOf(mesh);
    if (index > -1) {
      this.blocks.splice(index, 1);
      this.physics.removeBody(mesh);
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
  }

  /**
   * 清除所有积木
   */
  clearAllBlocks(): void {
    const blocksToRemove = [...this.blocks];
    blocksToRemove.forEach(block => this.removeBlock(block));
  }

  /**
   * 获取所有积木
   */
  getAllBlocks(): THREE.Mesh[] {
    return this.blocks;
  }

  /**
   * 复制积木
   */
  cloneBlock(mesh: THREE.Mesh): THREE.Mesh | null {
    const blockType = mesh.userData.blockType;
    const preset = BlockSystem.BLOCK_PRESETS.find(p => p.type === blockType);

    if (preset) {
      const newPosition = mesh.position.clone().add(new THREE.Vector3(0, 2, 0));
      return this.createBlock(preset, newPosition);
    }

    return null;
  }

  /**
   * 改变积木颜色
   */
  changeBlockColor(mesh: THREE.Mesh, color: number): void {
    (mesh.material as THREE.MeshStandardMaterial).color.setHex(color);
  }

  /**
   * 获取积木数量
   */
  getBlockCount(): number {
    return this.blocks.length;
  }
}
