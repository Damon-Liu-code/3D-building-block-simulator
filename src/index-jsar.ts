/**
 * 基于JSAR Runtime的积木搭建器
 * 适配Rokid平台的空间计算能力
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { JSAR, JSARSpace, JSARObject } from './jsar-adapter';
import { PhysicsWorld } from './physics/PhysicsWorld';

// 场景组件
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let clock: THREE.Clock;

// JSAR空间实例
let jsarSpace: JSARSpace;
let physics: PhysicsWorld;

// 积木预设（JSAR风格）
const BLOCK_PRESETS = [
  { type: 'cube', size: [1, 1, 1], color: '#ff6b6b', name: '立方体' },
  { type: 'long', size: [2, 0.5, 0.5], color: '#4ecdc4', name: '长条' },
  { type: 'flat', size: [2, 0.25, 1], color: '#f9ca24', name: '平板' },
  { type: 'cylinder', params: [0.5, 0.5, 1], color: '#45b7d1', name: '圆柱' },
  { type: 'sphere', params: [0.5], color: '#ff9ff3', name: '球体' }
];

// 存储所有积木
const blocks: JSARObject[] = [];

/**
 * 初始化JSAR场景
 */
async function initJSARScene() {
  // 创建Three.js基础场景
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.Fog(0x87ceeb, 10, 50);

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(8, 6, 8);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  clock = new THREE.Clock();

  // 初始化JSAR空间
  jsarSpace = JSAR.init(scene, camera);
  console.log('✅ JSAR Runtime 初始化成功');

  // 初始化物理世界
  physics = new PhysicsWorld();

  // 使用JSAR API创建光源
  const ambientLight = await jsarSpace.createLight('ambient');
  ambientLight.intensity = 0.6;

  const directionalLight = await jsarSpace.createLight('directional');
  directionalLight.intensity = 0.8;
  directionalLight.position.set(10, 20, 10);
  (directionalLight as THREE.DirectionalLight).shadow.mapSize.width = 2048;
  (directionalLight as THREE.DirectionalLight).shadow.mapSize.height = 2048;

  // 使用JSAR API创建地面
  const ground = await jsarSpace.createCuboid(50, 0.1, 50);
  ground.position.set(0, -0.05, 0);
  ground.material.baseColor = '#90ee90';
  ground.receiveShadow = true;

  // 添加网格辅助线
  const gridHelper = new THREE.GridHelper(50, 50, 0x888888, 0xcccccc);
  scene.add(gridHelper);

  // 事件监听
  window.addEventListener('resize', onWindowResize);
  window.addEventListener('keydown', onKeyDown);

  console.log('🏠 JSAR场景初始化完成');
  console.log('💡 按 1-5 添加不同积木，H 键搭建房子');
}

/**
 * 使用JSAR API创建积木
 */
async function createBlock(presetIndex: number, position: THREE.Vector3): Promise<JSARObject | null> {
  const preset = BLOCK_PRESETS[presetIndex];
  if (!preset) return null;

  let block: JSARObject;

  try {
    switch (preset.type) {
      case 'cube':
      case 'long':
      case 'flat':
        const [w, h, d] = preset.size;
        block = await jsarSpace.createCuboid(w, h, d);
        break;

      case 'cylinder':
        const [rt, rb, height] = preset.params!;
        block = await jsarSpace.createCylinder(rt, rb, height);
        break;

      case 'sphere':
        const [radius] = preset.params!;
        block = await jsarSpace.createSphere(radius);
        break;

      default:
        return null;
    }

    // 设置位置和颜色
    block.position.copy(position);
    block.material.baseColor = preset.color;
    block.userData.draggable = true;
    block.userData.blockType = preset.type;

    // 添加物理体
    if (block instanceof THREE.Mesh) {
      physics.addBox(block, 1);
    }

    blocks.push(block);
    console.log(`✨ 创建了 ${preset.name}`);

    return block;
  } catch (error) {
    console.error('创建积木失败:', error);
    return null;
  }
}

/**
 * 使用JSAR API搭建小房子
 */
async function buildHouse() {
  console.log('🏗️ 开始使用JSAR搭建房子...');

  const baseY = 0.125;
  const centerX = 0, centerZ = 0;

  // 地基 - 使用JSAR createCuboid
  const foundationPositions = [
    { x: -1, y: baseY, z: -1 }, { x: 0, y: baseY, z: -1 }, { x: 1, y: baseY, z: -1 },
    { x: -1, y: baseY, z: 0 }, { x: 0, y: baseY, z: 0 }, { x: 1, y: baseY, z: 0 },
    { x: -1, y: baseY, z: 1 }, { x: 0, y: baseY, z: 1 }, { x: 1, y: baseY, z: 1 }
  ];

  for (const pos of foundationPositions) {
    const block = await jsarSpace.createCuboid(2, 0.25, 1);
    block.position.set(pos.x, pos.y, pos.z);
    block.material.baseColor = '#f9ca24';
    physics.addBox(block as THREE.Mesh, 0); // 静态
    blocks.push(block);
  }

  // 墙壁
  const wallHeight = baseY + 0.75;
  const wallPositions = [
    { x: -1, z: -1 }, { x: 1, z: -1 },
    { x: -1, z: 1 }, { x: 0, z: 1 }, { x: 1, z: 1 },
    { x: -1, z: 0 }, { x: 1, z: 0 }
  ];

  for (const pos of wallPositions) {
    const block = await jsarSpace.createCuboid(1, 1, 1);
    block.position.set(pos.x, wallHeight, pos.z);
    block.material.baseColor = '#ff6b6b';
    physics.addBox(block as THREE.Mesh, 0); // 静态
    blocks.push(block);
  }

  // 屋顶
  const roofHeight = wallHeight + 1 + 0.125;
  const roofPositions = foundationPositions.map(p => ({ ...p, y: roofHeight }));

  for (const pos of roofPositions) {
    const block = await jsarSpace.createCuboid(2, 0.25, 1);
    block.position.set(pos.x, pos.y, pos.z);
    block.material.baseColor = '#e67e22';
    physics.addBox(block as THREE.Mesh, 0); // 静态
    blocks.push(block);
  }

  // 烟囱
  const chimney = await jsarSpace.createCylinder(0.4, 0.4, 1.5);
  chimney.position.set(0.8, roofHeight + 0.75, 0.8);
  chimney.material.baseColor = '#45b7d1';
  physics.addBox(chimney as THREE.Mesh, 0); // 静态
  blocks.push(chimney);

  console.log(`✅ 房子搭建完成！共使用 ${blocks.length} 块积木`);
  updateStats();
}

/**
 * 清除所有积木
 */
function clearAllBlocks() {
  blocks.forEach(block => {
    physics.removeBody(block as THREE.Mesh);
    jsarSpace.remove(block);
  });
  blocks.length = 0;
  console.log('🧹 已清除所有积木');
  updateStats();
}

/**
 * 键盘事件
 */
async function onKeyDown(event: KeyboardEvent) {
  const spawnPos = new THREE.Vector3(
    Math.random() * 4 - 2,
    5,
    Math.random() * 4 - 2
  );

  switch (event.key) {
    case '1':
    case '2':
    case '3':
    case '4':
    case '5':
      await createBlock(parseInt(event.key) - 1, spawnPos);
      updateStats();
      break;
    case 'h':
    case 'H':
      await buildHouse();
      break;
    case 'c':
    case 'C':
      clearAllBlocks();
      break;
    case 'r':
    case 'R':
      camera.position.set(8, 6, 8);
      controls.target.set(0, 0, 0);
      controls.update();
      break;
  }
}

/**
 * 窗口大小调整
 */
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * 更新统计信息
 */
function updateStats() {
  const blockCountEl = document.getElementById('blockCount');
  const gravityStatusEl = document.getElementById('gravityStatus');

  if (blockCountEl) {
    blockCountEl.textContent = blocks.length.toString();
  }

  if (gravityStatusEl) {
    const gravity = physics.world.gravity;
    gravityStatusEl.textContent = gravity.y === 0 ? '关闭' : '开启';
  }
}

/**
 * 动画循环
 */
function animate() {
  requestAnimationFrame(animate);

  const deltaTime = clock.getDelta();
  physics.update(deltaTime);
  controls.update();

  renderer.render(scene, camera);
}

/**
 * 暴露给UI的全局函数
 */
(window as any).addBlockByKey = async (key: string) => {
  const spawnPos = new THREE.Vector3(Math.random() * 4 - 2, 5, Math.random() * 4 - 2);
  await createBlock(parseInt(key) - 1, spawnPos);
  updateStats();
};

(window as any).buildHouse = async () => {
  await buildHouse();
};

(window as any).clearBlocks = () => {
  clearAllBlocks();
};

(window as any).resetCamera = () => {
  camera.position.set(8, 6, 8);
  controls.target.set(0, 0, 0);
  controls.update();
};

(window as any).toggleGravity = () => {
  const gravity = physics.world.gravity;
  if (gravity.y === 0) {
    physics.world.gravity.set(0, -9.82, 0);
  } else {
    physics.world.gravity.set(0, 0, 0);
  }
  updateStats();
};

// 启动应用
initJSARScene().then(() => {
  animate();

  // 自动搭建示例房子
  setTimeout(() => {
    buildHouse();
  }, 1000);
});
