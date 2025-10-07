import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PhysicsWorld } from './physics/PhysicsWorld';
import { DragControls } from './controls/DragControls';
import { BlockSystem } from './blocks/BlockSystem';
import { HouseBuilder } from './builders/HouseBuilder';

// 场景、相机、渲染器
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let clock: THREE.Clock;

// 系统
let physics: PhysicsWorld;
let dragControls: DragControls;
let blockSystem: BlockSystem;
let houseBuilder: HouseBuilder;

// 初始化场景
function initScene() {
  // 创建场景
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb); // 天空蓝
  scene.fog = new THREE.Fog(0x87ceeb, 10, 50);

  // 创建相机
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(8, 6, 8);
  camera.lookAt(0, 0, 0);

  // 创建渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // 启用 WebXR 支持 (JSAR 核心功能)
  renderer.xr.enabled = true;

  document.body.appendChild(renderer.domElement);

  // 添加轨道控制器
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 3;
  controls.maxDistance = 30;
  controls.maxPolarAngle = Math.PI / 2 - 0.1;

  // 时钟
  clock = new THREE.Clock();

  // 添加光源
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 20, 10);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.left = -20;
  directionalLight.shadow.camera.right = 20;
  directionalLight.shadow.camera.top = 20;
  directionalLight.shadow.camera.bottom = -20;
  scene.add(directionalLight);

  // 创建地面
  const groundGeometry = new THREE.PlaneGeometry(50, 50);
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x90ee90,
    roughness: 0.8,
    metalness: 0.2
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // 添加网格辅助线
  const gridHelper = new THREE.GridHelper(50, 50, 0x888888, 0xcccccc);
  scene.add(gridHelper);

  // 初始化物理世界
  physics = new PhysicsWorld();

  // 初始化积木系统
  blockSystem = new BlockSystem(scene, physics);

  // 初始化拖拽控制
  dragControls = new DragControls(camera, scene, physics, renderer.domElement);

  // 初始化房屋搭建器
  houseBuilder = new HouseBuilder(blockSystem, dragControls, physics);

  // 添加事件监听器
  window.addEventListener('resize', onWindowResize);
  window.addEventListener('keydown', onKeyDown);

  console.log('积木搭建场景初始化成功！');
  console.log('按 1-6 键添加不同类型的积木');
  console.log('按 C 键清除所有积木');
  console.log('按 R 键重置视角');
  console.log('按 H 键搭建小房子');
}

// 键盘事件
function onKeyDown(event: KeyboardEvent) {
  const spawnHeight = 5;
  const spawnPosition = new THREE.Vector3(
    Math.random() * 4 - 2,
    spawnHeight,
    Math.random() * 4 - 2
  );

  switch (event.key) {
    case '1':
      // 标准立方体
      addBlock(BlockSystem.BLOCK_PRESETS[0], spawnPosition);
      break;
    case '2':
      // 长条积木
      addBlock(BlockSystem.BLOCK_PRESETS[1], spawnPosition);
      break;
    case '3':
      // 平板积木
      addBlock(BlockSystem.BLOCK_PRESETS[2], spawnPosition);
      break;
    case '4':
      // 斜面积木
      addBlock(BlockSystem.BLOCK_PRESETS[3], spawnPosition);
      break;
    case '5':
      // 圆柱积木
      addBlock(BlockSystem.BLOCK_PRESETS[4], spawnPosition);
      break;
    case '6':
      // 球体积木
      addBlock(BlockSystem.BLOCK_PRESETS[5], spawnPosition);
      break;
    case 'c':
    case 'C':
      // 清除所有积木
      blockSystem.clearAllBlocks();
      console.log('已清除所有积木');
      break;
    case 'r':
    case 'R':
      // 重置相机
      camera.position.set(8, 6, 8);
      controls.target.set(0, 0, 0);
      controls.update();
      break;
    case 'g':
    case 'G':
      // 切换重力
      const gravity = physics.world.gravity;
      if (gravity.y === 0) {
        physics.world.gravity.set(0, -9.82, 0);
        console.log('重力已开启');
      } else {
        physics.world.gravity.set(0, 0, 0);
        console.log('重力已关闭');
      }
      break;
    case 'h':
    case 'H':
      // 搭建小房子
      houseBuilder.buildSmallHouse(0, 0);
      updateStats();
      break;
    case 'b':
    case 'B':
      // 搭建带花园的房子
      houseBuilder.buildHouseWithGarden(0, 0);
      updateStats();
      break;
    case 't':
    case 'T':
      // 搭建塔楼
      houseBuilder.buildTower(5, 0);
      updateStats();
      break;
  }
}

// 添加积木
function addBlock(preset: any, position: THREE.Vector3) {
  const block = blockSystem.createBlock(preset, position);
  dragControls.addDraggable(block);
  console.log(`添加了 ${preset.name}`);
}

// 窗口调整大小
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// 动画循环
function animate() {
  const deltaTime = clock.getDelta();

  // 更新物理世界
  physics.update(deltaTime);

  // 更新控制器
  controls.update();

  // 渲染
  renderer.render(scene, camera);
}

// 暴露给UI的全局函数
(window as any).addBlockByKey = (key: string) => {
  const event = new KeyboardEvent('keydown', { key });
  onKeyDown(event);
  updateStats();
};

(window as any).clearBlocks = () => {
  blockSystem.clearAllBlocks();
  console.log('已清除所有积木');
  updateStats();
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
    console.log('重力已开启');
  } else {
    physics.world.gravity.set(0, 0, 0);
    console.log('重力已关闭');
  }
  updateStats();
};

(window as any).buildHouse = () => {
  houseBuilder.buildSmallHouse(0, 0);
  updateStats();
};

(window as any).buildHouseWithGarden = () => {
  houseBuilder.buildHouseWithGarden(0, 0);
  updateStats();
};

(window as any).buildTower = () => {
  houseBuilder.buildTower(5, 0);
  updateStats();
};

// 更新统计信息
function updateStats() {
  const blockCountEl = document.getElementById('blockCount');
  const gravityStatusEl = document.getElementById('gravityStatus');

  if (blockCountEl) {
    blockCountEl.textContent = blockSystem.getBlockCount().toString();
  }

  if (gravityStatusEl) {
    const gravity = physics.world.gravity;
    gravityStatusEl.textContent = gravity.y === 0 ? '关闭' : '开启';
  }
}

// 启动应用
initScene();

// 自动搭建一个小房子作为示例
setTimeout(() => {
  console.log('🏠 正在为您搭建示例小房子...');
  houseBuilder.buildSmallHouse(0, 0);
  updateStats();
}, 500);

// WebXR 按钮设置
function setupXRButton() {
  const xrButton = document.getElementById('xr-button');

  if (!xrButton) return;

  // 检查 WebXR 是否可用
  if ('xr' in navigator) {
    (navigator as any).xr.isSessionSupported('immersive-ar').then((supported: boolean) => {
      if (supported) {
        xrButton.style.display = 'block';
        xrButton.addEventListener('click', onXRButtonClick);
      }
    });
  }
}

// WebXR 按钮点击事件
async function onXRButtonClick() {
  if (!renderer.xr.isPresenting) {
    // 启动 AR 会话
    const session = await (navigator as any).xr.requestSession('immersive-ar', {
      requiredFeatures: ['local-floor', 'hit-test'],
      optionalFeatures: ['dom-overlay'],
      domOverlay: { root: document.body }
    });

    await renderer.xr.setSession(session);
    console.log('WebXR AR 会话已启动');
  } else {
    // 退出 AR 会话
    await renderer.xr.getSession()?.end();
  }
}

// 初始化 WebXR 按钮
setupXRButton();

// 使用 WebXR 兼容的渲染循环
// JSAR 使用 renderer.setAnimationLoop 来支持 WebXR
renderer.setAnimationLoop(animate);
