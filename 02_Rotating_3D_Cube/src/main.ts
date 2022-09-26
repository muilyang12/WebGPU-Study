import { initGPU, createGPUBuffer, createTransforms, createViewProjection, createAnimation } from './helper';
import { shaders } from './shaders';
import { vetexData } from './vetexData';
import { mat4, vec3 } from 'gl-matrix';

let rotationRate = [0.01, 0.01, 0.01];
const create3DObject = async (
    target?: string,
    rate?: number
) => {
    const gpu = await initGPU();
    if (!gpu) {
        return;
    }

    if (!!target && rate !== undefined) {
        rotationRate[Number(target)] = rate;
    }

    const { device, canvas, format, context } = gpu;

    const numberOfVertices = vetexData.positions.length / 3;

    const vertexBuffer = createGPUBuffer(device, vetexData.positions);
    const colorBuffer = createGPUBuffer(device, vetexData.colors);
 
    const { vertexShader, fragmentShader } = shaders();
    const pipeline = device.createRenderPipeline({
        layout:'auto',
        vertex: {
            module: device.createShaderModule({                    
                code: vertexShader
            }),
            entryPoint: "vs_main",
            buffers:[
                {
                    arrayStride: 12,
                    attributes: [{
                        shaderLocation: 0,
                        format: "float32x3",
                        offset: 0
                    }]
                },
                {
                    arrayStride: 12,
                    attributes: [{
                        shaderLocation: 1,
                        format: "float32x3",
                        offset: 0
                    }]
                }
            ]
        },
        fragment: {
            module: device.createShaderModule({                    
                code: fragmentShader
            }),
            entryPoint: "fs_main",
            targets: [
                {
                    format: format as GPUTextureFormat
                }
            ]
        },
        primitive:{
            topology: "triangle-list",
        },
        depthStencil:{
            format: "depth24plus",
            depthWriteEnabled: true,
            depthCompare: "less"
        }
    });

    const vp = createViewProjection(canvas.width / canvas.height);

    const mvpMatrix = mat4.create();
    const modelMatrix = mat4.create();
    const vpMatrix = vp.viewProjectionMatrix;

    let rotation = vec3.fromValues(0, 0, 0);

    const uniformBuffer = device.createBuffer({
        size: 64,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    const uniformBindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: uniformBuffer,
                    offset: 0,
                    size: 64
                }
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
            depthStoreOp: "store",
        }
    };

    const draw = () => {
        createTransforms(modelMatrix, [0, 0, 0], rotation);
        mat4.multiply(mvpMatrix, vpMatrix, modelMatrix);

        device.queue.writeBuffer(uniformBuffer, 0, mvpMatrix as ArrayBuffer);

        textureView = gpu.context.getCurrentTexture().createView();
        renderPassDescription.colorAttachments[0].view = textureView;

        const commandEncoder = device.createCommandEncoder();
        const renderPass = commandEncoder.beginRenderPass(renderPassDescription as GPURenderPassDescriptor);

        renderPass.setPipeline(pipeline);
        renderPass.setVertexBuffer(0, vertexBuffer);
        renderPass.setVertexBuffer(1, colorBuffer);
        renderPass.setBindGroup(0, uniformBindGroup);
        renderPass.draw(numberOfVertices);
        renderPass.end();

        device.queue.submit([commandEncoder.finish()]);
    };
    
    createAnimation(draw, rotation, rotationRate);
}

const progresses = Array.from(document.querySelectorAll('progress')) as HTMLProgressElement[];
progresses.map((progress: HTMLProgressElement) => {
    progress.addEventListener('click', (e: MouseEvent) => {
        const value = (e.clientX - progress.offsetLeft) / progress.clientWidth * 100;
        progress.value = value;

        const rate = (value - 50) / 50 * 0.1;
        create3DObject(progress.dataset.target, rate);

        const input = document.querySelector(`input[data-target="${progress.dataset.target}"]`) as HTMLProgressElement;
        input.value = (value + 100) / 2;
    });
});

const inputs = Array.from(document.querySelectorAll('.rotate_rate')) as HTMLInputElement[];
inputs.map((input: HTMLInputElement) => {
    input.addEventListener('blur', () => {
        const value = Number(input.value);
        if (isNaN(value)) {
            return;
        }

        if (value < -100 || value > 100) {
            return;
        }

        const rate = value / 100 * 0.1;
        create3DObject(input.dataset.target, rate);

        const progress = document.querySelector(`progress[data-target="${input.dataset.target}"]`) as HTMLProgressElement;
        progress.value = value / 2 + 50;
    });
});

create3DObject();
