class Weather3DScene {
  constructor(canvasContainerId) {
    this.container = document.getElementById(canvasContainerId);
    this.weatherCategory = "sunny"; // sunny, rainy, storm, cloudy, fog, snow
    this.initScene();
    this.createSkyAndSun();
    this.createVolumetricClouds();
    this.createWeatherParticleSystems();
    this.setupEvents();
    this.animate();
  }

  initScene() {
    this.scene = new THREE.Scene();
    // Subtle fog to preserve clear view of 4K HD wallpaper image
    this.scene.fog = new THREE.FogExp2(0xbae6fd, 0.0008);

    this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 5, 30);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setClearColor(0x000000, 0); // 100% Transparent background for 4K HD wallpaper
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    // Light Theme Lighting Setup
    this.ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
    this.scene.add(this.ambientLight);

    // Warm Sun Light Source
    this.sunLight = new THREE.DirectionalLight(0xfffbeb, 2.8);
    this.sunLight.position.set(20, 40, -10);
    this.scene.add(this.sunLight);

    // Lightning Flash Source
    this.lightningLight = new THREE.PointLight(0x38bdf8, 0, 200);
    this.lightningLight.position.set(0, 25, 0);
    this.scene.add(this.lightningLight);

    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  }

  createSkyAndSun() {
    this.skyGroup = new THREE.Group();

    // Radiant 3D Sun Sphere
    const sunGeo = new THREE.SphereGeometry(5, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
    this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
    this.sunMesh.position.set(22, 24, -40);
    this.skyGroup.add(this.sunMesh);

    // Sun Outer Halo Glow Shell
    const haloGeo = new THREE.SphereGeometry(8.5, 32, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.4,
      side: THREE.BackSide
    });
    this.sunHalo = new THREE.Mesh(haloGeo, haloMat);
    this.sunHalo.position.copy(this.sunMesh.position);
    this.skyGroup.add(this.sunHalo);

    // Sun Motes
    const moteCount = 450;
    const moteGeo = new THREE.BufferGeometry();
    const motePos = new Float32Array(moteCount * 3);
    for (let i = 0; i < moteCount; i++) {
      motePos[i * 3] = (Math.random() - 0.5) * 90;
      motePos[i * 3 + 1] = Math.random() * 45;
      motePos[i * 3 + 2] = (Math.random() - 0.5) * 90;
    }
    moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
    const moteMat = new THREE.PointsMaterial({
      color: 0xfef08a,
      size: 0.35,
      transparent: true,
      opacity: 0.7
    });
    this.sunMotes = new THREE.Points(moteGeo, moteMat);
    this.skyGroup.add(this.sunMotes);

    this.scene.add(this.skyGroup);
  }

  createVolumetricClouds() {
    this.cloudsGroup = new THREE.Group();
    this.cloudClusters = [];

    const createCloudCluster = (x, y, z, scale) => {
      const cluster = new THREE.Group();
      const puffGeo = new THREE.SphereGeometry(2.4, 16, 16);
      const puffMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.9,
        metalness: 0.05,
        transparent: true,
        opacity: 0.92
      });

      const numPuffs = 6 + Math.floor(Math.random() * 3);
      for (let i = 0; i < numPuffs; i++) {
        const puff = new THREE.Mesh(puffGeo, puffMat);
        puff.position.set(
          (Math.random() - 0.5) * 3.5 * scale,
          (Math.random() - 0.3) * 1.8 * scale,
          (Math.random() - 0.5) * 2.8 * scale
        );
        const s = (0.8 + Math.random() * 0.6) * scale;
        puff.scale.set(s, s * 0.65, s);
        cluster.add(puff);
      }

      cluster.position.set(x, y, z);
      return cluster;
    };

    // Position compact clouds strictly in the upper half of the sky viewport
    for (let i = 0; i < 20; i++) {
      const x = (Math.random() - 0.5) * 100;
      const y = 18 + Math.random() * 14; // Higher in the sky (upper half only)
      const z = -20 + (Math.random() - 0.5) * 35;
      const scale = 0.9 + Math.random() * 1.2;

      const cloud = createCloudCluster(x, y, z, scale);
      this.cloudsGroup.add(cloud);
      this.cloudClusters.push({
        mesh: cloud,
        speed: 0.02 + Math.random() * 0.03
      });
    }

    this.scene.add(this.cloudsGroup);
  }

  createWeatherParticleSystems() {
    const rainCount = 4500;
    const rainGeo = new THREE.BufferGeometry();
    const rainPositions = new Float32Array(rainCount * 2 * 3);
    this.rainVelocities = new Float32Array(rainCount);

    for (let i = 0; i < rainCount; i++) {
      const x = (Math.random() - 0.5) * 110;
      const y = Math.random() * 65;
      const z = (Math.random() - 0.5) * 85;
      const dropLength = 1.2 + Math.random() * 1.0;

      // Top of raindrop
      rainPositions[i * 6] = x;
      rainPositions[i * 6 + 1] = y;
      rainPositions[i * 6 + 2] = z;

      // Bottom of raindrop
      rainPositions[i * 6 + 3] = x - 0.25;
      rainPositions[i * 6 + 4] = y - dropLength;
      rainPositions[i * 6 + 5] = z;

      this.rainVelocities[i] = 1.4 + Math.random() * 1.1;
    }

    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    const rainMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.95
    });

    this.rainParticles = new THREE.LineSegments(rainGeo, rainMat);
    this.rainParticles.visible = false;
    this.scene.add(this.rainParticles);
  }

  setWeatherCategory(category) {
    this.weatherCategory = category;

    if (category === "sunny") {
      this.sunMesh.visible = true;
      this.sunHalo.visible = true;
      this.sunMotes.visible = true;
      this.rainParticles.visible = false;

      this.scene.fog.color.setHex(0xbae6fd);
      this.sunLight.intensity = 3.2;

      this.cloudClusters.forEach(c => {
        c.mesh.children.forEach(puff => {
          puff.material.color.setHex(0xffffff);
          puff.material.opacity = 0.96;
        });
      });
    } else if (category === "rainy" || category === "storm") {
      this.sunMesh.visible = false;
      this.sunHalo.visible = false;
      this.sunMotes.visible = false;
      this.rainParticles.visible = true;

      this.scene.fog.color.setHex(0x64748b);
      this.sunLight.intensity = (category === "storm") ? 0.4 : 0.9;

      this.cloudClusters.forEach(c => {
        c.mesh.children.forEach(puff => {
          puff.material.color.setHex(category === "storm" ? 0x334155 : 0x475569);
          puff.material.opacity = 0.98;
        });
      });
    } else {
      this.sunMesh.visible = true;
      this.sunHalo.visible = false;
      this.sunMotes.visible = false;
      this.rainParticles.visible = false;

      this.scene.fog.color.setHex(0xcbd5e1);
      this.sunLight.intensity = 1.6;

      this.cloudClusters.forEach(c => {
        c.mesh.children.forEach(puff => {
          puff.material.color.setHex(0xe2e8f0);
          puff.material.opacity = 0.92;
        });
      });
    }
  }

  setupEvents() {
    window.addEventListener('resize', () => {
      if (!this.container) return;
      this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    });

    window.addEventListener('mousemove', (e) => {
      this.mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      this.mouse.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.04;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.04;

    this.camera.position.x = this.mouse.x * 6;
    this.camera.position.y = 5 + this.mouse.y * -3;
    this.camera.lookAt(0, 10, -20);

    this.cloudClusters.forEach(c => {
      c.mesh.position.x += c.speed;
      if (c.mesh.position.x > 60) {
        c.mesh.position.x = -60;
      }
    });

    if (this.sunHalo && this.sunHalo.visible) {
      this.sunHalo.scale.setScalar(1 + Math.sin(Date.now() * 0.002) * 0.05);
    }

    if (this.rainParticles && this.rainParticles.visible) {
      const pos = this.rainParticles.geometry.attributes.position.array;
      const dropCount = pos.length / 6;
      for (let i = 0; i < dropCount; i++) {
        const vel = this.rainVelocities[i];
        pos[i * 6 + 1] -= vel;
        pos[i * 6] -= vel * 0.08;

        pos[i * 6 + 4] -= vel;
        pos[i * 6 + 3] -= vel * 0.08;

        if (pos[i * 6 + 1] < -5) {
          const newX = (Math.random() - 0.5) * 110;
          const newY = 60 + Math.random() * 12;
          const newZ = (Math.random() - 0.5) * 85;
          const dropLength = 1.2 + Math.random() * 1.0;

          pos[i * 6] = newX;
          pos[i * 6 + 1] = newY;
          pos[i * 6 + 2] = newZ;

          pos[i * 6 + 3] = newX - 0.25;
          pos[i * 6 + 4] = newY - dropLength;
          pos[i * 6 + 5] = newZ;
        }
      }
      this.rainParticles.geometry.attributes.position.needsUpdate = true;
    }

    // Thunderstorm Lightning Flash Animation
    if (this.weatherCategory === "storm" && Math.random() > 0.965) {
      this.lightningLight.intensity = 45 + Math.random() * 35;
      if (this.container) {
        this.container.style.backgroundColor = "rgba(255, 255, 255, 0.25)";
      }
      setTimeout(() => {
        this.lightningLight.intensity = 0;
        if (this.container) {
          this.container.style.backgroundColor = "transparent";
        }
      }, 70 + Math.random() * 50);
    }

    this.renderer.render(this.scene, this.camera);
  }
}
