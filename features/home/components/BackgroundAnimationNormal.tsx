"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

interface BackgroundAnimationNormalProps {
  className?: string;
}

const BackgroundAnimationNormal: React.FC<BackgroundAnimationNormalProps> = ({
  className = "absolute inset-0 z-0",
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const mount = mountRef.current;

    let scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    let camera = new THREE.PerspectiveCamera(
      60,
      mount.clientWidth / mount.clientHeight,
      1,
      1000
    );
    camera.position.set(0, 4, 21);
    let renderer = new THREE.WebGLRenderer();
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

    let controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;

    let gu = {
      time: { value: 0 },
    };

    let sizes: number[] = [];
    let shift: number[] = [];
    let pushShift = () => {
      shift.push(
        Math.random() * Math.PI,
        Math.random() * Math.PI * 2,
        (Math.random() * 0.9 + 0.1) * Math.PI * 0.1,
        Math.random() * 0.9 + 0.1
      );
    };

    let pts = new Array(50000).fill(0).map(() => {
      sizes.push(Math.random() * 1.5 + 0.5);
      pushShift();
      return new THREE.Vector3()
        .randomDirection()
        .multiplyScalar(Math.random() * 0.5 + 9.5);
    });

    for (let i = 0; i < 100000; i++) {
      let r = 10,
        R = 40;
      let rand = Math.pow(Math.random(), 1.5);
      let radius = Math.sqrt(R * R * rand + (1 - rand) * r * r);
      pts.push(
        new THREE.Vector3().setFromCylindricalCoords(
          radius,
          Math.random() * 2 * Math.PI,
          (Math.random() - 0.5) * 2
        )
      );
      sizes.push(Math.random() * 1.5 + 0.5);
      pushShift();
    }

    let g = new THREE.BufferGeometry().setFromPoints(pts);
    g.setAttribute("sizes", new THREE.Float32BufferAttribute(sizes, 1));
    g.setAttribute("shift", new THREE.Float32BufferAttribute(shift, 4));

    // Fix for line 73: `onBeforeCompile` moved outside of PointsMaterial constructor to fix TypeScript error.
    let m = new THREE.PointsMaterial({
      size: 0.125,
      transparent: true,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
    m.onBeforeCompile = (shader) => {
      shader.uniforms.time = gu.time;
      shader.vertexShader = `
                  uniform float time;
                  attribute float sizes;
                  attribute vec4 shift;
                  varying vec3 vColor;
                  ${shader.vertexShader}
                `
        .replace(`gl_PointSize = size;`, `gl_PointSize = size * sizes;`)
        .replace(
          `#include <color_vertex>`,
          `#include <color_vertex>
                    float d = length(abs(position) / vec3(40., 10., 40));
                    d = clamp(d, 0., 1.);
                    vColor = mix(vec3(240., 0., 255.), vec3(0., 240., 255.), d) / 255.;
                  `
        )
        .replace(
          `#include <begin_vertex>`,
          `#include <begin_vertex>
                    float t = time;
                    float moveT = mod(shift.x + shift.z * t, 3.1415926535 * 2.0);
                    float moveS = mod(shift.y + shift.z * t, 3.1415926535 * 2.0);
                    transformed += vec3(cos(moveS) * sin(moveT), cos(moveT), sin(moveS) * sin(moveT)) * shift.w;
                  `
        );
      shader.fragmentShader = `
                  varying vec3 vColor;
                  ${shader.fragmentShader}
                `.replace(
        `vec4 diffuseColor = vec4( diffuse, opacity );`,
        `vec4 diffuseColor = vec4( vColor, 1.0 - smoothstep(0.1, 0.5, length(gl_PointCoord.xy - 0.5)) );`
      );
    };

    let p = new THREE.Points(g, m);
    p.rotation.order = "ZYX";
    p.rotation.z = 0.2;
    scene.add(p);

    let clock = new THREE.Clock();

    const animate = () => {
      controls.update();
      let t = clock.getElapsedTime() * 0.5;
      gu.time.value = t * Math.PI;
      p.rotation.y = t * 0.05;
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
      g.dispose();
      m.dispose();
      scene.remove(p);
    };
  }, []);

  return <div ref={mountRef} className={className} />;
};

export default BackgroundAnimationNormal;
