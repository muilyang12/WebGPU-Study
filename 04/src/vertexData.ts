import { vec3 } from 'gl-matrix';

export const vertexData = {
    positions: new Float32Array([
        // front
        -1, -1,  1,  
         1, -1,  1,  
         1,  1,  1,
         1,  1,  1,
        -1,  1,  1,
        -1, -1,  1,

        // right
         1, -1,  1,
         1, -1, -1,
         1,  1, -1,
         1,  1, -1,
         1,  1,  1,
         1, -1,  1,

        // back
        -1, -1, -1,
        -1,  1, -1,
         1,  1, -1,
         1,  1, -1,
         1, -1, -1,
        -1, -1, -1,

        // left
        -1, -1,  1,
        -1,  1,  1,
        -1,  1, -1,
        -1,  1, -1,
        -1, -1, -1,
        -1, -1,  1,

        // top
        -1,  1,  1,
         1,  1,  1,
         1,  1, -1,
         1,  1, -1,
        -1,  1, -1,
        -1,  1,  1,

        // bottom
        -1, -1,  1,
        -1, -1, -1,
         1, -1, -1,
         1, -1, -1,
         1, -1,  1,
        -1, -1,  1
    ]),

    normals: new Float32Array([
        // front
        0, 0, 1, 0, 0, 1, 
        0, 0, 1, 0, 0, 1, 
        0, 0, 1, 0, 0, 1,

        // right
        1, 0, 0, 1, 0, 0, 
        1, 0, 0, 1, 0, 0, 
        1, 0, 0, 1, 0, 0,

        // back           
        0, 0, -1, 0, 0, -1,
        0, 0, -1, 0, 0, -1,
        0, 0, -1, 0, 0, -1,

        // left
        -1, 0, 0, -1, 0, 0, 
        -1, 0, 0, -1, 0, 0, 
        -1, 0, 0, -1, 0, 0,

        // top
        0, 1, 0, 0, 1, 0, 
        0, 1, 0, 0, 1, 0, 
        0, 1, 0, 0, 1, 0,

        // bottom
        0, -1, 0, 0, -1, 0, 
        0, -1, 0, 0, -1, 0, 
        0, -1, 0, 0, -1, 0
    ]),

    uvs: new Float32Array([
        //front
        0, 0, 1, 0, 
        1, 1, 1, 1,
        0, 1, 0, 0,

        //right
        0, 0, 1, 0, 
        1, 1, 1, 1, 
        0, 1, 0, 0,

        //back
        0, 0, 1, 0, 
        1, 1, 1, 1, 
        0, 1, 0, 0,

        //left
        0, 0, 1, 0, 
        1, 1, 1, 1, 
        0, 1, 0, 0,

        //top
        0, 0, 1, 0, 
        1, 1, 1, 1, 
        0, 1, 0, 0,

        //bottom
        0, 0, 1, 0, 
        1, 1, 1, 1, 
        0, 1, 0, 0,
    ])
};

interface SphereDataProps {
    radius: number;
    u: number;
    v: number;
    ul?: number;
    vl?: number;
}
export const getSphereData = ({
    radius = 2,
    u = 20,
    v = 15,
    ul = 1, 
    vl = 1
}: SphereDataProps) => {
    if (u < 2 || v < 2) return;

    let points: vec3[][] = [];

    let point: vec3;
    for (let i = 0; i < u; i++) {
        let tempPoints: vec3[] = [];

        for (let j = 0; j < v; j++) {
            point = getSphereCoordinate({ radius, theta: i * 180 / (u - 1), phi: j * 360 / (v - 1) });
            tempPoints = [...tempPoints, point]
        }

        points = [...points, tempPoints]
    }

    let positions: number[] = [];
    let normals: number[] = [];
    let uvs: number[] = [];

    for (let i = 0; i < u - 1; i++) {
        for (let j = 0; j < v - 1; j++) {
            let p0: vec3 = points[i][j];
            let p1: vec3 = points[i + 1][j];
            let p2: vec3 = points[i + 1][j + 1];
            let p3: vec3 = points[i][j + 1];

            positions = [
                ...positions, 
                ...p0, ...p1, ...p3, 
                ...p1, ...p2, ...p3,
            ];

            normals = [
                ...normals,

                p0[0] / radius, p0[1] / radius, p0[2] / radius,
                p1[0] / radius, p1[1] / radius, p1[2] / radius, 
                p3[0] / radius, p3[1] / radius, p3[2] / radius, 

                p1[0] / radius, p1[1] / radius, p1[2] / radius,  
                p2[0] / radius, p2[1] / radius, p2[2] / radius, 
                p3[0] / radius, p3[1] / radius, p3[2] / radius,
            ];

            let u0 = ul * (0.5 + Math.atan2(p0[0] / radius,p0[2] / radius) / Math.PI / 2);
            let u1 = ul * (0.5 + Math.atan2(p1[0] / radius,p1[2] / radius) / Math.PI / 2);
            let u2 = ul * (0.5 + Math.atan2(p2[0] / radius,p2[2] / radius) / Math.PI / 2);
            let u3 = ul * (0.5 + Math.atan2(p3[0] / radius,p3[2] / radius) / Math.PI / 2);
            let v0 = vl * (0.5 + Math.asin(p0[1] / radius) / Math.PI);
            let v1 = vl * (0.5 + Math.asin(p1[1] / radius) / Math.PI);
            let v2 = vl * (0.5 + Math.asin(p2[1] / radius) / Math.PI);
            let v3 = vl * (0.5 + Math.asin(p3[1] / radius) / Math.PI);

            uvs = [
                ...uvs,

                u0, v0, u1, v1, u3, v3,

                u1, v1, u2, v2, u3, v3
            ];
        }
    }

    return {
        positions: new Float32Array(positions),
        normals: new Float32Array(normals),
        uvs: new Float32Array(uvs),
    }
};

interface SphereCoordinateProps {
    radius: number;
    theta: number
    phi: number;
}
const getSphereCoordinate = ({
    radius, theta, phi
}: SphereCoordinateProps) => {
    let snt = Math.sin(theta * Math.PI / 180);
    let cnt = Math.cos(theta * Math.PI / 180);

    let snp = Math.sin(phi * Math.PI / 180);
    let cnp = Math.cos(phi * Math.PI / 180);

    return vec3.fromValues(
        radius * snt * cnp,
        radius * cnt,
        -radius * snt * snp
    );
};