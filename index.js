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
  getCourses(request, req.params.crn, req.params.department, function(course) {
    console.log("callback: " + JSON.stringify(course));
    if (course.seatsOpen > 0 || course.onWaitlist > 0) {
      console.log('** OPEN **');
    }
    res.json(course);
  });
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

var getCourses = function(r, crn, dep, callback) {
  r.post('https://www.deanza.edu/schedule/opcourselist.html',
         {
           form: {
             course: dep,
             WList: 'All'
           }
         }, function(err, httpRes, body) {
           var $ = cheerio.load(body);
           var table = $('div.da-contents-body table');
           findEmptySlots($, crn, table.children(), callback);
         });
}

var findEmptySlots = function(c, crn, table, callback) {
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
  parseCourse(crn, lines, callback);
}

var parseCourse = function(crnCode, lines, callback) {
  var course = {
    name: '',
    crn: crnCode,
    totalSeats: 0,
    seatsOpen: 0,
    onWaitlist: 0,
    totalWaitlist: 0
  };
  for (i = 0; i < lines.length; i++) {
    // parse only digits
    if (lines[i].includes(crnCode)) {
    } else {
      var tmp = lines[i].split(' ');
      var slots = parseSlotDigits(tmp);
      if (slots.length == 3) {
        course.totalSeats = Number(slots[0]);
        course.onWaitlist = Number(slots[2]);
        course.totalWaitlist = Number(slots[1]);
      } else if (slots.length == 4) {
        course.totalSeats = Number(slots[0]);
        course.seatsOpen = Number(slots[1]);
        course.onWaitlist = Number(slots[2]);
        course.totalWaitlist = Number(slots[3]);
      }
      callback(course);
    }
  }
}

var parseSlotDigits = function(str) {
  var slots = [];
  for (j = 0; j < str.length; j++) {
    if (isDigitsOnly(str[j])) {
      slots.push(str[j]);
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
//        console.log(line);
      }
    });
  }
  return len > 3;
}

var hasEconOne = function(c, table) {
  if (table) {
    table.each(function(i, item) {
      var line = c(this).text();
//      console.log(line);
    });
  }
  return true;
}
