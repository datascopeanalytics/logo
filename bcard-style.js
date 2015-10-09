// utility function for adding buttons to the DOM, not related to drawing:
function insertAfter(newNode, referenceNode) {
  return referenceNode.parentNode.insertBefore(
    newNode, referenceNode.nextSibling);
}
var colors = {
  "First Tangerine to Die": "#FF6000",
  "Limoncello Devito": "#F3ED00",
  "Paris on Prozac": "#00CC66",
  "Arctic Azimuth Azure": "#008EF5",
  "Bruiser Woods": "#FF15AB",
  "Dabbs Greer": "#DDDDDD",
  "Damn Near Black": "#141414"
};
var invert = false;
var foregroundColor = colors['First Tangerine to Die'];
var backgroundColor = "#FFFFFF";

// takes an item with bounds, returns an irregular polygon to put around it
var GenerativePoly = function(text, passedColor, passedBox) {
  console.log("drew it");
  var textlayer = new Layer();
  textlayer.addChild(text);

  // DEBUG: turn this to 'true' to quickly see how the darn thing is built!
  this.displayConstruction = false;

  // configure bounding box
  var adjust = 20;
  var padding = 15;
  var border = new Layer();
  var bounds = new Rectangle({
    point: [text.bounds.x-adjust/2-padding, text.bounds.y-padding/2],
    size: [text.bounds.width+adjust+padding*2, text.bounds.height+padding]
  });
  var box = new Path.Rectangle(bounds,0);
  box.strokeColor = 'black';
  border.addChild(box);

  var gridlines = new Layer();
  // box around text
  gridlines.addChild(new Path.Line(new Point(0, bounds.y),
                                   new Point(1000, bounds.y)));

  gridlines.addChild(new Path.Line(new Point(bounds.x, 0),
                                   new Point(bounds.x, 1000)));

  gridlines.addChild(new Path.Line(new Point(bounds.x+bounds.width,0),
                                   new Point(bounds.x+bounds.width,1000)));

  gridlines.addChild(new Path.Line(new Point(0,bounds.y+bounds.height),
                                   new Point(1000,bounds.y+bounds.height)));

  var leftmid = new Point(bounds.x,bounds.y+bounds.height/2);
  var rightmid = new Point(bounds.x+bounds.width,bounds.y+bounds.height/2);

  var topleft = new Point(bounds.x, bounds.y);
  var topright = new Point(bounds.x+bounds.width, bounds.y);
  var bottomright = new Point(bounds.x+bounds.width, bounds.y+bounds.height);
  var bottomleft = new Point(bounds.x, bounds.y+bounds.height);

  for(var ang=45;ang>0;ang=ang-5){
    gridlines.addChild(lineFrom(topleft, 90+ang, 500));
    gridlines.addChild(lineFrom(bottomright, -90+ang, 500));
    gridlines.addChild(lineFrom(topright, ang+45, 500));
    gridlines.addChild(lineFrom(bottomleft, ang-135, 500));
  }
  for(var ang=45;ang>0;ang=ang-2){
    gridlines.addChild(lineFrom(topright, 180+ang, 500));
    gridlines.addChild(lineFrom(bottomleft, ang, 500));
    gridlines.addChild(lineFrom(bottomright, 180-ang, 500));
    gridlines.addChild(lineFrom(topleft, -ang, 500));
  }

  var offset = 35;
  var outerBorder = new Path.Rectangle(new Rectangle(
    new Point(bounds.x-.75*offset,
              bounds.y-offset),
    new Size(bounds.width+1.5*offset,
             bounds.height+2*offset)));
  border.addChild(outerBorder);
  var intersects = {};
  for(var i=0; i<gridlines.children.length; i++){
    gridlines.children[i].strokeColor = 'blue';
    for(var j=0; j<gridlines.children.length; j++){
      if(i !== j){
        var intersect = gridlines.children[i].getIntersections(
          gridlines.children[j]);
        for(var k=0; k<intersect.length; k++){
          var point = intersect[k].point;
          if(outerBorder.contains(point)){
            intersects[point] = point;
          }
        }
      }
    }
  }
  outerBorder.strokeColor = 'red';
  var circles = new Layer();

  for(key in intersects){
    var circ = new Path.Circle(new Point(intersects[key]), 3);
    circ.fillColor = '#000000';
    circles.addChild(circ);
  }

  // choose vertices from the set of candidate intersection points from the construction lines.
  var points = circles.children.slice(0);
  var vertices = [];
  var circlelayer = new Layer();
  for(var i=0; i<9; i++){
    var rand = Math.floor(Math.random()*points.length);
    points[rand].fillColor = 'yellow';
    c2 = new Path.Ellipse({
      center: pathCenter(points[rand]),
      radius: [bounds.height*.7, bounds.height*.7*.7],
      strokeColor: 'black',
    });

    vertices.push(pathCenter(points[rand]));
    circlelayer.addChild(c2);

    var newpoints = [];
    for(var j=0; j < points.length; j++){
      // remove the things that are too close to the point we picked

      if(!c2.contains(pathCenter(points[j]))) {
        newpoints.push(points[j]);
      }
    }
    points = newpoints;
  }
  var polarVertices = [];
  for(var i=0; i<vertices.length; i++){
    var polarCoords = cart_to_polar(vertices[i],bounds.center);
    polarCoords.x = vertices[i].x;
    polarCoords.y = vertices[i].y;
    polarVertices.push(polarCoords);
  }
  polarVertices.sort(theta_comparator);

  var shapeLayer = new Layer();
  var shape = new Path();
  shape.fillColor = passedColor;

  for(var i=0; i<polarVertices.length; i++){
    shape.add(polar_to_point(polarVertices[i]));
  }
  shape.add(polar_to_point(polarVertices[0]));

  shapeLayer.moveBelow(textlayer);

  if(!this.displayConstruction){
    gridlines.remove();
    circles.remove();
    circlelayer.remove();
    border.remove();
  }

  // center that shit
  shape.position = centroid(passedBox);
  text.position = centroid(passedBox);

  return shape;
}

function polar_to_point(polarCoord){
  return new Point(polarCoord.x, polarCoord.y);
}

function line_between_points(a,b) {
  var start = new Point(a.x, a.y);
  var end = new Point(b.x, b.y);
  var line = new Path.Line(start,end);
  return line;
}

function theta_comparator(a,b){
  if (a.theta < b.theta)
    return -1;
  if (a.theta > b.theta)
    return 1;
  // a must be equal to b
  return 0;
};
function cart_to_polar(point,center){
  var dx = point.x-center.x;
  var dy = point.y-center.y;
  var r = ((dx)^2 + (dy)^2)^.5;
  var theta = Math.atan2(dy,dx);
  return {r:r, theta:theta};
}

// takes a PathItem, gets its bounds and finds the center of them
function pathCenter(pathitem){
  var bounds = pathitem.bounds;
  return new Point(bounds.x+bounds.width/2, bounds.y+bounds.height/2);
}

// takes a starting point, angle, and length, and returns a Path.Line
function lineFrom(startpoint,angle,length){
  var endpoint = new Point(startpoint.x+length*Math.cos(angle/180*Math.PI),
                           startpoint.y+length*Math.sin(angle/180*Math.PI));
  var line = new Path.Line(startpoint,
                           endpoint);
  return line;
}

function centroid(polygon) {
  var area = 0;
  var c_x = 0;
  var c_y = 0;
  polygon.curves.forEach(function (curve) {
    var p1 = curve.point1;
    var p2 = curve.point2;
    var z = (p1.x * p2.y - p2.x * p1.y);
    c_x += (p1.x + p2.x) * z;
    c_y += (p1.y + p2.y) * z;
    area += z;
  });
  area /= 2;
  c_x /= (6 * area);
  c_y /= (6 * area);
  return new Point(c_x, c_y);
}

function download(filename, text) {
  var pom = document.createElement('a');
  pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  pom.setAttribute('download', filename);
  pom.click();
}

polys = [];
texts = [];
rects = [];
var draw = function(foregroundColor, backgroundColor) {

  // check to see if its inverted
  var b = document.getElementById('invertButton');
  var fgColor = foregroundColor;
  var bgColor = backgroundColor;
  if (b.checked) {
    fgColor = backgroundColor;
    bgColor = foregroundColor;
  }
  
  var points = [[200,100]];
  for (var i=0; i<points.length; i++){
    var w=350;
    var h=200;
    var scale=500/350;
    var topLeft = new Point(0, 0);
    var size = new Size(w * scale, h * scale);
    view.viewSize = size;
    var rect = new Path.Rectangle(topLeft, size);
    rect.fillColor = bgColor;
    console.log(rect);
    var text = project.importSVG(document.getElementById('logotype'));
    text.position = new Point(points[i]);
    text.fillColor = bgColor;
    text.scale(.65);

    // make a jaggagon
    var poly = new GenerativePoly(text, fgColor, rect);

    // store objects
    polys.push(poly);
    texts.push(text);
    rects.push(rect);
  }
}

document.getElementById('downloadButton').addEventListener("click", function() {
  var b = document.getElementById('invertButton');
  var invertedString = "";
  if (b.checked) {
    invertedString = "-inverted"
  }
  
  var name = "logo-" + foregroundColor + invertedString + ".svg";
  download(name, project.exportSVG({asString:true}));
});

draw(foregroundColor, backgroundColor);

document.getElementById('regenButton').addEventListener("click", function() {
  project.clear();
  polys = [];
  texts = [];
  rects = [];
  draw(foregroundColor, backgroundColor);
  view.draw();
});


// closure that returns an appropriate listener
function redraw_in_color(fgColor, bgColor) {
  var func = function() {
    var b = document.getElementById('invertButton');
    var fg = fgColor;
    var bg = bgColor;
    if (b.checked) {
      fg = bgColor;
      bg = fgColor;
    }
    for(var i=0; i<polys.length; i++){

      polys[i].fillColor = fg;
      texts[i].fillColor = bg;
      rects[i].fillColor = bg;
    }
    foregroundColor = fgColor;
    backgroundColor = bgColor;
    view.draw();
  }
  return func;
}

var append_after = document.getElementById('colorText');

for (key in colors) {

  var colorbutton = document.createElement("div");

  // style it
  colorbutton.style['background'] = colors[key];
  if (key === 'White') {
    colorbutton.style['border'] = "1px solid #ddd";
  } else {
    colorbutton.style['border'] = "1px solid white";
  };
  colorbutton.style['padding'] = ".3em .6em";
  colorbutton.style['margin'] = "0 .3em";
  colorbutton.style["display"] = "inline-block";
  colorbutton.style["cursor"] = "pointer";
  colorbutton.style["font-size"] = "smaller";
  colorbutton.innerHTML = key;

  colorbutton.addEventListener("click", redraw_in_color(colors[key], backgroundColor));
  append_after = insertAfter(colorbutton, append_after);
}

document.getElementById('invertButton').addEventListener("click", function () {
  return redraw_in_color(foregroundColor, backgroundColor)();
});
