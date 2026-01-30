// main.js
// Minimal Koalas-to-the-Max style implementation
// Entire logic runs client-side using Canvas

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const SIZE = 512;              // Canvas resolution
const MAX_DEPTH = 7;           // Controls detail level (2^7 = 128)
const images = [
  "/images/img1.jpg",
  "/images/img2.jpg",
  "/images/img3.jpg",
  "/images/img4.jpg"
];

canvas.width = SIZE;
canvas.height = SIZE;

// -----------------------------
// Utility
// -----------------------------
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
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
  const rect = canvas.getBoundingClientRect();
  const mx = ((e.clientX - rect.left) / rect.width) * SIZE;
  const my = ((e.clientY - rect.top) / rect.height) * SIZE;

  const target = findNode(root, mx, my);
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

function loadImage() {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = randomChoice(images);
  img.onload = () => init(img);
}

loadImage();
