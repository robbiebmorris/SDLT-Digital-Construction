document.getElementById("canvas");
window.addEventListener("mousedown", mouseDown);
window.addEventListener("mouseup", mouseUp);
window.addEventListener("mousemove", mouseMove, false);
window.addEventListener("keydown", keyDown);
var ctx = canvas.getContext("2d");

var SQUARE_SIZE = 30
var XSCALE = 1
var YSCALE = 1

var centerX = 0
var centerY = 0

selected = []
points = []
lines = []
arcs = []
segments = []
history = []

function point(x, y, isSelected, color, r){
  this.x = x
  this.y = y
  this.color = color
  this.r = r
  this.add = function() {
    plotPoint(this.x, this.y, this.color, this.r)
  }
  points.push(this)
  if (isSelected){
    selected.push(this)
  }
  this.distance = function(gx,gy) {
    return Math.sqrt(Math.pow(this.x-gx,2) + Math.pow(this.y-gy,2))
  }
}


function line(m, b, color, width){
  this.m = m
  this.b = b
  this.color = color
  this.width = width
  lines.push(this)
}

//where p is center point
function arc(p, r, theta1, theta2, color) {
  this.p = p
  this.r = r
  this.theta1 = theta1
  this.theta2 = theta2
  this.color = color
  this.add = function(){
    if(selected.indexOf(this) > -1){
      plotArc(this.p, this.r, this.theta1, this.theta2, color, [5,2])
    } else {
      plotArc(this.p, this.r, this.theta1, this.theta2, color)
    }
  }
  arcs.push(this)
}

function segment(a, b, color, width){
  this.a = a
  this.b = b
  this.color = color
  this.width = width
  this.getSlope = function(){
      return (b.y-a.y)/(b.x-a.x)
  }
  this.getIntercept = function(){
    var m = this.getSlope()
    return a.y-m*a.x
  }
  this.getLength = function(){
    return Math.sqrt(Math.pow(this.a.x-this.b.x)+Math.pow(this.a.y-this.b.y))
  }
  this.distance = function(gx,gy){
    var m = this.getSlope()
    var bb = this.getIntercept()

    var pim = 1/-m
    var pib = gy-(pim*gx)
    if (m === 0){
      pix = gx
      piy = this.a.y
    } else if(Math.abs(m) === Infinity){
      var pix = this.a.x
      var piy = gy
    } else{
      var pix = (pib-bb)/(m-pim) //((gy-(gx/m)-bb)*m)/(m*m-1)
      var piy = pim*pix+pib
    }
    
    if(((this.a.x<=pix&&pix<=this.b.x)|| (this.b.x<=pix&&pix<=this.a.x))&&((this.a.y<=piy&&piy<=this.b.y)||(this.b.y<=piy&&piy<=this.a.y))){
      var d =  Math.sqrt(Math.pow(gx-pix,2) + Math.pow(gy-piy,2))
      return d
    } else {
      var d = Math.min(this.a.distance(gx,gy),this.b.distance(gx,gy))
      return d
    }
  }
  this.add = function(){
      if(selected.indexOf(this) > -1){
        plotLine(this.a.x, this.a.y, this.b.x, this.b.y, color, width, [5,2])
      } else {
        plotLine(this.a.x, this.a.y, this.b.x, this.b.y, color, width)
      }
  }
  segments.push(this)
}

function drawLine(x1, y1, x2, y2, color, width, dash) {
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.strokeStyle = color
  ctx.lineWidth = width
  if (dash !== undefined) {
    ctx.setLineDash(dash)
  }
  ctx.stroke()
  ctx.restore()
}

function convertX(x) {
  return ((x - xmin - centerX) / (xmax - xmin) * width)
}

function revertX(x) {
  return x*(xmax-xmin)/width+centerX+xmin
}

function convertY(y) {
  return ((ymax - y - centerY) / (ymax - ymin) * height)
}

function revertY(y) {
  return y*(ymin-ymax)/height-centerY-ymin
}

function addAxis() {
  var TICK = 5
  drawLine(convertX(0), 0, convertX(0), height, 'black', 1)
  drawLine(0, convertY(0), width, convertY(0), 'black', 1)
  for (var i = Math.floor(xmin+centerX); i <= Math.floor(xmax+centerX); i += XSCALE) {
    drawLine(convertX(i), convertY(0) + TICK, convertX(i), convertY(0) - TICK)
  }
  for (var i = Math.floor(ymin-centerY); i <= Math.floor(ymax-centerY); i += YSCALE) {
    drawLine(convertX(0) - TICK, convertY(i), convertX(0) + TICK, convertY(i))
  }
}

function addGrid() {
  for (var i = Math.floor(ymin-centerY); i <= Math.floor(ymax-centerY); i += YSCALE) {
    drawLine(0, convertY(i), width, convertY(i), 'lightgrey', 1)
  }
  for (var i = Math.floor(xmin+centerX); i <= Math.floor(xmax+centerX); i += XSCALE) {
    drawLine(convertX(i), height, convertX(i), 0, 'lightgrey', 1)
  }
}

function addPoints(){
  for (const p of points){
    p.add()
  }
}

function addLines(){
  for (const l of lines){
    plotLine(xmin+centerX, l.m*(xmin+centerX)+l.b, xmax+centerX, l.m*(xmax+centerX)+l.b, l.color, l.width)
  }
}

function addSegments(){
  for (const s of segments){
    s.add()
  }
}

function addArcs(){
  for (const a of arcs) {
    a.add()
  }
}

function plotPoint(x, y, color, r) {
  if (r === undefined) {
    r = 2
  }
  if (color === undefined) {
    color = 'black'
  }
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(convertX(x), convertY(y), r, 0, 2 * Math.PI)
  ctx.fill()
}

function plotLine(x1, y1, x2, y2, color, width, dash) {
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(convertX(x1), convertY(y1))
  ctx.lineTo(convertX(x2), convertY(y2))
  ctx.strokeStyle = color
  ctx.lineWidth = width
  if (dash !== undefined) {
    ctx.setLineDash(dash)
  }
  ctx.stroke()
  ctx.restore()
}

function plotArc(p, r, theta1, theta2, color) {
  if (r === undefined) {
    r = 2
  }
  if (color === undefined) {
    color = 'black'
  }
  ctx.beginPath()
  ctx.strokeStyle = color
  ctx.arc(convertX(p.x), convertY(p.y), r*SQUARE_SIZE, theta1, theta2)
  ctx.stroke()
  ctx.restore()
}

function snap(x) {
  if ((x-Math.round(x))*(x-Math.round(x))<.01){
    return Math.round(x)
  }
  else {
    return x
  }
}

function checkPoint(x,y){
  for (const p of points){
    if (nx*nx-2*convertX(p.x)*nx+convertX(p.x)*convertX(p.x)<36
          &&(ny*ny-2*convertY(p.y)*ny+convertY(p.y)*convertY(p.y)<36)){
      return p
    }
  }
}

function mouseDown(evt) {
  x = evt.clientX
  y = evt.clientY
  ocx = centerX
  ocy = centerY
  if (evt.buttons === 2) {
    for (const p of points){
      if (nx*nx-2*convertX(p.x)*nx+convertX(p.x)*convertX(p.x)<36
          &&(ny*ny-2*convertY(p.y)*ny+convertY(p.y)*convertY(p.y)<36)){
        s = new segment(p, new point(revertX(x), revertY(y), true))
        selected.push(s)
        return 
      }
    }
    new point(snap(revertX(x)), snap(revertY(y)))
  }

  if (evt.buttons === 1){
    for (const p of points){
      if (p.distance(revertX(x),revertY(y)) < .2){
        selected.push(p)
      }
    }
    for (const s of segments){
      if (s.distance(revertX(x),revertY(y)) < .2){
        selected.push(s)
      }
    }
  }
  onresize()
}

function mouseUp() {
  selected = []
  for (const a of arcs) {
    plotArc(a.p, a.r, a.theta, undefined)
  }
}

function mouseMove(evt) {
  nx = evt.clientX
  ny = evt.clientY
  gx = revertX(nx)
  gy = revertY(ny) 

  if (evt.buttons === 1) {
    if (selected.length > 0){
      for (const p of selected){
        p.x = snap(gx)
        p.y = snap(gy)
      }
    }
    else{
      centerX = (x-nx)/SQUARE_SIZE+ocx
      centerY = (y-ny)/SQUARE_SIZE+ocy
    }
  }
  if (evt.buttons === 2){
    for (const p of selected){
      p.x = snap(gx)
      p.y = snap(gy)
    }
  }
  onresize()
}

var point1

function keyDown(evt){

  if (evt.key == "Backspace") {
    if (selected.length > 0) {
      
      //delete selected points
      for(const s of selected){
        let pointIndex = points.indexOf(s)
        let segmentIndex = segments.indexOf(s)
        let arcIndex = arcs.indexOf(s)

        if (pointIndex > -1){
          points.splice(pointIndex,1)
        }
        
        if (segmentIndex > -1){
          segments.splice(segmentIndex,1)
        }

        if (arcIndex > -1) {
          arcs.splice(arcIndex, 1)
        }
      }
    }  
    selected = []
  }

  if (evt.key === "l") {
    new segment(new point(snap(gx), snap(gy)), new point(snap(gx), snap(gy + 1)))
  }

  if (evt.key === "c") {
    new arc(new point(snap(gx), snap(gy)), document.getElementById("radius").value, 0, 2*Math.PI, "black")
  }

  if (evt.key === "w") {
    new arc(new point(snap(gx), snap(gy)), document.getElementById("radius").value, 5*Math.PI/4, 7*Math.PI/4, "black")
  }

  if (evt.key === "d") {
    new arc(new point(snap(gx), snap(gy)), document.getElementById("radius").value, 7*Math.PI/4, Math.PI/4, "black")
  }

  if (evt.key === "a") {
    new arc(new point(snap(gx), snap(gy)), document.getElementById("radius").value, 3*Math.PI/4, 5*Math.PI/4, "black")
  }

  if (evt.key === "s") {
    new arc(new point(snap(gx), snap(gy)), document.getElementById("radius").value, Math.PI/4, 3*Math.PI/4, "black")
  }

  onresize()
}

window.onresize = function(){
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
  xmin = -width/SQUARE_SIZE/2
  xmax = width/SQUARE_SIZE/2
  ymin = -height/SQUARE_SIZE/2
  ymax = height/SQUARE_SIZE/2
  
  addGrid()
  addAxis()
  addPoints()
  addLines()
  addSegments()
  addArcs()

  ctx.font = "12px Arial"
  ctx.fillStyle = "black"
  ctx.textAlign = "center"
  ctx.fillText("X: ", width/19, height - 35)
  ctx.fillText("Y: ", width/19, height - 20)

  ctx.fillText("Number of Points: " + points.length, width/15, height - 55)
  ctx.fillText("Points Selected: " + selected.length, width/15, height - 70)


  ctx.fillText(Math.round(gx * 1000) / 1000, width/14, height -35)
  ctx.fillText(Math.round(gy * 1000) / 1000, width/14, height -20)
}

onresize()
