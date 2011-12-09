console.log("Loaded Physico");
Physico = {
    canvas: null,
    menu: null,
    runningNativeMode: false,
    guiScript: "gui",
    prefix: "/",
    init: function () {
        console.log("startingLoad");
        document.body.innerHTML = "";
		s = document.createElement("script")
		s.src = Physico.prefix + "js/libs/cl/CLFramework.js"	
        s.onload = function()	{
            CL.Framework.runningNative = true;
			CL.Framework.modulesDir = Physico.prefix + "js/libs/cl/"
            console.log("loadingGUI");
			CL.Framework.init(function() {
				CL.DynamicFileLoader.addLib("screen", Physico.prefix + "css/screen.css")
				CL.DynamicFileLoader.addLib("glMatrix", Physico.prefix + "js/glMatrix-0.9.5.min.js")
				CL.DynamicFileLoader.addLib(Physico.guiScript, Physico.prefix + "js/" + Physico.guiScript + ".js")
                CL.DynamicFileLoader.processQueue(function(){GUI.init(Physico.loadShaders)})
			});
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
        document.body.appendChild(this.canvas);  
    },
    getMouseCoords: function(e) {
        return {
            x: e.clientX + document.body.scrollLeft + document.body.clientLeft,
            y: e.clientY + document.body.scrollTop + document.body.clientTop
        }
    },
    loadShaders: function()	{
        if (Physico.runningNativeMode == false) {
            CL.ShaderLoader.loadFiles(
            Physico.webglshaders, 
            CL.ShaderLoader.appendShaders, 
            function(url) {
                alert("Couldn't load " + url + " component ... shutting down.")
            },
            Physico.completeLoad
            );
        }   else {            
            var iframe = document.createElement("IFRAME");
            iframe.setAttribute("src", "call:loadShaders");
            document.documentElement.appendChild(iframe);
            iframe.parentNode.removeChild(iframe);
            iframe = null;
        }
    },
	completeLoad: function()	{	
	        Physico.createElements();
	        Physico.GL.init(function() {             
                Physico.ObjectList.addObject();
                Physico.Animator.AnimationTimer = new Physico.Timer();
                Physico.Animator.AnimationTimer.animate = function () {
                    for (obj in Physico.ObjectList.objects) Physico.ObjectList.objects[obj].applicator.appForces(obj);
                }
                if (typeof(GUI.finishLoad) == "function") GUI.finishLoad();
                Physico.Animator.AnimationTimer.startTimer(Physico.Animator.AnimationTimer.animate);
                console.log("doneLoading")
                Physico.GL.drawScene();
            });
	},
    timers: [],
    timerc: 0,
    globalTimerStop: 0,
    globalTimerException: -1,
    scene: [0, 0, -15],
    rotate: [0, 0, 0],
    sceneDrag: null,
    sceneZoom: 1,
    webglshaders: [['webgl/fragment', 'x-shader/x-fragment'], ['webgl/vertex', 'x-shader/x-vertex']]
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
    addObjects: function(many, id)  {
        id = id ? id : 0;
        if (id == 0)    console.log("startedAddingObjects");
        if (id < many)  {
            Physico.ObjectList.addObject();
            Physico.ObjectList.addObjects(many, id+1)
        }   else console.log("addedObjects");
    },
    addObject: function (x, y, z, c) {
        q = Math.round(Math.random() * 4);
        if (!x) {
            x = Math.round(Math.random() * 25);
            if(q == 2 || q == 3) x = -x;
        }
        if (!y) {
            y = Math.round(Math.random() * 25);
            if(q == 3 || q == 4) y = -y;
        }
        z = !z ? Math.random() * 50 : z;
        c = !c ? Math.round(Math.random() * (Physico.ObjectList.colors.length - 1)) : c;
        t = Math.round(Math.random() * (Physico.GL.textureSources.length - 1));
        this.objects[this.head] = new Physico.Object(this.head, x, y, z, c, t);
        this.head++;
        console.log("addedObject");
    },
    removeObject: function()	{
        this.objects[0].terminate();
        this.objects.splice(0, 1);
        this.head--;
        console.log("addedObject");
    },
    removeObjects: function(many)   {
        id = id ? id : 0;
        if (id < many)  {
            Physico.ObjectList.removeObject();
            Physico.ObjectList.removeObjects(many, id+1)
        }   else console.log("removedObjects");
	},
    scrambleObjects: function(){
        for(o in this.objects) this.objects[o].scramble();
    }, 
    colors: [
        ["Blue", [0, 0.2, 1.0, 1.0]],
        ["Gray", [0.6, 0.6, 0.6, 1.0]],
        ["Red", [0.8, 0.0, 0.0, 1.0]],
        ["Green", [0.0, 0.9, 0.0, 1.0]]
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

Physico.Object = function(number, x, y, z, c, t) {
    
    this.id = number;
    this.x = x;
    this.y = y;
    this.z = z;
    this.color = c;
    this.texture = t;
    this.idBuffer = Physico.GL.getIDBuffer(this.id);
    
    this.scramble = function()	{
        q = Math.round(Math.random() * 4); 
        this.x = Math.round(Math.random() * 25);
        if(q == 2 || q == 3) this.x = -this.x;
        this.y = Math.round(Math.random() * 25);
        if(q == 3 || q == 4) this.y = -this.y;
        this.z = Math.random() * 50
    }

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
    pMatrix: null,
    mvMatrix: null,
	lb: null,
	lbc: null,
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
            this.pMatrix = mat4.create()
            this.mvMatrix = mat4.create()
            this.gl = this.canvas.getContext("experimental-webgl");
	        this.updateViewport();
            this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA)
            this.gl.depthFunc(this.gl.LESS);
        } catch (e) {
        }
        if (!this.gl) {
            alert("Could not initialise WebGL, sorry :-(");
        }
    } ,
    updateViewport: function()    {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        if (this.gl)    {        
            this.gl.viewportWidth = this.canvas.width;
            this.gl.viewportHeight = this.canvas.height;
        }
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
        this.shaderProgram.vertexTextureAttribute = this.gl.getAttribLocation(this.shaderProgram, "vertexTexture");
        this.gl.enableVertexAttribArray(this.shaderProgram.vertexTextureAttribute);
        this.shaderProgram.vertexNormalAttribute = this.gl.getAttribLocation(this.shaderProgram, "vertexNormal");
        this.gl.enableVertexAttribArray(this.shaderProgram.vertexNormalAttribute);

        this.shaderProgram.pMatrixUniform = this.gl.getUniformLocation(this.shaderProgram, "uPMatrix");
        this.shaderProgram.mvMatrixUniform = this.gl.getUniformLocation(this.shaderProgram, "uMVMatrix");
        this.shaderProgram.nMatrixUniform = this.gl.getUniformLocation(this.shaderProgram, "uNMatrix");
        this.shaderProgram.uSamplerUniform = this.gl.getUniformLocation(this.shaderProgram, "uSampler");
        this.shaderProgram.lightingDirectionUniform = this.gl.getUniformLocation(this.shaderProgram, "uLightingDirection");
        this.shaderProgram.isObject = this.gl.getUniformLocation(this.shaderProgram, "isObject");
        this.shaderProgram.useTexture = this.gl.getUniformLocation(this.shaderProgram, "useTexture");
        this.shaderProgram.isWall = this.gl.getUniformLocation(this.shaderProgram, "isWall");
    },
    initBuffer: function(){
        var latitudeBands = 30;
          var longitudeBands = 30;
          var radius = 1;

           var vertexPositionData = [];
           var normalData = [];
           var textureCoordData = [];
            var colorData = [];
           for (var latNumber = 0; latNumber <= latitudeBands; latNumber++) {
             var theta = latNumber * Math.PI / latitudeBands;
             var sinTheta = Math.sin(theta);
             var cosTheta = Math.cos(theta);

             for (var longNumber = 0; longNumber <= longitudeBands; longNumber++) {
               var phi = longNumber * 2 * Math.PI / longitudeBands;
               var sinPhi = Math.sin(phi);
               var cosPhi = Math.cos(phi);

               var x = cosPhi * sinTheta;
               var y = cosTheta;
               var z = sinPhi * sinTheta;
               var u = 1 - (longNumber / longitudeBands);
               var v = 1 - (latNumber / latitudeBands);

               normalData.push(x);
               normalData.push(y);
               normalData.push(z);
               textureCoordData.push(u);
               textureCoordData.push(v);
               vertexPositionData.push(radius * x);
               vertexPositionData.push(radius * y);
               vertexPositionData.push(radius * z);
             }
           }
         var indexData = [];
            for (var latNumber = 0; latNumber < latitudeBands; latNumber++) {
              for (var longNumber = 0; longNumber < longitudeBands; longNumber++) {
                var first = (latNumber * (longitudeBands + 1)) + longNumber;
                var second = first + longitudeBands + 1;
                indexData.push(first);
                indexData.push(second);
                indexData.push(first + 1);

                indexData.push(second);
                indexData.push(second + 1);
                indexData.push(first + 1);
              }
            }
        var vertices = [];
        for (j = 0; j < Physico.ObjectList.colors.length; j++)  {
            vertices[j] = [];
            for(i = 0; i <= latitudeBands; i++)
                for(k = 0; k <= longitudeBands; k++)
                    for(p = 0; p < 3; p++)
                        vertices[j].push(Physico.ObjectList.colors[j][1][0], Physico.ObjectList.colors[j][1][1], Physico.ObjectList.colors[j][1][2], Physico.ObjectList.colors[j][1][3])

        }
        vertices[j] = [];
        var c = 1;
        for(i = 0; i <= latitudeBands; i++)
            for(k = 0; k <= longitudeBands; k++)
                    if (i < latitudeBands / 3)  vertices[j].push(1, 0, 0, 1)
                    else if (i < latitudeBands / 3 * 2)  vertices[j].push(0.5, 0.6, 0, 1)
                    else vertices[j].push(0, 0, 1, 1)
        for(i = 0; i <= latitudeBands * longitudeBands; i++) for(p = 0; p < 2; p ++) vertices[j].push(0, 0, 0, 0)
        this.cBuffer = [];

        for(j = 0; j < Physico.ObjectList.colors.length + 1; j++)   {
            this.cBuffer[j] = this.gl.createBuffer();
            v = new Float32Array(vertices[j]);

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cBuffer[j]);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, v, this.gl.STATIC_DRAW);
            this.cBuffer[j].numItems = latitudeBands * longitudeBands;
            this.cBuffer[j].itemSize = 4;
        }

        this.pBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.pBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertexPositionData), this.gl.STATIC_DRAW);
        this.pBuffer.itemSize = 3;
        this.pBuffer.numItems = vertexPositionData.length / 3;


        this.nBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.nBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(normalData), this.gl.STATIC_DRAW);
        this.nBuffer.itemSize = 3;
        this.nBuffer.numItems = normalData.length / 3;
        
        this.tBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.tBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(textureCoordData), this.gl.STATIC_DRAW);
        this.tBuffer.itemSize = 2;
        this.tBuffer.numItems = normalData.length / 2;


         this.iBuffer = this.gl.createBuffer();
          this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.iBuffer);
          this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), this.gl.STATIC_DRAW);
          this.iBuffer.itemSize = 3;
          this.iBuffer.numItems = indexData.length;

      var lightingDirection = [
        2, -3, -3
      ];
      var adjustedLD = vec3.create();
      vec3.normalize(lightingDirection, adjustedLD);
      vec3.scale(adjustedLD, -1);
      this.gl.uniform3fv(this.shaderProgram.lightingDirectionUniform, adjustedLD);

        this.normalMatrix = mat3.create();

        this.pbBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.pbBuffer);
        var angle, sin, cos;
        vertices = [];
        for(i = 0; i <= 100; i++)   {
            angle = Math.PI * 2 * (i / 100);
            sin = Math.sin(angle);
            cos = Math.cos(angle);
            vertices.push(cos, sin, 0);
            vertices.push(cos + 0.25, sin + 0.25, 0);
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
            vertices.push(0.0, 0.7, 1.0, 1.0);
            vertices.push(0.0, 0.7, 1.0, 0.0);
        }
        this.cbBuffer.numItems = 202;
        vertices = new Float32Array(vertices);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
        this.cbBuffer.itemSize = 4;

	    this.lb = this.gl.createBuffer();
	    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.lb) 
	    vertices = new Float32Array([
		-9999, -9999, 0,
		-9999, 9999, 0,
		9999, -9999, 0,
		9999, 9999, 0,
	    ])
	    this.lb.itemSize = 3;
	    this.lb.numItems = 4;
	    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW)

	    this.lbc = this.gl.createBuffer();
	    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.lbc)
	    vertices = [];
	    for(i = 1; i <= 4; i++)	vertices.push(1, 1, 1, 0.1)
	    vertices = new Float32Array(vertices)
	    this.lbc.itemSize = 4;
	    this.lbc.numItems = 4;
	    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW)
    },
    getIDBuffer: function(id) {
        var vertices = [];
        var latitudeBands = 30;
        var longitudeBands = 30;
	var r = 0, g = 0, b = 0;
	b = id;
	g = parseInt(b / 255);
	console.log(g)
	b = b - g * 255;
	g = g - r * 255;
        for(i = 0; i <= latitudeBands; i++)
            for(k = 0; k <= longitudeBands; k++)
                for(p = 0; p < 3; p++)
                    vertices.push(r / 255, g / 255, b / 255, 1);
        var cBuffer;
        cBuffer = this.gl.createBuffer();
        v = new Float32Array(vertices);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, cBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, v, this.gl.STATIC_DRAW);
        cBuffer.numItems = latitudeBands * longitudeBands;
        cBuffer.itemSize = 4;

        return cBuffer;
    },
    drawScene: function() {
        var exec = function(){

            this.gl.viewport(0, 0, window.innerWidth, window.innerHeight);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);
            this.gl.clear(this.gl.DEPTH_BUFFER_BIT);

            mat4.perspective(30, window.innerWidth / window.innerHeight, 0.1, 9999.0, this.pMatrix);
            mat4.identity(this.mvMatrix);
            mat4.toInverseMat3(this.mvMatrix, this.normalMatrix);
            mat3.transpose(this.normalMatrix);
            this.gl.uniformMatrix3fv(this.shaderProgram.nMatrixUniform, false, this.normalMatrix);

            mat4.translate(this.mvMatrix, Physico.scene)
            mat4.rotate(this.mvMatrix, Physico.rotate[0], [1, 0, 0]);
            mat4.rotate(this.mvMatrix, Physico.rotate[1], [0, 1, 0]);
            mat4.rotate(this.mvMatrix, Physico.rotate[2], [0, 0, 1]);

            this.printPlanes();
            this.printObjects();

            if (this.readTick)  {
                var pixels = new Uint8Array(8);
                x = this.readQueue.x
                y = window.innerHeight-this.readQueue.y
                this.gl.readPixels( this.readQueue.x, window.innerHeight - this.readQueue.y, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels)
                this.readTick = 0;
		if (pixels[3] == 255)	{
		console.log(pixels[0] * 255 * 255 + pixels[1] * 255 + pixels[2]);
			//mat4.translate(this.mvMatrix, [-Physico.scene[0], -Physico.scene[1], -Physico.scene[2]])
			//mat4.rotate(this.mvMatrix, -Physico.rotate[0], [1, 0, 0]);
			//mat4.rotate(this.mvMatrix, -Physico.rotate[1], [0, 1, 0]);
			//mat4.rotate(this.mvMatrix, -Physico.rotate[2], [0, 0, 1]);
			var currentObjectClicked = pixels[0] * 255 * 255 + pixels[1] * 255 + pixels[2];
			if (this.selectedObject == currentObjectClicked)	this.selectedObject = null;
			else this.selectedObject = currentObjectClicked;
			//this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.pbBuffer);
			//this.gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, this.pbBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
			//this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cbBuffer);
			//this.gl.vertexAttribPointer(this.shaderProgram.vertexColorAttribute, this.cbBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
			//this.setMatrixUniforms()
			//this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.pbBuffer.itemSize);
		}
            }

            window.requestAnimFrame(Physico.GL.drawScene)
        }.bind(Physico.GL)
        return exec();

    },
selectedObject: null,
    printPlanes: function() {
        this.gl.disable(this.gl.DEPTH_TEST);
        this.gl.uniform1i(this.shaderProgram.isWall, 1);
        this.gl.uniform1i(this.shaderProgram.isObject, 0);

	    this.gl.enable(this.gl.BLEND);
	    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.lb);
		this.gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, this.lb.itemSize, this.gl.FLOAT, false, 0, 0);
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.lbc);
		this.gl.vertexAttribPointer(this.shaderProgram.vertexColorAttribute, this.lbc.itemSIze, this.gl.FLOAT, false, 0, 0);
		this.setMatrixUniforms();
		this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.lb.numItems);
		mat4.rotate(this.mvMatrix, Math.PI / 2, [0, 1, 0])
		this.setMatrixUniforms();
		this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.lb.numItems);
		mat4.rotate(this.mvMatrix, -Math.PI / 2, [0, 1, 0])
		mat4.rotate(this.mvMatrix, Math.PI / 2, [1, 0, 0])
		this.setMatrixUniforms();
		this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.lb.numItems);
		mat4.rotate(this.mvMatrix, -Math.PI / 2, [1, 0, 0])

		this.gl.disable(this.gl.BLEND)
		this.gl.disable(this.gl.DEPTH_TEST);
        this.gl.uniform1i(this.shaderProgram.isWall, 0);
    },
    printObjects: function()    {
        var buffer = null;
        for (obj in Physico.ObjectList.objects) {
            this.gl.uniform1i(this.shaderProgram.isObject, 1);
            this.gl.uniform1i(this.shaderProgram.useTexture, this.useTextures)
            if(obj > 0) pobj = Physico.ObjectList.objects[obj - 1]
	        else { pobj={}; pobj.x=pobj.y=pobj.z=0; }

            obj = Physico.ObjectList.objects[obj];
            mat4.translate(this.mvMatrix, [obj.x - pobj.x, obj.y - pobj.y, -obj.z + pobj.z]);
            this.gl.enable(this.gl.DEPTH_TEST)
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.pBuffer);
            this.gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, this.pBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

	    var sel = this.selectedObject != null && this.selectedObject == obj.id
            if (Physico.patriotMode || sel)    {
                color = Physico.ObjectList.colors.length;
            }
            else color = obj.color; 
            if (this.readTick)  {
                this.gl.uniform1i(this.shaderProgram.isObject, 0);
                this.gl.uniform1i(this.shaderProgram.useTexture, 0);
                buffer = obj.idBuffer;
            } else buffer = this.cBuffer[color]

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
            this.gl.vertexAttribPointer(this.shaderProgram.vertexColorAttribute, buffer.itemSize, this.gl.FLOAT, false, 0, 0);
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.tBuffer);
            this.gl.vertexAttribPointer(this.shaderProgram.vertexTextureAttribute, this.tBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.nBuffer);
            this.gl.vertexAttribPointer(this.shaderProgram.vertexNormalAttribute, this.nBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

            this.gl.activeTexture(this.gl.TEXTURE0);
            tex = Physico.trollMode || sel ? this.trolltextures : this.textures[obj.texture]            

	    if (Physico.trollMode || sel) {
                    texid = obj.texture
                    while ( texid > this.trolltextures.length - 1)
                        texid -= this.trolltextures.length
                    if (texid < 0) texid = 0;
                    tex = tex[texid];
            }

            this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
            this.gl.uniform1i(this.shaderProgram.uSamplerUniform, 0);

            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.iBuffer);
            this.setMatrixUniforms();
            this.gl.drawElements(this.gl.TRIANGLES, this.iBuffer.numItems, this.gl.UNSIGNED_SHORT, 0);


            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cbBuffer);
            this.gl.vertexAttribPointer(this.shaderProgram.vertexColorAttribute, this.cbBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
        }
    },
    useTextures: 1,
    textures: [],
    texturePrefix: 'textures/',
    textureSources: null,
    clasicPrefix: 'clasicmode/',
    trolltextures: [],
    trolltextureSources: null,
    trollPrefix: 'trollmode/',
    toggleTroll: function() {
        if (Physico.trollMode) Physico.trollMode = 0
        else Physico.trollMode = 1;
    },
    togglePatriot: function()   {
        if (Physico.patriotMode)    Physico.patriotMode = 0;
        else Physico.patriotMode = 1;
    },
    toggleTextures: function()   {
        if (Physico.GL.useTextures)    Physico.GL.useTextures = 0;
        else Physico.GL.useTextures = 1;
    },
    initTextures: function(cont)    {
        if (!cont)  {            
            CL.DynamicFileLoader.addLib('clasictextures', Physico.prefix + this.texturePrefix + this.clasicPrefix + 'list.js')
            CL.DynamicFileLoader.addLib('trolltextures', Physico.prefix + this.texturePrefix + this.trollPrefix + 'list.js')
            CL.DynamicFileLoader.processQueue(function(){Physico.GL.initTextures(true)})
        }   else    {
            this.textureSources = this.processTextureSourceInput(this.textureSources)
            this.trolltextureSources = this.processTextureSourceInput(this.trolltextureSources)
            this.loadTextures()
        }
    },
    processTextureSourceInput: function(tex)  {
        var r = [];
        for(var i = 0; i < tex.number; i++)  {
            r[i] = tex.files[i]; 
        }
        return r;
    },
    loadTextures: function()    {
        for(i = 0; i < this.textureSources.length; i++) {            
            this.textures[i] = this.gl.createTexture();
            this.textures[i].image = new Image();
            this.textures[i].image.id = i;
            this.textures[i].image.onload = function()  {
                Physico.GL.loadTexture(this.id, 'textures');
            }
            this.textures[i].image.src = Physico.prefix + this.texturePrefix + this.clasicPrefix + this.textureSources[i];
        }
        for(i = 0; i < this.trolltextureSources.length; i++)    {
            this.trolltextures[i] = this.gl.createTexture();
            this.trolltextures[i].image = new Image();
            this.trolltextures[i].image.id = i;
            this.trolltextures[i].image.onload = function()  {
                Physico.GL.loadTexture(this.id, 'trolltextures');
            }
            this.trolltextures[i].image.src = Physico.prefix + this.texturePrefix + this.trollPrefix + this.trolltextureSources[i];
        }    
        this.callback();
    },
    loadTexture: function(tex, from) {
        texture = this[from][tex];
        image = texture.image
            var canvas = document.createElement("canvas")
            canvas.width = 1024
            canvas.height = 512
            var ctx = canvas.getContext("2d")
            ctx.fillStyle = ctx.createPattern(image, "repeat")
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            image = canvas 
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    },
    readQueue: {
        "x": 0,
        "y": 0
    },
    readTick: 0,
    getPixels: function(o)    {
        this.readQueue = o;
        this.readTick = 1;
    },
    init: function(cb)    {
        this.callback = cb;
        this.initGL();
        this.initShaders();
        this.initBuffer();
        this.initTextures();
    }
}

if (typeof(Function.prototype.bind) != "function")
    Function.prototype.bind = function(scope) {
          var _function = this;

          return function() {
            return _function.apply(scope, arguments);
          }
    }
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          window.oRequestAnimationFrame      ||
          window.msRequestAnimationFrame     ||
          function(/* function */ callback, /* DOMElement */ element){
            window.setTimeout(callback, 10);
          };
})();


window.onresize = function()    {
    Physico.GL.updateViewport();
}
