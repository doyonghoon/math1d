var cheerio = require('cheerio');
var request = require('request');
var cool = require('cool-ascii-faces');
var express = require('express');
var app = express();

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(req, res) {
  request
    .post('https://www.deanza.edu/schedule/opcourselist.html',
          {
            form: {
              course: 'ECON',
              WList: 'All'
            }
          }, function(err, httpRes, body) {
            var $ = cheerio.load(body);
            var table = $('div.da-contents-body table');
            var hasTaylorBool = hasTaylor($, table.children());
            var hasEconOneBool = hasEconOne($, table.children());
            var titleText = hasTaylorBool ? 'MATH 1D is open!' : 'MATH 1D is not yet available';
            var subtitleText = hasTaylorBool ? "Go get him now!" : "";
            res.render('pages/index', {
              title: titleText,
              subtitle: subtitleText
            });
          });
});

app.get('/slots/:department/:crn', function(req, res) {
  console.log(req.params.crn);
  getCourses(request, req.params.crn, req.params.department);
});

app.get('/cool', function(request, response) {
  response.send(cool());
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

var getCourses = function(r, crn, dep) {
  r.post('https://www.deanza.edu/schedule/opcourselist.html',
         {
           form: {
             course: dep,
             WList: 'All'
           }
         }, function(err, httpRes, body) {
           var $ = cheerio.load(body);
           var table = $('div.da-contents-body table');
           findEmptySlots($, crn, table.children());
         });
}

var findEmptySlots = function(c, crn, table) {
  var counter = 0;
  var lines = [];
  if (table && crn) {
    table.each(function(i, item) {
      var line = c(this).text();
      if (line.includes(crn)) {
        counter++;
      }
      if (counter > 0 && counter < 3) {
        lines.push(line);
        counter++;
      }
    });
  }
  parseCourse(crn, lines);
}

var parseCourse = function(crnCode, lines) {
  var course = {
    name: '',
    crn: crnCode,
    totalSeats: 0,
    seatsOpen: 0,
    onWaitlist: 0,
    totalWaitlist: 0
  };
  for (i = 0; i < lines.length; i++) {
    console.log('item[' + i + ']: ' + lines[i]);
    // parse only digits
    if (lines[i].includes(crnCode)) {
      
    } else {
      var tmp = lines[i].split(' ');
      var slots = parseSlotDigits(tmp);
      console.log(tmp);
    }
  }
}

var parseSlotDigits = function(str) {
  var slots = [];
  console.log('str: ' + str);
  for (j = 0; j < tmp.length; j++) {
    if (isDigitsOnly(tmp[j])) {
      slots[j].push(tmp[j]);
    }
  }
  return slots;
}

var isDigitsOnly = function(str) {
  return /^\d+$/.test(str);
}

var hasTaylor = function(c, table) {
  var len = 0;
  if (table) {
    table.each(function(i, item) {
      var line = c(this).text();
      if (line.includes('43294')) {
        len++;
        console.log(line);
      }
    });
  }
  return len > 3;
}

var hasEconOne = function(c, table) {
  if (table) {
    table.each(function(i, item) {
      var line = c(this).text();
      console.log(line);
    });
  }
  return true;
}
