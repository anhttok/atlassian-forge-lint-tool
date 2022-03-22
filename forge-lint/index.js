var cp = require('child_process');
var glob = require('glob');
var dirname = require('path').dirname;
var fs = require('fs');
var resolve = require('path').resolve;
var envConfig = require('dotenv').config;

var getManifestEnvDirectories = function (src, callback) {
  glob(
    src + '/**/manifest.env.yml',
    { ignore: '/**/atlassian-forge-lint-tool' },
    callback
  );
};

getManifestEnvDirectories('../', function (err, res) {
  if (err) {
    console.log('err', err);
  }
  res.forEach(async function (path) {
    const dirnamePath = dirname(path);
    //env config
    const env = envConfig({
      path: `${dirnamePath}/.env`,
      override: true,
    });

    const envLocal = envConfig({
      path: `${dirnamePath}/.env.local`,
      override: true,
    });

    const envResult = [env, envLocal].reduce((envObject, envItem) => {
      if (envItem.parsed) {
        envObject = { ...envObject, ...envItem.parsed };
      }
      return envObject;
    }, {});
    //create manifest.yml
    const envReplace = () => {
      const fileName = 'manifest.env.yml';
      let file = fs.readFileSync(resolve(dirnamePath, fileName), 'utf-8');
      Object.keys(envResult).forEach((variable) => {
        const re = new RegExp(`\\$\\{${variable}\\}`, 'g');
        file = file.replace(re, envResult[variable]);
      });
      fs.writeFileSync(`${dirnamePath}/manifest.yml`, file);
    };
    envReplace();

    //run forge lint
    console.log('path:>>', dirnamePath);
    cp.spawnSync('forge', ['lint'], {
      env: process.env,
      cwd: dirnamePath,
      stdio: 'inherit',
    });
  });
});
