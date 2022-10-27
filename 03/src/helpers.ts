import { vec3, mat4 } from 'gl-matrix';
import { Shaders } from './shaders';

export const checkWebGPU = () => {
    const gpu = navigator.gpu;
    
    if (!gpu) {
        const header = document.querySelector('#gpu-check') as HTMLDivElement;
        header.innerHTML += 'It\'s sad, your current browser doesn\'t support WebGPU.';

        return;
    }

    return gpu;
};

export const initGPU = async () => {
    const canvas = document.getElementById('canvas-webgpu') as HTMLCanvasElement;
    const context = canvas.getContext('webgpu') as GPUCanvasContext;
    const adapter = await navigator.gpu.requestAdapter() as GPUAdapter;
    const device = await adapter.requestDevice() as GPUDevice;
    const format = navigator.gpu.getPreferredCanvasFormat();

    context.configure({
        device: device,
        format: format,
        alphaMode: 'opaque'
    });

    return { device, canvas, format, context };
};

export const createGPUBuffer = (
    device: GPUDevice, 
    data: Float32Array, 
    usageFlag: GPUBufferUsageFlags = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
) => {
    const buffer = device.createBuffer({
        size: data.byteLength,
        usage: usageFlag,
        mappedAtCreation: true
    });
    new Float32Array(buffer.getMappedRange()).set(data);
    buffer.unmap();

    return buffer;
};

export const createPipeline = (
    device: GPUDevice, 
    shaders: Shaders,
    format: GPUTextureFormat
) => {
    return device.createRenderPipeline({
        layout:'auto',
        vertex: {
            module: device.createShaderModule({
                code: shaders.vertexShader
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
                },
                {
                    arrayStride: 8,
                    attributes: [{
                        shaderLocation: 2,
                        format: "float32x2",
                        offset: 0
                    }]
                }
            ]
        },
        fragment: {
            module: device.createShaderModule({                    
                code: shaders.fragmentShader
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
}

export const createViewProjection = (
    respectRatio = 1.0, 
    cameraPosition: vec3 = [2, 2, 4], 
    lookDirection: vec3 = [0, 0, 0], 
    upDirection: vec3 = [0, 1, 0]
) => {

    const viewMatrix = mat4.create();
    const projectionMatrix = mat4.create();       
    const viewProjectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, 2*Math.PI/5, respectRatio, 0.1, 100.0);

    mat4.lookAt(viewMatrix, cameraPosition, lookDirection, upDirection);
    mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);

    const cameraOption = {
        eye: cameraPosition,
        center: lookDirection,
        zoomMax: 100,
        zoomSpeed: 2
    };

    return {
        viewMatrix,
        projectionMatrix,
        viewProjectionMatrix,
        cameraOption
    }
};

type VP = ReturnType<typeof createViewProjection>
export const createUniformBuffer = (device: GPUDevice, vp: VP) => {
    const eyePosition = new Float32Array(vp.cameraOption.eye);
    const lightPosition = eyePosition;

    const vertexUniformBuffer = device.createBuffer({
        size: 192,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    const fragmentUniformBuffer = device.createBuffer({
        size: 32,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    device.queue.writeBuffer(vertexUniformBuffer, 0, vp.viewProjectionMatrix as ArrayBuffer);
    device.queue.writeBuffer(fragmentUniformBuffer, 0, lightPosition);
    device.queue.writeBuffer(fragmentUniformBuffer, 16, eyePosition);

    return { vertexUniformBuffer, fragmentUniformBuffer };
};

export const createTransforms = (
    modelMat: mat4, 
    translation: vec3 = [0, 0, 0], 
    rotation: vec3 = [0, 0, 0], 
    scaling: vec3 = [1, 1, 1]
) => {
    const translateMat = mat4.create();
    const rotateXMat = mat4.create();
    const rotateYMat = mat4.create();
    const rotateZMat = mat4.create();   
    const scaleMat = mat4.create();

    mat4.fromTranslation(translateMat, translation);

    mat4.fromXRotation(rotateXMat, rotation[0]);
    mat4.fromYRotation(rotateYMat, rotation[1]);
    mat4.fromZRotation(rotateZMat, rotation[2]);

    mat4.fromScaling(scaleMat, scaling);

    mat4.multiply(modelMat, rotateXMat, scaleMat);
    mat4.multiply(modelMat, rotateYMat, modelMat);        
    mat4.multiply(modelMat, rotateZMat, modelMat);
    mat4.multiply(modelMat, translateMat, modelMat);
};

export const getTexture = async (
    device: GPUDevice, 
    imageName: string,
    addressModeU = 'repeat',
    addressModeV = 'repeat'
) => {
    const img = document.createElement('img');
    img.src = imageName;
    await img.decode();
    const imageBitmap = await createImageBitmap(img);

    const sampler = device.createSampler({
        minFilter: 'linear',
        magFilter: 'linear',
        addressModeU: addressModeU as GPUAddressMode,
        addressModeV: addressModeV as GPUAddressMode
    });

    const texture = device.createTexture({
        size: [imageBitmap.width, imageBitmap.height, 1],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | 
               GPUTextureUsage.COPY_DST | 
               GPUTextureUsage.RENDER_ATTACHMENT
    });

    device.queue.copyExternalImageToTexture(
        { source: imageBitmap },
        { texture: texture },
        [imageBitmap.width, imageBitmap.height]
    );

    return {
        sampler,
        texture,
    }
};

export const createGPUBufferUint = (
    device: GPUDevice, 
    data: Uint32Array, 
    usageFlag: GPUBufferUsageFlags = GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
) => {
    const buffer = device.createBuffer({
        size: data.byteLength,
        usage: usageFlag,
        mappedAtCreation: true
    });

    new Uint32Array(buffer.getMappedRange()).set(data);
    buffer.unmap();

    return buffer;
};

let _animationFrame: ReturnType<typeof requestAnimationFrame>;
export const createAnimation = (
    draw: () => void,
    rotation: vec3 = vec3.fromValues(0, 0, 0),
    rotationRate: number[]
) => {
    function step() {
        rotation[0] += rotationRate[0];
        rotation[1] += rotationRate[1];
        rotation[2] += rotationRate[2];

        draw();

        _animationFrame = requestAnimationFrame(step);
    }

    if (_animationFrame) {
        cancelAnimationFrame(_animationFrame);
    }
    _animationFrame = requestAnimationFrame(step);

    return _animationFrame;
};