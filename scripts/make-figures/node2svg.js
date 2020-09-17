/*Known working on nodejs v6
To locally install node-jsdom issue following:
  npm install d3 jsdom
and it will create and population node_modules in CWD

Requires graph_acit.js to be in the dir in which node is invoked.

*/

const jsdom = require('jsdom');
const fs = require('fs');
const graph_acit = require('./graph_acit.js');// has require d3 in it
const { JSDOM } = jsdom;

if(process.argv.length!=3 && process.argv.length!=4){
    console.error("Usage: "+process.argv[0]+" "+process.argv[1]+" csvFile [grey]");
    return;
}

//This script turns the specified csv file in an svg file
csvFile=process.argv[2];
isGrey=(process.argv.length==4 && process.argv[3].toLowerCase()=="grey");

//Creates a fake DOM environment with an empty web page
//to kid my script on that it is in a web browser.
const fakeDom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
let body = graph_acit.d3.select(fakeDom.window.document).select('body');

//can't use d3.csv as fetch no implemented in jsdom
fs.readFile(csvFile, 'utf8',
    function (err, strData) {
	//then get d3 to parse the string
	data=d3.csvParse(strData, graph_acit.rowConverter);
	//now paint the SVG on the imaginary
	var svg = graph_acit.createSVG(body,data,isGrey);
	//and then send the returned svg to stdout
	console.log(svg);
    });
