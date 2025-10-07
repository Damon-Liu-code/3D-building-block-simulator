/**
 * JSAR 适配器
 * 在浏览器环境中模拟JSAR API，实际部署到Rokid设备时使用真实的JSAR Runtime
 */
import * as THREE from 'three';

interface JSARObject extends THREE.Object3D {
  material?: any;
  userData: any;
}

class JSARSpace {
  private scene: THREE.Scene;
  private camera: THREE.Camera;

  constructor(scene: THREE.Scene, camera: THREE.Camera) {
    this.scene = scene;
    this.camera = camera;
  }

  /**
   * 创建立方体 - JSAR标准API
   */
  async createCuboid(width: number, height: number, depth: number): Promise<JSARObject> {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const mesh = new THREE.Mesh(geometry, material) as JSARObject;

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // JSAR对象需要material属性
    mesh.material = {
      get baseColor() { return '#' + material.color.getHexString(); },
      set baseColor(color: string) { material.color.set(color); }
    };

    this.scene.add(mesh);
    return mesh;
  }

  /**
   * 创建球体 - JSAR标准API
   */
  async createSphere(radius: number): Promise<JSARObject> {
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const mesh = new THREE.Mesh(geometry, material) as JSARObject;

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    mesh.material = {
      get baseColor() { return '#' + material.color.getHexString(); },
      set baseColor(color: string) { material.color.set(color); }
    };

    this.scene.add(mesh);
    return mesh;
  }

  /**
   * 创建圆柱体 - JSAR标准API
   */
  async createCylinder(radiusTop: number, radiusBottom: number, height: number): Promise<JSARObject> {
    const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 32);
    const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const mesh = new THREE.Mesh(geometry, material) as JSARObject;

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    mesh.material = {
      get baseColor() { return '#' + material.color.getHexString(); },
      set baseColor(color: string) { material.color.set(color); }
    };

    this.scene.add(mesh);
    return mesh;
  }

  /**
   * 创建光源 - JSAR标准API
   */
  async createLight(type: 'ambient' | 'directional' | 'point'): Promise<THREE.Light> {
    let light: THREE.Light;

    switch (type) {
      case 'ambient':
        light = new THREE.AmbientLight(0xffffff, 1);
        break;
      case 'directional':
        light = new THREE.DirectionalLight(0xffffff, 1);
        (light as THREE.DirectionalLight).castShadow = true;
        break;
      case 'point':
        light = new THREE.PointLight(0xffffff, 1);
        break;
    }

    this.scene.add(light);
    return light;
  }

  /**
   * 移除对象 - JSAR标准API
   */
  remove(object: JSARObject): void {
    this.scene.remove(object);
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
      if (Array.isArray(object.material)) {
        object.material.forEach(mat => mat.dispose());
      } else {
        (object.material as THREE.Material).dispose();
      }
    }
  }

  /**
   * 射线检测 - JSAR标准API (简化版)
   */
  raycast(origin: THREE.Vector3, direction: THREE.Vector3): JSARObject | null {
    const raycaster = new THREE.Raycaster(origin, direction.normalize());
    const intersects = raycaster.intersectObjects(this.scene.children, true);

    if (intersects.length > 0) {
      return intersects[0].object as JSARObject;
    }
    return null;
  }
}

/**
 * JSAR命名空间 - 模拟JSAR Runtime API
 */
export const JSAR = {
  space: null as JSARSpace | null,

  /**
   * 初始化JSAR空间
   */
  init(scene: THREE.Scene, camera: THREE.Camera): JSARSpace {
    this.space = new JSARSpace(scene, camera);
    return this.space;
  }
};

export type { JSARObject, JSARSpace };
