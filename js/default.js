﻿Physico = {
    canvas: null,
    menu: null,
    init: function () {
		s = document.createElement("script")
		s.src = "/js/libs/cl/cl/CLFramework.js"
		s.onload = function()	{
			CL.Framework.modulesDir = "/js/libs/cl/cl/"
			CL.Framework.init(Physico.loadShaders);
			document.head.removeChild(this)
		}
		document.head.appendChild(s)
        return this;
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
                case 33:
                    Physico.scene[2] -= 1;
                    break;
                case 34:
                    Physico.scene[2] += 1;
                    break;
                case 37:
                    Physico.scene[0] -= 1;
                    break;
                case 38:
                    Physico.scene[1] += 1;
                    break;
                case 39:
                    Physico.scene[0] += 1;
                    break;
                case 40:
                    Physico.scene[1] -= 1;
                    break;
                case 46:
                    Physico.scene = [0, 0, -15]
                    break;
            }
        }
        var mousewheelevt=(/Firefox/i.test(navigator.userAgent))? "DOMMouseScroll" : "mousewheel" 
        document.addEventListener(mousewheelevt, function(e){
            Physico.scene[2] -= (e.wheelDeltaY ? e.wheelDeltaY / 250 : -e.detail / 3);
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
    loadShaders: function()	{
        CL.ShaderLoader.loadFiles(
            Physico.webglshaders, 
            CL.ShaderLoader.appendShaders, 
            function(url) {
                alert("Couldn't load " + url + " component ... shutting down.")
            },
            Physico.completeLoad
            );
    },
	completeLoad: function()	{	
	        Physico.createElements();
	        Physico.GL.init();
	        Physico.ObjectList.addObject();
	        Physico.Animator.AnimationTimer = new Physico.Timer();
	        Physico.Animator.AnimationTimer.animate = function () {
	            for (obj in Physico.ObjectList.objects) Physico.ObjectList.objects[obj].applicator.appForces(obj);
	            Physico.GL.drawScene();
	        }
	        Physico.Animator.AnimationTimer.startTimer(Physico.Animator.AnimationTimer.animate);
	},
    timers: [],
    timerc: 0,
    globalTimerStop: 0,
    globalTimerException: -1,
    scene: [0, 0, -15],
    sceneDrag: null,
    sceneZoom: 1,
    webglshaders: [['/webgl/fragment', 'x-shader/x-fragment'], ['/webgl/vertex', 'x-shader/x-vertex']]
}
Physico.Animator = { }

Physico.Timer = function () {

    this.timerid = Physico.timerc
    Physico.timers[Physico.timerc] = this
    Physico.timerc++;

    this.timer = null
    this.working = 0
    this.startTimer = function () {
        this.working = 1;
        var args = [];
        Array.prototype.push.apply(args, arguments);
        func = args.shift();
        args = JSON.stringify(args); 
        Physico.timers[this.timerid].repeat(func, args);
    }
    this.repeat = function (func, args) {
        if (!this.working) return;
        argv = JSON.parse(args);
        if (!Physico.globalTimerStop ||this.timerid == Physico.globalTimerException)   func(argv);
        this.timer = setTimeout("Physico.timers[" + this.timerid + "].repeat(" + func + ", '" + args + "')", 1);
    }
    this.stopTimer = function () {
        this.working = 0;
        clearTimeout(this.timer);
        this.timer = null
    }
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
    [[0.5, 0.7, 1.0, 0.7], [0, 0.2, 0.7, 0.9]],
    [[0.2, 0.2, 0.2, 0.7], [0, 0, 0, 0.9]],
    [[0.7, 0.0, 0.02, 0.7], [0.2, 0.0, 0.0, 1.0]],
    [[0.2, 0.7, 0.0, 0.7], [0.0, 0.3, 0.0, 1.0]]
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
    

    this.x = ix;
    this.ix = ix;
    this.rx = rx ? rx : 0;
    this.rsx = this.rx > 0 ? 1 : 0;
    this.rlx = rlx ? rlx : 0;
    this.y = iy;
    this.iy = iy;
    this.ry = ry ? ry : 0;
    this.rsy = this.ry > 0 ? 1 : 0;
    this.rly = rly ? rly : 0;
    this.act = function (object) {
        this.sx = this.x > 0 ? 1 : 0;
        this.sy = this.y > 0 ? 1 : 0;
        if ((this.x >= 0 && this.sx) || (this.x <= 0 && !this.sx)) {
            object.x += this.x / 50; 
            if (this.isRed && (this.rsx && this.x > this.rlx || !this.rsx && this.x < this.rlx)) this.x -= rx;
            
        }
        if ((this.y >= 0 && this.sy) || (this.y <= 0 && !this.sy)) {
            object.y += this.y / 50;
            if (this.isRed && (this.rsy && this.y > this.rly || !this.rsy && this.y < this.rly)) this.y -= ry;
        }
        
    }

    this.reset = function()	{
        this.x = this.ix;
        this.y = this.iy;
    }

}

Physico.Animator.Applicator = function(object) {
    this.attObj = object;
    this.forces = [], 
    this.attForce = function (ix, iy, r, name, rx, ry, rlx, rly) {
        fc = this.forces.length
        this.forces[fc] = [];
        this.forces[fc]["name"] = name;
        this.forces[fc]["force"] = new Physico.Animator.Force(ix, iy, r, rx, ry, rlx, rly);
    }
    this.remForce = function (name) {
        for (i = 0; i < this.forces.length; i++){
	           if (this.forces[i]["name"] == name) {
                this.forces.splice(i, 1);
            }
        }
    }
    this.appForces = function (args) {
        for(force in this.forces)	{
            this.forces[force]["force"].act(this.attObj);
        }
    }
    this.resetForces = function()	{
        for(force in this.forces) this.forces[force].force.reset(); 
    }
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
        "rlx": [3, 15],
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
    }
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
    this.color = Math.round(Math.random() * (Physico.ObjectList.colors.length - 1));
    
    this.scramble = function()	{
        q = Math.round(Math.random() * 4); 
        this.x = Math.round(Math.random() * 25);
        if(q == 2 || q == 3) this.x = -this.x;
        this.y = Math.round(Math.random() * 25);
        if(q == 3 || q == 4) this.y = -this.y;
        this.z = Math.random() * 10
    }

    this.scramble(); 
    this.ix = this.x;
    this.iy = this.y;
	
    this.attachedTimer = null;
    
    this.applicator = new Physico.Animator.Applicator(this);
    this.applicator.checkEnvForces();
    this.terminate = function()	{
        this.aplicator = null;
        this.attachedTimer = null;
    }
};

Physico.GL = {                        
    canvas: Physico.canvas,
    gl: null,
    shaderProgram: null,
    pBuffer: null,
    cBuffer: null,
    pbBuffer: null,
    cbBuffer: null,
    pMatrix: mat4.create(),
    mvMatrix: mat4.create(),       
    getShader: function(gl, id) {
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
            alert(this.gl.getShaderInfoLog(shader));
            return null;
        }

        return shader;
    },
    setMatrixUniforms: function() {
        this.gl.uniformMatrix4fv(this.shaderProgram.pMatrixUniform, false, this.pMatrix);
        this.gl.uniformMatrix4fv(this.shaderProgram.mvMatrixUniform, false, this.mvMatrix);
    },    
    initGL: function(){        
        try {
            this.canvas = Physico.canvas
            this.gl = this.canvas.getContext("experimental-webgl");
            this.updateViewport();
        } catch (e) {
        }
        if (!this.gl) {
            alert("Could not initialise WebGL, sorry :-(");
        }
    } ,  
    updateViewport: function()    {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.gl.viewportWidth = this.canvas.width;
        this.gl.viewportHeight = this.canvas.height;        
    },
    initShaders: function(){        
        var fragmentShader = this.getShader(this.gl, "fragment");
        var vertexShader = this.getShader(this.gl, "vertex");
        this.shaderProgram = this.gl.createProgram();
        this.gl.attachShader(this.shaderProgram, vertexShader);
        this.gl.attachShader(this.shaderProgram, fragmentShader);
        this.gl.linkProgram(this.shaderProgram);

        if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS)) {
            alert("Could not initialise shaders");
        }

        this.gl.useProgram(this.shaderProgram);

        this.shaderProgram.vertexPositionAttribute = this.gl.getAttribLocation(this.shaderProgram, "vertexPosition");
        this.gl.enableVertexAttribArray(this.shaderProgram.vertexPositionAttribute);
        this.shaderProgram.vertexColorAttribute = this.gl.getAttribLocation(this.shaderProgram, "vertexColor");
        this.gl.enableVertexAttribArray(this.shaderProgram.vertexColorAttribute);

        this.shaderProgram.pMatrixUniform = this.gl.getUniformLocation(this.shaderProgram, "uPMatrix");
        this.shaderProgram.mvMatrixUniform = this.gl.getUniformLocation(this.shaderProgram, "uMVMatrix");
    },
    initBuffer: function(){
        this.pBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.pBuffer);
        var angle;
        var vertices = [0, 0, 0]
        for(i = 0; i <= 100; i++)   {
            angle = Math.PI * 2 * (i / 100);
            vertices.push(Math.cos(angle), Math.sin(angle), 0);
        }
        this.pBuffer.numItems = 102
        vertices = new Float32Array(vertices);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
        this.pBuffer.itemSize = 3
        
       
        
        var vertices = [];
        for (j = 0; j < Physico.ObjectList.colors.length; j++)  {
            vertices[j] = [];
            vertices[j].push(Physico.ObjectList.colors[j][0][0], Physico.ObjectList.colors[j][0][1], Physico.ObjectList.colors[j][0][2], Physico.ObjectList.colors[j][0][3])
            for(i = 0; i <= 100; i++)   {
                vertices[j].push(Physico.ObjectList.colors[j][1][0], Physico.ObjectList.colors[j][1][1], Physico.ObjectList.colors[j][1][2], Physico.ObjectList.colors[j][1][3])
            }
        }
        this.cBuffer = [];
        for(j = 0; j < Physico.ObjectList.colors.length; j++)   {
            this.cBuffer[j] = this.gl.createBuffer();
            v = new Float32Array(vertices[j]);
            
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cBuffer[j]);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, v, this.gl.STATIC_DRAW);      
            this.cBuffer[j].numItems = 102;
            this.cBuffer[j].itemSize = 4;      
        }
        
        this.pbBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.pbBuffer);
        var angle, sin, cos;
        vertices = [];
        for(i = 0; i <= 100; i++)   {
            angle = Math.PI * 2 * (i / 100);
            sin = Math.sin(angle);
            cos = Math.cos(angle);
            vertices.push(cos, sin, 0);
            vertices.push(cos + 0.025, sin + 0.025, 0);
        }
        this.pbBuffer.numItems = 202;
        vertices = new Float32Array(vertices);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
        this.pbBuffer.itemSize = 3
        this.cbBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cbBuffer);
        var angle;
        vertices = []
        for(i = 0; i <= 100; i++)   {
            vertices.push(0.0, 0.0, 0.0, 1.0);
            vertices.push(0.0, 0.0, 0.0, 0.7);
        }
        this.cbBuffer.numItems = 202;
        vertices = new Float32Array(vertices);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
        this.cbBuffer.itemSize = 4;
    },
    drawScene: function() {
        this.gl.viewport(0, 0, window.innerWidth, window.innerHeight);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LESS);    
        mat4.perspective(45, window.innerWidth / window.innerHeight, 0.1, 1000.0, this.pMatrix);        
        mat4.identity(this.mvMatrix);
        mat4.translate(this.mvMatrix, Physico.scene)
        for (obj in Physico.ObjectList.objects) {
            if(obj) pobj = Physico.ObjectList.objects[obj - 1]
            obj = Physico.ObjectList.objects[obj];
            mat4.translate(this.mvMatrix, [obj.x, obj.y, -obj.z]);
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.pBuffer);
            this.gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, this.pBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cBuffer[obj.color]);
            this.gl.vertexAttribPointer(this.shaderProgram.vertexColorAttribute, this.cBuffer[obj.color].itemSize, this.gl.FLOAT, false, 0, 0);
            this.setMatrixUniforms();
            this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, this.pBuffer.numItems);
            
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.pbBuffer);
            this.gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, this.pbBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cbBuffer);
            this.gl.vertexAttribPointer(this.shaderProgram.vertexColorAttribute, this.cbBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
            this.setMatrixUniforms();
            this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.pbBuffer.numItems);
            
            
            mat4.translate(this.mvMatrix, [-obj.x, -obj.y, obj.z]);
        }        
    },
    init: function()    {
        this.initGL();
        this.initShaders();
        this.initBuffer();
    }    
}


window.onresize = function()    {
    Physico.GL.updateViewport();
}