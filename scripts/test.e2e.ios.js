const _ = require('lodash');
const exec = require('shell-utils').exec;

const release = _.includes(process.argv, 'release');

function buildProjForDetox() {
  const scheme = release ? `playground_release` : `playground`;
  const conf = release ? `Release` : `Debug`;

  const cmd = `RCT_NO_LAUNCH_PACKAGER=true
            cd ./playground/ios && xcodebuild
            build
            -scheme ${scheme}
            -project playground.xcodeproj
            -sdk iphonesimulator
            -configuration ${conf}
            -derivedDataPath ./DerivedData/playground
            ONLY_ACTIVE_ARCH=YES`;

  if (exec.which(`xcpretty`)) {
    exec.execSync(`${cmd} | xcpretty && exit \${PIPESTATUS[0]}`);
  } else {
    exec.execSync(`${cmd}`);
  }
}

function runDetoxUsingMocha() {
  const detoxAppBuildPath = `playground/ios/DerivedData/playground/Build/Products/${release ? 'Release' : 'Debug'}-iphonesimulator/playground.app`;

  exec.execSync(`detoxAppBuildPath="${detoxAppBuildPath}"
                              BABEL_ENV=test
                              ./node_modules/mocha/bin/mocha e2e
                                --timeout ${2 * 60 * 1000}
                                --recursive
                                --bail`);
}

function e2e() { //eslint-disable-line
  try {
    runDetoxUsingMocha();
  } finally {
    if (process.env.CI) {
      exec.kill(`Simulator`);
      exec.kill(`CoreSimulator`);
      exec.execSync(`sleep 5`);
    }
  }
}

function run() {
  if (!exec.which(`fbsimctl`)) {
    throw new Error(`fbsimctl must be installed: "brew tap facebook/fb && brew install fbsimctl"`);
  }
  buildProjForDetox();
  e2e();
}

run();