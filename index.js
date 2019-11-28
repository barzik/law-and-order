const chokidar = require('chokidar');
const ENUMS = require('./enums.js');
const fs = require('fs');
const notifier = require('node-notifier');
const axios = require('axios');
const textract = require('textract');

const watcher = chokidar.watch(ENUMS.DEST, {ignored: /^\./, persistent: true});

watcher
  .on('add', (path) => {handler(path)})
  .on('change', (path) => {handler(path)})
  .on('error', (error) => {console.error('Error happened', error);})

function handler(path) {

  textract.fromFileWithPath(path, { lang: 'he_il'}, (error, text) => {
    if(text) {
      const pretext = text.split('פרוטוקול')[0];
      const lawyerRegex = /עו"ד [א-ת]+ [א-ת]+/gmiu
      const lawyers = pretext.match(lawyerRegex);
      const names = removeTitle(lawyers);
      names.forEach((name) => {
        const [fname, lname] = name.split(' ');
        console.log(`Checking Lawyer ${fname}, ${lname}`)
        result = checkName(fname, lname);
      })
    }

  
  });
  
}

async function checkName(fname, lname) {
  const query = encodeURI(`${ENUMS.SERVICE_URL}fn=${fname}&ln=${lname}`);
  const result = await axios.get(query);
  const notFoundIndicator =  /לא נמצאו תוצאות/gmiu;
  const notFound = result.data.search(notFoundIndicator);
  if(notFound !== -1) {
    notifyNotFound(`${fname} ${lname}`);
  } else {
    console.log(`Found Lawyer ${fname} ${lname}`)
  }
}

function notifyNotFound(name) {
  notifier.notify({
    title: 'עורך דין חסר',
    message: name,
  });
}

function removeTitle(nonFilteredArray) {
  const newArray = nonFilteredArray.map(el => el.split('עו"ד ').pop());
  return newArray;
}

// Content = fs.openSync(path)
// names of lawyers = extractLawyersNames(Content)
// validate names
// output message