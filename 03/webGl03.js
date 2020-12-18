// LightedCube_animation.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'vec4 a_Color;\n' +
  'attribute vec4 a_Normal;\n' +
  'uniform mat4 u_MvpMatrix;\n' +
  'uniform mat4 u_NormalMatrix;\n' +
  'uniform vec3 u_LightDirection;\n' +
  'uniform vec3 u_AmbientLight;\n' +   // Ambient light color
  'uniform samplerCube u_cubeSampler;\n' +
  'varying vec3 v_texCoord;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_MvpMatrix * a_Position;\n' +
  '  v_texCoord = normalize(a_Position.xyz);\n' +
  '  vec4 normal = u_NormalMatrix * a_Normal;\n' +
  '  float nDotL = max(dot(u_LightDirection, normalize(normal.xyz)), 0.0);\n' +
  '  a_Color = textureCube(u_cubeSampler, normalize(v_texCoord));\n' + 
  '  vec3 ambient = u_AmbientLight * a_Color.rgb;\n' +
  '  v_Color = vec4(a_Color.xyz * nDotL + ambient, a_Color.a);\n' + 
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision highp float;\n' +
  '#else\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';

var inputAmbient = document.getElementById("inputAmbient");
var slideAmbient = document.getElementById("slideAmbient");

function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  var n = initVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }
  
  // //设置立方体纹理
  initCubeTexture(gl);

  // Get the storage locations of uniform variables and so on
  var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
  var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  var u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');
  var u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
  if (!u_MvpMatrix || !u_NormalMatrix || !u_LightDirection|| !u_AmbientLight) { 
    console.log('Failed to get the storage location');
    return;
  }
  
  var mvpMatrix = new Matrix4();    // Model view projection matrix
  var normalMatrix = new Matrix4(); // Transformation matrix for normals

  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

  document.onkeydown = function(ev){
    keydown(ev, gl, n,  u_MvpMatrix, mvpMatrix, u_NormalMatrix, normalMatrix, u_LightDirection, u_AmbientLight); 
  };
  canvas.addEventListener('mousewheel', function(ev){
    wheel(ev, gl, n,  u_MvpMatrix, mvpMatrix, u_NormalMatrix, normalMatrix, u_LightDirection, u_AmbientLight);
  });

  inputAmbient.oninput = function(){
    inputAmbientChange(inputAmbient.value, gl, n,  u_MvpMatrix, mvpMatrix, u_NormalMatrix, normalMatrix, u_LightDirection, u_AmbientLight);
  }

  slideAmbient.onchange = function(){
    slideAmbientChange(slideAmbient.value, gl, n,  u_MvpMatrix, mvpMatrix, u_NormalMatrix, normalMatrix, u_LightDirection, u_AmbientLight);
  }

  // Set the clear color and enable the depth test
  gl.clearColor(0, 0, 0, 1);
  gl.enable(gl.DEPTH_TEST);

  draw(gl, n, u_MvpMatrix, mvpMatrix, u_NormalMatrix, normalMatrix, u_LightDirection, u_AmbientLight); 
}

function initVertexBuffers(gl) {
  // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3
  // Coordinates
  var vertices = new Float32Array([   // Vertex coordinates
    1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0,  // v0-v3-v4-v5 right
    1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0,  // v0-v5-v6-v1 up
   -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0,  // v1-v6-v7-v2 left
   -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0,  // v7-v4-v3-v2 down
    1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0   // v4-v7-v6-v5 back
 ]);

//  var colors = new Float32Array([     // Colors
//    0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  // v0-v1-v2-v3 front(blue)
//    0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  // v0-v3-v4-v5 right(green)
//    1.0, 0.4, 0.4,  1.0, 0.4, 0.4,  1.0, 0.4, 0.4,  1.0, 0.4, 0.4,  // v0-v5-v6-v1 up(red)
//    1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  // v1-v6-v7-v2 left
//    1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  // v7-v4-v3-v2 down
//    0.4, 1.0, 1.0,  0.4, 1.0, 1.0,  0.4, 1.0, 1.0,  0.4, 1.0, 1.0   // v4-v7-v6-v5 back
//  ]);

  // Normal
  var normals = new Float32Array([
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
   -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
  ]);

  // Indices of the vertices
  var indices = new Uint8Array([
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
 ]);

  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  // if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;

  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}

function initArrayBuffer(gl, attribute, data, num, type) {
  // Create a buffer object
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  return true;
}

function initCubeTexture(gl) {
  var textureObject = gl.createTexture();
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, textureObject);

  //立方图纹理需要设置六个方位上的纹理，设置六个不同的纹理图像
  loadCubemapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_X, textureObject, 'https://publicqn.saikr.com/Fiy_1zzIjXq0m_Soq0btA-QcT0s4');
  loadCubemapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_X, textureObject, 'https://publicqn.saikr.com/Fiy_1zzIjXq0m_Soq0btA-QcT0s4');
  loadCubemapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, textureObject, 'https://publicqn.saikr.com/Fiy_1zzIjXq0m_Soq0btA-QcT0s4');
  loadCubemapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, textureObject, 'https://publicqn.saikr.com/Fiy_1zzIjXq0m_Soq0btA-QcT0s4');
  loadCubemapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_Z, textureObject, 'https://publicqn.saikr.com/Fiy_1zzIjXq0m_Soq0btA-QcT0s4');
  loadCubemapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, textureObject, 'https://publicqn.saikr.com/Fiy_1zzIjXq0m_Soq0btA-QcT0s4');

  //这些内容，也要针对立方图纹理进行设置
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  var u_cubeSampler = gl.getUniformLocation(gl.program, 'u_cubeSampler');
  gl.uniform1i(u_cubeSampler, 0);
}

function loadCubemapFace(gl, target, texture, url) {
  var image = new Image();
  image.crossOrigin = "anonymous";
  image.onload = function(){
      gl.texImage2D(target, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  }
  image.src = url;
}

var g_eyeX = 4, g_eyeY = 4, g_eyeZ = 4; // Eye position
var g_lightX = 4,g_lightY = 4,g_lightZ = 4;
var ambientLight = 0.2;

function keydown(ev, gl, n, u_MvpMatrix, mvpMatrix, u_NormalMatrix, normalMatrix, u_LightDirection, u_AmbientLight) {
    var x = g_eyeX,z = g_eyeZ;
    var lx = g_lightX, lz = g_lightZ;
    if (ev.keyCode == 37) { // The left arrow key was pressed
      g_eyeX -= 0.1*z/Math.sqrt(x*x+z*z);
      g_eyeZ += 0.1*x/Math.sqrt(x*x+z*z);
    } else if (ev.keyCode == 39) { // The right arrow key was pressed
      g_eyeX += 0.1*z/Math.sqrt(x*x+z*z);
      g_eyeZ -= 0.1*x/Math.sqrt(x*x+z*z);
    } else if (ev.keyCode == 38) { // The up arrow key was pressed
      g_eyeY +=0.1;
    } else if (ev.keyCode == 40) { // The down arrow key was pressed
      g_eyeY -=0.1;
    } else if (ev.keyCode == 65) { // The left arrow key was pressed
      g_lightX -= 0.1*lz/Math.sqrt(lx*lx+lz*lz);
      g_lightZ += 0.1*lx/Math.sqrt(lx*lx+lz*lz);
    } else if (ev.keyCode == 68) { // The right arrow key was pressed
      g_lightX += 0.1*lz/Math.sqrt(lx*lx+lz*lz);
      g_lightZ -= 0.1*lx/Math.sqrt(lx*lx+lz*lz);
    } else if (ev.keyCode == 83) { // The up arrow key was pressed
      g_lightY -=0.1;
    } else if (ev.keyCode == 87) { // The down arrow key was pressed
      g_lightY +=0.1;
    }else{
      return; 
    }
    draw(gl, n, u_MvpMatrix, mvpMatrix, u_NormalMatrix, normalMatrix, u_LightDirection, u_AmbientLight);    
}

function wheel(ev, gl, n, u_MvpMatrix, mvpMatrix, u_NormalMatrix, normalMatrix, u_LightDirection, u_AmbientLight){
  if(ev.wheelDelta<0){
    g_eyeX = g_eyeX/0.99;
    g_eyeY = g_eyeY/0.99;
    g_eyeZ = g_eyeZ/0.99;
  }else{
    g_eyeX = g_eyeX*0.99;
    g_eyeY = g_eyeY*0.99;
    g_eyeZ = g_eyeZ*0.99;
  }
  // console.log(g_eyeX);
  // console.log(g_eyeY);
  // console.log(g_eyeZ);
  draw(gl, n, u_MvpMatrix, mvpMatrix, u_NormalMatrix, normalMatrix, u_LightDirection, u_AmbientLight); 
}

function draw(gl, n, u_MvpMatrix, mvpMatrix, u_NormalMatrix, normalMatrix, u_LightDirection, u_AmbientLight) {
  mvpMatrix.setPerspective(30, 1, 1, 100);
  mvpMatrix.lookAt(g_eyeX, g_eyeY, g_eyeZ, 0, 0, 0, 0, 1, 0);

  var lightDirection = new Vector3([g_lightX, g_lightY, g_lightZ]);
  lightDirection.normalize();     // Normalize
  gl.uniform3fv(u_LightDirection, lightDirection.elements);
  gl.uniform3f(u_AmbientLight, ambientLight, ambientLight, ambientLight);

  // Pass the model view projection matrix to the variable u_MvpMatrix
  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);   // Draw the cube
}

function inputAmbientChange(light, gl, n,  u_MvpMatrix, mvpMatrix, u_NormalMatrix, normalMatrix, u_LightDirection, u_AmbientLight){
  if(light > 1){
      alert("数值不能大于1");
  }else{
      ambientLight = light;
      slideAmbient.value = light * 1000;
  }
  draw(gl, n, u_MvpMatrix, mvpMatrix, u_NormalMatrix, normalMatrix, u_LightDirection, u_AmbientLight); 
}

function slideAmbientChange(light,  gl, n,  u_MvpMatrix, mvpMatrix, u_NormalMatrix, normalMatrix, u_LightDirection, u_AmbientLight){
  console.log(light)
  ambientLight = light/1000;
  inputAmbient.value = light/1000;
  draw(gl, n, u_MvpMatrix, mvpMatrix, u_NormalMatrix, normalMatrix, u_LightDirection, u_AmbientLight); 
}

