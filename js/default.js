if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {
        "use strict";
        if (this === void 0 || this === null) {
            throw new TypeError();
        }
        var t = Object(this);
        var len = t.length >>> 0;
        if (len === 0) {
            return -1;
        }
        var n = 0;
        if (arguments.length > 0) {
            n = Number(arguments[1]);
            if (n !== n) { // shortcut for verifying if it's NaN
                n = 0;
            } else if (n !== 0 && n !== Infinity && n !== -Infinity) {
                n = (n > 0 || -1) * Math.floor(Math.abs(n));
            }
        }
        if (n >= len) {
            return -1;
        }
        var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
        for (; k < len; k++) {
            if (k in t && t[k] === searchElement) {
                return k;
            }
        }
        return -1;
    }
}

Physico = {
    canvas: null,
    menu: null,
    init: function () {
        Physico.createElements();
        this.ObjectList.addObject();
        this.gl = new Physico.GL();
        Physico.start();
        return this;
    },
    start: function(){        
        Physico.Animator.AnimationTimer = new Physico.Timer();
        Physico.Animator.AnimationTimer.animate = function () {
            for (obj in Physico.ObjectList.objects) Physico.ObjectList.objects[obj].applicator.appForces(obj);
            Physico.gl.drawScene();
        }
        Physico.Animator.AnimationTimer.startTimer(Physico.Animator.AnimationTimer.animate);
    },
    globalFreeze: function(timer)    {
        this.globalTimerStop = 1
        this.globalTimerException = timer;
    },
    globalUnFreeze: function()  {
        this.globalTimerStop = 0
        this.globalTimerException = -1
    },
    createElements: function()  {
      
        menu = document.createElement("menu")
        menu.type = "context";
        menu.id = "contextmenu";
        document.body.appendChild(menu);
        
        cml= {
            "Add Object": Physico.ObjectList.addObject,
            "Remove Object": Physico.ObjectList.removeObject
        }
        
        for(obj in cml) {
            elem = document.createElement("command")
            elem.label = obj;
            elem.onclick = cml[obj] + "()";
            menu.appendChild(elem)
        }
    
    
        this.canvas = document.createElement("canvas"); 
        this.canvas.style.position = "absolute"
        this.canvas.style.top = 0;
        this.canvas.style.left = 0;
        this.canvas.style.zindex = 1;
        this.canvas.contextmenu = "contextmenu"
        this.canvas.onmousemove = function(e)    {
            if (Physico.sceneDrag == null) return;
            m = Physico.getMouseCoords(e);
            Physico.scene[0] += (m.x - Physico.sceneDrag.x) / 250;
            Physico.scene[1] -= (m.y - Physico.sceneDrag.y) / 250;
            console.log(Physico.scene);
        }
        this.canvas.onmousedown = function(e)   {
            Physico.sceneDrag = Physico.getMouseCoords(e);            
            this.style.cursor = "pointer"
        }
        this.canvas.onmouseup = function(e) {
            Physico.sceneDrag = null
            this.style.cursor = "default"
        }
        this.canvas.ondblclick = function() {
            if (Physico.sceneZoom)  {
                Physico.scene[2] += 50
                Physico.sceneZoom = 0;
            } else {
                Physico.scene[2] -= 50
                Physico.sceneZoom = 1;
            }
        }
        document.onkeydown = function(e) {
            switch(e.keyCode)   {
                case 33: Physico.scene[2] -= 1;
                        break;
                case 34: Physico.scene[2] += 1;
                        break;
                case 37: Physico.scene[0] -= 1;
                        break;
                case 38: Physico.scene[1] += 1;
                        break;
                case 39: Physico.scene[0] += 1;
                        break;
                case 40: Physico.scene[1] -= 1;
                        break;
                case 46: Physico.scene = [0, 0, -15]
                        break;
            }
        }
        var mousewheelevt=(/Firefox/i.test(navigator.userAgent))? "DOMMouseScroll" : "mousewheel" 
        document.addEventListener(mousewheelevt, function(e){
            console.log(e)
            Physico.scene[2] -= (e.wheelDeltaY ? e.wheelDeltaY / 250 : -e.detail / 3);
            console.log(e.wheelDeltaY)
            e.preventDefault();
        }, false)

        document.body.appendChild(this.canvas);  
    },
    getMouseCoords: function(e) {
        return {
            x: e.clientX + document.body.scrollLeft + document.body.clientLeft,
            y: e.clientY + document.body.scrollTop + document.body.clientTop
        }
    },
    timers: [],
    timerc: 0,
    globalTimerStop: 0,
    globalTimerException: -1,
    scene: [0, 0, -15],
    sceneDrag: null,
    sceneZoom: 1
}
Physico.Animator = { }

Physico.Timer = function () {

    this.timerid = Physico.timerc
    Physico.timers[Physico.timerc] = this
    Physico.timerc++;

    this.timer = null
    this.working = 0
    this.startTimer = function () {
        this.working = 1;var args = [];Array.prototype.push.apply(args, arguments);
        func = args.shift();
        args = JSON.stringify(args); 
        Physico.timers[this.timerid].repeat(func, args);
    }
    this.startTimer.bind(this)
    this.repeat = function (func, args) {
        if (!this.working) return;argv = JSON.parse(args);
        if (!Physico.globalTimerStop ||this.timerid == Physico.globalTimerException)   func(argv);
        this.timer = setTimeout("Physico.timers[" + this.timerid + "].repeat(" + func + ", '" + args + "')", 1);
    }.bind(this)
    this.stopTimer = function () {
        this.working = 0;
        clearTimeout(this.timer);
        this.timer = null
    }.bind(this)
}


Physico.dragTimer = function (){ };
Physico.dragTimer.prototype = new Physico.Timer;
Physico.dragTimer.prototype.dragging = 0
Physico.dragTimer.prototype.dragDistance = 0
Physico.dragTimer.prototype.dragTime = 0
Physico.dragTimer.prototype.acDD = 0
Physico.dragTimer.prototype.drag = function () {
    this.dragTime++;
}

Physico.ObjectList = {
    objects: [],
    head: 0,
    addObjects: function(many)  {
      for(i = 0; i < many; i++) this.addObject();  
    },
    addObject: function () {
        this.objects[this.head] = new Physico.Object(this.head);
        this.head++;
    },
    removeObject: function()	{
	this.objects[0].terminate();
	this.objects.splice(0, 1);
	this.head--;
    },
    scrambleObjects: function(){
	for(o in this.objects) this.objects[o].scramble();
    }, 
    colors: [
        [0, 0, 0, 0.7],
        [256, 0, 0, 0.7],
        [0, 256, 0, 0.7],
        [0, 0, 256, 0.7],
        [150, 0, 150, 0.7],
        [256, 0, 256, 0.7],
        [256, 150, 0, 0.7],
        [200, 200, 200, 0.7]
    ]
}

Physico.Animator.Force = function(ix, iy, r, rx, ry, rlx, rly){
    this.isRed = r ? 1 : 0; 
    this.resolveInput = function(i)	{
	    return typeof(i) == "number" ? i : i[0] + (Math.random() * (i[1] - i[0]));
    }
    ix = this.resolveInput(ix);
    iy = this.resolveInput(iy);
    rx = this.resolveInput(rx);
    ry = this.resolveInput(ry);
    rlx = this.resolveInput(rlx);
    rly = this.resolveInput(rly);
    

    this.x = ix;this.ix = ix;this.rx = rx ? rx : 0;this.rsx = this.rx > 0 ? 1 : 0;this.rlx = rlx ? rlx : 0;
    this.y = iy;this.iy = iy;this.ry = ry ? ry : 0;this.rsy = this.ry > 0 ? 1 : 0;this.rly = rly ? rly : 0;
    this.act = function (object) {
        this.sx = this.x > 0 ? 1 : 0;
        this.sy = this.y > 0 ? 1 : 0;
        if ((this.x >= 0 && this.sx) || (this.x <= 0 && !this.sx)) {
            object.x += this.x; 
            if (this.isRed && (this.rsx && this.x > this.rlx || !this.rsx && this.x < this.rlx)) this.x -= rx;
            
        }
        if ((this.y >= 0 && this.sy) || (this.y <= 0 && !this.sy)) {
            object.y += this.y;
            if (this.isRed && (this.rsy && this.y > this.rly || !this.rsy && this.y < this.rly)) this.y -= ry;
        }
        
    }.bind(this)

    this.reset = function()	{
	this.x = this.ix;
	this.y = this.iy;
    }
    this.reset.bind(this)

}

Physico.Animator.Applicator = function(object) {
    this.attObj = object;
    this.forces = [], this.fc = 0
    this.attForce = function (ix, iy, r, name, rx, ry, rlx, rly) {
		this.forces[this.fc] = [];this.forces[this.fc]["name"] = name;
		this.forces[this.fc]["force"] = new Physico.Animator.Force(ix, iy, r, rx, ry, rlx, rly);
		this.fc++;
    }
    this.attForce.bind(this)
    this.remForce = function (name) {
        for (i = 0; i <= this.fc; i++)
            if (this.forces[i]["name"] == name) {
                this.forces.splice(i, 1);
                this.fc--;
        }
    }.bind(this)
    this.appForces = function (args) {
	for(force in this.forces)	{
		this.forces[force]["force"].act(this.attObj);
	}
        this.attObj.move();
    }.bind(this);
    this.resetForces = function()	{
	for(force in this.forces) this.forces[force].force.reset(); 
    }.bind(this)
    this.hasForce = function(name)	{
	for(f in this.forces) if (this.forces[f]["name"] == name) return true;
	return false;
    }
    this.checkEnvForces = function()	{
	for(force in Physico.Animator.envForcesActive) if (Physico.Animator.envForcesActive[force]) this.attForce(
					Physico.Animator.EnvForces[force].x, 
					Physico.Animator.EnvForces[force].y, 
					Physico.Animator.EnvForces[force].r, 
					force, 
					Physico.Animator.EnvForces[force].rx, 
					Physico.Animator.EnvForces[force].ry, 
					Physico.Animator.EnvForces[force].rlx, 
					Physico.Animator.EnvForces[force].rly);
    }
}

Physico.Animator.EnvForces = {
    "gravity": {
        "x": 0,
        "y": 0,
        "r": 1,
        "rx": 0,
        "ry": 0.1,
        "rly": -9.8, 
	"rlx": 0
    },
    "wind": {
        "x": 0,
        "y": 0,
        "r": 1,
        "rx": [-0.1, -0.5],
        "ry": 0,
        "rlx": [3, 10],
        "rly": 0
    },
    "repulse" : {
        "x": 0,
        "y": 0,
        "r": 1,
        "rx": 0,
        "ry": -0.1,
        "rly": 9.8, 
	"rlx": 0        
    },
    "inverse-wind": {
        "x": 0,
        "y": 0,
        "r": 1,
        "rx": [0.1, 0.5],
        "ry": 0,
        "rlx": [-3, -10],
        "rly": 0
    },
}

Physico.Animator.envForcesActive = [];
Physico.Animator.ToggleEnvForce = function (force) {
	if (Physico.Animator.envForcesActive[force])	{
		Physico.Animator.envForcesActive[force] = 0;
		for(obj in Physico.ObjectList.objects) Physico.ObjectList.objects[obj].applicator.remForce(force);
	}	else {
		Physico.Animator.envForcesActive[force] = 1;
		for (obj in Physico.ObjectList.objects) 
			if (!Physico.ObjectList.objects[obj].applicator.hasForce(force))
			Physico.ObjectList.objects[obj].applicator.attForce(
					Physico.Animator.EnvForces[force].x, 
					Physico.Animator.EnvForces[force].y, 
					Physico.Animator.EnvForces[force].r, 
					force, 
					Physico.Animator.EnvForces[force].rx, 
					Physico.Animator.EnvForces[force].ry, 
					Physico.Animator.EnvForces[force].rlx, 
					Physico.Animator.EnvForces[force].rly);
	}
}

Physico.Object = function(number) {
    
    this.id = number;
    
    this.scramble = function()	{
	this.x = Math.round(70 + Math.random() * (window.innerWidth - 100));
	this.y = Math.round(70 + Math.random() * (window.innerHeight - 100));
        this.z = Math.random() * 10
    }.bind(this)

    this.scramble(); 
    this.ix = this.x;this.rx = this.x - window.innerHeight / 2 
    this.iy = this.y;this.ry = this.y - window.innerHeight / 2 
    this.color = Physico.ObjectList.colors[Math.round(Math.random() * Physico.ObjectList.colors.length)];
	
    this.attachedTimer = null;
    this.move = function(x, y) {this.rx = x - window.innerHeight / 2;this.ry = y - window.innerHeight / 2}
    
    this.applicator = new Physico.Animator.Applicator(this);
    this.applicator.checkEnvForces();
    this.terminate = function()	{
        this.aplicator = null;
        this.attachedTimer = null;
    }
};

Physico.GL = function() {   
    canvas = Physico.canvas;
    gl = null;shaderProgram = null;pBuffer = cBuffer = pbBuffer = cbBuffer = null;
    pMatrix = mat4.create();mvMatrix = mat4.create();
    
    this.l = {
        colors: [],
        offsets: [],
        head: 0
    }
    
    this.getShader = function(gl, id) {
        var shaderScript = document.getElementById(id);
        if (!shaderScript) {
            return null;
        }

        var str = "";
        var k = shaderScript.firstChild;
        while (k) {
            if (k.nodeType == 3) {
                str += k.textContent;
            }
            k = k.nextSibling;
        }

        var shader;
        if (shaderScript.type == "x-shader/x-fragment") {
            shader = gl.createShader(gl.FRAGMENT_SHADER);
        } else if (shaderScript.type == "x-shader/x-vertex") {
            shader = gl.createShader(gl.VERTEX_SHADER);
        } else {
            return null;
        }

        gl.shaderSource(shader, str);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(shader));
            return null;
        }

        return shader;
    }
    this.setMatrixUniforms = function() {
        gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
    }

    
    this.initGL = function(){        
        try {
            gl = canvas.getContext("experimental-webgl");
            this.updateViewport();
        } catch (e) {
        }
        if (!gl) {
            alert("Could not initialise WebGL, sorry :-(");
        }
    }    
    this.updateViewport = function()    {
        canvas.width = window.innerWidth;canvas.height = window.innerHeight;
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;        
    }
    this.initShaders = function(){        
        var fragmentShader = this.getShader(gl, "shader-fs");
        var vertexShader = this.getShader(gl, "shader-vs");

        shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            alert("Could not initialise shaders");
        }

        gl.useProgram(shaderProgram);

        shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "vertexPosition");
        gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
        shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "vertexColor");
        gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

        shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
        shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    }
    this.initBuffer = function(){
        pBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
        var angle; var vertices = [0, 0, 0]
        for(i = 0; i <= 100; i++)   {
            angle = Math.PI * 2 * (i / 100);
            vertices.push(Math.cos(angle), Math.sin(angle), 0);
        }
        pBuffer.numItems = 102
        vertices = new Float32Array(vertices);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        pBuffer.itemSize = 3
        
       
        
        cBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
        var vertices = [0.2, 0.5, 1.0, 0.5];
        for(i = 0; i <= 100; i++)   {
            vertices.push(0.0, 0.2, 0.7, 1.0);
        }
        cBuffer.numItems = 102;
        vertices = new Float32Array(vertices);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        cBuffer.itemSize = 4;    
        
        pbBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, pbBuffer);
        var angle, sin, cos; vertices = [];
        for(i = 0; i <= 100; i++)   {
            angle = Math.PI * 2 * (i / 100); sin = Math.sin(angle); cos = Math.cos(angle);
            vertices.push(cos, sin, 0);
            vertices.push(cos + 0.025, sin + 0.025, 0);
        }
        pbBuffer.numItems = 202;
        vertices = new Float32Array(vertices);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        pbBuffer.itemSize = 3
        cbBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, cbBuffer);
        var angle; vertices = []
        for(i = 0; i <= 100; i++)   {
            vertices.push(0.0, 0.0, 0.0, 1.0);
            vertices.push(0.0, 0.0, 0.0, 0.7);
        }
        cbBuffer.numItems = 202;
        vertices = new Float32Array(vertices);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        cbBuffer.itemSize = 4;
    }
    this.drawScene = function() {
        gl.viewport(0, 0, window.innerWidth, window.innerHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LESS);    
        mat4.perspective(45, window.innerWidth / window.innerHeight, 0.1, 1000.0, pMatrix);        
        mat4.identity(mvMatrix);
        mat4.translate(mvMatrix, Physico.scene)
        for (obj in Physico.ObjectList.objects) {
            obj = Physico.ObjectList.objects[obj];
//            mat4.translate(mvMatrix, [0, 0, 0]);
            mat4.translate(mvMatrix, [(obj.x - window.innerWidth / 2) / 25, (obj.y - window.innerHeight / 2) / 150, -obj.z]);
            
            gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
            gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, pBuffer.itemSize, gl.FLOAT, false, 0, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
            gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, cBuffer.itemSize, gl.FLOAT, false, 0, 0);
            this.setMatrixUniforms();
            gl.drawArrays(gl.TRIANGLE_FAN, 0, pBuffer.numItems);
            
            gl.bindBuffer(gl.ARRAY_BUFFER, pbBuffer);
            gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, pbBuffer.itemSize, gl.FLOAT, false, 0, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, cbBuffer);
            gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, cbBuffer.itemSize, gl.FLOAT, false, 0, 0);
            this.setMatrixUniforms();
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, pbBuffer.numItems);
            
            
            mat4.translate(mvMatrix, [(obj.x - window.innerWidth / 2) / 25 * -1, (obj.y - window.innerHeight / 2) / 150 * -1, obj.z]);
        }        
    }
        
    this.initGL();this.initShaders();this.initBuffer();      
    
}

window.onresize = function()    {
    Physico.gl.updateViewport();
}