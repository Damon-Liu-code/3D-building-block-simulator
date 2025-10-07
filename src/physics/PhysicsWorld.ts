import * as CANNON from 'cannon-es';
import * as THREE from 'three';

export class PhysicsWorld {
  public world: CANNON.World;
  private bodies: Map<THREE.Mesh, CANNON.Body> = new Map();
  private meshes: Map<CANNON.Body, THREE.Mesh> = new Map();

  constructor() {
    // 创建物理世界
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.82, 0) // 重力加速度
    });

    // 设置碰撞检测
    this.world.broadphase = new CANNON.NaiveBroadphase();
    this.world.solver.iterations = 10;
    this.world.allowSleep = true;

    // 创建地面
    this.createGround();
  }

  /**
   * 创建物理地面
   */
  private createGround(): void {
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({
      mass: 0, // 质量为0表示静态物体
      shape: groundShape
    });
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); // 旋转到水平
    this.world.addBody(groundBody);
  }

  /**
   * 添加立方体物理体
   */
  addBox(mesh: THREE.Mesh, mass: number = 1): CANNON.Body {
    const geometry = mesh.geometry as THREE.BoxGeometry;
    const parameters = geometry.parameters;

    const shape = new CANNON.Box(
      new CANNON.Vec3(
        parameters.width / 2,
        parameters.height / 2,
        parameters.depth / 2
      )
    );

    const body = new CANNON.Body({
      mass: mass,
      shape: shape,
      position: new CANNON.Vec3(
        mesh.position.x,
        mesh.position.y,
        mesh.position.z
      ),
      quaternion: new CANNON.Quaternion(
        mesh.quaternion.x,
        mesh.quaternion.y,
        mesh.quaternion.z,
        mesh.quaternion.w
      )
    });

    this.world.addBody(body);
    this.bodies.set(mesh, body);
    this.meshes.set(body, mesh);

    return body;
  }

  /**
   * 添加球体物理体
   */
  addSphere(mesh: THREE.Mesh, mass: number = 1): CANNON.Body {
    const geometry = mesh.geometry as THREE.SphereGeometry;
    const radius = geometry.parameters.radius;

    const shape = new CANNON.Sphere(radius);

    const body = new CANNON.Body({
      mass: mass,
      shape: shape,
      position: new CANNON.Vec3(
        mesh.position.x,
        mesh.position.y,
        mesh.position.z
      )
    });

    this.world.addBody(body);
    this.bodies.set(mesh, body);
    this.meshes.set(body, mesh);

    return body;
  }

  /**
   * 添加圆柱体物理体
   */
  addCylinder(mesh: THREE.Mesh, mass: number = 1): CANNON.Body {
    const geometry = mesh.geometry as THREE.CylinderGeometry;
    const radiusTop = geometry.parameters.radiusTop;
    const radiusBottom = geometry.parameters.radiusBottom;
    const height = geometry.parameters.height;

    const shape = new CANNON.Cylinder(radiusTop, radiusBottom, height, 8);

    const body = new CANNON.Body({
      mass: mass,
      shape: shape,
      position: new CANNON.Vec3(
        mesh.position.x,
        mesh.position.y,
        mesh.position.z
      )
    });

    this.world.addBody(body);
    this.bodies.set(mesh, body);
    this.meshes.set(body, mesh);

    return body;
  }

  /**
   * 移除物理体
   */
  removeBody(mesh: THREE.Mesh): void {
    const body = this.bodies.get(mesh);
    if (body) {
      this.world.removeBody(body);
      this.bodies.delete(mesh);
      this.meshes.delete(body);
    }
  }

  /**
   * 获取网格对应的物理体
   */
  getBody(mesh: THREE.Mesh): CANNON.Body | undefined {
    return this.bodies.get(mesh);
  }

  /**
   * 获取物理体对应的网格
   */
  getMesh(body: CANNON.Body): THREE.Mesh | undefined {
    return this.meshes.get(body);
  }

  /**
   * 冻结物理体（设置为静态）
   */
  freezeBody(mesh: THREE.Mesh): void {
    const body = this.bodies.get(mesh);
    if (body) {
      body.mass = 0;
      body.updateMassProperties();
      body.velocity.set(0, 0, 0);
      body.angularVelocity.set(0, 0, 0);
    }
  }

  /**
   * 解冻物理体（恢复动态）
   */
  unfreezeBody(mesh: THREE.Mesh, mass: number = 1): void {
    const body = this.bodies.get(mesh);
    if (body) {
      body.mass = mass;
      body.updateMassProperties();
      body.wakeUp();
    }
  }

  /**
   * 更新物理世界
   */
  update(deltaTime: number): void {
    this.world.step(1 / 60, deltaTime, 3);

    // 同步Three.js网格和Cannon.js物理体
    this.bodies.forEach((body, mesh) => {
      mesh.position.copy(body.position as any);
      mesh.quaternion.copy(body.quaternion as any);
    });
  }

  /**
   * 施加力到物理体
   */
  applyForce(mesh: THREE.Mesh, force: THREE.Vector3, worldPoint?: THREE.Vector3): void {
    const body = this.bodies.get(mesh);
    if (body) {
      const cannonForce = new CANNON.Vec3(force.x, force.y, force.z);
      if (worldPoint) {
        const cannonPoint = new CANNON.Vec3(worldPoint.x, worldPoint.y, worldPoint.z);
        body.applyForce(cannonForce, cannonPoint);
      } else {
        body.applyForce(cannonForce);
      }
    }
  }

  /**
   * 施加冲量到物理体
   */
  applyImpulse(mesh: THREE.Mesh, impulse: THREE.Vector3, worldPoint?: THREE.Vector3): void {
    const body = this.bodies.get(mesh);
    if (body) {
      const cannonImpulse = new CANNON.Vec3(impulse.x, impulse.y, impulse.z);
      if (worldPoint) {
        const cannonPoint = new CANNON.Vec3(worldPoint.x, worldPoint.y, worldPoint.z);
        body.applyImpulse(cannonImpulse, cannonPoint);
      } else {
        body.applyImpulse(cannonImpulse);
      }
    }
  }
}
