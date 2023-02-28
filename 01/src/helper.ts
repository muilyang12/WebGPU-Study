export const checkWebGPU = () => {
  let result = !!navigator.gpu
    ? "Great, your current browser supports WebGPU."
    : "It's sad, your current browser doesn't support WebGPU.";

  return result;
};
