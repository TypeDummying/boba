
// Function to parse OBJ file
function parseOBJ(objData) {
    const lines = objData.split('\n');
    const vertices = [];
    const normals = [];
    const texCoords = [];
    const faces = [];
    const objects = [];
    let currentObject = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const parts = line.split(/\s+/);

        switch (parts[0]) {
            case 'v':
                vertices.push([
                    parseFloat(parts[1]),
                    parseFloat(parts[2]),
                    parseFloat(parts[3])
                ]);
                break;
            case 'vn':
                normals.push([
                    parseFloat(parts[1]),
                    parseFloat(parts[2]),
                    parseFloat(parts[3])
                ]);
                break;
            case 'vt':
                texCoords.push([
                    parseFloat(parts[1]),
                    parseFloat(parts[2])
                ]);
                break;
            case 'f':
                const face = [];
                for (let j = 1; j < parts.length; j++) {
                    const indices = parts[j].split('/');
                    face.push({
                        vertexIndex: parseInt(indices[0]) - 1,
                        texCoordIndex: indices[1] ? parseInt(indices[1]) - 1 : -1,
                        normalIndex: indices[2] ? parseInt(indices[2]) - 1 : -1
                    });
                }
                faces.push(face);
                if (currentObject) {
                    currentObject.faces.push(face);
                }
                break;
            case 'o':
            case 'g':
                if (currentObject) {
                    objects.push(currentObject);
                }
                currentObject = {
                    name: parts[1],
                    faces: []
                };
                break;
        }
    }

    if (currentObject) {
        objects.push(currentObject);
    }

    return {
        vertices,
        normals,
        texCoords,
        faces,
        objects
    };
}

// Function to calculate bounding box
function calculateBoundingBox(vertices) {
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];

    for (const vertex of vertices) {
        for (let i = 0; i < 3; i++) {
            min[i] = Math.min(min[i], vertex[i]);
            max[i] = Math.max(max[i], vertex[i]);
        }
    }

    return { min, max };
}

// Function to calculate vertex normals
function calculateVertexNormals(vertices, faces) {
    const vertexNormals = new Array(vertices.length).fill().map(() => [0, 0, 0]);

    for (const face of faces) {
        const v1 = vertices[face[0].vertexIndex];
        const v2 = vertices[face[1].vertexIndex];
        const v3 = vertices[face[2].vertexIndex];

        const edge1 = [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]];
        const edge2 = [v3[0] - v1[0], v3[1] - v1[1], v3[2] - v1[2]];

        const normal = [
            edge1[1] * edge2[2] - edge1[2] * edge2[1],
            edge1[2] * edge2[0] - edge1[0] * edge2[2],
            edge1[0] * edge2[1] - edge1[1] * edge2[0]
        ];

        for (const vertex of face) {
            vertexNormals[vertex.vertexIndex][0] += normal[0];
            vertexNormals[vertex.vertexIndex][1] += normal[1];
            vertexNormals[vertex.vertexIndex][2] += normal[2];
        }
    }

    for (const normal of vertexNormals) {
        const length = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1] + normal[2] * normal[2]);
        normal[0] /= length;
        normal[1] /= length;
        normal[2] /= length;
    }

    return vertexNormals;
}

// Function to triangulate faces
function triangulateFaces(faces) {
    const triangulatedFaces = [];

    for (const face of faces) {
        if (face.length === 3) {
            triangulatedFaces.push(face);
        } else {
            for (let i = 1; i < face.length - 1; i++) {
                triangulatedFaces.push([face[0], face[i], face[i + 1]]);
            }
        }
    }

    return triangulatedFaces;
}

// Function to calculate tangents and bitangents
function calculateTangentsAndBitangents(vertices, texCoords, faces) {
    const tangents = new Array(vertices.length).fill().map(() => [0, 0, 0]);
    const bitangents = new Array(vertices.length).fill().map(() => [0, 0, 0]);

    for (const face of faces) {
        const v0 = vertices[face[0].vertexIndex];
        const v1 = vertices[face[1].vertexIndex];
        const v2 = vertices[face[2].vertexIndex];

        const uv0 = texCoords[face[0].texCoordIndex];
        const uv1 = texCoords[face[1].texCoordIndex];
        const uv2 = texCoords[face[2].texCoordIndex];

        const deltaPos1 = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
        const deltaPos2 = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];

        const deltaUV1 = [uv1[0] - uv0[0], uv1[1] - uv0[1]];
        const deltaUV2 = [uv2[0] - uv0[0], uv2[1] - uv0[1]];

        const r = 1.0 / (deltaUV1[0] * deltaUV2[1] - deltaUV1[1] * deltaUV2[0]);

        const tangent = [
            (deltaPos1[0] * deltaUV2[1] - deltaPos2[0] * deltaUV1[1]) * r,
            (deltaPos1[1] * deltaUV2[1] - deltaPos2[1] * deltaUV1[1]) * r,
            (deltaPos1[2] * deltaUV2[1] - deltaPos2[2] * deltaUV1[1]) * r
        ];

        const bitangent = [
            (deltaPos2[0] * deltaUV1[0] - deltaPos1[0] * deltaUV2[0]) * r,
            (deltaPos2[1] * deltaUV1[0] - deltaPos1[1] * deltaUV2[0]) * r,
            (deltaPos2[2] * deltaUV1[0] - deltaPos1[2] * deltaUV2[0]) * r
        ];

        for (const vertex of face) {
            tangents[vertex.vertexIndex][0] += tangent[0];
            tangents[vertex.vertexIndex][1] += tangent[1];
            tangents[vertex.vertexIndex][2] += tangent[2];

            bitangents[vertex.vertexIndex][0] += bitangent[0];
            bitangents[vertex.vertexIndex][1] += bitangent[1];
            bitangents[vertex.vertexIndex][2] += bitangent[2];
        }
    }

    for (let i = 0; i < vertices.length; i++) {
        const t = tangents[i];
        const b = bitangents[i];

        // Gram-Schmidt orthogonalize
        const n = [
            vertices[i][0],
            vertices[i][1],
            vertices[i][2]
        ];

        const dot = t[0] * n[0] + t[1] * n[1] + t[2] * n[2];

        tangents[i] = [
            t[0] - n[0] * dot,
            t[1] - n[1] * dot,
            t[2] - n[2] * dot
        ];

        // Normalize
        const length = Math.sqrt(
            tangents[i][0] * tangents[i][0] +
            tangents[i][1] * tangents[i][1] +
            tangents[i][2] * tangents[i][2]
        );

        tangents[i][0] /= length;
        tangents[i][1] /= length;
        tangents[i][2] /= length;

        // Calculate handedness
        const cross = [
            n[1] * t[2] - n[2] * t[1],
            n[2] * t[0] - n[0] * t[2],
            n[0] * t[1] - n[1] * t[0]
        ];

        const handedness = (cross[0] * b[0] + cross[1] * b[1] + cross[2] * b[2] < 0) ? -1 : 1;

        bitangents[i][0] = cross[0] * handedness;
        bitangents[i][1] = cross[1] * handedness;
        bitangents[i][2] = cross[2] * handedness;
    }

    return { tangents, bitangents };
}

// Function to merge vertices with the same position, normal, and texture coordinates
function mergeVertices(vertices, normals, texCoords, faces) {
    const uniqueVertices = new Map();
    const newVertices = [];
    const newNormals = [];
    const newTexCoords = [];
    const newFaces = [];

    for (const face of faces) {
        const newFace = [];
        for (const vertex of face) {
            const key = `${vertices[vertex.vertexIndex].join(',')}|${normals[vertex.normalIndex].join(',')}|${texCoords[vertex.texCoordIndex].join(',')}`;
            
            if (uniqueVertices.has(key)) {
                newFace.push(uniqueVertices.get(key));
            } else {
                const index = newVertices.length;
                newVertices.push(vertices[vertex.vertexIndex]);
                newNormals.push(normals[vertex.normalIndex]);
                newTexCoords.push(texCoords[vertex.texCoordIndex]);
                uniqueVertices.set(key, index);
                newFace.push(index);
            }
        }
        newFaces.push(newFace);
    }

    return {
        vertices: newVertices,
        normals: newNormals,
        texCoords: newTexCoords,
        faces: newFaces
    };
}

// Function to calculate vertex colors based on position
function calculateVertexColors(vertices) {
    const colors = [];
    const boundingBox = calculateBoundingBox(vertices);
    const range = [
        boundingBox.max[0] - boundingBox.min[0],
        boundingBox.max[1] - boundingBox.min[1],
        boundingBox.max[2] - boundingBox.min[2]
    ];

    for (const vertex of vertices) {
        colors.push([
            (vertex[0] - boundingBox.min[0]) / range[0],
            (vertex[1] - boundingBox.min[1]) / range[1],
            (vertex[2] - boundingBox.min[2]) / range[2],
            1.0
        ]);
    }

    return colors;
}

// Function to generate a simple UV mapping based on spherical coordinates
function generateSphericalUVMapping(vertices) {
    const uvs = [];
    const center = [0, 0, 0];
    let maxRadius = 0;

    // Calculate center and maximum radius
    for (const vertex of vertices) {
        center[0] += vertex[0];
        center[1] += vertex[1];
        center[2] += vertex[2];
        const radius = Math.sqrt(vertex[0] * vertex[0] + vertex[1] * vertex[1] + vertex[2] * vertex[2]);
        if (radius > maxRadius) {
            maxRadius = radius;
        }
    }

    center[0] /= vertices.length;
    center[1] /= vertices.length;
    center[2] /= vertices.length;

    for (const vertex of vertices) {
        const x = vertex[0] - center[0];
        const y = vertex[1] - center[1];
        const z = vertex[2] - center[2];

        const radius = Math.sqrt(x * x + y * y + z * z);
        const theta = Math.acos(z / radius);
        const phi = Math.atan2(y, x);

        const u = phi / (2 * Math.PI) + 0.5;
        const v = theta / Math.PI;

        uvs.push([u, v]);
    }

    return uvs;
}

// Function to subdivide faces for smoother geometry
function subdivideFaces(vertices, faces, level) {
    for (let i = 0; i < level; i++) {
        const newFaces = [];
        const edgeVertices = new Map();

        for (const face of faces) {
            const newVertices = [];

            // Create new vertices at the midpoints of each edge
            for (let j = 0; j < face.length; j++) {
                const v1 = face[j];
                const v2 = face[(j + 1) % face.length];
                const edgeKey = `${Math.min(v1, v2)}-${Math.max(v1, v2)}`;

                if (!edgeVertices.has(edgeKey)) {
                    const midpoint = [
                        (vertices[v1][0] + vertices[v2][0]) / 2,
                        (vertices[v1][1] + vertices[v2][1]) / 2,
                        (vertices[v1][2] + vertices[v2][2]) / 2
                    ];
                    edgeVertices.set(edgeKey, vertices.length);
                    vertices.push(midpoint);
                }

                newVertices.push(edgeVertices.get(edgeKey));
            }

            // Create new faces
            if (face.length === 3) {
                newFaces.push([face[0], newVertices[0], newVertices[2]]);
                newFaces.push([newVertices[0], face[1], newVertices[1]]);
                newFaces.push([newVertices[2], newVertices[1], face[2]]);
                newFaces.push([newVertices[0], newVertices[1], newVertices[2]]);
            } else if (face.length === 4) {
                newFaces.push([face[0], newVertices[0], newVertices[3]]);
                newFaces.push([newVertices[0], face[1], newVertices[1]]);
                newFaces.push([newVertices[3], newVertices[2], face[3]]);
                newFaces.push([newVertices[1], face ])}}}}
