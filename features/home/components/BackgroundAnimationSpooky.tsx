"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

interface BackgroundAnimationSpookyProps {
  className?: string;
}

const BackgroundAnimationSpooky: React.FC<BackgroundAnimationSpookyProps> = ({
  className = "absolute inset-0 z-0",
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const mount = mountRef.current;

    const scene = new THREE.Scene();
    // Darker background for spooky mode
    scene.background = new THREE.Color(0x1a0a0a);
    const camera = new THREE.PerspectiveCamera(
      60,
      mount.clientWidth / mount.clientHeight,
      1,
      1000
    );
    camera.position.set(0, 4, 21);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const handleResize = () => {
      if (mount) {
        camera.aspect = mount.clientWidth / mount.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(mount.clientWidth, mount.clientHeight);
      }
    };
    window.addEventListener("resize", handleResize);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;

    const ghostGroup = new THREE.Group();
    const ghosts: THREE.Mesh[] = [];

    // Load ghost texture and create instances
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      "/icons/ghost.png",
      (texture) => {
        // Ghost PNG loaded successfully
        createGhostInstances(texture);
      },
      undefined,
      (error) => {
        console.error("Failed to load ghost.png:", error);
        // Fallback to simple orange rectangles if texture fails to load
        createFallbackGhosts();
      }
    );

    const createGhostInstances = (texture: THREE.Texture) => {
      // More ghosts for spooky mode
      const numGhosts = 150;

      for (let i = 0; i < numGhosts; i++) {
        // Create a plane with the ghost texture
        const geometry = new THREE.PlaneGeometry(2, 2);

        // Orange tint for spooky mode
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          opacity: 0.9,
          side: THREE.DoubleSide,
          alphaTest: 0.1,
          color: new THREE.Color().setHSL(0.08, 0.8, 0.8), // Orange tint
        });

        const ghost = new THREE.Mesh(geometry, material);

        // Random position in spherical coordinates
        const radius = Math.random() * 30 + 15;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;

        ghost.position.setFromSphericalCoords(radius, phi, theta);

        // Random rotation
        ghost.rotation.x = Math.random() * Math.PI * 2;
        ghost.rotation.y = Math.random() * Math.PI * 2;
        ghost.rotation.z = Math.random() * Math.PI * 2;

        // Larger scale variation for spooky mode
        const scale = 0.5 + Math.random() * 0.8;
        ghost.scale.setScalar(scale);

        // Faster/more erratic animation for spooky mode
        ghost.userData = {
          originalPosition: ghost.position.clone(),
          rotationSpeed: {
            x: (Math.random() - 0.5) * 0.012, // 1.5x faster
            y: (Math.random() - 0.5) * 0.012,
            z: (Math.random() - 0.5) * 0.012,
          },
          floatSpeed: (Math.random() * 0.4 + 0.2) * 1.5,
          floatOffset: Math.random() * Math.PI * 2,
          orbitSpeed: (Math.random() - 0.5) * 0.0045, // 1.5x faster
        };

        ghosts.push(ghost);
        ghostGroup.add(ghost);
      }
    };

    const createFallbackGhosts = () => {
      // Fallback: orange rectangles for spooky mode
      const numGhosts = 150;

      for (let i = 0; i < numGhosts; i++) {
        const geometry = new THREE.PlaneGeometry(1.5, 2);
        const material = new THREE.MeshBasicMaterial({
          color: 0xff6600, // Orange for spooky
          transparent: true,
          opacity: 0.7,
          side: THREE.DoubleSide,
        });

        const ghost = new THREE.Mesh(geometry, material);

        // Random position in spherical coordinates
        const radius = Math.random() * 30 + 15;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;

        ghost.position.setFromSphericalCoords(radius, phi, theta);

        // Random rotation
        ghost.rotation.x = Math.random() * Math.PI * 2;
        ghost.rotation.y = Math.random() * Math.PI * 2;
        ghost.rotation.z = Math.random() * Math.PI * 2;

        // Larger scale variation for spooky mode
        const scale = 0.5 + Math.random() * 0.8;
        ghost.scale.setScalar(scale);

        // Faster/more erratic animation for spooky mode
        ghost.userData = {
          originalPosition: ghost.position.clone(),
          rotationSpeed: {
            x: (Math.random() - 0.5) * 0.012,
            y: (Math.random() - 0.5) * 0.012,
            z: (Math.random() - 0.5) * 0.012,
          },
          floatSpeed: (Math.random() * 0.4 + 0.2) * 1.5,
          floatOffset: Math.random() * Math.PI * 2,
          orbitSpeed: (Math.random() - 0.5) * 0.0045,
        };

        ghosts.push(ghost);
        ghostGroup.add(ghost);
      }
    };

    ghostGroup.rotation.order = "ZYX";
    ghostGroup.rotation.z = 0.2;
    scene.add(ghostGroup);

    const clock = new THREE.Clock();

    const animate = () => {
      controls.update();
      const t = clock.getElapsedTime() * 0.5;

      // Animate each ghost
      ghosts.forEach((ghost) => {
        const userData = ghost.userData;

        // Floating animation
        const floatY =
          Math.sin(t * userData.floatSpeed + userData.floatOffset) * 3;
        ghost.position.copy(userData.originalPosition);
        ghost.position.y += floatY;

        // Gentle rotation animation
        ghost.rotation.x += userData.rotationSpeed.x;
        ghost.rotation.y += userData.rotationSpeed.y;
        ghost.rotation.z += userData.rotationSpeed.z;

        // Orbital movement
        const orbitAngle = t * userData.orbitSpeed;
        const orbitRadius = 1.5;
        ghost.position.x += Math.cos(orbitAngle) * orbitRadius;
        ghost.position.z += Math.sin(orbitAngle) * orbitRadius;

        // Make ghosts face the camera more often
        if (Math.random() < 0.01) {
          ghost.lookAt(camera.position);
        }
      });

      // Rotate the entire group faster for spooky mode
      ghostGroup.rotation.y = t * 0.08;

      renderer.render(scene, camera);
    };

    renderer.setAnimationLoop(animate);

    return () => {
      renderer.setAnimationLoop(null);
      window.removeEventListener("resize", handleResize);
      if (mount) {
        mount.removeChild(renderer.domElement);
      }
      controls.dispose();
      scene.remove(ghostGroup);

      // Clean up ghost materials and geometries
      ghosts.forEach((ghost) => {
        ghost.geometry.dispose();
        if (Array.isArray(ghost.material)) {
          ghost.material.forEach((material) => material.dispose());
        } else {
          ghost.material.dispose();
        }
      });
    };
  }, []);

  return <div ref={mountRef} className={className} />;
};

export default BackgroundAnimationSpooky;
