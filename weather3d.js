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
    this.scene.fog = new THREE.FogExp2(0xbae6fd, 0.007); // Light sky blue fog

    this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 5, 30);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    // Light Theme Lighting Setup
    this.ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
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
      const puffGeo = new THREE.SphereGeometry(3.0, 16, 16);
      const puffMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.95,
        metalness: 0.05,
        transparent: true,
        opacity: 0.9
      });

      const numPuffs = 6 + Math.floor(Math.random() * 3);
      for (let i = 0; i < numPuffs; i++) {
        const puff = new THREE.Mesh(puffGeo, puffMat);
        puff.position.set(
          (Math.random() - 0.5) * 4 * scale,
          (Math.random() - 0.3) * 2 * scale,
          (Math.random() - 0.5) * 3 * scale
        );
        const s = (0.8 + Math.random() * 0.7) * scale;
        puff.scale.set(s, s * 0.75, s);
        cluster.add(puff);
      }

      cluster.position.set(x, y, z);
      return cluster;
    };

    for (let i = 0; i < 18; i++) {
      const x = (Math.random() - 0.5) * 100;
      const y = 8 + Math.random() * 20;
      const z = -15 + (Math.random() - 0.5) * 55;
      const scale = 1 + Math.random() * 1.6;

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
    const rainCount = 2000;
    const rainGeo = new THREE.BufferGeometry();
    const rainPos = new Float32Array(rainCount * 3);
    this.rainVelocities = new Float32Array(rainCount);

    for (let i = 0; i < rainCount; i++) {
      rainPos[i * 3] = (Math.random() - 0.5) * 80;
      rainPos[i * 3 + 1] = Math.random() * 50;
      rainPos[i * 3 + 2] = (Math.random() - 0.5) * 80;
      this.rainVelocities[i] = 0.5 + Math.random() * 0.5;
    }

    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0x0284c7,
      size: 0.25,
      transparent: true,
      opacity: 0.8
    });
    this.rainParticles = new THREE.Points(rainGeo, rainMat);
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
      this.sunLight.intensity = 2.8;

      this.cloudClusters.forEach(c => {
        c.mesh.children.forEach(puff => {
          puff.material.color.setHex(0xffffff);
          puff.material.opacity = 0.9;
        });
      });
    } else if (category === "rainy" || category === "storm") {
      this.sunMesh.visible = false;
      this.sunHalo.visible = false;
      this.sunMotes.visible = false;
      this.rainParticles.visible = true;

      this.scene.fog.color.setHex(0x94a3b8);
      this.sunLight.intensity = 0.8;

      this.cloudClusters.forEach(c => {
        c.mesh.children.forEach(puff => {
          puff.material.color.setHex(0x64748b);
          puff.material.opacity = 0.95;
        });
      });
    } else {
      this.sunMesh.visible = true;
      this.sunHalo.visible = false;
      this.sunMotes.visible = false;
      this.rainParticles.visible = false;

      this.scene.fog.color.setHex(0xcbd5e1);
      this.sunLight.intensity = 1.4;

      this.cloudClusters.forEach(c => {
        c.mesh.children.forEach(puff => {
          puff.material.color.setHex(0xe2e8f0);
          puff.material.opacity = 0.85;
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
      if (c.mesh.position.x > 50) {
        c.mesh.position.x = -50;
      }
    });

    if (this.sunHalo && this.sunHalo.visible) {
      this.sunHalo.scale.setScalar(1 + Math.sin(Date.now() * 0.002) * 0.05);
    }

    if (this.rainParticles && this.rainParticles.visible) {
      const pos = this.rainParticles.geometry.attributes.position.array;
      for (let i = 0; i < pos.length / 3; i++) {
        pos[i * 3 + 1] -= this.rainVelocities[i];
        if (pos[i * 3 + 1] < 0) {
          pos[i * 3 + 1] = 50;
        }
      }
      this.rainParticles.geometry.attributes.position.needsUpdate = true;
    }

    if (this.weatherCategory === "storm" && Math.random() > 0.975) {
      this.lightningLight.intensity = 15 + Math.random() * 10;
      setTimeout(() => { this.lightningLight.intensity = 0; }, 80);
    }

    this.renderer.render(this.scene, this.camera);
  }
}
