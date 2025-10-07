import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';

export class XRController {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private controllers: THREE.Group[] = [];

  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
  }

  /**
   * 启用 WebXR VR 模式
   */
  enableVR(): void {
    // 启用 XR
    this.renderer.xr.enabled = true;

    // 添加 VR 按钮
    const vrButton = VRButton.createButton(this.renderer);
    document.body.appendChild(vrButton);

    // 设置控制器
    this.setupControllers();
  }

  /**
   * 设置 VR 控制器
   */
  private setupControllers(): void {
    // 左手控制器
    const controller1 = this.renderer.xr.getController(0);
    controller1.addEventListener('selectstart', this.onSelectStart.bind(this));
    controller1.addEventListener('selectend', this.onSelectEnd.bind(this));
    this.scene.add(controller1);
    this.controllers.push(controller1);

    // 右手控制器
    const controller2 = this.renderer.xr.getController(1);
    controller2.addEventListener('selectstart', this.onSelectStart.bind(this));
    controller2.addEventListener('selectend', this.onSelectEnd.bind(this));
    this.scene.add(controller2);
    this.controllers.push(controller2);

    // 添加控制器可视化线条
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -1)
    ]);

    const line1 = new THREE.Line(geometry);
    line1.name = 'line';
    line1.scale.z = 5;
    controller1.add(line1.clone());

    const line2 = new THREE.Line(geometry);
    line2.name = 'line';
    line2.scale.z = 5;
    controller2.add(line2.clone());
  }

  private onSelectStart(event: any): void {
    const controller = event.target;
    controller.userData.isSelecting = true;

    // 可以在这里添加射线检测和交互逻辑
    const raycaster = new THREE.Raycaster();
    const tempMatrix = new THREE.Matrix4();
    tempMatrix.identity().extractRotation(controller.matrixWorld);

    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

    // 检测交互对象
    // const intersects = raycaster.intersectObjects(this.scene.children, true);
    // if (intersects.length > 0) {
    //   // 处理交互
    // }
  }

  private onSelectEnd(event: any): void {
    const controller = event.target;
    controller.userData.isSelecting = false;
  }

  /**
   * 获取控制器
   */
  getControllers(): THREE.Group[] {
    return this.controllers;
  }
}

/**
 * 检查 WebXR 支持
 */
export async function checkXRSupport(): Promise<{
  vr: boolean;
  ar: boolean;
}> {
  const result = { vr: false, ar: false };

  if ('xr' in navigator) {
    try {
      result.vr = await (navigator as any).xr.isSessionSupported('immersive-vr');
      result.ar = await (navigator as any).xr.isSessionSupported('immersive-ar');
    } catch (error) {
      console.warn('Error checking XR support:', error);
    }
  }

  return result;
}
