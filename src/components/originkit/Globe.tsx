// OriginKit "Globe" — adapted for Vite + React 19
// (CDN three.js / d3-geo imports replaced with npm packages; Framer bindings removed)
import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  SphereGeometry,
  MeshBasicMaterial,
  Color,
  Mesh,
  Group,
  InstancedMesh,
  Matrix4,
  Raycaster,
  Vector2,
  TubeGeometry,
  CatmullRomCurve3,
  Vector3,
} from "three";
import { geoEquirectangular, geoPath } from "d3-geo";

function mapLinear(value: number, inMin: number, inMax: number, outMin: number, outMax: number) {
  if (inMax === inMin) return outMin;
  const t = (value - inMin) / (inMax - inMin);
  return outMin + t * (outMax - outMin);
}

const mapSpeedUiToInternal = (ui: number) =>
  ui === 0 ? 0 : mapLinear(Math.max(0, Math.min(10, ui)), 0, 10, 0, 0.9);
const mapDensityUiToSpacing = (ui: number) => mapLinear(Math.max(1, Math.min(10, ui)), 1, 10, 24, 8);
const mapScaleUiToMultiplier = (ui: number) => mapLinear(Math.max(1, Math.min(20, ui)), 1, 20, 0.2, 2);
const mapDotSizeUiToMultiplier = (ui: number) => mapLinear(Math.max(1, Math.min(10, ui)), 1, 10, 0.1, 0.5);
const mapMarkerDotSizeUiToMultiplier = (ui: number) =>
  mapLinear(Math.max(0, Math.min(100, ui)), 0, 100, 0.1, 2.5);
const normalizeSmoothing = (ui: number) => Math.max(0, Math.min(1, ui / 10));
const mapDragSpeedUiToSensitivity = (ui: number) =>
  mapLinear(Math.max(0, Math.min(10, ui)), 0, 10, 0.001, 0.02);

function latLngToPosition(lat: number, lng: number) {
  const latRad = lat * (Math.PI / 180);
  const lngRad = lng * (Math.PI / 180);
  return {
    x: Math.cos(latRad) * Math.sin(lngRad),
    y: Math.sin(latRad),
    z: Math.cos(latRad) * Math.cos(lngRad),
  };
}

interface Marker {
  lat: number;
  lng: number;
}
interface MarkerConfig {
  markers: Marker[];
  color: string;
  size: number;
}
interface DotsConfig {
  color: string;
  size: number;
  density: number;
  allDots: boolean;
}
interface Props {
  speed?: number;
  smoothing?: number;
  dots?: DotsConfig;
  scale?: number;
  stopOnHover?: boolean;
  markerConfig?: MarkerConfig;
  direction?: "left" | "right";
  initialLatitude?: number;
  initialLongitude?: number;
  oceanColor?: string;
  outlineColor?: string;
  showOutline?: boolean;
  graticuleColor?: string;
  showGrid?: boolean;
  outlineWidth?: number;
  dragSpeed?: number;
  style?: CSSProperties;
}

export default function Globe({
  speed = 2,
  smoothing = 8,
  dots = { color: "#3347e0", size: 5, density: 8, allDots: false },
  scale = 8,
  stopOnHover = true,
  markerConfig = { markers: [], color: "#101c66", size: 40 },
  direction = "left",
  initialLatitude = 23,
  initialLongitude = -23,
  oceanColor = "rgba(255,255,255,0)",
  outlineColor = "rgba(51,71,224,0.35)",
  showOutline = true,
  graticuleColor = "rgba(51,71,224,0.08)",
  showGrid = true,
  outlineWidth = 1,
  dragSpeed = 5,
  style,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  const dotColor = dots.color;
  const dotSize = dots.size;
  const density = dots.density;
  const allDots = dots.allDots;
  const smoothingN = normalizeSmoothing(smoothing);
  const baseRotationSpeed = mapSpeedUiToInternal(speed);
  const rotationSpeed = direction === "left" ? -baseRotationSpeed : baseRotationSpeed;
  const dotSpacing = mapDensityUiToSpacing(density);
  const dotSizeMultiplier = mapDotSizeUiToMultiplier(dotSize);
  const markerRadiusMultiplier = mapMarkerDotSizeUiToMultiplier(markerConfig.size);
  const scaleMultiplier = mapScaleUiToMultiplier(scale);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const containerWidth = container.clientWidth || container.offsetWidth || 800;
    const containerHeight = container.clientHeight || container.offsetHeight || 600;

    const scene = new Scene();
    const camera = new PerspectiveCamera(50, containerWidth / containerHeight, 0.1, 1e3);
    const baseRadius = 1;
    const globeRadius = baseRadius * scaleMultiplier;
    const cameraDistance = 2.5 / scaleMultiplier;
    camera.position.set(0, 0, cameraDistance);
    camera.lookAt(0, 0, 0);

    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerWidth, containerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = "srgb";
    const canvas = renderer.domElement;
    canvas.style.position = "absolute";
    canvas.style.inset = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    canvas.style.opacity = "0";
    canvas.style.transition = "opacity 1.2s ease";
    container.appendChild(canvas);

    const parseAlpha = (c: string) => {
      const m = c.match(/rgba?\([^)]*,\s*([\d.]+)\s*\)/);
      return m ? parseFloat(m[1]!) : 1;
    };
    const oceanAlpha = parseAlpha(oceanColor);
    const outlineAlpha = parseAlpha(outlineColor);
    const graticuleAlpha = parseAlpha(graticuleColor);

    const oceanMaterial = new MeshBasicMaterial({
      color: new Color(oceanColor.startsWith("rgba") ? "#ffffff" : oceanColor),
      transparent: true,
      opacity: oceanAlpha,
    });
    const oceanMesh = new Mesh(new SphereGeometry(globeRadius, 64, 64), oceanMaterial);

    const continentOutlineGroup = new Group();
    const graticuleGroup = new Group();
    const gridWidth = 1;

    const tubeFromPositions = (positions: number[], material: MeshBasicMaterial, radius: number) => {
      const points: Vector3[] = [];
      for (let i = 0; i < positions.length; i += 3) {
        points.push(new Vector3(positions[i]!, positions[i + 1]!, positions[i + 2]!));
      }
      if (points.length < 2) return null;
      const curve = new CatmullRomCurve3(points);
      const tubeGeometry = new TubeGeometry(curve, points.length * 2, radius, 8, false);
      return new Mesh(tubeGeometry, material);
    };

    if (showGrid && graticuleAlpha > 0) {
      const graticuleMaterial = new MeshBasicMaterial({
        color: new Color("#3347e0"),
        transparent: true,
        opacity: graticuleAlpha,
      });
      const gridSpacing = 15;
      for (let lat = -90; lat <= 90; lat += gridSpacing) {
        const positions: number[] = [];
        for (let i = 0; i <= 64; i++) {
          const lng = (i / 64) * 360 - 180;
          const pos = latLngToPosition(lat, lng);
          positions.push(pos.x * globeRadius, pos.y * globeRadius, pos.z * globeRadius);
        }
        const mesh = tubeFromPositions(positions, graticuleMaterial, (gridWidth / 10) * 0.01);
        if (mesh) graticuleGroup.add(mesh);
      }
      for (let lng = -180; lng < 180; lng += gridSpacing) {
        const positions: number[] = [];
        for (let i = 0; i <= 64; i++) {
          const lat = (i / 64) * 180 - 90;
          const pos = latLngToPosition(lat, lng);
          positions.push(pos.x * globeRadius, pos.y * globeRadius, pos.z * globeRadius);
        }
        const mesh = tubeFromPositions(positions, graticuleMaterial, (gridWidth / 10) * 0.01);
        if (mesh) graticuleGroup.add(mesh);
      }
    }

    let dotInstances: InstancedMesh | null = null;
    let markerMeshes: Mesh[] = [];

    const globeGroup = new Group();
    const initialLongitudeRad = (initialLongitude * Math.PI) / 180;
    const initialLatitudeRad = (initialLatitude * Math.PI) / 180;
    globeGroup.rotation.y = initialLongitudeRad;
    globeGroup.rotation.x = initialLatitudeRad;
    scene.add(globeGroup);
    globeGroup.add(oceanMesh);
    if (showGrid && graticuleAlpha > 0) globeGroup.add(graticuleGroup);
    globeGroup.add(continentOutlineGroup);

    const updateMarkers = () => {
      markerMeshes.forEach((mesh) => globeGroup.remove(mesh));
      markerMeshes = [];
      if (markerConfig.markers && markerConfig.markers.length > 0) {
        const markerSize = 0.01 * markerRadiusMultiplier;
        const markerGeometry = new SphereGeometry(markerSize, 16, 16);
        const markerMaterial = new MeshBasicMaterial({ color: new Color(markerConfig.color) });
        markerConfig.markers.forEach((marker) => {
          if (!marker || typeof marker.lat !== "number" || typeof marker.lng !== "number") return;
          const pos = latLngToPosition(marker.lat, marker.lng);
          const markerMesh = new Mesh(markerGeometry, markerMaterial.clone());
          markerMesh.position.set(pos.x * globeRadius, pos.y * globeRadius, pos.z * globeRadius);
          globeGroup.add(markerMesh);
          markerMeshes.push(markerMesh);
        });
      }
    };

    let disposed = false;

    const loadWorldData = async () => {
      try {
        const response = await fetch(
          "https://raw.githubusercontent.com/martynafford/natural-earth-geojson/refs/heads/master/110m/physical/ne_110m_land.json",
        );
        if (!response.ok) throw new Error("Failed to load land data");
        const landFeatures = await response.json();
        if (disposed) return;

        if (showOutline && outlineAlpha > 0) {
          const outlineMaterial = new MeshBasicMaterial({
            color: new Color("#3347e0"),
            transparent: true,
            opacity: outlineAlpha,
          });
          const processRing = (ring: number[][]) => {
            if (ring.length < 2) return;
            const positions: number[] = [];
            ring.forEach((coord) => {
              const [lng, lat] = coord;
              const pos = latLngToPosition(lat!, lng!);
              positions.push(pos.x * globeRadius, pos.y * globeRadius, pos.z * globeRadius);
            });
            const mesh = tubeFromPositions(positions, outlineMaterial, (outlineWidth / 10) * 0.01);
            if (mesh) continentOutlineGroup.add(mesh);
          };
          landFeatures.features.forEach((feature: any) => {
            const geometry = feature.geometry;
            if (!geometry || !geometry.coordinates) return;
            if (geometry.type === "Polygon" && geometry.coordinates.length > 0) {
              processRing(geometry.coordinates[0]);
            } else if (geometry.type === "MultiPolygon") {
              geometry.coordinates.forEach((polygon: any) => {
                if (polygon.length > 0) processRing(polygon[0]);
              });
            }
          });
        }

        // Bitmap-based land detection for dots
        const bitmapWidth = 2048;
        const bitmapHeight = 1024;
        const offscreenCanvas = document.createElement("canvas");
        offscreenCanvas.width = bitmapWidth;
        offscreenCanvas.height = bitmapHeight;
        const ctx = offscreenCanvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) throw new Error("Canvas not supported");
        const projection = geoEquirectangular().fitSize([bitmapWidth, bitmapHeight], {
          type: "Sphere",
        } as any);
        const pathGenerator = geoPath().projection(projection).context(ctx);
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, bitmapWidth, bitmapHeight);
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        landFeatures.features.forEach((feature: any) => {
          pathGenerator(feature);
        });
        ctx.fill();
        const imageData = ctx.getImageData(0, 0, bitmapWidth, bitmapHeight);
        const pixels = imageData.data;
        const isOnLand = (lng: number, lat: number) => {
          const x = Math.round(((lng + 180) / 360) * bitmapWidth) % bitmapWidth;
          const y = Math.round(((90 - lat) / 180) * bitmapHeight);
          const clampedY = Math.max(0, Math.min(bitmapHeight - 1, y));
          const idx = (clampedY * bitmapWidth + x) * 4;
          return pixels[idx]! > 128;
        };

        const dotCoordinates: number[][] = [];
        const baseStep = dotSpacing * 0.08;
        for (let lat = -90; lat <= 90; lat += baseStep) {
          const latRad = (Math.abs(lat) * Math.PI) / 180;
          const cosLat = Math.cos(latRad);
          const lngStep = cosLat > 0.01 ? baseStep / Math.max(0.3, cosLat) : 360;
          for (let lng = -180; lng < 180; lng += lngStep) {
            if (allDots || isOnLand(lng, lat)) dotCoordinates.push([lng, lat]);
          }
        }

        if (dotCoordinates.length > 0 && !disposed) {
          const dotGeometry = new SphereGeometry(0.01 * dotSizeMultiplier, 4, 4);
          const dotMaterial = new MeshBasicMaterial({ color: new Color(dotColor) });
          dotInstances = new InstancedMesh(dotGeometry, dotMaterial, dotCoordinates.length);
          const matrix = new Matrix4();
          for (let i = 0; i < dotCoordinates.length; i++) {
            const [lng, lat] = dotCoordinates[i]!;
            const pos = latLngToPosition(lat!, lng!);
            matrix.makeScale(1, 1, 1);
            matrix.setPosition(pos.x * globeRadius, pos.y * globeRadius, pos.z * globeRadius);
            dotInstances.setMatrixAt(i, matrix);
          }
          dotInstances.instanceMatrix.needsUpdate = true;
          globeGroup.add(dotInstances);
        }

        updateMarkers();
        renderer.render(scene, camera);
        canvas.style.opacity = "1";
      } catch {
        if (!disposed) setError("Failed to load land map data");
      }
    };

    const rotation = { x: initialLongitudeRad, y: initialLatitudeRad };
    const targetRotation = { x: initialLongitudeRad, y: initialLatitudeRad };
    const velocity = { x: 0, y: 0 };
    let isDragging = false;
    let isHovering = false;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let animationFrameId: number | null = null;
    const lerpFactor = smoothingN === 0 ? 1 : mapLinear(smoothingN, 0, 1, 0.4, 0.03);
    const velocityDecay = mapLinear(smoothingN, 0, 1, 0.7, 0.96);

    const animate = () => {
      let needsRender = false;
      const threshold = 0.01;
      if (!isDragging && rotationSpeed !== 0 && (!stopOnHover || !isHovering)) {
        targetRotation.x += rotationSpeed * 0.01;
      }
      if (!isDragging && smoothingN > 0) {
        if (Math.abs(velocity.x) > threshold || Math.abs(velocity.y) > threshold) {
          targetRotation.x += velocity.x;
          targetRotation.y += velocity.y;
          targetRotation.y = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, targetRotation.y));
          velocity.x *= velocityDecay;
          velocity.y *= velocityDecay;
        } else {
          velocity.x = 0;
          velocity.y = 0;
        }
      }
      const dx = targetRotation.x - rotation.x;
      const dy = targetRotation.y - rotation.y;
      if (Math.abs(dx) > threshold || Math.abs(dy) > threshold || rotationSpeed !== 0 || isDragging) {
        rotation.x += dx * lerpFactor;
        rotation.y += dy * lerpFactor;
        rotation.y = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotation.y));
        needsRender = true;
      }
      if (needsRender || rotationSpeed !== 0 || isDragging) {
        globeGroup.rotation.y = rotation.x;
        globeGroup.rotation.x = rotation.y;
        renderer.render(scene, camera);
      }
      const hasVelocity = Math.abs(velocity.x) > threshold || Math.abs(velocity.y) > threshold;
      const hasLerpDelta = Math.abs(dx) > threshold || Math.abs(dy) > threshold;
      if (isDragging || rotationSpeed !== 0 || hasVelocity || hasLerpDelta) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        animationFrameId = null;
      }
    };

    const startAnimation = () => {
      if (animationFrameId === null) animationFrameId = requestAnimationFrame(animate);
    };
    if (rotationSpeed !== 0) startAnimation();

    const handleMouseDown = (event: MouseEvent) => {
      isDragging = true;
      velocity.x = 0;
      velocity.y = 0;
      lastMouseX = event.clientX;
      lastMouseY = event.clientY;
      startAnimation();
      const handleMouseMove = (moveEvent: MouseEvent) => {
        const sensitivity = mapDragSpeedUiToSensitivity(dragSpeed);
        const dx = moveEvent.clientX - lastMouseX;
        const dy = moveEvent.clientY - lastMouseY;
        targetRotation.x += dx * sensitivity;
        targetRotation.y += dy * sensitivity;
        targetRotation.y = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, targetRotation.y));
        velocity.x = dx * sensitivity * 0.3;
        velocity.y = dy * sensitivity * 0.3;
        lastMouseX = moveEvent.clientX;
        lastMouseY = moveEvent.clientY;
      };
      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        isDragging = false;
      };
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    };
    canvas.addEventListener("mousedown", handleMouseDown);

    const raycaster = new Raycaster();
    const mouse = new Vector2();
    const handleMouseMove = (event: MouseEvent) => {
      if (!stopOnHover) return;
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(oceanMesh);
      isHovering = intersects.length > 0;
    };
    canvas.addEventListener("mousemove", handleMouseMove);

    const resizeObserver = new ResizeObserver(() => {
      const newWidth = container.clientWidth || container.offsetWidth || 800;
      const newHeight = container.clientHeight || container.offsetHeight || 600;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
      camera.position.set(0, 0, 2.5 / scaleMultiplier);
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    });
    resizeObserver.observe(container);

    loadWorldData();

    return () => {
      disposed = true;
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      resizeObserver.disconnect();
      renderer.dispose();
      if (canvas.parentElement === container) container.removeChild(canvas);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const containerStyle: CSSProperties = {
    ...style,
    position: "relative",
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  if (error) {
    return (
      <div style={containerStyle}>
        <span style={{ fontSize: 12, opacity: 0.5 }}>{error}</span>
      </div>
    );
  }

  return <div ref={containerRef} style={containerStyle} />;
}
