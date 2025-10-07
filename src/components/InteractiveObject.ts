import * as THREE from 'three';

export interface InteractiveObjectOptions {
  position?: { x: number; y: number; z: number };
  color?: number;
  scale?: number;
  onClick?: () => void;
  onHover?: () => void;
}

export class InteractiveObject {
  private object: THREE.Mesh | null = null;
  private scene: THREE.Scene;

  constructor(
    scene: THREE.Scene,
    private options: InteractiveObjectOptions = {}
  ) {
    this.scene = scene;
  }

  createCube(): THREE.Mesh {
    const scale = this.options.scale || 1;
    const geometry = new THREE.BoxGeometry(scale, scale, scale);
    const material = new THREE.MeshStandardMaterial({
      color: this.options.color || 0xffffff
    });
    this.object = new THREE.Mesh(geometry, material);
    this.setupObject();
    this.scene.add(this.object);
    return this.object;
  }

  createSphere(): THREE.Mesh {
    const scale = this.options.scale || 0.5;
    const geometry = new THREE.SphereGeometry(scale, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: this.options.color || 0xffffff
    });
    this.object = new THREE.Mesh(geometry, material);
    this.setupObject();
    this.scene.add(this.object);
    return this.object;
  }

  createCylinder(): THREE.Mesh {
    const scale = this.options.scale || 1;
    const geometry = new THREE.CylinderGeometry(scale * 0.5, scale * 0.5, scale, 32);
    const material = new THREE.MeshStandardMaterial({
      color: this.options.color || 0xffffff
    });
    this.object = new THREE.Mesh(geometry, material);
    this.setupObject();
    this.scene.add(this.object);
    return this.object;
  }

  private setupObject(): void {
    if (!this.object) return;

    // 设置位置
    if (this.options.position) {
      this.object.position.set(
        this.options.position.x,
        this.options.position.y,
        this.options.position.z
      );
    }

    // 存储回调到userData
    if (this.options.onClick) {
      this.object.userData.onClick = this.options.onClick;
    }

    if (this.options.onHover) {
      this.object.userData.onHover = this.options.onHover;
    }
  }

  getObject(): THREE.Mesh | null {
    return this.object;
  }

  setColor(color: number): void {
    if (this.object) {
      (this.object.material as THREE.MeshStandardMaterial).color.setHex(color);
    }
  }

  setPosition(x: number, y: number, z: number): void {
    if (this.object) {
      this.object.position.set(x, y, z);
    }
  }

  animate(
    property: 'position' | 'rotation' | 'scale',
    target: Partial<THREE.Vector3> | Partial<THREE.Euler>,
    duration: number = 1000
  ): Promise<void> {
    return new Promise((resolve) => {
      if (!this.object) {
        resolve();
        return;
      }

      const start = { ...this.object[property] };
      const startTime = Date.now();

      const update = () => {
        if (!this.object) {
          resolve();
          return;
        }

        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // 缓动函数
        const eased = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        // 更新属性
        const obj = this.object[property] as any;
        for (const key in target) {
          if (key in start) {
            obj[key] = (start as any)[key] + ((target as any)[key] - (start as any)[key]) * eased;
          }
        }

        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          resolve();
        }
      };

      update();
    });
  }
}
