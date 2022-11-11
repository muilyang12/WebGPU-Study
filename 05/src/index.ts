import {
  checkWebGPU,
  initGPU,
  createGPUBuffer,
  createPipeline,
  createViewProjection,
  createTransforms,
  createAnimation,
} from "./helpers";
import { shaders } from "./shaders";
import { vertexData } from "./vertexData";
import { mat4, vec3 } from "gl-matrix";

let rotationRate = [0.01, 0.01, 0.01];
const create3DObject = async (target?: string, rate?: number) => {
  const gpu = checkWebGPU();
  if (!gpu) return;

  if (target != undefined && rate != undefined) {
    rotationRate[Number(target)] = rate;
  }

  const { device, canvas, format, context } = await initGPU();

  const numberOfVertices = vertexData.positions.length / 3;

  const vertexBuffer = createGPUBuffer(device, vertexData.positions);
  const colorBuffer = createGPUBuffer(device, vertexData.colors);

  const nx = 5;
  const ny = 5;
  const nz = 5;
  const numInstances = nx * ny * nz;

  const pipeline = createPipeline(device, shaders(numInstances), format);

  const vp = createViewProjection(canvas.width / canvas.height);

  const uniformBuffer = device.createBuffer({
    size: 4 * 4 * 4 * numInstances,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const uniformBindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer,
        },
      },
    ],
  });

  const vpMatrix = vp.viewProjectionMatrix;
  const modelMatrices = new Array(numInstances);
  const mvpMatrices = new Float32Array(4 * 4 * numInstances);

  let index = 0;
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < ny; j++) {
      for (let k = 0; k < nz; k++) {
        modelMatrices[index] = mat4.create();
        mat4.translate(
          modelMatrices[index],
          modelMatrices[index],
          vec3.fromValues(2 * (i - nx / 2) + 1, 2 * (j - ny / 2) + 1, -2 * k)
        );

        index += 1;
      }
    }
  }

  let textureView = context.getCurrentTexture().createView();
  const depthTexture = device.createTexture({
    size: [canvas.width, canvas.height, 1],
    format: "depth24plus",
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });
  const renderPassDescription = {
    colorAttachments: [
      {
        view: textureView as GPUTextureView,
        clearValue: { r: 1, g: 1, b: 0.878, a: 1 }, //background color
        loadOp: "clear",
        storeOp: "store",
      },
    ],
    depthStencilAttachment: {
      view: depthTexture.createView(),
      depthClearValue: 1.0,
      depthLoadOp: "clear",
      depthStoreOp: "store",
    },
  };

  let rotation = vec3.fromValues(0, 0, 0);

  const tempMatrix = mat4.create();
  let rad = 0;
  const draw = () => {
    let index = 0;
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < ny; j++) {
        for (let k = 0; k < nz; k++) {
          mat4.translate(
            modelMatrices[index],
            modelMatrices[index],
            vec3.fromValues(
              0,
              0,
              0.02 * Math.sign(Math.sin((rad / 100) * (i / 10 + 1) * Math.PI))
            )
          );
          // mat4.rotate(
          //   modelMatrices[index],
          //   modelMatrices[index],
          //   0.03 * (0.05 * i) + 0.01,
          //   vec3.fromValues(0, 1, 0)
          // );

          mat4.multiply(tempMatrix, vpMatrix, modelMatrices[index]);

          mvpMatrices.set(tempMatrix, 16 * index);

          index += 1;
        }
      }

      rad += 0.5;
    }

    device.queue.writeBuffer(
      uniformBuffer,
      0,
      mvpMatrices.buffer,
      mvpMatrices.byteOffset,
      mvpMatrices.byteLength
    );

    textureView = context.getCurrentTexture().createView();
    renderPassDescription.colorAttachments[0].view = textureView;

    const commandEncoder = device.createCommandEncoder();
    const renderPass = commandEncoder.beginRenderPass(
      renderPassDescription as GPURenderPassDescriptor
    );

    renderPass.setPipeline(pipeline);
    renderPass.setVertexBuffer(0, vertexBuffer);
    renderPass.setVertexBuffer(1, colorBuffer);
    renderPass.setBindGroup(0, uniformBindGroup);
    renderPass.draw(numberOfVertices, numInstances, 0, 0);
    renderPass.end();

    device.queue.submit([commandEncoder.finish()]);
  };

  createAnimation(draw, rotation, rotationRate);
};

create3DObject();
