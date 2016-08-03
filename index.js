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
      course: 'MATH',
      WList: 'All'
    }
  }, function(err, httpRes, body) {
    var $ = cheerio.load(body);
    var table = $('div.da-contents-body table');
    var hasTaylorBool = hasTaylor($, table.children());
    var titleText = hasTaylorBool ? 'MATH 1D is open!' : 'MATH 1D is not yet available';
    var subtitleText = hasTaylorBool ? "Go get him now!" : "";
    res.render('pages/index', {
      title: titleText,
      subtitle: subtitleText
    });
  });
});

app.get('/cool', function(request, response) {
  response.send(cool());
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

var hasTaylor = function(c, table) {
  var len = 0;
  if (table) {
    table.each(function(i, item) {
      var line = c(this).text();
      if (line.includes('MATH001D')) {
        len++;
        console.log(line);
      }
    });
  }
  return len > 3;
}
