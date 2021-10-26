"use strict"

var canvas;
var gl;
var program;

var points = [];
var normals = [];
var colors = [];
var shapes = [];
var drawObject = [];
var selectedObject = [];

var thetaLoc, newPosLoc, scaleLoc;

var radius, camPhi, camTheta;
var far, near, fov, aspect;

var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);
var modelViewMatrixLoc, modelViewMatrix;
var modelInverseTransposeLoc, modelInverseTranspose;
var projectionMatrixLoc, projectionMatrix;

var lights = [];
var diffuseProducts = [];
var specularProducts = [];
var lightPositionLoc1, lightPosition1 = vec4(4.0, 1.0, 2.0, 1.0);
var lightPositionLoc2, lightPosition2 = vec4(-3.0, 0.0, -2.0, 1.0);
var lightPositionLoc3, lightPosition3 = vec4(-1.0, 2.0, 4.0, 1.0);
var diffuseProductLoc1, diffuseProductLoc2, diffuseProductLoc3;
var specularProductLoc1, specularProductLoc2, specularProductLoc3;

var ambientColorLoc, ambientColor = vec4(0.05, 0.05, 0.05, 1.0);
var shininessLoc, shininess;

var index = 0,
    lightIndex = 0;

class Drawable {
    constructor(vertices, normals, color, rotation, translation, scaling, program) {
        this.rotation = rotation;
        this.translation = translation;
        this.scaling = scaling;

        this.program = program;
        this.vertices = vertices;
        this.normals = normals
        this.color = color;

        this.vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.vertices), gl.STATIC_DRAW);
        this.vAttributeLocation = gl.getAttribLocation(program, 'vPosition');

        this.nBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.nBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.normals), gl.STATIC_DRAW);
        this.nAttributeLocation = gl.getAttribLocation(program, 'vNormal');

        this.cBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.cBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.color), gl.STATIC_DRAW);
        this.cAttributeLocation = gl.getAttribLocation(program, 'vColor');
    }

    draw() {
        gl.uniform3fv(thetaLoc, this.rotation);
        gl.uniform3fv(newPosLoc, this.translation);
        gl.uniform3fv(scaleLoc, this.scaling);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
        gl.vertexAttribPointer(this.vAttributeLocation, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.vAttributeLocation);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.nBuffer);
        gl.vertexAttribPointer(this.nAttributeLocation, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.nAttributeLocation);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.cBuffer);
        gl.vertexAttribPointer(this.cAttributeLocation, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.cAttributeLocation);

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
    gl.clearColor(0.07, 0.07, 0.07, 1);
    gl.enable(gl.DEPTH_TEST);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    modelViewMatrixLoc = gl.getUniformLocation(program, 'mView');
    modelInverseTransposeLoc = gl.getUniformLocation(program, "mViewInverseTranspose");
    projectionMatrixLoc = gl.getUniformLocation(program, 'mProj');
    thetaLoc = gl.getUniformLocation(program, "theta");
    newPosLoc = gl.getUniformLocation(program, "newPos");
    scaleLoc = gl.getUniformLocation(program, "scale");

    lightPositionLoc1 = gl.getUniformLocation(program, "lightPosition1");
    diffuseProductLoc1 = gl.getUniformLocation(program, "diffuseProduct1");
    specularProductLoc1 = gl.getUniformLocation(program, "specularProduct1");
    diffuseProducts.push(vec4(1.0, 1.0, 1.0, 1.0));
    specularProducts.push(vec4(1.0, 1.0, 1.0, 1.0));

    lightPositionLoc2 = gl.getUniformLocation(program, "lightPosition2");
    diffuseProductLoc2 = gl.getUniformLocation(program, "diffuseProduct2");
    specularProductLoc2 = gl.getUniformLocation(program, "specularProduct2");
    diffuseProducts.push(vec4(0.0, 1.0, 0.0, 1.0));
    specularProducts.push(vec4(0.0, 1.0, 0.0, 1.0));

    lightPositionLoc3 = gl.getUniformLocation(program, "lightPosition3");
    diffuseProductLoc3 = gl.getUniformLocation(program, "diffuseProduct3");
    specularProductLoc3 = gl.getUniformLocation(program, "specularProduct3");
    diffuseProducts.push(vec4(0.0, 0.0, 1.0, 1.0));
    specularProducts.push(vec4(0.0, 0.0, 1.0, 1.0));

    ambientColorLoc = gl.getUniformLocation(program, "ambientProduct");
    shininessLoc = gl.getUniformLocation(program, "shininess");

    points = []; normals = []; colors = [];
    colorCube([ 1.0, 0.0, 0.0, 1.0 ]);
    shapes.push(
        new Drawable(
            points,
            normals,
            colors,
            [0.0, 0.0, 0.0],
            [-2.0, 0.0, 0.0],
            [1.0, 1.0, 1.0],
            program
        )
    );

    points = []; normals = []; colors = [];
    colorCone();
    shapes.push(
        new Drawable(
            points,
            normals,
            colors,
            [0.0, 0.0, 0.0],
            [0.0, 0.0, 0.0],
            [1.0, 1.0, 1.0],
            program
        )
    );

    points = []; normals = []; colors = [];
    colorSphere();
    shapes.push(
        new Drawable(
            points,
            normals,
            colors,
            [0.0, 0.0, 0.0],
            [2.5, 0.0, 0.0],
            [1.0, 1.0, 1.0],
            program
        )
    );

    points = []; normals = []; colors = [];
    colorCube([1.0, 0.0, 0.0, 1.0]);
    lights.push(
        new Drawable(
            points,
            normals,
            colors,
            [0.0, 0.0, 0.0],
            vec3(lightPosition1),
            [0.2, 0.2, 0.2],
            program
        )
    );

    points = []; normals = []; colors = [];
    colorCube([0.0, 1.0, 0.0, 1.0]);
    lights.push(
        new Drawable(
            points,
            normals,
            colors,
            [0.0, 0.0, 0.0],
            vec3(lightPosition2),
            [0.2, 0.2, 0.2],
            program
        )
    );

    points = []; normals = []; colors = [];
    colorCube([0.0, 0.0, 1.0, 1.0]);
    lights.push(
        new Drawable(
            points,
            normals,
            colors,
            [0.0, 0.0, 0.0],
            vec3(lightPosition3),
            [0.2, 0.2, 0.2],
            program
        )
    );

    drawObject = document.querySelectorAll("#in");
    selectedObject.push(document.getElementById("#transformCube"));
    selectedObject.push(document.getElementById("#transformCone"));
    selectedObject.push(document.getElementById("#transformSphere"));

    render();
}

function calculateNormal(a, b, c) {
    var t1 = subtract(b, a);
	var t2 = subtract(c, a);
	var normal = normalize(cross(t1, t2));

    normal = vec4(normal);
	return normal;
}

function colorCube(color) {
    quad( 1, 0, 3, 2, color );
    quad( 2, 3, 7, 6, color );
    quad( 3, 0, 4, 7, color );
    quad( 6, 5, 1, 2, color );
    quad( 4, 5, 6, 7, color );
    quad( 5, 4, 0, 1, color );
}

function quad(a, b, c, d, color) {
    var vertices = [
        vec4(-0.5, -0.5,  0.5, 1.0 ),
        vec4(-0.5,  0.5,  0.5, 1.0 ),
        vec4( 0.5,  0.5,  0.5, 1.0 ),
        vec4( 0.5, -0.5,  0.5, 1.0 ),
        vec4(-0.5, -0.5, -0.5, 1.0 ),
        vec4(-0.5,  0.5, -0.5, 1.0 ),
        vec4( 0.5,  0.5, -0.5, 1.0 ),
        vec4( 0.5, -0.5, -0.5, 1.0 )
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

    var t1 = subtract(vertices[a], vertices[b]);
    var t2 = subtract(vertices[c], vertices[b]);
    var normal = vec3(cross(t2, t1));

    var indices = [ a, b, c, a, c, d ];
    for ( var i = 0; i < indices.length; i++ ) {
        points.push(vertices[indices[i]]);
        normals.push(normal);
        colors.push(color);
    }
}

function colorCone() {
    var x, z;
    const r = 1;
    const step = radians(20);

    for (var theta = 0; theta < 2 * Math.PI; theta += step) {
        x = r * Math.cos(theta);
        z = r * Math.sin(theta);
        points.push(vec4(x, -0.5, z, 1.0));
        colors.push([Math.abs(Math.tan(x * z)), Math.abs(z + x), Math.tan(x + z), 1.0]);
        
        points.push(vec4(0.0, 1.0, 0.0, 1.0));
        colors.push([1, 0, 1, 1.0]);

        x = r * Math.cos(theta + step);
        z = r * Math.sin(theta + step);
        points.push(vec4(x, -0.5, z, 1.0));
        colors.push([Math.abs(Math.tan(x * z)), Math.abs(z + x), Math.tan(x + z), 1.0]);
    }
    
    for (var i = 0; i < points.length; i += 3) {
        var normal = calculateNormal(points[i], points[i + 1], points[i + 2]);
        normals.push(vec3(normal));
        normals.push(vec3(normal));
        normals.push(vec3(normal));
    }
}

function colorSphere() {
    var cX = 0, cY = 0, cZ = 0;
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
        var idx0 = (i + 1) % nrOfSegments + 1;
        var idx1 = i + 1;

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

    for (var i = 0; i < points.length; i += 3) {
        var normal = calculateNormal(points[i], points[i + 1], points[i + 2]);
        normals.push(vec3(normal));
        normals.push(vec3(normal));
        normals.push(vec3(normal));
    }
}

function updateSliders(obj) {
    index = obj.value;

    document.getElementById("rotateX").value = shapes[obj.value].rotation[0];
    document.getElementById("rotateY").value = shapes[obj.value].rotation[1];
    document.getElementById("rotateZ").value = shapes[obj.value].rotation[2];

    document.getElementById("moveX").value = shapes[obj.value].translation[0];
    document.getElementById("moveY").value = shapes[obj.value].translation[1];
    document.getElementById("moveZ").value = shapes[obj.value].translation[2];

    document.getElementById("scaleX").value = shapes[obj.value].scaling[0];
    document.getElementById("scaleY").value = shapes[obj.value].scaling[1];
    document.getElementById("scaleZ").value = shapes[obj.value].scaling[2];

    var outputs = document.getElementsByTagName("output");
    for (var i = 0; i < outputs.length; i++) {
        outputs[i].value = outputs[i].previousElementSibling.value;
    }
}

function updateLightSliders(obj) {
    lightIndex = obj.value;

    document.getElementById("moveLightX").value = lights[obj.value].translation[0];
    document.getElementById("moveLightY").value = lights[obj.value].translation[1];
    document.getElementById("moveLightZ").value = lights[obj.value].translation[2];

    document.getElementById("diffuse").value = "#" + ((1 << 24) + ((diffuseProducts[obj.value][0] * 255) << 16) + ((diffuseProducts[obj.value][1] * 255) << 8) + diffuseProducts[obj.value][2] * 255).toString(16).slice(1);
    document.getElementById("specular").value = "#" + ((1 << 24) + ((specularProducts[obj.value][0] * 255) << 16) + ((specularProducts[obj.value][1] * 255) << 8) + specularProducts[obj.value][2] * 255).toString(16).slice(1);

    var outputs = document.getElementsByTagName("output");
    for (var i = 0; i < outputs.length; i++) {
        outputs[i].value = outputs[i].previousElementSibling.value;
    }
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    shapes[index].rotation[0] = document.getElementById("rotateX").value;
    shapes[index].rotation[1] = document.getElementById("rotateY").value;
    shapes[index].rotation[2] = document.getElementById("rotateZ").value;

    shapes[index].translation[0] = document.getElementById("moveX").value;
    shapes[index].translation[1] = document.getElementById("moveY").value;
    shapes[index].translation[2] = document.getElementById("moveZ").value;

    shapes[index].scaling[0] = document.getElementById("scaleX").value;
    shapes[index].scaling[1] = document.getElementById("scaleY").value;
    shapes[index].scaling[2] = document.getElementById("scaleZ").value;

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
    gl.uniformMatrix4fv(modelInverseTransposeLoc, false, flatten(transpose(inverse(modelViewMatrix))));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    lights[lightIndex].translation[0] = document.getElementById("moveLightX").value;
    lights[lightIndex].translation[1] = document.getElementById("moveLightY").value;
    lights[lightIndex].translation[2] = document.getElementById("moveLightZ").value;
    lightPosition2 = vec4(lights[lightIndex].translation, 1.0);

    diffuseProducts[lightIndex] = vec4(document.getElementById("diffuse").value.match(/[A-Za-z0-9]{2}/g).map(function(v) {return parseInt(v, 16) / 255}), 1.0);
    specularProducts[lightIndex] = vec4(document.getElementById("specular").value.match(/[A-Za-z0-9]{2}/g).map(function(v) {return parseInt(v, 16) / 255}), 1.0);
    
    gl.uniform4fv(lightPositionLoc1, flatten(vec4(lights[0].translation, 1.0)));
    gl.uniform4fv(diffuseProductLoc1, flatten(diffuseProducts[0]));
    gl.uniform4fv(specularProductLoc1, flatten(specularProducts[0]));
    
    gl.uniform4fv(lightPositionLoc2, flatten(vec4(lights[1].translation, 1.0)));
    gl.uniform4fv(diffuseProductLoc2, flatten(diffuseProducts[1]));
    gl.uniform4fv(specularProductLoc2, flatten(specularProducts[1]));

    gl.uniform4fv(lightPositionLoc3, flatten(vec4(lights[2].translation, 1.0)));
    gl.uniform4fv(diffuseProductLoc3, flatten(diffuseProducts[2]));
    gl.uniform4fv(specularProductLoc3, flatten(specularProducts[2]));

    ambientColor = vec4(document.getElementById("ambient").value.match(/[A-Za-z0-9]{2}/g).map(function(v) {return parseInt(v, 16) / 255}), 1.0);
    shininess = document.getElementById("shininess").value;
    gl.uniform4fv(ambientColorLoc, flatten(ambientColor));
    gl.uniform1f(shininessLoc, shininess);


    lights[2].color = lights[2].color.map(x => [1.0, 1.0, 1.0, 1.0]);

    for (var i = 0; i < shapes.length; i++) {
        if (drawObject[i].checked) {
            shapes[i].draw();
        }
        lights[i].draw();
    }

    requestAnimFrame(render);
}