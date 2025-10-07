import '@yodaos-jsar/dom';
import * as BABYLON from 'babylonjs';
import * as CANNON from 'cannon-es';

// Babylon.js 场景和引擎
let engine: BABYLON.Engine;
let scene: BABYLON.Scene;
let camera: BABYLON.ArcRotateCamera;
let physicsWorld: CANNON.World;
let shadowGenerator: BABYLON.ShadowGenerator;

// 积木和物理体映射
const blocks: BABYLON.Mesh[] = [];
const physicsBodies: Map<BABYLON.Mesh, CANNON.Body> = new Map();

// 积木类型定义
interface BlockDefinition {
  type: string;
  size: BABYLON.Vector3;
  color: BABYLON.Color3;
  name: string;
}

const BLOCK_PRESETS: BlockDefinition[] = [
  {
    type: 'cube',
    size: new BABYLON.Vector3(1, 1, 1),
    color: BABYLON.Color3.FromHexString('#ff6b6b'),
    name: '立方体'
  },
  {
    type: 'long',
    size: new BABYLON.Vector3(2, 0.5, 0.5),
    color: BABYLON.Color3.FromHexString('#4ecdc4'),
    name: '长条积木'
  },
  {
    type: 'flat',
    size: new BABYLON.Vector3(2, 0.2, 1),
    color: BABYLON.Color3.FromHexString('#f9ca24'),
    name: '平板积木'
  },
  {
    type: 'sphere',
    size: new BABYLON.Vector3(0.8, 0.8, 0.8),
    color: BABYLON.Color3.FromHexString('#ff9ff3'),
    name: '球体'
  }
];

// 初始化场景
function initScene() {
  // 获取 JSAR 空间 canvas
  const canvas = document.querySelector('canvas') as HTMLCanvasElement;

  if (!canvas) {
    console.error('❌ 未找到 canvas 元素');
    return;
  }

  // 创建 Babylon.js 引擎
  engine = new BABYLON.Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true
  });

  // 创建场景
  scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0.53, 0.81, 0.92, 1); // 天空蓝

  // 创建相机
  camera = new BABYLON.ArcRotateCamera(
    'camera',
    Math.PI / 4,
    Math.PI / 3,
    15,
    BABYLON.Vector3.Zero(),
    scene
  );
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 5;
  camera.upperRadiusLimit = 30;

  // 添加光源
  const ambientLight = new BABYLON.HemisphericLight(
    'ambient',
    new BABYLON.Vector3(0, 1, 0),
    scene
  );
  ambientLight.intensity = 0.6;

  const directionalLight = new BABYLON.DirectionalLight(
    'directional',
    new BABYLON.Vector3(-1, -2, -1),
    scene
  );
  directionalLight.position = new BABYLON.Vector3(10, 20, 10);
  directionalLight.intensity = 0.8;

  // 启用阴影
  shadowGenerator = new BABYLON.ShadowGenerator(2048, directionalLight);
  shadowGenerator.usePoissonSampling = true;

  // 创建地面
  const ground = BABYLON.MeshBuilder.CreateGround(
    'ground',
    { width: 50, height: 50 },
    scene
  );
  const groundMaterial = new BABYLON.StandardMaterial('groundMat', scene);
  groundMaterial.diffuseColor = BABYLON.Color3.FromHexString('#90ee90');
  groundMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
  ground.material = groundMaterial;
  ground.receiveShadows = true;

  // 初始化 Cannon.js 物理引擎
  physicsWorld = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.82, 0)
  });

  // 添加地面刚体
  const groundShape = new CANNON.Plane();
  const groundBody = new CANNON.Body({ mass: 0 });
  groundBody.addShape(groundShape);
  groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  physicsWorld.addBody(groundBody);

  console.log('✅ JSAR 场景初始化完成');
}

// 创建积木
function createBlock(preset: BlockDefinition, position: BABYLON.Vector3): BABYLON.Mesh {
  let mesh: BABYLON.Mesh;

  // 根据类型创建不同的网格
  if (preset.type === 'sphere') {
    mesh = BABYLON.MeshBuilder.CreateSphere(
      `block_${blocks.length}`,
      { diameter: preset.size.x },
      scene
    );
  } else {
    mesh = BABYLON.MeshBuilder.CreateBox(
      `block_${blocks.length}`,
      {
        width: preset.size.x,
        height: preset.size.y,
        depth: preset.size.z
      },
      scene
    );
  }

  // 设置材质
  const material = new BABYLON.StandardMaterial(`mat_${blocks.length}`, scene);
  material.diffuseColor = preset.color;
  material.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
  mesh.material = material;

  // 设置位置
  mesh.position = position.clone();

  // 启用阴影
  mesh.receiveShadows = true;
  shadowGenerator.addShadowCaster(mesh);

  // 添加物理刚体
  let shape: CANNON.Shape;
  if (preset.type === 'sphere') {
    shape = new CANNON.Sphere(preset.size.x / 2);
  } else {
    shape = new CANNON.Box(new CANNON.Vec3(
      preset.size.x / 2,
      preset.size.y / 2,
      preset.size.z / 2
    ));
  }

  const body = new CANNON.Body({
    mass: 1,
    shape: shape,
    position: new CANNON.Vec3(position.x, position.y, position.z)
  });

  physicsWorld.addBody(body);
  physicsBodies.set(mesh, body);
  blocks.push(mesh);

  updateStats();
  console.log(`创建了 ${preset.name} 在位置 (${position.x}, ${position.y}, ${position.z})`);

  return mesh;
}

// 冻结物理体(用于建筑物)
function freezeBody(mesh: BABYLON.Mesh): void {
  const body = physicsBodies.get(mesh);
  if (body) {
    body.mass = 0;
    body.updateMassProperties();
    body.velocity.setZero();
    body.angularVelocity.setZero();
  }
}

// 搭建完整房子
function buildHouse(): void {
  console.log('🏗️ 开始搭建完整房子...');

  const centerX = 0;
  const centerZ = 0;

  // 🏗️ 地基（3x3完整地基）
  for (let x = -1.5; x <= 1.5; x += 1) {
    for (let z = -1.5; z <= 1.5; z += 1) {
      const block = createBlock(
        {
          type: 'flat',
          size: new BABYLON.Vector3(1, 0.2, 1),
          color: new BABYLON.Color3(0.6, 0.6, 0.6), // 灰色地板
          name: '地基'
        },
        new BABYLON.Vector3(x, 0.1, z)
      );
      freezeBody(block);
    }
  }

  // 🧱 墙壁系统（完整的四面墙）
  const wallColor = new BABYLON.Color3(0.85, 0.75, 0.65); // 米色墙壁
  const wallHeight = 0.8;

  // 后墙（完整）
  for (let x = -1.5; x <= 1.5; x += 1) {
    const block = createBlock(
      {
        type: 'wall',
        size: new BABYLON.Vector3(1, 1, 0.2),
        color: wallColor,
        name: '后墙'
      },
      new BABYLON.Vector3(x, wallHeight, -1.5)
    );
    freezeBody(block);
  }

  // 左墙（完整）
  for (let z = -1.5; z <= 1.5; z += 1) {
    const block = createBlock(
      {
        type: 'wall',
        size: new BABYLON.Vector3(0.2, 1, 1),
        color: wallColor,
        name: '左墙'
      },
      new BABYLON.Vector3(-1.5, wallHeight, z)
    );
    freezeBody(block);
  }

  // 右墙（完整）
  for (let z = -1.5; z <= 1.5; z += 1) {
    const block = createBlock(
      {
        type: 'wall',
        size: new BABYLON.Vector3(0.2, 1, 1),
        color: wallColor,
        name: '右墙'
      },
      new BABYLON.Vector3(1.5, wallHeight, z)
    );
    freezeBody(block);
  }

  // 前墙（带门）- 左侧
  const frontLeft = createBlock(
    {
      type: 'wall',
      size: new BABYLON.Vector3(0.8, 1, 0.2),
      color: wallColor,
      name: '前墙左'
    },
    new BABYLON.Vector3(-1.1, wallHeight, 1.5)
  );
  freezeBody(frontLeft);

  // 前墙 - 右侧
  const frontRight = createBlock(
    {
      type: 'wall',
      size: new BABYLON.Vector3(0.8, 1, 0.2),
      color: wallColor,
      name: '前墙右'
    },
    new BABYLON.Vector3(1.1, wallHeight, 1.5)
  );
  freezeBody(frontRight);

  // 前墙 - 上方横梁
  const frontTop = createBlock(
    {
      type: 'wall',
      size: new BABYLON.Vector3(0.8, 0.3, 0.2),
      color: wallColor,
      name: '前墙上梁'
    },
    new BABYLON.Vector3(0, 1.35, 1.5)
  );
  freezeBody(frontTop);

  // 🚪 门（深棕色）
  const door = createBlock(
    {
      type: 'door',
      size: new BABYLON.Vector3(0.8, 0.6, 0.1),
      color: new BABYLON.Color3(0.4, 0.2, 0.1), // 深棕色
      name: '门'
    },
    new BABYLON.Vector3(0, 0.5, 1.55)
  );
  freezeBody(door);

  // 🪟 窗户（浅蓝色玻璃效果）
  const windowColor = new BABYLON.Color3(0.6, 0.8, 1.0);

  // 左墙窗户
  const windowLeft = createBlock(
    {
      type: 'window',
      size: new BABYLON.Vector3(0.1, 0.4, 0.6),
      color: windowColor,
      name: '左窗'
    },
    new BABYLON.Vector3(-1.55, 0.8, -0.5)
  );
  freezeBody(windowLeft);

  // 右墙窗户
  const windowRight = createBlock(
    {
      type: 'window',
      size: new BABYLON.Vector3(0.1, 0.4, 0.6),
      color: windowColor,
      name: '右窗'
    },
    new BABYLON.Vector3(1.55, 0.8, 0.5)
  );
  freezeBody(windowRight);

  // 后墙窗户
  const windowBack = createBlock(
    {
      type: 'window',
      size: new BABYLON.Vector3(0.6, 0.4, 0.1),
      color: windowColor,
      name: '后窗'
    },
    new BABYLON.Vector3(0, 0.8, -1.55)
  );
  freezeBody(windowBack);

  // 🏠 屋顶（完整覆盖）
  const roofColor = new BABYLON.Color3(0.7, 0.3, 0.2); // 红褐色屋顶
  for (let x = -1.5; x <= 1.5; x += 1) {
    for (let z = -1.5; z <= 1.5; z += 1) {
      const roof = createBlock(
        {
          type: 'roof',
          size: new BABYLON.Vector3(1, 0.15, 1),
          color: roofColor,
          name: '屋顶'
        },
        new BABYLON.Vector3(x, 1.6, z)
      );
      freezeBody(roof);
    }
  }

  // 🔥 烟囱（装饰）
  const chimney1 = createBlock(
    {
      type: 'chimney',
      size: new BABYLON.Vector3(0.3, 0.5, 0.3),
      color: new BABYLON.Color3(0.5, 0.3, 0.2), // 深褐色
      name: '烟囱主体'
    },
    new BABYLON.Vector3(1, 1.95, -1)
  );
  freezeBody(chimney1);

  const chimney2 = createBlock(
    {
      type: 'chimney_top',
      size: new BABYLON.Vector3(0.25, 0.2, 0.25),
      color: new BABYLON.Color3(0.6, 0.6, 0.6), // 灰色烟囱帽
      name: '烟囱帽'
    },
    new BABYLON.Vector3(1, 2.3, -1)
  );
  freezeBody(chimney2);

  console.log('🏠 完整房子搭建完成！包含地基、四面墙、门、窗户、屋顶和烟囱');
}

// 搭建带花园的房子
function buildHouseWithGarden(): void {
  console.log('🏡 开始搭建花园房...');

  // 先搭建房子
  buildHouse();

  // 🌳 花园树木（8棵树）
  const treePositions = [
    [-3, 0, -3], [3, 0, -3], [-3, 0, 3], [3, 0, 3], // 四角
    [-3, 0, 0], [3, 0, 0], [0, 0, -3], [0, 0, 3]    // 四边中点
  ];

  treePositions.forEach(([x, y, z]) => {
    // 树干（棕色圆柱）
    const trunk = createBlock(
      {
        type: 'cylinder',
        size: new BABYLON.Vector3(0.2, 0.6, 0.2),
        color: new BABYLON.Color3(0.4, 0.25, 0.1),
        name: '树干'
      },
      new BABYLON.Vector3(x, 0.3, z)
    );
    freezeBody(trunk);

    // 树冠（绿色球体）
    const crown = createBlock(
      {
        type: 'sphere',
        size: new BABYLON.Vector3(0.8, 0.8, 0.8),
        color: new BABYLON.Color3(0.2, 0.7, 0.2),
        name: '树冠'
      },
      new BABYLON.Vector3(x, 0.8, z)
    );
    freezeBody(crown);
  });

  // 🌺 花坛（4朵彩色花）
  const flowerPositions = [
    { pos: [-2, 0, 1], color: new BABYLON.Color3(1, 0.2, 0.4) },   // 红花
    { pos: [2, 0, 1], color: new BABYLON.Color3(1, 0.8, 0.2) },    // 黄花
    { pos: [-2, 0, -1], color: new BABYLON.Color3(0.8, 0.4, 1) },  // 紫花
    { pos: [2, 0, -1], color: new BABYLON.Color3(1, 0.5, 0.8) }    // 粉花
  ];

  flowerPositions.forEach(({ pos, color }) => {
    const flower = createBlock(
      {
        type: 'sphere',
        size: new BABYLON.Vector3(0.3, 0.3, 0.3),
        color: color,
        name: '花朵'
      },
      new BABYLON.Vector3(pos[0], 0.15, pos[2])
    );
    freezeBody(flower);
  });

  console.log('🌳🌺 花园房搭建完成！包含8棵树和4朵花');
}

// 搭建塔楼
function buildTower(): void {
  console.log('🗼 开始搭建塔楼...');

  // 🗼 塔楼基座（2x2宽大基座）
  for (let x = -0.5; x <= 0.5; x += 1) {
    for (let z = -0.5; z <= 0.5; z += 1) {
      const base = createBlock(
        {
          type: 'base',
          size: new BABYLON.Vector3(1, 0.3, 1),
          color: new BABYLON.Color3(0.5, 0.5, 0.5), // 灰色基座
          name: '塔楼基座'
        },
        new BABYLON.Vector3(x, 0.15, z)
      );
      freezeBody(base);
    }
  }

  // 塔身（渐变收窄设计）
  const towerLevels = 10;
  const startColor = new BABYLON.Color3(0.6, 0.4, 0.2); // 深褐色
  const endColor = new BABYLON.Color3(0.9, 0.7, 0.3);   // 金黄色

  for (let i = 0; i < towerLevels; i++) {
    // 逐渐收窄的尺寸
    const size = Math.max(0.6, 1 - i * 0.04);
    const y = 0.45 + i * 0.85;

    // 颜色渐变
    const t = i / towerLevels;
    const color = new BABYLON.Color3(
      startColor.r + (endColor.r - startColor.r) * t,
      startColor.g + (endColor.g - startColor.g) * t,
      startColor.b + (endColor.b - startColor.b) * t
    );

    const block = createBlock(
      {
        type: 'tower_block',
        size: new BABYLON.Vector3(size, 0.8, size),
        color: color,
        name: `塔身第${i + 1}层`
      },
      new BABYLON.Vector3(0, y, 0)
    );
    freezeBody(block);

    // 每两层添加装饰窗户
    if (i % 2 === 0 && i > 0) {
      const windowSize = size * 0.15;
      const windowOffset = size * 0.52;
      const windowColor = new BABYLON.Color3(0.6, 0.8, 1.0);

      // 四面窗户
      const windowPositions = [
        { x: windowOffset, z: 0 },
        { x: -windowOffset, z: 0 },
        { x: 0, z: windowOffset },
        { x: 0, z: -windowOffset }
      ];

      windowPositions.forEach(pos => {
        const window = createBlock(
          {
            type: 'window',
            size: new BABYLON.Vector3(windowSize, 0.3, windowSize),
            color: windowColor,
            name: '塔楼窗户'
          },
          new BABYLON.Vector3(pos.x, y, pos.z)
        );
        freezeBody(window);
      });
    }
  }

  // 🏰 塔顶平台
  const topY = 0.45 + towerLevels * 0.85;
  const topPlatform = createBlock(
    {
      type: 'cylinder',
      size: new BABYLON.Vector3(0.7, 0.2, 0.7),
      color: new BABYLON.Color3(0.8, 0.6, 0.3),
      name: '塔顶平台'
    },
    new BABYLON.Vector3(0, topY + 0.1, 0)
  );
  freezeBody(topPlatform);

  // 尖顶（4层递减的金色尖顶）
  const spireColor = new BABYLON.Color3(0.95, 0.8, 0.2);
  for (let i = 0; i < 4; i++) {
    const spireSize = 0.5 - i * 0.1;
    const spire = createBlock(
      {
        type: 'cylinder',
        size: new BABYLON.Vector3(spireSize, 0.3, spireSize),
        color: spireColor,
        name: `尖顶第${i + 1}层`
      },
      new BABYLON.Vector3(0, topY + 0.3 + i * 0.3, 0)
    );
    freezeBody(spire);
  }

  // 顶部装饰球
  const finial = createBlock(
    {
      type: 'sphere',
      size: new BABYLON.Vector3(0.3, 0.3, 0.3),
      color: new BABYLON.Color3(1, 0.85, 0),
      name: '塔顶球'
    },
    new BABYLON.Vector3(0, topY + 1.5, 0)
  );
  freezeBody(finial);

  console.log('🗼 精美塔楼搭建完成！包含基座、10层塔身、窗户和金色尖顶');
}

// 清除所有积木
function clearAllBlocks(): void {
  blocks.forEach(block => {
    const body = physicsBodies.get(block);
    if (body) {
      physicsWorld.removeBody(body);
    }
    block.dispose();
  });

  blocks.length = 0;
  physicsBodies.clear();
  updateStats();

  console.log('🧹 已清除所有积木');
}

// 切换重力
function toggleGravity(): void {
  const gravity = physicsWorld.gravity;
  if (gravity.y === 0) {
    physicsWorld.gravity.set(0, -9.82, 0);
    console.log('✅ 重力已开启');
  } else {
    physicsWorld.gravity.set(0, 0, 0);
    console.log('❌ 重力已关闭');
  }
  updateStats();
}

// 更新统计信息
function updateStats(): void {
  const blockCountEl = document.getElementById('block-count');
  const gravityStatusEl = document.getElementById('gravity-status');

  if (blockCountEl) {
    blockCountEl.textContent = blocks.length.toString();
  }

  if (gravityStatusEl) {
    const isOn = physicsWorld.gravity.y !== 0;
    gravityStatusEl.textContent = isOn ? '开启' : '关闭';
  }
}

// 渲染循环
function animate(): void {
  const deltaTime = engine.getDeltaTime() / 1000;

  // 更新物理世界
  physicsWorld.step(1 / 60, deltaTime, 3);

  // 同步 Babylon.js 网格和 Cannon.js 刚体
  physicsBodies.forEach((body, mesh) => {
    mesh.position.set(body.position.x, body.position.y, body.position.z);
    mesh.rotationQuaternion = new BABYLON.Quaternion(
      body.quaternion.x,
      body.quaternion.y,
      body.quaternion.z,
      body.quaternion.w
    );
  });

  // 渲染场景
  scene.render();
}

// UI 事件绑定
function setupUI(): void {
  // 添加积木按钮
  document.getElementById('btn-cube')?.addEventListener('click', () => {
    createBlock(BLOCK_PRESETS[0], new BABYLON.Vector3(0, 5, 0));
  });

  document.getElementById('btn-long')?.addEventListener('click', () => {
    createBlock(BLOCK_PRESETS[1], new BABYLON.Vector3(0, 5, 0));
  });

  document.getElementById('btn-flat')?.addEventListener('click', () => {
    createBlock(BLOCK_PRESETS[2], new BABYLON.Vector3(0, 5, 0));
  });

  document.getElementById('btn-sphere')?.addEventListener('click', () => {
    createBlock(BLOCK_PRESETS[3], new BABYLON.Vector3(0, 5, 0));
  });

  // 功能按钮
  document.getElementById('btn-house')?.addEventListener('click', buildHouse);
  document.getElementById('btn-garden')?.addEventListener('click', buildHouseWithGarden);
  document.getElementById('btn-tower')?.addEventListener('click', buildTower);
  document.getElementById('btn-clear')?.addEventListener('click', clearAllBlocks);
  document.getElementById('btn-gravity')?.addEventListener('click', toggleGravity);
}

// 启动应用
(globalThis as any).spatialDocument?.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 JSAR 积木搭建器启动中...');

  initScene();
  setupUI();

  // 自动搭建示例房子
  setTimeout(() => {
    buildHouse();
  }, 500);

  // 启动渲染循环
  engine.runRenderLoop(animate);

  console.log('✅ JSAR 积木搭建器已启动!');
}) || window.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 JSAR 积木搭建器启动中...');

  initScene();
  setupUI();

  // 自动搭建示例房子
  setTimeout(() => {
    buildHouse();
  }, 500);

  // 启动渲染循环
  engine.runRenderLoop(animate);

  console.log('✅ JSAR 积木搭建器已启动!');
});
