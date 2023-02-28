import { checkWebGPU } from "./helper";
import { Shaders } from "./shaders";

interface Point {
  x: number;
  y: number;
}

const defaultPoints: Point[] = [
  { x: -0.75, y: 0.75 },
  { x: 0.75, y: -0.75 },
  { x: 0.75, y: 0.75 },
  { x: -0.75, y: -0.75 },
];
const points: Point[] = [];

const CreatePrimitive = async (points: Point[] = defaultPoints) => {
  const message = checkWebGPU();

  if (!navigator.gpu) {
    let header = document.querySelector("#gpu-check") as HTMLDivElement;
    header.innerHTML += message;

    return;
  }

  const canvas = document.getElementById("canvas-webgpu") as HTMLCanvasElement;
  const context = canvas.getContext("webgpu") as GPUCanvasContext;
  const adapter = (await navigator.gpu?.requestAdapter()) as GPUAdapter;
  const device = (await adapter?.requestDevice()) as GPUDevice;
  const format = "bgra8unorm";

  context.configure({
    device: device,
    format: format,
    alphaMode: "opaque",
  });

  const shaders = Shaders(points);
  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: device.createShaderModule({
        code: shaders.vertex,
      }),
      entryPoint: "main",
    },
    fragment: {
      module: device.createShaderModule({
        code: shaders.fragment,
      }),
      entryPoint: "main",
      targets: [
        {
          format: format as GPUTextureFormat,
        },
      ],
    },
    primitive: {
      topology: "line-list" as GPUPrimitiveTopology,
      stripIndexFormat: undefined,
    },
  });

  const textureView = context.getCurrentTexture().createView();
  const commandEncoder = device.createCommandEncoder();
  const renderPass = commandEncoder.beginRenderPass({
    colorAttachments: [
      {
        view: textureView as GPUTextureView,
        clearValue: { r: 1.0, g: 1.0, b: 1.0, a: 1.0 }, //background color
        loadOp: "clear",
        storeOp: "store",
      },
    ],
  });

  renderPass.setPipeline(pipeline);
  renderPass.draw(points.length);
  renderPass.end();

  device.queue.submit([commandEncoder.finish()]);
};

CreatePrimitive();

const canvas = document.querySelector("#canvas-webgpu") as HTMLCanvasElement;
canvas.addEventListener("click", (e) => {
  const xCoordinate = (e.offsetX - canvas.width * 0.5) / (canvas.width * 0.5);
  const yCoordinate =
    (-e.offsetY + canvas.height * 0.5) / (canvas.height * 0.5);

  points.push({ x: xCoordinate, y: yCoordinate });
  CreatePrimitive(points);
});
