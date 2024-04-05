const MAX_MATRICES = 20;

const vertexShaderSource = [
'precision mediump float;',
'',
'#define MAX_MATRICES '+MAX_MATRICES,
'',
'attribute vec3 vertPosition;',
'attribute vec2 vertTexCoord;',
'attribute float boxIndex;',
'',
'varying vec2 fragTexCoord;',
'',
'uniform mat4 mWorlds[MAX_MATRICES];',
'uniform mat4 mView;',
'uniform mat4 mProj;',
'',
'void main()',
'{',
' fragTexCoord = vertTexCoord;',
' gl_Position = mProj * mView * mWorlds[int(boxIndex)] * vec4(vertPosition, 1.0);',
'}'
].join('\n');

const fragmentShaderSource = [
'precision mediump float;',
'',
'varying vec2 fragTexCoord;',
'uniform sampler2D sampler;',
'',
'void main()',
'{',
' gl_FragColor = texture2D(sampler, fragTexCoord);',
'}'
].join('\n');

//
// SPECIFY VERTICES AND INDICES
//
const boxVertices = [
	-1.0, -1.0,  1.0,  0.0, 1.0, //0, front face
	 1.0, -1.0,  1.0,  1.0, 1.0, //1
	 1.0,  1.0,  1.0,  1.0, 0.0, //2
	-1.0,  1.0,  1.0,  0.0, 0.0, //3

	-1.0, -1.0, -1.0,  1.0, 1.0, //4, back face
	 1.0, -1.0, -1.0,  0.0, 1.0, //5
	 1.0,  1.0, -1.0,  0.0, 0.0, //6
	-1.0,  1.0, -1.0,  1.0, 0.0, //7

	 1.0, -1.0,  1.0,  0.0, 1.0, // 8 -> 1, right face
	 1.0,  1.0,  1.0,  0.0, 0.0, // 9 -> 2
	 1.0, -1.0, -1.0,  1.0, 1.0, //10 -> 5
	 1.0,  1.0, -1.0,  1.0, 0.0, //11 -> 6

	-1.0, -1.0,  1.0,  1.0, 1.0, //12 -> 0, left face
	-1.0,  1.0,  1.0,  1.0, 0.0, //13 -> 3
	-1.0, -1.0, -1.0,  0.0, 1.0, //14 -> 4
	-1.0,  1.0, -1.0,  0.0, 0.0, //15 -> 7

	 1.0,  1.0,  1.0,  1.0, 1.0, //16 -> 2, top face
	-1.0,  1.0,  1.0,  0.0, 1.0, //17 -> 3

	-1.0, -1.0,  1.0,  0.0, 0.0, //18 -> 0, bottom face
	 1.0, -1.0,  1.0,  1.0, 0.0, //19 -> 1
];

const boxIndices = [
	 0,  1,  2,  0,  2,  3, // Front face
	 6,  5,  4,  4,  7,  6, // Back face
	17, 16, 11, 17, 11, 15, // Top face
	14, 10, 19, 14, 19, 18, // Bottom face
	 8, 10, 11,  9,  8, 11, // Right face
	12, 13, 15, 12, 15, 14  // Left face
];

function translateBox(x, y, z){
	//Copy default box
	let out = new Float32Array(boxVertices);

	//transform box to new coordinates
	for(let i = 0; i < out.length; i+=5){
		out[i] += x;
		out[i+1] += y;
		out[i+2] += z;
	}

	return out;
}


var initGL = function () {
	
	//
	// SETUP WEBGL ENVIRONMENT
	//
	
	const canvas = document.getElementById("webgl-canvas");
	//2 * 3px margin; see slyte.css
	canvas.height = window.innerHeight - 6;
	canvas.width = window.innerWidth - 6;
	const gl = canvas.getContext("webgl2");
	
	if(!gl){
		alert('Your browser does not support WebGL');
		return;
	}
	
	gl.clearColor(0.8, 0.8, 0.8, 1.0);
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);
	gl.frontFace(gl.CCW);
	gl.cullFace(gl.BACK);
	
	
	//
	// CREATE SHADERS AND PROGRAM
	//
	const vertexShader = gl.createShader(gl.VERTEX_SHADER, vertexShaderSource);
	const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

	gl.shaderSource(vertexShader, vertexShaderSource);
	gl.shaderSource(fragmentShader, fragmentShaderSource);

	gl.compileShader(vertexShader);
	if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)){
		console.error('ERROR compiling vertex shader!', gl.getShaderInfoLog(vertexShader));
		return;
	}

	gl.compileShader(fragmentShader);
	if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)){
		console.error('ERROR compiling fragment shader!', gl.getShaderInfoLog(fragmentShader));
		return;
	}

	const program = gl.createProgram(gl, vertexShader, fragmentShader);
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);

	if(!gl.getProgramParameter(program, gl.LINK_STATUS)){
		console.error('ERROR linking program!', gl.getProgramInfoLog(program));
		return;
	}
	gl.validateProgram(program);
	if(!gl.getProgramParameter(program, gl.VALIDATE_STATUS)){
		console.error('ERROR validating program!', gl.getProgramInfoLog(program));
		return;
	}
	
	//
	// CREATING BUFFERS AND ATTRIBUTE LOCATIONS
	//

	var boxVertexBufferObject = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, boxVertexBufferObject);
	gl.bufferData(gl.ARRAY_BUFFER, translateBox(0,0,0), gl.STATIC_DRAW);
	
	var boxIndexBufferObject = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boxIndexBufferObject);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(boxIndices), gl.STATIC_DRAW);
	
	var positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
	var texCoordAttribLocation = gl.getAttribLocation(program, 'vertTexCoord');
	var boxIndexAttribLocation = gl.getAttribLocation(program, 'boxIndex');
	
	gl.vertexAttribPointer(
		positionAttribLocation,
		3,
		gl.FLOAT,
		gl.FALSE,
		5 * Float32Array.BYTES_PER_ELEMENT,
		0
	);
	
	gl.vertexAttribPointer(
		texCoordAttribLocation,
		2,
		gl.FLOAT,
		gl.FALSE,
		5 * Float32Array.BYTES_PER_ELEMENT,
		3 * Float32Array.BYTES_PER_ELEMENT
	);

	
	gl.enableVertexAttribArray(positionAttribLocation);
	gl.enableVertexAttribArray(texCoordAttribLocation);	
	
	//
	// CREATE TEXTURES
	//
	texture_names = ['spades13', 'spades14'];
	const textures = [];
	
	const level = 0;
	const internalFormat = gl.RGBA;
	const srcFormat = gl.RGBA;
	const srcType = gl.UNSIGNED_BYTE;

	texture_names.forEach(texture_name => {
		const texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

		gl.texImage2D(
			gl.TEXTURE_2D,
			level,
			internalFormat,
			srcFormat,
			srcType,
			document.getElementById(texture_name),
		);

		textures.push(texture);
	});
	
	gl.useProgram(program);
	
	
	//
	// CREATE MATRICES
	//

	var matWorldsUniformLocation = gl.getUniformLocation(program, 'mWorlds');
	var matViewUniformLocation = gl.getUniformLocation(program, 'mView');
	var matProjUniformLocation = gl.getUniformLocation(program, 'mProj');

	const worldMatrices = [];
	for(var i = 0; i < MAX_MATRICES; i++){
		const matrix = new Float32Array(16);
		mat4.fromTranslation(matrix, vec3.fromValues(0,3*i,0));
		worldMatrices.push(...matrix);
	}
	
	var viewMatrix = new Float32Array(16);
	var projMatrix = new Float32Array(16);
	
	let distance = 5;
	let cameraPosition = [0, 0, distance];

	mat4.lookAt(viewMatrix, cameraPosition, [0, 0, 0], [0, 1, 0]);
	mat4.perspective(projMatrix, glMatrix.toRadian(90), canvas.width/canvas.height, 0.1, 1000.0) 
	
	gl.uniformMatrix4fv(matWorldsUniformLocation, gl.FALSE, worldMatrices);
	gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);
	gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, projMatrix);

	var identityMatrix = new Float32Array(16);
	mat4.identity(identityMatrix);
	
	
	//
	// USER INPUT
	//
	
	// Set the initial rotation angles
    let angleX = 0;
    let angleY = 0;
    let lastX;
    let lastY;
    let dragging = false;

	canvas.addEventListener('wheel', (e) => {
		//exp / log adjust the camera distance
		distance *= (e.deltaY > 0 ? 1.2 : 1/1.2);

		// Update the view matrix with the new angles
		vec3.rotateX(cameraPosition, [0, 0, distance], [0, 0, 0], -angleX);
		vec3.rotateY(cameraPosition, cameraPosition, [0, 0, 0], -angleY);
		mat4.lookAt(viewMatrix, cameraPosition, [0, 0, 0], [0, 1, 0]);
		
		gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);
	});

    // Mouse down event
    canvas.addEventListener('mousedown', (e) => {
		dragging = true;
		lastX = e.clientX;
		lastY = e.clientY;
    });

    // Mouse up event
    canvas.addEventListener('mouseup', () => {
		dragging = false;
    });
	
	// Mouse move event
    canvas.addEventListener('mousemove', (e) => {
		if (dragging) {
		const deltaX = e.clientX - lastX;
		const deltaY = e.clientY - lastY;
		
		angleY += deltaX * 0.01;
		angleX += deltaY * 0.01;
		angleX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, angleX));

		// Update the view matrix with the new angles
		vec3.rotateX(cameraPosition, [0, 0, distance], [0, 0, 0], -angleX);
		vec3.rotateY(cameraPosition, cameraPosition, [0, 0, 0], -angleY);
		mat4.lookAt(viewMatrix, cameraPosition, [0, 0, 0], [0, 1, 0]);
		
		gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);
		
		lastX = e.clientX;
		lastY = e.clientY;
		}
    });

	//
	// RENDER LOOP
	//
	
	var loop = function () {
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		for(var i = 0; i < 5; i++){
			gl.bindTexture(gl.TEXTURE_2D, textures[i%textures.length]);
			gl.vertexAttrib1f(boxIndexAttribLocation, i);
			gl.bindBuffer(gl.ARRAY_BUFFER, boxVertexBufferObject);
			gl.drawElements(gl.TRIANGLES, boxIndices.length, gl.UNSIGNED_SHORT, 0);
		}

		requestAnimationFrame(loop);
	};
	requestAnimationFrame(loop);
	
	
}

