/* HashMap */
var JqMap = function(){
	this.map = new Object();
}

JqMap.prototype = {
	put: function (key, value) {
			 this.map[key] = value;
		 },
	get: function (key) {
			 return this.map[key];
		 },
	containsKey: function (key) {
					 return key in this.map;
				 },
	containsValue: function (value) {
					   for (var prop in this.map) {
						   if (this.map[prop] == value) {
							   return true;
						   }
					   }
					   return false;
				   },
	clear: function () {
			   for (var prop in this.map) {
				   delete this.map[prop];
			   }
		   },
	remove: function (key) {
				delete this.map[key];
			},
	keys: function () {
			  var arKey = new Array();
			  for (var prop in this.map) {
				  arKey.push(prop);
			  }
			  return arKey;
		  },
	values: function () {
				var arVal = new Array();
				for (var prop in this.map) {
					arVal.push(this.map[prop]);
				}
				return arVal;
			},
	size: function () {
			  var count = 0;
			  for (var prop in this.map) {
				  count++;
			  }
			  return count;
		  }
}


// http://expressjs.com/api.html#res.download
var express = require('express')
  , app = module.exports = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
 
app.get('/', function(req, res){
  res.send('<ul>'
    + '<li>Download <a href="/amazing.txt">amazing.txt</a>.</li>'
    + '<li>Download <a href="/missing.txt">missing.txt</a>.</li>'
    + '</ul>');
});

// /files/* is accessed via req.params[0]
// but here we name it :file
app.get('/:file(*)', function(req, res, next){
  var file = req.params.file
    , path = __dirname + '/files/' + file;

  console.log ("request download file_name = ", path);
  res.download(path);
});

// error handling middleware. Because it's
// below our routes, you will be able to
// "intercept" errors, otherwise Connect
// will respond with 500 "Internal Server Error".
app.use(function(err, req, res, next){
  // special-case 404s,
  // remember you could
  // render a 404 template here
  if (404 == err.status) {
    res.statusCode = 404;
    res.send('Cant find that file, sorry!');
  } else {
    next(err);
  }
});

if (!module.parent) {
  server.listen(80, function () {
	console.log('Server listening at port %d', 80);
  });  
  console.log('Express started on port %d', 80);
}

var Rate = new JqMap();
var RateNum = new JqMap();

// socket.io PART
io.on('connection', function (socket) {

  socket.on('Rate2Server', function(songname, rate) {
    if (RateNum.containsKey (songname)) {
	var num = RateNum.get(songname);
	RateNum.remove(songname);
	RateNum.put(songname, ++num);

	var prate = Rate.get(songname);
	Rate.remove(songname);
	Rate.put(songname, (prate*(num-1)+rate)/num);
    }
    else {
        RateNum.put(songname, 1);

	Rate.put(songname, rate);
    }

    console.log ('[request Rate2Server] songname = ', songname, ' rate = ', rate);	
  });

  socket.on('Rate2Client', function(songname) {
    var rate = 0.0;
    var numpeople = 0;    

    if (RateNum.containsKey (songname)) {
        rate = Rate.get(songname);
	numpeople = RateNum.get(songname);
    }

    socket.emit ('Rate2Client', { rate: rate,
				numpeople: numpeople,
				songname: songname  });
    console.log ('[request Rate2Client] songname = ', songname);
  });

  //client request to get directory listing
  socket.on('ls', function () {  
  
    // File Listings
    var walk    = require('walk');
    var files   = new Array();

    // Walker options
    var walker  = walk.walk('./files', { followLinks: false });

    walker.on('file', function(root, stat, next) {
  
    // Add this file to the list of files
    var file = new Object();
    file.name = stat.name;
    files.push(file);
    next();
    });

    walker.on('end', function() {
      console.log('request \'ls\'  ', files);
      socket.emit('ls', files);
    });
  });
});
