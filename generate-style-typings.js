var DtsCreator = require('typed-css-modules');
var glob = require('glob');

const creator = new DtsCreator.default();

glob('src/**/*.scss', {}, (error, filePaths) => {
  for (const filePath of filePaths) {
    creator.create(filePath)
      .then(content => content.writeFile())
      .catch((error) => console.log(error));
  }
});