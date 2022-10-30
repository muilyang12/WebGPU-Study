import { checkWebGPU, initGPU, createGPUBuffer, createPipeline, createViewProjection, createUniformBuffer, getTexture, createTransforms, createAnimation } from './helpers';
import { shaders } from './shaders';
import { getSphereData } from './vertexData';
import { mat4, vec3 } from 'gl-matrix';

let rotationRate = [0.01, 0.01, 0.01];

interface CreateObjectProps {
    radius?: number;
    target?: string;
    rate?: number;
}
const create3DObject = async ({
    radius = 2,
    target,
    rate,
}: CreateObjectProps) => {

    const gpu = checkWebGPU();
    if (!gpu) return;

    if (target != undefined && rate != undefined) {
        rotationRate[Number(target)] = rate;
    }

    const { device, canvas, format, context } = await initGPU();

    const vertexData = getSphereData({
        radius,
        u: 30,
        v: 20,
    });

    const numberOfVertices = vertexData.positions.length / 3;

    const vertexBuffer = createGPUBuffer(device, vertexData.positions);
    const normalBuffer = createGPUBuffer(device, vertexData.normals);
    const uvBuffer = createGPUBuffer(device, vertexData.uvs);

    const pipeline = createPipeline(device, shaders, format);

    const vp = createViewProjection(canvas.width / canvas.height);

    const { vertexUniformBuffer, fragmentUniformBuffer, lightUniformBuffer } = createUniformBuffer(device, vp);

    const imageName = './earth.png';
    const addressModeU = 'repeat';
    const addressModeV = 'repeat';
    const { texture, sampler } = await getTexture(device, imageName, addressModeU, addressModeV);

    const uniformBindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: vertexUniformBuffer,
                    offset: 0,
                    size: 192
                }
            },
            {
                binding: 1,
                resource: {
                    buffer: fragmentUniformBuffer,
                    offset: 0,
                    size: 32
                }
            },
            {
                binding: 2,
                resource: {
                    buffer: lightUniformBuffer,
                    offset: 0,
                    size: 36
                }
            },
            {
                binding: 3,
                resource: sampler
            },
            {
                binding: 4,
                resource: texture.createView()
            }
        ]
    });

    let textureView = context.getCurrentTexture().createView();
    const depthTexture = device.createTexture({
        size: [canvas.width, canvas.height, 1],
        format: "depth24plus",
        usage: GPUTextureUsage.RENDER_ATTACHMENT
    });
    const renderPassDescription = {
        colorAttachments: [{
            view: textureView as GPUTextureView,
            clearValue: { r: 1, g: 1, b: 0.878, a: 1 }, //background color
            loadOp: 'clear',
            storeOp: 'store'
        }],
        depthStencilAttachment: {
            view: depthTexture.createView(),
            depthLoadValue: 1.0,
            depthClearValue: 1.0,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
        }
    };

    const normalMatrix = mat4.create();
    const modelMatrix = mat4.create();

    let rotation = vec3.fromValues(0, 0, 0);

    const draw = () => {
        createTransforms(modelMatrix, [0, 0, 0], rotation);
        mat4.invert(normalMatrix, modelMatrix);
        mat4.transpose(normalMatrix, normalMatrix);

        device.queue.writeBuffer(vertexUniformBuffer, 64, modelMatrix as ArrayBuffer);
        device.queue.writeBuffer(vertexUniformBuffer, 128, normalMatrix as ArrayBuffer);

        textureView = context.getCurrentTexture().createView();
        renderPassDescription.colorAttachments[0].view = textureView;

        const commandEncoder = device.createCommandEncoder();
        const renderPass = commandEncoder.beginRenderPass(renderPassDescription as GPURenderPassDescriptor);

        renderPass.setPipeline(pipeline);
        renderPass.setVertexBuffer(0, vertexBuffer);
        renderPass.setVertexBuffer(1, normalBuffer);
        renderPass.setVertexBuffer(2, uvBuffer);
        renderPass.setBindGroup(0, uniformBindGroup);
        renderPass.draw(numberOfVertices);
        renderPass.end();

        device.queue.submit([commandEncoder.finish()]);
    };
    
    createAnimation(draw, rotation, rotationRate);
};

const radiusInput = document.querySelector('.radius') as HTMLInputElement;
radiusInput.addEventListener('blur', () => {
    const value = Number(radiusInput.value);
    if (Number.isNaN(value)) return;
    if (value < 0 || value > 10) return;

    create3DObject({ radius: value });
});

create3DObject({});
