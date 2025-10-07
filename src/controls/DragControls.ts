import * as THREE from 'three';
import { PhysicsWorld } from '../physics/PhysicsWorld';

export class DragControls {
  private camera: THREE.Camera;
  private scene: THREE.Scene;
  private physics: PhysicsWorld;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private dragPlane: THREE.Plane;
  private draggableObjects: THREE.Mesh[] = [];
  private selectedObject: THREE.Mesh | null = null;
  private offset: THREE.Vector3 = new THREE.Vector3();
  private isDragging: boolean = false;
  private dragStartPosition: THREE.Vector3 = new THREE.Vector3();

  constructor(
    camera: THREE.Camera,
    scene: THREE.Scene,
    physics: PhysicsWorld,
    domElement: HTMLElement
  ) {
    this.camera = camera;
    this.scene = scene;
    this.physics = physics;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    // 绑定事件
    domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
    domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
    domElement.addEventListener('mouseup', this.onMouseUp.bind(this));
  }

  /**
   * 添加可拖拽对象
   */
  addDraggable(object: THREE.Mesh): void {
    if (!this.draggableObjects.includes(object)) {
      this.draggableObjects.push(object);
    }
  }

  /**
   * 移除可拖拽对象
   */
  removeDraggable(object: THREE.Mesh): void {
    const index = this.draggableObjects.indexOf(object);
    if (index > -1) {
      this.draggableObjects.splice(index, 1);
    }
  }

  /**
   * 鼠标按下事件
   */
  private onMouseDown(event: MouseEvent): void {
    event.preventDefault();

    this.updateMousePosition(event);

    // 射线检测
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.draggableObjects);

    if (intersects.length > 0) {
      const object = intersects[0].object as THREE.Mesh;
      this.selectedObject = object;
      this.isDragging = true;

      // 保存拖拽开始位置
      this.dragStartPosition.copy(object.position);

      // 冻结物理体
      this.physics.freezeBody(object);

      // 计算拖拽平面
      const normal = new THREE.Vector3(0, 1, 0);
      this.dragPlane.setFromNormalAndCoplanarPoint(
        normal,
        intersects[0].point
      );

      // 计算偏移
      this.offset.copy(intersects[0].point).sub(object.position);

      // 高亮选中对象
      this.highlightObject(object, true);

      // 禁用相机控制（如果有）
      document.body.style.cursor = 'grabbing';
    }
  }

  /**
   * 鼠标移动事件
   */
  private onMouseMove(event: MouseEvent): void {
    event.preventDefault();

    this.updateMousePosition(event);

    if (this.isDragging && this.selectedObject) {
      // 计算新位置
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersection = new THREE.Vector3();
      this.raycaster.ray.intersectPlane(this.dragPlane, intersection);

      if (intersection) {
        // 更新对象位置
        this.selectedObject.position.copy(intersection.sub(this.offset));

        // 限制最小高度
        if (this.selectedObject.position.y < 0.5) {
          this.selectedObject.position.y = 0.5;
        }

        // 同步物理体位置
        const body = this.physics.getBody(this.selectedObject);
        if (body) {
          body.position.copy(this.selectedObject.position as any);
          body.quaternion.copy(this.selectedObject.quaternion as any);
        }
      }
    } else {
      // 悬停高亮
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.draggableObjects);

      if (intersects.length > 0) {
        document.body.style.cursor = 'grab';
      } else {
        document.body.style.cursor = 'default';
      }
    }
  }

  /**
   * 鼠标释放事件
   */
  private onMouseUp(event: MouseEvent): void {
    event.preventDefault();

    if (this.isDragging && this.selectedObject) {
      // 解冻物理体
      this.physics.unfreezeBody(this.selectedObject, 1);

      // 取消高亮
      this.highlightObject(this.selectedObject, false);

      this.isDragging = false;
      this.selectedObject = null;
    }

    document.body.style.cursor = 'default';
  }

  /**
   * 更新鼠标位置
   */
  private updateMousePosition(event: MouseEvent): void {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  /**
   * 高亮对象
   */
  private highlightObject(object: THREE.Mesh, highlight: boolean): void {
    const material = object.material as THREE.MeshStandardMaterial;
    if (highlight) {
      material.emissive.setHex(0x444444);
      material.emissiveIntensity = 0.3;
    } else {
      material.emissive.setHex(0x000000);
      material.emissiveIntensity = 0;
    }
  }

  /**
   * 清理
   */
  dispose(): void {
    this.draggableObjects = [];
    this.selectedObject = null;
  }
}
