/*Known working on nodejs v6
To locally install node-jsdom issue following:
  npm install node-jsdom
and it will create and population node_modules in CWD
Had to run it twice for some reason though.

Requires the follow to be in the dir in which node is invoked:
- d3/d3.js
- graph_acit.js

Here, the d3 folder is the unzip of the free download from d3js.org.

*/


var jsdom = require('node-jsdom');
var fs = require('fs');

if(process.argv.length!=3 && process.argv.length!=4){
    console.error("Usage: "+process.argv[0]+" "+process.argv[1]+" csvFile [grey]");
    return;
}

//This script turns the specified csv file in an svg file
csvFile=process.argv[2];
isGrey=(process.argv.length==4 && process.argv[3].toLowerCase()=="grey");

//Creates a fake DOM environment with an empty web page
//to kid my script on that it is in a web browser.
jsdom.env(
  "<html><body></body></html>",
  [ process.cwd()+'/d3/d3.js',
  process.cwd()+'/graph_acit.js' ],
  function (err, window) {
    //window contains what was in the global name space in my script
    var d3 = window.d3;
    //can't use d3.csv due to some node.js so read it in as a string
    fs.readFile(csvFile, 'utf8',
        function (err, strData) {
            //then get d3 to parse the string
            //NOTE: I'm lucky the next line works as data should only really
            //be used in a call back function see https://stackoverflow.com/questions/21767005/d3-uncaught-typeerror-cannot-read-property-length-of-undefined
            data=d3.csvParse(strData, window.rowConverter);
            //now paint the SVG on the imaginary
            var svg = window.createSVG(data,isGrey);
            //and then send the returned svg to stdout
            console.log(svg);
        });
    }
);
