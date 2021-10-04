"use strict"

var canvas;
var gl;
var program;

var points = [];
var colors = [];
var shapes = [];
var checks = [];

var theta = [0, 0, 0];
var thetaLoc;

var newPos = [0, 0, 0];
var newPosLoc;

var scale = [0, 0, 0];
var scaleLoc;

var radius, camPhi, camTheta;
var far, near, fov, aspect;

var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);
var modelViewMatrixLoc, modelViewMatrix;
var projectionMatrixLoc, projectionMatrix;

class Drawable {
    constructor(vertices, color, program) {
        this.program = program;

        this.vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
        this.vAttributeLocation = gl.getAttribLocation(program, 'vPosition');

        this.vertices = vertices;
        this.color = color;

        this.cBuffer = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, this.cBuffer);
        gl.bufferData( gl.ARRAY_BUFFER, flatten(this.color), gl.STATIC_DRAW );
        this.cAttributeLocation = gl.getAttribLocation( program, 'vColor' );
    }

    draw() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
        gl.vertexAttribPointer( this.vAttributeLocation, 4, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( this.vAttributeLocation);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.cBuffer);
        gl.vertexAttribPointer( this.cAttributeLocation, 4, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( this.cAttributeLocation);

        gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length);
    }
}

function main() {
    canvas = document.getElementById("mycanvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        console.log("Failed to get the rendering context for WebGL");
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 0.1);
    gl.enable(gl.DEPTH_TEST);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    modelViewMatrixLoc = gl.getUniformLocation(program, 'mView');
    projectionMatrixLoc = gl.getUniformLocation(program, 'mProj');
    thetaLoc = gl.getUniformLocation(program, "theta");
    newPosLoc = gl.getUniformLocation(program, "newPos");
    scaleLoc = gl.getUniformLocation(program, "scale");
    
    points = []; colors = [];
    colorCube();
    shapes.push(new Drawable(points, colors, program));

    points = []; colors = [];
    colorCone();
    shapes.push(new Drawable(points, colors, program));

    points = []; colors = [];
    colorSphere();
    shapes.push(new Drawable(points, colors, program));

    checks = document.querySelectorAll("#in");
    render();
}


function colorCube() {
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}

function quad(a, b, c, d) {
    var vertices = [
        vec4( -2.5, -0.5,  0.5, 1.0 ),
        vec4( -2.5,  0.5,  0.5, 1.0 ),
        vec4( -1.5,  0.5,  0.5, 1.0 ),
        vec4( -1.5, -0.5,  0.5, 1.0 ),
        vec4( -2.5, -0.5, -0.5, 1.0 ),
        vec4( -2.5,  0.5, -0.5, 1.0 ),
        vec4( -1.5,  0.5, -0.5, 1.0 ),
        vec4( -1.5, -0.5, -0.5, 1.0 ),
    ];

    var vertexColors = [
        [ 0.0, 0.0, 0.0, 1.0 ],  // black
        [ 1.0, 0.0, 0.0, 1.0 ],  // red
        [ 1.0, 1.0, 0.0, 1.0 ],  // yellow
        [ 0.0, 1.0, 0.0, 1.0 ],  // green
        [ 0.0, 0.0, 1.0, 1.0 ],  // blue
        [ 1.0, 0.0, 1.0, 1.0 ],  // magenta
        [ 0.0, 1.0, 1.0, 1.0 ],  // cyan
        [ 1.0, 1.0, 1.0, 1.0 ]   // white
    ];

    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; i++ ) {
        points.push( vertices[indices[i]] );
        colors.push(vertexColors[a]);
    }
}

function colorCone() {
    var x, z;
    const r = 1;
    const step = radians(20);

    for (var theta = 0; theta < 2 * Math.PI - step; theta += step) {
        x = r * Math.cos(theta);
        z = r * Math.sin(theta);
        points.push(vec4(x, -0.5, z, 1.0));
        colors.push([Math.abs(Math.tan(x * z)), Math.abs(z + x), Math.tan(x + z), 1.0]);
        
        points.push(vec4(0.0, 1.0, 0.0, 1.0));
        colors.push([1, 0, 1, 1.0]);

        x = r * Math.cos(theta + radians(20));
        z = r * Math.sin(theta + radians(20));
        points.push(vec4(x, -0.5, z, 1.0));
        colors.push([Math.abs(Math.tan(x * z)), Math.abs(z + x), Math.tan(x + z), 1.0]);
    }
}

function colorSphere() {
    var cX = 2.5, cY = 0, cZ = 0;
    const r = 1;
    var nrOfSegments = 30;
    var vertices = [];

    vertices.push(vec4(cX, r, cZ, 1.0)); //top vertex;
    for (var h = 0; h < nrOfSegments - 1; h++) {
        var phi = (h + 1) * Math.PI / (nrOfSegments);

        for (var v = 0; v < nrOfSegments; v++) {
            var theta = v * 2 * Math.PI / nrOfSegments;

            var x = r * Math.sin(phi) * Math.cos(theta) + cX;
            var y = r * Math.cos(phi) + cY;
            var z = r * Math.sin(phi) * Math.sin(theta) + cZ;
            vertices.push(vec4(x, y, z, 1.0));
        }
    }
    vertices.push(vec4(cX, -r, cZ, 1.0)); //bottom vertex;

    //
    // top and bottom of sphere
    //
    var color1 = [Math.random(), Math.random(), Math.random(), 1.0];
    var color2 = [Math.random(), Math.random(), Math.random(), 1.0];
    for (var i = 0; i < nrOfSegments; i++) {
        var idx0 = i + 1;
        var idx1 = (i + 1) % nrOfSegments + 1;

        points.push(vertices[0]);
        colors.push(color1);
        points.push(vertices[idx0]);
        colors.push(color1);
        points.push(vertices[idx1]);
        colors.push(color1);

        points.push(vertices[vertices.length - 1]);
        colors.push(nrOfSegments % 2 ? color1 : color2);
        points.push(vertices[vertices.length - 1 - idx0]);
        colors.push(nrOfSegments % 2 ? color1 : color2);
        points.push(vertices[vertices.length - 1 - idx1]);
        colors.push(nrOfSegments % 2 ? color1 : color2);
    }
    
    for (var i = 0; i < nrOfSegments - 2; i++) {
        var idx0 = i * nrOfSegments + 1;
        var idx1 = (i + 1) * nrOfSegments + 1;

        for (var j = 0; j < nrOfSegments; j++) {
            var color = vec4(Math.random(), Math.random(), Math.random(), 1.0);
            points.push(vertices[idx0 + j]);
            colors.push(i % 2 ? color1 : color2);
            points.push(vertices[idx0 + (j + 1) % nrOfSegments]);
            colors.push(i % 2 ? color1 : color2);
            points.push(vertices[idx1 + (j + 1) % nrOfSegments]);
            colors.push(i % 2 ? color1 : color2);
            
            points.push(vertices[idx0 + j]);
            colors.push(i % 2 ? color1 : color2);
            points.push(vertices[idx1 + (j + 1) % nrOfSegments]);
            colors.push(i % 2 ? color1 : color2);
            points.push(vertices[idx1 + j]);
            colors.push(i % 2 ? color1 : color2);
        }
    }
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    theta[0] = document.getElementById("rotateX").value;
    theta[1] = document.getElementById("rotateY").value;
    theta[2] = document.getElementById("rotateZ").value;
    gl.uniform3fv(thetaLoc, theta);

    newPos[0] = document.getElementById("moveX").value;
    newPos[1] = document.getElementById("moveY").value;
    newPos[2] = document.getElementById("moveZ").value;
    gl.uniform3fv(newPosLoc, newPos);

    scale[0] = document.getElementById("scaleX").value;
    scale[1] = document.getElementById("scaleY").value;
    scale[2] = document.getElementById("scaleZ").value;
    gl.uniform3fv(scaleLoc, scale);

    radius = document.getElementById("radius").value;
    camPhi = document.getElementById("camPhi").value;
    camTheta = document.getElementById("camTheta").value;
    eye = vec3(
        radius * Math.sin(radians(camTheta)) * Math.cos(radians(camPhi)),
        radius * Math.sin(radians(camTheta)) * Math.sin(radians(camPhi)),
        radius * Math.cos(radians(camTheta))
    );

    modelViewMatrix = lookAt(eye, at, up); //eye = [-4, 2, 7]

    near = document.getElementById("zNear").value;
    far = document.getElementById("zFar").value;
    fov = document.getElementById("fov").value;
    aspect = document.getElementById("aspect").value;

    projectionMatrix = perspective(fov, aspect, near, far); //perspective(45, canvas.width / canvas.height, 0.1, 1000.0);
 
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    for (var i = 0; i < shapes.length; i++) {
        if (checks[i].checked) {
            shapes[i].draw();
        }
    }
    
    requestAnimFrame(render);
}