// About: where the pictures, recipes and fonts come from, and their licenses.
import { el } from '../components/el.js';
import { topBar } from '../components/top-bar.js';

const link = (href, text) => el('a', { href, target: '_blank', rel: 'noopener' }, text);

export function aboutPage(ctx) {
  const section = (heading, ...body) => el('section', { class: 'about-part' }, el('h2', {}, heading), ...body);
  const nodes = [
    ...topBar({ back: '#/', right: 'About' }, ctx),
    el(
      'div',
      { class: 'page about' },
      el('h1', { class: 'log-title', tabindex: '-1' }, 'About this', el('br'), 'guide'),
      section(
        'How it works',
        el('p', {}, 'Every answer comes from the book built into the app, for Minecraft Bedrock Edition. It works without the internet once it has opened. The questions it saves, pixel art and ideas stay on this phone or tablet: photos are turned into blocks right here and never uploaded. When you talk, the device\'s own speech recognition turns your words into text.'),
        el('p', {}, `Book made ${ctx.book.made}.`),
      ),
      section(
        'Pictures',
        el('p', {}, 'Item, block and mob pictures are from ', link('https://github.com/Athemis/PixelPerfectionCE', 'Pixel Perfection CE'), ' by XSSheep and contributors, shared under ', link('https://creativecommons.org/licenses/by-sa/4.0/', 'CC BY-SA 4.0'), '. Pictures of newer things are from ', link('https://codeberg.org/mineclonia/mineclonia', 'Mineclonia'), ' by XSSheep, Nova Wostra and Mineclonia contributors, based on Pixel Perfection, under the same license (a few under CC BY-SA 3.0). Some mob pictures are mob icons from Mineclonia, made by 22i. Some were cropped or recoloured for this app, and those are shared under the same license.'),
      ),
      section(
        'Recipes and facts',
        el('p', {}, 'Recipes, names, mob drops, mining tools, biomes, enchantments, food and potion effects come from ', link('https://github.com/PrismarineJS/minecraft-data', 'minecraft-data'), ' by PrismarineJS (MIT license). The guides, what each enchantment and effect does, and a few recipe fixes were written for this app and checked against ', link('https://minecraft.wiki', 'minecraft.wiki'), '.'),
      ),
      section('Fonts', el('p', {}, 'Monocraft by Idrees Hassan, under the SIL Open Font License.')),
      el('p', { class: 'note' }, 'Not an official Minecraft product. Not approved by or associated with Mojang or Microsoft.'),
    ),
  ];
  return { nodes, title: 'About' };
}
