declare module 'three/examples/jsm/controls/OrbitControls' {
  import type { Camera } from 'three';
  import { EventDispatcher } from 'three';

  export class OrbitControls extends EventDispatcher {
    constructor(object: Camera, domElement?: HTMLElement | null);
    enableDamping: boolean;
    enablePan: boolean;
    dispose(): void;
    update(): void;
  }
}
