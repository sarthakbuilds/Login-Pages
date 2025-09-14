// --- 3D BACKGROUND LOGIC ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById('bg-canvas'),
  alpha: true,
  antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);

const textureLoader = new THREE.TextureLoader();

// Earth
const earthGeometry = new THREE.SphereGeometry(2.5, 64, 64);
const earthMaterial = new THREE.MeshStandardMaterial({
  map: textureLoader.load('https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/world.topo.bathy.200412.3x5400x2700.jpg'),
  normalMap: textureLoader.load('https://www.solarsystemscope.com/textures/download/2k_earth_normal_map.png'),
  specularMap: textureLoader.load('https://www.solarsystemscope.com/textures/download/2k_earth_specular_map.png'),
  emissiveMap: textureLoader.load('https://www.solarsystemscope.com/textures/download/2k_earth_nightmap.jpg'),
  emissive: new THREE.Color(0xffffff),
  metalness: 0.5,
  roughness: 0.7
});
const earth = new THREE.Mesh(earthGeometry, earthMaterial);
scene.add(earth);

// Clouds
const cloudGeometry = new THREE.SphereGeometry(2.55, 64, 64);
const cloudMaterial = new THREE.MeshStandardMaterial({
  map: textureLoader.load('https://www.solarsystemscope.com/textures/download/2k_earth_clouds.jpg'),
  transparent: true,
  opacity: 0.4,
  blending: THREE.AdditiveBlending
});
const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
scene.add(clouds);

// Glow Atmosphere
const glowGeometry = new THREE.SphereGeometry(2.6, 64, 64);
const glowMaterial = new THREE.ShaderMaterial({
  uniforms: {
    'c': { type: 'f', value: 0.1 },
    'p': { type: 'f', value: 5.0 },
    glowColor: { type: 'c', value: new THREE.Color(0x93c5fd) },
    viewVector: { type: 'v3', value: camera.position }
  },
  vertexShader: `
      uniform vec3 viewVector;
      uniform float c;
      uniform float p;
      varying float intensity;
      void main() {
          vec3 vNormal = normalize( normalMatrix * normal );
          vec3 vNormel = normalize( normalMatrix * viewVector );
          intensity = pow( c - dot(vNormal, vNormel), p );
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      }
  `,
  fragmentShader: `
      uniform vec3 glowColor;
      varying float intensity;
      void main() {
          vec3 glow = glowColor * intensity;
          gl_FragColor = vec4( glow, 1.0 );
      }
  `,
  side: THREE.BackSide,
  blending: THREE.AdditiveBlending,
  transparent: true
});
const atmosphere = new THREE.Mesh(glowGeometry, glowMaterial);
scene.add(atmosphere);

// Stars
const starGeometry = new THREE.BufferGeometry();
const starVertices = [];
for (let i = 0; i < 15000; i++) {
  const x = (Math.random() - 0.5) * 2000;
  const y = (Math.random() - 0.5) * 2000;
  const z = (Math.random() - 0.5) * 2000;
  if (Math.sqrt(x*x + y*y + z*z) > 100) {
    starVertices.push(x, y, z);
  }
}
starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.7 });
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(5, 3, 5);
scene.add(directionalLight);

camera.position.z = 5;

function animate() {
  requestAnimationFrame(animate);
  earth.rotation.y += 0.0005;
  clouds.rotation.y += 0.0006;
  stars.rotation.y += 0.0001;
  renderer.render(scene, camera);
}
animate();

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Mouse Interaction
const formElement = document.querySelector('.login-form');
document.addEventListener('mousemove', (e) => {
  const mouseX = (e.clientX / window.innerWidth) * 2 - 1;
  const mouseY = -(e.clientY / window.innerHeight) * 2 + 1;

  const cameraTarget = new THREE.Vector3(mouseX * 0.5, mouseY * 0.5, 5);
  camera.position.lerp(cameraTarget, 0.05);
  camera.lookAt(scene.position);

  const tiltX = mouseY * -10;
  const tiltY = mouseX * 10;
  formElement.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
});

// Validation
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const emailError = document.getElementById('email-error');
const passwordError = document.getElementById('password-error');
const loginForm = document.getElementById('loginForm');

const validateEmail = (email) => {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

const validatePassword = (password) => password.length >= 8;

emailInput.addEventListener('input', () => {
  emailError.textContent = (emailInput.value.trim() !== '' && !validateEmail(emailInput.value)) 
    ? 'Please enter a valid email address.' 
    : '';
});

passwordInput.addEventListener('input', () => {
  passwordError.textContent = (passwordInput.value.trim() !== '' && !validatePassword(passwordInput.value)) 
    ? 'Password must be at least 8 characters.' 
    : '';
});

loginForm.addEventListener('submit', (e) => {
  e.preventDefault(); 
  let isValid = true;

  if (emailInput.value.trim() === '') {
    emailError.textContent = 'Email is required.';
    isValid = false;
  } else if (!validateEmail(emailInput.value)) {
    emailError.textContent = 'Please enter a valid email address.';
    isValid = false;
  } else {
    emailError.textContent = '';
  }

  if (passwordInput.value.trim() === '') {
    passwordError.textContent = 'Password is required.';
    isValid = false;
  } else if (!validatePassword(passwordInput.value)) {
    passwordError.textContent = 'Password must be at least 8 characters.';
    isValid = false;
  } else {
    passwordError.textContent = '';
  }

  if (isValid) {
    console.log('Form submitted successfully!');
  } else {
    formElement.classList.add('shake');
    setTimeout(() => formElement.classList.remove('shake'), 500);
  }
});
