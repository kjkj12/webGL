// Vertex shader program
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'uniform mat4 u_ModelMatrix;\n' +
    'void main() {\n' +
    '  gl_Position = u_ModelMatrix * a_Position;\n' +
    '}\n';

// Fragment shader program
var FSHADER_SOURCE =
    'precision mediump float;\n' +
    'uniform float u_Width;\n' +
    'uniform float u_Height;\n' +
    'void main() {\n' +
    '  gl_FragColor = vec4(gl_FragCoord.x/u_Width, 0.0, gl_FragCoord.y/u_Height, 1.0);\n' +
    '}\n';

// Rotation angle (degrees/second)
var ANGLE_STEP = 45.0;
var ALL_ANGLE = 0.0;
var SCALE_STEP = 0.8;
var ALL_SCALE = 1.0;

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

    // Write the positions of vertices to a vertex shader
    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set the positions of the vertices');
        return;
    }

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Get storage location of u_ModelMatrix
    var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) { 
        console.log('Failed to get the storage location of u_ModelMatrix');
        return;
    }

    var modelMatrix = new Matrix4();

    canvas.addEventListener('mousedown', function(ev){
        console.log(ev.button)
        if(0 === ev.button){
            var startX = ev.pageX;
            var startY = ev.pageY;
            var width = canvas.offsetWidth;
            var height = canvas.offsetHeight;
            var tmpModelMatrix = new Matrix4();
            tmpModelMatrix.elements = modelMatrix.elements.slice(0);
            // //初始位置的X，Y 坐标
            function movemouse(ev){
                console.log("is moving ........   x = "+ ev.pageX + "   y = "+ ev.pageY + ".........");
                var movX = ev.pageX - startX;
                var movY = startY - ev.pageY;

                tmpModelMatrix.elements = modelMatrix.elements.slice(0);

                tmpModelMatrix.translate((2*movX/width*Math.cos(ALL_ANGLE/180*Math.PI)+2*movY/height*Math.sin(ALL_ANGLE/180*Math.PI))*ALL_SCALE
                    ,(2*movY/height*Math.cos(ALL_ANGLE/180*Math.PI)-2*movX/width*Math.sin(ALL_ANGLE/180*Math.PI))*ALL_SCALE ,0)
                draw(gl, n, tmpModelMatrix, u_ModelMatrix);
            }

            function upmouse(){
                console.log("is uping ............");
                modelMatrix.elements = tmpModelMatrix.elements.slice(0);
                draw(gl, n, modelMatrix, u_ModelMatrix);
                canvas.removeEventListener('mousemove',movemouse);
                document.removeEventListener('mouseup',upmouse);
            }

            canvas.addEventListener("mousemove",movemouse);
            document.addEventListener("mouseup",upmouse); 
            draw(gl, n, modelMatrix, u_ModelMatrix);
        }
    });

    canvas.addEventListener('mousewheel', function(ev){
        modelMatrix = scale(ev, modelMatrix);
        draw(gl, n, modelMatrix, u_ModelMatrix);
    });

    document.addEventListener('keydown',function(e){
        console.log(e.key)
        // 向左
        if(e.key === 'ArrowLeft'){
            ALL_ANGLE = ALL_ANGLE + ANGLE_STEP;
            modelMatrix.rotate(ANGLE_STEP, 0, 0, 1);
        }else if(e.key === 'ArrowRight'){
            ALL_ANGLE = ALL_ANGLE - ANGLE_STEP;
            modelMatrix.rotate(-ANGLE_STEP, 0, 0, 1);
        }
        draw(gl, n, modelMatrix, u_ModelMatrix);
    })

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Draw the rectangle
    gl.drawArrays(gl.TRIANGLES, 0, n);

}

function initVertexBuffers(gl) {
    var vertices = new Float32Array ([
    0, 0,  0.25, 0.75,  -0.25, 0.75
    ]);
    var n = 3;   // The number of vertices

    // Create a buffer object
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // Write date into the buffer object
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // Assign the buffer object to a_Position variable
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if(a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }
    // Enable the assignment to a_Position variable
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    // Pass the position of a point to a_Position variable
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

    var u_Width = gl.getUniformLocation(gl.program, 'u_Width');
    if (!u_Width) {
        console.log('Failed to get the storage location of u_Width');
        return;
    }

  var u_Height = gl.getUniformLocation(gl.program, 'u_Height');
  if (!u_Height) {
    console.log('Failed to get the storage location of u_Height');
    return;
  }

    // Pass the width and hight of the <canvas>
    gl.uniform1f(u_Width, gl.drawingBufferWidth);
    gl.uniform1f(u_Height, gl.drawingBufferHeight);

    // Enable the generic vertex attribute array
    gl.enableVertexAttribArray(a_Position);

    // Unbind the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return n;
}

function scale(ev, modelMatrix){
    if(ev.wheelDelta<0){
        ALL_SCALE = ALL_SCALE/SCALE_STEP;
        return modelMatrix.scale(SCALE_STEP, SCALE_STEP, 0);
    }else{
        ALL_SCALE = ALL_SCALE*SCALE_STEP;
        return modelMatrix.scale(1/SCALE_STEP, 1/SCALE_STEP, 0);
    }
    
}

function draw(gl, n, modelMatrix, u_ModelMatrix) {
    
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.drawArrays(gl.TRIANGLES, 0, n);
}

var inputAngle = document.getElementById("inputAngle");
var slideAngle = document.getElementById("slideAngle");

function inputAngleChange(angle){
    ANGLE_STEP = angle;
    slideAngle.value = angle;
}

function slideAngleChange(angle){
    ANGLE_STEP = angle;
    inputAngle.value = angle;
}

var inputScale = document.getElementById("inputScale");
var slideScale = document.getElementById("slideScale");

function inputScaleChange(scale){
    if(scale > 1){
        alert("数值不能大于1");
    }else{
        SCALE_STEP = scale;
        slideScale.value = scale * 100;
    }
}

function slideScaleChange(scale){
    SCALE_STEP = scale/100;
    inputScale.value = scale/100;
}