var Logo = function(position,displayConstruction) {
    var textLayer = new Layer();
    var text = project.importSVG(document.getElementById('logotype'));
    text.position = position;
    text.fillColor = 'white';
    text.scale(.65);

    var boundsLayer = new Layer();
    var padding = 20;
    var inner = new Path.Rectangle(
        new Point(
            text.bounds.topLeft.x-padding,
            text.bounds.topLeft.y-padding
        ),
        new Size(text.bounds.width + 2*padding, text.bounds.height + 2*padding)
    );

    inner.strokeColor = "red";

    console.log(text.bounds.topLeft);

    var segmentLayer = new Layer();
    // corners first
    var line_length = text.bounds.height/2;
    var corner_line_length = 10 //line_length/Math.sqrt(2);

    var tl_corner = new Path.Line(
        inner.bounds.topLeft,
        new Point(
            inner.bounds.topLeft.x-corner_line_length,
            inner.bounds.topLeft.y-corner_line_length
        )
    )
    var tr_corner = new Path.Line(
        inner.bounds.topRight,
        new Point(
            inner.bounds.topRight.x+corner_line_length,
            inner.bounds.topRight.y-corner_line_length
        )
    )
    var tl_corner = new Path.Line(
        inner.bounds.bottomLeft,
        new Point(
            inner.bounds.bottomLeft.x-corner_line_length,
            inner.bounds.bottomLeft.y+corner_line_length
        )
    )
    var tl_corner = new Path.Line(
        inner.bounds.bottomRight,
        new Point(
            inner.bounds.bottomRight.x+corner_line_length,
            inner.bounds.bottomRight.y+corner_line_length
        )
    )
    var left_side = new Path.Line(
        new Point(text.position.x-(inner.bounds.width/2),
                  text.position.y),
        new Point(text.position.x-(inner.bounds.width/2)-line_length,
                  text.position.y)
    )
    var right_side = new Path.Line(
        new Point(text.position.x+(inner.bounds.width/2),
                  text.position.y),
        new Point(text.position.x+(inner.bounds.width/2)+line_length,
                  text.position.y)
    )
    var horizontal_spacing = inner.bounds.width/3;
    var top_left = new Path.Line(
        new Point(inner.bounds.topLeft.x+horizontal_spacing,
                  inner.bounds.topLeft.y),
        new Point(inner.bounds.topLeft.x+horizontal_spacing,
                  inner.bounds.topLeft.y-line_length)
    )
    var top_right = new Path.Line(
        new Point(inner.bounds.topRight.x-horizontal_spacing,
                  inner.bounds.topRight.y),
        new Point(inner.bounds.topRight.x-horizontal_spacing,
                  inner.bounds.topRight.y-line_length)

    )
    var bottom_left = new Path.Line(
        new Point(inner.bounds.bottomLeft.x+horizontal_spacing,
                  inner.bounds.bottomLeft.y),
        new Point(inner.bounds.bottomLeft.x+horizontal_spacing,
                  inner.bounds.bottomLeft.y+line_length)
    )
    var bottom_right = new Path.Line(
        new Point(inner.bounds.bottomRight.x-horizontal_spacing,
                  inner.bounds.bottomRight.y),
        new Point(inner.bounds.bottomRight.x-horizontal_spacing,
                  inner.bounds.bottomRight.y+line_length)

    )

    var pointLayer = new Layer();
    var vertices = [];
    var p0, p1;
    segmentLayer.children.forEach(function(segment, index) {
        segment.strokeColor = "blue";

        //
        p0 = segment.segments[0].point;
        p1 = segment.segments[1].point;
        var vertex = p0 + (p1 - p0) * betavariate(0.35, 0.35);
	vertices.push(vertex);
        var p = new Path.Circle(vertex, 5);
        p.fillColor = "rgb(150,150,255)";

    })

    var polarVertices = [];
    for(var i=0; i<vertices.length; i++){
        var polarCoords = cart_to_polar(vertices[i],inner.bounds.center);
        polarCoords.x = vertices[i].x;
        polarCoords.y = vertices[i].y;
        polarVertices.push(polarCoords);
    }
    polarVertices.sort(theta_comparator);

    var shapeLayer = new Layer();
    var shape = new Path();
    shape.fillColor = "#ff6000";

    for(var i=0; i<polarVertices.length; i++){
        shape.add(polar_to_point(polarVertices[i]));
    }
    shape.add(polar_to_point(polarVertices[0]));

    shapeLayer.moveBelow(textLayer);

    if(!displayConstruction){
        boundsLayer.remove();
        segmentLayer.remove();
        pointLayer.remove();
    }
}


function cart_to_polar(point,center){
    var dx = point.x-center.x;
    var dy = point.y-center.y;
    var r = ((dx)^2 + (dy)^2)^.5;
    var theta = Math.atan2(dy,dx);
    return {r:r, theta:theta};
}
function theta_comparator(a,b){
    if (a.theta < b.theta)
        return -1;
    if (a.theta > b.theta)
        return 1;
    // a must be equal to b
    return 0;
};
function polar_to_point(polarCoord){
    return new Point(polarCoord.x, polarCoord.y);
}

// ported from random.py
var LOG4 = Math.log(4.0)
var SG_MAGICCONST = 1.0 + Math.log(4.5);
function gammavariate(alpha, beta) {
    if (alpha > 1) {
        var ainv = Math.sqrt(2.0 * alpha - 1.0)
        var bbb = alpha - LOG4;
        var ccc = alpha + ainv;
        while (true) {
            var u1 = Math.random()
            if (!(1e-7 < u1 && u1 < .9999999)) {
                continue
            }
            var u2 = 1.0 - Math.random();
            var v = Math.log(u1/(1.0-u1))/ainv;
            var x = alpha*Math.exp(v);
            var z = u1*u1*u2;
            var r = bbb+ccc*v-x;
            if(r + SG_MAGICCONST - 4.5*z >= 0.0 || r >= Math.log(z)) {
                return x * beta
            }
        }
    }
    else if (alpha === 1) {
        var u = Math.random();
        while (u <= 1e-7){
            u = Math.random();
        }
        return -Math.log(u) * beta
    }
    else {
        var _e = Math.exp(1);
        while (true) {
            var u = Math.random();
            var b = (_e + alpha)/_e;
            var p = b*u;
            if (p <= 1.0)
                var x = Math.pow(p, (1.0/alpha));
            else
                var x = -Math.log((b-p)/alpha);
            var u1 = Math.random();
            if (p > 1.0) {
                if (u1 <= Math.pow(x, (alpha - 1.0))) {
                    break;
                }
            }
            else if (u1 <= Math.exp(-x))
                break;
        }
        return x * beta;
    }
}
function betavariate(alpha, beta) {
    var y = gammavariate(alpha, 1.);
    if (y === 0)
        return 0.0;
    else
        return y / (y + gammavariate(beta, 1.));
}

var draw = function() {
    // this is for drawing 9 different logos on 1 canvas. we happen to know the size a priori.
    var points = [[200,100],[600,100],[1000,100],[200,300],[600,300],[1000,300],[200,500],[600,500],[1000,500]];
    for (var i=0; i<points.length; i++){

        // put the center (?) of this SVG in this location and color it white

        // make a v nice polygon
        Logo(points[i],false);
    }
}
draw();
console.log(betavariate(.11,.11));
