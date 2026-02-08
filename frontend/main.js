// main.js
// Minimal Koalas-to-the-Max style implementation
// Entire logic runs client-side using Canvas

const API_BASE_URL = "https://reveal-backend-727070728102.us-central1.run.app";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const SIZE = 512;              // Canvas resolution
const MAX_DEPTH = 7;           // Controls detail level (2^7 = 128)

canvas.width = SIZE;
canvas.height = SIZE;

// -----------------------------
// Utility
// -----------------------------
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// -----------------------------
// Backend Connection
// -----------------------------
async function fetchImagesFromBackend(){
  const response = await fetch(`${API_BASE_URL}/images`);
  const data = await response.json();
  return data.images; 
}


// -----------------------------
// Quadtree Node
// -----------------------------
function createNode(x, y, size, color, depth) {
  return {
    x,
    y,
    size,
    color,
    depth,
    children: null
  };
}

function splitNode(node, imageData) {
  if (node.depth >= MAX_DEPTH || node.children) return;

  const half = node.size / 2;
  const nextDepth = node.depth + 1;

  node.children = [];

  for (let dy = 0; dy < 2; dy++) {
    for (let dx = 0; dx < 2; dx++) {
      const cx = node.x + dx * half;
      const cy = node.y + dy * half;
      const color = averageColor(cx, cy, half, imageData);
      node.children.push(createNode(cx, cy, half, color, nextDepth));
    }
  }
}

// -----------------------------
// Color Sampling
// -----------------------------
function averageColor(x, y, size, imageData) {
  const data = imageData.data;
  const width = imageData.width;

  let r = 0, g = 0, b = 0, count = 0;

  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      const px = Math.floor(x + i);
      const py = Math.floor(y + j);
      const idx = (py * width + px) * 4;

      r += data[idx];
      g += data[idx + 1];
      b += data[idx + 2];
      count++;
    }
  }

  return `rgb(${r / count}, ${g / count}, ${b / count})`;
}

// -----------------------------
// Rendering
// -----------------------------
function drawNode(node) {
  if (node.children) {
    node.children.forEach(drawNode);
    return;
  }

  ctx.beginPath();
  ctx.fillStyle = node.color;
  ctx.arc(
    node.x + node.size / 2,
    node.y + node.size / 2,
    node.size / 2,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

function redraw(root) {
  ctx.clearRect(0, 0, SIZE, SIZE);
  drawNode(root);
}

// -----------------------------
// Interaction
// -----------------------------
function findNode(node, mx, my) {
  if (!node.children) return node;

  for (const child of node.children) {
    if (
      mx >= child.x && mx < child.x + child.size &&
      my >= child.y && my < child.y + child.size
    ) {
      return findNode(child, mx, my);
    }
  }
}

canvas.addEventListener("mousemove", (e) => {
  if(!root || !imageData) return; // Ensures no interaction before image is ready, i.e. mouse pointer doesn't change style if image is not yet loaded

  const rect = canvas.getBoundingClientRect();
  const mx = ((e.clientX - rect.left) / rect.width) * SIZE;
  const my = ((e.clientY - rect.top) / rect.height) * SIZE;

  const target = findNode(root, mx, my);
  if(!target) return; // Ensures no interaction before image is ready, i.e. mouse pointer doesn't change style if image is not yet loaded

  splitNode(target, imageData);
  redraw(root);
});

// -----------------------------
// Image Loading + Init
// -----------------------------
let root = null;
let imageData = null;

function init(image) {
  ctx.drawImage(image, 0, 0, SIZE, SIZE);
  imageData = ctx.getImageData(0, 0, SIZE, SIZE);

  const color = averageColor(0, 0, SIZE, imageData);
  root = createNode(0, 0, SIZE, color, 0);

  redraw(root);
}

async function loadImage(){
  try{
    const images = await fetchImagesFromBackend();

    if(!images || images.length === 0){
      console.error("No images received from backend");
      return;
    }

    const chosen = randomChoice(images);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = chosen.url;

    img.onload = () => {
      console.log("Image loaded:", chosen.url);
      init(img);
    };

    img.onerror = () => {
      console.error("Failed to load image:", chosen.url);
    };

  } catch(err) {
    console.error("loadImage failed: ",err);
  }
}

loadImage();
