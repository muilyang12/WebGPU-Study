import { initGPU, createGPUBuffer, createTransforms, createViewProjection } from './helper';
import { shaders } from './shaders';
import { vetexData } from './vetexData';
import { mat4 } from 'gl-matrix';

const create3DObject = async () => {
    const gpu = await initGPU();
    if (!gpu) {
        return;
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
            cullMode: 'back'
        },
        depthStencil:{
            format: "depth24plus",
            depthWriteEnabled: true,
            depthCompare: "less"
        }
    });

    const { viewProjectionMatrix: vpMatrix } = createViewProjection(canvas.width / canvas.height);
    const modelMatrix = mat4.create();
    createTransforms(modelMatrix);
    
    const mvpMatrix = mat4.create();
    mat4.multiply(mvpMatrix, vpMatrix, modelMatrix);

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

    const textureView = context.getCurrentTexture().createView();
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

    device.queue.writeBuffer(uniformBuffer, 0, mvpMatrix as ArrayBuffer);

    const commandEncoder = device.createCommandEncoder();
    const renderPass = commandEncoder.beginRenderPass(renderPassDescription as GPURenderPassDescriptor);
    renderPass.setPipeline(pipeline);
    renderPass.setVertexBuffer(0, vertexBuffer);
    renderPass.setVertexBuffer(1, colorBuffer);
    renderPass.setBindGroup(0, uniformBindGroup);
    renderPass.draw(numberOfVertices);
    renderPass.end();

    device.queue.submit([commandEncoder.finish()]);
}

create3DObject();

window.addEventListener('resize', function(){
    create3DObject();
});