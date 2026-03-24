#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Known origins and meanings for common names that Wikipedia didn't return well
const KNOWN = {
  // Boys
  'Liam': { origin: 'Irish', meaning: 'Strong-willed warrior' },
  'James': { origin: 'Hebrew', meaning: 'Supplanter' },
  'Elijah': { origin: 'Hebrew', meaning: 'My God is Yahweh' },
  'Henry': { origin: 'Germanic', meaning: 'Ruler of the home' },
  'William': { origin: 'Germanic', meaning: 'Resolute protector' },
  'Benjamin': { origin: 'Hebrew', meaning: 'Son of the right hand' },
  'Jack': { origin: 'English', meaning: 'God is gracious' },
  'Alexander': { origin: 'Greek', meaning: 'Defender of the people' },
  'Michael': { origin: 'Hebrew', meaning: 'Who is like God?' },
  'Sebastian': { origin: 'Greek', meaning: 'Venerable; revered' },
  'Aiden': { origin: 'Irish', meaning: 'Little fire' },
  'Joseph': { origin: 'Hebrew', meaning: 'God will add' },
  'Wyatt': { origin: 'English', meaning: 'Brave in war' },
  'Luke': { origin: 'Greek', meaning: 'Light-giving' },
  'Julian': { origin: 'Latin', meaning: 'Youthful; downy' },
  'Hudson': { origin: 'English', meaning: 'Son of Hugh' },
  'Grayson': { origin: 'English', meaning: 'Son of the steward' },
  'Matthew': { origin: 'Hebrew', meaning: 'Gift of God' },
  'Jayden': { origin: 'Hebrew', meaning: 'God has heard' },
  'Luca': { origin: 'Italian', meaning: 'Bringer of light' },
  'Maverick': { origin: 'American', meaning: 'Independent; nonconformist' },
  'Josiah': { origin: 'Hebrew', meaning: 'God supports; heals' },
  'Isaac': { origin: 'Hebrew', meaning: 'He will laugh' },
  'Brooks': { origin: 'English', meaning: 'Of the brook; stream' },
  'Austin': { origin: 'Latin', meaning: 'Great; magnificent' },
  'Elias': { origin: 'Hebrew', meaning: 'My God is Yahweh' },
  'Joshua': { origin: 'Hebrew', meaning: 'God is salvation' },
  'Jaxon': { origin: 'English', meaning: 'Son of Jack' },
  'Cameron': { origin: 'Scottish', meaning: 'Crooked nose' },
  'Santiago': { origin: 'Spanish', meaning: 'Saint James' },
  'Jameson': { origin: 'English', meaning: 'Son of James' },
  'Aaron': { origin: 'Hebrew', meaning: 'High mountain; exalted' },
  'Connor': { origin: 'Irish', meaning: 'Lover of hounds' },
  'Cooper': { origin: 'English', meaning: 'Barrel maker' },
  'Ian': { origin: 'Scottish', meaning: 'God is gracious' },
  'Dominic': { origin: 'Latin', meaning: 'Belonging to the Lord' },
  'Colton': { origin: 'English', meaning: 'From the coal town' },
  'Kai': { origin: 'Hawaiian', meaning: 'Sea; ocean' },
  'Carson': { origin: 'Scottish', meaning: 'Son of the marsh-dwellers' },
  'Robert': { origin: 'Germanic', meaning: 'Bright fame' },
  'Angel': { origin: 'Greek', meaning: 'Messenger of God' },
  'Axel': { origin: 'Scandinavian', meaning: 'Father of peace' },
  'Everett': { origin: 'English', meaning: 'Brave as a wild boar' },
  'Eli': { origin: 'Hebrew', meaning: 'Ascended; elevated' },
  'Easton': { origin: 'English', meaning: 'East-facing place' },
  'Jeremiah': { origin: 'Hebrew', meaning: 'God will uplift' },
  'Roman': { origin: 'Latin', meaning: 'Citizen of Rome' },
  'Landon': { origin: 'English', meaning: 'Long hill' },
  'Greyson': { origin: 'English', meaning: 'Son of the grey-haired one' },
  'Wesley': { origin: 'English', meaning: 'Western meadow' },
  'Waylon': { origin: 'English', meaning: 'Land beside the road' },
  'Harrison': { origin: 'English', meaning: 'Son of Harry' },
  'Jordan': { origin: 'Hebrew', meaning: 'To flow down; descend' },
  'Bennett': { origin: 'Latin', meaning: 'Blessed' },
  'Micah': { origin: 'Hebrew', meaning: 'Who is like God?' },
  'Weston': { origin: 'English', meaning: 'Western town' },
  'Emmett': { origin: 'English', meaning: 'Universal; truth' },
  'Silas': { origin: 'Latin', meaning: 'Wood; forest' },
  'Rowan': { origin: 'Irish', meaning: 'Little red-haired one' },
  'Beau': { origin: 'French', meaning: 'Handsome' },
  'Parker': { origin: 'English', meaning: 'Park keeper' },
  'Xavier': { origin: 'Basque', meaning: 'New house; bright' },
  'Declan': { origin: 'Irish', meaning: 'Full of goodness' },
  'Jace': { origin: 'Hebrew', meaning: 'The Lord is salvation' },
  'Kayden': { origin: 'American', meaning: 'Fighter; companion' },
  'Ryder': { origin: 'English', meaning: 'Horseman; knight' },
  'Sawyer': { origin: 'English', meaning: 'Woodcutter' },
  'River': { origin: 'English', meaning: 'Flowing body of water' },
  'Gael': { origin: 'Irish', meaning: 'Gaelic; stranger' },
  'Atlas': { origin: 'Greek', meaning: 'Bearer of the heavens' },
  'Jackson': { origin: 'English', meaning: 'Son of Jack' },
  'Daniel': { origin: 'Hebrew', meaning: 'God is my judge' },
  'Mason': { origin: 'English', meaning: 'Stone worker' },
  'Ethan': { origin: 'Hebrew', meaning: 'Strong; firm' },
  'Logan': { origin: 'Scottish', meaning: 'Little hollow' },
  'Owen': { origin: 'Welsh', meaning: 'Young warrior; noble' },
  'Samuel': { origin: 'Hebrew', meaning: 'God has heard' },
  'Jacob': { origin: 'Hebrew', meaning: 'Supplanter' },
  'Asher': { origin: 'Hebrew', meaning: 'Happy; blessed' },
  'John': { origin: 'Hebrew', meaning: 'God is gracious' },
  'David': { origin: 'Hebrew', meaning: 'Beloved' },
  'Leo': { origin: 'Latin', meaning: 'Lion' },
  'Ezra': { origin: 'Hebrew', meaning: 'Helper' },
  'Gabriel': { origin: 'Hebrew', meaning: 'God is my strength' },
  'Carter': { origin: 'English', meaning: 'Cart driver' },
  'Lincoln': { origin: 'English', meaning: 'Lake colony' },
  'Caleb': { origin: 'Hebrew', meaning: 'Faithful; devoted' },
  'Nathan': { origin: 'Hebrew', meaning: 'He gave' },
  'Miles': { origin: 'Latin', meaning: 'Soldier; merciful' },
  'Christian': { origin: 'Latin', meaning: 'Follower of Christ' },
  'Andrew': { origin: 'Greek', meaning: 'Manly; brave' },
  'Thomas': { origin: 'Aramaic', meaning: 'Twin' },
  'Ezekiel': { origin: 'Hebrew', meaning: 'God will strengthen' },
  'Nolan': { origin: 'Irish', meaning: 'Noble; famous' },
  'Adrian': { origin: 'Latin', meaning: 'From Hadria; dark one' },

  // Girls
  'Olivia': { origin: 'Latin', meaning: 'Olive tree' },
  'Emma': { origin: 'Germanic', meaning: 'Whole; universal' },
  'Charlotte': { origin: 'French', meaning: 'Free woman; petite' },
  'Amelia': { origin: 'Germanic', meaning: 'Industrious; striving' },
  'Sophia': { origin: 'Greek', meaning: 'Wisdom' },
  'Mia': { origin: 'Scandinavian', meaning: 'Beloved; mine' },
  'Isabella': { origin: 'Hebrew', meaning: 'God is my oath' },
  'Ava': { origin: 'Latin', meaning: 'Bird; life' },
  'Evelyn': { origin: 'English', meaning: 'Wished-for child' },
  'Luna': { origin: 'Latin', meaning: 'Moon' },
  'Harper': { origin: 'English', meaning: 'Harp player' },
  'Sofia': { origin: 'Greek', meaning: 'Wisdom' },
  'Camila': { origin: 'Latin', meaning: 'Young ceremonial attendant' },
  'Eleanor': { origin: 'French', meaning: 'Bright; shining one' },
  'Elizabeth': { origin: 'Hebrew', meaning: 'God is my oath' },
  'Violet': { origin: 'Latin', meaning: 'Purple flower' },
  'Scarlett': { origin: 'English', meaning: 'Red; scarlet' },
  'Emily': { origin: 'Latin', meaning: 'Industrious; eager' },
  'Hazel': { origin: 'English', meaning: 'The hazel tree' },
  'Aria': { origin: 'Italian', meaning: 'Air; melody' },
  'Penelope': { origin: 'Greek', meaning: 'Weaver' },
  'Chloe': { origin: 'Greek', meaning: 'Blooming; fertility' },
  'Layla': { origin: 'Arabic', meaning: 'Night; dark beauty' },
  'Mila': { origin: 'Slavic', meaning: 'Gracious; dear' },
  'Nora': { origin: 'Irish', meaning: 'Honor; light' },
  'Avery': { origin: 'English', meaning: 'Ruler of elves' },
  'Riley': { origin: 'Irish', meaning: 'Courageous; valiant' },
  'Ivy': { origin: 'English', meaning: 'Faithfulness; evergreen vine' },
  'Lily': { origin: 'English', meaning: 'Lily flower; purity' },
  'Aurora': { origin: 'Latin', meaning: 'Dawn' },
  'Willow': { origin: 'English', meaning: 'Willow tree; graceful' },
  'Ella': { origin: 'Germanic', meaning: 'All; fairy maiden' },
  'Zoey': { origin: 'Greek', meaning: 'Life' },
  'Isla': { origin: 'Scottish', meaning: 'Island' },
  'Ellie': { origin: 'English', meaning: 'Bright shining one' },
  'Nova': { origin: 'Latin', meaning: 'New; a star that suddenly increases in brightness' },
  'Abigail': { origin: 'Hebrew', meaning: 'Father\'s joy' },
  'Madison': { origin: 'English', meaning: 'Son of Maud; gift of God' },
  'Grace': { origin: 'Latin', meaning: 'Grace; favor' },
  'Emilia': { origin: 'Latin', meaning: 'Rival; industrious' },
  'Gianna': { origin: 'Italian', meaning: 'God is gracious' },
  'Hannah': { origin: 'Hebrew', meaning: 'Grace; favor' },
  'Stella': { origin: 'Latin', meaning: 'Star' },
  'Paisley': { origin: 'Scottish', meaning: 'Church; cemetery' },
  'Addison': { origin: 'English', meaning: 'Son of Adam' },
  'Natalie': { origin: 'Latin', meaning: 'Born on Christmas Day' },
  'Leah': { origin: 'Hebrew', meaning: 'Weary; delicate' },
  'Savannah': { origin: 'Spanish', meaning: 'Treeless plain' },
  'Naomi': { origin: 'Hebrew', meaning: 'Pleasantness; delight' },
  'Maya': { origin: 'Sanskrit', meaning: 'Illusion; magic' },
  'Elena': { origin: 'Greek', meaning: 'Bright; shining light' },
  'Valentina': { origin: 'Latin', meaning: 'Strong; healthy' },
  'Josephine': { origin: 'Hebrew', meaning: 'God will add' },
  'Delilah': { origin: 'Hebrew', meaning: 'Delicate; languishing' },
  'Alice': { origin: 'Germanic', meaning: 'Noble; of noble kind' },
  'Claire': { origin: 'French', meaning: 'Bright; clear' },
  'Sadie': { origin: 'Hebrew', meaning: 'Princess' },
  'Victoria': { origin: 'Latin', meaning: 'Victory; conqueror' },
  'Lucy': { origin: 'Latin', meaning: 'Light' },
  'Kennedy': { origin: 'Irish', meaning: 'Helmeted chief' },
  'Lillian': { origin: 'Latin', meaning: 'Lily; purity' },
  'Audrey': { origin: 'English', meaning: 'Noble strength' },
  'Bella': { origin: 'Italian', meaning: 'Beautiful' },
  'Eliana': { origin: 'Hebrew', meaning: 'My God has answered' },
  'Anna': { origin: 'Hebrew', meaning: 'Grace; favor' },
  'Aaliyah': { origin: 'Arabic', meaning: 'Exalted; sublime' },
  'Kinsley': { origin: 'English', meaning: 'King\'s meadow' },
  'Jade': { origin: 'Spanish', meaning: 'Precious green stone' },
  'Athena': { origin: 'Greek', meaning: 'Goddess of wisdom and war' },
  'Hailey': { origin: 'English', meaning: 'Hay meadow' },
  'Genesis': { origin: 'Hebrew', meaning: 'Origin; beginning' },
  'Emery': { origin: 'Germanic', meaning: 'Industrious ruler' },
  'Autumn': { origin: 'Latin', meaning: 'Fall season' },
  'Vivian': { origin: 'Latin', meaning: 'Alive; full of life' },
  'Eva': { origin: 'Hebrew', meaning: 'Life; living one' },
  'Quinn': { origin: 'Irish', meaning: 'Wisdom; chief' },
  'Serenity': { origin: 'English', meaning: 'Peaceful; calm' },
  'Nevaeh': { origin: 'American', meaning: 'Heaven spelled backwards' },
  'Piper': { origin: 'English', meaning: 'Pipe player' },
  'Leilani': { origin: 'Hawaiian', meaning: 'Heavenly flower' },
  'Allison': { origin: 'Germanic', meaning: 'Noble; of noble kind' },
  'Ayla': { origin: 'Turkish', meaning: 'Moonlight; halo' },
  'Madelyn': { origin: 'English', meaning: 'High tower; woman from Magdala' },
  'Maria': { origin: 'Hebrew', meaning: 'Beloved; wished-for child' },
  'Everleigh': { origin: 'English', meaning: 'Boar meadow; forever' },
  'Sophie': { origin: 'Greek', meaning: 'Wisdom' },
  'Peyton': { origin: 'English', meaning: 'Fighting man\'s estate' },
  'Caroline': { origin: 'French', meaning: 'Free woman; song of joy' },
  'Brielle': { origin: 'French', meaning: 'God is my strength' },
  'Adeline': { origin: 'French', meaning: 'Noble; kind' },
  'Lydia': { origin: 'Greek', meaning: 'Woman from Lydia; noble one' },
  'Cora': { origin: 'Greek', meaning: 'Maiden' },
  'Ruby': { origin: 'English', meaning: 'Red precious stone' },
  'Rylee': { origin: 'Irish', meaning: 'Courageous; valiant' },
  'Liliana': { origin: 'Latin', meaning: 'Lily; pure' },
  'Aubrey': { origin: 'French', meaning: 'Elf ruler' },
  'Raelynn': { origin: 'American', meaning: 'Combination of Rae and Lynn; graceful light' },
  'Bailey': { origin: 'English', meaning: 'Bailiff; city fortification' },
  'Brooklyn': { origin: 'English', meaning: 'Broken land; water' },
  'Julia': { origin: 'Latin', meaning: 'Youthful; downy' },
};

// Fix SSA names
const ssaPath = path.join(__dirname, 'output', 'ssa-popular-names.json');
const ssa = JSON.parse(fs.readFileSync(ssaPath, 'utf8'));

let fixed = 0;
for (const entry of ssa) {
  const known = KNOWN[entry.name];
  if (known) {
    if (entry.meaning === 'Popular name' || entry.origin === 'Masculine' || entry.origin === 'Feminine') {
      entry.origin = known.origin;
      entry.meaning = known.meaning;
      fixed++;
    } else if (entry.origin === 'Masculine' || entry.origin === 'Feminine') {
      entry.origin = known.origin;
      fixed++;
    }
  }
}

fs.writeFileSync(ssaPath, JSON.stringify(ssa, null, 2));
console.log(`Fixed ${fixed} SSA names`);

// Verify no more bad entries
const remaining = ssa.filter(x => x.origin === 'Masculine' || x.origin === 'Feminine' || x.meaning === 'Popular name');
if (remaining.length > 0) {
  console.log(`\n${remaining.length} names still need attention:`);
  remaining.forEach(x => console.log(`  ${x.name}: ${x.origin} — ${x.meaning}`));
} else {
  console.log('All names cleaned up!');
}

// Fix celebrity names too
const celebPath = path.join(__dirname, 'output', 'celebrity-names.json');
const celeb = JSON.parse(fs.readFileSync(celebPath, 'utf8'));
let celebFixed = 0;
for (const entry of celeb) {
  const known = KNOWN[entry.name];
  if (known && (entry.meaning === 'Popular name' || entry.origin === 'Masculine' || entry.origin === 'Feminine' || entry.origin === 'American')) {
    entry.origin = known.origin;
    entry.meaning = known.meaning;
    celebFixed++;
  }
}
fs.writeFileSync(celebPath, JSON.stringify(celeb, null, 2));
console.log(`\nFixed ${celebFixed} celebrity names`);
