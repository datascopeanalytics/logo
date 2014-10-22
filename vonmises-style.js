/**
   var text = new PointText({
   point: [120, 300],
   content: 'datascope',
   fillColor: 'white',
   fontFamily: 'Avenir Next',
   fontWeight: '600',
   fontSize: 72
   });
*/

// takes an item with bounds, returns an irregular polygon to put around it
var GenerativePoly = function(text, passedColor) {

    // create a text layer
    var textlayer = new Layer();
    textlayer.addChild(text);

    // DEBUG: turn this to 'true' to quickly see how the darn thing is built!
    this.displayConstruction = false;

    // configure bounding boxes
    var adjust = 20;
    var padding = 15;
    var offset = 35;
    var border = new Layer();
    var bounds = new Rectangle({
        point: [text.bounds.x-adjust/2-padding, text.bounds.y-padding/2],
        size: [text.bounds.width+adjust+padding*2, text.bounds.height+padding]
    });
    var box = new Path.Rectangle(bounds,0);
    box.strokeColor = 'black';
    border.addChild(box);
    var outerBounds = new Path.Rectangle(new Rectangle(
        new Point(bounds.x-.75*offset,
                  bounds.y-offset),
        new Size(bounds.width+1.5*offset,
                 bounds.height+2*offset)));
    border.addChild(outerBounds);
    outerBounds.strokeColor = 'blue';

    // set up the data structure to hold all of the points
    var point_layer = new Layer();
    var point_list = [];
    var centroid = pathCenter(box);

    // choose a random starting point in the acceptable region
    var theta = Math.random() * Math.PI * 2;
    var r = random_allowed_in_region(box, outerBounds, theta);
    var p = new Point(r*Math.cos(theta), r*Math.sin(theta));
    point_list.push(p+centroid);
        point_layer.addChild(Path.Circle({
        center: p + centroid,
        radius: 5,
        fillColor: 'red'
    }));

    // for each of the next verticies, choose the angular component of the
    // point using a Cauchy distribution and choose the radial component based
    // on the available space in the acceptable region.
    var dtheta, kappa=3;
    for(var i=0; i<8; i++) {
        dtheta = censored_von_mises(2*Math.PI/9, kappa, r, theta, box);
        theta += dtheta;
        r = random_allowed_in_region(box, outerBounds, theta);
        p = new Point(r*Math.cos(theta), r*Math.sin(theta));
        point_list.push(p+centroid);
        point_layer.addChild(Path.Circle({
            center: p + centroid,
            radius: 5,
            fillColor: 'red'
        }));
    }

    // create the shape layer with the orange background and add the points to it
    var shapeLayer = new Layer();
    shapeLayer.moveBelow(textlayer)
    var shape = new Path();
    shape.fillColor = passedColor;
    for(var i=0; i<point_list.length; i++){
        shape.add(point_list[i]);
    }
    shape.add(point_list[0]);
    shapeLayer.addChild(shape);

    //point_layer.remove();

    // if(!this.displayConstruction){
    //     gridlines.remove();
    //     circles.remove();
    //     circlelayer.remove();
    //     border.remove();
    // }
}

function random_allowed_in_region(bounds, outerBounds, theta) {

    // get centroid
    var centroid = pathCenter(bounds);
    var big_r = 1000;
    var infinity = new Point(
        centroid.x + big_r*Math.cos(theta),
        centroid.y + big_r*Math.sin(theta)
    );

    // draw line from centroid along angle theta
    var line = Path.Line(centroid, infinity);
    line.strokeColor = 'black';

    // create the acceptable region
    var acceptable_region = outerBounds.subtract(bounds);
    //acceptable_region.fillColor = 'green';

    // using set actions (subtract, divide, etc) between a zero-volume line
    // and a rectangular donut results in empty sets. try finding the
    // intersection points as a means to find the line.
    var intersection_points = acceptable_region.getIntersections(line);
    var p0 = intersection_points[0].point;
    var p1 = intersection_points[1].point;
    var segment = Path.Line(p0, p1);
    segment.strokeColor = 'red';

    // choose a random point along this line
    var p = p0 + (p1 - p0) * Math.random();
    return p.getDistance(centroid);
}

var NV_MAGICCONST = 4 * Math.exp(-0.5)/Math.sqrt(2.0);
var TWOPI = 2 * Math.PI;

function censored_von_mises(mu, kappa, r, theta, bounds) {

    // get the current point
    var p = new Point(r*Math.cos(theta), r*Math.sin(theta));

    // determine the minimum possible dtheta allowable.
    // dtheta is always increasing
    var dtheta_min = 0;

    // determine the maximum possible dtheta allowable.
    // determine which corner is the *next* corner that the generative polygon
    // must go around
    var dtheta_max = TWOPI;
    // var centroid = pathCenter(bounds);
    // var b = bounds.bounds;
    // var next_corner, corners = [
    //     new Point(b.x, b.y),
    //     new Point(b.x+b.width, b.y),
    //     new Point(b.x+b.width, b.y+b.height),
    //     new Point(b.x, b.y+b.height)
    // ];
    // corners.forEach(function(c, i){
    //     var v = c - centroid;
    //     var t = Math.atan2(v.y, v.x);
    //     var dt = (t - theta) % TWOPI;
    //     if(dt>Math.PI)
    //         dt = dt - TWOPI;
    //     if(dt<-Math.PI)
    //         dt = dt + TWOPI;
    //     console.log('dt', theta, t, dt);
    //     if (dt>0 && dt<dtheta_max) {
    //         dtheta_max = dt;
    //         next_corner = c;
    //     }
    // });

    // var nc = Path.Circle(next_corner, 10);
    // nc.fillColor = 'green';

    // draw von Mises variates until we find something in the acceptable range
    var dtheta = dtheta_max*2;
    while(dtheta<dtheta_min || dtheta_max<dtheta) {
        dtheta = von_mises_variate(mu, kappa);
    }
    return dtheta;
}

function von_mises_variate (mu, kappa) {
    // based off of the python implementation of random.vonmisesvariate
    if(kappa <= 1e-6) {
        return TWOPI * Math.random();
    }
    var s = 0.5 / kappa;
    var r = s + Math.sqrt(1.0 + s * s);
    while (true){
        var u1 = Math.random();
        var z = Math.cos(Math.PI * u1);
        var d = z / (r + z);
        var u2 = Math.random();
        if(u2 < 1.0 - d * d || u2 <= (1.0 - d) * Math.exp(d))
            break;
    }
    var q = 1.0 / r;
    var f = (q + z) / (1.0 + q * z);
    var u3 = Math.random();
    if (u3 > 0.5)
        var theta = (mu + Math.acos(f)) % TWOPI
    else
        var theta = (mu - Math.acos(f)) % TWOPI
    return theta
}

// takes a PathItem, gets its bounds and finds the center of them
function pathCenter(pathitem){
    var bounds = pathitem.bounds;
    return new Point(bounds.x+bounds.width/2, bounds.y+bounds.height/2);
}

function download(filename, text) {
    var pom = document.createElement('a');
    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    pom.setAttribute('download', filename);
    pom.click();
}
var draw = function() {
    // this is for drawing 9 different logos on 1 canvas. we happen to know the size a priori.
    var points = [[200,100]]; //,[600,100],[1000,100],[200,300],[600,300],[1000,300],[200,500],[600,500],[1000,500]];
    for (var i=0; i<points.length; i++){

        // put the center (?) of this SVG in this location and color it white
        var text = project.importSVG(document.getElementById('logotype'));
        text.position = new Point(points[i]);
        text.fillColor = 'white';
        text.scale(.75);

        // make a v nice polygon
        var poly = new GenerativePoly(text,'#f56600');
    }
}
document.getElementById('downloadButton').addEventListener("click", function() {
    download('logos.svg',project.exportSVG({asString:true}));
});
draw();
document.getElementById('regenButton').addEventListener("click", function() {
    project.clear();
    draw();
});


//download('logos.svg',project.exportSVG({asString:true}));

// var gui = new dat.GUI();
// gui.add(poly1, 'displayConstruction');
