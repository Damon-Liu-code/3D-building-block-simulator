// 缓动函数集合
export const Easing = {
  linear: (t: number) => t,

  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) =>
    t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,

  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => (--t) * t * t + 1,
  easeInOutCubic: (t: number) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

  easeInElastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
  },

  easeOutElastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },

  easeInBounce: (t: number) => 1 - Easing.easeOutBounce(1 - t),

  easeOutBounce: (t: number) => {
    const n1 = 7.5625;
    const d1 = 2.75;

    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  }
};

// 动画管理器
export class AnimationManager {
  private animations: Map<string, any> = new Map();

  animate(
    id: string,
    object: any,
    property: string,
    from: any,
    to: any,
    duration: number = 1000,
    easing: (t: number) => number = Easing.easeInOutQuad
  ): Promise<void> {
    // 取消已存在的同ID动画
    this.cancel(id);

    return new Promise((resolve) => {
      const startTime = Date.now();
      const animation = {
        id,
        cancelled: false
      };

      this.animations.set(id, animation);

      const update = () => {
        if (animation.cancelled) {
          resolve();
          return;
        }

        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easing(progress);

        // 更新对象属性
        if (typeof from === 'number' && typeof to === 'number') {
          object[property] = from + (to - from) * easedProgress;
        } else if (typeof from === 'object' && typeof to === 'object') {
          for (const key in from) {
            object[property][key] = from[key] + (to[key] - from[key]) * easedProgress;
          }
        }

        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          this.animations.delete(id);
          resolve();
        }
      };

      update();
    });
  }

  cancel(id: string): void {
    const animation = this.animations.get(id);
    if (animation) {
      animation.cancelled = true;
      this.animations.delete(id);
    }
  }

  cancelAll(): void {
    this.animations.forEach((animation) => {
      animation.cancelled = true;
    });
    this.animations.clear();
  }
}

// 预设动画效果
export const AnimationPresets = {
  fadeIn: async (object: any, duration: number = 500) => {
    const manager = new AnimationManager();
    await manager.animate(
      'fade',
      object.material,
      'opacity',
      0,
      1,
      duration,
      Easing.easeInQuad
    );
  },

  fadeOut: async (object: any, duration: number = 500) => {
    const manager = new AnimationManager();
    await manager.animate(
      'fade',
      object.material,
      'opacity',
      1,
      0,
      duration,
      Easing.easeOutQuad
    );
  },

  pulse: async (object: any, scale: number = 1.2, duration: number = 600) => {
    const manager = new AnimationManager();
    const originalScale = { x: 1, y: 1, z: 1 };
    const targetScale = { x: scale, y: scale, z: scale };

    await manager.animate(
      'pulse-up',
      object,
      'scale',
      originalScale,
      targetScale,
      duration / 2,
      Easing.easeOutQuad
    );

    await manager.animate(
      'pulse-down',
      object,
      'scale',
      targetScale,
      originalScale,
      duration / 2,
      Easing.easeInQuad
    );
  },

  shake: async (object: any, intensity: number = 0.1, duration: number = 500) => {
    const manager = new AnimationManager();
    const originalPos = { ...object.position };
    const shakes = 10;
    const shakeInterval = duration / shakes;

    for (let i = 0; i < shakes; i++) {
      const offsetX = (Math.random() - 0.5) * intensity;
      const offsetY = (Math.random() - 0.5) * intensity;
      const offsetZ = (Math.random() - 0.5) * intensity;

      await manager.animate(
        `shake-${i}`,
        object,
        'position',
        object.position,
        {
          x: originalPos.x + offsetX,
          y: originalPos.y + offsetY,
          z: originalPos.z + offsetZ
        },
        shakeInterval,
        Easing.linear
      );
    }

    await manager.animate(
      'shake-restore',
      object,
      'position',
      object.position,
      originalPos,
      shakeInterval,
      Easing.linear
    );
  }
};
