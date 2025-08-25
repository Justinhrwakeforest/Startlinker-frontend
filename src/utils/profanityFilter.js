// Frontend profanity filter that matches backend validation
// This should stay in sync with apps/users/profanity_filter.py

const OFFENSIVE_WORDS = [
  // Basic profanity
  'fuck', 'shit', 'bitch', 'bastard', 'damn', 'hell',
  'ass', 'asshole', 'piss', 'crap', 'suck', 'dick', 'cock',
  'pussy', 'cunt', 'twat', 'whore', 'slut', 'tits', 'boobs',
  
  // Racial slurs and hate speech
  'nigga', 'nigger', 'fag', 'faggot', 'dyke', 'retard',
  'spic', 'chink', 'gook', 'kike', 'wetback',
  
  // Sexual content
  'porn', 'sex', 'anal', 'oral', 'blow', 'suck', 'cum',
  'orgasm', 'masturbate', 'dildo', 'viagra',
  
  // Violence and threats
  'kill', 'murder', 'die', 'death', 'suicide', 'bomb',
  'terror', 'rape', 'assault', 'abuse', 'violence',
  
  // Drugs
  'weed', 'marijuana', 'cocaine', 'heroin', 'meth',
  'drug', 'crack', 'ecstasy', 'molly', 'lsd',
  
  // Body shaming
  'fatty', 'fatso', 'pig', 'whale', 'cow',
  'ugly', 'hideous', 'disgusting', 'gross', 'nasty',
  'stupid', 'idiot', 'moron', 'imbecile', 'dumbass', 'dumb',
  'loser', 'freak', 'weirdo', 'psycho', 'crazy',
  
  // Common substitutions and variations
  'f*ck', 'f**k', 'fck', 'fuk', 'phuck', 'fack', 'fick', 'fock',
  'sh*t', 'sh**', 'sht', 'shyt', 'shiit', 'chit',
  'b*tch', 'b**ch', 'btch', 'biatch', 'beatch', 'beyotch',
  'a**hole', 'a**', 'azz', 'asz', 'a55', 'a$$',
  'd*ck', 'd**k', 'dik', 'dck', 'dyck', 'dik',
  'n*gga', 'n**ga', 'n1gga', 'n1gg4', 'n!gga', 'n!gg@',
  'p*ssy', 'p**sy', 'pu$$y', 'pus5y', 'puzzy',
  'c*nt', 'c**t', 'cvnt', 'cnut', 'c0nt', 'c#nt',
  
  // Leet speak and number substitutions
  'fuc|<', 'fvck', 'phuk', '5hit', '$hit', 'b1tch', 'b!tch', 'b@tch',
  'a55h0le', '@sshole', 'a$$h0le', 'd1ck', 'd!ck', 'd@ck', 'd|ck',
  'n1663r', 'n!663r', 'n166@', 'n!66@', 'n1gg@', 'n!gg@',
  'pu55y', 'pv55y', 'p00sy', 'pv$$y', 'p@ssy'
];

const RESERVED_NAMES = [
  'admin', 'administrator', 'root', 'user', 'test', 'demo', 'guest',
  'api', 'www', 'mail', 'email', 'support', 'help', 'info',
  'news', 'blog', 'forum', 'chat', 'ftp', 'ssh', 'ssl',
  'security', 'privacy', 'terms', 'about', 'contact', 'legal',
  'null', 'undefined', 'anonymous', 'system', 'service'
];

// Words that might be flagged but shouldn't be (false positives)
const FALSE_POSITIVES = [
  'class', 'classic', 'classified', 'hello', 'help', 'helpful',
  'mary', 'maryann', 'maryland', 'summary', 'primary', 'library',
  'category', 'secretary', 'necessary', 'dictionary', 'january',
  'february', 'salary', 'scary', 'vary', 'gary', 'carry',
  'johnson', 'johnsonville', 'jackson', 'dickson', 'dixon',
  'sussex', 'middlesex', 'essex', 'massachusetts', 'assassin',
  'assignment', 'assist', 'assistant', 'associate', 'assumption'
];

function normalizeText(text) {
  return text.toLowerCase().trim();
}

function containsOffensiveWord(text) {
  if (!text || typeof text !== 'string') {
    return { isOffensive: false, word: null };
  }
  
  const normalizedText = normalizeText(text);
  
  // Check for false positives first
  if (FALSE_POSITIVES.some(word => normalizedText === word)) {
    return { isOffensive: false, word: null };
  }
  
  // Check exact matches
  for (const word of OFFENSIVE_WORDS) {
    const normalizedWord = normalizeText(word);
    
    // Exact match
    if (normalizedText === normalizedWord) {
      return { isOffensive: true, word: word };
    }
    
    // Word boundary check (word appears as separate word)
    const wordRegex = new RegExp(`\\b${normalizedWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (wordRegex.test(normalizedText)) {
      return { isOffensive: true, word: word };
    }
  }
  
  return { isOffensive: false, word: null };
}

function isReservedName(text) {
  if (!text || typeof text !== 'string') {
    return { isReserved: false, word: null };
  }
  
  const normalizedText = normalizeText(text);
  
  for (const reserved of RESERVED_NAMES) {
    if (normalizedText === reserved) {
      return { isReserved: true, word: reserved };
    }
  }
  
  return { isReserved: false, word: null };
}

export function validateUserInput(text, type = 'general') {
  if (!text || typeof text !== 'string') {
    return { isValid: true, error: null };
  }
  
  // Check for profanity
  const profanityCheck = containsOffensiveWord(text);
  if (profanityCheck.isOffensive) {
    const messages = {
      username: 'This username contains inappropriate content and cannot be used. Please choose a different username.',
      first_name: 'This first name contains inappropriate content and cannot be used. Please use your real first name.',
      last_name: 'This last name contains inappropriate content and cannot be used. Please use your real last name.',
      general: 'This text contains inappropriate content and cannot be used.'
    };
    
    return { 
      isValid: false, 
      error: messages[type] || messages.general,
      word: profanityCheck.word
    };
  }
  
  // Check for reserved names (only for usernames)
  if (type === 'username') {
    const reservedCheck = isReservedName(text);
    if (reservedCheck.isReserved) {
      return { 
        isValid: false, 
        error: `'${text}' is a reserved username and cannot be used.`,
        word: reservedCheck.word
      };
    }
  }
  
  return { isValid: true, error: null };
}

export default validateUserInput;