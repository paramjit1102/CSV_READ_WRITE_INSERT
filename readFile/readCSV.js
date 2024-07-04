const fs = require("fs");
const { parse } = require("csv-parse");
const csv = require("csv");

// fs.createReadStream("./migration_data.csv")
//   .pipe(parse({ delimiter: ",", from_line: 2 }))
//   .on("data", function (row) {
//     console.log(row);
//   })
//   .on("end", function () {
//     console.log("finished");
//   })
//   .on("error", function (error) {
//     console.log(error.message);
//   });


/** withwrite function*/

var skipHeader = true; // config option

var read = fs.createReadStream('./migration_data.csv');
var write = fs.createWriteStream('./saved_from_db.csv');
var rowCount = 0;// to keep track of where we are
var transform = csv.transform(function (row, cb) {
  var result;
  
  if (skipHeader && rowCount === 0) { // if the option is turned on and this is the first line
    result = null; // pass null to cb to skip
  } else {
    result = JSON.stringify(row)  + '\n'; // otherwise apply the transform however you want
 console.log(result,'result')
  }
  rowCount++; // next time we're not at the first line anymore
  cb(null, result); // let node-csv know we're done transforming
});

read.pipe(parse()).pipe(transform).pipe(write).once('finish', function () {
 console.log('successfull parse ')
});