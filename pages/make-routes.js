// Make routes: which screen each Make address shows. #/surprise, #/builds, #/pixel (and the pixel art pages under
// it), #/tricks and #/trick/<id>/<step>, #/palettes, #/finish, #/mine and #/mine/<id>.
import { surprisePage } from './surprise.js';
import { buildsPage } from './builds.js';
import { palettesPage } from './palettes.js';
import { pixelHomePage } from './pixel-home.js';
import { pixelCropPage } from './pixel-crop.js';
import { pixelResultPage } from './pixel-result.js';
import { pixelBuildPage } from './pixel-build.js';
import { tricksPage } from './tricks.js';
import { trickPage } from './trick.js';
import { finishPage } from './finish.js';
import { minePage } from './mine.js';
import { mineNewPage } from './mine-new.js';
import { minePhotoPage } from './mine-photo.js';

const PAGES = { surprise: surprisePage, builds: buildsPage, palettes: palettesPage, tricks: tricksPage, trick: trickPage, finish: finishPage };

// The page for a Make address, or null if it isn't one.
export function makePageFor(route) {
  // Pixel art: #/pixel, #/pixel/crop, then #/pixel/<id> for the result and #/pixel/<id>/<row> to build it.
  if (route.page === 'pixel') {
    if (!route.id) return pixelHomePage;
    return route.id === 'crop' ? pixelCropPage : route.step ? pixelBuildPage : pixelResultPage;
  }
  // My builds: #/mine, #/mine/new to add a photo, #/mine/<id> for one photo.
  if (route.page === 'mine') return !route.id ? minePage : route.id === 'new' ? mineNewPage : minePhotoPage;
  return PAGES[route.page] || null;
}
