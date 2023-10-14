const vertexShaderSource = [
'precision mediump float;',
'',
'attribute vec3 vertPosition;',
'attribute vec2 vertTexCoord;',
'varying vec2 fragTexCoord;',
'uniform mat4 mWorld;',
'uniform mat4 mView;',
'uniform mat4 mProj;',
'',
'void main()',
'{',
' fragTexCoord = vertTexCoord;',
' gl_Position = mProj * mView * mWorld * vec4(vertPosition, 1.0);',
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

var initGL = function () {
	
	//
	// SETUP WEBGL ENVIRONMENT
	//
	
	console.log('This is Working');
	
	const canvas = document.getElementById("webgl-canvas");
	const gl = canvas.getContext("webgl");
	
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
	// SPECIFY VERTICES AND INDICES
	//
	
	var boxVertices = 
	[ // X, Y, Z           U, V
		// Top
		-1.0, 1.0, -1.0,   0, 0,
		-1.0, 1.0, 1.0,    0, 1,
		1.0, 1.0, 1.0,     1, 1,
		1.0, 1.0, -1.0,    1, 0,

		// Left
		-1.0, 1.0, 1.0,    1, 1,
		-1.0, -1.0, 1.0,   0, 1,
		-1.0, -1.0, -1.0,  0, 0,
		-1.0, 1.0, -1.0,   1, 0,

		// Right
		1.0, 1.0, 1.0,     1, 1,
		1.0, -1.0, 1.0,    0, 1,
		1.0, -1.0, -1.0,   0, 0,
		1.0, 1.0, -1.0,    1, 0,

		// Front
		1.0, 1.0, 1.0,     1, 1,
		1.0, -1.0, 1.0,    1, 0,
		-1.0, -1.0, 1.0,   0, 0,
		-1.0, 1.0, 1.0,    0, 1,

		// Back
		1.0, 1.0, -1.0,    1, 1,
		1.0, -1.0, -1.0,   1, 0,
		-1.0, -1.0, -1.0,  0, 0,
		-1.0, 1.0, -1.0,   0, 1,

		// Bottom
		-1.0, -1.0, -1.0,  0, 0,
		-1.0, -1.0, 1.0,   0, 1,
		1.0, -1.0, 1.0,    1, 1,
		1.0, -1.0, -1.0,   1, 0,
	];

	var boxIndices =
	[
		// Top
		0, 1, 2,
		0, 2, 3,

		// Left
		5, 4, 6,
		6, 4, 7,

		// Right
		8, 9, 10,
		8, 10, 11,

		// Front
		13, 12, 14,
		15, 14, 12,

		// Back
		16, 17, 18,
		16, 18, 19,

		// Bottom
		21, 20, 22,
		22, 20, 23
	];
	
	
	//
	// CREATING BUFFERS AND ATTRIBUTE LOCATIONS
	//
	
	var boxVertexBufferObject = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, boxVertexBufferObject);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(boxVertices), gl.STATIC_DRAW);
	
	var boxIndexBufferObject = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boxIndexBufferObject);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(boxIndices), gl.STATIC_DRAW);
	
	var positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
	var texCoordAttribLocation = gl.getAttribLocation(program, 'vertTexCoord');
	
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
	// CREATE TEXTURE
	//
	
	var texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	
	gl.texImage2D(
		gl.TEXTURE_2D,						//target
		0,									//level
		gl.RGBA,							//internalformat
		103,								//width
		138,								//height
		0,									//border must be 0
		gl.RGBA,							//format
		gl.UNSIGNED_BYTE,					//type
		document.getElementById('spades13')	//source
	);
	
	gl.bindTexture(gl.TEXTURE_2D, null);
	
	gl.useProgram(program);
	
	
	//
	// CREATE MATRICES
	//
	
	var matWorldUniformLocation = gl.getUniformLocation(program, 'mWorld');
	var matViewUniformLocation = gl.getUniformLocation(program, 'mView');
	var matProjUniformLocation = gl.getUniformLocation(program, 'mProj');
	
	var worldMatrix = new Float32Array(16);
	var viewMatrix = new Float32Array(16);
	var projMatrix = new Float32Array(16);
	
	mat4.identity(worldMatrix);
	mat4.lookAt(viewMatrix, [0, 0, -5], [0, 0, 0], [0, 1, 0]);
	mat4.perspective(projMatrix, glMatrix.toRadian(45), canvas.width/canvas.height, 0.1, 1000.0) 
	
	gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
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
		// Update the model-view matrix with the new angles
		mat4.rotate(worldMatrix, identityMatrix, angleY, [0, 1, 0]);
		mat4.rotate(worldMatrix, worldMatrix, angleX, [1, 0, 0]);
		gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
		
		lastX = e.clientX;
		lastY = e.clientY;
		}
    });
	
	
	//
	// RENDER LOOP
	//
	
	var loop = function () {
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.drawElements(gl.TRIANGLES, boxIndices.length, gl.UNSIGNED_SHORT, 0);
		
		gl.bindTexture(gl.TEXTURE_2D, boxTexture);
		gl.activeTexture(gl.TEXTURE0);
		
		requestAnimationFrame(loop);
	};
	requestAnimationFrame(loop);
	
	
}