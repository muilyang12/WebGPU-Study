# WebGPU Study

- This repository is a collection of examples that render certain content on the canvas element using WebGPU.
- The latest version of Chrome (starting from version 113) supports WebGPU, so the execution of the following link is possible. (For older versions, an update is required.)

## Technologies Used

- TypeScript
- WebGPU
- Webpack for bundling, transpiling TypeScript to JavaScript.
- gl-matrix for matrix calcualtion
- HTML/CSS

## Examples

1. **Straight Line Drawing**

- A simple example demonstrating how to draw straight lines on a canvas.
- [View Example](https://muilyang12.github.io/WebGPU-Study/01/dist/)

  <details>
    <summary>Image</summary>
    <img src="https://github.com/muilyang12/WebGPUStudy/assets/78548830/a871d8ca-34e6-4538-96e0-921da5e066b1" alt="Straight Line Drawing" width=500 />
  </details>

2. **Rotating Cube**

- A 3D cube that rotates continuously, showcasing basic 3D transformations.
- [View Example](https://muilyang12.github.io/WebGPU-Study/02/dist/)

  <details>
    <summary>Image</summary>
    <img src="https://github.com/muilyang12/WebGPUStudy/assets/78548830/6ce8ad76-3de5-4524-a002-eb599d1cc073" alt="Rotating Cube" width=500 />
  </details>

3. **Textured Rotating Cube**

- A rotating cube with a texture mapped onto its surface, illustrating texture mapping techniques in WebGPU.
- [View Example](https://muilyang12.github.io/WebGPU-Study/03/dist/)

    <details>
      <summary>Image</summary>
      <img src="https://github.com/muilyang12/WebGPUStudy/assets/78548830/326c9690-e68f-4a94-93cb-6d0b986cd056" alt="Textured Rotating Cube" width=500 />
    </details>

4. **Earth with Rotating Light**

- A 3D model of Earth with a rotating light source, simulating lighting effects on the surface.
- [View Example](https://muilyang12.github.io/WebGPU-Study/04/dist/)

  <details>
    <summary>Image</summary>
    <img src="https://github.com/muilyang12/WebGPUStudy/assets/78548830/f55715cf-0321-4fb5-9c8c-42c2a013bfd5" alt="Earth with Rotating Light" width=500 />
  </details>

5. **Instanced Moving Cubes**

- An example with 25 cubes rendered using instancing, each moving dynamically to demonstrate efficient rendering of repeated elements.
- [View Example](https://muilyang12.github.io/WebGPU-Study/05/dist/)

    <details>
      <summary>Image</summary>
      <img src="https://github.com/muilyang12/WebGPUStudy/assets/78548830/f991ffaf-578d-442b-b865-d99ee7a4a50c" alt="Instanced Moving Cubes" width=500 />
    </details>
