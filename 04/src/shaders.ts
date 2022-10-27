export interface Shaders {
    vertexShader: string;
    fragmentShader: string;
}

export const shaders = {
    vertexShader: `
        struct Uniforms {
            viewProjectionMatrix : mat4x4<f32>,
            modelMatrix : mat4x4<f32>,      
            normalMatrix : mat4x4<f32>,            
        };
        @binding(0) @group(0) var<uniform> uniforms : Uniforms;

        struct Input {
            @location(0) position : vec4<f32>,
            @location(1) normal : vec4<f32>,
            @location(2) uv : vec2<f32>,
        };

        struct Output {
            @builtin(position) Position : vec4<f32>,
            @location(0) vPosition : vec4<f32>,
            @location(1) vNormal : vec4<f32>,
            @location(2) vUV : vec2<f32>,
        };

        @vertex
        fn vs_main(input: Input) -> Output {        
            var output: Output;        
            let mPosition: vec4<f32> = uniforms.modelMatrix * input.position; 
            output.vPosition = mPosition;                  
            output.vNormal =  uniforms.normalMatrix*input.normal;
            output.Position = uniforms.viewProjectionMatrix * mPosition;     
            output.vUV = input.uv;          
            return output;
        }
    `,

    fragmentShader: `
        struct Uniforms {
            lightPosition : vec4<f32>, 
            eyePosition : vec4<f32>,
        };
        @binding(1) @group(0) var<uniform> uniforms : Uniforms;
        @binding(2) @group(0) var textureSampler : sampler;
        @binding(3) @group(0) var textureData : texture_2d<f32>;
        
        struct Input {
            @location(0) vPosition : vec4<f32>,
            @location(1) vNormal : vec4<f32>,
            @location(2) vUV : vec2<f32>,
        };
        
        @fragment
        fn fs_main(input: Input) -> @location(0) vec4<f32> {
            let textureColor: vec3<f32> = (textureSample(textureData, textureSampler, input.vUV)).rgb;
            let N: vec3<f32> = normalize(input.vNormal.xyz);                
            let L: vec3<f32> = normalize(uniforms.lightPosition.xyz - input.vPosition.xyz);     
            let V: vec3<f32> = normalize(uniforms.eyePosition.xyz - input.vPosition.xyz);          
            let H: vec3<f32> = normalize(L + V);
            let twoSide: i32 = 1;
            var diffuse: f32 = 0.8 * max(dot(N, L), 0.0);
            if (twoSide == 1){
                diffuse = diffuse + 0.8 * max(dot(-N, L), 0.0);
            } 
            var specular: f32;
            var isp: i32 = 1;
            if (isp == 1){                   
                specular = 0.4 * pow(max(dot(V, reflect(-L, N)),0.0), 30.0);
                if(twoSide == 1) {
                    specular = specular + 0.4 * pow(max(dot(V, reflect(-L, -N)),0.0), 30.0);
                }
            } else {
                specular = 0.4 * pow(max(dot(N, H),0.0), 30.0);
                if(twoSide == 1){                     
                    specular = specular + 0.4 * pow(max(dot(-N, H),0.0), 30.0);
                }
            }               
            let ambient: f32 = 0.2;               
            let finalColor: vec3<f32> = textureColor * (ambient + diffuse) + vec3<f32>(1.0, 1.0, 1.0) * specular; 
            return vec4<f32>(finalColor, 1.0);
        }
    `
}
