import * as THREE from 'three';
import { BlockSystem, BlockType } from '../blocks/BlockSystem';
import { DragControls } from '../controls/DragControls';
import { PhysicsWorld } from '../physics/PhysicsWorld';

export class HouseBuilder {
  private blockSystem: BlockSystem;
  private dragControls: DragControls;
  private physics: PhysicsWorld;

  constructor(blockSystem: BlockSystem, dragControls: DragControls, physics: PhysicsWorld) {
    this.blockSystem = blockSystem;
    this.dragControls = dragControls;
    this.physics = physics;
  }

  /**
   * 搭建一个小房子
   */
  buildSmallHouse(centerX: number = 0, centerZ: number = 0): THREE.Mesh[] {
    const blocks: THREE.Mesh[] = [];
    const baseY = 0.125; // 地面高度

    console.log('🏠 开始搭建小房子...');

    // 1. 地基（使用平板积木）
    console.log('📐 搭建地基...');
    const foundation = [
      // 第一层地基 - 3x3
      { x: centerX - 1, y: baseY, z: centerZ - 1 },
      { x: centerX, y: baseY, z: centerZ - 1 },
      { x: centerX + 1, y: baseY, z: centerZ - 1 },
      { x: centerX - 1, y: baseY, z: centerZ },
      { x: centerX, y: baseY, z: centerZ },
      { x: centerX + 1, y: baseY, z: centerZ },
      { x: centerX - 1, y: baseY, z: centerZ + 1 },
      { x: centerX, y: baseY, z: centerZ + 1 },
      { x: centerX + 1, y: baseY, z: centerZ + 1 }
    ];

    foundation.forEach(pos => {
      const block = this.blockSystem.createBlock(
        BlockSystem.BLOCK_PRESETS.find(p => p.type === BlockType.FLAT_BLOCK)!,
        new THREE.Vector3(pos.x, pos.y, pos.z)
      );
      this.dragControls.addDraggable(block);
      this.physics.freezeBody(block); // 冻结物理体，固定不动
      blocks.push(block);
    });

    // 2. 墙壁（使用立方体积木）
    console.log('🧱 搭建墙壁...');
    const wallHeight = baseY + 0.25 + 0.5; // 地基高度 + 半个立方体
    const walls = [
      // 前墙（留出门口）
      { x: centerX - 1, y: wallHeight, z: centerZ - 1 },
      { x: centerX + 1, y: wallHeight, z: centerZ - 1 },

      // 后墙
      { x: centerX - 1, y: wallHeight, z: centerZ + 1 },
      { x: centerX, y: wallHeight, z: centerZ + 1 },
      { x: centerX + 1, y: wallHeight, z: centerZ + 1 },

      // 左墙
      { x: centerX - 1, y: wallHeight, z: centerZ },

      // 右墙
      { x: centerX + 1, y: wallHeight, z: centerZ }
    ];

    walls.forEach(pos => {
      const block = this.blockSystem.createBlock(
        BlockSystem.BLOCK_PRESETS.find(p => p.type === BlockType.CUBE)!,
        new THREE.Vector3(pos.x, pos.y, pos.z)
      );
      this.dragControls.addDraggable(block);
      this.physics.freezeBody(block); // 冻结物理体，固定不动
      blocks.push(block);
    });

    // 3. 第二层墙壁
    console.log('🧱 搭建第二层墙壁...');
    const wallHeight2 = wallHeight + 1;
    const walls2 = [
      // 前墙
      { x: centerX - 1, y: wallHeight2, z: centerZ - 1 },
      { x: centerX + 1, y: wallHeight2, z: centerZ - 1 },

      // 后墙
      { x: centerX - 1, y: wallHeight2, z: centerZ + 1 },
      { x: centerX, y: wallHeight2, z: centerZ + 1 },
      { x: centerX + 1, y: wallHeight2, z: centerZ + 1 },

      // 左墙
      { x: centerX - 1, y: wallHeight2, z: centerZ },

      // 右墙
      { x: centerX + 1, y: wallHeight2, z: centerZ }
    ];

    walls2.forEach(pos => {
      const block = this.blockSystem.createBlock(
        BlockSystem.BLOCK_PRESETS.find(p => p.type === BlockType.CUBE)!,
        new THREE.Vector3(pos.x, pos.y, pos.z)
      );
      this.dragControls.addDraggable(block);
      this.physics.freezeBody(block); // 冻结物理体，固定不动
      blocks.push(block);
    });

    // 4. 屋顶（使用平板积木）
    console.log('🏠 搭建屋顶...');
    const roofHeight = wallHeight2 + 0.5 + 0.125;
    const roof = [
      { x: centerX - 1, y: roofHeight, z: centerZ - 1 },
      { x: centerX, y: roofHeight, z: centerZ - 1 },
      { x: centerX + 1, y: roofHeight, z: centerZ - 1 },
      { x: centerX - 1, y: roofHeight, z: centerZ },
      { x: centerX, y: roofHeight, z: centerZ },
      { x: centerX + 1, y: roofHeight, z: centerZ },
      { x: centerX - 1, y: roofHeight, z: centerZ + 1 },
      { x: centerX, y: roofHeight, z: centerZ + 1 },
      { x: centerX + 1, y: roofHeight, z: centerZ + 1 }
    ];

    roof.forEach(pos => {
      const block = this.blockSystem.createBlock(
        BlockSystem.BLOCK_PRESETS.find(p => p.type === BlockType.FLAT_BLOCK)!,
        new THREE.Vector3(pos.x, pos.y, pos.z)
      );
      this.dragControls.addDraggable(block);
      this.physics.freezeBody(block); // 冻结物理体，固定不动
      blocks.push(block);
    });

    // 5. 屋顶三角形装饰（使用斜面积木）
    console.log('🔺 添加屋顶装饰...');
    const wedgeHeight = roofHeight + 0.25 + 0.25;
    const wedge1 = this.blockSystem.createBlock(
      BlockSystem.BLOCK_PRESETS.find(p => p.type === BlockType.WEDGE)!,
      new THREE.Vector3(centerX, wedgeHeight, centerZ - 1)
    );
    wedge1.rotation.y = 0;
    this.dragControls.addDraggable(wedge1);
    this.physics.freezeBody(wedge1); // 冻结物理体，固定不动
    blocks.push(wedge1);

    const wedge2 = this.blockSystem.createBlock(
      BlockSystem.BLOCK_PRESETS.find(p => p.type === BlockType.WEDGE)!,
      new THREE.Vector3(centerX, wedgeHeight, centerZ + 1)
    );
    wedge2.rotation.y = Math.PI;
    this.dragControls.addDraggable(wedge2);
    this.physics.freezeBody(wedge2); // 冻结物理体，固定不动
    blocks.push(wedge2);

    // 6. 烟囱（使用圆柱积木）
    console.log('🏭 添加烟囱...');
    const chimney = this.blockSystem.createBlock(
      BlockSystem.BLOCK_PRESETS.find(p => p.type === BlockType.CYLINDER)!,
      new THREE.Vector3(centerX + 0.8, wedgeHeight + 0.5, centerZ + 0.8)
    );
    this.dragControls.addDraggable(chimney);
    this.physics.freezeBody(chimney); // 冻结物理体，固定不动
    blocks.push(chimney);

    console.log(`✅ 小房子搭建完成！共使用 ${blocks.length} 块积木`);

    return blocks;
  }

  /**
   * 搭建一个带花园的房子
   */
  buildHouseWithGarden(centerX: number = 0, centerZ: number = 0): THREE.Mesh[] {
    const blocks: THREE.Mesh[] = [];

    // 先搭建主体房子
    const houseBlocks = this.buildSmallHouse(centerX, centerZ);
    blocks.push(...houseBlocks);

    console.log('🌳 添加花园装饰...');

    // 添加花园装饰（使用球体作为树/灌木）
    const gardenItems = [
      { x: centerX - 2.5, y: 0.5, z: centerZ - 2 },
      { x: centerX + 2.5, y: 0.5, z: centerZ - 2 },
      { x: centerX - 2.5, y: 0.5, z: centerZ + 2 },
      { x: centerX + 2.5, y: 0.5, z: centerZ + 2 }
    ];

    gardenItems.forEach(pos => {
      const tree = this.blockSystem.createBlock(
        BlockSystem.BLOCK_PRESETS.find(p => p.type === BlockType.SPHERE)!,
        new THREE.Vector3(pos.x, pos.y, pos.z)
      );
      // 改变颜色为绿色（树）
      this.blockSystem.changeBlockColor(tree, 0x2ecc71);
      this.dragControls.addDraggable(tree);
      this.physics.freezeBody(tree); // 冻结物理体，固定不动
      blocks.push(tree);
    });

    console.log(`✅ 带花园的房子搭建完成！共使用 ${blocks.length} 块积木`);

    return blocks;
  }

  /**
   * 搭建一个塔楼
   */
  buildTower(centerX: number = 0, centerZ: number = 0): THREE.Mesh[] {
    const blocks: THREE.Mesh[] = [];
    const baseY = 0.5;

    console.log('🗼 开始搭建塔楼...');

    // 搭建5层塔楼
    for (let level = 0; level < 5; level++) {
      const y = baseY + level * 1;

      // 每层4个立方体围成一圈
      const positions = [
        { x: centerX - 0.5, z: centerZ - 0.5 },
        { x: centerX + 0.5, z: centerZ - 0.5 },
        { x: centerX - 0.5, z: centerZ + 0.5 },
        { x: centerX + 0.5, z: centerZ + 0.5 }
      ];

      positions.forEach(pos => {
        const block = this.blockSystem.createBlock(
          BlockSystem.BLOCK_PRESETS.find(p => p.type === BlockType.CUBE)!,
          new THREE.Vector3(pos.x, y, pos.z)
        );
        this.dragControls.addDraggable(block);
        this.physics.freezeBody(block); // 冻结物理体，固定不动
        blocks.push(block);
      });
    }

    // 顶部装饰（圆柱）
    const topCylinder = this.blockSystem.createBlock(
      BlockSystem.BLOCK_PRESETS.find(p => p.type === BlockType.CYLINDER)!,
      new THREE.Vector3(centerX, baseY + 5, centerZ)
    );
    this.dragControls.addDraggable(topCylinder);
    this.physics.freezeBody(topCylinder); // 冻结物理体，固定不动
    blocks.push(topCylinder);

    // 顶部球体装饰
    const topSphere = this.blockSystem.createBlock(
      BlockSystem.BLOCK_PRESETS.find(p => p.type === BlockType.SPHERE)!,
      new THREE.Vector3(centerX, baseY + 6, centerZ)
    );
    this.blockSystem.changeBlockColor(topSphere, 0xf39c12);
    this.dragControls.addDraggable(topSphere);
    this.physics.freezeBody(topSphere); // 冻结物理体，固定不动
    blocks.push(topSphere);

    console.log(`✅ 塔楼搭建完成！共使用 ${blocks.length} 块积木`);

    return blocks;
  }
}
