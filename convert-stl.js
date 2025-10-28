const fs = require('fs');
const path = require('path');
const THREE = require('three');

// STL Loader
class STLLoader {
  load(url, onLoad, onProgress, onError) {
    const loader = new THREE.FileLoader();
    loader.setResponseType('arraybuffer');
    
    loader.load(url, (data) => {
      try {
        const geometry = this.parse(data);
        onLoad(geometry);
      } catch (e) {
        if (onError) onError(e);
      }
    }, onProgress, onError);
  }

  parse(data) {
    const isBinary = (data) => {
      const reader = new DataView(data);
      const numFaces = reader.getUint32(80, true);
      const expectedLength = 80 + 4 + numFaces * 50;
      return data.byteLength === expectedLength;
    };

    return isBinary(data) ? this.parseBinary(data) : this.parseASCII(this.ensureString(data));
  }

  parseBinary(data) {
    const reader = new DataView(data);
    const faces = reader.getUint32(80, true);
    const geometry = new THREE.BufferGeometry();
    
    const vertices = [];
    const normals = [];
    
    for (let i = 0; i < faces; i++) {
      const offset = 84 + i * 50;
      
      // Normal
      const nx = reader.getFloat32(offset, true);
      const ny = reader.getFloat32(offset + 4, true);
      const nz = reader.getFloat32(offset + 8, true);
      
      // Vertices
      for (let j = 0; j < 3; j++) {
        const vOffset = offset + 12 + j * 12;
        vertices.push(
          reader.getFloat32(vOffset, true),
          reader.getFloat32(vOffset + 4, true),
          reader.getFloat32(vOffset + 8, true)
        );
        normals.push(nx, ny, nz);
      }
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    
    return geometry;
  }

  parseASCII(data) {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const normals = [];
    
    const patternFace = /facet\s+normal\s+([-+]?\d+\.?\d*([eE][-+]?\d+)?)\s+([-+]?\d+\.?\d*([eE][-+]?\d+)?)\s+([-+]?\d+\.?\d*([eE][-+]?\d+)?)\s+outer\s+loop\s+vertex\s+([-+]?\d+\.?\d*([eE][-+]?\d+)?)\s+([-+]?\d+\.?\d*([eE][-+]?\d+)?)\s+([-+]?\d+\.?\d*([eE][-+]?\d+)?)\s+vertex\s+([-+]?\d+\.?\d*([eE][-+]?\d+)?)\s+([-+]?\d+\.?\d*([eE][-+]?\d+)?)\s+([-+]?\d+\.?\d*([eE][-+]?\d+)?)\s+vertex\s+([-+]?\d+\.?\d*([eE][-+]?\d+)?)\s+([-+]?\d+\.?\d*([eE][-+]?\d+)?)\s+([-+]?\d+\.?\d*([eE][-+]?\d+)?)\s+endloop\s+endfacet/g;
    
    let result;
    while ((result = patternFace.exec(data)) !== null) {
      const nx = parseFloat(result[1]);
      const ny = parseFloat(result[3]);
      const nz = parseFloat(result[5]);
      
      for (let i = 0; i < 3; i++) {
        const baseIndex = 7 + i * 6;
        vertices.push(
          parseFloat(result[baseIndex]),
          parseFloat(result[baseIndex + 2]),
          parseFloat(result[baseIndex + 4])
        );
        normals.push(nx, ny, nz);
      }
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    
    return geometry;
  }

  ensureString(buffer) {
    if (typeof buffer !== 'string') {
      return new TextDecoder().decode(buffer);
    }
    return buffer;
  }
}

// GLB Exporter
class GLTFExporter {
  parse(input, onDone, options = {}) {
    const gltf = {
      asset: {
        version: '2.0',
        generator: 'STL to GLB Converter'
      },
      scene: 0,
      scenes: [{ nodes: [0] }],
      nodes: [{ mesh: 0 }],
      meshes: [],
      buffers: [],
      bufferViews: [],
      accessors: [],
      materials: [
        {
          pbrMetallicRoughness: {
            baseColorFactor: [0.98, 0.96, 0.93, 1.0], // Ivory/tooth white color
            metallicFactor: 0.05,
            roughnessFactor: 0.4
          },
          emissiveFactor: [0.05, 0.05, 0.05],
          name: 'ToothMaterial',
          doubleSided: false,
          alphaMode: 'OPAQUE'
        }
      ]
    };

    const mesh = input;
    const geometry = mesh.geometry;
    
    const position = geometry.getAttribute('position');
    const normal = geometry.getAttribute('normal');
    
    const positionArray = position.array;
    const normalArray = normal.array;
    
    // Create buffer
    const bufferData = new ArrayBuffer(positionArray.byteLength + normalArray.byteLength);
    const bufferView = new DataView(bufferData);
    
    // Copy position data
    new Float32Array(bufferData, 0, positionArray.length).set(positionArray);
    // Copy normal data
    new Float32Array(bufferData, positionArray.byteLength, normalArray.length).set(normalArray);
    
    // Calculate bounds
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    
    for (let i = 0; i < positionArray.length; i += 3) {
      minX = Math.min(minX, positionArray[i]);
      minY = Math.min(minY, positionArray[i + 1]);
      minZ = Math.min(minZ, positionArray[i + 2]);
      maxX = Math.max(maxX, positionArray[i]);
      maxY = Math.max(maxY, positionArray[i + 1]);
      maxZ = Math.max(maxZ, positionArray[i + 2]);
    }
    
    // Add accessors
    gltf.accessors = [
      {
        bufferView: 0,
        componentType: 5126, // FLOAT
        count: position.count,
        type: 'VEC3',
        min: [minX, minY, minZ],
        max: [maxX, maxY, maxZ]
      },
      {
        bufferView: 1,
        componentType: 5126, // FLOAT
        count: normal.count,
        type: 'VEC3'
      }
    ];
    
    // Add buffer views
    gltf.bufferViews = [
      {
        buffer: 0,
        byteOffset: 0,
        byteLength: positionArray.byteLength,
        target: 34962 // ARRAY_BUFFER
      },
      {
        buffer: 0,
        byteOffset: positionArray.byteLength,
        byteLength: normalArray.byteLength,
        target: 34962 // ARRAY_BUFFER
      }
    ];
    
    // Add buffer
    gltf.buffers = [{
      byteLength: bufferData.byteLength
    }];
    
    // Add mesh
    gltf.meshes = [{
      primitives: [{
        attributes: {
          POSITION: 0,
          NORMAL: 1
        },
        material: 0
      }]
    }];
    
    // Create GLB
    const jsonString = JSON.stringify(gltf);
    const jsonBuffer = new TextEncoder().encode(jsonString);
    const jsonPadding = (4 - (jsonBuffer.length % 4)) % 4;
    const jsonLength = jsonBuffer.length + jsonPadding;
    
    const binaryPadding = (4 - (bufferData.byteLength % 4)) % 4;
    const binaryLength = bufferData.byteLength + binaryPadding;
    
    const totalLength = 12 + 8 + jsonLength + 8 + binaryLength;
    
    const glb = new ArrayBuffer(totalLength);
    const view = new DataView(glb);
    
    // GLB header
    view.setUint32(0, 0x46546C67, true); // 'glTF'
    view.setUint32(4, 2, true); // version
    view.setUint32(8, totalLength, true); // length
    
    // JSON chunk
    view.setUint32(12, jsonLength, true);
    view.setUint32(16, 0x4E4F534A, true); // 'JSON'
    new Uint8Array(glb, 20, jsonBuffer.length).set(jsonBuffer);
    
    // Binary chunk
    const binaryOffset = 20 + jsonLength;
    view.setUint32(binaryOffset, binaryLength, true);
    view.setUint32(binaryOffset + 4, 0x004E4942, true); // 'BIN\0'
    new Uint8Array(glb, binaryOffset + 8, bufferData.byteLength).set(new Uint8Array(bufferData));
    
    onDone(glb);
  }
}

// Main conversion function
async function convertSTLtoGLB(stlPath, glbPath) {
  return new Promise((resolve, reject) => {
    try {
      // Read the STL file directly
      const stlData = fs.readFileSync(stlPath);
      
      // Parse the STL data
      const loader = new STLLoader();
      const geometry = loader.parse(stlData.buffer);
      
      // Create mesh
      const mesh = new THREE.Mesh(geometry);
      
      // Export to GLB
      const exporter = new GLTFExporter();
      exporter.parse(mesh, (result) => {
        fs.writeFileSync(glbPath, Buffer.from(result));
        console.log(`✓ Successfully converted ${stlPath} to ${glbPath}`);
        resolve();
      });
    } catch (error) {
      console.error('Error converting STL:', error);
      reject(error);
    }
  });
}

// Check if STL file exists and convert
const stlPath = path.join(__dirname, 'models', 'tooth.stl');
const glbPath = path.join(__dirname, 'models', 'tooth.glb');

if (fs.existsSync(stlPath)) {
  // Create models directory if it doesn't exist
  if (!fs.existsSync('models')) {
    fs.mkdirSync('models');
  }
  
  convertSTLtoGLB(stlPath, glbPath)
    .then(() => {
      console.log('Conversion complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Conversion failed:', error);
      process.exit(1);
    });
} else {
  console.log('Note: tooth.stl file not found at ./models/tooth.stl');
  console.log('Please place your STL file there and run: npm run convert');
  process.exit(0);
}
